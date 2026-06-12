import { z } from "zod";
import { createTRPCRouter, protectedProcedure } from "../trpc";

export const notificationRouter = createTRPCRouter({
  // Kullanıcının kendi bildirimlerini çekmesi
  getMyNotifications: protectedProcedure.query(({ ctx }) => {
    return ctx.prisma.notification.findMany({
      where: { userId: ctx.session.user.id },
      orderBy: { createdAt: "desc" },
    });
  }),

  // Okunmamış bildirim sayısını al
  getUnreadCount: protectedProcedure.query(({ ctx }) => {
    return ctx.prisma.notification.count({
      where: { userId: ctx.session.user.id, isRead: false },
    });
  }),

  // Bir bildirimi okundu olarak işaretle
  markAsRead: protectedProcedure
    .input(z.object({ id: z.string() }))
    .mutation(({ ctx, input }) => {
      return ctx.prisma.notification.update({
        where: { id: input.id },
        data: { isRead: true },
      });
    }),

  // Tüm bildirimleri okundu olarak işaretle
  markAllAsRead: protectedProcedure.mutation(({ ctx }) => {
    return ctx.prisma.notification.updateMany({
      where: { userId: ctx.session.user.id, isRead: false },
      data: { isRead: true },
    });
  }),
});
