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

        // Notify original requester
        const addresseeUser = await ctx.prisma.user.findUnique({
          where: { id: input.requesterId },
          select: { name: true, surname: true, username: true }
        });
        const addresseeName = addresseeUser?.name ? `${addresseeUser.name} ${addresseeUser.surname}` : (addresseeUser?.username || "Birisi");
        
        await ctx.prisma.notification.create({
          data: {
            userId: input.addresseeId,
            title: "Yeni Bağlantı",
            message: `${addresseeName} ile artık bağlantısınız!`,
            link: "/network",
          }
        });

        return updatedConnection;
      }

      // Otherwise, just create a new pending request
      const connection = await ctx.prisma.connection.create({
        data: {
          requesterId: input.requesterId,
          addresseeId: input.addresseeId,
          status: "PENDING",
        },
      });

      if (input.requesterId !== input.addresseeId) {
        const requesterUser = await ctx.prisma.user.findUnique({
          where: { id: input.requesterId },
          select: { name: true, surname: true, username: true }
        });
        const requesterName = requesterUser?.name ? `${requesterUser.name} ${requesterUser.surname}` : (requesterUser?.username || "Birisi");
        
        await ctx.prisma.notification.create({
          data: {
            userId: input.addresseeId,
            title: "Yeni Bağlantı İsteği",
            message: `${requesterName} seninle bağlantı kurmak istiyor.`,
            link: "/network",
          }
        });
      }

      return connection;
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

        // Notify requester
        if (input.requesterId !== input.addresseeId) {
          const addresseeUser = await ctx.prisma.user.findUnique({
            where: { id: input.addresseeId },
            select: { name: true, surname: true, username: true }
          });
          const addresseeName = addresseeUser?.name ? `${addresseeUser.name} ${addresseeUser.surname}` : (addresseeUser?.username || "Birisi");

          await ctx.prisma.notification.create({
            data: {
              userId: input.requesterId,
              title: "Bağlantı İsteği Kabul Edildi",
              message: `${addresseeName} bağlantı isteğini kabul etti.`,
              link: "/network",
            }
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
          requester: { select: { id: true, name: true, surname: true, image: true } },
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
      const followResult = await ctx.prisma.follows.create({
        data: { 
          followerId: input.followerId, 
          followingId: input.followingId,
          isAccepted: targetProfile?.isPrivate ? false : true
        },
      });

      if (input.followerId !== input.followingId) {
        const followerUser = await ctx.prisma.user.findUnique({
          where: { id: input.followerId },
          select: { name: true, surname: true, username: true }
        });
        const followerName = followerUser?.name ? `${followerUser.name} ${followerUser.surname}` : (followerUser?.username || "Birisi");

        await ctx.prisma.notification.create({
          data: {
            userId: input.followingId,
            title: targetProfile?.isPrivate ? "Yeni Takip İsteği" : "Yeni Takipçi",
            message: targetProfile?.isPrivate 
              ? `${followerName} seni takip etmek istiyor.` 
              : `${followerName} seni takip etmeye başladı.`,
            link: `/profile/${input.followerId}`,
          }
        });
      }

      return followResult;
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
