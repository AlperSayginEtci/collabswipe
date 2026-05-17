import { useState, useRef, useEffect } from 'react';
import { createFileRoute } from '@tanstack/react-router';
import { Search, Send, Clock, Inbox } from 'lucide-react';
import { useSession } from '@collabswipe/auth/client';
import { trpc } from '@/lib/trpc';

export const Route = createFileRoute('/matches')({
  component: MatchesPage,
});

function MatchesPage() {
  const { data: session } = useSession();
  const userId = session?.user?.id;
  const utils = trpc.useUtils();

  const [activeConversationId, setActiveConversationId] = useState<string | null>(null);
  const [messageText, setMessageText] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // 1. Fetch Conversations (Polling every 3 seconds for real-time feel)
  const { data: conversations, isLoading: isConversationsLoading } = trpc.conversation.list.useQuery(
    { userId: userId || '' },
    { 
      enabled: !!userId,
      refetchInterval: 3000 // Smart polling
    }
  );

  // 2. Fetch Messages for active conversation
  const { data: messagesData, isLoading: isMessagesLoading } = trpc.conversation.getMessages.useQuery(
    { conversationId: activeConversationId || '' },
    { 
      enabled: !!activeConversationId,
      refetchInterval: 3000 
    }
  );

  // 3. Send Message Mutation
  const sendMessage = trpc.conversation.sendMessage.useMutation({
    onMutate: async (newMessage) => {
      // Optimistic update
      setMessageText('');
      await utils.conversation.getMessages.cancel({ conversationId: activeConversationId || '' });
      
      const previousMessages = utils.conversation.getMessages.getData({ conversationId: activeConversationId || '' });
      
      if (previousMessages && session?.user) {
        utils.conversation.getMessages.setQueryData(
          { conversationId: activeConversationId || '' },
          {
            ...previousMessages,
            items: [
              ...previousMessages.items,
              {
                id: 'optimistic-' + Date.now(),
                content: newMessage.content,
                createdAt: new Date(),
                conversationId: newMessage.conversationId,
                senderId: newMessage.senderId,
                isDeleted: false,
                sender: {
                  id: session.user.id,
                  name: session.user.name,
                  surname: (session.user as any).surname || '',
                  image: session.user.image,
                }
              } as any
            ]
          }
        );
      }
      return { previousMessages };
    },
    onSettled: () => {
      utils.conversation.getMessages.invalidate({ conversationId: activeConversationId || '' });
      utils.conversation.list.invalidate({ userId: userId || '' });
    }
  });

  // Auto-scroll to bottom of messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messagesData?.items]);

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!messageText.trim() || !activeConversationId || !userId) return;
    
    sendMessage.mutate({
      conversationId: activeConversationId,
      senderId: userId,
      content: messageText.trim()
    });
  };

  if (isConversationsLoading || !session) {
    return <div className="p-10 text-center text-muted-foreground font-semibold">Loading matches...</div>;
  }

  // Find active conversation details
  const activeConversation = conversations?.find(c => c.id === activeConversationId);
  const activeOtherParticipant = activeConversation?.participants.find(p => p.userId !== userId)?.user;

  return (
    <div className="flex h-[80vh] bg-card border border-border rounded-xl shadow-sm overflow-hidden">
      {/* Matches List Sidebar */}
      <div className="w-full md:w-80 border-r border-border flex flex-col">
        <div className="p-4 border-b border-border">
          <h2 className="text-xl font-bold text-foreground">Sohbetler</h2>
          <div className="relative mt-4">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <input 
              type="text" 
              placeholder="Ara..." 
              className="w-full bg-background border border-border rounded-lg pl-9 pr-3 py-2 text-sm focus:outline-none focus:border-primary"
            />
          </div>
        </div>
        
        <div className="flex-1 overflow-y-auto">
          {conversations?.length === 0 ? (
            <div className="p-6 text-center text-muted-foreground text-sm">
              Henüz bir eşleşmeniz yok.
            </div>
          ) : (
            conversations?.map((conv) => {
              const otherParticipant = conv.participants.find(p => p.userId !== userId)?.user;
              const lastMessage = conv.messages[0];
              const isActive = activeConversationId === conv.id;

              return (
                <div 
                  key={conv.id} 
                  onClick={() => setActiveConversationId(conv.id)}
                  className={`flex items-center gap-3 p-4 border-b border-border cursor-pointer transition-colors ${isActive ? 'bg-primary/5 border-l-4 border-l-primary' : 'hover:bg-secondary/50'}`}
                >
                  <div className="w-12 h-12 rounded-full bg-secondary shrink-0 overflow-hidden">
                     <img src={otherParticipant?.image || `https://api.dicebear.com/7.x/notionists/svg?seed=${otherParticipant?.name}`} alt="avatar" className="w-full h-full object-cover" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex justify-between items-baseline mb-1">
                      <h4 className="font-semibold text-foreground truncate">
                        {otherParticipant?.name} {otherParticipant?.surname}
                      </h4>
                      {lastMessage && (
                        <span className="text-[10px] text-muted-foreground">
                          {new Date(lastMessage.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      )}
                    </div>
                    <p className={`text-sm truncate ${isActive ? 'text-primary font-medium' : 'text-muted-foreground'}`}>
                      {lastMessage ? lastMessage.content : 'Yeni bir sohbet başlat!'}
                    </p>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* Chat Area */}
      <div className={`${!activeConversationId ? 'hidden md:flex' : 'flex'} flex-col flex-1 bg-background select-none`}>
        {!activeConversationId ? (
          <div className="flex-1 flex items-center justify-center text-muted-foreground">
            <div className="text-center space-y-4">
              <div className="w-20 h-20 bg-secondary rounded-full flex items-center justify-center mx-auto">
                <Inbox className="w-8 h-8 text-primary" />
              </div>
              <p className="text-lg font-medium">Sohbete başlamak için bir eşleşme seçin</p>
            </div>
          </div>
        ) : (
          <>
            {/* Chat Header */}
            <div className="p-4 border-b border-border bg-card flex items-center gap-3">
              <button 
                onClick={() => setActiveConversationId(null)}
                className="md:hidden text-muted-foreground p-2"
              >
                Geri
              </button>
              <div className="w-10 h-10 rounded-full bg-secondary overflow-hidden">
                <img src={activeOtherParticipant?.image || `https://api.dicebear.com/7.x/notionists/svg?seed=${activeOtherParticipant?.name}`} alt="avatar" className="w-full h-full object-cover" />
              </div>
              <div>
                <h3 className="font-bold text-foreground">{activeOtherParticipant?.name} {activeOtherParticipant?.surname}</h3>
                <span className="text-xs text-primary flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-primary inline-block"></span> Çevrimiçi</span>
              </div>
            </div>

            {/* Messages Area */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-background">
              {isMessagesLoading ? (
                <div className="text-center text-muted-foreground p-4">Mesajlar yükleniyor...</div>
              ) : messagesData?.items.length === 0 ? (
                <div className="text-center text-muted-foreground p-10 bg-secondary/30 rounded-xl m-4">
                  Buradaki ilk mesajı sen gönder! 👋
                </div>
              ) : (
                messagesData?.items.map((msg) => {
                  const isMe = msg.senderId === userId;
                  return (
                    <div key={msg.id} className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
                      <div className={`max-w-[70%] rounded-2xl px-4 py-2 ${isMe ? 'bg-primary text-primary-foreground rounded-br-sm' : 'bg-secondary text-secondary-foreground rounded-bl-sm'}`}>
                        <p className="text-sm">{msg.content}</p>
                        <span className={`text-[10px] mt-1 block ${isMe ? 'text-primary-foreground/70' : 'text-muted-foreground'}`}>
                          {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>
                    </div>
                  );
                })
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Message Input */}
            <div className="p-4 bg-card border-t border-border">
              <form onSubmit={handleSendMessage} className="flex gap-2">
                <input
                  type="text"
                  value={messageText}
                  onChange={(e) => setMessageText(e.target.value)}
                  placeholder="Mesajınızı yazın..."
                  className="flex-1 bg-background border border-border rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-primary"
                />
                <button 
                  type="submit" 
                  disabled={!messageText.trim() || sendMessage.isLoading}
                  className="bg-primary text-primary-foreground w-12 rounded-xl flex items-center justify-center hover:opacity-90 disabled:opacity-50 transition-opacity"
                >
                  <Send className="w-5 h-5" />
                </button>
              </form>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
