import { z } from "zod"
import { createTRPCRouter, publicProcedure, protectedProcedure } from "../trpc"

export const profileRouter = createTRPCRouter({
  // Profil getir (tam detay)
  getByUserId: publicProcedure
    .input(z.object({ userId: z.string() }))
    .query(async ({ ctx, input }) => {
      const profile = await ctx.prisma.profile.findUnique({
        where: { userId: input.userId },
        include: {
          experiences: { orderBy: { startDate: 'desc' } },
          educations: { orderBy: { startDate: 'desc' } },
          certificates: { orderBy: { startDate: 'desc' } },
          skills: { include: { skill: true } },
          languages: { include: { language: true } },
          user: { 
            select: { 
              name: true, surname: true, image: true, role: true, sector: true,
              _count: { select: { followers: { where: { isAccepted: true } }, following: { where: { isAccepted: true } } } }
            } 
          },
        },
      });

      if (!profile) {
        const user = await ctx.prisma.user.findUnique({ 
          where: { id: input.userId },
          include: { _count: { select: { followers: { where: { isAccepted: true } }, following: { where: { isAccepted: true } } } } }
        });
        if (!user) return null;
        return {
          id: 'new',
          userId: user.id,
          bio: '',
          location: '',
          banner: '',
          links: [],
          experiences: [],
          educations: [],
          certificates: [],
          skills: [],
          languages: [],
          isPrivate: false,
          user: {
            name: user.name,
            surname: (user as any).surname,
            image: user.image,
            role: (user as any).role,
            sector: (user as any).sector,
            _count: (user as any)._count,
          }
        };
      }
      
      return profile;
    }),

  // Profili güncelle
  update: publicProcedure
    .input(
      z.object({
        userId: z.string(),
        name: z.string().optional(),
        surname: z.string().optional(),
        image: z.string().optional(),
        profileName: z.string().optional(),
        bio: z.string().optional(),
        links: z.array(z.string().url().or(z.string().length(0))).optional(),
        location: z.string().optional(),
        banner: z.string().optional(),
        isPrivate: z.boolean().optional(),
        workingFields: z.array(z.string()).optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const { userId, name, surname, image, ...data } = input

      if (name !== undefined || surname !== undefined || image !== undefined) {
        await ctx.prisma.user.update({
          where: { id: userId },
          data: {
            ...(name !== undefined && { name }),
            ...(surname !== undefined && { surname }),
            ...(image !== undefined && { image }),
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

  // Skill ekle (Yetenek yoksa oluşturur)
  addSkill: publicProcedure
    .input(z.object({ profileId: z.string(), skillName: z.string() }))
    .mutation(async ({ ctx, input }) => {
      let skill = await ctx.prisma.skill.findUnique({
        where: { skillName: input.skillName },
      });
      
      if (!skill) {
        skill = await ctx.prisma.skill.create({
          data: { skillName: input.skillName },
        });
      }

      // Varsa tekrar eklemeyi önle
      const existing = await ctx.prisma.userSkill.findUnique({
        where: { profileId_skillId: { profileId: input.profileId, skillId: skill.skillId } }
      });
      if (existing) return existing;

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

  // Sihirbazın tüm verilerini tek seferde kaydet
  completeOnboarding: publicProcedure
    .input(z.object({
      userId: z.string(),
      image: z.string().optional(), // Base64
      bio: z.string().optional(),
      workingFields: z.array(z.string()).optional(),
      skills: z.array(z.string()).optional(),
      experiences: z.array(z.object({
        type: z.enum(["INTERNSHIP", "WORK"]),
        title: z.string(),
        corp: z.string(),
        startDate: z.coerce.date(),
        endDate: z.coerce.date().optional(),
        location: z.string().optional(),
        locType: z.enum(["REMOTE", "ONSITE", "HYBRID"]).optional(),
        desc: z.string().optional(),
      })).optional(),
      educations: z.array(z.object({
        instName: z.string(),
        instDegree: z.string().optional(),
        startDate: z.coerce.date(),
        endDate: z.coerce.date().optional(),
        instProgram: z.string().optional(),
        instEvents: z.string().optional(),
        instDesc: z.string().optional(),
      })).optional(),
      certificates: z.array(z.object({
        title: z.string(),
        org: z.string(),
        startDate: z.coerce.date(),
        endDate: z.coerce.date().optional(),
        competencyId: z.string().optional(),
        competencyURL: z.string().url().or(z.string().length(0)).optional(),
      })).optional()
    }))
    .mutation(async ({ ctx, input }) => {
      const { userId, image, bio, workingFields, skills, experiences, educations, certificates } = input;

      // Update User image
      if (image) {
        await ctx.prisma.user.update({
          where: { id: userId },
          data: { image },
        });
      }

      // Upsert Profile
      const profile = await ctx.prisma.profile.upsert({
        where: { userId },
        create: {
          userId,
          bio,
          workingFields: workingFields || [],
        },
        update: {
          bio,
          workingFields: workingFields || [],
        },
      });

      // Add custom skills
      if (skills && skills.length > 0) {
        for (const skillName of skills) {
          let skill = await ctx.prisma.skill.findUnique({ where: { skillName } });
          if (!skill) {
            skill = await ctx.prisma.skill.create({ data: { skillName } });
          }
          const existing = await ctx.prisma.userSkill.findUnique({
            where: { profileId_skillId: { profileId: profile.id, skillId: skill.skillId } }
          });
          if (!existing) {
            await ctx.prisma.userSkill.create({
              data: { profileId: profile.id, skillId: skill.skillId },
            });
          }
        }
      }

      // Create Experiences
      if (experiences && experiences.length > 0) {
        await ctx.prisma.experience.createMany({
          data: experiences.map(exp => ({ ...exp, profileId: profile.id })),
        });
      }

      // Create Educations
      if (educations && educations.length > 0) {
        await ctx.prisma.education.createMany({
          data: educations.map(edu => ({ ...edu, profileId: profile.id })),
        });
      }

      // Create Certificates
      if (certificates && certificates.length > 0) {
        const cleanedCerts = certificates.map(cert => ({
          ...cert,
          competencyURL: cert.competencyURL && cert.competencyURL.trim() !== '' ? cert.competencyURL : undefined,
          profileId: profile.id,
        }));
        await ctx.prisma.certificate.createMany({
          data: cleanedCerts,
        });
      }

      return profile;
    }),
})
