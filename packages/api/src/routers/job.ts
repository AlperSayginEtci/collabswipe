import { z } from "zod"
import { createTRPCRouter, publicProcedure, protectedProcedure } from "../trpc"
import { TRPCError } from "@trpc/server"

export const jobRouter = createTRPCRouter({
  // İş ilanı oluştur
  create: protectedProcedure
    .input(
      z.object({
        title: z.string().min(2),
        description: z.string().min(10),
        type: z.enum(["FREELANCE", "CORPORATE"]),
        skills: z.array(z.string()).optional(),
      })
    )
    .mutation(({ ctx, input }) => {
      if (ctx.session.user.role !== "company") {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Sadece şirket hesapları iş ilanı verebilir.",
        });
      }
      return ctx.prisma.jobPosting.create({ 
        data: {
          title: input.title,
          description: input.description,
          type: input.type,
          publisherId: ctx.session.user.id,
          requirements: input.skills?.length ? {
            connectOrCreate: input.skills.map(s => ({
              where: { skillName: s.toLowerCase().trim() },
              create: { skillName: s.toLowerCase().trim() }
            }))
          } : undefined
        } 
      });
    }),

  // İlanları listele (filtrelenebilir)
  list: publicProcedure
    .input(
      z.object({
        type: z.enum(["FREELANCE", "CORPORATE"]).optional(),
        status: z.enum(["OPEN", "CLOSED", "BANNED"]).optional(),
        userId: z.string().optional(),
        skills: z.array(z.string()).optional(),
        cursor: z.string().optional(),
        limit: z.number().min(1).max(50).default(20),
      })
    )
    .query(async ({ ctx, input }) => {
      const { type, status, userId, cursor, limit } = input;
      
      let userSkills = new Set<string>();
      if (userId) {
        const profile = await ctx.prisma.profile.findUnique({
          where: { userId },
          include: { skills: { select: { skill: { select: { skillName: true } } } } }
        });
        if (profile?.skills) {
          profile.skills.forEach(s => {
            if (s.skill?.skillName) userSkills.add(s.skill.skillName.toLowerCase());
          });
        }
      }

      const allJobs = await ctx.prisma.jobPosting.findMany({
        where: {
          ...(type && { type }),
          ...(status && { status }),
          ...(userId && {
            applications: { none: { applicantId: userId } }
          }),
          ...(input.skills && input.skills.length > 0 && {
            requirements: {
              some: {
                skillName: {
                  in: input.skills.map(s => s.toLowerCase())
                }
              }
            }
          })
        },
        orderBy: { createdAt: "desc" },
        include: {
          publisher: { select: { id: true, name: true, surname: true, image: true } },
          requirements: { select: { skillName: true } },
          _count: { select: { applications: true } },
        },
      });

      // Calculate match score
      const jobsWithScores = allJobs.map(job => {
        let matchScore = 0;
        if (userSkills.size > 0 && job.requirements) {
          matchScore = job.requirements.filter(req => req.skillName && userSkills.has(req.skillName.toLowerCase())).length;
        }
        return { ...job, matchScore };
      });

      // Sort: Match Score (desc) -> Created At (desc)
      jobsWithScores.sort((a, b) => {
        if (b.matchScore !== a.matchScore) {
          return b.matchScore - a.matchScore;
        }
        return b.createdAt.getTime() - a.createdAt.getTime();
      });

      // Apply in-memory cursor pagination
      let startIndex = 0;
      if (cursor) {
        const cursorIndex = jobsWithScores.findIndex(j => j.id === cursor);
        if (cursorIndex !== -1) {
          startIndex = cursorIndex + 1;
        }
      }

      const paginatedItems = jobsWithScores.slice(startIndex, startIndex + limit + 1);
      const nextCursor = paginatedItems.length > limit ? paginatedItems.pop()!.id : undefined;

      return { items: paginatedItems, nextCursor };
    }),

  // İlanı ID ile getir
  getById: publicProcedure
    .input(z.object({ jobId: z.string() }))
    .query(({ ctx, input }) =>
      ctx.prisma.jobPosting.findUnique({
        where: { id: input.jobId },
        include: {
          publisher: { select: { id: true, name: true, surname: true, image: true } },
          requirements: { select: { skillName: true } },
          applications: {
            include: {
              applicant: { select: { id: true, name: true, surname: true, image: true } },
            },
          },
        },
      })
    ),

  // İlana başvur
  apply: publicProcedure
    .input(
      z.object({
        jobId: z.string(),
        applicantId: z.string(),
        coverLetter: z.string().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const existing = await ctx.prisma.jobApplication.findFirst({
        where: { jobId: input.jobId, applicantId: input.applicantId }
      })
      if (existing) {
        throw new Error("You have already applied to this job.")
      }
      return ctx.prisma.jobApplication.create({ data: input })
    }),

  undoApply: publicProcedure
    .input(
      z.object({
        jobId: z.string(),
        applicantId: z.string(),
      })
    )
    .mutation(({ ctx, input }) =>
      ctx.prisma.jobApplication.deleteMany({
        where: {
          jobId: input.jobId,
          applicantId: input.applicantId,
          status: "PENDING",
        },
      })
    ),

  // Başvuru durumunu güncelle (ilan sahibi için)
  updateApplicationStatus: publicProcedure
    .input(
      z.object({
        applicationId: z.string(),
        status: z.enum(["PENDING", "ACCEPTED", "REJECTED"]),
      })
    )
    .mutation(({ ctx, input }) =>
      ctx.prisma.jobApplication.update({
        where: { id: input.applicationId },
        data: { status: input.status },
      })
    ),

  // Benim başvurularım
  getMyApplications: publicProcedure
    .input(z.object({ userId: z.string() }))
    .query(({ ctx, input }) =>
      ctx.prisma.jobApplication.findMany({
        where: { applicantId: input.userId },
        include: {
          job: {
            select: {
              id: true,
              title: true,
              type: true,
              status: true,
              publisher: { select: { name: true, image: true } },
            },
          },
        },
        orderBy: { createdAt: "desc" },
      })
    ),

  // Şirketimin verdiği ilanlar
  getMyPostings: protectedProcedure
    .query(({ ctx }) =>
      ctx.prisma.jobPosting.findMany({
        where: { publisherId: ctx.session.user.id },
        orderBy: { createdAt: "desc" },
        include: {
          _count: { select: { applications: true } },
          requirements: { select: { skillName: true } },
        },
      })
    ),

  // Şirketime gelen tüm başvurular
  getCompanyApplications: protectedProcedure
    .query(({ ctx }) =>
      ctx.prisma.jobApplication.findMany({
        where: {
          job: { publisherId: ctx.session.user.id },
        },
        include: {
          job: { select: { id: true, title: true, type: true, status: true } },
          applicant: { 
            select: { 
              id: true, 
              name: true, 
              surname: true, 
              image: true,
              profile: {
                select: {
                  id: true,
                  bio: true,
                  location: true,
                  skills: {
                    select: {
                      skill: { select: { skillName: true } }
                    }
                  }
                }
              }
            } 
          },
        },
        orderBy: { createdAt: "desc" },
      })
    ),

  // İlan durumunu güncelle (Open/Closed)
  updateStatus: publicProcedure
    .input(
      z.object({
        jobId: z.string(),
        status: z.enum(["OPEN", "CLOSED"]),
      })
    )
    .mutation(({ ctx, input }) =>
      ctx.prisma.jobPosting.update({
        where: { id: input.jobId },
        data: { status: input.status },
      })
    ),
})
