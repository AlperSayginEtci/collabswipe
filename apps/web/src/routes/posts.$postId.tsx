import { createFileRoute, Link, useParams } from '@tanstack/react-router';
import { trpc } from '@/lib/trpc';
import { useSession } from '@collabswipe/auth/client';
import { ArrowLeft, Clock, MoreHorizontal, Send as SendIcon, Trash2, Heart, MessageSquare, Repeat2, Share2, ThumbsUp } from 'lucide-react';
import toast from 'react-hot-toast';
import { useState } from 'react';

export const Route = createFileRoute('/posts/$postId')({
  component: PostDetailPage,
});

function formatRelativeTime(date: Date | string) {
  const now = new Date();
  const d = new Date(date);
  const diffMs = now.getTime() - d.getTime();
  const diffSec = Math.floor(diffMs / 1000);
  const diffMin = Math.floor(diffSec / 60);
  const diffHr = Math.floor(diffMin / 60);
  const diffDays = Math.floor(diffHr / 24);

  if (diffSec < 60) return 'Az önce';
  if (diffMin < 60) return `${diffMin}d önce`;
  if (diffHr < 24) return `${diffHr}s önce`;
  if (diffDays === 1) return 'Dün';
  return `${diffDays} gün önce`;
}

const REACTION_EMOJIS: Record<string, string> = {
  LIKE: '👍', LOVE: '❤️', CELEBRATE: '👏', INSIGHTFUL: '💡', CURIOUS: '🤔',
};
const EMOJI_TO_TYPE: Record<string, string> = {
  '👍': 'LIKE', '❤️': 'LOVE', '👏': 'CELEBRATE', '💡': 'INSIGHTFUL', '🤔': 'CURIOUS',
};

// ─── Comment Node (Simplified for Post Detail) ─────────────────────────────
function CommentNode({ comment, depth = 0, ctx }: { comment: any; depth?: number; ctx: any }) {
  const {
    currentUserId,
    onLike, onDelete,
    session, userInitials,
  } = ctx;

  const isLiked = comment.likes?.some((l: any) => l.userId === currentUserId);
  const likesCount = comment.likes?.length || 0;
  const reactionType = comment.likes?.find((l: any) => l.userId === currentUserId)?.type || 'LIKE';
  const isAuthor = comment.authorId === currentUserId;

  const avatarCls = depth === 0 ? 'w-8 h-8 rounded-lg' : depth === 1 ? 'w-7 h-7 rounded-md' : 'w-6 h-6 rounded-md';
  const bubbleCls = depth === 0
    ? 'bg-muted/40 border-border/25'
    : depth === 1
    ? 'bg-muted/30 border-border/20'
    : 'bg-muted/20 border-border/15';

  return (
    <div className={depth > 0 ? 'mt-2' : ''}>
      <div className="flex gap-2.5 items-start">
        <Link to="/profile" search={{ userId: comment.authorId }} className={`${avatarCls} bg-secondary overflow-hidden shrink-0 border border-border/40 block hover:opacity-80 transition-opacity`}>
          <img
            src={comment.author?.image || `https://api.dicebear.com/7.x/notionists/svg?seed=${comment.author?.name || 'user'}`}
            alt={comment.author?.name || 'avatar'}
            className="w-full h-full object-cover"
          />
        </Link>

        <div className="flex-1 min-w-0">
          <div className={`border p-2.5 rounded-2xl ${bubbleCls}`}>
            <div className="flex justify-between items-start gap-2">
              <div className="min-w-0">
                <Link to="/profile" search={{ userId: comment.authorId }}>
                  <h6 className="font-bold text-[11px] hover:underline cursor-pointer truncate">
                    {comment.author?.name} {comment.author?.surname}
                  </h6>
                </Link>
                <p className="text-[9px] text-muted-foreground truncate">
                  {comment.author?.profile?.bio || 'CollabSwipe Üyesi'}
                </p>
              </div>
              {isAuthor && (
                <button
                  onClick={() => { if (confirm('Bu yorumu silmek istediğinize emin misiniz?')) onDelete(comment.id); }}
                  className="text-muted-foreground hover:text-destructive p-0.5 rounded transition-colors shrink-0"
                >
                  <Trash2 className="w-3 h-3" />
                </button>
              )}
            </div>
            <p className="text-foreground text-[12px] leading-relaxed mt-1.5 whitespace-pre-line break-words">
              {comment.content}
            </p>
          </div>
          <div className="flex items-center gap-2 mt-0.5 ml-1 text-[10px] text-muted-foreground font-semibold">
            <button
              onClick={() => onLike(comment.id, isLiked, isLiked ? undefined : 'LIKE')}
              className={`hover:text-primary transition-colors ${isLiked ? 'text-teal-600 font-bold' : ''}`}
            >
              {isLiked ? (REACTION_EMOJIS[reactionType] + ' Beğenildi') : 'Beğen'}
            </button>
            {likesCount > 0 && <span className="ml-1 font-normal text-muted-foreground/70">{likesCount}</span>}
          </div>
        </div>
      </div>

      {comment.replies && comment.replies.length > 0 && (
        <div className="mt-2 ml-9 pl-3 border-l-2 border-border/20 space-y-1">
          {comment.replies.map((reply: any) => (
            <CommentNode key={reply.id} comment={reply} depth={depth + 1} ctx={ctx} />
          ))}
        </div>
      )}
    </div>
  );
}

function PostDetailPage() {
  const { postId } = Route.useParams();
  const utils = trpc.useUtils();
  const { data: session } = useSession();
  const currentUserId = session?.user?.id;

  const [commentText, setCommentText] = useState('');
  const [openMenu, setOpenMenu] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);

  const { data: post, isLoading, isError } = trpc.post.getById.useQuery(
    { postId, currentUserId: currentUserId || '' },
    { enabled: !!postId }
  );

  const deletePost = trpc.post.delete.useMutation({
    onSuccess: () => {
      toast.success('Gönderi silindi.');
      window.history.back();
    },
    onError: () => toast.error('Gönderi silinirken bir hata oluştu.')
  });

  const likePost = trpc.post.like.useMutation({ onSuccess: () => utils.post.getById.invalidate() });
  const unlikePost = trpc.post.unlike.useMutation({ onSuccess: () => utils.post.getById.invalidate() });
  
  const addComment = trpc.post.addComment.useMutation({
    onSuccess: () => {
      toast.success('Yorum eklendi!');
      setCommentText('');
      utils.post.getById.invalidate();
    },
    onError: () => toast.error('Yorum eklenemedi.')
  });

  const likeComment = trpc.post.likeComment.useMutation({ onSuccess: () => utils.post.getById.invalidate() });
  const unlikeComment = trpc.post.unlikeComment.useMutation({ onSuccess: () => utils.post.getById.invalidate() });
  const deleteComment = trpc.post.deleteComment.useMutation({ onSuccess: () => utils.post.getById.invalidate() });

  const handleLikeToggle = () => {
    if (!currentUserId || !post) return;
    if (post.isLiked) {
      unlikePost.mutate({ postId, userId: currentUserId });
    } else {
      likePost.mutate({ postId, userId: currentUserId, type: 'LIKE' });
    }
  };

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-24 gap-4">
        <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin" />
        <span className="text-muted-foreground font-medium">Gönderi yükleniyor...</span>
      </div>
    );
  }

  if (isError || !post) {
    return (
      <div className="flex flex-col items-center justify-center py-24 gap-4">
        <div className="w-16 h-16 bg-destructive/10 text-destructive rounded-full flex items-center justify-center mb-2">
          <Trash2 className="w-8 h-8" />
        </div>
        <h2 className="text-xl font-bold">Gönderi bulunamadı</h2>
        <p className="text-muted-foreground">Bu gönderi silinmiş veya erişilemiyor olabilir.</p>
        <Link to="/" className="mt-4 px-6 py-2 bg-primary text-primary-foreground rounded-xl font-semibold hover:opacity-90">
          Ana Sayfaya Dön
        </Link>
      </div>
    );
  }

  const isAuthor = post.authorId === currentUserId;
  const hasOriginal = !!post.originalPost;
  const contentToRender = post.content === 'repost' && hasOriginal ? '' : post.content;
  const textLimit = 300;
  const showSeeMore = contentToRender.length > textLimit && !isExpanded;

  const ctx = {
    currentUserId,
    session,
    userInitials: 'U',
    onLike: (commentId: string, isLiked: boolean, type?: string) => {
      if (!currentUserId) return;
      if (isLiked && !type) unlikeComment.mutate({ commentId, userId: currentUserId });
      else likeComment.mutate({ commentId, userId: currentUserId, type: type || 'LIKE' });
    },
    onDelete: (commentId: string) => deleteComment.mutate({ commentId }),
  };

  return (
    <div className="max-w-3xl mx-auto pb-20 w-full animate-in fade-in duration-300">
      <button 
        onClick={() => window.history.back()}
        className="flex items-center gap-2 text-muted-foreground hover:text-foreground mb-6 transition-colors group"
      >
        <div className="p-2 rounded-full bg-muted/50 group-hover:bg-muted transition-colors">
          <ArrowLeft className="w-4 h-4" />
        </div>
        <span className="font-semibold text-sm">Geri dön</span>
      </button>

      <div className="bg-card/80 backdrop-blur-xl border border-border/60 rounded-3xl p-6 shadow-2xl shadow-shadow/5 relative">
        {/* Header */}
        <div className="flex items-start justify-between mb-5">
          <div className="flex items-center gap-4">
            <Link to="/profile" search={{ userId: post.authorId }} className="w-14 h-14 rounded-2xl bg-secondary overflow-hidden shrink-0 border border-border/50 shadow-sm block hover:opacity-80 transition-opacity">
              <img 
                src={post.author?.image || `https://api.dicebear.com/7.x/notionists/svg?seed=${post.author?.name || 'user'}`} 
                alt="avatar" 
                className="w-full h-full object-cover" 
              />
            </Link>
            <div>
              <Link to="/profile" search={{ userId: post.authorId }}>
                <h4 className="font-bold text-foreground text-lg hover:underline cursor-pointer">
                  {post.author?.name} {post.author?.surname}
                </h4>
              </Link>
              <p className="text-sm text-muted-foreground">
                {post.author?.profile?.bio || (post.author?.role === 'company' ? `${post.author?.sector || 'Şirket'}` : 'CollabSwipe Üyesi')}
              </p>
              <p className="text-xs text-muted-foreground flex items-center gap-1.5 mt-1">
                <Clock className="w-3 h-3" />
                {formatRelativeTime(post.createdAt)}
              </p>
            </div>
          </div>

          <div className="relative">
            <button 
              onClick={() => setOpenMenu(!openMenu)}
              className="p-2 hover:bg-muted rounded-xl text-muted-foreground hover:text-foreground transition-colors"
            >
              <MoreHorizontal className="w-6 h-6" />
            </button>
            {openMenu && (
              <div className="absolute right-0 mt-2 w-48 bg-card border border-border rounded-xl shadow-2xl z-20 overflow-hidden py-1">
                {isAuthor && (
                  <button 
                    onClick={() => {
                      if (confirm('Bu gönderiyi silmek istediğinize emin misiniz?')) {
                        deletePost.mutate({ postId: post.id });
                      }
                      setOpenMenu(false);
                    }}
                    className="w-full px-4 py-2.5 text-left text-sm text-destructive hover:bg-destructive/10 font-medium flex items-center gap-2 transition-colors"
                  >
                    <Trash2 className="w-4 h-4" /> Gönderiyi Sil
                  </button>
                )}
                <button 
                  onClick={() => {
                    navigator.clipboard.writeText(window.location.href);
                    toast.success('Bağlantı kopyalandı!');
                    setOpenMenu(false);
                  }}
                  className="w-full px-4 py-2.5 text-left text-sm hover:bg-muted font-medium flex items-center gap-2 transition-colors"
                >
                  <SendIcon className="w-4 h-4" /> Bağlantıyı Kopyala
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Content */}
        <div className="space-y-4 mb-6">
          {contentToRender && (
            <p className="text-foreground text-[15px] leading-relaxed whitespace-pre-line">
              {showSeeMore ? `${contentToRender.slice(0, textLimit)}...` : contentToRender}
              {showSeeMore && (
                <button onClick={() => setIsExpanded(true)} className="text-primary hover:underline font-semibold ml-2 inline-block focus:outline-none">
                  Devamını oku
                </button>
              )}
            </p>
          )}

          {post.mediaUrl && (
            <div className="rounded-2xl overflow-hidden border border-border/40 shadow-sm max-h-[500px] bg-muted/10 mt-4">
              <img src={post.mediaUrl} alt="post attachment" className="w-full h-full object-contain" />
            </div>
          )}

          {hasOriginal && (
            <div className="border-2 border-border/60 bg-muted/5 rounded-2xl p-5 mt-4">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 rounded-xl bg-secondary overflow-hidden shrink-0 border border-border/40">
                  <img src={post.originalPost?.author?.image || `https://api.dicebear.com/7.x/notionists/svg?seed=${post.originalPost?.author?.name}`} alt="avatar" className="w-full h-full object-cover" />
                </div>
                <div>
                  <h5 className="font-bold text-foreground text-sm hover:underline cursor-pointer">
                    {post.originalPost?.author?.name} {post.originalPost?.author?.surname}
                  </h5>
                  <p className="text-xs text-muted-foreground">
                    {post.originalPost?.author?.profile?.bio || 'CollabSwipe Üyesi'}
                  </p>
                </div>
              </div>
              <p className="text-foreground/90 text-sm leading-relaxed mb-3">
                {post.originalPost?.content}
              </p>
              {post.originalPost?.mediaUrl && (
                <div className="rounded-xl overflow-hidden border border-border/40 max-h-80 bg-muted/10">
                  <img src={post.originalPost?.mediaUrl} alt="original attachment" className="w-full h-full object-cover" />
                </div>
              )}
            </div>
          )}
        </div>

        {/* Stats */}
        <div className="flex items-center justify-between text-sm text-muted-foreground pb-4 border-b border-border/60">
          <div className="flex items-center gap-2">
            <div className="flex -space-x-1">
              <div className="w-5 h-5 rounded-full bg-blue-500 text-white flex items-center justify-center text-[10px] border border-background z-10">👍</div>
              <div className="w-5 h-5 rounded-full bg-red-500 text-white flex items-center justify-center text-[10px] border border-background">❤️</div>
            </div>
            <span className="font-medium">{post._count?.likes || 0} beğeni</span>
          </div>
          <div className="flex gap-4">
            <span>{post._count?.comments || 0} yorum</span>
            <span>{post._count?.reposts || 0} paylaşım</span>
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center justify-between pt-2 mb-6">
          <button 
            onClick={handleLikeToggle}
            className={`flex-1 flex items-center justify-center gap-2 p-3 rounded-xl transition-all duration-200 font-bold ${post.isLiked ? 'text-teal-600 bg-teal-500/10' : 'text-muted-foreground hover:bg-muted/80'}`}
          >
            <ThumbsUp className={`w-5 h-5 ${post.isLiked ? 'fill-current' : ''}`} />
            {post.isLiked ? 'Beğenildi' : 'Beğen'}
          </button>
          <button className="flex-1 flex items-center justify-center gap-2 p-3 rounded-xl text-muted-foreground hover:bg-muted/80 hover:text-foreground transition-colors font-semibold">
            <MessageSquare className="w-5 h-5" />
            Yorum Yap
          </button>
          <button className="flex-1 flex items-center justify-center gap-2 p-3 rounded-xl text-muted-foreground hover:bg-muted/80 hover:text-foreground transition-colors font-semibold hidden sm:flex">
            <Repeat2 className="w-5 h-5" />
            Yeniden Paylaş
          </button>
          <button 
            onClick={() => {
              navigator.clipboard.writeText(window.location.href);
              toast.success('Bağlantı kopyalandı!');
            }}
            className="flex-1 flex items-center justify-center gap-2 p-3 rounded-xl text-muted-foreground hover:bg-muted/80 hover:text-foreground transition-colors font-semibold"
          >
            <Share2 className="w-5 h-5" />
            Gönder
          </button>
        </div>

        {/* Comments Section */}
        <div className="space-y-4 pt-4 border-t border-border/40">
          <h4 className="font-bold text-foreground">Yorumlar</h4>
          
          <div className="flex gap-3 items-start mb-6">
            <div className="w-10 h-10 rounded-xl bg-secondary overflow-hidden shrink-0 border border-border/40">
              <img 
                src={session?.user?.image || `https://api.dicebear.com/7.x/notionists/svg?seed=${currentUserId}`} 
                alt="you" 
                className="w-full h-full object-cover" 
              />
            </div>
            <div className="flex-1 flex flex-col gap-2">
              <textarea 
                value={commentText}
                onChange={(e) => setCommentText(e.target.value)}
                placeholder="Yorum ekle..."
                className="w-full bg-muted/40 border border-border/60 hover:border-border/80 focus:border-primary/80 focus:outline-none px-4 py-3 rounded-2xl text-sm transition-colors resize-none min-h-[80px]"
              />
              {commentText.trim() && (
                <div className="flex justify-end animate-in fade-in duration-200">
                  <button 
                    onClick={() => {
                      if (!currentUserId) return;
                      addComment.mutate({ postId, authorId: currentUserId, content: commentText.trim() });
                    }}
                    disabled={addComment.isLoading}
                    className="bg-primary text-primary-foreground px-5 py-2 rounded-xl font-bold text-sm hover:opacity-90 transition-opacity"
                  >
                    Gönder
                  </button>
                </div>
              )}
            </div>
          </div>

          <div className="space-y-5">
            {post.comments?.map((comment: any) => (
              <CommentNode key={comment.id} comment={comment} ctx={ctx} />
            ))}
            {post.comments?.length === 0 && (
              <p className="text-center text-muted-foreground text-sm py-4">İlk yorumu sen yap!</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
