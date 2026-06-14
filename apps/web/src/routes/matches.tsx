import { createFileRoute } from '@tanstack/react-router';
import { Search, Send, User, Trash2 } from 'lucide-react';
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
  const [searchQuery, setSearchQuery] = useState('');
  const [viewMode, setViewMode] = useState<'inbox' | 'requests'>('inbox');
  const utils = trpc.useUtils();
  
  // Search users
  const { data: searchResults, isLoading: loadingSearch } = trpc.user.search.useQuery(
    { query: searchQuery },
    { enabled: searchQuery.trim().length > 0 }
  );
  
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
  const inboxChats = conversations.filter((c: any) => !c.isRequest);
  const requestChats = conversations.filter((c: any) => c.isRequest);

  const selectedConv = conversations.find(c => c.id === selectedConvId);

  const handleMatchClick = (matchedUser: any) => {
    if (!userId) return;
    const existingConv = conversations.find(c => 
      c.participants?.some((p: any) => p.userId === matchedUser.id) || 
      c.otherUser?.id === matchedUser.id
    );

    if (existingConv) {
      setSelectedConvId(existingConv.id);
      // Auto-switch to inbox if we start a match chat, unless it's a request (though matches won't be requests)
      setViewMode('inbox');
    } else {
      createConversation.mutate({ participantIds: [userId, matchedUser.id] });
      setViewMode('inbox');
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
          <h2 className="text-xl font-bold text-foreground mb-3">Mesajlar</h2>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <input
              type="text"
              placeholder="Kişi ara..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-secondary/50 border border-border rounded-lg pl-9 pr-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
            />
          </div>
        </div>
        
        <div className="flex-1 overflow-y-auto">
          {searchQuery.trim().length > 0 ? (
            <div className="p-2">
              {loadingSearch ? (
                <div className="p-4 text-center text-sm text-muted-foreground">Aranıyor...</div>
              ) : searchResults?.length === 0 ? (
                <div className="p-4 text-center text-sm text-muted-foreground">Sonuç bulunamadı.</div>
              ) : (
                searchResults?.map((item: any) => {
                  const nameText = `${item.name} ${item.surname || ''}`.trim();
                  const avatarUrl = (item?.image || ((item as any)?.role === 'company' ? `https://ui-avatars.com/api/?name=%F0%9F%92%BC&background=e2e8f0&color=94a3b8&size=1024` : 'https://www.gravatar.com/avatar/00000000000000000000000000000000?d=mp&f=y&s=1024'));
                  return (
                    <div 
                      key={item.id} 
                      onClick={() => {
                        setSearchQuery('');
                        handleMatchClick(item);
                      }}
                      className="flex items-center gap-3 p-3 rounded-lg cursor-pointer hover:bg-secondary/50 transition-colors"
                    >
                      <div className="w-10 h-10 rounded-full bg-primary/20 shrink-0 overflow-hidden">
                        <img src={avatarUrl} alt="avatar" className="w-full h-full object-cover" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h4 className="font-semibold text-sm truncate text-foreground">{nameText}</h4>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          ) : (
            <>
              {/* New Matches Row */}
              <div className="p-4 border-b border-border bg-muted/20">
                <h3 className="text-sm font-semibold text-foreground mb-3">Yeni Eşleşmeler</h3>
                {matches.length === 0 ? (
                  <p className="text-xs text-muted-foreground italic">Henüz yeni bir eşleşme yok.</p>
                ) : (
                  <div className="flex gap-4 overflow-x-auto pb-2 scrollbar-hide">
                    {matches.map((item: any) => {
                      const nameText = item.name || 'Kullanıcı';
                      const avatarUrl = (item?.image || ((item as any)?.role === 'company' ? `https://ui-avatars.com/api/?name=%F0%9F%92%BC&background=e2e8f0&color=94a3b8&size=1024` : 'https://www.gravatar.com/avatar/00000000000000000000000000000000?d=mp&f=y&s=1024'));
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
              <div className="p-4 pb-2 border-b border-border flex justify-between items-center bg-card">
                <div className="flex gap-4">
                  <button 
                    onClick={() => setViewMode('inbox')}
                    className={`text-sm font-semibold transition-colors ${viewMode === 'inbox' ? 'text-foreground border-b-2 border-primary' : 'text-muted-foreground hover:text-foreground'}`}
                  >
                    Sohbetler
                  </button>
                  <button 
                    onClick={() => setViewMode('requests')}
                    className={`text-sm font-semibold transition-colors flex items-center gap-1 ${viewMode === 'requests' ? 'text-foreground border-b-2 border-primary' : 'text-muted-foreground hover:text-foreground'}`}
                  >
                    İstekler {requestChats.length > 0 && <span className="bg-secondary text-foreground text-[10px] px-1.5 py-0.5 rounded-full">{requestChats.length}</span>}
                    {requestChats.some((c: any) => c.hasUnread) && <div className="w-2 h-2 bg-red-500 rounded-full" />}
                  </button>
                </div>
              </div>
              {isLoading ? (
                <div className="p-8 text-center text-muted-foreground">Yükleniyor...</div>
              ) : viewMode === 'inbox' ? (
                inboxChats.length === 0 ? (
                  <div className="p-8 text-center text-muted-foreground">Henüz bir sohbetiniz yok. Eşleşmelerinizden biriyle mesajlaşmaya başlayın!</div>
                ) : (
                  inboxChats.map((conv) => {
                    const otherUser = conv.otherUser;
                  const nameText = otherUser ? `${otherUser.name} ${otherUser.surname || ''}` : 'Sohbet';
                  const avatarUrl = (otherUser?.image || ((otherUser as any)?.role === 'company' ? `https://ui-avatars.com/api/?name=%F0%9F%92%BC&background=e2e8f0&color=94a3b8&size=1024` : 'https://www.gravatar.com/avatar/00000000000000000000000000000000?d=mp&f=y&s=1024'));
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
              )) : (
                requestChats.length === 0 ? (
                  <div className="p-8 text-center text-muted-foreground flex flex-col items-center gap-2">
                    <span className="text-3xl opacity-50">📬</span>
                    Bekleyen mesaj isteği yok.
                  </div>
                ) : (
                  requestChats.map((conv) => {
                    const otherUser = conv.otherUser;
                    const nameText = otherUser ? `${otherUser.name} ${otherUser.surname || ''}` : 'Sohbet';
                    const avatarUrl = (otherUser?.image || ((otherUser as any)?.role === 'company' ? `https://ui-avatars.com/api/?name=%F0%9F%92%BC&background=e2e8f0&color=94a3b8&size=1024` : 'https://www.gravatar.com/avatar/00000000000000000000000000000000?d=mp&f=y&s=1024'));
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
                )
              )}
            </>
          )}
        </div>
      </div>

      {/* Chat Area */}
      <div className={`${selectedConvId ? 'flex' : 'hidden'} md:flex flex-col flex-1 bg-background`}>
        {selectedConvId && selectedConv ? (
          <ChatView conversationId={selectedConvId} otherUser={selectedConv.otherUser} currentUserId={userId!} onDelete={() => setSelectedConvId(null)} />
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

function ChatView({ conversationId, otherUser, currentUserId, onDelete }: { conversationId: string, otherUser: any, currentUserId: string, onDelete: () => void }) {
  const [inputText, setInputText] = useState('');
  const [editingMessageId, setEditingMessageId] = useState<string | null>(null);
  const [editContent, setEditContent] = useState('');
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const utils = trpc.useUtils();
  
  useEffect(() => {
    // Focus the input automatically when entering a chat or switching conversations
    if (inputRef.current) {
      inputRef.current.focus();
    }
  }, [conversationId]);
  
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
                  return { ...page, items: [{ ...msg, reactions: [] }, ...page.items] };
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

  trpc.chat.onMessageUpdate.useSubscription(
    { userId: currentUserId },
    {
      onData(msg) {
        if (msg.conversationId === conversationId) {
          utils.chat.getMessages.setInfiniteData({ conversationId }, (oldData) => {
            if (!oldData) return oldData;
            return {
              ...oldData,
              pages: oldData.pages.map((page) => ({
                ...page,
                items: page.items.map((item) => (item.id === msg.id ? msg : item)),
              })),
            };
          });
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
        isEdited: false,
        createdAt: new Date(),
        reactions: [],
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
      utils.chat.getMessages.invalidate({ conversationId });
    }
  });

  const markAsRead = trpc.chat.markAsRead.useMutation();
  const editMessage = trpc.chat.editMessage.useMutation({
    onSuccess: () => {
      utils.chat.getMessages.invalidate({ conversationId });
    }
  });
  const deleteMessage = trpc.chat.deleteMessage.useMutation({
    onSuccess: () => {
      utils.chat.getMessages.invalidate({ conversationId });
    }
  });
  const reactMessage = trpc.chat.reactMessage.useMutation({
    onSuccess: () => {
      utils.chat.getMessages.invalidate({ conversationId });
    }
  });
  const deleteConversation = trpc.chat.deleteConversation.useMutation({
    onSuccess: () => {
      utils.chat.getConversations.invalidate();
      onDelete();
    }
  });

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

  const handleEditClick = (msg: any) => {
    setEditingMessageId(msg.id);
    setEditContent(msg.content);
  };

  const handleSaveEdit = (msgId: string) => {
    if (!editContent.trim()) return;
    editMessage.mutate({ messageId: msgId, userId: currentUserId, content: editContent.trim() });
    setEditingMessageId(null);
    setEditContent('');
  };

  const handleDeleteClick = (msgId: string) => {
    deleteMessage.mutate({ messageId: msgId, userId: currentUserId });
  };

  const handleReact = (msgId: string, emoji: string) => {
    reactMessage.mutate({ messageId: msgId, userId: currentUserId, emoji });
  };

  const nameText = otherUser ? `${otherUser.name} ${otherUser.surname || ''}` : 'Sohbet';
  const avatarUrl = (otherUser?.image || ((otherUser as any)?.role === 'company' ? `https://ui-avatars.com/api/?name=%F0%9F%92%BC&background=e2e8f0&color=94a3b8&size=1024` : 'https://www.gravatar.com/avatar/00000000000000000000000000000000?d=mp&f=y&s=1024'));

  return (
    <div className="flex flex-col h-full w-full">
      {/* Chat Header */}
      <div className="flex items-center justify-between p-4 border-b border-border bg-card shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-primary/20 overflow-hidden">
            <img src={avatarUrl} alt="avatar" className="w-full h-full object-cover" />
          </div>
          <div>
            <h3 className="font-semibold text-foreground">{nameText}</h3>
          </div>
        </div>
        <button 
          onClick={() => {
            if (window.confirm('Bu sohbeti tamamen silmek istediğinize emin misiniz? Bu işlem geri alınamaz.')) {
              deleteConversation.mutate({ conversationId, userId: currentUserId });
            }
          }}
          className="p-2 text-muted-foreground hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/50 rounded-full transition-colors"
          title="Sohbeti Sil"
        >
          <Trash2 className="w-5 h-5" />
        </button>
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
          <>
            <div className="h-6 shrink-0" /> {/* Spacer for absolute hover menu */}
            {messages.map((msg: any) => {
            const isMe = msg.senderId === currentUserId;
            const isEditing = editingMessageId === msg.id;

            return (
              <div key={msg.id} className={`flex flex-col max-w-[80%] ${isMe ? 'self-end items-end' : 'self-start items-start'} mb-2`}>
                <div className="relative group">
                  {/* Message Bubble */}
                  <div className={`p-3 rounded-2xl relative ${isMe ? 'bg-primary text-primary-foreground rounded-tr-sm' : 'bg-secondary text-secondary-foreground rounded-tl-sm'} ${msg.isDeleted ? 'opacity-50 italic' : ''}`}>
                    {isEditing ? (
                      <div className="flex flex-col gap-2 min-w-[200px]">
                        <input
                          autoFocus
                          type="text"
                          value={editContent}
                          onChange={(e) => setEditContent(e.target.value)}
                          className={`bg-background/20 border-b border-background/30 px-2 py-1 text-sm focus:outline-none ${isMe ? 'text-primary-foreground placeholder:text-primary-foreground/50' : 'text-foreground placeholder:text-muted-foreground'}`}
                          placeholder="Mesajınızı düzenleyin..."
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') handleSaveEdit(msg.id);
                            if (e.key === 'Escape') setEditingMessageId(null);
                          }}
                        />
                        <div className="flex justify-end gap-2 text-xs">
                          <button onClick={() => setEditingMessageId(null)} className="hover:opacity-70">İptal</button>
                          <button onClick={() => handleSaveEdit(msg.id)} className="font-semibold hover:opacity-70">Kaydet</button>
                        </div>
                      </div>
                    ) : (
                      <>
                        <p className="text-sm">{msg.isDeleted ? "Bu mesaj silindi." : msg.content}</p>
                        <div className={`flex items-center mt-1 gap-2 ${isMe ? 'justify-end' : 'justify-start'}`}>
                          {msg.isEdited && !msg.isDeleted && <span className="text-[10px] opacity-70">(Düzenlendi)</span>}
                          <span className={`text-[10px] ${isMe ? 'text-primary-foreground/70' : 'text-muted-foreground'}`}>
                            {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </span>
                        </div>
                      </>
                    )}

                    {/* Hover Actions (Absolute positioned) */}
                    {!isEditing && !msg.isDeleted && !msg.id.toString().startsWith('temp-') && (
                      <div className={`absolute -bottom-10 opacity-0 group-hover:opacity-100 flex gap-1 transition-opacity bg-card shadow-sm border border-border rounded-lg p-1 z-50 ${isMe ? 'right-0' : 'left-0'}`}>
                        <button onClick={() => handleReact(msg.id, '👍')} className="p-1 hover:bg-secondary rounded text-xs" title="Beğen">👍</button>
                        <button onClick={() => handleReact(msg.id, '❤️')} className="p-1 hover:bg-secondary rounded text-xs" title="Kalp">❤️</button>
                        <button onClick={() => handleReact(msg.id, '😂')} className="p-1 hover:bg-secondary rounded text-xs" title="Gül">😂</button>
                        {isMe && (
                          <>
                            <button onClick={() => handleEditClick(msg)} className="p-1 hover:bg-secondary rounded text-xs" title="Düzenle">✏️</button>
                            <button onClick={() => handleDeleteClick(msg.id)} className="p-1 hover:bg-secondary rounded text-xs text-red-500" title="Sil">🗑️</button>
                          </>
                        )}
                      </div>
                    )}
                  </div>
                </div>
                
                {/* Reactions */}
                {msg.reactions && msg.reactions.length > 0 && (
                  <div className={`flex flex-wrap gap-1 mt-1 bg-card border border-border rounded-full px-2 py-0.5 shadow-sm text-xs w-max relative -top-3 z-10 ${isMe ? 'mr-2' : 'ml-2'}`}>
                    {Array.from(new Set(msg.reactions.map((r: any) => r.emoji))).map((emoji: any) => {
                      const count = msg.reactions.filter((r: any) => r.emoji === emoji).length;
                      const hasReacted = msg.reactions.some((r: any) => r.emoji === emoji && r.userId === currentUserId);
                      return (
                        <span key={emoji} onClick={() => handleReact(msg.id, emoji)} className={`cursor-pointer ${hasReacted ? 'bg-primary/20 rounded-full' : ''}`}>
                          {emoji} {count > 1 ? count : ''}
                        </span>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
          </>
        )}
      </div>

      {/* Input Area */}
      <form onSubmit={handleSend} className="p-4 border-t border-border bg-card shrink-0 flex gap-2">
        <input
          ref={inputRef}
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
