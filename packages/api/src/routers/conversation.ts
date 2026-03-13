import { z } from "zod"
import { createTRPCRouter, publicProcedure } from "../trpc"

export const conversationRouter = createTRPCRouter({
  // Yeni konuşma başlat (1'e1 veya grup)
  create: publicProcedure
    .input(
      z.object({
        participantIds: z.array(z.string()).min(2),
        isGroup: z.boolean().default(false),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const conversation = await ctx.prisma.conversation.create({
        data: {
          isGroup: input.isGroup,
          participants: {
            create: input.participantIds.map((userId) => ({ userId })),
          },
        },
      })
      return conversation
    }),

  // Kullanıcının konuşmalarını listele
  list: publicProcedure
    .input(z.object({ userId: z.string() }))
    .query(({ ctx, input }) =>
      ctx.prisma.conversation.findMany({
        where: {
          participants: { some: { userId: input.userId } },
        },
        include: {
          participants: {
            include: {
              user: { select: { id: true, name: true, surname: true, image: true } },
            },
          },
          messages: {
            orderBy: { createdAt: "desc" },
            take: 1,
          },
        },
        orderBy: { createdAt: "desc" },
      })
    ),

  // Konuşmanın mesajlarını getir (sayfalı)
  getMessages: publicProcedure
    .input(
      z.object({
        conversationId: z.string(),
        cursor: z.string().optional(),
        limit: z.number().min(1).max(100).default(50),
      })
    )
    .query(async ({ ctx, input }) => {
      const items = await ctx.prisma.message.findMany({
        where: { conversationId: input.conversationId },
        orderBy: { createdAt: "desc" },
        take: input.limit + 1,
        cursor: input.cursor ? { id: input.cursor } : undefined,
        include: {
          sender: { select: { id: true, name: true, surname: true, image: true } },
        },
      })
      const nextCursor = items.length > input.limit ? items.pop()!.id : undefined
      return { items: items.reverse(), nextCursor }
    }),

  // Mesaj gönder
  sendMessage: publicProcedure
    .input(
      z.object({
        conversationId: z.string(),
        senderId: z.string(),
        content: z.string().min(1),
      })
    )
    .mutation(({ ctx, input }) =>
      ctx.prisma.message.create({
        data: input,
        include: {
          sender: { select: { id: true, name: true, surname: true, image: true } },
        },
      })
    ),

  // Mesajı sil (soft delete)
  deleteMessage: publicProcedure
    .input(z.object({ messageId: z.string() }))
    .mutation(({ ctx, input }) =>
      ctx.prisma.message.update({
        where: { id: input.messageId },
        data: { isDeleted: true, content: "Bu mesaj silindi." },
      })
    ),
})
