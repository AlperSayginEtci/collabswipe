import { z } from "zod"
import { createTRPCRouter, publicProcedure, protectedProcedure } from "../trpc"

export const profileRouter = createTRPCRouter({
  // Profil getir (tam detay)
  getByUserId: publicProcedure
    .input(z.object({ userId: z.string() }))
    .query(({ ctx, input }) =>
      ctx.prisma.profile.findUnique({
        where: { userId: input.userId },
        include: {
          experiences: { orderBy: { startDate: 'desc' } },
          educations: { orderBy: { startDate: 'desc' } },
          certificates: { orderBy: { startDate: 'desc' } },
          skills: { include: { skill: true } },
          languages: { include: { language: true } },
        },
      })
    ),

  // Profili güncelle
  update: publicProcedure
    .input(
      z.object({
        userId: z.string(),
        username: z.string().min(3).regex(/^[a-z0-9_]+$/, 'Sadece küçük harf, rakam ve alt çizgi kullanılabilir.').optional(),
        name: z.string().optional(),
        surname: z.string().optional(),
        image: z.string().optional(),
        profileName: z.string().optional(),
        bio: z.string().optional(),
        links: z.array(z.string().url().or(z.string().length(0))).optional(),
        location: z.string().optional(),
        banner: z.string().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const { userId, username, name, surname, image, ...data } = input
      
      if (username) {
        const existing = await ctx.prisma.user.findFirst({
          where: { username, id: { not: userId } }
        });
        if (existing) {
          throw new Error("Bu kullanıcı adı daha önce alınmış.");
        }
      }

      if (name !== undefined || surname !== undefined || image !== undefined || username !== undefined) {
        await ctx.prisma.user.update({
          where: { id: userId },
          data: {
            ...(name !== undefined && { name }),
            ...(surname !== undefined && { surname }),
            ...(image !== undefined && { image }),
            ...(username !== undefined && { username }),
          },
        });
      }

      // Prepare clean data
      const cleanData = {
        ...data,
        links: data.links ? data.links.filter(l => l.trim().length > 0) : undefined,
      };

      return ctx.prisma.profile.upsert({
        where: { userId },
        create: { userId, ...cleanData },
        update: cleanData,
      })
    }),

  // Tüm standart yetenekleri getir
  getAllSkills: publicProcedure.query(({ ctx }) => {
    return ctx.prisma.skill.findMany({
      orderBy: { skillName: "asc" }
    });
  }),

  // Deneyim ekle
  addExperience: publicProcedure
    .input(
      z.object({
        profileId: z.string(),
        type: z.enum(["INTERNSHIP", "WORK"]),
        title: z.string(),
        corp: z.string(),
        startDate: z.coerce.date(),
        endDate: z.coerce.date().optional(),
        location: z.string().optional(),
        locType: z.enum(["REMOTE", "ONSITE", "HYBRID"]).optional(),
        desc: z.string().optional(),
      })
    )
    .mutation(({ ctx, input }) =>
      ctx.prisma.experience.create({ data: input })
    ),

  // Deneyim güncelle
  updateExperience: publicProcedure
    .input(
      z.object({
        expId: z.string(),
        type: z.enum(["INTERNSHIP", "WORK"]),
        title: z.string(),
        corp: z.string(),
        startDate: z.coerce.date(),
        endDate: z.coerce.date().optional(),
        location: z.string().optional(),
        locType: z.enum(["REMOTE", "ONSITE", "HYBRID"]).optional(),
        desc: z.string().optional(),
      })
    )
    .mutation(({ ctx, input }) => {
      const { expId, ...data } = input;
      return ctx.prisma.experience.update({
        where: { expId },
        data,
      });
    }),

  // Deneyim sil
  removeExperience: publicProcedure
    .input(z.object({ expId: z.string() }))
    .mutation(({ ctx, input }) =>
      ctx.prisma.experience.delete({ where: { expId: input.expId } })
    ),

  // Eğitim ekle
  addEducation: publicProcedure
    .input(
      z.object({
        profileId: z.string(),
        instName: z.string(),
        instDegree: z.string().optional(),
        startDate: z.coerce.date(),
        endDate: z.coerce.date().optional(),
        instProgram: z.string().optional(),
        instEvents: z.string().optional(),
        instDesc: z.string().optional(),
      })
    )
    .mutation(({ ctx, input }) =>
      ctx.prisma.education.create({ data: input })
    ),

  // Eğitim güncelle
  updateEducation: publicProcedure
    .input(
      z.object({
        eduId: z.string(),
        instName: z.string(),
        instDegree: z.string().optional(),
        startDate: z.coerce.date(),
        endDate: z.coerce.date().optional(),
        instProgram: z.string().optional(),
        instEvents: z.string().optional(),
        instDesc: z.string().optional(),
      })
    )
    .mutation(({ ctx, input }) => {
      const { eduId, ...data } = input;
      return ctx.prisma.education.update({
        where: { eduId },
        data,
      });
    }),

  // Eğitim sil
  removeEducation: publicProcedure
    .input(z.object({ eduId: z.string() }))
    .mutation(({ ctx, input }) =>
      ctx.prisma.education.delete({ where: { eduId: input.eduId } })
    ),

  // Sertifika ekle
  addCertificate: publicProcedure
    .input(
      z.object({
        profileId: z.string(),
        title: z.string(),
        org: z.string(),
        startDate: z.coerce.date(),
        endDate: z.coerce.date().optional(),
        competencyId: z.string().optional(),
        competencyURL: z.string().url().or(z.string().length(0)).optional(),
      })
    )
    .mutation(({ ctx, input }) => {
      const { competencyURL, ...rest } = input;
      const cleanUrl = competencyURL && competencyURL.trim() !== '' ? competencyURL : undefined;
      return ctx.prisma.certificate.create({ data: { ...rest, competencyURL: cleanUrl } });
    }),

  // Sertifika güncelle
  updateCertificate: publicProcedure
    .input(
      z.object({
        cerId: z.string(),
        title: z.string(),
        org: z.string(),
        startDate: z.coerce.date(),
        endDate: z.coerce.date().optional(),
        competencyId: z.string().optional(),
        competencyURL: z.string().url().or(z.string().length(0)).optional(),
      })
    )
    .mutation(({ ctx, input }) => {
      const { cerId, competencyURL, ...data } = input;
      const cleanUrl = competencyURL && competencyURL.trim() !== '' ? competencyURL : undefined;
      return ctx.prisma.certificate.update({
        where: { cerId },
        data: { ...data, competencyURL: cleanUrl },
      });
    }),

  // Sertifika sil
  removeCertificate: publicProcedure
    .input(z.object({ cerId: z.string() }))
    .mutation(({ ctx, input }) =>
      ctx.prisma.certificate.delete({ where: { cerId: input.cerId } })
    ),

  // Skill ekle (sadece var olan standart yetenekler eklenebilir)
  addSkill: publicProcedure
    .input(z.object({ profileId: z.string(), skillName: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const skill = await ctx.prisma.skill.findUnique({
        where: { skillName: input.skillName },
      });
      
      if (!skill) {
        throw new Error("Sadece sistemde tanımlı standart yetenekler eklenebilir.");
      }

      return ctx.prisma.userSkill.create({
        data: { profileId: input.profileId, skillId: skill.skillId },
      })
    }),

  // Skill çıkar
  removeSkill: publicProcedure
    .input(z.object({ profileId: z.string(), skillId: z.string() }))
    .mutation(({ ctx, input }) =>
      ctx.prisma.userSkill.delete({
        where: {
          profileId_skillId: { profileId: input.profileId, skillId: input.skillId },
        },
      })
    ),
})
