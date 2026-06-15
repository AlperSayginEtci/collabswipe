import { createFileRoute, Link } from '@tanstack/react-router';
import { 
  Image as ImageIcon, Video, Calendar, FileText, 
  MessageSquare, Repeat2, Send, ThumbsUp, MoreHorizontal, 
  Trash2, X, Globe, Clock, AlertCircle, UserPlus, Users, FileWarning, Edit3
} from 'lucide-react';
import { MentionTextarea } from '@/components/MentionTextarea';
import { MentionInput } from '@/components/MentionInput';
import { FormattedText } from '@/components/FormattedText';
import { trpc } from '@/lib/trpc';
import React, { useState } from 'react';
import { useSession } from '@collabswipe/auth/client';
import toast from 'react-hot-toast';
import { ReportModal } from '@/components/ReportModal';
import { LandingPage } from '@/components/LandingPage';

export const Route = createFileRoute('/')({
  component: HomeFeed,
});

function EditPostModal({ post, isOpen, onClose }: { post: any; isOpen: boolean; onClose: () => void }) {
  const [content, setContent] = React.useState(post?.content || '');
  const utils = trpc.useUtils();
  const editPost = trpc.post.editPost.useMutation({
    onSuccess: () => {
      toast.success('Gönderi güncellendi!');
      utils.post.getFeed.invalidate();
      onClose();
    },
    onError: () => toast.error('Güncelleme başarısız!')
  });

  React.useEffect(() => {
    if (post) setContent(post.content);
  }, [post]);

  if (!isOpen || !post) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm animate-in fade-in">
      <div className="bg-card w-full max-w-lg rounded-2xl border border-border shadow-2xl p-6 relative">
        <h2 className="text-xl font-bold mb-4 text-foreground">Gönderiyi Düzenle</h2>
        <textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          className="w-full min-h-[150px] p-3 rounded-xl border border-border/50 bg-muted/30 focus:outline-none focus:border-primary resize-none text-foreground"
        />
        <div className="flex justify-end gap-3 mt-4">
          <button onClick={onClose} className="px-4 py-2 rounded-lg font-semibold text-muted-foreground hover:bg-muted transition-colors">İptal</button>
          <button onClick={() => editPost.mutate({ postId: post.id, content })} disabled={editPost.isPending || !content.trim()} className="px-5 py-2 rounded-lg font-semibold bg-primary text-primary-foreground hover:opacity-90 disabled:opacity-50 transition-opacity">Kaydet</button>
        </div>
      </div>
    </div>
  );
}

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

function toSafeImageUrl(url: string) {
  if (!url) return '';
  try {
    const parsed = new URL(url);
    if (parsed.protocol === 'blob:' || parsed.protocol === 'data:' || parsed.protocol === 'https:' || parsed.protocol === 'http:') {
      return parsed.toString();
    }
  } catch {}
  return '';
}

// ─── Reaction helpers ────────────────────────────────────────────────────────
const REACTION_EMOJIS: Record<string, string> = {
  LIKE: '👍', LOVE: '❤️', CELEBRATE: '👏', INSIGHTFUL: '💡', CURIOUS: '🤔',
};
const EMOJI_TO_TYPE: Record<string, string> = {
  '👍': 'LIKE', '❤️': 'LOVE', '👏': 'CELEBRATE', '💡': 'INSIGHTFUL', '🤔': 'CURIOUS',
};

// ─── Shared context passed to recursive CommentNode ─────────────────────────
interface CommentCtx {
  postId: string;
  currentUserId: string | undefined;
  activeReplyCommentId: string | null;
  setActiveReplyCommentId: (id: string | null) => void;
  replyTexts: Record<string, string>;
  setReplyTexts: React.Dispatch<React.SetStateAction<Record<string, string>>>;
  hoveredCommentId: string | null;
  setHoveredCommentId: (id: string | null) => void;
  onHoverEnter: (id: string) => void;
  onHoverLeave: () => void;
  onLike: (commentId: string, isLiked: boolean, reactionType?: string) => void;
  onAddReply: (postId: string, parentCommentId: string) => void;
  onDelete: (commentId: string) => void;
  session: any;
  userInitials: string;
}

// ─── Recursive comment component ────────────────────────────────────────────

function getAuthorSubtitle(author: any) {
  if (!author) return 'CollabSwipe Üyesi';
  if (author.role === 'company') return author.sector || 'Şirket';
  const activeExp = author.profile?.experiences?.[0];
  if (activeExp) return `${activeExp.corp} - ${activeExp.title}`;
  const activeEdu = author.profile?.educations?.[0];
  if (activeEdu) return `${activeEdu.instName}${activeEdu.instProgram ? ` - ${activeEdu.instProgram}` : ''}`;
  return 'CollabSwipe Üyesi';
}

function CommentNode({ comment, depth = 0, ctx }: { comment: any; depth?: number; ctx: CommentCtx }) {
  const {
    postId, currentUserId,
    activeReplyCommentId, setActiveReplyCommentId,
    replyTexts, setReplyTexts,
    hoveredCommentId, setHoveredCommentId,
    onHoverEnter, onHoverLeave,
    onLike, onAddReply, onDelete,
    session, userInitials,
  } = ctx;

  const isLiked = comment.likes?.some((l: any) => l.userId === currentUserId);
  const likesCount = comment.likes?.length || 0;
  const reactionType = comment.likes?.find((l: any) => l.userId === currentUserId)?.type || 'LIKE';
  const isAuthor = comment.authorId === currentUserId;
  const isComposerOpen = activeReplyCommentId === comment.id;

  // Avatar shrinks slightly at deeper levels (caps at w-6)
  const avatarCls = depth === 0 ? 'w-8 h-8 rounded-lg' : depth === 1 ? 'w-7 h-7 rounded-md' : 'w-6 h-6 rounded-md';
  // Bubble gets subtly lighter at deeper levels
  const bubbleCls = depth === 0
    ? 'bg-muted/40 border-border/25'
    : depth === 1
    ? 'bg-muted/30 border-border/20'
    : 'bg-muted/20 border-border/15';

  return (
    <div className={depth > 0 ? 'mt-2' : ''}>
      {/* Comment row */}
      <div className="flex gap-2.5 items-start">
        <Link to="/profile" search={{ userId: comment.authorId }} className={`${avatarCls} bg-secondary overflow-hidden shrink-0 border border-border/40 block hover:opacity-80 transition-opacity`}>
          <img
            src={(comment.author?.image || ((comment.author as any)?.role === 'company' ? `https://ui-avatars.com/api/?name=%F0%9F%92%BC&background=e2e8f0&color=94a3b8&size=1024` : 'https://www.gravatar.com/avatar/00000000000000000000000000000000?d=mp&f=y&s=1024'))}
            alt={comment.author?.name || 'avatar'}
            className="w-full h-full object-cover"
          />
        </Link>

        <div className="flex-1 min-w-0">
          {/* Bubble */}
          <div className={`border p-2.5 rounded-2xl ${bubbleCls}`}>
            <div className="flex justify-between items-start gap-2">
              <div className="min-w-0">
                <Link to="/profile" search={{ userId: comment.authorId }}>
                  <h6 className="font-bold text-[11px] hover:underline cursor-pointer truncate">
                    {comment.author?.name} {comment.author?.surname}
                  </h6>
                </Link>
                <p className="text-[9px] text-muted-foreground truncate">
                  {getAuthorSubtitle(comment.author)}
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

          {/* Actions */}
          <div className="flex items-center gap-2 mt-0.5 ml-1 text-[10px] text-muted-foreground font-semibold">
            {/* Like with emoji picker */}
            <div
              className="relative"
              onMouseEnter={() => onHoverEnter(comment.id)}
              onMouseLeave={onHoverLeave}
            >
              {hoveredCommentId === comment.id && (
                <div
                  onMouseEnter={() => onHoverEnter(comment.id)}
                  onMouseLeave={onHoverLeave}
                  className="absolute bottom-full left-0 mb-1 bg-card border border-border/60 p-1 rounded-full shadow-xl flex gap-1 items-center z-50 animate-in fade-in slide-in-from-bottom-1 duration-150"
                >
                  {Object.entries(EMOJI_TO_TYPE).map(([emoji, type]) => (
                    <button
                      key={type}
                      onClick={() => { onLike(comment.id, false, type); setHoveredCommentId(null); }}
                      className="text-base hover:scale-125 transition-transform p-0.5 rounded-full hover:bg-muted"
                    >
                      {emoji}
                    </button>
                  ))}
                </div>
              )}
              <button
                onClick={() => onLike(comment.id, isLiked, isLiked ? undefined : 'LIKE')}
                className={`hover:text-primary transition-colors ${isLiked ? 'text-teal-600 font-bold' : ''}`}
              >
                {isLiked ? (REACTION_EMOJIS[reactionType] + ' Beğenildi') : 'Beğen'}
              </button>
              {likesCount > 0 && (
                <span className="ml-1 font-normal text-muted-foreground/70">{likesCount}</span>
              )}
            </div>

            <span>•</span>

            {/* Yanıtla */}
            <button
              onClick={() => {
                if (isComposerOpen) {
                  setActiveReplyCommentId(null);
                } else {
                  setActiveReplyCommentId(comment.id);
                  setReplyTexts(prev => ({ ...prev, [comment.id]: '' }));
                }
              }}
              className={`hover:text-primary transition-colors ${isComposerOpen ? 'text-primary' : ''}`}
            >
              Yanıtla
            </button>
          </div>
        </div>
      </div>

      {/* Inline composer */}
      {isComposerOpen && (
        <div className="flex gap-2 items-center mt-2 ml-10 animate-in slide-in-from-top-1 duration-150">
          <div className="w-6 h-6 rounded-full bg-secondary overflow-hidden shrink-0 border border-border/40">
            {session?.user?.image ? (
              <img src={session.user.image} alt="you" className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full bg-primary/20 flex items-center justify-center text-primary font-bold text-[9px]">
                {userInitials}
              </div>
            )}
          </div>
          <div className="flex-1 flex gap-2">
            <input
              type="text"
              placeholder={`@${comment.author?.name || 'biri'} adlı kişiye yanıt...`}
              value={replyTexts[comment.id] || ''}
              onChange={(e) => setReplyTexts(prev => ({ ...prev, [comment.id]: e.target.value }))}
              onKeyDown={(e) => { if (e.key === 'Enter') onAddReply(postId, comment.id); }}
              autoFocus
              className="flex-1 bg-muted/65 border border-border/40 hover:border-border/80 focus:border-primary/80 focus:outline-none px-3 py-1.5 rounded-xl text-xs transition-colors"
            />
            <button
              onClick={() => onAddReply(postId, comment.id)}
              disabled={!replyTexts[comment.id]?.trim()}
              className="bg-primary text-primary-foreground hover:opacity-90 px-3 py-1.5 rounded-xl font-semibold text-[10px] transition-opacity disabled:opacity-50 shrink-0"
            >
              Yanıtla
            </button>
          </div>
        </div>
      )}

      {/* Nested replies — indented with border line */}
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

function HomeFeed() {
  const utils = trpc.useUtils();
  const { data: session } = useSession();
  const currentUserId = session?.user?.id;

  // States
  const [content, setContent] = useState('');
  // Uploaded media URL (from /api/upload)
  const [mediaUrl, setMediaUrl] = useState('');
  // Object URL for previewing selected media before upload
  const [mediaPreviewUrl, setMediaPreviewUrl] = useState('');
  const [isUploadingMedia, setIsUploadingMedia] = useState(false);
  const safeMediaPreviewUrl = toSafeImageUrl(mediaPreviewUrl);
  let SERVER_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';
  if (typeof window !== 'undefined' && window.location.hostname !== 'localhost' && !window.location.hostname.includes('192.168.')) {
    SERVER_URL = window.location.origin;
  }
  if (SERVER_URL.endsWith('/')) SERVER_URL = SERVER_URL.slice(0, -1);

  const handleUploadFile = async (file: File) => {
    setIsUploadingMedia(true);
    try {
      const preview = URL.createObjectURL(file);
      setMediaPreviewUrl(preview);
      const formData = new FormData();
      formData.append('file', file);
      const res = await fetch(`${SERVER_URL}/api/upload`, { method: 'POST', body: formData });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || 'Upload failed');
      setMediaUrl(data.url);
      console.log('[Upload] Success, url:', data.url);
    } catch (e) {
      console.error('Upload error:', e);
      toast.error('Medya yüklenemedi.');
      setMediaPreviewUrl('');
      setMediaUrl('');
    } finally {
      setIsUploadingMedia(false);
    }
  };
  const [sortBy, setSortBy] = useState<'recent' | 'top'>('recent');
  const [isComposerOpen, setIsComposerOpen] = useState(false);
  const [repostTarget, setRepostTarget] = useState<any | null>(null);
  
  // Post card interactive states
  const [activeCommentPostId, setActiveCommentPostId] = useState<string | null>(null);
  const [commentTexts, setCommentTexts] = useState<Record<string, string>>({});
  const [expandedPosts, setExpandedPosts] = useState<Record<string, boolean>>({});
  const [hoveredPostId, setHoveredPostId] = useState<string | null>(null);
  const [openMenuPostId, setOpenMenuPostId] = useState<string | null>(null);
  const [_editingPost, setEditingPost] = useState<any>(null);
  const [hoverTimeout, setHoverTimeout] = useState<NodeJS.Timeout | null>(null);

  // Comment replies states
  const [activeReplyCommentId, setActiveReplyCommentId] = useState<string | null>(null);
  const [replyTexts, setReplyTexts] = useState<Record<string, string>>({});

  const [reportModalOpen, setReportModalOpen] = useState(false);
  const [reportTarget, setReportTarget] = useState<{ type: 'USER' | 'POST' | 'COMMENT' | 'JOB', id: string } | null>(null);

  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [deleteTargetId, setDeleteTargetId] = useState<string | null>(null);

  // Comment/reply emoji picker hover state
  const [hoveredCommentId, setHoveredCommentId] = useState<string | null>(null);
  const [commentHoverTimeout, setCommentHoverTimeout] = useState<NodeJS.Timeout | null>(null);
  
  // Optimistic UI for following
  const [optimisticFollows, setOptimisticFollows] = useState<Set<string>>(new Set());

  const handleMouseEnter = (postId: string) => {
    if (hoverTimeout) clearTimeout(hoverTimeout);
    setHoveredPostId(postId);
  };

  const handleMouseLeave = () => {
    const timeout = setTimeout(() => {
      setHoveredPostId(null);
    }, 400);
    setHoverTimeout(timeout);
  };

  const handleCommentMouseEnter = (commentId: string) => {
    if (commentHoverTimeout) clearTimeout(commentHoverTimeout);
    setHoveredCommentId(commentId);
  };

  const handleCommentMouseLeave = () => {
    const timeout = setTimeout(() => {
      setHoveredCommentId(null);
    }, 400);
    setCommentHoverTimeout(timeout);
  };

   // Drag-and-drop handlers
   const [isDragging, setIsDragging] = useState(false);
   const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
     e.preventDefault();
     setIsDragging(true);
   };
   const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
     e.preventDefault();
     setIsDragging(false);
   };
   const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
     e.preventDefault();
     setIsDragging(false);
     const files = e.dataTransfer.files;
     if (files && files.length > 0) {
       handleUploadFile(files[0]);
       setIsComposerOpen(true);
     }
   };
   // Queries
  const { data: profile } = trpc.profile.getByUserId.useQuery(
    { userId: currentUserId || '' },
    { enabled: !!currentUserId }
  );

  const { data: connections } = trpc.connection.getMyConnections.useQuery(
    { userId: currentUserId || '' },
    { enabled: !!currentUserId }
  );

  const { 
    data: feedData, 
    isLoading: isFeedLoading,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage
  } = trpc.post.getFeed.useInfiniteQuery({
    currentUserId: currentUserId,
    limit: 10
  }, {
    getNextPageParam: (lastPage) => lastPage.nextCursor
  });

  const getSortedFeed = () => {
    if (!feedData?.pages) return [];
    const items = feedData.pages.flatMap(p => p.items);
    if (sortBy === 'top') {
      return items.sort((a: any, b: any) => (b._count?.likes || 0) - (a._count?.likes || 0));
    }
    return items;
  };

  const observer = React.useRef<IntersectionObserver | null>(null);
  const loadMoreRef = React.useCallback(
    (node: HTMLDivElement | null) => {
      if (isFetchingNextPage) return;
      if (observer.current) observer.current.disconnect();

      const rootElement = node ? node.closest('.overflow-y-auto') : null;

      observer.current = new IntersectionObserver(
        (entries) => {
          if (entries[0].isIntersecting && hasNextPage) {
            fetchNextPage();
          }
        },
        { 
          root: rootElement,
          rootMargin: '100px',
          threshold: 0.1 
        }
      );

      if (node) observer.current.observe(node);
    },
    [isFetchingNextPage, hasNextPage, fetchNextPage]
  );

  const { data: suggestions } = trpc.connection.getSuggestions.useQuery(
    { currentUserId: currentUserId || '' },
    { enabled: !!currentUserId }
  );

  const followMutation = trpc.connection.follow.useMutation({
    onSuccess: () => {
      utils.connection.getSuggestions.invalidate();
      toast.success('Kullanıcı takip ediliyor!');
    }
  });

  // Mutations
  const createPost = trpc.post.create.useMutation({
    onSuccess: () => {
      // toast.success('Gönderi paylaşıldı!');
      setContent('');
      setMediaUrl('');
      setMediaPreviewUrl('');
      setRepostTarget(null);
      setIsComposerOpen(false);
      utils.post.getFeed.invalidate();
    },
    onError: (err) => {
      console.error(err);
      toast.error('Gönderi oluşturulamadı.');
    }
  });

  const deletePost = trpc.post.delete.useMutation({
    onSuccess: () => {
      toast.success('Gönderi silindi.');
      utils.post.getFeed.invalidate();
    },
    onError: (err) => {
      console.error(err);
      toast.error('Gönderi silinirken bir hata oluştu.');
    }
  });

  const likePost = trpc.post.like.useMutation({
    onSuccess: () => {
      utils.post.getFeed.invalidate();
    },
    onError: (err) => {
      console.error(err);
    }
  });

  const unlikePost = trpc.post.unlike.useMutation({
    onSuccess: () => {
      utils.post.getFeed.invalidate();
    },
    onError: (err) => {
      console.error(err);
    }
  });

  const addComment = trpc.post.addComment.useMutation({
    onSuccess: () => {
      toast.success('Yorum eklendi!');
      utils.post.getFeed.invalidate();
    },
    onError: (err) => {
      console.error(err);
      toast.error('Yorum eklenemedi.');
    }
  });

  const deleteComment = trpc.post.deleteComment.useMutation({
    onSuccess: () => {
      toast.success('Yorum silindi.');
      utils.post.getFeed.invalidate();
    },
    onError: (err) => {
      console.error(err);
      toast.error('Yorum silinemedi.');
    }
  });

  const likeComment = trpc.post.likeComment.useMutation({
    onSuccess: () => {
      utils.post.getFeed.invalidate();
    },
    onError: (err) => {
      console.error(err);
    }
  });

  const unlikeComment = trpc.post.unlikeComment.useMutation({
    onSuccess: () => {
      utils.post.getFeed.invalidate();
    },
    onError: (err) => {
      console.error(err);
    }
  });

  const createReport = trpc.user.createReport.useMutation({
    onSuccess: () => {
      toast.success('Şikayetiniz alındı, teşekkürler.');
    },
    onError: (err) => {
      console.error(err);
      toast.error('Şikayet gönderilemedi.');
    }
  });

  // Actions handlers
  const handleCreatePost = () => {
    if (!currentUserId) return;
    if (isUploadingMedia) { toast.error('Medya yükleniyor, lütfen bekleyin.'); return; }
    createPost.mutate({
      authorId: currentUserId,
      content,
      mediaUrl: mediaUrl || undefined,
      originalPostId: repostTarget?.id || undefined
    });
  };

  const handleLikeToggle = (postId: string, isLiked: boolean, reactionType?: string) => {
    if (!currentUserId) {
      toast.error('Lütfen önce giriş yapın.');
      return;
    }
    if (isLiked && !reactionType) {
      unlikePost.mutate({ postId, userId: currentUserId });
    } else {
      likePost.mutate({ postId, userId: currentUserId, type: reactionType || 'LIKE' });
    }
  };

  const handleAddComment = (postId: string) => {
    const text = commentTexts[postId]?.trim();
    if (!text || !currentUserId) return;

    addComment.mutate({
      postId,
      authorId: currentUserId,
      content: text
    });

    setCommentTexts(prev => ({ ...prev, [postId]: '' }));
  };

  const handleAddReply = (postId: string, rootCommentId: string) => {
    const text = replyTexts[rootCommentId]?.trim();
    if (!text || !currentUserId) return;

    addComment.mutate({
      postId,
      authorId: currentUserId,
      content: text,
      parentCommentId: rootCommentId // always the top-level comment
    });

    setReplyTexts(prev => ({ ...prev, [rootCommentId]: '' }));
    setActiveReplyCommentId(null);
  };

  const handleCommentLikeToggle = (commentId: string, isLiked: boolean, reactionType?: string) => {
    if (!currentUserId) {
      toast.error('Lütfen önce giriş yapın.');
      return;
    }
    if (isLiked && !reactionType) {
      unlikeComment.mutate({ commentId, userId: currentUserId });
    } else {
      likeComment.mutate({ commentId, userId: currentUserId, type: reactionType || 'LIKE' });
    }
  };

  const handleRepostInstantly = (postId: string) => {
    if (!currentUserId) return;
    createPost.mutate({
      authorId: currentUserId,
      originalPostId: postId,
      content: 'repost'
    });
  };

  const handleOpenRepostWithQuote = (post: any) => {
    setRepostTarget(post);
    setIsComposerOpen(true);
  };

  const toggleExpandText = (postId: string) => {
    setExpandedPosts(prev => ({ ...prev, [postId]: !prev[postId] }));
  };



  const sortedFeed = getSortedFeed();

  // User details
  const name = session?.user?.name || 'Kullanıcı';
  const surname = (session?.user as any)?.surname || '';
  const initials = (name[0] + (surname[0] || '')).toUpperCase();
  const headline = profile?.bio || ((session?.user as any)?.role === 'company' ? `${(session?.user as any)?.sector || 'Şirket'}` : 'CollabSwipe Üyesi');

  if (!session) {
    return <LandingPage />;
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 w-full pb-20 md:pb-10">
      
      {/* LEFT SIDEBAR: PROFILE SUMMARY */}
      <aside className="lg:col-span-3 flex flex-col gap-4">
      </aside>

      {/* MIDDLE SECTION: COMPOSER & FEED */}
      <section className="lg:col-span-6 flex flex-col gap-4">
        
<div 
  className={`bg-card/70 backdrop-blur-md border rounded-2xl p-4 shadow-lg shadow-shadow/5 transition-all duration-300 ${isDragging ? 'border-primary border-2 border-dashed bg-primary/5' : 'border-border/55'}`}
  onDrop={handleDrop} 
  onDragOver={handleDragOver} 
  onDragLeave={handleDragLeave}
>
  <div className="flex gap-3 items-center">
    <div className="w-10 h-10 rounded-xl bg-secondary overflow-hidden shrink-0 border border-border/50">
      {session?.user?.image ? (
        <img src={session.user.image} alt={name} className="w-full h-full object-cover" />
      ) : (
        <div className="w-full h-full bg-primary/20 flex items-center justify-center text-primary font-bold">
          {initials}
        </div>
      )}
    </div>
    <button
      onClick={() => {
        setRepostTarget(null);
        setIsComposerOpen(true);
      }}
      className="flex-1 bg-muted/40 hover:bg-muted/80 text-left px-6 py-4 rounded-full text-sm font-medium text-muted-foreground border border-border/40 hover:border-border/80 shadow-sm transition-all duration-200 cursor-text"
    >
      Ne düşünüyorsunuz? Bir gönderi başlatın...
    </button>
    {/* Hidden file input for media selection */}
    <input
      type="file"
      accept="image/*"
      style={{ display: 'none' }}
      id="mediaFileInput"
      onChange={e => {
        const file = e.target.files?.[0];
        if (!file) return;
        handleUploadFile(file);
      }}
    />
  </div>
</div>

        {createPost.isPending && (
          <div className="bg-card/70 backdrop-blur-md border border-border/55 rounded-xl p-3 flex items-center justify-between shadow-sm animate-pulse">
            <span className="text-sm font-medium text-foreground">Gönderi paylaşılıyor...</span>
            <div className="w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin"></div>
          </div>
        )}

        {/* FEED FILTER BAR */}
        <div className="flex items-center justify-between px-2">
          <div className="h-px bg-border flex-1" />
          <div className="flex items-center gap-2 text-xs font-semibold text-muted-foreground shrink-0 pl-4">
            <span>Sıralama ölçütü:</span>
            <button 
              onClick={() => setSortBy('recent')} 
              className={`hover:text-primary transition-colors ${sortBy === 'recent' ? 'text-primary underline font-bold' : ''}`}
            >
              En Yeni
            </button>
            <span>|</span>
            <button 
              onClick={() => setSortBy('top')} 
              className={`hover:text-primary transition-colors ${sortBy === 'top' ? 'text-primary underline font-bold' : ''}`}
            >
              En Popüler
            </button>
          </div>
        </div>

        {/* MAIN FEED LIST */}
        <div className="space-y-4">
          {isFeedLoading ? (
            <div className="flex flex-col items-center justify-center py-16 gap-3">
              <div className="w-8 h-8 border-3 border-primary border-t-transparent rounded-full animate-spin" />
              <span className="text-sm text-muted-foreground">Gönderiler yükleniyor...</span>
            </div>
          ) : sortedFeed.length > 0 ? (
            sortedFeed.map((post: any) => {
              const isLiked = post.likes && post.likes.length > 0;
              const hasOriginal = !!post.originalPost;
              const isAuthor = post.authorId === currentUserId;
              const isExpanded = expandedPosts[post.id] || false;
              const textLimit = 300;
              const contentToRender = post.content === 'repost' && hasOriginal ? '' : post.content;
              const showSeeMore = contentToRender.length > textLimit && !isExpanded;

              return (
                <div key={post.id} className="bg-card/70 backdrop-blur-md border border-border/55 rounded-2xl p-4 shadow-lg shadow-shadow/5 hover:border-border transition-all duration-300">
                  
                  {/* Post Header */}
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <Link to="/profile" search={{ userId: post.authorId }} className="w-11 h-11 rounded-xl bg-secondary overflow-hidden shrink-0 border border-border/40 block hover:opacity-80 transition-opacity">
                        <img 
                          src={(post.author?.image || ((post.author as any)?.role === 'company' ? `https://ui-avatars.com/api/?name=%F0%9F%92%BC&background=e2e8f0&color=94a3b8&size=1024` : 'https://www.gravatar.com/avatar/00000000000000000000000000000000?d=mp&f=y&s=1024'))} 
                          alt="avatar" 
                          className="w-full h-full object-cover" 
                        />
                      </Link>
                      <div>
                        <div className="flex items-center gap-2">
                          <Link to="/profile" search={{ userId: post.authorId }}>
                            <h4 className="font-bold text-foreground text-[15px] hover:underline cursor-pointer">
                              {post.author?.name} {post.author?.surname}
                            </h4>
                          </Link>
                          {post.isQuarantined && (
                            <span className="bg-red-500/10 text-red-500 border border-red-500/20 px-2 py-0.5 rounded text-[10px] font-bold">İnceleniyor (Gizlendi)</span>
                          )}
                          {post.editRequestedAt && post.authorId === currentUserId && (
                            <span className="text-[10px] bg-orange-500/10 text-orange-500 px-2 py-0.5 rounded-full border border-orange-500/20 flex items-center gap-1 font-bold">
                              Düzenleme Gerekli
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-muted-foreground line-clamp-1">
                          {getAuthorSubtitle(post.author)}
                        </p>
                        <p className="text-[10px] text-muted-foreground flex items-center gap-1 mt-0.5">
                          <Clock className="w-3 h-3" />
                          {formatRelativeTime(post.createdAt)}
                        </p>
                      </div>
                    </div>

                    {/* Menu button */}
                    <div className="relative">
                      <button 
                        onClick={() => setOpenMenuPostId(openMenuPostId === post.id ? null : post.id)}
                        className="p-1.5 hover:bg-muted rounded-lg text-muted-foreground hover:text-foreground transition-colors"
                      >
                        <MoreHorizontal className="w-5 h-5" />
                      </button>

                      {openMenuPostId === post.id && (
                        <div className="absolute right-0 mt-1 w-40 bg-card border border-border rounded-xl shadow-xl z-20 overflow-hidden py-1">
                          {isAuthor && (
                            <>
                              <button 
                                onClick={() => {
                                  setEditingPost(post);
                                  setOpenMenuPostId(null);
                                }}
                                className="w-full px-4 py-2 text-left text-xs hover:bg-muted font-medium flex items-center gap-2 transition-colors"
                              >
                                <Edit3 className="w-4 h-4" /> Düzenle
                              </button>
                              <button 
                                onClick={() => {
                                  setDeleteTargetId(post.id);
                                  setDeleteModalOpen(true);
                                  setOpenMenuPostId(null);
                                }}
                                className="w-full px-4 py-2 text-left text-xs text-destructive hover:bg-destructive/10 font-medium flex items-center gap-2 transition-colors"
                              >
                                <Trash2 className="w-4 h-4" /> Gönderiyi Sil
                              </button>
                            </>
                          )}
                          <button 
                            onClick={() => {
                              navigator.clipboard.writeText(window.location.origin + `/posts/${post.id}`);
                              toast.success('Bağlantı kopyalandı!');
                              setOpenMenuPostId(null);
                            }}
                            className="w-full px-4 py-2 text-left text-xs hover:bg-muted font-medium flex items-center gap-2 transition-colors"
                          >
                            <Send className="w-4 h-4" /> Bağlantıyı Kopyala
                          </button>
                          {!isAuthor && (
                            <button 
                              onClick={() => {
                                setReportTarget({ type: 'POST', id: post.id });
                                setReportModalOpen(true);
                                setOpenMenuPostId(null);
                              }}
                              className="w-full px-4 py-2 text-left text-xs text-orange-500 hover:bg-orange-500/10 font-medium flex items-center gap-2 transition-colors"
                            >
                              <FileWarning className="w-4 h-4" /> Şikayet Et
                            </button>
                          )}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Post Content */}
                  <div className="space-y-3 mb-4">
                    {contentToRender && (
                      <p className="text-foreground text-sm leading-relaxed whitespace-pre-line">
                        <FormattedText text={showSeeMore ? `${contentToRender.slice(0, textLimit)}...` : contentToRender} />
                        {showSeeMore && (
                          <button 
                            onClick={() => toggleExpandText(post.id)}
                            className="text-primary hover:underline font-semibold ml-2 inline-block focus:outline-none"
                          >
                            Daha fazla göster
                          </button>
                        )}
                        {!showSeeMore && contentToRender.length > textLimit && (
                          <button 
                            onClick={() => toggleExpandText(post.id)}
                            className="text-primary hover:underline font-semibold ml-2 inline-block focus:outline-none text-xs"
                          >
                            Daha az göster
                          </button>
                        )}
                      </p>
                    )}

                    {/* Media Preview */}
                    {post.mediaUrl && (
                      <div className="rounded-xl overflow-hidden border border-border/40 shadow-sm max-h-96 bg-muted/10">
                        <img src={post.mediaUrl} alt="post attachment" className="w-full h-full object-cover" />
                      </div>
                    )}

                    {/* NESTED ORIGINAL POST (REPOST) */}
                    {hasOriginal && (
                      <div className="border border-border/60 bg-muted/10 rounded-xl p-4 space-y-3">
                        <div className="flex items-center gap-3">
                          <Link to="/profile" search={{ userId: post.originalPost?.authorId }} className="w-8 h-8 rounded-lg bg-secondary overflow-hidden shrink-0 border border-border/40 hover:opacity-80 transition-opacity">
                            <img 
                              src={(post.originalPost?.author?.image || ((post.originalPost?.author as any)?.role === 'company' ? `https://ui-avatars.com/api/?name=%F0%9F%92%BC&background=e2e8f0&color=94a3b8&size=1024` : 'https://www.gravatar.com/avatar/00000000000000000000000000000000?d=mp&f=y&s=1024'))} 
                              alt="avatar" 
                              className="w-full h-full object-cover" 
                            />
                          </Link>
                          <div>
                            <Link to="/profile" search={{ userId: post.originalPost?.authorId }}>
                              <h5 className="font-bold text-foreground text-xs hover:underline cursor-pointer">
                                {post.originalPost?.author?.name} {post.originalPost?.author?.surname}
                              </h5>
                            </Link>
                            <p className="text-[10px] text-muted-foreground line-clamp-1">
                              {getAuthorSubtitle(post.originalPost?.author)}
                            </p>
                          </div>
                        </div>
                        <p className="text-foreground/90 text-sm leading-relaxed mb-3">
                          <FormattedText text={post.originalPost?.content || ''} />
                        </p>
                        {post.originalPost?.mediaUrl && (
                          <div className="rounded-lg overflow-hidden border border-border/40 max-h-60 bg-muted/10">
                            <img src={post.originalPost?.mediaUrl} alt="original attachment" className="w-full h-full object-cover" />
                          </div>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Post Stats */}
                  <div className="flex items-center justify-between text-xs text-muted-foreground pb-2 border-b border-border/50">
                    <div className="flex items-center gap-1.5">
                      <span className="flex items-center -space-x-1 select-none">
                        {(post as any).reactionTypes && (post as any).reactionTypes.length > 0 ? (
                          (post as any).reactionTypes.slice(0, 3).map((type: string) => {
                            const reactionMap: Record<string, string> = {
                              LIKE: '👍',
                              LOVE: '❤️',
                              CELEBRATE: '👏',
                              INSIGHTFUL: '💡',
                              CURIOUS: '🤔'
                            };
                            return (
                              <span key={type} className="flex items-center justify-center w-5 h-5 bg-card border border-border/20 rounded-full text-[11px] shadow-sm">
                                {reactionMap[type] || '👍'}
                              </span>
                            );
                          })
                        ) : (
                          <span className="flex items-center justify-center w-5 h-5 bg-teal-500/10 text-teal-600 rounded-full text-[10px] font-bold">👍</span>
                        )}
                      </span>
                      <span className="hover:text-primary hover:underline cursor-pointer">{post._count?.likes || 0} beğeni</span>
                    </div>
                    <div className="flex gap-3">
                      <button 
                        onClick={() => setActiveCommentPostId(activeCommentPostId === post.id ? null : post.id)}
                        className="hover:text-primary hover:underline"
                      >
                        {post._count?.comments || 0} yorum
                      </button>
                      <span>•</span>
                      <span>{post._count?.reposts || 0} paylaşım</span>
                    </div>
                  </div>

                  {/* Post Action Buttons */}
                  <div className="flex items-center justify-between pt-2 text-muted-foreground text-xs md:text-sm font-semibold relative">
                    {/* Hover Reaction Tooltip Area */}
                    <div 
                      className="relative flex-1 flex justify-center"
                      onMouseEnter={() => handleMouseEnter(post.id)}
                      onMouseLeave={handleMouseLeave}
                    >
                      {(() => {
                        const currentUserLike = post.likes?.[0];
                        const activeReactionType = currentUserLike?.type || 'LIKE';
                        const reactionUiMap: Record<string, { label: string; icon: string; colorClass: string }> = {
                          LIKE: { label: 'Beğen', icon: '👍', colorClass: 'text-teal-600' },
                          LOVE: { label: 'Destekle', icon: '❤️', colorClass: 'text-red-500 font-bold' },
                          CELEBRATE: { label: 'Kutla', icon: '👏', colorClass: 'text-green-600 font-bold' },
                          INSIGHTFUL: { label: 'Bilgilendirici', icon: '💡', colorClass: 'text-amber-500 font-bold' },
                          CURIOUS: { label: 'Merak Ettim', icon: '🤔', colorClass: 'text-purple-600 font-bold' }
                        };
                        const activeUi = reactionUiMap[activeReactionType] || reactionUiMap.LIKE;

                        return (
                          <button 
                            onClick={() => handleLikeToggle(post.id, isLiked, isLiked ? undefined : 'LIKE')}
                            className={`w-full py-2.5 rounded-xl hover:bg-muted/80 flex items-center justify-center gap-2 transition-colors ${isLiked ? activeUi.colorClass : 'hover:text-foreground'}`}
                          >
                            {isLiked ? (
                              <span className="text-base select-none">{activeUi.icon}</span>
                            ) : (
                              <ThumbsUp className="w-4 h-4" />
                            )}
                            <span>{isLiked ? activeUi.label : 'Beğen'}</span>
                          </button>
                        );
                      })()}

                      {/* Micro-reaction popover */}
                      {hoveredPostId === post.id && (
                        <div 
                          onMouseEnter={() => { if (hoverTimeout) clearTimeout(hoverTimeout); }}
                          onMouseLeave={handleMouseLeave}
                          className="absolute bottom-full left-1/2 -translate-x-1/2 mb-1.5 bg-card border border-border/60 p-1.5 rounded-full shadow-2xl flex gap-2 items-center z-30 animate-in fade-in slide-in-from-bottom-2 duration-200"
                        >
                          {['👍', '👏', '❤️', '💡', '🤔'].map((emoji) => {
                            const emojiToTypeMap: Record<string, string> = {
                              '👍': 'LIKE',
                              '👏': 'CELEBRATE',
                              '❤️': 'LOVE',
                              '💡': 'INSIGHTFUL',
                              '🤔': 'CURIOUS'
                            };
                            return (
                              <button 
                                key={emoji}
                                onClick={() => {
                                  handleLikeToggle(post.id, false, emojiToTypeMap[emoji]);
                                  setHoveredPostId(null);
                                }}
                                className="text-xl hover:scale-130 active:scale-95 transition-transform p-1 rounded-full hover:bg-muted duration-150"
                              >
                                {emoji}
                              </button>
                            );
                          })}
                        </div>
                      )}
                    </div>

                    <button 
                      onClick={() => setActiveCommentPostId(activeCommentPostId === post.id ? null : post.id)}
                      className="flex-1 py-2.5 rounded-xl hover:bg-muted/80 flex items-center justify-center gap-2 hover:text-foreground transition-colors"
                    >
                      <MessageSquare className="w-4 h-4" />
                      <span>Yorum yap</span>
                    </button>

                    {/* Repost Dropdown Trigger */}
                    <div className="flex-1 relative flex justify-center">
                      <button 
                        onClick={() => handleOpenRepostWithQuote(post)}
                        className="w-full py-2.5 rounded-xl hover:bg-muted/80 flex items-center justify-center gap-2 hover:text-foreground transition-colors"
                      >
                        <Repeat2 className="w-4 h-4" />
                        <span>Paylaş</span>
                      </button>
                    </div>

                    <button 
                      onClick={() => {
                        navigator.clipboard.writeText(window.location.origin + `/posts/${post.id}`);
                        toast.success('Gönderi bağlantısı kopyalandı!');
                      }}
                      className="flex-1 py-2.5 rounded-xl hover:bg-muted/80 flex items-center justify-center gap-2 hover:text-foreground transition-colors"
                    >
                      <Send className="w-4 h-4" />
                      <span>Gönder</span>
                    </button>
                  </div>

                  {/* COMMENTS SECTION */}
                  {activeCommentPostId === post.id && (
                    <div className="mt-4 pt-4 border-t border-border/50 space-y-4">
                      {/* Comment Composer */}
                      <div className="flex gap-3">
                        <div className="w-8 h-8 rounded-lg bg-secondary overflow-hidden shrink-0 border border-border/40">
                          {session?.user?.image ? (
                            <img src={session.user.image} alt={name} className="w-full h-full object-cover" />
                          ) : (
                            <div className="w-full h-full bg-primary/20 flex items-center justify-center text-primary font-bold text-xs">
                              {initials}
                            </div>
                          )}
                        </div>
                        <div className="flex-1 flex gap-2">
                          <MentionInput 
                            placeholder="Yorum ekle..."
                            value={commentTexts[post.id] || ''}
                            onChange={(val) => setCommentTexts(prev => ({ ...prev, [post.id]: val }))}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') handleAddComment(post.id);
                            }}
                            className="w-full bg-muted/60 border border-border/40 hover:border-border/80 focus:border-primary/80 focus:outline-none px-3 py-2 rounded-xl text-sm transition-colors"
                          />
                          <button 
                            onClick={() => handleAddComment(post.id)}
                            disabled={!commentTexts[post.id]?.trim()}
                            className="bg-primary text-primary-foreground hover:opacity-90 px-3.5 py-2 rounded-xl font-semibold text-xs transition-opacity disabled:opacity-50 shrink-0"
                          >
                            Yorumla
                          </button>
                        </div>
                      </div>

                      {/* Comments List — recursive tree */}
                      <div className="space-y-4 pl-1">
                        {post.comments && post.comments.length > 0 ? (
                          post.comments.map((comment: any) => (
                            <CommentNode
                              key={comment.id}
                              comment={comment}
                              depth={0}
                              ctx={{
                                postId: post.id,
                                currentUserId,
                                activeReplyCommentId,
                                setActiveReplyCommentId,
                                replyTexts,
                                setReplyTexts,
                                hoveredCommentId,
                                setHoveredCommentId,
                                onHoverEnter: handleCommentMouseEnter,
                                onHoverLeave: handleCommentMouseLeave,
                                onLike: handleCommentLikeToggle,
                                onAddReply: handleAddReply,
                                onDelete: (commentId) => deleteComment.mutate({ commentId }),
                                session,
                                userInitials: initials,
                              }}
                            />
                          ))
                        ) : (
                          <div className="text-center py-4 text-xs text-muted-foreground">
                            Henüz yorum yok. İlk yorumu sen yaz!
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              );
            })
          ) : (
            <div className="bg-card border border-border rounded-2xl p-8 text-center text-muted-foreground text-sm">
              <AlertCircle className="w-8 h-8 mx-auto mb-2 text-muted-foreground/60" />
              <span>Henüz akışınızda gönderi bulunmuyor. Keşfet sekmesinden yeni insanları takip edebilirsiniz!</span>
            </div>
          )}
        </div>
      </section>

      {/* RIGHT SIDEBAR: NEWS & RECOMMENDATIONS */}
      <aside className="lg:col-span-3 flex flex-col gap-4">
        {/* Suggested Connections Card */}
        <div className="bg-card/70 backdrop-blur-md border border-border/55 rounded-2xl p-4 shadow-lg shadow-shadow/5">
          <div className="flex justify-between items-center mb-3">
            <h3 className="font-bold text-sm text-foreground flex items-center gap-1.5"><Users className="w-4 h-4 text-primary" /> Ağınıza Ekleyebileceğiniz Kişiler</h3>
          </div>
          <div className="flex flex-col gap-3 relative">
            {suggestions?.filter(u => !optimisticFollows.has(u.id)).map((user) => (
              <div key={user.id} className="flex items-center justify-between gap-2 hover:bg-muted/40 p-1.5 rounded-xl transition-all duration-300 animate-in fade-in slide-in-from-right-4">
                <Link to="/profile" search={{ userId: user.id }} className="flex items-center gap-2 min-w-0 flex-1">
                  <div className="w-9 h-9 rounded-full bg-secondary overflow-hidden shrink-0 border border-border/40">
                    <img 
                      src={(user?.image || ((user as any)?.role === 'company' ? `https://ui-avatars.com/api/?name=%F0%9F%92%BC&background=e2e8f0&color=94a3b8&size=1024` : 'https://www.gravatar.com/avatar/00000000000000000000000000000000?d=mp&f=y&s=1024'))} 
                      alt={user.name || 'User'} 
                      className="w-full h-full object-cover" 
                    />
                  </div>
                  <div className="min-w-0">
                    <h4 className="text-xs font-bold leading-normal text-foreground truncate hover:underline hover:text-primary transition-colors">
                      {user.name} {user.surname}
                    </h4>
                    <p className="text-[10px] text-muted-foreground mt-0.5 truncate">
                      {user.profile?.bio || user.sector || 'CollabSwipe Üyesi'}
                    </p>
                  </div>
                </Link>
                <button 
                  onClick={() => {
                    setOptimisticFollows(prev => new Set(prev).add(user.id));
                    followMutation.mutate({ followerId: currentUserId || '', followingId: user.id });
                  }}
                  className="shrink-0 bg-primary/10 hover:bg-primary/20 text-primary p-1.5 rounded-full transition-all active:scale-90"
                  title="Takip Et"
                >
                  <UserPlus className="w-4 h-4" />
                </button>
              </div>
            ))}
            {(!suggestions || suggestions.filter(u => !optimisticFollows.has(u.id)).length === 0) && (
              <p className="text-xs text-muted-foreground text-center py-2 animate-in fade-in">Şu an için yeni öneri bulunmuyor.</p>
            )}
          </div>
        </div>

        {/* Info Card */}
        <div className="bg-card/70 backdrop-blur-md border border-border/55 rounded-2xl p-4 shadow-lg shadow-shadow/5 text-[11px] text-muted-foreground leading-normal space-y-2 text-center lg:text-left">
          <div className="flex flex-wrap gap-x-2 gap-y-1 justify-center lg:justify-start">
            <Link to="/about" className="hover:text-primary hover:underline transition-colors">Hakkında</Link>
            <a href="#" className="hover:text-primary hover:underline transition-colors">Gizlilik ve Koşullar</a>
          </div>
          <div className="text-center pt-2 border-t border-border/30">
            <p className="font-semibold text-foreground/80">CollabSwipe © 2026</p>
          </div>
        </div>
      </aside>

      {/* COMPOSER MODAL (POPUP DIALOG) */}
      {isComposerOpen && (
        <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-card border border-border/70 rounded-2xl shadow-2xl max-w-lg w-full flex flex-col overflow-hidden max-h-[90vh] animate-in zoom-in-95 duration-200">
            {/* Modal Header */}
            <div className="flex items-center justify-between px-5 py-4 border-b border-border/50">
              <h3 className="font-bold text-lg text-foreground">
                {repostTarget ? 'Gönderiyi Paylaş' : 'Gönderi Oluştur'}
              </h3>
              <button 
                onClick={() => {
                  setIsComposerOpen(false);
                  setRepostTarget(null);
                }}
                className="p-1.5 hover:bg-muted rounded-lg text-muted-foreground hover:text-foreground transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body */}
            <div 
              className={`p-5 flex-1 overflow-y-auto space-y-4 transition-all duration-300 ${isDragging ? 'bg-primary/5 border-2 border-dashed border-primary m-2 rounded-xl' : ''}`}
              onDrop={handleDrop} 
              onDragOver={handleDragOver} 
              onDragLeave={handleDragLeave}
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-secondary overflow-hidden shrink-0 border border-border/40">
                  <img 
                    src={(session?.user?.image || ((session?.user as any)?.role === 'company' ? `https://ui-avatars.com/api/?name=%F0%9F%92%BC&background=e2e8f0&color=94a3b8&size=1024` : 'https://www.gravatar.com/avatar/00000000000000000000000000000000?d=mp&f=y&s=1024'))} 
                    alt="avatar" 
                    className="w-full h-full object-cover" 
                  />
                </div>
                <div>
                  <h4 className="font-bold text-sm">{name} {surname}</h4>
                  <div className="flex items-center gap-1 text-[10px] text-muted-foreground px-2 py-0.5 border border-border/50 rounded-full bg-muted/40 w-fit mt-0.5">
                    <Globe className="w-3 h-3" />
                    <span>Herkes</span>
                  </div>
                </div>
              </div>

              {/* Text Area */}
              <MentionTextarea 
                placeholder={repostTarget ? "Bu paylaşım hakkında ne düşünüyorsunuz?" : "Neler düşünüyorsunuz? Bir güncelleme paylaşın..."}
                value={content}
                onChange={(val) => setContent(val)}
                className="w-full min-h-[120px] bg-transparent resize-none focus:outline-none text-sm placeholder:text-muted-foreground/75 leading-relaxed"
                autoFocus
              />

              {/* Media Preview (if selected via drag-and-drop or file input) */}
              {!repostTarget && safeMediaPreviewUrl && (
                <div className="space-y-2">
                  <div className="rounded-xl overflow-hidden border border-border/40 max-h-40 bg-muted/10 relative group">
                    <img src={safeMediaPreviewUrl} alt="preview" className="w-full h-full object-cover" />
                    <button 
                      onClick={() => {
                        setMediaPreviewUrl('');
                        setMediaUrl('');
                      }}
                      className="absolute top-2 right-2 p-1 bg-black/60 hover:bg-black/80 text-white rounded-full transition-colors"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              )}

              {/* NESTED PREVIEW IN COMPOSER FOR REPOST */}
              {repostTarget && (
                <div className="border border-border/60 bg-muted/15 rounded-xl p-4 space-y-2 pointer-events-none">
                  <div className="flex items-center gap-2">
                    <div className="w-7 h-7 rounded bg-secondary overflow-hidden shrink-0 border border-border/40">
                      <img 
                        src={(repostTarget.author?.image || ((repostTarget.author as any)?.role === 'company' ? `https://ui-avatars.com/api/?name=%F0%9F%92%BC&background=e2e8f0&color=94a3b8&size=1024` : 'https://www.gravatar.com/avatar/00000000000000000000000000000000?d=mp&f=y&s=1024'))} 
                        alt="avatar" 
                        className="w-full h-full object-cover" 
                      />
                    </div>
                    <div>
                      <h5 className="font-bold text-[11px]">
                        {repostTarget.author?.name} {repostTarget.author?.surname}
                      </h5>
                      <p className="text-[9px] text-muted-foreground line-clamp-1">
                        {getAuthorSubtitle(repostTarget.author)}
                      </p>
                    </div>
                  </div>
                  <p className="text-foreground/90 text-xs leading-normal line-clamp-3">
                    {repostTarget.content === 'repost' && repostTarget.originalPost ? repostTarget.originalPost?.content : repostTarget.content}
                  </p>
                  {repostTarget.mediaUrl && (
                    <div className="rounded overflow-hidden border border-border/40 max-h-32 bg-muted/10">
                      <img src={repostTarget.mediaUrl} alt="repost preview" className="w-full h-full object-cover" />
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="px-5 py-4 border-t border-border/50 flex justify-between items-center bg-muted/15">
              <div className="flex gap-2 text-muted-foreground">
                <button 
                  onClick={() => {
                    const input = document.getElementById('mediaFileInput') as HTMLInputElement;
                    input?.click();
                  }}
                  disabled={!!repostTarget}
                  className="p-2 hover:bg-muted rounded-xl transition-colors disabled:opacity-40"
                >
                  <ImageIcon className="w-5 h-5" />
                </button>
                <button 
                  disabled
                  className="p-2 hover:bg-muted rounded-xl transition-colors opacity-45"
                >
                  <Video className="w-5 h-5" />
                </button>
              </div>

              <div className="flex gap-3">
                <button 
                  onClick={() => {
                    setIsComposerOpen(false);
                    setRepostTarget(null);
                  }}
                  className="px-4 py-2 border border-border rounded-xl text-sm font-semibold hover:bg-muted transition-colors"
                >
                  İptal
                </button>
                <button 
                  onClick={handleCreatePost}
                  disabled={createPost.isLoading || (!content.trim() && !mediaPreviewUrl.trim() && !repostTarget)}
                  className="bg-primary text-primary-foreground hover:opacity-90 px-5 py-2 rounded-xl font-bold text-sm transition-opacity disabled:opacity-50 flex items-center gap-1.5"
                >
                  {createPost.isLoading ? 'Paylaşılıyor...' : 'Paylaş'}
                  <Send className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      <ReportModal 
        isOpen={reportModalOpen} 
        onClose={() => setReportModalOpen(false)} 
        targetType={reportTarget?.type || 'POST'} 
        targetId={reportTarget?.id || ''} 
      />

      {/* Delete Post Modal */}
      {deleteModalOpen && deleteTargetId && (
        <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-card border border-border/70 rounded-2xl shadow-2xl max-w-sm w-full flex flex-col overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="p-6 text-center space-y-4">
              <div className="w-12 h-12 rounded-full bg-destructive/10 text-destructive flex items-center justify-center mx-auto">
                <Trash2 className="w-6 h-6" />
              </div>
              <h3 className="font-bold text-lg text-foreground">Gönderiyi Sil</h3>
              <p className="text-sm text-muted-foreground">
                Bu gönderiyi silmek istediğinize emin misiniz? Bu işlem geri alınamaz.
              </p>
            </div>
            <div className="px-5 py-4 border-t border-border/50 bg-muted/20 flex justify-end gap-2">
              <button 
                onClick={() => setDeleteModalOpen(false)}
                className="px-4 py-2 font-semibold text-sm rounded-lg hover:bg-secondary transition-colors text-foreground flex-1"
              >
                İptal
              </button>
              <button 
                onClick={() => {
                  deletePost.mutate({ postId: deleteTargetId });
                  setDeleteModalOpen(false);
                  setDeleteTargetId(null);
                }}
                disabled={deletePost.isLoading}
                className="px-4 py-2 bg-destructive text-destructive-foreground font-semibold text-sm rounded-lg hover:opacity-90 transition-opacity disabled:opacity-50 flex-1"
              >
                {deletePost.isLoading ? 'Siliniyor...' : 'Evet, Sil'}
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
