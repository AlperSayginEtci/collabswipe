import { z } from "zod"
import { createTRPCRouter, publicProcedure } from "../trpc"
import { TRPCError } from "@trpc/server"

// ─── Comment tree builder ───────────────────────────────────────────────────
// Fetches ALL comments for a post as a flat list and builds an infinite tree
function buildCommentTree(comments: any[], parentId: string | null = null): any[] {
  return comments
    .filter((c: any) => c.parentCommentId === parentId)
    .map((c: any) => ({
      ...c,
      replies: buildCommentTree(comments, c.id),
    }));
}

// Shared comment include shape (author + likes — no nested replies needed)
const COMMENT_INCLUDE = {
  author: {
    select: {
      id: true, name: true, surname: true, image: true,
      role: true, sector: true,
      profile: { select: { bio: true } },
    },
  },
  likes: { select: { userId: true, type: true } },
  _count: { select: { likes: true } },
};

export const postRouter = createTRPCRouter({
  // ─── Gönderi oluştur ───────────────────────────────────────────────────────
  create: publicProcedure
    .input(
      z.object({
          authorId: z.string(),
          content: z.string().default(""),
          // Base64-encoded media file (image/video) to be uploaded to Dropbox
          mediaFile: z.string().optional(),
          originalPostId: z.string().optional(),
        })
    )
    .mutation(async ({ ctx, input }) => {
          // Create post without mediaUrl first
          const { mediaFile, ...postData } = input;
          const createdPost = await ctx.prisma.post.create({ data: postData });

          // If a media file is provided, upload it to Dropbox and update the post
          if (mediaFile) {
            // @ts-ignore
            const dropboxModule = await import('dropbox');
            const dropbox = new dropboxModule.Dropbox({ accessToken: process.env.DROPBOX_ACCESS_TOKEN });
            // Generate a unique path for the file
            const filePath = `/collabswipe_media/${createdPost.id}_${Date.now()}`;
            const fileBuffer = Buffer.from(mediaFile, "base64");
            await dropbox.filesUpload({ path: filePath, contents: fileBuffer });
            const sharedLink = await dropbox.sharingCreateSharedLinkWithSettings({ path: filePath });
            // Update post with Dropbox shared link
            await ctx.prisma.post.update({
              where: { id: createdPost.id },
              data: { mediaUrl: sharedLink.result.url },
            });
          }
          return createdPost;
        }
    ),

  // ─── Tekil Gönderi Getir ──────────────────────────────────────────────────
  getById: publicProcedure
    .input(z.object({ postId: z.string(), currentUserId: z.string().optional() }))
    .query(async ({ ctx, input }) => {
      const post = await ctx.prisma.post.findUnique({
        where: { id: input.postId },
        include: {
          author: { select: { id: true, name: true, surname: true, image: true, role: true, sector: true, profile: { select: { bio: true } } } },
          likes: { select: { userId: true, type: true } },
          originalPost: {
            include: {
              author: { select: { id: true, name: true, surname: true, image: true, role: true, sector: true, profile: { select: { bio: true } } } },
            },
          },
          comments: {
            include: COMMENT_INCLUDE,
            orderBy: { createdAt: "asc" },
          },
          _count: { select: { likes: true, comments: true, reposts: true } },
        },
      });

      if (!post) throw new TRPCError({ code: "NOT_FOUND", message: "Gönderi bulunamadı." });

      const userLike = post.likes.find((l) => l.userId === input.currentUserId);
      const isLiked = !!userLike;
      
      const reactionTypes = Array.from(new Set(post.likes.map(l => l.type)));

      // Yorum ağacını oluştur
      const commentMap = new Map();
      post.comments.forEach(c => {
        commentMap.set(c.id, { ...c, replies: [] });
      });
      const commentTree: any[] = [];
      post.comments.forEach(c => {
        if (c.parentCommentId && commentMap.has(c.parentCommentId)) {
          commentMap.get(c.parentCommentId).replies.push(commentMap.get(c.id));
        } else {
          commentTree.push(commentMap.get(c.id));
        }
      });

      return {
        ...post,
        isLiked,
        reactionType: userLike?.type,
        reactionTypes,
        comments: commentTree,
      };
    }),

  // ─── Feed ──────────────────────────────────────────────────────────────────
  getFeed: publicProcedure
    .input(
      z.object({
        currentUserId: z.string().optional(),
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
          author: { select: { id: true, name: true, surname: true, image: true, role: true, sector: true, profile: { select: { bio: true } } } },
          likes: { select: { userId: true, type: true } },
          originalPost: {
            include: {
              author: { select: { id: true, name: true, surname: true, image: true, role: true, sector: true, profile: { select: { bio: true } } } },
            },
          },
          // Fetch ALL comments flat — tree built in mapping below
          comments: {
            include: COMMENT_INCLUDE,
            orderBy: { createdAt: "asc" },
          },
          _count: { select: { likes: true, comments: true, reposts: true } },
        },
      });

      const nextCursor = items.length > input.limit ? items.pop()!.id : undefined;

      const mappedItems = items.map((item) => {
        const userLike = item.likes.find((l) => l.userId === input.currentUserId);
        return {
          ...item,
          likes: userLike ? [userLike] : [],
          reactionTypes: Array.from(new Set(item.likes.map((l) => l.type))),
          // Build the recursive comment tree from the flat list
          comments: buildCommentTree(item.comments),
        };
      });

      return { items: mappedItems, nextCursor };
    }),


  // ─── Gönderi beğen ────────────────────────────────────────────────────────
  like: publicProcedure
    .input(z.object({ postId: z.string(), userId: z.string(), type: z.string().optional() }))
    .mutation(({ ctx, input }) =>
      ctx.prisma.like.upsert({
        where: { postId_userId: { postId: input.postId, userId: input.userId } },
        update: { type: input.type ?? "LIKE" },
        create: { postId: input.postId, userId: input.userId, type: input.type ?? "LIKE" },
      })
    ),

  // ─── Gönderi beğeni geri al ───────────────────────────────────────────────
  unlike: publicProcedure
    .input(z.object({ postId: z.string(), userId: z.string() }))
    .mutation(({ ctx, input }) =>
      ctx.prisma.like.delete({
        where: { postId_userId: { postId: input.postId, userId: input.userId } },
      })
    ),

  // ─── Yorum / Yanıt ekle ───────────────────────────────────────────────────
  addComment: publicProcedure
    .input(
      z.object({
        postId: z.string(),
        authorId: z.string(),
        content: z.string().min(1),
        parentCommentId: z.string().optional(), // undefined = top-level, otherwise nested reply
      })
    )
    .mutation(({ ctx, input }) =>
      ctx.prisma.comment.create({ data: input })
    ),

  // ─── Yorum beğen (emoji tipi ile) ────────────────────────────────────────
  likeComment: publicProcedure
    .input(z.object({ commentId: z.string(), userId: z.string(), type: z.string().optional() }))
    .mutation(({ ctx, input }) =>
      ctx.prisma.commentLike.upsert({
        where: { commentId_userId: { commentId: input.commentId, userId: input.userId } },
        update: { type: input.type ?? "LIKE" },
        create: { commentId: input.commentId, userId: input.userId, type: input.type ?? "LIKE" },
      })
    ),

  // ─── Yorum beğenisini geri al ─────────────────────────────────────────────
  unlikeComment: publicProcedure
    .input(z.object({ commentId: z.string(), userId: z.string() }))
    .mutation(({ ctx, input }) =>
      ctx.prisma.commentLike.delete({
        where: { commentId_userId: { commentId: input.commentId, userId: input.userId } },
      })
    ),

  // ─── Yorum sil ────────────────────────────────────────────────────────────
  deleteComment: publicProcedure
    .input(z.object({ commentId: z.string() }))
    .mutation(({ ctx, input }) =>
      ctx.prisma.comment.delete({ where: { id: input.commentId } })
    ),

  // ─── Gönderi sil ──────────────────────────────────────────────────────────
  delete: publicProcedure
    .input(z.object({ postId: z.string() }))
    .mutation(({ ctx, input }) =>
      ctx.prisma.post.delete({ where: { id: input.postId } })
    ),
})
