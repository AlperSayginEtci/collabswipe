import { createFileRoute, Link } from '@tanstack/react-router';
import { trpc } from '@/lib/trpc';
import { ArrowLeft, Building, MapPin, Clock, Briefcase, FileText } from 'lucide-react';
import { useSession } from '@collabswipe/auth/client';
import toast from 'react-hot-toast';

export const Route = createFileRoute('/jobs_/$jobId')({
  component: JobDetailsPage,
});

function JobDetailsPage() {
  const { jobId } = Route.useParams();
  const { data: session } = useSession();
  const utils = trpc.useUtils();

  const { data: job, isLoading } = trpc.job.getById.useQuery({ jobId });

  const applyJob = trpc.job.apply.useMutation({
    onSuccess: () => {
      toast.success('Başvurunuz başarıyla alındı!');
      utils.job.getById.invalidate({ jobId });
    },
    onError: (err) => {
      console.error(err);
      toast.error('Başvuru başarısız. Daha önce başvurmuş olabilirsiniz.');
    }
  });

  if (isLoading) {
    return <div className="p-8 text-center text-muted-foreground font-semibold">İlan detayları yükleniyor...</div>;
  }

  if (!job) {
    return (
      <div className="p-8 text-center">
        <h2 className="text-2xl font-bold mb-4">İlan Bulunamadı</h2>
        <Link to="/jobs" className="text-primary hover:underline">İlanlara geri dön</Link>
      </div>
    );
  }

  const hasApplied = job.applications?.some(app => app.applicantId === session?.user?.id);
  const isCurrentlyApplying = applyJob.isLoading;

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <Link to="/jobs" className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors font-medium">
        <ArrowLeft className="w-4 h-4" />
        İlanlara Dön
      </Link>

      <div className="bg-card border border-border rounded-2xl p-6 md:p-8 shadow-sm">
        <div className="flex flex-col md:flex-row md:items-start justify-between gap-6">
          <div className="flex items-start gap-5">
            <div className="w-16 h-16 rounded-xl bg-secondary flex items-center justify-center shrink-0">
              {job.publisher?.image ? (
                <img src={job.publisher.image} alt={job.publisher.name || 'Company'} className='w-full h-full object-cover rounded-xl' />
              ) : (
                <Building className="w-8 h-8 text-muted-foreground" />
              )}
            </div>
            <div className="space-y-1">
              <h1 className="text-2xl md:text-3xl font-extrabold text-foreground">{job.title}</h1>
              <p className="text-primary font-medium text-lg">{job.publisher?.name || "Company"} {job.publisher?.surname || ""}</p>
              
              <div className="flex flex-wrap items-center gap-4 mt-4 text-muted-foreground text-sm font-medium">
                <span className="flex items-center gap-1.5"><MapPin className="w-4 h-4" /> Uzaktan (Remote)</span>
                <span className="flex items-center gap-1.5"><Clock className="w-4 h-4" /> {new Date(job.createdAt).toLocaleDateString()}</span>
                <span className="flex items-center gap-1.5"><Briefcase className="w-4 h-4" /> {job.type === "FREELANCE" ? "Serbest Çalışan (Freelance)" : "Kurumsal"}</span>
                {job.skill?.skillName && (
                  <span className="bg-primary/10 text-primary px-2.5 py-1 rounded-md text-xs font-bold uppercase tracking-wider">{job.skill.skillName}</span>
                )}
              </div>
            </div>
          </div>

          <div className="flex flex-col gap-3 min-w-[200px]">
            <button 
              onClick={() => {
                if (!session?.user?.id) {
                  toast.error("Başvuru yapmak için giriş yapmalısınız.");
                  return;
                }
                applyJob.mutate({ jobId: job.id, applicantId: session.user.id });
              }}
              disabled={isCurrentlyApplying || hasApplied}
              className={`font-bold px-6 py-3 rounded-xl transition-all w-full shadow-sm ${hasApplied ? `bg-secondary text-muted-foreground cursor-not-allowed` : `bg-foreground text-background hover:opacity-90 active:scale-95`}`}
            >
              {hasApplied ? 'Başvuruldu' : isCurrentlyApplying ? 'Başvuruluyor...' : 'Hemen Başvur'}
            </button>
            <p className="text-xs text-center text-muted-foreground font-medium">
              {job.applications?.length || 0} kişi başvurdu
            </p>
          </div>
        </div>
      </div>

      <div className="bg-card border border-border rounded-2xl p-6 md:p-8 shadow-sm space-y-6">
        <div className="flex items-center gap-2 text-xl font-bold border-b border-border pb-4">
          <FileText className="w-5 h-5 text-primary" />
          İlan Detayları
        </div>
        <div className="prose prose-sm md:prose-base dark:prose-invert max-w-none text-muted-foreground whitespace-pre-wrap">
          {job.description}
        </div>
      </div>
    </div>
  );
}
