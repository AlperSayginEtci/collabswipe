import { useState } from 'react';
import { X, AlertTriangle } from 'lucide-react';
import { trpc } from '../lib/trpc';
import toast from 'react-hot-toast';

interface ReportModalProps {
  isOpen: boolean;
  onClose: () => void;
  targetType: 'USER' | 'POST' | 'COMMENT' | 'JOB';
  targetId: string;
}

const POST_CATEGORIES = [
  'Spam veya Yanıltıcı İçerik',
  'Nefret Söylemi',
  'Şiddet veya Tehlikeli Davranış',
  'Telif Hakkı İhlali',
  'Çıplaklık veya Cinsellik',
  'Diğer'
];

const USER_CATEGORIES = [
  'Sahte Hesap',
  'Taciz veya Zorbalık',
  'Uygunsuz Profil Bilgileri',
  'Dolandırıcılık',
  'Diğer'
];

export function ReportModal({ isOpen, onClose, targetType, targetId }: ReportModalProps) {
  const [selectedCategory, setSelectedCategory] = useState('');
  const [details, setDetails] = useState('');

  const createReport = trpc.user.createReport.useMutation({
    onSuccess: () => {
      toast.success('Şikayetiniz başarıyla alındı. Teşekkür ederiz.');
      onClose();
      setSelectedCategory('');
      setDetails('');
    },
    onError: (err) => {
      toast.error(err.message || 'Şikayet gönderilirken bir hata oluştu.');
    }
  });

  if (!isOpen) return null;

  const categories = targetType === 'POST' ? POST_CATEGORIES : targetType === 'USER' ? USER_CATEGORIES : ['Diğer'];

  const handleSubmit = () => {
    if (!selectedCategory) {
      toast.error('Lütfen bir kategori seçin.');
      return;
    }
    const finalReason = details.trim() ? `${selectedCategory} - ${details.trim()}` : selectedCategory;
    createReport.mutate({
      targetType,
      targetId,
      reason: finalReason
    });
  };

  return (
    <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in duration-200">
      <div className="bg-card border border-border/70 rounded-2xl shadow-2xl max-w-md w-full flex flex-col overflow-hidden animate-in zoom-in-95 duration-200">
        <div className="flex items-center justify-between px-5 py-4 border-b border-border/50 bg-orange-500/5">
          <h3 className="font-bold text-lg text-orange-500 flex items-center gap-2">
            <AlertTriangle className="w-5 h-5" /> Şikayet Et
          </h3>
          <button 
            onClick={onClose}
            className="p-1.5 hover:bg-muted rounded-lg text-muted-foreground hover:text-foreground transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
        
        <div className="p-5 space-y-4">
          <p className="text-sm text-muted-foreground">
            Lütfen şikayet nedeninizi seçin. Geri bildiriminiz topluluğumuzu güvenli tutmamıza yardımcı olur.
          </p>

          <div>
            <label className="text-sm font-semibold text-foreground mb-1.5 block">Kategori</label>
            <div className="flex flex-col gap-2">
              {categories.map(cat => (
                <label key={cat} className="flex items-center gap-3 p-2 rounded-lg hover:bg-muted/50 cursor-pointer border border-transparent hover:border-border transition-colors">
                  <input 
                    type="radio" 
                    name="reportCategory" 
                    value={cat} 
                    checked={selectedCategory === cat}
                    onChange={() => setSelectedCategory(cat)}
                    className="w-4 h-4 text-primary focus:ring-primary accent-primary"
                  />
                  <span className="text-sm font-medium text-foreground">{cat}</span>
                </label>
              ))}
            </div>
          </div>

          <div>
            <label className="text-sm font-semibold text-foreground mb-1.5 block">Detaylar (İsteğe Bağlı)</label>
            <textarea 
              value={details}
              onChange={(e) => setDetails(e.target.value)}
              placeholder="Eklemek istediğiniz başka bir şey var mı?"
              className="w-full bg-background border border-border rounded-lg p-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 min-h-[80px]"
            />
          </div>
        </div>

        <div className="px-5 py-4 border-t border-border/50 bg-muted/20 flex justify-end gap-2">
          <button 
            onClick={onClose}
            className="px-4 py-2 font-semibold text-sm rounded-lg hover:bg-secondary transition-colors text-foreground"
          >
            İptal
          </button>
          <button 
            onClick={handleSubmit}
            disabled={createReport.isPending || !selectedCategory}
            className="px-4 py-2 bg-orange-500 text-white font-semibold text-sm rounded-lg hover:bg-orange-600 transition-colors disabled:opacity-50"
          >
            {createReport.isPending ? 'Gönderiliyor...' : 'Şikayet Et'}
          </button>
        </div>
      </div>
    </div>
  );
}
