import { z } from "zod"
import { createTRPCRouter, publicProcedure, protectedProcedure } from "../trpc"
import { auth } from "@collabswipe/auth"

export const userRouter = createTRPCRouter({
  // Kullanıcıyı ID ile getir
  getById: publicProcedure
    .input(z.object({ id: z.string() }))
    .query(({ ctx, input }) =>
      ctx.prisma.user.findUnique({
        where: { id: input.id },
        select: {
          id: true,
          name: true,
          surname: true,
          email: true,
          image: true,
          role: true,
          createdAt: true,
          profile: {
            select: {
              bio: true,
              location: true,
              website: true,
              banner: true,
            },
          },
        },
      })
    ),

  // Kullanıcı araması (isim/email)
  search: publicProcedure
    .input(z.object({ query: z.string().min(1) }))
    .query(({ ctx, input }) =>
      ctx.prisma.user.findMany({
        where: {
          OR: [
            { name: { contains: input.query, mode: "insensitive" } },
            { surname: { contains: input.query, mode: "insensitive" } },
            { email: { contains: input.query, mode: "insensitive" } },
          ],
        },
        select: {
          id: true,
          name: true,
          surname: true,
          image: true,
        },
        take: 20,
      })
    ),

  // Kaydırma (Swipe) için keşfedilebilir kullanıcıları getir
  getDiscoverable: publicProcedure
    .input(z.object({ userId: z.string() }))
    .query(async ({ ctx, input }) => {
      // Mevcut kullanıcının zaten etkileşime girdiği (ACCEPTED, PENDING, REJECTED) tüm bağlantıları bul
      const existingConnections = await ctx.prisma.connection.findMany({
        where: {
          requesterId: input.userId,
        },
        select: {
          addresseeId: true,
        },
      });

      const excludedIds = [
        input.userId,
        ...existingConnections.map((c) => c.addresseeId),
      ];

      return ctx.prisma.user.findMany({
        where: {
          id: { notIn: excludedIds },
          // Sadece employer olmayanları veya herkesi getirebiliriz, şimdilik employer hariç herkes
          email: { not: "employer@collabswipe.com" },
        },
        select: {
          id: true,
          name: true,
          surname: true,
          image: true,
          email: true,
          profile: {
            select: {
              bio: true,
              location: true,
              banner: true,
              skills: {
                select: {
                  skill: {
                    select: {
                      skillName: true,
                    },
                  },
                },
              },
            },
          },
        },
        take: 10,
      });
    }),

  // Giriş Yap (Better Auth e-posta ve şifre ile giriş)
  login: publicProcedure
    .input(
      z.object({
        email: z.string().email(),
        password: z.string(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      try {
        const response = await auth.api.signInEmail({
          body: {
            email: input.email,
            password: input.password,
          },
        });

        const user = await ctx.prisma.user.findUnique({
          where: { id: response.user.id },
          include: {
            profile: true,
          },
        });

        if (!user) {
          throw new Error("Kullanıcı kaydı bulunamadı.");
        }

        return user;
      } catch (err: any) {
        console.error("Login error:", err);
        throw new Error(err.message || "Giriş yapılamadı. Bilgilerinizi kontrol edin.");
      }
    }),

  // Kayıt Ol (Better Auth e-posta, şifre, ad, soyad ve rol ile kullanıcı ve ilişkili Profil kaydını oluştur)
  register: publicProcedure
    .input(
      z.object({
        email: z.string().email(),
        password: z.string().min(6),
        name: z.string(),
        surname: z.string(),
        role: z.string().default("user"),
      })
    )
    .mutation(async ({ ctx, input }) => {
      try {
        const response = await auth.api.signUpEmail({
          body: {
            email: input.email,
            password: input.password,
            name: input.name,
            surname: input.surname,
          },
        });

        const updatedUser = await ctx.prisma.user.update({
          where: { id: response.user.id },
          data: {
            role: input.role,
            profile: {
              upsert: {
                create: {
                  profileName: `${input.name} ${input.surname}`,
                  bio: "Merhaba, ben CollabSwipe topluluğuna yeni katıldım!",
                  location: "Turkey",
                },
                update: {},
              },
            },
          },
          include: {
            profile: true,
          },
        });

        return updatedUser;
      } catch (err: any) {
        console.error("Register error:", err);
        throw new Error(err.message || "Kayıt sırasında bir hata oluştu.");
      }
    }),
})
