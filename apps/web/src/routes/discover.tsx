import { useState } from 'react';
import { createFileRoute } from '@tanstack/react-router';
import { X, Heart, Code, MapPin, Sparkles, Briefcase, User } from 'lucide-react';
import { trpc } from '@/lib/trpc';
import { useSession } from '@collabswipe/auth/client';
import toast from 'react-hot-toast';

export const Route = createFileRoute('/discover')({
  component: DiscoverPage,
});

function DiscoverPage() {
  const { data: session } = useSession();
  const userId = session?.user?.id;
  const utils = trpc.useUtils();

  // Tabs
  const [activeTab, setActiveTab] = useState<'PROFILES' | 'JOBS'>('PROFILES');

  // Drag states
  const [dragStart, setDragStart] = useState<{ x: number; y: number } | null>(null);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [swipeDirection, setSwipeDirection] = useState<'left' | 'right' | null>(null);

  // Profile Swiping Logic
  const [swipedProfileIds, setSwipedProfileIds] = useState<string[]>([]);
  
  const { data: profilesData, isLoading: isProfilesLoading } = trpc.user.getDiscoverable.useQuery(
    { userId: userId || '' },
    { enabled: !!userId && activeTab === 'PROFILES' }
  );

  const sendRequest = trpc.connection.sendRequest.useMutation({
    onSuccess: () => utils.user.getDiscoverable.invalidate(),
    onError: (err) => {
      console.error(err);
      toast.error('Bağlantı isteği gönderilemedi.');
    }
  });

  const rejectProfile = trpc.connection.rejectProfile.useMutation({
    onSuccess: () => utils.user.getDiscoverable.invalidate(),
    onError: (err) => {
      console.error(err);
      toast.error('Profil reddedilemedi.');
    }
  });

  // Job Swiping Logic
  const [swipedJobIds, setSwipedJobIds] = useState<string[]>([]);
  
  const { data: jobsData, isLoading: isJobsLoading } = trpc.job.list.useQuery(
    { userId: userId || '' },
    { enabled: !!userId && activeTab === 'JOBS' }
  );

  const applyJob = trpc.job.apply.useMutation({
    onSuccess: () => {
      toast.success('İlana başvuruldu!');
      utils.job.list.invalidate();
    },
    onError: (err) => {
      console.error(err);
      toast.error(err.message || 'Başvuru yapılamadı.');
    }
  });

  const handleConnect = (targetId: string) => {
    if (!userId) return;
    setSwipedProfileIds(prev => [...prev, targetId]);
    sendRequest.mutate({ requesterId: userId, addresseeId: targetId });
  };

  const handleReject = (targetId: string) => {
    if (!userId) return;
    setSwipedProfileIds(prev => [...prev, targetId]);
    rejectProfile.mutate({ requesterId: userId, addresseeId: targetId });
  };

  const handleApplyJob = (jobId: string) => {
    if (!userId) return;
    setSwipedJobIds(prev => [...prev, jobId]);
    applyJob.mutate({ jobId, applicantId: userId });
  };

  const handleSkipJob = (jobId: string) => {
    setSwipedJobIds(prev => [...prev, jobId]);
  };

  // Determine current stack
  const isProfiles = activeTab === 'PROFILES';
  const activeProfiles = profilesData?.filter(p => !swipedProfileIds.includes(p.id)) || [];
  const activeJobs = jobsData?.items?.filter(j => !swipedJobIds.includes(j.id)) || [];
  
  const activeItems = isProfiles ? activeProfiles : activeJobs;
  const isLoading = isProfiles ? isProfilesLoading : isJobsLoading;
  const isBusy = sendRequest.isLoading || rejectProfile.isLoading || applyJob.isLoading;

  const itemsToRender = activeItems.slice(0, 3).reverse();

  // Sürükleme Event Handlers
  const handleDragStart = (clientX: number, clientY: number) => {
    setDragStart({ x: clientX, y: clientY });
    setIsDragging(true);
  };

  const handleDragMove = (clientX: number, clientY: number) => {
    if (!dragStart) return;
    const offsetX = clientX - dragStart.x;
    const offsetY = clientY - dragStart.y;
    setDragOffset({ x: offsetX, y: offsetY });

    if (offsetX > 100) {
      setSwipeDirection('right');
    } else if (offsetX < -100) {
      setSwipeDirection('left');
    } else {
      setSwipeDirection(null);
    }
  };

  const handleDragEnd = (targetId: string) => {
    if (!dragStart) return;
    setIsDragging(false);
    setDragStart(null);

    const SWIPE_THRESHOLD = 130;
    if (dragOffset.x > SWIPE_THRESHOLD) {
      // Sağa fırlat
      setDragOffset({ x: 600, y: dragOffset.y });
      setTimeout(() => {
        if (isProfiles) handleConnect(targetId);
        else handleApplyJob(targetId);
        
        setDragOffset({ x: 0, y: 0 });
        setSwipeDirection(null);
      }, 250);
    } else if (dragOffset.x < -SWIPE_THRESHOLD) {
      // Sola fırlat
      setDragOffset({ x: -600, y: dragOffset.y });
      setTimeout(() => {
        if (isProfiles) handleReject(targetId);
        else handleSkipJob(targetId);
        
        setDragOffset({ x: 0, y: 0 });
        setSwipeDirection(null);
      }, 250);
    } else {
      // Geri merkeze yaylan
      setDragOffset({ x: 0, y: 0 });
      setSwipeDirection(null);
    }
  };

  const handleButtonReject = (targetId: string) => {
    setDragOffset({ x: -600, y: 0 });
    setTimeout(() => {
      if (isProfiles) handleReject(targetId);
      else handleSkipJob(targetId);
      setDragOffset({ x: 0, y: 0 });
    }, 250);
  };

  const handleButtonAccept = (targetId: string) => {
    setDragOffset({ x: 600, y: 0 });
    setTimeout(() => {
      if (isProfiles) handleConnect(targetId);
      else handleApplyJob(targetId);
      setDragOffset({ x: 0, y: 0 });
    }, 250);
  };

  return (
    <div className="flex flex-col items-center min-h-[85vh] select-none py-4">
      
      {/* Tab Toggle */}
      <div className="w-full max-w-sm flex bg-secondary/50 p-1 rounded-2xl mb-8 border border-border">
        <button
          onClick={() => setActiveTab('PROFILES')}
          className={`flex-1 py-3 rounded-xl font-bold text-sm transition-all duration-300 flex items-center justify-center gap-2 ${
            activeTab === 'PROFILES' ? 'bg-background text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'
          }`}
        >
          <User className="w-4 h-4" /> İş Arkadaşları
        </button>
        <button
          onClick={() => setActiveTab('JOBS')}
          className={`flex-1 py-3 rounded-xl font-bold text-sm transition-all duration-300 flex items-center justify-center gap-2 ${
            activeTab === 'JOBS' ? 'bg-background text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'
          }`}
        >
          <Briefcase className="w-4 h-4" /> İş İlanları
        </button>
      </div>

      {isLoading ? (
        <div className="flex flex-col items-center justify-center flex-1">
          <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin mb-4" />
          <p className="text-muted-foreground font-semibold animate-pulse">Keşif haritası yükleniyor...</p>
        </div>
      ) : itemsToRender.length === 0 ? (
        <div className="flex flex-col items-center justify-center flex-1 text-center px-4 max-w-sm">
          <div className="w-20 h-20 bg-primary/10 text-primary rounded-full flex items-center justify-center mb-6 animate-bounce">
            <Sparkles className="w-10 h-10" />
          </div>
          <h2 className="text-2xl font-black mb-2">Harika İş! 🎉</h2>
          <p className="text-muted-foreground">
            {isProfiles 
              ? 'Çevrendeki keşfedilebilir tüm profilleri inceledin. Yeni insanlar katıldıkça burada listelenecekler!'
              : 'Şu an için uygun olan tüm iş ilanlarına göz attın. Yeni ilanlar eklendiğinde tekrar uğra!'}
          </p>
        </div>
      ) : (
        <div className="w-full max-w-sm relative flex-1 flex flex-col justify-center h-[600px]">
          
          {/* Stacked Cards */}
          {itemsToRender.map((currentItem, index) => {
            const isTop = index === itemsToRender.length - 1;
            const stackIndex = itemsToRender.length - 1 - index;

            return (
              <div 
                key={currentItem.id}
                onMouseDown={isTop ? (e) => handleDragStart(e.clientX, e.clientY) : undefined}
                onMouseMove={isTop ? (e) => {
                  if (e.buttons !== 1) return;
                  handleDragMove(e.clientX, e.clientY);
                } : undefined}
                onMouseUp={isTop ? () => handleDragEnd(currentItem.id) : undefined}
                onMouseLeave={isTop ? () => {
                  if (isDragging) handleDragEnd(currentItem.id);
                } : undefined}
                onTouchStart={isTop ? (e) => {
                  const touch = e.touches[0];
                  handleDragStart(touch.clientX, touch.clientY);
                } : undefined}
                onTouchMove={isTop ? (e) => {
                  const touch = e.touches[0];
                  handleDragMove(touch.clientX, touch.clientY);
                } : undefined}
                onTouchEnd={isTop ? () => handleDragEnd(currentItem.id) : undefined}
                
                style={isTop ? {
                  transform: `translate3d(${dragOffset.x}px, ${dragOffset.y}px, 0) rotate(${dragOffset.x * 0.04}deg)`,
                  transition: isDragging ? 'none' : 'transform 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.255)',
                  zIndex: 20
                } : {
                  transform: `translate3d(0, ${stackIndex * 16}px, 0) scale(${1 - stackIndex * 0.05})`,
                  opacity: 1 - stackIndex * 0.3,
                  transition: 'all 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.255)',
                  zIndex: 20 - stackIndex
                }}
                className={`bg-card w-full h-[600px] rounded-[2rem] shadow-2xl border border-border overflow-hidden absolute top-0 left-0 flex flex-col ${isTop ? 'cursor-grab active:cursor-grabbing' : 'pointer-events-none'}`}
              >
                {/* Like/Nope Overlays */}
                {isTop && swipeDirection === 'right' && (
                  <div className="absolute top-8 left-8 z-30 border-4 border-green-500 text-green-500 font-black text-2xl px-4 py-1.5 rounded-xl uppercase tracking-widest transform -rotate-12 select-none animate-pulse">
                    {isProfiles ? 'BEĞEN' : 'BAŞVUR'}
                  </div>
                )}
                {isTop && swipeDirection === 'left' && (
                  <div className="absolute top-8 right-8 z-30 border-4 border-red-500 text-red-500 font-black text-2xl px-4 py-1.5 rounded-xl uppercase tracking-widest transform rotate-12 select-none animate-pulse">
                    GEÇ
                  </div>
                )}

                {/* Banner/Image Area */}
                <div className={`h-2/5 relative pointer-events-none ${isProfiles ? 'bg-gradient-to-tr from-primary to-primary/50' : 'bg-gradient-to-tr from-blue-600 to-indigo-900'}`}>
                  <img 
                    src={
                      isProfiles 
                      ? (currentItem.image || `https://api.dicebear.com/7.x/notionists/svg?seed=${currentItem.name}`)
                      : (currentItem.publisher?.image || `https://api.dicebear.com/7.x/shapes/svg?seed=${currentItem.id}`)
                    } 
                    alt="Banner" 
                    className="absolute inset-0 w-full h-full object-cover opacity-85"
                  />
                  
                  {/* Location or Type Badge */}
                  <div className="absolute top-4 right-4 bg-background/90 backdrop-blur-md px-3 py-1 rounded-full text-xs font-bold border border-border text-foreground flex items-center gap-1">
                    {isProfiles ? (
                      <>
                        <MapPin className="w-3.5 h-3.5 text-primary" /> {currentItem.profile?.location || 'Türkiye'}
                      </>
                    ) : (
                      <>
                        <Briefcase className="w-3.5 h-3.5 text-primary" /> {currentItem.type}
                      </>
                    )}
                  </div>
                </div>
                
                <div className="flex-1 p-6 flex flex-col justify-between pointer-events-none">
                  <div>
                    <h2 className="text-3xl font-black text-foreground mb-1">
                      {isProfiles 
                        ? `${currentItem.name} ${currentItem.surname}` 
                        : currentItem.title}
                    </h2>
                    
                    {/* Secondary Title */}
                    <h3 className="text-primary font-bold text-sm mb-3">
                      {isProfiles 
                        ? currentItem.email
                        : `${currentItem.publisher?.name || 'Şirket'} ${currentItem.publisher?.surname || ''}`}
                    </h3>

                    <p className="text-foreground leading-relaxed text-sm">
                      {isProfiles 
                        ? (currentItem.profile?.bio || 'Bu kullanıcı henüz bir biyografi eklememiş.')
                        : (currentItem.description)}
                    </p>
                  </div>

                  {/* Skills / Tags */}
                  <div className="flex flex-wrap gap-2 mt-4 mb-16">
                    {isProfiles ? (
                      currentItem.profile?.skills?.map((s: any) => (
                        <span key={s.skill.skillName} className="bg-secondary text-secondary-foreground px-3 py-1 rounded-full text-[11px] font-bold uppercase tracking-wider flex items-center gap-1">
                          <Code className="w-3.5 h-3.5" /> {s.skill.skillName}
                        </span>
                      ))
                    ) : (
                      currentItem.skill?.skillName && (
                        <span className="bg-primary/10 text-primary px-3 py-1 rounded-full text-[11px] font-bold uppercase tracking-wider flex items-center gap-1">
                          <Code className="w-3.5 h-3.5" /> {currentItem.skill.skillName}
                        </span>
                      )
                    )}
                  </div>
                </div>

                {/* Action Buttons (Only visible on top card) */}
                <div className={`absolute bottom-6 left-0 w-full flex justify-center gap-6 px-8 z-40 transition-opacity duration-300 ${isTop ? 'opacity-100' : 'opacity-0'}`}>
                  <button 
                    onMouseDown={(e) => e.stopPropagation()}
                    onTouchStart={(e) => e.stopPropagation()}
                    onClick={() => handleButtonReject(currentItem.id)}
                    disabled={isBusy}
                    className="w-16 h-16 rounded-full bg-background border border-border shadow-lg flex items-center justify-center text-destructive hover:bg-destructive hover:text-destructive-foreground transition-all duration-300 hover:scale-110 disabled:opacity-50 pointer-events-auto"
                  >
                    <X className="w-8 h-8" />
                  </button>
                  <button 
                    onMouseDown={(e) => e.stopPropagation()}
                    onTouchStart={(e) => e.stopPropagation()}
                    onClick={() => handleButtonAccept(currentItem.id)}
                    disabled={isBusy}
                    className="w-16 h-16 rounded-full bg-background border border-border shadow-lg flex items-center justify-center text-green-500 hover:bg-green-500 hover:text-white transition-all duration-300 hover:scale-110 disabled:opacity-50 pointer-events-auto"
                  >
                    <Heart className="w-8 h-8 fill-current" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
