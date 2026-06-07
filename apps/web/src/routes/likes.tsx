import { createFileRoute } from '@tanstack/react-router';
import { useSession } from '@collabswipe/auth/client';
import { trpc } from '../lib/trpc';
import { Heart, Inbox, User as UserIcon, Check, X, Building, MapPin } from 'lucide-react';
import toast from 'react-hot-toast';

export const Route = createFileRoute('/likes')({
  component: LikesPage,
});

function LikesPage() {
  const { data: session } = useSession();
  const isCompany = (session?.user as any)?.role === 'company';
  
  if (!session) return null;

  return (
    <div className="max-w-4xl mx-auto w-full pb-20 md:pb-0 h-full flex flex-col">
      <div className="flex items-center gap-4 mb-6 px-2">
        <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${isCompany ? 'bg-primary/10 text-primary' : 'bg-red-500/10 text-red-500'}`}>
          {isCompany ? <Inbox className="w-6 h-6" /> : <Heart className="w-6 h-6" />}
        </div>
        <div>
          <h1 className="text-2xl font-black text-foreground">{isCompany ? 'Başvuranlar' : 'Seni Beğenenler'}</h1>
          <p className="text-muted-foreground text-sm">
            {isCompany ? 'İlanlarınıza yapılan başvuruları buradan inceleyebilirsiniz.' : 'Profilini beğenen kullanıcıları gör ve eşleş.'}
          </p>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar">
        {isCompany ? <CompanyApplicants /> : <UserLikes />}
      </div>
    </div>
  );
}

function UserLikes() {
  const { data: session } = useSession();
  const utils = trpc.useUtils();
  
  const { data: pendingRequests, isLoading } = trpc.connection.getPendingRequests.useQuery(
    { userId: session?.user?.id || '' },
    { enabled: !!session?.user?.id }
  );

  const respondMutation = trpc.connection.respond.useMutation({
    onSuccess: () => {
      utils.connection.getPendingRequests.invalidate();
      toast.success('Yanıtlandı!');
    }
  });

  if (isLoading) return <div className="text-center py-10 text-muted-foreground">Yükleniyor...</div>;

  if (!pendingRequests || pendingRequests.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <div className="w-20 h-20 bg-secondary rounded-full flex items-center justify-center mb-4">
          <Heart className="w-10 h-10 text-muted-foreground/30" />
        </div>
        <h3 className="text-xl font-bold">Henüz Beğeni Yok</h3>
        <p className="text-muted-foreground mt-2 max-w-sm">Keşfet sekmesinde aktif olarak diğer kullanıcıları beğendiğinde daha fazla etkileşim alabilirsin.</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      {pendingRequests.map(req => (
        <div key={req.requester.id} className="bg-card border border-border rounded-2xl p-4 flex gap-4 items-center">
          {req.requester.image ? (
            <img src={req.requester.image} alt={req.requester.name || 'User'} className="w-16 h-16 rounded-full object-cover" />
          ) : (
            <div className="w-16 h-16 rounded-full bg-secondary flex items-center justify-center">
              <UserIcon className="w-8 h-8 text-muted-foreground" />
            </div>
          )}
          <div className="flex-1 overflow-hidden">
            <h4 className="font-bold text-lg truncate">{req.requester.name} {req.requester.surname}</h4>
            <p className="text-xs text-muted-foreground mt-1">Seni beğendi!</p>
          </div>
          <div className="flex flex-col gap-2">
            <button 
              onClick={() => respondMutation.mutate({ requesterId: req.requester.id, addresseeId: session!.user!.id, status: 'ACCEPTED' })}
              className="w-10 h-10 rounded-full bg-primary/10 text-primary flex items-center justify-center hover:bg-primary hover:text-white transition-colors shadow-sm"
            >
              <Check className="w-5 h-5" />
            </button>
            <button 
              onClick={() => respondMutation.mutate({ requesterId: req.requester.id, addresseeId: session!.user!.id, status: 'REJECTED' })}
              className="w-10 h-10 rounded-full bg-destructive/10 text-destructive flex items-center justify-center hover:bg-destructive hover:text-white transition-colors shadow-sm"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}

function CompanyApplicants() {
  const { data: applications, isLoading } = trpc.job.getCompanyApplications.useQuery();
  const utils = trpc.useUtils();

  const updateStatus = trpc.job.updateApplicationStatus.useMutation({
    onSuccess: () => {
      utils.job.getCompanyApplications.invalidate();
      toast.success('Durum güncellendi!');
    }
  });

  if (isLoading) return <div className="text-center py-10 text-muted-foreground">Yükleniyor...</div>;

  if (!applications || applications.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <div className="w-20 h-20 bg-secondary rounded-full flex items-center justify-center mb-4">
          <Inbox className="w-10 h-10 text-muted-foreground/30" />
        </div>
        <h3 className="text-xl font-bold">Henüz Başvuru Yok</h3>
        <p className="text-muted-foreground mt-2 max-w-sm">İlanlarınıza henüz kimse başvurmadı.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {applications.map(app => (
        <div key={app.id} className="bg-card border border-border rounded-2xl p-5 flex flex-col md:flex-row gap-4">
          {/* Applicant Info */}
          <div className="flex items-start gap-4 md:w-1/2">
            {app.applicant.image ? (
              <img src={app.applicant.image} alt={app.applicant.name || 'Applicant'} className="w-14 h-14 rounded-full object-cover shrink-0" />
            ) : (
              <div className="w-14 h-14 rounded-full bg-secondary flex items-center justify-center shrink-0">
                <UserIcon className="w-6 h-6 text-muted-foreground" />
              </div>
            )}
            <div className="flex-1">
              <h4 className="font-bold text-lg">{app.applicant.name} {app.applicant.surname}</h4>
              <div className="flex items-center gap-2 text-xs text-muted-foreground mt-1">
                <Building className="w-3 h-3" />
                <span className="truncate">{app.job.title} ilanına başvurdu</span>
              </div>
              {app.applicant.profile?.location && (
                <div className="flex items-center gap-2 text-xs text-muted-foreground mt-1">
                  <MapPin className="w-3 h-3" />
                  <span>{app.applicant.profile.location}</span>
                </div>
              )}
            </div>
          </div>
          
          {/* Action & Status */}
          <div className="flex flex-row md:flex-col justify-between items-center md:items-end md:w-1/2 pt-4 md:pt-0 border-t md:border-t-0 border-border">
            <span className={`text-xs font-bold px-3 py-1 rounded-full mb-0 md:mb-4 ${app.status === 'PENDING' ? 'bg-amber-500/10 text-amber-500' : app.status === 'ACCEPTED' ? 'bg-primary/10 text-primary' : 'bg-destructive/10 text-destructive'}`}>
              {app.status === 'PENDING' ? 'Bekliyor' : app.status === 'ACCEPTED' ? 'Kabul Edildi' : 'Reddedildi'}
            </span>
            
            {app.status === 'PENDING' && (
              <div className="flex gap-2">
                <button 
                  onClick={() => updateStatus.mutate({ applicationId: app.id, status: 'REJECTED' })}
                  className="px-4 py-2 rounded-xl text-sm font-bold bg-destructive/10 text-destructive hover:bg-destructive hover:text-white transition-colors"
                >
                  Reddet
                </button>
                <button 
                  onClick={() => updateStatus.mutate({ applicationId: app.id, status: 'ACCEPTED' })}
                  className="px-4 py-2 rounded-xl text-sm font-bold bg-primary text-white hover:opacity-90 transition-opacity shadow-md"
                >
                  Kabul Et
                </button>
              </div>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}
