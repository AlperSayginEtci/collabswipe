import { useState } from 'react';
import { createFileRoute } from '@tanstack/react-router';
import { X, Heart, Code, MapPin, Sparkles } from 'lucide-react';
import { trpc } from '@/lib/trpc';
import { useSession } from '@collabswipe/auth/client';

export const Route = createFileRoute('/discover')({
  component: DiscoverPage,
});

function DiscoverPage() {
  const { data: session } = useSession();
  const utils = trpc.useUtils();

  const [dragStart, setDragStart] = useState<{ x: number; y: number } | null>(null);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [swipeDirection, setSwipeDirection] = useState<'left' | 'right' | null>(null);

  const { data: profiles, isLoading } = trpc.user.getDiscoverable.useQuery(
    { userId: session?.user?.id ?? '' },
    { enabled: !!session?.user?.id }
  );

  const sendRequest = trpc.connection.sendRequest.useMutation({
    onSuccess: () => {
      utils.user.getDiscoverable.invalidate();
    },
    onError: (err) => {
      console.error(err);
      alert('Bağlantı isteği gönderilemedi.');
    }
  });

  const rejectProfile = trpc.connection.rejectProfile.useMutation({
    onSuccess: () => {
      utils.user.getDiscoverable.invalidate();
    },
    onError: (err) => {
      console.error(err);
      alert('Profil reddedilemedi.');
    }
  });

  const handleConnect = (targetId: string) => {
    if (!session?.user?.id) return;
    sendRequest.mutate({ requesterId: session.user.id, addresseeId: targetId });
  };

  const handleReject = (targetId: string) => {
    if (!session?.user?.id) return;
    rejectProfile.mutate({ requesterId: session.user.id, addresseeId: targetId });
  };

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
      // Sağa fırlat ve beğen (Connect)
      setDragOffset({ x: 600, y: dragOffset.y });
      setTimeout(() => {
        handleConnect(targetId);
        setDragOffset({ x: 0, y: 0 });
        setSwipeDirection(null);
      }, 250);
    } else if (dragOffset.x < -SWIPE_THRESHOLD) {
      // Sola fırlat ve pas geç (Reject)
      setDragOffset({ x: -600, y: dragOffset.y });
      setTimeout(() => {
        handleReject(targetId);
        setDragOffset({ x: 0, y: 0 });
        setSwipeDirection(null);
      }, 250);
    } else {
      // Geri merkeze yaylan (Spring back)
      setDragOffset({ x: 0, y: 0 });
      setSwipeDirection(null);
    }
  };

  const handleButtonReject = (targetId: string) => {
    setDragOffset({ x: -600, y: 0 });
    setTimeout(() => {
      handleReject(targetId);
      setDragOffset({ x: 0, y: 0 });
    }, 250);
  };

  const handleButtonConnect = (targetId: string) => {
    setDragOffset({ x: 600, y: 0 });
    setTimeout(() => {
      handleConnect(targetId);
      setDragOffset({ x: 0, y: 0 });
    }, 250);
  };

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[85vh]">
        <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin mb-4" />
        <p className="text-muted-foreground font-semibold animate-pulse">Keşif haritası yükleniyor...</p>
      </div>
    );
  }

  const currentProfile = profiles?.[0];

  if (!currentProfile) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[85vh] text-center px-4">
        <div className="w-20 h-20 bg-primary/10 text-primary rounded-full flex items-center justify-center mb-6 animate-bounce">
          <Sparkles className="w-10 h-10" />
        </div>
        <h2 className="text-2xl font-black mb-2">Harika İş! 🎉</h2>
        <p className="text-muted-foreground max-w-sm">
          Çevrendeki keşfedilebilir tüm profilleri inceledin. Yeni insanlar katıldıkça burada listelenecekler!
        </p>
      </div>
    );
  }

  const skills = currentProfile.profile?.skills?.map((s) => s.skill.skillName) ?? [];

  return (
    <div className="flex flex-col items-center justify-center min-h-[85vh] select-none">
      <div className="w-full max-w-sm relative">
        
        {/* Swipe Card Container */}
        <div 
          onMouseDown={(e) => handleDragStart(e.clientX, e.clientY)}
          onMouseMove={(e) => {
            if (e.buttons !== 1) return;
            handleDragMove(e.clientX, e.clientY);
          }}
          onMouseUp={() => handleDragEnd(currentProfile.id)}
          onMouseLeave={() => {
            if (isDragging) handleDragEnd(currentProfile.id);
          }}
          
          onTouchStart={(e) => {
            const touch = e.touches[0];
            handleDragStart(touch.clientX, touch.clientY);
          }}
          onTouchMove={(e) => {
            const touch = e.touches[0];
            handleDragMove(touch.clientX, touch.clientY);
          }}
          onTouchEnd={() => handleDragEnd(currentProfile.id)}
          
          style={{
            transform: `translate3d(${dragOffset.x}px, ${dragOffset.y}px, 0) rotate(${dragOffset.x * 0.04}deg)`,
            transition: isDragging ? 'none' : 'transform 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.255)'
          }}
          className="bg-card w-full h-[600px] rounded-[2rem] shadow-2xl border border-border overflow-hidden relative flex flex-col cursor-grab active:cursor-grabbing z-20"
        >
          {/* Like/Nope Overlays inside the card */}
          {swipeDirection === 'right' && (
            <div className="absolute top-8 left-8 z-30 border-4 border-green-500 text-green-500 font-black text-2xl px-4 py-1.5 rounded-xl uppercase tracking-widest transform -rotate-12 select-none animate-pulse">
              BEĞEN
            </div>
          )}
          {swipeDirection === 'left' && (
            <div className="absolute top-8 right-8 z-30 border-4 border-red-500 text-red-500 font-black text-2xl px-4 py-1.5 rounded-xl uppercase tracking-widest transform rotate-12 select-none animate-pulse">
              GEÇ
            </div>
          )}

          {/* Banner/Image Area */}
          <div className="h-2/5 bg-gradient-to-tr from-primary to-primary/50 relative pointer-events-none">
            <img 
              src={currentProfile.image || `https://api.dicebear.com/7.x/notionists/svg?seed=${currentProfile.name}`} 
              alt={`${currentProfile.name} ${currentProfile.surname}`} 
              className="absolute inset-0 w-full h-full object-cover opacity-85"
            />
            {/* Location Badge */}
            {currentProfile.profile?.location && (
              <div className="absolute top-4 right-4 bg-background/80 backdrop-blur-md px-3 py-1 rounded-full text-xs font-bold border border-border text-foreground flex items-center gap-1">
                <MapPin className="w-3.5 h-3.5 text-primary" /> {currentProfile.profile.location}
              </div>
            )}
          </div>
          
          <div className="flex-1 p-6 flex flex-col justify-between pointer-events-none">
            <div>
              <h2 className="text-3xl font-black text-foreground mb-3">
                {currentProfile.name} {currentProfile.surname}
              </h2>
              <p className="text-foreground leading-relaxed text-sm">
                {currentProfile.profile?.bio || 'Bu kullanıcı henüz bir biyografi eklememiş.'}
              </p>
            </div>

            {/* Skills */}
            {skills.length > 0 && (
              <div className="flex flex-wrap gap-2 mt-4 mb-16">
                {skills.map((skill) => (
                  <span key={skill} className="bg-secondary text-secondary-foreground px-3 py-1 rounded-full text-[11px] font-bold uppercase tracking-wider flex items-center gap-1">
                    <Code className="w-3.5 h-3.5" /> {skill}
                  </span>
                ))}
              </div>
            )}
          </div>

          {/* Action Buttons */}
          <div className="absolute bottom-6 left-0 w-full flex justify-center gap-6 px-8 z-40">
            <button 
              onMouseDown={(e) => e.stopPropagation()}
              onTouchStart={(e) => e.stopPropagation()}
              onClick={() => handleButtonReject(currentProfile.id)}
              disabled={rejectProfile.isLoading || sendRequest.isLoading}
              className="w-16 h-16 rounded-full bg-background border border-border shadow-lg flex items-center justify-center text-destructive hover:bg-destructive hover:text-destructive-foreground transition-all duration-300 hover:scale-110 disabled:opacity-50"
            >
              <X className="w-8 h-8" />
            </button>
            <button 
              onMouseDown={(e) => e.stopPropagation()}
              onTouchStart={(e) => e.stopPropagation()}
              onClick={() => handleButtonConnect(currentProfile.id)}
              disabled={sendRequest.isLoading || rejectProfile.isLoading}
              className="w-16 h-16 rounded-full bg-background border border-border shadow-lg flex items-center justify-center text-green-500 hover:bg-green-500 hover:text-white transition-all duration-300 hover:scale-110 disabled:opacity-50"
            >
              <Heart className="w-8 h-8 fill-current" />
            </button>
          </div>
        </div>

        {/* Stack Effect Cards Behind */}
        <div className="absolute top-4 left-4 right-4 h-full bg-card rounded-[2rem] border border-border shadow-xl z-10 scale-95 opacity-50 transition-all duration-300" />
        <div className="absolute top-8 left-8 right-8 h-full bg-card rounded-[2rem] border border-border shadow-xl z-0 scale-90 opacity-20 transition-all duration-300" />
      </div>
    </div>
  );
}
