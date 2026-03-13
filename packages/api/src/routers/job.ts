import { z } from "zod"
import { createTRPCRouter, publicProcedure } from "../trpc"

export const jobRouter = createTRPCRouter({
  // İş ilanı oluştur
  create: publicProcedure
    .input(
      z.object({
        publisherId: z.string(),
        title: z.string().min(2),
        description: z.string().min(10),
        type: z.enum(["FREELANCE", "CORPORATE"]),
        reqId: z.string().optional(),
      })
    )
    .mutation(({ ctx, input }) =>
      ctx.prisma.jobPosting.create({ data: input })
    ),

  // İlanları listele (filtrelenebilir)
  list: publicProcedure
    .input(
      z.object({
        type: z.enum(["FREELANCE", "CORPORATE"]).optional(),
        status: z.enum(["OPEN", "CLOSED", "BANNED"]).optional(),
        cursor: z.string().optional(),
        limit: z.number().min(1).max(50).default(20),
      })
    )
    .query(async ({ ctx, input }) => {
      const { type, status, cursor, limit } = input
      const items = await ctx.prisma.jobPosting.findMany({
        where: {
          ...(type && { type }),
          ...(status && { status }),
        },
        orderBy: { createdAt: "desc" },
        take: limit + 1,
        cursor: cursor ? { id: cursor } : undefined,
        include: {
          publisher: { select: { id: true, name: true, surname: true, image: true } },
          skill: { select: { skillName: true } },
          _count: { select: { applications: true } },
        },
      })
      const nextCursor = items.length > limit ? items.pop()!.id : undefined
      return { items, nextCursor }
    }),

  // İlanı ID ile getir
  getById: publicProcedure
    .input(z.object({ jobId: z.string() }))
    .query(({ ctx, input }) =>
      ctx.prisma.jobPosting.findUnique({
        where: { id: input.jobId },
        include: {
          publisher: { select: { id: true, name: true, surname: true, image: true } },
          skill: { select: { skillName: true } },
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
    .mutation(({ ctx, input }) =>
      ctx.prisma.jobApplication.create({ data: input })
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
