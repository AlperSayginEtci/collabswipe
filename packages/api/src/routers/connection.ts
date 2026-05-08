import { z } from "zod"
import { createTRPCRouter, publicProcedure } from "../trpc"

export const connectionRouter = createTRPCRouter({
  // Bağlantı isteği gönder
  sendRequest: publicProcedure
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
          status: "PENDING",
        },
      })
    ),

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
    .mutation(({ ctx, input }) =>
      ctx.prisma.connection.update({
        where: {
          requesterId_addresseeId: {
            requesterId: input.requesterId,
            addresseeId: input.addresseeId,
          },
        },
        data: { status: input.status },
      })
    ),

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
    .mutation(({ ctx, input }) =>
      ctx.prisma.follows.create({
        data: { followerId: input.followerId, followingId: input.followingId },
      })
    ),

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
        where: { followingId: input.userId },
        include: {
          follower: { select: { id: true, name: true, surname: true, image: true } },
        },
      })
    ),

  getFollowing: publicProcedure
    .input(z.object({ userId: z.string() }))
    .query(({ ctx, input }) =>
      ctx.prisma.follows.findMany({
        where: { followerId: input.userId },
        include: {
          following: { select: { id: true, name: true, surname: true, image: true } },
        },
      })
    ),
})
