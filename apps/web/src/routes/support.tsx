import { createFileRoute } from '@tanstack/react-router';
import { trpc } from '../lib/trpc';
import { LifeBuoy, Plus, MessageSquare, Clock, CheckCircle2, ChevronRight, X, Image as ImageIcon } from 'lucide-react';
import { useState, useRef } from 'react';
import toast from 'react-hot-toast';

export const Route = createFileRoute('/support')({
  component: SupportPage,
});

const getSafeImageSrc = (url: string) =>
  /^(https?:|blob:|data:image\/)/i.test(url) ? url : '';

function SupportPage() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [subject, setSubject] = useState('');
  const [category, setCategory] = useState('Diğer');
  const [message, setMessage] = useState('');
  const [mediaFilesBase64, setMediaFilesBase64] = useState<string[]>([]);
  const [mediaPreviewUrls, setMediaPreviewUrls] = useState<string[]>([]);
  const [selectedTicketId, setSelectedTicketId] = useState<string | null>(null);
  const [replyMessage, setReplyMessage] = useState('');
  const [replyMediaFilesBase64, setReplyMediaFilesBase64] = useState<string[]>([]);
  const [replyMediaPreviewUrls, setReplyMediaPreviewUrls] = useState<string[]>([]);
  
  const [isCreateDragging, setIsCreateDragging] = useState(false);
  const [isReplyDragging, setIsReplyDragging] = useState(false);
  
  const createFileInputRef = useRef<HTMLInputElement>(null);
  const replyFileInputRef = useRef<HTMLInputElement>(null);

  const utils = trpc.useUtils();
  const { data: tickets, isLoading } = trpc.ticket.getMyTickets.useQuery();
  const createTicket = trpc.ticket.createTicket.useMutation({
    onSuccess: () => {
      toast.success('Destek talebiniz oluşturuldu.');
      setIsModalOpen(false);
      setSubject('');
      setMessage('');
      setMediaFilesBase64([]);
      setMediaPreviewUrls([]);
      utils.ticket.getMyTickets.invalidate();
    },
    onError: () => toast.error('Hata oluştu.')
  });

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
      utils.ticket.getMyTickets.invalidate();
    }
  });

  const processFile = (file: File, isReply: boolean) => {
    if (!file.type.startsWith('image/') && !file.type.startsWith('video/')) {
      toast.error('Lütfen geçerli bir resim veya video seçin');
      return;
    }

    const previewUrl = URL.createObjectURL(file);
    if (isReply) setReplyMediaPreviewUrls(prev => [...prev, previewUrl]);
    else setMediaPreviewUrls(prev => [...prev, previewUrl]);

    const reader = new FileReader();
    reader.onload = (event) => {
      const base64String = (event.target?.result as string).split(',')[1];
      if (isReply) setReplyMediaFilesBase64(prev => [...prev, base64String]);
      else setMediaFilesBase64(prev => [...prev, base64String]);
    };
    reader.readAsDataURL(file);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>, isReply: boolean) => {
    const files = e.target.files;
    if (files) {
      Array.from(files).forEach(file => processFile(file, isReply));
    }
  };

  const handleDragDrop = (files: FileList | undefined | null, isReply: boolean) => {
    if (files) {
      Array.from(files).forEach(file => processFile(file, isReply));
    }
  };

  const handleDragOver = (e: React.DragEvent, isReply: boolean) => {
    e.preventDefault();
    if (isReply) setIsReplyDragging(true);
    else setIsCreateDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent, isReply: boolean) => {
    e.preventDefault();
    if (isReply) setIsReplyDragging(false);
    else setIsCreateDragging(false);
  };

  const handleDrop = (e: React.DragEvent, isReply: boolean) => {
    e.preventDefault();
    if (isReply) setIsReplyDragging(false);
    else setIsCreateDragging(false);
    
    handleDragDrop(e.dataTransfer.files, isReply);
  };

  const removePreview = (index: number, isReply: boolean) => {
    if (isReply) {
      setReplyMediaPreviewUrls(prev => prev.filter((_, i) => i !== index));
      setReplyMediaFilesBase64(prev => prev.filter((_, i) => i !== index));
    } else {
      setMediaPreviewUrls(prev => prev.filter((_, i) => i !== index));
      setMediaFilesBase64(prev => prev.filter((_, i) => i !== index));
    }
  };

  if (isLoading) return <div className="p-8 text-center animate-pulse">Yükleniyor...</div>;

  return (
    <div className="max-w-4xl mx-auto pb-20">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-foreground flex items-center gap-3">
            <LifeBuoy className="w-8 h-8 text-primary" />
            Destek Merkezi
          </h1>
          <p className="text-muted-foreground mt-2">Yardıma ihtiyacınız olan konularda destek talebi oluşturun.</p>
        </div>
        <button 
          onClick={() => setIsModalOpen(true)}
          className="flex items-center gap-2 bg-primary text-primary-foreground px-5 py-2.5 rounded-xl font-bold hover:opacity-90 transition-opacity"
        >
          <Plus className="w-5 h-5" /> Yeni Talep
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="md:col-span-1 space-y-3">
          <h2 className="font-bold text-lg mb-4">Talepleriniz</h2>
          {tickets?.length === 0 && (
            <p className="text-muted-foreground text-sm">Henüz destek talebiniz bulunmuyor.</p>
          )}
          {tickets?.map(ticket => (
            <div 
              key={ticket.id}
              onClick={() => setSelectedTicketId(ticket.id)}
              className={`p-4 rounded-2xl border cursor-pointer transition-all ${selectedTicketId === ticket.id ? 'bg-primary/10 border-primary/30' : 'bg-card border-border/50 hover:bg-muted'}`}
            >
              <div className="flex items-start justify-between mb-2">
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${ticket.status === 'OPEN' ? 'bg-orange-500/10 text-orange-500 border border-orange-500/20' : ticket.status === 'CLOSED' ? 'bg-muted text-muted-foreground border border-border' : 'bg-green-500/10 text-green-500 border border-green-500/20'}`}>
                  {ticket.status === 'OPEN' ? 'Açık' : ticket.status === 'CLOSED' ? 'Kapalı' : 'Çözüldü'}
                </span>
                <span className="text-[10px] text-muted-foreground">{new Date(ticket.createdAt).toLocaleDateString()}</span>
              </div>
              <h3 className="font-semibold text-sm line-clamp-1">{ticket.subject}</h3>
              <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
                <MessageSquare className="w-3 h-3" /> {ticket.category}
              </p>
            </div>
          ))}
        </div>

        <div className="md:col-span-2">
          {selectedTicketId ? (
            activeTicket ? (
              <div className="bg-card border border-border/50 rounded-3xl overflow-hidden flex flex-col h-[600px] shadow-sm">
                <div className="p-5 border-b border-border/50 bg-muted/20">
                  <h2 className="text-xl font-bold">{activeTicket.subject}</h2>
                  <p className="text-sm text-muted-foreground mt-1">Kategori: {activeTicket.category} • Durum: {activeTicket.status}</p>
                </div>
                
                <div className="flex-1 p-5 overflow-y-auto space-y-4">
                  {activeTicket.messages.map((msg: any) => (
                    <div key={msg.id} className={`flex ${msg.senderId === activeTicket.userId ? 'justify-end' : 'justify-start'}`}>
                      <div className={`max-w-[80%] rounded-2xl p-4 ${msg.senderId === activeTicket.userId ? 'bg-primary text-primary-foreground rounded-br-none' : 'bg-muted rounded-bl-none'}`}>
                        {msg.isAdmin && <div className="text-[10px] font-bold opacity-70 mb-1 flex items-center gap-1"><LifeBuoy className="w-3 h-3"/> Destek Ekibi</div>}
                        <p className="text-sm whitespace-pre-wrap">{msg.content}</p>
                        {msg.attachmentUrls && msg.attachmentUrls.length > 0 && (
                          <div className={`mt-3 grid gap-2 ${msg.attachmentUrls.length > 1 ? 'grid-cols-2' : 'grid-cols-1'}`}>
                            {msg.attachmentUrls.map((url: string, idx: number) => (
                              <div key={idx} className="rounded-xl overflow-hidden border border-border/20">
                                {url.match(/\.(mp4|webm|ogg)\?/) ? (
                                  <video src={url} controls className="w-full h-full object-cover" />
                                ) : (
                                  <img src={getSafeImageSrc(url.replace('dl=0', 'raw=1'))} alt="attachment" className="w-full h-full object-cover max-h-[250px]" />
                                )}
                              </div>
                            ))}
                          </div>
                        )}
                        <span className="text-[10px] opacity-60 mt-2 block text-right">
                          {new Date(msg.createdAt).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>

                {activeTicket.status !== 'CLOSED' && (
                  <div 
                    className={`p-4 border-t border-border/50 bg-background flex flex-col gap-2 transition-colors ${isReplyDragging ? 'bg-primary/5 border-primary/30' : ''}`}
                    onDragOver={(e) => handleDragOver(e, true)}
                    onDragLeave={(e) => handleDragLeave(e, true)}
                    onDrop={(e) => handleDrop(e, true)}
                  >
                    {isReplyDragging && (
                      <div className="absolute inset-0 bg-primary/10 backdrop-blur-[2px] z-10 flex items-center justify-center border-2 border-primary border-dashed rounded-b-3xl">
                        <div className="bg-background px-6 py-3 rounded-full font-bold text-primary shadow-xl flex items-center gap-2">
                          <ImageIcon className="w-5 h-5" />
                          Dosyayı buraya bırakın
                        </div>
                      </div>
                    )}
                    
                    {replyMediaPreviewUrls.length > 0 && (
                      <div className="flex gap-2 flex-wrap z-20">
                        {replyMediaPreviewUrls.map((_, idx) => (
                          <div key={idx} className="relative inline-block">
                            <div className="h-20 w-20 rounded-lg border border-border/50 bg-muted/40 flex items-center justify-center text-muted-foreground">
                              <ImageIcon className="w-5 h-5" />
                            </div>
                            <button onClick={() => removePreview(idx, true)} className="absolute -top-2 -right-2 bg-foreground text-background rounded-full p-1 shadow-lg hover:scale-110 transition-transform">
                              <X className="w-3 h-3" />
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                    <div className="flex gap-2 items-center relative z-20">
                      <button 
                        onClick={() => replyFileInputRef.current?.click()}
                        className="p-2.5 bg-muted/50 text-muted-foreground hover:bg-muted hover:text-foreground rounded-xl transition-colors border border-border/50"
                      >
                        <ImageIcon className="w-5 h-5" />
                      </button>
                      <input 
                        type="file" ref={replyFileInputRef} className="hidden" accept="image/*,video/*" multiple
                        onChange={(e) => handleFileChange(e, true)}
                      />
                      <input 
                        value={replyMessage}
                        onChange={(e) => setReplyMessage(e.target.value)}
                        placeholder="Bir cevap yazın..."
                        onKeyDown={(e) => e.key === 'Enter' && (replyMessage.trim() || replyMediaFilesBase64.length > 0) && addMessage.mutate({ ticketId: activeTicket.id, content: replyMessage, mediaFiles: replyMediaFilesBase64 })}
                        className="flex-1 bg-muted/50 border border-border/50 rounded-xl px-4 py-2 text-sm focus:outline-none focus:border-primary"
                      />
                      <button 
                        onClick={() => addMessage.mutate({ ticketId: activeTicket.id, content: replyMessage, mediaFiles: replyMediaFilesBase64 })}
                        disabled={(!replyMessage.trim() && replyMediaFilesBase64.length === 0) || addMessage.isPending}
                        className="bg-primary text-primary-foreground px-6 py-2.5 rounded-xl font-bold hover:opacity-90 disabled:opacity-50 transition-opacity"
                      >
                        Gönder
                      </button>
                    </div>
                  </div>
                )}
                {activeTicket.status === 'CLOSED' && (
                  <div className="p-4 border-t border-border/50 bg-muted/30 text-center text-sm text-muted-foreground font-medium">
                    Bu destek talebi kapatılmıştır.
                  </div>
                )}
              </div>
            ) : (
              <div className="h-full flex items-center justify-center animate-pulse text-muted-foreground">Yükleniyor...</div>
            )
          ) : (
            <div className="h-[600px] flex flex-col items-center justify-center border-2 border-dashed border-border/50 rounded-3xl bg-card/50 text-muted-foreground">
              <MessageSquare className="w-12 h-12 mb-4 opacity-50" />
              <p className="font-medium">Detayları görmek için bir talep seçin</p>
            </div>
          )}
        </div>
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm animate-in fade-in">
          <div className="bg-card w-full max-w-lg rounded-3xl border border-border shadow-2xl p-6">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-bold">Yeni Destek Talebi</h2>
              <button onClick={() => setIsModalOpen(false)} className="p-2 hover:bg-muted rounded-full transition-colors"><X className="w-5 h-5"/></button>
            </div>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-semibold mb-2">Konu Özeti</label>
                <input 
                  value={subject} onChange={(e) => setSubject(e.target.value)}
                  className="w-full bg-muted/30 border border-border/50 rounded-xl px-4 py-3 focus:outline-none focus:border-primary"
                  placeholder="Kısaca probleminizi yazın"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold mb-2">Kategori</label>
                <select 
                  value={category} onChange={(e) => setCategory(e.target.value)}
                  className="w-full bg-muted/30 border border-border/50 rounded-xl px-4 py-3 focus:outline-none focus:border-primary appearance-none"
                >
                  <option>Teknik Hata (Bug)</option>
                  <option>Hesap veya Profil</option>
                  <option>Öneri / Geri Bildirim</option>
                  <option>Şikayet</option>
                  <option>Diğer</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-semibold mb-2">Mesajınız</label>
                <textarea 
                  value={message} onChange={(e) => setMessage(e.target.value)}
                  className="w-full min-h-[120px] bg-muted/30 border border-border/50 rounded-xl px-4 py-3 focus:outline-none focus:border-primary resize-none"
                  placeholder="Detaylıca açıklayın..."
                />
              </div>

              {mediaPreviewUrls.length > 0 && (
                <div className="flex gap-3 flex-wrap">
                  {mediaPreviewUrls.map((_, idx) => (
                    <div key={idx} className="relative inline-block">
                      <div className="h-24 w-24 rounded-xl border border-border shadow-md bg-muted/40 flex items-center justify-center text-muted-foreground">
                        <ImageIcon className="w-6 h-6" />
                      </div>
                      <button onClick={() => removePreview(idx, false)} className="absolute -top-2 -right-2 bg-foreground text-background rounded-full p-1.5 shadow-xl hover:scale-110 transition-transform z-10">
                        <X className="w-3 h-3" />
                      </button>
                    </div>
                  ))}
                  <div 
                    onClick={() => createFileInputRef.current?.click()}
                    onDragOver={(e) => handleDragOver(e, false)}
                    onDragLeave={(e) => handleDragLeave(e, false)}
                    onDrop={(e) => handleDrop(e, false)}
                    className={`h-24 w-24 rounded-xl border-2 border-dashed flex flex-col items-center justify-center cursor-pointer transition-colors ${isCreateDragging ? 'border-primary bg-primary/5' : 'border-border hover:bg-muted/50'}`}
                  >
                    <Plus className={`w-6 h-6 ${isCreateDragging ? 'text-primary' : 'text-muted-foreground'}`} />
                    <span className={`text-[10px] mt-1 ${isCreateDragging ? 'text-primary' : 'text-muted-foreground'}`}>Ekle</span>
                  </div>
                </div>
              )}
              
              {mediaPreviewUrls.length === 0 && (
                <div 
                  className={`border-2 border-dashed rounded-xl p-6 text-center transition-colors cursor-pointer ${isCreateDragging ? 'border-primary bg-primary/5' : 'border-border/50 bg-muted/30 hover:bg-muted/50'}`}
                  onDragOver={(e) => handleDragOver(e, false)}
                  onDragLeave={(e) => handleDragLeave(e, false)}
                  onDrop={(e) => handleDrop(e, false)}
                  onClick={() => createFileInputRef.current?.click()}
                >
                  <ImageIcon className={`w-8 h-8 mx-auto mb-2 ${isCreateDragging ? 'text-primary' : 'text-muted-foreground'}`} />
                  <p className="text-sm font-medium">Sürükle bırak ya da seç</p>
                  <p className="text-xs text-muted-foreground mt-1">Birden fazla resim veya video ekleyebilirsiniz</p>
                </div>
              )}
              
              <input 
                type="file" ref={createFileInputRef} className="hidden" accept="image/*,video/*" multiple
                onChange={(e) => handleFileChange(e, false)}
              />

              <button 
                onClick={() => createTicket.mutate({ subject, category, message, mediaFiles: mediaFilesBase64 })}
                disabled={(!subject.trim() || !message.trim()) || createTicket.isPending}
                className="w-full bg-primary text-primary-foreground font-bold py-3.5 rounded-xl hover:opacity-90 disabled:opacity-50 mt-4"
              >
                Talebi Oluştur
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
