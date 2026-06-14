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
              links: true,
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
    .input(z.object({ 
      userId: z.string(),
      location: z.string().optional(),
      includeRemote: z.boolean().optional(),
      skills: z.array(z.string()).optional(),
      ageMin: z.number().optional(),
      ageMax: z.number().optional(),
    }))
    .query(async ({ ctx, input }) => {
      const { userId, location, includeRemote, skills, ageMin, ageMax } = input;
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
          email: { not: "employer@collabswipe.com" },
          role: "user",
          ...(location || includeRemote || skills || ageMin !== undefined || ageMax !== undefined ? {
            profile: {
              ...(location && !includeRemote && { location: { contains: location, mode: "insensitive" } }),
              ...(location && includeRemote && {
                OR: [
                  { location: { contains: location, mode: "insensitive" } },
                  { location: { contains: "Uzaktan", mode: "insensitive" } }
                ]
              }),
              ...(!location && includeRemote && { location: { contains: "Uzaktan", mode: "insensitive" } }),
              ...(ageMin !== undefined && { age: { gte: ageMin } }),
              ...(ageMax !== undefined && { age: { lte: ageMax } }),
              ...(skills && skills.length > 0 && {
                skills: {
                  some: {
                    skill: {
                      skillName: {
                        in: skills.map(s => s.toLowerCase())
                      }
                    }
                  }
                }
              })
            }
          } : {})
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
              experiences: {
                orderBy: { startDate: "desc" },
                select: { expId: true, title: true, corp: true, desc: true, startDate: true, endDate: true }
              },
              educations: {
                orderBy: { startDate: "desc" },
                select: { eduId: true, instName: true, instProgram: true, instDegree: true, startDate: true, endDate: true }
              },
              certificates: {
                orderBy: { startDate: "desc" },
                select: { cerId: true, title: true, org: true, startDate: true, competencyURL: true }
              }
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

        // Debug: log full response shape to understand token location
        console.log("[login] auth.api.signInEmail response keys:", Object.keys(response || {}));
        console.log("[login] response.token:", response?.token ? `${String(response.token).substring(0, 15)}...` : "NULL/UNDEFINED");
        console.log("[login] response.session:", (response as any)?.session ? JSON.stringify(Object.keys((response as any).session)) : "NULL");

        // Better Auth may return the token inside session.token
        const token = response?.token ?? ((response as any)?.session)?.token ?? null;
        console.log("[login] resolved token:", token ? `${String(token).substring(0, 15)}...` : "NULL");

        const user = await ctx.prisma.user.findUnique({
          where: { id: response.user.id },
          include: {
            profile: true,
          },
        });

        if (!user) {
          throw new Error("Kullanıcı kaydı bulunamadı.");
        }

        return {
          user,
          token,
        };
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
        password: z.string().min(8, "Şifre en az 8 karakter olmalıdır."),
        name: z.string(),
        surname: z.string(),
        role: z.string().default("user"),
        sector: z.string().optional(),
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
            sector: input.sector,
            profile: {
              upsert: {
                create: {
                  profileName: `${input.name} ${input.surname}`.trim(),
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

  // Şikayet oluştur (Kullanıcı, Post, Job vb.)
  createReport: protectedProcedure
    .input(
      z.object({
        targetType: z.enum(["USER", "POST", "COMMENT", "JOB"]),
        targetId: z.string(),
        reason: z.string().min(5),
      })
    )
    .mutation(({ ctx, input }) =>
      ctx.prisma.report.create({
        data: {
          reporterId: ctx.session.user.id,
          targetType: input.targetType,
          targetId: input.targetId,
          reason: input.reason,
        },
      })
    ),
})
