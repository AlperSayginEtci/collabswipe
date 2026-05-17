import { createFileRoute } from '@tanstack/react-router';
import { Search, Send, User } from 'lucide-react';
import { trpc } from '@/lib/trpc';
import { useSession } from '@collabswipe/auth/client';
import { useState, useRef, useEffect } from 'react';

export const Route = createFileRoute('/matches')({
  component: MatchesPage,
});

function MatchesPage() {
  const { data: session } = useSession();
  const userId = session?.user?.id;
  const [selectedConvId, setSelectedConvId] = useState<string | null>(null);
  const utils = trpc.useUtils();
  
  // Fetch real conversations
  const { data: conversationsData, isLoading: loadingConvs } = trpc.chat.getConversations.useQuery(
    { userId: userId || '' },
    { enabled: !!userId }
  );
  
  // Fetch connections for new matches
  const { data: connections, isLoading: loadingConnections } = trpc.connection.getMyConnections.useQuery(
    { userId: userId || '' },
    { enabled: !!userId }
  );

  const createConversation = trpc.conversation.create.useMutation({
    onSuccess: (data) => {
      utils.chat.getConversations.invalidate();
      setSelectedConvId(data.id);
    },
  });
  
  const conversations = conversationsData?.items || [];
  const selectedConv = conversations.find(c => c.id === selectedConvId);

  const handleMatchClick = (matchedUser: any) => {
    if (!userId) return;
    const existingConv = conversations.find(c => 
      c.participants?.some((p: any) => p.userId === matchedUser.id) || 
      c.otherUser?.id === matchedUser.id
    );

    if (existingConv) {
      setSelectedConvId(existingConv.id);
    } else {
      createConversation.mutate({ participantIds: [userId, matchedUser.id] });
    }
  };

  const matches = Array.from(new Map(
    (connections || []).map((conn: any) => {
      const matchUser = conn.requesterId === userId ? conn.addressee : conn.requester;
      return [matchUser.id, matchUser];
    })
  ).values());

  const isLoading = loadingConvs || loadingConnections;

  return (
    <div className="flex h-[80vh] bg-card border border-border rounded-xl shadow-sm overflow-hidden">
      {/* Matches List Sidebar */}
      <div className="w-full md:w-80 border-r border-border flex flex-col">
        <div className="p-4 border-b border-border">
          <h2 className="text-xl font-bold text-foreground">Mesajlar</h2>
        </div>
        
        <div className="flex-1 overflow-y-auto">
          {/* New Matches Row */}
          <div className="p-4 border-b border-border bg-muted/20">
            <h3 className="text-sm font-semibold text-foreground mb-3">Yeni Eşleşmeler</h3>
            {matches.length === 0 ? (
              <p className="text-xs text-muted-foreground italic">Henüz yeni bir eşleşme yok.</p>
            ) : (
              <div className="flex gap-4 overflow-x-auto pb-2 scrollbar-hide">
                {matches.map((item: any) => {
                  const nameText = item.name || 'Kullanıcı';
                  const avatarUrl = item.image || `https://api.dicebear.com/7.x/notionists/svg?seed=${nameText}`;
                  return (
                    <div 
                      key={item.id} 
                      onClick={() => handleMatchClick(item)}
                      className="flex flex-col items-center gap-1 cursor-pointer shrink-0 w-14"
                    >
                      <div className="w-14 h-14 rounded-full border-2 border-primary overflow-hidden">
                        <img src={avatarUrl} alt={nameText} className="w-full h-full object-cover" />
                      </div>
                      <span className="text-xs font-medium text-foreground truncate w-full text-center">
                        {nameText}
                      </span>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Conversations */}
          <div className="p-4 pb-2">
            <h3 className="text-sm font-semibold text-foreground">Sohbetler</h3>
          </div>
          {isLoading ? (
            <div className="p-8 text-center text-muted-foreground">Yükleniyor...</div>
          ) : conversations.length === 0 ? (
            <div className="p-8 text-center text-muted-foreground">Henüz bir sohbetiniz yok. Eşleşmelerinizden biriyle mesajlaşmaya başlayın!</div>
          ) : (
            conversations.map((conv) => {
              const otherUser = conv.otherUser;
              const nameText = otherUser ? `${otherUser.name} ${otherUser.surname || ''}` : 'Sohbet';
              const avatarUrl = otherUser?.image || `https://api.dicebear.com/7.x/notionists/svg?seed=${nameText}`;
              const lastMessage = conv.lastMessage;
              
              return (
                <div 
                  key={conv.id} 
                  onClick={() => setSelectedConvId(conv.id)}
                  className={`flex items-center gap-3 p-4 border-b border-border cursor-pointer transition-colors ${selectedConvId === conv.id ? 'bg-secondary' : 'hover:bg-secondary/50'}`}
                >
                  <div className="w-12 h-12 rounded-full bg-primary/20 shrink-0 overflow-hidden relative">
                    <img src={avatarUrl} alt="avatar" className="w-full h-full object-cover" />
                    {conv.hasUnread && (
                      <div className="absolute top-0 right-0 w-3 h-3 bg-red-500 rounded-full border-2 border-card" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex justify-between items-baseline mb-1">
                      <h4 className={`font-semibold truncate ${conv.hasUnread ? 'text-foreground' : 'text-foreground/80'}`}>
                        {nameText}
                      </h4>
                      {lastMessage && (
                        <span className="text-xs text-muted-foreground">
                          {new Date(lastMessage.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      )}
                    </div>
                    <p className={`text-sm truncate ${conv.hasUnread ? 'text-foreground font-medium' : 'text-muted-foreground'}`}>
                      {lastMessage ? lastMessage.content : 'Henüz mesaj yok'}
                    </p>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* Chat Area */}
      <div className={`${selectedConvId ? 'flex' : 'hidden'} md:flex flex-col flex-1 bg-background`}>
        {selectedConvId && selectedConv ? (
          <ChatView conversationId={selectedConvId} otherUser={selectedConv.otherUser} currentUserId={userId!} />
        ) : (
          <div className="flex-1 flex items-center justify-center text-muted-foreground select-none">
            <div className="text-center space-y-4">
              <div className="w-20 h-20 bg-secondary rounded-full flex items-center justify-center mx-auto">
                <span className="text-4xl text-primary">💬</span>
              </div>
              <p className="text-lg font-medium">Başlamak için bir sohbet seçin</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function ChatView({ conversationId, otherUser, currentUserId }: { conversationId: string, otherUser: any, currentUserId: string }) {
  const [inputText, setInputText] = useState('');
  const scrollRef = useRef<HTMLDivElement>(null);
  const utils = trpc.useUtils();
  
  // Realtime subscription
  trpc.chat.onMessage.useSubscription(
    { userId: currentUserId },
    {
      onData(msg) {
        if (msg.conversationId === conversationId) {
          // Ignore if it's our own message because optimistic UI already added it
          if (msg.senderId === currentUserId) return;

          // Add message to cache
          utils.chat.getMessages.setInfiniteData({ conversationId }, (oldData) => {
            if (!oldData) return oldData;
            return {
              ...oldData,
              pages: oldData.pages.map((page, index) => {
                if (index === 0) {
                  return { ...page, items: [msg, ...page.items] };
                }
                return page;
              }),
            };
          });
          
          // Mark as read if we are viewing this chat
          markAsRead.mutate({ conversationId, userId: currentUserId });
        }
      },
    }
  );

  const { data, isLoading } = trpc.chat.getMessages.useInfiniteQuery(
    { conversationId },
    { getNextPageParam: (lastPage) => lastPage.nextCursor }
  );

  const sendMessage = trpc.chat.sendMessage.useMutation({
    onMutate: async (newMsg) => {
      // Optimistic update
      await utils.chat.getMessages.cancel();
      const previousMessages = utils.chat.getMessages.getInfiniteData({ conversationId });
      
      const optimisticMsg = {
        id: `temp-${Date.now()}`,
        conversationId,
        senderId: currentUserId,
        content: newMsg.content,
        isDeleted: false,
        createdAt: new Date(),
      };

      utils.chat.getMessages.setInfiniteData({ conversationId }, (oldData) => {
        if (!oldData) return { pages: [{ items: [optimisticMsg], nextCursor: undefined }], pageParams: [] };
        return {
          ...oldData,
          pages: oldData.pages.map((page, index) => {
            if (index === 0) return { ...page, items: [optimisticMsg, ...page.items] };
            return page;
          }),
        };
      });

      return { previousMessages };
    },
    onError: (err, newMsg, context) => {
      if (context?.previousMessages) {
        utils.chat.getMessages.setInfiniteData({ conversationId }, context.previousMessages);
      }
    },
    onSettled: () => {
      utils.chat.getConversations.invalidate(); // Update sidebar last message
    }
  });

  const markAsRead = trpc.chat.markAsRead.useMutation();

  useEffect(() => {
    // Mark as read when opening conversation
    markAsRead.mutate({ conversationId, userId: currentUserId });
  }, [conversationId]);

  // Messages are stored in pages, we need to flatten them and reverse because the query returns DESC (newest first)
  const messages = data?.pages.flatMap(page => page.items) || [];

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim()) return;
    
    sendMessage.mutate({
      conversationId,
      senderId: currentUserId,
      content: inputText.trim(),
    });
    
    setInputText('');
  };

  const nameText = otherUser ? `${otherUser.name} ${otherUser.surname || ''}` : 'Sohbet';
  const avatarUrl = otherUser?.image || `https://api.dicebear.com/7.x/notionists/svg?seed=${nameText}`;

  return (
    <div className="flex flex-col h-full w-full">
      {/* Chat Header */}
      <div className="flex items-center gap-3 p-4 border-b border-border bg-card shrink-0">
        <div className="w-10 h-10 rounded-full bg-primary/20 overflow-hidden">
          <img src={avatarUrl} alt="avatar" className="w-full h-full object-cover" />
        </div>
        <div>
          <h3 className="font-semibold text-foreground">{nameText}</h3>
        </div>
      </div>

      {/* Messages List */}
      <div className="flex-1 overflow-y-auto p-4 flex flex-col-reverse gap-4" ref={scrollRef}>
        {isLoading ? (
          <div className="text-center text-muted-foreground my-auto">Mesajlar yükleniyor...</div>
        ) : messages.length === 0 ? (
          <div className="text-center text-muted-foreground my-auto flex flex-col items-center">
            <User className="w-12 h-12 mb-2 opacity-50" />
            İlk mesajı sen gönder!
          </div>
        ) : (
          messages.map((msg: any) => {
            const isMe = msg.senderId === currentUserId;
            return (
              <div key={msg.id} className={`flex max-w-[80%] ${isMe ? 'self-end' : 'self-start'}`}>
                <div className={`p-3 rounded-2xl ${isMe ? 'bg-primary text-primary-foreground rounded-tr-sm' : 'bg-secondary text-secondary-foreground rounded-tl-sm'}`}>
                  <p className="text-sm">{msg.content}</p>
                  <span className={`text-[10px] mt-1 block ${isMe ? 'text-primary-foreground/70 text-right' : 'text-muted-foreground'}`}>
                    {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Input Area */}
      <form onSubmit={handleSend} className="p-4 border-t border-border bg-card shrink-0 flex gap-2">
        <input
          type="text"
          value={inputText}
          onChange={(e) => setInputText(e.target.value)}
          placeholder="Bir mesaj yazın..."
          className="flex-1 bg-background border border-border rounded-full px-4 py-2 text-sm focus:outline-none focus:border-primary"
        />
        <button 
          type="submit" 
          disabled={!inputText.trim()}
          className="w-10 h-10 rounded-full bg-primary text-primary-foreground flex items-center justify-center disabled:opacity-50 transition-opacity"
        >
          <Send className="w-4 h-4" />
        </button>
      </form>
    </div>
  );
}
