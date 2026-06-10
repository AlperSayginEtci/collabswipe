import { z } from "zod";
import { createTRPCRouter, publicProcedure } from "../trpc";
import { observable } from "@trpc/server/observable";
import { ee } from "../events";
import type { Message } from "@prisma/client";

export const chatRouter = createTRPCRouter({
  // Fetch paginated conversations for a user
  getConversations: publicProcedure
    .input(
      z.object({
        userId: z.string(),
        limit: z.number().min(1).max(50).default(20),
        cursor: z.string().nullish(), // cursor for pagination
      })
    )
    .query(async ({ ctx, input }) => {
      const items = await ctx.prisma.conversation.findMany({
        where: {
          participants: {
            some: { userId: input.userId },
          },
        },
        take: input.limit + 1, // get an extra item to check for next page
        cursor: input.cursor ? { id: input.cursor } : undefined,
        orderBy: {
          lastMessageAt: "desc", // Sort by most recent activity
        },
        include: {
          participants: {
            include: {
              user: {
                select: {
                  id: true,
                  name: true,
                  surname: true,
                  image: true,
                },
              },
            },
          },
          messages: {
            orderBy: { createdAt: "desc" },
            take: 1, // Only get the last message for preview
          },
        },
      });

      let nextCursor: typeof input.cursor | undefined = undefined;
      if (items.length > input.limit) {
        const nextItem = items.pop();
        nextCursor = nextItem!.id;
      }

      // Format response to easily identify "other user" and calculate unread count
      const formatted = items.map((conv) => {
        const otherParticipant = conv.participants.find(
          (p) => p.userId !== input.userId
        );
        const me = conv.participants.find((p) => p.userId === input.userId);
        const lastMessage = conv.messages[0];

        // Unread count logic could be complex. For a simple implementation:
        // if there's a last message and its createdAt > me.lastReadAt, count = 1.
        // For accurate count, we'd do a separate count query or aggregate.
        // We'll pass a boolean or basic calculation for now.
        const hasUnread = lastMessage 
          && (!me?.lastReadAt || lastMessage.createdAt > me.lastReadAt) 
          && lastMessage.senderId !== input.userId;

        return {
          ...conv,
          otherUser: otherParticipant?.user,
          lastMessage,
          hasUnread,
        };
      });

      return {
        items: formatted,
        nextCursor,
      };
    }),

  // Fetch paginated messages for a specific conversation
  getMessages: publicProcedure
    .input(
      z.object({
        conversationId: z.string(),
        limit: z.number().min(1).max(100).default(50),
        cursor: z.string().nullish(),
      })
    )
    .query(async ({ ctx, input }) => {
      const items = await ctx.prisma.message.findMany({
        where: {
          conversationId: input.conversationId,
        },
        take: input.limit + 1,
        cursor: input.cursor ? { id: input.cursor } : undefined,
        orderBy: {
          createdAt: "desc", // Latest messages first
        },
        include: {
          reactions: true,
        },
      });

      let nextCursor: typeof input.cursor | undefined = undefined;
      if (items.length > input.limit) {
        const nextItem = items.pop();
        nextCursor = nextItem!.id;
      }

      return {
        items,
        nextCursor,
      };
    }),

  // Send a new message
  sendMessage: publicProcedure
    .input(
      z.object({
        conversationId: z.string(),
        senderId: z.string(),
        content: z.string().min(1),
      })
    )
    .mutation(async ({ ctx, input }) => {
      // Create message and update conversation's lastMessageAt in a transaction
      const [message] = await ctx.prisma.$transaction([
        ctx.prisma.message.create({
          data: {
            conversationId: input.conversationId,
            senderId: input.senderId,
            content: input.content,
          },
          include: {
            reactions: true,
          }
        }),
        ctx.prisma.conversation.update({
          where: { id: input.conversationId },
          data: {
            lastMessageAt: new Date(),
            updatedAt: new Date(),
          },
        }),
      ]);

      // Emit event for real-time subscribers
      ee.emit("new_message", message);

      return message;
    }),

  // Edit a message
  editMessage: publicProcedure
    .input(z.object({
      messageId: z.string(),
      userId: z.string(),
      content: z.string().min(1),
    }))
    .mutation(async ({ ctx, input }) => {
      const existing = await ctx.prisma.message.findUnique({ where: { id: input.messageId } });
      if (!existing || existing.senderId !== input.userId) throw new Error("Unauthorized");

      const message = await ctx.prisma.message.update({
        where: { id: input.messageId },
        data: { content: input.content, isEdited: true },
        include: { reactions: true }
      });
      ee.emit("message_updated", message);
      return message;
    }),

  // Delete a message (soft delete)
  deleteMessage: publicProcedure
    .input(z.object({
      messageId: z.string(),
      userId: z.string(),
    }))
    .mutation(async ({ ctx, input }) => {
      const existing = await ctx.prisma.message.findUnique({ where: { id: input.messageId } });
      if (!existing || existing.senderId !== input.userId) throw new Error("Unauthorized");

      const message = await ctx.prisma.message.update({
        where: { id: input.messageId },
        data: { isDeleted: true },
        include: { reactions: true }
      });
      ee.emit("message_updated", message);
      return message;
    }),

  // React to a message
  reactMessage: publicProcedure
    .input(z.object({
      messageId: z.string(),
      userId: z.string(),
      emoji: z.string(),
    }))
    .mutation(async ({ ctx, input }) => {
      const existing = await ctx.prisma.messageReaction.findUnique({
        where: {
          messageId_userId_emoji: {
            messageId: input.messageId,
            userId: input.userId,
            emoji: input.emoji,
          }
        }
      });

      if (existing) {
        await ctx.prisma.messageReaction.delete({
          where: {
            messageId_userId_emoji: {
              messageId: input.messageId,
              userId: input.userId,
              emoji: input.emoji,
            }
          }
        });
      } else {
        await ctx.prisma.messageReaction.create({
          data: {
            messageId: input.messageId,
            userId: input.userId,
            emoji: input.emoji,
          }
        });
      }

      const message = await ctx.prisma.message.findUnique({
        where: { id: input.messageId },
        include: { reactions: true }
      });

      ee.emit("message_updated", message);
      return message;
    }),

  // Mark conversation as read
  markAsRead: publicProcedure
    .input(
      z.object({
        conversationId: z.string(),
        userId: z.string(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const participant = await ctx.prisma.participant.update({
        where: {
          conversationId_userId: {
            conversationId: input.conversationId,
            userId: input.userId,
          },
        },
        data: {
          lastReadAt: new Date(),
        },
      });

      ee.emit("message_read", {
        conversationId: input.conversationId,
        userId: input.userId,
        lastReadAt: participant.lastReadAt!,
      });

      return participant;
    }),

  // Emit typing indicator
  typing: publicProcedure
    .input(
      z.object({
        conversationId: z.string(),
        userId: z.string(),
        isTyping: z.boolean(),
      })
    )
    .mutation(({ input }) => {
      ee.emit("user_typing", input);
      return true;
    }),

  // WS SUBSCRIPTIONS
  onMessage: publicProcedure
    .input(z.object({ userId: z.string() }))
    .subscription(async ({ ctx, input }) => {
      return observable<Message>((emit) => {
        // Find which conversations the user belongs to so we only send relevant messages
        const getParticipantConversations = async () => {
          const parts = await ctx.prisma.participant.findMany({
            where: { userId: input.userId },
            select: { conversationId: true },
          });
          return new Set(parts.map((p) => p.conversationId));
        };

        // Cache the set of conversation IDs
        let conversationIds: Set<string>;
        getParticipantConversations().then((ids) => {
          conversationIds = ids;
        });

        const onMessage = (msg: Message) => {
          // Check if this message belongs to a conversation the user is in
          // (Wait for conversationIds to load if not ready)
          if (conversationIds && conversationIds.has(msg.conversationId)) {
            emit.next(msg);
          }
        };

        ee.on("new_message", onMessage);

        // Cleanup
        return () => {
          ee.off("new_message", onMessage);
        };
      });
    }),

  onMessageUpdate: publicProcedure
    .input(z.object({ userId: z.string() }))
    .subscription(async ({ ctx, input }) => {
      return observable<any>((emit) => {
        const getParticipantConversations = async () => {
          const parts = await ctx.prisma.participant.findMany({
            where: { userId: input.userId },
            select: { conversationId: true },
          });
          return new Set(parts.map((p) => p.conversationId));
        };

        let conversationIds: Set<string>;
        getParticipantConversations().then((ids) => {
          conversationIds = ids;
        });

        const onUpdate = (msg: any) => {
          if (conversationIds && conversationIds.has(msg.conversationId)) {
            emit.next(msg);
          }
        };

        ee.on("message_updated", onUpdate);

        return () => {
          ee.off("message_updated", onUpdate);
        };
      });
    }),

  onTyping: publicProcedure
    .input(z.object({ conversationId: z.string() }))
    .subscription(({ input }) => {
      return observable<{ userId: string; isTyping: boolean }>((emit) => {
        const onTyping = (data: { conversationId: string; userId: string; isTyping: boolean }) => {
          if (data.conversationId === input.conversationId) {
            emit.next({ userId: data.userId, isTyping: data.isTyping });
          }
        };

        ee.on("user_typing", onTyping);

        return () => {
          ee.off("user_typing", onTyping);
        };
      });
    }),
});
