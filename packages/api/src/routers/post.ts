import { z } from "zod"
import { createTRPCRouter, publicProcedure } from "../trpc"

export const postRouter = createTRPCRouter({
  // Gönderi oluştur
  create: publicProcedure
    .input(
      z.object({
        authorId: z.string(),
        content: z.string().min(1),
        mediaUrl: z.string().optional(),
        originalPostId: z.string().optional(), // Repost
      })
    )
    .mutation(({ ctx, input }) =>
      ctx.prisma.post.create({ data: input })
    ),

  // Akış (feed) — kullanıcının takip ettiklerinin gönderileri
  getFeed: publicProcedure
    .input(
      z.object({
        cursor: z.string().optional(),
        limit: z.number().min(1).max(50).default(20),
      })
    )
    .query(async ({ ctx, input }) => {
      const items = await ctx.prisma.post.findMany({
        where: { isBanned: false },
        orderBy: { createdAt: "desc" },
        take: input.limit + 1,
        cursor: input.cursor ? { id: input.cursor } : undefined,
        include: {
          author: { select: { id: true, name: true, surname: true, image: true } },
          _count: { select: { likes: true, comments: true, reposts: true } },
        },
      })
      const nextCursor = items.length > input.limit ? items.pop()!.id : undefined
      return { items, nextCursor }
    }),

  // Gönderiyi ID ile getir
  getById: publicProcedure
    .input(z.object({ postId: z.string() }))
    .query(({ ctx, input }) =>
      ctx.prisma.post.findUnique({
        where: { id: input.postId },
        include: {
          author: { select: { id: true, name: true, surname: true, image: true } },
          comments: {
            include: {
              author: { select: { id: true, name: true, surname: true, image: true } },
            },
          },
          _count: { select: { likes: true, comments: true } },
        },
      })
    ),

  // Gönderiyi beğen
  like: publicProcedure
    .input(z.object({ postId: z.string(), userId: z.string() }))
    .mutation(({ ctx, input }) =>
      ctx.prisma.like.create({
        data: { postId: input.postId, userId: input.userId },
      })
    ),

  // Beğeniyi geri al
  unlike: publicProcedure
    .input(z.object({ postId: z.string(), userId: z.string() }))
    .mutation(({ ctx, input }) =>
      ctx.prisma.like.delete({
        where: { postId_userId: { postId: input.postId, userId: input.userId } },
      })
    ),

  // Yorum ekle
  addComment: publicProcedure
    .input(
      z.object({
        postId: z.string(),
        authorId: z.string(),
        content: z.string().min(1),
      })
    )
    .mutation(({ ctx, input }) =>
      ctx.prisma.comment.create({ data: input })
    ),

  // Yorum sil
  deleteComment: publicProcedure
    .input(z.object({ commentId: z.string() }))
    .mutation(({ ctx, input }) =>
      ctx.prisma.comment.delete({ where: { id: input.commentId } })
    ),

  // Gönderiyi sil
  delete: publicProcedure
    .input(z.object({ postId: z.string() }))
    .mutation(({ ctx, input }) =>
      ctx.prisma.post.delete({ where: { id: input.postId } })
    ),
})
