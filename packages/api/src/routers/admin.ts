import { z } from "zod"
import { createTRPCRouter, publicProcedure } from "../trpc"

export const adminRouter = createTRPCRouter({
  // Kullanıcıyı banla
  banUser: publicProcedure
    .input(
      z.object({
        userId: z.string(),
        reason: z.string().min(3),
        banExpires: z.coerce.date().optional(), // undefined = kalıcı
      })
    )
    .mutation(({ ctx, input }) =>
      ctx.prisma.user.update({
        where: { id: input.userId },
        data: {
          banned: true,
          banReason: input.reason,
          banExpires: input.banExpires ?? null,
        },
      })
    ),

  // Ban kaldır
  unbanUser: publicProcedure
    .input(z.object({ userId: z.string() }))
    .mutation(({ ctx, input }) =>
      ctx.prisma.user.update({
        where: { id: input.userId },
        data: { banned: false, banReason: null, banExpires: null },
      })
    ),

  // Gönderiyi banla
  banPost: publicProcedure
    .input(z.object({ postId: z.string() }))
    .mutation(({ ctx, input }) =>
      ctx.prisma.post.update({
        where: { id: input.postId },
        data: { isBanned: true },
      })
    ),

  // Duyuru oluştur
  createAnnouncement: publicProcedure
    .input(
      z.object({
        adminId: z.string(),
        title: z.string().min(3),
        content: z.string().min(5),
      })
    )
    .mutation(({ ctx, input }) =>
      ctx.prisma.announcement.create({ data: input })
    ),

  // Aktif duyuruları getir
  getAnnouncements: publicProcedure.query(({ ctx }) =>
    ctx.prisma.announcement.findMany({
      where: { isActive: true },
      orderBy: { createdAt: "desc" },
      include: {
        admin: { select: { id: true, name: true, image: true } },
      },
    })
  ),

  // Duyuruyu aktif/pasif yap
  toggleAnnouncement: publicProcedure
    .input(z.object({ announcementId: z.string(), isActive: z.boolean() }))
    .mutation(({ ctx, input }) =>
      ctx.prisma.announcement.update({
        where: { id: input.announcementId },
        data: { isActive: input.isActive },
      })
    ),
})
