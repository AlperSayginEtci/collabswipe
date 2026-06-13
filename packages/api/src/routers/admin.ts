import { z } from "zod"
import { TRPCError } from "@trpc/server"
import { createTRPCRouter, adminProcedure } from "../trpc"

export const adminRouter = createTRPCRouter({
  // Tüm kullanıcıları getir
  getUsers: adminProcedure.query(({ ctx }) =>
    ctx.prisma.user.findMany({
      orderBy: { createdAt: "desc" },
      select: { id: true, name: true, surname: true, email: true, role: true, banned: true, banReason: true }
    })
  ),

  // Kullanıcıyı banla
  banUser: adminProcedure
    .input(
      z.object({
        userId: z.string(),
        reason: z.string().min(3),
        banExpires: z.coerce.date().optional(), // undefined = kalıcı
      })
    )
    .mutation(async ({ ctx, input }) => {
      if (ctx.session.user.id === input.userId) {
        throw new TRPCError({ code: "BAD_REQUEST", message: "Kendinizi banlayamazsınız." });
      }
      
      const targetUser = await ctx.prisma.user.findUnique({ where: { id: input.userId } });
      if (targetUser?.role === "admin") {
        throw new TRPCError({ code: "FORBIDDEN", message: "Diğer yöneticileri banlayamazsınız." });
      }

      return ctx.prisma.user.update({
        where: { id: input.userId },
        data: {
          banned: true,
          banReason: input.reason,
          banExpires: input.banExpires ?? null,
        },
      });
    }),

  // Ban kaldır
  unbanUser: adminProcedure
    .input(z.object({ userId: z.string() }))
    .mutation(({ ctx, input }) =>
      ctx.prisma.user.update({
        where: { id: input.userId },
        data: { banned: false, banReason: null, banExpires: null },
      })
    ),

  // Gönderiyi banla
  banPost: adminProcedure
    .input(z.object({ postId: z.string() }))
    .mutation(({ ctx, input }) =>
      ctx.prisma.post.update({
        where: { id: input.postId },
        data: { isBanned: true },
      })
    ),

  // Gönderi banını kaldır
  unbanPost: adminProcedure
    .input(z.object({ postId: z.string() }))
    .mutation(({ ctx, input }) =>
      ctx.prisma.post.update({
        where: { id: input.postId },
        data: { isBanned: false },
      })
    ),

  // --- GELİŞMİŞ MODERASYON ---

  // 1. Strike (Uyarı) Verme
  issueStrike: adminProcedure
    .input(z.object({ userId: z.string(), reason: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const user = await ctx.prisma.user.update({
        where: { id: input.userId },
        data: { strikeCount: { increment: 1 } },
      });

      const message = `Topluluk kurallarını ihlal ettiğiniz için bir uyarı aldınız. Sebep: ${input.reason}. (Mevcut Uyarı Sayısı: ${user.strikeCount}/3)`;
      
      await ctx.prisma.notification.create({
        data: {
          userId: input.userId,
          title: 'Hesap Uyarısı (Strike)',
          message,
        }
      });

      if (user.strikeCount >= 3) {
        await ctx.prisma.user.update({
          where: { id: input.userId },
          data: { banned: true, banReason: '3 Uyarı (Strike) sınırına ulaşıldı.' }
        });
        await ctx.prisma.notification.create({
          data: {
            userId: input.userId,
            title: 'Hesabınız Kapatıldı',
            message: '3 uyarı sınırını aştığınız için hesabınız kalıcı olarak kapatılmıştır.',
          }
        });
      }
      return user;
    }),

  // 2. Gönderiyi Karantinaya Alma
  quarantinePost: adminProcedure
    .input(z.object({ postId: z.string(), reason: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const post = await ctx.prisma.post.update({
        where: { id: input.postId },
        data: { isQuarantined: true },
      });

      await ctx.prisma.notification.create({
        data: {
          userId: post.authorId,
          title: 'Gönderi İnceleniyor',
          message: `Bir gönderiniz şikayetler üzerine inceleme (karantina) altına alınmıştır. Sebep: ${input.reason}`,
          link: `/posts/${post.id}`
        }
      });
      return post;
    }),

  // 3. Gönderi Düzenleme Talebi
  requestPostEdit: adminProcedure
    .input(z.object({ postId: z.string(), reason: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const post = await ctx.prisma.post.update({
        where: { id: input.postId },
        data: { 
          editRequestedAt: new Date(),
          editRequestedBy: ctx.session.user.id
        },
      });

      await ctx.prisma.notification.create({
        data: {
          userId: post.authorId,
          title: 'Gönderi Düzenleme Talebi',
          message: `Bir gönderinizin 24 saat içinde düzenlenmesi gerekmektedir, aksi takdirde kaldırılacaktır. Sebep: ${input.reason}`,
          link: `/posts/${post.id}`
        }
      });
      return post;
    }),

  // 4. Kullanıcıyı Susturma (Mute)
  muteUser: adminProcedure
    .input(z.object({ userId: z.string(), durationDays: z.number(), reason: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const expires = new Date();
      expires.setDate(expires.getDate() + input.durationDays);

      await ctx.prisma.user.update({
        where: { id: input.userId },
        data: { muteExpires: expires },
      });

      await ctx.prisma.notification.create({
        data: {
          userId: input.userId,
          title: 'Etkileşim Kısıtlaması (Mute)',
          message: `Hesabınız ${input.durationDays} gün boyunca gönderi/yorum paylaşımına kapatılmıştır. Sebep: ${input.reason}`,
        }
      });
    }),

  // 5. Shadowban
  toggleShadowban: adminProcedure
    .input(z.object({ userId: z.string(), isShadowbanned: z.boolean() }))
    .mutation(async ({ ctx, input }) => {
      return ctx.prisma.user.update({
        where: { id: input.userId },
        data: { isShadowbanned: input.isShadowbanned },
      });
    }),

  // 6. Şikayet Edeni Uyarma
  warnReporter: adminProcedure
    .input(z.object({ reporterId: z.string() }))
    .mutation(async ({ ctx, input }) => {
      await ctx.prisma.notification.create({
        data: {
          userId: input.reporterId,
          title: 'Asılsız Şikayet Uyarısı',
          message: 'Yaptığınız son şikayet asılsız bulunmuştur. Lütfen topluluk kurallarını ihlal etmeyen içerikleri şikayet etmeyiniz.',
        }
      });
    }),

  // --- /GELİŞMİŞ MODERASYON ---

  // Duyuru oluştur
  createAnnouncement: adminProcedure
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
  getAnnouncements: adminProcedure.query(({ ctx }) =>
    ctx.prisma.announcement.findMany({
      where: { isActive: true },
      orderBy: { createdAt: "desc" },
      include: {
        admin: { select: { id: true, name: true, image: true } },
      },
    })
  ),

  // Duyuruyu aktif/pasif yap
  toggleAnnouncement: adminProcedure
    .input(z.object({ announcementId: z.string(), isActive: z.boolean() }))
    .mutation(({ ctx, input }) =>
      ctx.prisma.announcement.update({
        where: { id: input.announcementId },
        data: { isActive: input.isActive },
      })
    ),

  // Raporları getir
  getReports: adminProcedure.query(async ({ ctx }) => {
    const reports = await ctx.prisma.report.findMany({
      orderBy: { createdAt: "desc" },
      include: {
        reporter: { select: { id: true, name: true, surname: true, image: true } }
      }
    });

    return Promise.all(
      reports.map(async (report) => {
        let isTargetBanned = false;
        let targetUserId = null;
        
        if (report.targetType === 'POST') {
          const post = await ctx.prisma.post.findUnique({ where: { id: report.targetId }, select: { isBanned: true, authorId: true } });
          isTargetBanned = post?.isBanned ?? true; // if null, it's deleted/missing
          targetUserId = post?.authorId;
        } else if (report.targetType === 'USER') {
          const user = await ctx.prisma.user.findUnique({ where: { id: report.targetId }, select: { banned: true } });
          isTargetBanned = user?.banned ?? true;
          targetUserId = report.targetId;
        }

        return { ...report, isTargetBanned, targetUserId };
      })
    );
  }),

  // Rapor durumunu güncelle
  updateReportStatus: adminProcedure
    .input(z.object({ reportId: z.string(), status: z.enum(["PENDING", "REVIEWED", "RESOLVED", "DISMISSED"]) }))
    .mutation(({ ctx, input }) =>
      ctx.prisma.report.update({
        where: { id: input.reportId },
        data: { status: input.status },
      })
    ),
})
