import { z } from "zod"
import { createTRPCRouter, publicProcedure, protectedProcedure } from "../trpc"

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
})
