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
          experiences: true,
          educations: true,
          certificates: true,
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
        profileName: z.string().optional(),
        bio: z.string().optional(),
        website: z.string().url().optional(),
        location: z.string().optional(),
        banner: z.string().optional(),
      })
    )
    .mutation(({ ctx, input }) => {
      const { userId, ...data } = input
      return ctx.prisma.profile.upsert({
        where: { userId },
        create: { userId, ...data },
        update: data,
      })
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

  // Eğitim sil
  removeEducation: publicProcedure
    .input(z.object({ eduId: z.string() }))
    .mutation(({ ctx, input }) =>
      ctx.prisma.education.delete({ where: { eduId: input.eduId } })
    ),

  // Skill ekle (mevcut skill varsa ekle, yoksa oluştur)
  addSkill: publicProcedure
    .input(z.object({ profileId: z.string(), skillName: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const skill = await ctx.prisma.skill.upsert({
        where: { skillName: input.skillName },
        create: { skillName: input.skillName },
        update: {},
      })
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
