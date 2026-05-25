import { createFileRoute, useNavigate, Link } from '@tanstack/react-router';
import { useState } from 'react';
import { trpc } from '../lib/trpc';
import toast from 'react-hot-toast';
import { useSession } from '@collabswipe/auth/client';
import { ArrowLeft, Briefcase, FileText, CheckCircle2 } from 'lucide-react';

export const Route = createFileRoute('/jobs_/post')({
  component: PostJobPage,
});

function PostJobPage() {
  const navigate = useNavigate();
  const { data: session } = useSession();
  
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [type, setType] = useState<'FREELANCE' | 'CORPORATE'>('CORPORATE');
  
  const createJob = trpc.job.create.useMutation({
    onSuccess: () => {
      toast.success('İş ilanı başarıyla yayınlandı!');
      navigate({ to: '/jobs' });
    },
    onError: (error) => {
      toast.error(error.message || 'İlan yayınlanırken bir hata oluştu.');
    }
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !description.trim()) {
      toast.error('Lütfen tüm alanları doldurun.');
      return;
    }
    
    createJob.mutate({
      title,
      description,
      type
    });
  };

  if (session && (session.user as any)?.role !== 'company') {
    return (
      <div className="flex flex-col items-center justify-center p-8 h-full">
        <div className="bg-destructive/10 text-destructive p-6 rounded-2xl max-w-md text-center">
          <h2 className="text-xl font-bold mb-2">Erişim Engellendi</h2>
          <p className="text-sm opacity-80 mb-4">Sadece şirket hesapları iş ilanı yayınlayabilir.</p>
          <Link to="/" className="bg-background px-4 py-2 rounded-lg font-bold">Ana Sayfaya Dön</Link>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto w-full pb-20 md:pb-0">
      <Link 
        to="/jobs" 
        className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors mb-6"
      >
        <ArrowLeft className="w-5 h-5" />
        <span className="font-medium">İlanlara Dön</span>
      </Link>
      
      <div className="bg-card border border-border rounded-3xl p-6 md:p-10 shadow-xl relative overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-primary via-accent to-secondary" />
        
        <div className="flex items-center gap-4 mb-8">
          <div className="w-14 h-14 bg-primary/10 rounded-2xl flex items-center justify-center text-primary">
            <Briefcase className="w-7 h-7" />
          </div>
          <div>
            <h1 className="text-2xl md:text-3xl font-black text-foreground">Yeni İş İlanı</h1>
            <p className="text-muted-foreground mt-1">Ekibinize katılacak en iyi yetenekleri bulun.</p>
          </div>
        </div>
        
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-2">
            <label className="text-sm font-bold text-foreground">İlan Başlığı</label>
            <input 
              type="text" 
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Örn: Senior Frontend Developer"
              className="w-full bg-background border border-border rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-primary transition-colors placeholder:text-muted-foreground/50"
            />
          </div>
          
          <div className="space-y-2">
            <label className="text-sm font-bold text-foreground">Çalışma Tipi</label>
            <div className="grid grid-cols-2 gap-4">
              <button
                type="button"
                onClick={() => setType('CORPORATE')}
                className={`p-4 border rounded-2xl flex flex-col items-center justify-center gap-2 transition-all ${
                  type === 'CORPORATE' 
                    ? 'border-primary bg-primary/5 text-primary shadow-sm' 
                    : 'border-border bg-background text-muted-foreground hover:border-border/80'
                }`}
              >
                <Briefcase className="w-6 h-6" />
                <span className="font-bold text-sm">Kurumsal / Tam Zamanlı</span>
              </button>
              <button
                type="button"
                onClick={() => setType('FREELANCE')}
                className={`p-4 border rounded-2xl flex flex-col items-center justify-center gap-2 transition-all ${
                  type === 'FREELANCE' 
                    ? 'border-primary bg-primary/5 text-primary shadow-sm' 
                    : 'border-border bg-background text-muted-foreground hover:border-border/80'
                }`}
              >
                <FileText className="w-6 h-6" />
                <span className="font-bold text-sm">Freelance / Proje Bazlı</span>
              </button>
            </div>
          </div>
          
          <div className="space-y-2">
            <label className="text-sm font-bold text-foreground">İlan Açıklaması ve Kriterler</label>
            <textarea 
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Aranan nitelikler, iş tanımı, yan haklar vb. detayları yazın..."
              rows={8}
              className="w-full bg-background border border-border rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-primary transition-colors placeholder:text-muted-foreground/50 resize-y"
            />
          </div>
          
          <div className="pt-4">
            <button
              type="submit"
              disabled={createJob.isPending}
              className="w-full bg-primary hover:opacity-90 active:scale-[0.98] text-primary-foreground font-bold py-4 rounded-xl transition-all flex items-center justify-center gap-2 shadow-lg shadow-primary/20 disabled:opacity-50"
            >
              {createJob.isPending ? (
                <span className="w-5 h-5 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin" />
              ) : (
                <>
                  <CheckCircle2 className="w-5 h-5" />
                  İlanı Yayınla
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
