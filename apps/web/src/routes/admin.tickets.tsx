import { createFileRoute } from '@tanstack/react-router';
import { trpc } from '../lib/trpc';
import { LifeBuoy, MessageSquare, ShieldAlert, CheckCircle2, Image as ImageIcon, X } from 'lucide-react';
import { useState, useRef } from 'react';
import toast from 'react-hot-toast';

export const Route = createFileRoute('/admin/tickets')({
  component: AdminTicketsPage,
});

function AdminTicketsPage() {
  const [selectedTicketId, setSelectedTicketId] = useState<string | null>(null);
  const [replyMessage, setReplyMessage] = useState('');
  const [replyMediaFilesBase64, setReplyMediaFilesBase64] = useState<string[]>([]);
  const [replyMediaPreviewUrls, setReplyMediaPreviewUrls] = useState<string[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const utils = trpc.useUtils();
  const { data: tickets, isLoading } = trpc.ticket.getAllTickets.useQuery();
  
  const { data: activeTicket } = trpc.ticket.getTicketById.useQuery(
    { ticketId: selectedTicketId! },
    { enabled: !!selectedTicketId }
  );

  const addMessage = trpc.ticket.addMessage.useMutation({
    onSuccess: () => {
      setReplyMessage('');
      setReplyMediaFilesBase64([]);
      setReplyMediaPreviewUrls([]);
      utils.ticket.getTicketById.invalidate({ ticketId: selectedTicketId! });
      utils.ticket.getAllTickets.invalidate();
    }
  });

  const closeTicket = trpc.ticket.closeTicket.useMutation({
    onSuccess: () => {
      toast.success('Bilet kapatıldı.');
      utils.ticket.getTicketById.invalidate({ ticketId: selectedTicketId! });
      utils.ticket.getAllTickets.invalidate();
    }
  });

  const processFile = (file: File) => {
    if (!file.type.startsWith('image/') && !file.type.startsWith('video/')) {
      toast.error('Lütfen geçerli bir resim veya video seçin');
      return;
    }

    const previewUrl = URL.createObjectURL(file);
    setReplyMediaPreviewUrls(prev => [...prev, previewUrl]);

    const reader = new FileReader();
    reader.onload = (event) => {
      const base64String = (event.target?.result as string).split(',')[1];
      setReplyMediaFilesBase64(prev => [...prev, base64String]);
    };
    reader.readAsDataURL(file);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files) {
      Array.from(files).forEach(file => processFile(file));
    }
  };

  const removePreview = (index: number) => {
    setReplyMediaPreviewUrls(prev => prev.filter((_, i) => i !== index));
    setReplyMediaFilesBase64(prev => prev.filter((_, i) => i !== index));
  };

  if (isLoading) return <div className="p-8 text-center animate-pulse">Biletler Yükleniyor...</div>;

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3 border-b border-border pb-6">
        <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
          <LifeBuoy className="w-6 h-6 text-primary" />
        </div>
        <div>
          <h1 className="text-2xl font-bold">Destek Talepleri</h1>
          <p className="text-muted-foreground text-sm">Kullanıcıların açtığı destek biletlerini yönetin.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-1 border border-border bg-card rounded-2xl overflow-hidden h-[700px] flex flex-col">
          <div className="p-4 border-b border-border bg-muted/30 font-bold flex justify-between items-center">
            Talepler <span className="bg-primary/10 text-primary px-2 py-0.5 rounded-full text-xs">{tickets?.length}</span>
          </div>
          <div className="overflow-y-auto flex-1 p-2 space-y-2">
            {tickets?.map(ticket => (
              <div 
                key={ticket.id}
                onClick={() => setSelectedTicketId(ticket.id)}
                className={`p-4 rounded-xl border cursor-pointer transition-all ${selectedTicketId === ticket.id ? 'bg-primary/10 border-primary/30' : 'bg-background hover:bg-muted border-border/50'}`}
              >
                <div className="flex items-start justify-between mb-2">
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${ticket.status === 'OPEN' ? 'bg-orange-500/10 text-orange-500' : 'bg-muted text-muted-foreground'}`}>
                    {ticket.status === 'OPEN' ? 'Açık' : 'Kapalı'}
                  </span>
                  <span className="text-[10px] text-muted-foreground">
                    {new Date(ticket.createdAt).toLocaleDateString()}
                  </span>
                </div>
                <h3 className="font-semibold text-sm line-clamp-1">{ticket.subject}</h3>
                <div className="flex items-center gap-2 mt-2">
                  <img src={ticket.user?.image || `https://api.dicebear.com/7.x/notionists/svg?seed=${ticket.userId}`} className="w-5 h-5 rounded-full bg-secondary"/>
                  <span className="text-xs text-muted-foreground truncate">{ticket.user?.name} {ticket.user?.surname}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="lg:col-span-2">
          {selectedTicketId ? (
            activeTicket ? (
              <div className="bg-card border border-border rounded-2xl overflow-hidden flex flex-col h-[700px] shadow-sm">
                <div className="p-5 border-b border-border bg-muted/20 flex justify-between items-start">
                  <div>
                    <h2 className="text-xl font-bold">{activeTicket.subject}</h2>
                    <p className="text-sm text-muted-foreground mt-1">
                      Kategori: <span className="font-semibold text-foreground">{activeTicket.category}</span> • 
                      Kullanıcı: {activeTicket.user?.name} {activeTicket.user?.surname}
                    </p>
                  </div>
                  {activeTicket.status !== 'CLOSED' && (
                    <button 
                      onClick={() => {
                        if (confirm('Bu talebi çözüldü olarak işaretleyip kapatmak istediğinize emin misiniz?')) {
                          closeTicket.mutate({ ticketId: activeTicket.id });
                        }
                      }}
                      className="bg-destructive/10 text-destructive hover:bg-destructive hover:text-white px-4 py-2 rounded-lg text-sm font-bold transition-colors"
                    >
                      Talebi Kapat
                    </button>
                  )}
                </div>
                
                <div className="flex-1 p-5 overflow-y-auto space-y-4">
                  {activeTicket.messages.map((msg: any) => (
                    <div key={msg.id} className={`flex ${msg.isAdmin ? 'justify-end' : 'justify-start'}`}>
                      {!msg.isAdmin && (
                        <img src={msg.sender?.image || `https://api.dicebear.com/7.x/notionists/svg?seed=${msg.senderId}`} className="w-8 h-8 rounded-full mr-2 self-end"/>
                      )}
                      <div className={`max-w-[75%] rounded-2xl p-4 ${msg.isAdmin ? 'bg-primary text-primary-foreground rounded-br-none' : 'bg-muted rounded-bl-none'}`}>
                        {msg.isAdmin && <div className="text-[10px] font-bold opacity-70 mb-1">Ben (Admin)</div>}
                        {!msg.isAdmin && <div className="text-[10px] font-bold text-muted-foreground mb-1">{msg.sender?.name}</div>}
                        <p className="text-sm whitespace-pre-wrap leading-relaxed">{msg.content}</p>
                        {msg.attachmentUrls && msg.attachmentUrls.length > 0 && (
                          <div className={`mt-3 grid gap-2 ${msg.attachmentUrls.length > 1 ? 'grid-cols-2' : 'grid-cols-1'}`}>
                            {msg.attachmentUrls.map((url: string, idx: number) => (
                              <div key={idx} className="rounded-xl overflow-hidden border border-border/20">
                                {url.match(/\.(mp4|webm|ogg)\?/) ? (
                                  <video src={url} controls className="w-full h-full object-cover" />
                                ) : (
                                  <img src={url.replace('dl=0', 'raw=1')} alt="attachment" className="w-full h-full object-cover max-h-[300px]" />
                                )}
                              </div>
                            ))}
                          </div>
                        )}
                        <span className="text-[10px] opacity-60 mt-2 block text-right">
                          {new Date(msg.createdAt).toLocaleString()}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>

                {activeTicket.status !== 'CLOSED' ? (
                  <div className="p-4 border-t border-border bg-background flex flex-col gap-2">
                    {replyMediaPreviewUrls.length > 0 && (
                      <div className="flex gap-2 flex-wrap self-start">
                        {replyMediaPreviewUrls.map((url, idx) => (
                          <div key={idx} className="relative inline-block">
                            <img src={url} alt="Preview" className="h-20 w-20 rounded-lg object-cover border border-border/50" />
                            <button onClick={() => removePreview(idx)} className="absolute -top-2 -right-2 bg-foreground text-background rounded-full p-1 shadow-lg hover:scale-110 transition-transform">
                              <X className="w-3 h-3" />
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                    <div className="flex gap-3 items-end">
                      <button 
                        onClick={() => fileInputRef.current?.click()}
                        className="p-3 bg-muted/50 text-muted-foreground hover:bg-muted hover:text-foreground rounded-xl transition-colors border border-border/50 mb-0.5"
                      >
                        <ImageIcon className="w-5 h-5" />
                      </button>
                      <input 
                        type="file" ref={fileInputRef} className="hidden" accept="image/*,video/*" multiple
                        onChange={handleFileChange}
                      />
                      <textarea 
                        value={replyMessage}
                        onChange={(e) => setReplyMessage(e.target.value)}
                        placeholder="Kullanıcıya cevap yazın..."
                        className="flex-1 min-h-[50px] max-h-[150px] bg-muted/50 border border-border/50 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-primary resize-y"
                      />
                      <button 
                        onClick={() => addMessage.mutate({ ticketId: activeTicket.id, content: replyMessage, mediaFiles: replyMediaFilesBase64 })}
                        disabled={(!replyMessage.trim() && replyMediaFilesBase64.length === 0) || addMessage.isPending}
                        className="bg-primary text-primary-foreground px-6 py-3 rounded-xl font-bold hover:opacity-90 disabled:opacity-50 self-end mb-0.5"
                      >
                        Gönder
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="p-4 border-t border-border bg-muted/30 text-center text-sm text-muted-foreground font-medium flex justify-center items-center gap-2">
                    <CheckCircle2 className="w-4 h-4" /> Bu destek talebi kapatılmış.
                  </div>
                )}
              </div>
            ) : (
              <div className="h-full flex items-center justify-center animate-pulse text-muted-foreground">Yükleniyor...</div>
            )
          ) : (
            <div className="h-[700px] flex flex-col items-center justify-center border-2 border-dashed border-border rounded-3xl bg-card/50 text-muted-foreground">
              <LifeBuoy className="w-16 h-16 mb-4 opacity-30" />
              <p className="font-medium text-lg">Bir bilet seçin</p>
              <p className="text-sm opacity-70 mt-1">Cevaplamak için sol taraftan bir destek talebi seçin.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
