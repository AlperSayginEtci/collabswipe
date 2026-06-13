import { z } from "zod"
import { createTRPCRouter, publicProcedure, protectedProcedure } from "../trpc"
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


export const postRouter = createTRPCRouter({
  // ─── Gönderi oluştur ───────────────────────────────────────────────────────
  create: publicProcedure
    .input(
      z.object({
          authorId: z.string(),
          content: z.string().default(""),
          // URL of already-uploaded media (uploaded via /api/upload endpoint)
          mediaUrl: z.string().optional(),
          // Legacy base64 field kept for backwards compatibility (ignored now)
          mediaFile: z.string().optional(),
          originalPostId: z.string().optional(),
        })
    )
    .mutation(async ({ ctx, input }) => {
          // Mute kontrolü
          const user = await ctx.prisma.user.findUnique({ where: { id: input.authorId }, select: { muteExpires: true } });
          if (user?.muteExpires && user.muteExpires > new Date()) {
            throw new TRPCError({ code: "FORBIDDEN", message: "Hesabınız geçici olarak susturulmuştur." });
          }

          // Validate: at least content or mediaUrl must be present
          if (!input.content?.trim() && !input.mediaUrl) {
            throw new TRPCError({ code: "BAD_REQUEST", message: "Gönderi içeriği veya medya dosyası gereklidir." });
          }

          console.log('[post.create] authorId:', input.authorId, '| content len:', input.content?.length, '| mediaUrl:', input.mediaUrl ? input.mediaUrl.substring(0, 40) + '...' : 'null');

          const { mediaFile, ...postData } = input;
          const createdPost = await ctx.prisma.post.create({ data: postData });
          console.log('[post.create] created post id:', createdPost.id);
          return createdPost;
        }
    ),


  // ─── Gönderiyi Düzenle ────────────────────────────────────────────────────
  editPost: protectedProcedure
    .input(z.object({ postId: z.string(), content: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const post = await ctx.prisma.post.findUnique({
        where: { id: input.postId },
      });
      if (!post || post.authorId !== ctx.session.user.id) {
        throw new TRPCError({ code: "UNAUTHORIZED", message: "Bu gönderiyi düzenleme yetkiniz yok." });
      }

      const updatedPost = await ctx.prisma.post.update({
        where: { id: input.postId },
        data: {
          content: input.content,
          editRequestedAt: null,
          editRequestedBy: null,
        },
      });

      if (post.editRequestedAt && post.editRequestedBy) {
        await ctx.prisma.notification.create({
          data: {
            userId: post.editRequestedBy,
            title: 'Düzenleme Gerçekleşti',
            message: `Uyarı gönderdiğiniz bir post, sahibi tarafından başarıyla güncellendi.`,
            link: `/posts/${post.id}`
          }
        });
      }

      return updatedPost;
    }),

  // ─── Tekil Gönderi Getir ──────────────────────────────────────────────────
  getById: publicProcedure
    .input(z.object({ postId: z.string(), currentUserId: z.string().optional() }))
    .query(async ({ ctx, input }) => {
      const post = await ctx.prisma.post.findUnique({
        where: { id: input.postId },
        include: {
          author: { select: { id: true, name: true, surname: true, image: true, role: true, sector: true, profile: { select: { bio: true, experiences: { where: { endDate: null }, orderBy: { startDate: "desc" }, take: 1, select: { corp: true, title: true } }, educations: { where: { endDate: null }, orderBy: { startDate: "desc" }, take: 1, select: { instName: true, instProgram: true } } } } } },
          likes: { select: { userId: true, type: true } },
          originalPost: {
            include: {
              author: { select: { id: true, name: true, surname: true, image: true, role: true, sector: true, profile: { select: { bio: true, experiences: { where: { endDate: null }, orderBy: { startDate: "desc" }, take: 1, select: { corp: true, title: true } }, educations: { where: { endDate: null }, orderBy: { startDate: "desc" }, take: 1, select: { instName: true, instProgram: true } } } } } },
            },
          },
          comments: {
            include: {
              author: {
                select: {
                  id: true, name: true, surname: true, image: true,
                  role: true, sector: true,
                  profile: { select: { bio: true, experiences: { where: { endDate: null }, orderBy: { startDate: "desc" }, take: 1, select: { corp: true, title: true } }, educations: { where: { endDate: null }, orderBy: { startDate: "desc" }, take: 1, select: { instName: true, instProgram: true } } } },
                },
              },
              likes: { select: { userId: true, type: true } },
              _count: { select: { likes: true } },
            },
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
      // Debug: count total posts without filter
      const totalPosts = await ctx.prisma.post.count();
      console.log(`[getFeed] total posts in DB: ${totalPosts}, currentUserId: ${input.currentUserId}`);
      
      // Debug: check how many pass the filter
      const filteredCount = await ctx.prisma.post.count({
        where: { 
          isBanned: false,
          OR: [
            { isQuarantined: false, author: { isShadowbanned: false } },
            ...(input.currentUserId ? [{ authorId: input.currentUserId }] : [])
          ]
        }
      });
      console.log(`[getFeed] posts after filter: ${filteredCount}`);

      const items = await ctx.prisma.post.findMany({
        where: { 
          isBanned: false,
          OR: [
            { 
              isQuarantined: false, 
              author: { 
                OR: [
                  { isShadowbanned: false },
                  { isShadowbanned: null }
                ]
              }
            },
            ...(input.currentUserId ? [{ authorId: input.currentUserId }] : [])
          ]
        },
        orderBy: { createdAt: "desc" },
        take: input.limit + 1,

        cursor: input.cursor ? { id: input.cursor } : undefined,
        include: {
          author: { select: { id: true, name: true, surname: true, image: true, role: true, sector: true, profile: { select: { bio: true, experiences: { where: { endDate: null }, orderBy: { startDate: "desc" }, take: 1, select: { corp: true, title: true } }, educations: { where: { endDate: null }, orderBy: { startDate: "desc" }, take: 1, select: { instName: true, instProgram: true } } } } } },
          likes: { select: { userId: true, type: true } },
          originalPost: {
            include: {
              author: { select: { id: true, name: true, surname: true, image: true, role: true, sector: true, profile: { select: { bio: true, experiences: { where: { endDate: null }, orderBy: { startDate: "desc" }, take: 1, select: { corp: true, title: true } }, educations: { where: { endDate: null }, orderBy: { startDate: "desc" }, take: 1, select: { instName: true, instProgram: true } } } } } },
            },
          },
          // Fetch ALL comments flat — tree built in mapping below
          comments: {
            include: {
              author: {
                select: {
                  id: true, name: true, surname: true, image: true,
                  role: true, sector: true,
                  profile: { select: { bio: true, experiences: { where: { endDate: null }, orderBy: { startDate: "desc" }, take: 1, select: { corp: true, title: true } }, educations: { where: { endDate: null }, orderBy: { startDate: "desc" }, take: 1, select: { instName: true, instProgram: true } } } },
                },
              },
              likes: { select: { userId: true, type: true } },
              _count: { select: { likes: true } },
            },
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
    .mutation(async ({ ctx, input }) => {
      const result = await ctx.prisma.like.upsert({
        where: { postId_userId: { postId: input.postId, userId: input.userId } },
        update: { type: input.type ?? "LIKE" },
        create: { postId: input.postId, userId: input.userId, type: input.type ?? "LIKE" },
      });
      console.log(`LIKE MUTATION: input.userId=${input.userId}, input.postId=${input.postId}`);

      const post = await ctx.prisma.post.findUnique({
        where: { id: input.postId },
        select: { authorId: true }
      });

      if (post && post.authorId !== input.userId) {
        console.log(`LIKE MUTATION: Notification should be created for post.authorId=${post.authorId}`);
        const user = await ctx.prisma.user.findUnique({
          where: { id: input.userId },
          select: { name: true, surname: true, }
        });
        const userName = user?.name ? `${user.name} ${user.surname}` : "Birisi";

        try {
          await ctx.prisma.notification.create({
            data: {
              userId: post.authorId,
              title: "Yeni Tepki",
              message: `${userName} gönderinize tepki bıraktı.`,
              link: `/posts/${input.postId}`,
            }
          });
          console.log(`LIKE MUTATION: Notification successfully created!`);
        } catch (error) {
          console.error(`LIKE MUTATION: Notification creation failed!`, error);
        }
      } else {
        console.log(`LIKE MUTATION: Notification skipped. post.authorId=${post?.authorId}, input.userId=${input.userId}`);
      }

      return result;
    }),

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
    .mutation(async ({ ctx, input }) => {
      // Mute kontrolü
      const user = await ctx.prisma.user.findUnique({ where: { id: input.authorId }, select: { muteExpires: true, name: true, surname: true, } });
      if (user?.muteExpires && user.muteExpires > new Date()) {
        throw new TRPCError({ code: "FORBIDDEN", message: "Hesabınız geçici olarak susturulmuştur." });
      }

      const newComment = await ctx.prisma.comment.create({ data: input });

      const userName = user?.name ? `${user.name} ${user.surname}` : "Birisi";

      if (input.parentCommentId) {
        // Bu bir yoruma yanıt
        const parentComment = await ctx.prisma.comment.findUnique({
          where: { id: input.parentCommentId },
          select: { authorId: true }
        });

        if (parentComment && parentComment.authorId !== input.authorId) {
          await ctx.prisma.notification.create({
            data: {
              userId: parentComment.authorId,
              title: "Yeni Yanıt",
              message: `${userName} yorumunuza yanıt verdi.`,
              link: `/posts/${input.postId}`,
            }
          });
        }
      } else {
        // Ana gönderiye yorum
        const post = await ctx.prisma.post.findUnique({
          where: { id: input.postId },
          select: { authorId: true }
        });

        if (post && post.authorId !== input.authorId) {
          await ctx.prisma.notification.create({
            data: {
              userId: post.authorId,
              title: "Yeni Yorum",
              message: `${userName} gönderinize yorum yaptı.`,
              link: `/posts/${input.postId}`,
            }
          });
        }
      }

      return newComment;
    }),

  // ─── Yorum beğen (emoji tipi ile) ────────────────────────────────────────
  likeComment: publicProcedure
    .input(z.object({ commentId: z.string(), userId: z.string(), type: z.string().optional() }))
    .mutation(async ({ ctx, input }) => {
      const result = await ctx.prisma.commentLike.upsert({
        where: { commentId_userId: { commentId: input.commentId, userId: input.userId } },
        update: { type: input.type ?? "LIKE" },
        create: { commentId: input.commentId, userId: input.userId, type: input.type ?? "LIKE" },
      });

      const comment = await ctx.prisma.comment.findUnique({
        where: { id: input.commentId },
        select: { authorId: true, postId: true }
      });

      if (comment && comment.authorId !== input.userId) {
        const user = await ctx.prisma.user.findUnique({
          where: { id: input.userId },
          select: { name: true, surname: true, }
        });
        const userName = user?.name ? `${user.name} ${user.surname}` : "Birisi";

        await ctx.prisma.notification.create({
          data: {
            userId: comment.authorId,
            title: "Yorumuna Tepki",
            message: `${userName} yorumunuza tepki bıraktı.`,
            link: `/posts/${comment.postId}`,
          }
        });
      }

      return result;
    }),

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
