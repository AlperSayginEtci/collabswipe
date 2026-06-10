import { z } from "zod"
import { createTRPCRouter, publicProcedure } from "../trpc"

export const connectionRouter = createTRPCRouter({
  sendRequest: publicProcedure
    .input(
      z.object({
        requesterId: z.string(),
        addresseeId: z.string(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      // Check if the other person already sent a request to this user
      const existingRequest = await ctx.prisma.connection.findUnique({
        where: {
          requesterId_addresseeId: {
            requesterId: input.addresseeId,
            addresseeId: input.requesterId,
          },
        },
      });

      if (existingRequest && existingRequest.status === "PENDING") {
        // Auto-match! Accept the existing request
        const updatedConnection = await ctx.prisma.connection.update({
          where: {
            requesterId_addresseeId: {
              requesterId: input.addresseeId,
              addresseeId: input.requesterId,
            },
          },
          data: { status: "ACCEPTED" },
        });

        // Create a conversation for the new match
        await ctx.prisma.conversation.create({
          data: {
            isGroup: false,
            participants: {
              create: [
                { userId: input.requesterId },
                { userId: input.addresseeId },
              ],
            },
          },
        });

        return updatedConnection;
      }

      // Otherwise, just create a new pending request
      return ctx.prisma.connection.create({
        data: {
          requesterId: input.requesterId,
          addresseeId: input.addresseeId,
          status: "PENDING",
        },
      });
    }),

  // Profili reddet (Bir daha keşfet kısmında çıkmasın diye veritabanında REJECTED olarak kaydet)
  rejectProfile: publicProcedure
    .input(
      z.object({
        requesterId: z.string(),
        addresseeId: z.string(),
      })
    )
    .mutation(({ ctx, input }) =>
      ctx.prisma.connection.create({
        data: {
          requesterId: input.requesterId,
          addresseeId: input.addresseeId,
          status: "REJECTED",
        },
      })
    ),

  // İsteği yanıtla (kabul / reddet)
  undoSwipe: publicProcedure
    .input(
      z.object({
        requesterId: z.string(),
        addresseeId: z.string(),
      })
    )
    .mutation(({ ctx, input }) =>
      ctx.prisma.connection.deleteMany({
        where: {
          requesterId: input.requesterId,
          addresseeId: input.addresseeId,
          status: { in: ["PENDING", "REJECTED"] },
        },
      })
    ),

  respond: publicProcedure
    .input(
      z.object({
        requesterId: z.string(),
        addresseeId: z.string(),
        status: z.enum(["ACCEPTED", "REJECTED"]),
      })
    )
    .mutation(async ({ ctx, input }) => {
      // First update the connection status
      const updatedConnection = await ctx.prisma.connection.update({
        where: {
          requesterId_addresseeId: {
            requesterId: input.requesterId,
            addresseeId: input.addresseeId,
          },
        },
        data: { status: input.status },
      });

      // If accepted, check if a conversation already exists, if not, create one
      if (input.status === "ACCEPTED") {
        // Find existing conversation between these two
        const existingConvs = await ctx.prisma.conversation.findMany({
          where: {
            isGroup: false,
            AND: [
              { participants: { some: { userId: input.requesterId } } },
              { participants: { some: { userId: input.addresseeId } } },
            ],
          },
        });

        if (existingConvs.length === 0) {
          // Create new conversation
          await ctx.prisma.conversation.create({
            data: {
              isGroup: false,
              participants: {
                create: [
                  { userId: input.requesterId },
                  { userId: input.addresseeId },
                ],
              },
            },
          });
        }
      }

      return updatedConnection;
    }),

  // Kullanıcının bağlantılarını listele
  getMyConnections: publicProcedure
    .input(z.object({ userId: z.string() }))
    .query(({ ctx, input }) =>
      ctx.prisma.connection.findMany({
        where: {
          OR: [
            { requesterId: input.userId, status: "ACCEPTED" },
            { addresseeId: input.userId, status: "ACCEPTED" },
          ],
        },
        include: {
          requester: { select: { id: true, name: true, surname: true, image: true } },
          addressee: { select: { id: true, name: true, surname: true, image: true } },
        },
      })
    ),

  // Bekleyen gelen istekler
  getPendingRequests: publicProcedure
    .input(z.object({ userId: z.string() }))
    .query(({ ctx, input }) =>
      ctx.prisma.connection.findMany({
        where: { addresseeId: input.userId, status: "PENDING" },
        include: {
          requester: { select: { id: true, name: true, surname: true, image: true, profile: { select: { location: true } } } },
        },
      })
    ),

  // Gönderilen istekler
  getSentRequests: publicProcedure
    .input(z.object({ userId: z.string() }))
    .query(({ ctx, input }) =>
      ctx.prisma.connection.findMany({
        where: { requesterId: input.userId, status: "PENDING" },
        include: {
          addressee: { select: { id: true, name: true, surname: true, image: true, profile: { select: { location: true } } } },
        },
      })
    ),

  // Takip et
  follow: publicProcedure
    .input(z.object({ followerId: z.string(), followingId: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const targetProfile = await ctx.prisma.profile.findUnique({
        where: { userId: input.followingId },
        select: { isPrivate: true }
      });
      return ctx.prisma.follows.create({
        data: { 
          followerId: input.followerId, 
          followingId: input.followingId,
          isAccepted: targetProfile?.isPrivate ? false : true
        },
      });
    }),

  // Takibi bırak
  unfollow: publicProcedure
    .input(z.object({ followerId: z.string(), followingId: z.string() }))
    .mutation(({ ctx, input }) =>
      ctx.prisma.follows.delete({
        where: {
          followerId_followingId: {
            followerId: input.followerId,
            followingId: input.followingId,
          },
        },
      })
    ),

  // Takipçi / takip edilenleri getir
  getFollowers: publicProcedure
    .input(z.object({ userId: z.string() }))
    .query(({ ctx, input }) =>
      ctx.prisma.follows.findMany({
        where: { followingId: input.userId, isAccepted: true },
        include: {
          follower: { select: { id: true, name: true, surname: true, image: true, username: true } },
        },
      })
    ),

    getFollowing: publicProcedure
    .input(z.object({ userId: z.string() }))
    .query(({ ctx, input }) =>
      ctx.prisma.follows.findMany({
        where: { followerId: input.userId, isAccepted: true },
        include: {
          following: { select: { id: true, name: true, surname: true, image: true, username: true } },
        },
      })
    ),

  // Bekleyen takip istekleri (Gelen)
  getFollowRequests: publicProcedure
    .input(z.object({ userId: z.string() }))
    .query(({ ctx, input }) =>
      ctx.prisma.follows.findMany({
        where: { followingId: input.userId, isAccepted: false },
        include: {
          follower: { select: { id: true, name: true, surname: true, image: true, username: true } },
        },
      })
    ),

  acceptFollowRequest: publicProcedure
    .input(z.object({ followerId: z.string(), followingId: z.string() }))
    .mutation(({ ctx, input }) =>
      ctx.prisma.follows.update({
        where: {
          followerId_followingId: {
            followerId: input.followerId,
            followingId: input.followingId,
          },
        },
        data: { isAccepted: true }
      })
    ),

  rejectFollowRequest: publicProcedure
    .input(z.object({ followerId: z.string(), followingId: z.string() }))
    .mutation(({ ctx, input }) =>
      ctx.prisma.follows.delete({
        where: {
          followerId_followingId: {
            followerId: input.followerId,
            followingId: input.followingId,
          },
        },
      })
    ),

  getSuggestions: publicProcedure
    .input(z.object({ currentUserId: z.string().optional() }))
    .query(async ({ ctx, input }) => {
      // Basic suggestion logic: return 5 newest users excluding current
      const users = await ctx.prisma.user.findMany({
        where: input.currentUserId ? { 
          id: { not: input.currentUserId },
          followers: { none: { followerId: input.currentUserId } },
          receivedConnections: { none: { requesterId: input.currentUserId } },
          sentConnections: { none: { addresseeId: input.currentUserId } }
        } : undefined,
        take: 5,
        orderBy: { createdAt: "desc" },
        select: { id: true, name: true, surname: true, image: true, role: true, sector: true, profile: { select: { bio: true } } }
      });
      return users;
    }),

  status: publicProcedure
    .input(z.object({ loggedInUserId: z.string(), targetUserId: z.string() }))
    .query(async ({ ctx, input }) => {
      const follow = await ctx.prisma.follows.findUnique({
        where: { followerId_followingId: { followerId: input.loggedInUserId, followingId: input.targetUserId } }
      });
      
      const connection = await ctx.prisma.connection.findFirst({
        where: {
          OR: [
            { requesterId: input.loggedInUserId, addresseeId: input.targetUserId },
            { requesterId: input.targetUserId, addresseeId: input.loggedInUserId }
          ]
        }
      });

      return {
        isFollowing: follow?.isAccepted === true,
        isFollowPending: follow?.isAccepted === false,
        connectionStatus: connection?.status || null,
        isRequester: connection?.requesterId === input.loggedInUserId
      };
    }),
})
