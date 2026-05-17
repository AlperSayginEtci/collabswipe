import { createFileRoute } from '@tanstack/react-router';
import { Send } from 'lucide-react';
import { trpc } from '@/lib/trpc';
import { useState } from 'react';
import { useSession } from '@collabswipe/auth/client';

export const Route = createFileRoute('/')({
  component: HomeFeed,
});

function HomeFeed() {
  const [content, setContent] = useState('');
  const utils = trpc.useUtils();
  const { data: session } = useSession();

  const { data: feedData, isLoading: isFeedLoading } = trpc.post.getFeed.useQuery({});
  
  const createPost = trpc.post.create.useMutation({
    onSuccess: () => {
      alert('Post created successfully!');
      setContent('');
      utils.post.getFeed.invalidate();
    },
    onError: (err) => {
      console.error(err);
      alert('Failed to create post. Is the database running?');
    }
  });

  const handlePost = () => {
    if (!content.trim() || !session?.user?.id) return;
    createPost.mutate({ authorId: session.user.id, content });
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-2 mb-8">
        <h2 className="text-3xl font-extrabold tracking-tight">Home Feed</h2>
        <p className="text-muted-foreground text-lg">See latest posts from your network.</p>
      </div>

      {/* Post Composer */}
      <div className="bg-card border border-border rounded-xl p-4 shadow-sm">
        <div className="flex gap-4">
          <div className="w-10 h-10 rounded-full bg-primary/20 shrink-0" />
          <div className="flex-1 space-y-3">
            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="What's on your mind? Share an update, a project, or ask for help."
              className="w-full bg-transparent border-b border-border p-2 focus:outline-none focus:border-primary resize-none placeholder:text-muted-foreground"
              rows={2}
            ></textarea>
            <div className="flex justify-end">
              <button 
                onClick={handlePost}
                disabled={createPost.isLoading || !content.trim()}
                className="bg-primary text-primary-foreground px-4 py-2 rounded-lg font-medium flex items-center gap-2 hover:opacity-90 transition-opacity disabled:opacity-50"
              >
                {createPost.isLoading ? 'Posting...' : 'Post'} <Send className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Feed Posts */}
      <div className="space-y-4">
        {isFeedLoading ? (
          <div className="text-center py-8">Loading posts...</div>
        ) : feedData?.items && feedData.items.length > 0 ? (
          feedData.items.map((post) => (
            <div key={post.id} className="bg-card border border-border rounded-xl p-5 shadow-sm">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-full bg-secondary shrink-0 overflow-hidden">
                  <img src={post.author?.image || `https://api.dicebear.com/7.x/notionists/svg?seed=${post.author?.name || 'user'}`} alt="avatar" className="w-full h-full object-cover" />
                </div>
                <div className="flex-1">
                  <h4 className="font-semibold text-foreground">{post.author?.name || 'Mock'} {post.author?.surname || 'User'}</h4>
                  <p className="text-xs text-muted-foreground">{new Date(post.createdAt).toLocaleString()}</p>
                </div>
              </div>
              <p className="text-foreground leading-relaxed mb-4">
                {post.content}
              </p>
              <div className="flex items-center gap-6 pt-4 border-t border-border/50 text-muted-foreground font-medium text-sm">
                <button className="flex items-center gap-2 hover:text-primary transition-colors">Like ({post._count?.likes || 0})</button>
                <button className="flex items-center gap-2 hover:text-primary transition-colors">Comment ({post._count?.comments || 0})</button>
                <button className="flex items-center gap-2 hover:text-primary transition-colors">Repost</button>
              </div>
            </div>
          ))
        ) : (
          <div className="text-center py-8 text-muted-foreground">
            No posts yet. Be the first to share something!
          </div>
        )}
      </div>
    </div>
  );
}
