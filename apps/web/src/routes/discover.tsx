import { useState, useRef } from 'react';
import { createFileRoute } from '@tanstack/react-router';
import { X, Heart, Code, MapPin, Sparkles, Briefcase, User, Filter, RotateCcw, ChevronDown } from 'lucide-react';
import { trpc } from '@/lib/trpc';
import { useSession } from '@collabswipe/auth/client';
import toast from 'react-hot-toast';
import { Country, State } from 'country-state-city';


export const Route = createFileRoute('/discover')({
  validateSearch: (search: Record<string, unknown>): { tab?: 'PROFILES' | 'JOBS' } => {
    return {
      tab: (search.tab === 'PROFILES' || search.tab === 'JOBS') ? search.tab : 'PROFILES',
    };
  },
  component: DiscoverPage,
});

function DiscoverPage() {
  const { data: session } = useSession();
  const userId = session?.user?.id;
  const isCompany = (session?.user as any)?.role === 'company';
  const utils = trpc.useUtils();

  // Tabs from search params
  const { tab } = Route.useSearch();
  const activeTab = isCompany ? 'PROFILES' : (tab || 'PROFILES');
  const navigate = Route.useNavigate();

  const setActiveTab = (newTab: 'PROFILES' | 'JOBS') => {
    if (isCompany && newTab === 'JOBS') return;
    navigate({ search: { tab: newTab } });
  };

  // Drag states
  const [dragStart, setDragStart] = useState<{ x: number; y: number } | null>(null);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [swipeDirection, setSwipeDirection] = useState<'left' | 'right' | null>(null);

  // Filter states
  const [showFilters, setShowFilters] = useState(false);
  const [locationType, setLocationType] = useState<'any' | 'remote' | 'in-person'>('any');
  const [selectedCountry, setSelectedCountry] = useState('');
  const [selectedCity, setSelectedCity] = useState('');
  const [selectedSkills, setSelectedSkills] = useState<string[]>([]);
  const [skillSearch, setSkillSearch] = useState('');

  const { data: allSkills } = trpc.profile.getAllSkills.useQuery();
  const filteredSkills = allSkills?.filter(s => 
    s.skillName.toLowerCase().includes(skillSearch.toLowerCase()) && 
    !selectedSkills.includes(s.skillName)
  ) || [];

  let finalLocation = '';
  let includeRemote: boolean | undefined = undefined;

  const countryName = selectedCountry ? Country.getCountryByCode(selectedCountry)?.name || selectedCountry : '';

  if (locationType === 'remote') {
    includeRemote = true;
  } else if (locationType === 'in-person') {
    if (selectedCity && countryName) finalLocation = `${selectedCity}, ${countryName}`;
    else if (countryName) finalLocation = countryName;
    includeRemote = false;
  } else if (locationType === 'any') {
    if (countryName) {
      if (selectedCity && countryName) finalLocation = `${selectedCity}, ${countryName}`;
      else finalLocation = countryName;
      includeRemote = true;
    } else {
      includeRemote = undefined;
    }
  }

  // Profile Swiping Logic
  const [swipedProfileIds, setSwipedProfileIds] = useState<string[]>([]);

  const { data: profilesData, isLoading: isProfilesLoading } = trpc.user.getDiscoverable.useQuery(
    {
      userId: userId || '',
      location: finalLocation || undefined,
      includeRemote,
      skills: selectedSkills.length > 0 ? selectedSkills : undefined,
    },
    { enabled: !!userId && activeTab === 'PROFILES' }
  );

  const sendRequest = trpc.connection.sendRequest.useMutation({
    onError: (err) => {
      console.error(err);
      toast.error('Bağlantı isteği gönderilemedi.');
    }
  });

  const rejectProfile = trpc.connection.rejectProfile.useMutation({
    onError: (err) => {
      console.error(err);
      toast.error('Profil reddedilemedi.');
    }
  });

  // Job Swiping Logic
  const [swipedJobIds, setSwipedJobIds] = useState<string[]>([]);

  const { data: jobsData, isLoading: isJobsLoading } = trpc.job.list.useQuery(
    {
      userId: userId || '',
      skills: selectedSkills.length > 0 ? selectedSkills : undefined,
    },
    { enabled: !!userId && activeTab === 'JOBS' }
  );

  const [swipeHistory, setSwipeHistory] = useState<{ id: string, type: 'PROFILE_CONNECT' | 'PROFILE_REJECT' | 'JOB_APPLY' | 'JOB_SKIP' }[]>([]);

  const undoConnection = trpc.connection.undoSwipe.useMutation();
  const undoJob = trpc.job.undoApply.useMutation();

  const applyJob = trpc.job.apply.useMutation({
    onSuccess: () => {
      toast.success('İlana başvuruldu!');
    },
    onError: (err) => {
      console.error(err);
      toast.error(err.message || 'Başvuru yapılamadı.');
    }
  });

  const handleConnect = (targetId: string) => {
    if (!userId) return;
    setSwipedProfileIds(prev => [...prev, targetId]);
    setSwipeHistory(prev => [...prev, { id: targetId, type: 'PROFILE_CONNECT' }]);
    sendRequest.mutate({ requesterId: userId, addresseeId: targetId });
  };

  const handleReject = (targetId: string) => {
    if (!userId) return;
    setSwipedProfileIds(prev => [...prev, targetId]);
    setSwipeHistory(prev => [...prev, { id: targetId, type: 'PROFILE_REJECT' }]);
    rejectProfile.mutate({ requesterId: userId, addresseeId: targetId });
  };

  const handleApplyJob = (jobId: string) => {
    if (!userId) return;
    setSwipedJobIds(prev => [...prev, jobId]);
    setSwipeHistory(prev => [...prev, { id: jobId, type: 'JOB_APPLY' }]);
    applyJob.mutate({ jobId, applicantId: userId });
  };

  const handleSkipJob = (jobId: string) => {
    setSwipedJobIds(prev => [...prev, jobId]);
    setSwipeHistory(prev => [...prev, { id: jobId, type: 'JOB_SKIP' }]);
  };

  const handleUndo = () => {
    if (swipeHistory.length === 0) return;
    
    const isProfileTab = activeTab === 'PROFILES';
    const currentTabHistory = swipeHistory.filter(h => isProfileTab ? h.type.startsWith('PROFILE') : h.type.startsWith('JOB'));
    if (currentTabHistory.length === 0) return;

    const lastAction = currentTabHistory[currentTabHistory.length - 1];
    
    setSwipeHistory(prev => prev.filter(h => h !== lastAction));
    
    if (lastAction.type.startsWith('PROFILE')) {
      setSwipedProfileIds(prev => prev.filter(id => id !== lastAction.id));
      if (lastAction.type === 'PROFILE_CONNECT' || lastAction.type === 'PROFILE_REJECT') {
        undoConnection.mutate({ requesterId: userId!, addresseeId: lastAction.id });
      }
    } else {
      setSwipedJobIds(prev => prev.filter(id => id !== lastAction.id));
      if (lastAction.type === 'JOB_APPLY') {
        undoJob.mutate({ jobId: lastAction.id, applicantId: userId! });
      }
    }
  };

  // Determine current stack
  const isProfiles = activeTab === 'PROFILES';
  const activeProfiles = profilesData?.filter(p => !swipedProfileIds.includes(p.id)) || [];
  const activeJobs = jobsData?.items?.filter(j => !swipedJobIds.includes(j.id)) || [];

  const activeItems = isProfiles ? activeProfiles : activeJobs;
  const isLoading = isProfiles ? isProfilesLoading : isJobsLoading;
  const isBusy = sendRequest.isLoading || rejectProfile.isLoading || applyJob.isLoading;

  const itemsToRender = activeItems.slice(0, 2).reverse();

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
    <div className="flex flex-col items-center justify-start flex-1 h-full select-none pt-4 pb-4 md:pb-8 w-full max-w-6xl mx-auto px-4 md:px-8">

      {/* Top Controls: Tabs & Filter */}
      <div className="w-full max-w-md flex items-center bg-secondary/50 p-1 rounded-2xl mb-6 md:mb-12 border border-border shrink-0 z-50 relative">
        <div className="flex-1 flex">
          <button
            onClick={() => setActiveTab('PROFILES')}
            className={`flex-1 py-2.5 rounded-xl font-bold text-sm transition-all duration-300 flex items-center justify-center gap-2 ${activeTab === 'PROFILES' ? 'bg-background text-foreground shadow-md scale-[1.02]' : 'text-muted-foreground hover:text-foreground hover:bg-background/50'} ${isCompany ? 'rounded-r-none' : ''}`}
          >
            <User className="w-4 h-4" /> <span className="hidden sm:inline">İş Arkadaşları</span>
          </button>
          {!isCompany && (
            <button
              onClick={() => setActiveTab('JOBS')}
              className={`flex-1 py-2.5 rounded-xl font-bold text-sm transition-all duration-300 flex items-center justify-center gap-2 ${activeTab === 'JOBS' ? 'bg-background text-foreground shadow-md scale-[1.02]' : 'text-muted-foreground hover:text-foreground hover:bg-background/50'}`}
            >
              <Briefcase className="w-4 h-4" /> <span className="hidden sm:inline">İlanlar</span>
            </button>
          )}
        </div>
        <div className="w-px h-6 bg-border mx-1"></div>
        <button
          onClick={handleUndo}
          disabled={swipeHistory.filter(h => activeTab === 'PROFILES' ? h.type.startsWith('PROFILE') : h.type.startsWith('JOB')).length === 0}
          className="py-2.5 px-3 rounded-xl font-bold text-sm transition-all duration-300 flex items-center justify-center gap-2 bg-secondary text-secondary-foreground hover:bg-secondary/80 ml-1 disabled:opacity-50 disabled:cursor-not-allowed"
          title="Geri Al"
        >
          <RotateCcw className="w-5 h-5" />
        </button>
        <button
          onClick={() => setShowFilters(true)}
          className="py-2.5 px-4 sm:px-6 rounded-xl font-bold text-sm transition-all duration-300 flex items-center justify-center gap-2 bg-primary text-primary-foreground hover:opacity-90 ml-1"
        >
          Filtrele
        </button>
      </div>

      {/* Filter Modal */}
      {showFilters && (
        <div className="fixed inset-0 z-[100] bg-background/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-card w-full max-w-md rounded-3xl shadow-2xl border border-border p-6 relative max-h-[90vh] overflow-y-auto">
            <button
              onClick={() => setShowFilters(false)}
              className="absolute top-4 right-4 p-2 text-muted-foreground hover:bg-secondary rounded-full"
            >
              <X className="w-5 h-5" />
            </button>
            <div className="flex justify-between items-end mb-6 pr-10">
              <h3 className="text-2xl font-black">Filtreler</h3>
              <button
                onClick={() => {
                  setLocationType('any');
                  setSelectedCountry('');
                  setSelectedCity('');
                  setSelectedSkills([]);
                  setSkillSearch('');
                }}
                className="text-sm font-bold text-primary hover:underline"
              >
                Filtreleri Kaldır
              </button>
            </div>

            <div className="space-y-6">
              
              {/* SKILLS */}
              <div>
                <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-3 block">Yetenekler</label>
                
                {/* Selected Skills */}
                {selectedSkills.length > 0 && (
                  <div className="flex flex-wrap gap-2 mb-3">
                    {selectedSkills.map(skill => (
                      <button
                        key={skill}
                        onClick={() => setSelectedSkills(selectedSkills.filter(s => s !== skill))}
                        className="bg-primary/20 text-primary px-3 py-1.5 rounded-full text-xs font-bold flex items-center gap-1.5 hover:bg-destructive hover:text-destructive-foreground transition-colors group"
                      >
                        {skill}
                        <X className="w-3 h-3 group-hover:text-destructive-foreground" />
                      </button>
                    ))}
                  </div>
                )}

                {/* Skill Search Input */}
                <div className="relative">
                  <input
                    type="text"
                    value={skillSearch}
                    onChange={e => setSkillSearch(e.target.value)}
                    placeholder="Yetenek ara ve seç..."
                    className="w-full bg-secondary border-none rounded-xl px-4 py-3 focus:ring-2 focus:ring-primary text-sm font-medium"
                  />
                  {/* Dropdown for skill suggestions */}
                  {skillSearch && filteredSkills && filteredSkills.length > 0 && (
                    <div className="absolute z-10 w-full mt-2 bg-card border border-border rounded-xl shadow-xl max-h-48 overflow-y-auto">
                      {filteredSkills.map(skill => (
                        <button
                          key={skill.skillId}
                          onClick={() => {
                            setSelectedSkills([...selectedSkills, skill.skillName]);
                            setSkillSearch('');
                          }}
                          className="w-full text-left px-4 py-3 hover:bg-secondary transition-colors text-sm font-medium border-b border-border last:border-0"
                        >
                          {skill.skillName}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {activeTab === 'JOBS' && (
                <>
                  {/* LOCATION */}
                  <div>
                    <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-3 block">Çalışma Şekli / Konum</label>
                    
                    <div className="flex bg-secondary p-1 rounded-xl mb-4">
                      <button
                        onClick={() => setLocationType('any')}
                        className={`flex-1 py-2 rounded-lg text-sm font-bold transition-all ${locationType === 'any' ? 'bg-background shadow text-foreground' : 'text-muted-foreground hover:text-foreground'}`}
                      >
                        Farketmez
                      </button>
                      <button
                        onClick={() => setLocationType('remote')}
                        className={`flex-1 py-2 rounded-lg text-sm font-bold transition-all ${locationType === 'remote' ? 'bg-background shadow text-foreground' : 'text-muted-foreground hover:text-foreground'}`}
                      >
                        Uzaktan
                      </button>
                      <button
                        onClick={() => setLocationType('in-person')}
                        className={`flex-1 py-2 rounded-lg text-sm font-bold transition-all ${locationType === 'in-person' ? 'bg-background shadow text-foreground' : 'text-muted-foreground hover:text-foreground'}`}
                      >
                        Yüzyüze
                      </button>
                    </div>

                    {/* Both 'any' and 'in-person' show the location selects */}
                    {(locationType === 'in-person' || locationType === 'any') && (
                      <div className="space-y-3 animate-in fade-in slide-in-from-top-2">
                        <select
                          value={selectedCountry}
                          onChange={e => {
                            setSelectedCountry(e.target.value);
                            setSelectedCity(''); // Reset city when country changes
                          }}
                          className="w-full bg-secondary border-none rounded-xl px-4 py-3 focus:ring-2 focus:ring-primary text-sm font-medium appearance-none"
                        >
                          <option value="">Ülke Seçiniz...</option>
                          {Country.getAllCountries().map(country => (
                            <option key={country.isoCode} value={country.isoCode}>{country.name}</option>
                          ))}
                        </select>

                        {selectedCountry && (
                          <select
                            value={selectedCity}
                            onChange={e => setSelectedCity(e.target.value)}
                            className="w-full bg-secondary border-none rounded-xl px-4 py-3 focus:ring-2 focus:ring-primary text-sm font-medium appearance-none"
                          >
                            <option value="">Şehir Seçiniz (Tümü)</option>
                            {State.getStatesOfCountry(selectedCountry)?.map(state => (
                              <option key={state.isoCode} value={state.name}>{state.name}</option>
                            ))}
                          </select>
                        )}
                      </div>
                    )}
                  </div>
                </>
              )}
            </div>

            <button
              onClick={() => setShowFilters(false)}
              className="w-full mt-8 bg-primary text-primary-foreground font-bold py-4 rounded-xl hover:opacity-90 transition-opacity"
            >
              Uygula
            </button>
          </div>
        </div>
      )}

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
        <div className="flex flex-col items-center w-full">
          <div className="w-full h-[72vh] min-h-[450px] md:h-[600px] md:max-h-[65vh] md:max-w-[380px] relative flex flex-col justify-center md:mt-2 mx-auto">

            {/* Stacked Cards */}
            {itemsToRender.map((item, index) => {
            const currentItem = item as any;
            const isTop = index === itemsToRender.length - 1;
            const stackIndex = itemsToRender.length - 1 - index;

            return (
              <div
                key={currentItem.id}
                style={isTop ? {
                  transform: `translate3d(${dragOffset.x}px, ${dragOffset.y}px, 0) rotate(${dragOffset.x * 0.04}deg)`,
                  transition: isDragging ? 'none' : 'transform 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.255)',
                  zIndex: 20
                } : {
                  transform: `translate3d(0, ${stackIndex * 16}px, 0) scale(${1 - stackIndex * 0.05})`,
                  opacity: 1,
                  transition: 'all 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.255)',
                  zIndex: 20 - stackIndex
                }}
                className={`bg-card w-full h-full rounded-[2.5rem] shadow-2xl overflow-hidden absolute top-0 left-0 flex flex-col`}
              >
                <ScrollContainer className={`flex-1 overflow-y-auto relative no-scrollbar ${isTop ? 'pointer-events-auto' : 'pointer-events-none'}`}>
                  {/* Image/Header Area (Swipeable) */}
                  <div
                    className={`relative w-full h-[85%] flex-shrink-0 ${isTop ? 'cursor-grab active:cursor-grabbing' : ''}`}
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
                  >
                    <div className={`absolute inset-0 z-0 ${isProfiles ? 'bg-zinc-900' : 'bg-blue-950'}`}>
                      <img
                        src={(() => {
                          let url = isProfiles
                            ? (currentItem?.image || ((currentItem as any)?.role === 'company' ? `https://ui-avatars.com/api/?name=%F0%9F%92%BC&background=e2e8f0&color=94a3b8&size=1024` : 'https://www.gravatar.com/avatar/00000000000000000000000000000000?d=mp&f=y&s=1024'))
                            : (currentItem.publisher?.image || `https://ui-avatars.com/api/?name=%F0%9F%92%BC&background=e2e8f0&color=94a3b8&size=1024`);
                          return url;
                        })()}
                        alt="Banner"
                        className="w-full h-full object-cover"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/95 via-black/40 to-transparent z-10" />
                    </div>

                    {/* Like/Nope Overlays */}
                    {isTop && swipeDirection === 'right' && (
                      <div className="absolute top-12 left-8 z-30 border-4 border-green-500 text-green-500 font-black text-3xl px-6 py-2 rounded-xl uppercase tracking-widest transform -rotate-12 select-none">
                        {isProfiles ? 'BEĞEN' : 'BAŞVUR'}
                      </div>
                    )}
                    {isTop && swipeDirection === 'left' && (
                      <div className="absolute top-12 right-8 z-30 border-4 border-red-500 text-red-500 font-black text-3xl px-6 py-2 rounded-xl uppercase tracking-widest transform rotate-12 select-none">
                        GEÇ
                      </div>
                    )}
                    
                    {/* Basic Info at bottom of image */}
                    <div className="absolute bottom-10 left-6 right-6 z-20 pointer-events-none text-white">
                      <h2 className="text-3xl font-black mb-1 drop-shadow-md">
                        {isProfiles
                          ? `${currentItem.name} ${currentItem.surname}`
                          : currentItem.title}
                      </h2>
                      {!isProfiles && (
                        <h3 className="text-white/90 font-bold text-base drop-shadow-md mb-1">
                          {`${currentItem.publisher?.name || 'Şirket'} ${currentItem.publisher?.surname || ''}`}
                        </h3>
                      )}
                      
                      <div className="flex items-center gap-1.5 text-sm font-bold text-white drop-shadow-md mt-1 mb-3">
                        {isProfiles ? (
                          <>
                            <MapPin className="w-4 h-4 text-white drop-shadow-md" /> {currentItem.profile?.location || 'Türkiye'}
                          </>
                        ) : (
                          <>
                            <MapPin className="w-4 h-4 text-white drop-shadow-md" /> {currentItem.locationType}
                            <span className="text-white/80 mx-1">•</span>
                            <Briefcase className="w-4 h-4 text-white drop-shadow-md" /> {currentItem.type}
                          </>
                        )}
                      </div>

                      <div className="flex flex-wrap gap-2 mt-2">
                        {(isProfiles ? (currentItem.profile?.skills?.map((s:any) => s.skill.skillName) || []) : (currentItem.requirements?.map((r:any) => r.skillName) || [])).slice(0, 3).map((s: string) => (
                          <span key={s} className="bg-white/20 text-white border border-white/10 px-3 py-1 rounded-xl text-xs font-bold shadow-sm backdrop-blur-sm">
                            {s}
                          </span>
                        ))}
                      </div>

                    </div>
                  </div>

                  {/* Scrollable Details */}
                  <div className="relative bg-white min-h-[60%] rounded-t-[32px] -mt-5 p-6 pt-7 z-20 pb-8">
                    <ScrollableCardDetails currentItem={currentItem} isProfiles={isProfiles} />
                  </div>
                </ScrollContainer>
              </div>
            );
          })}
          </div>

          {/* Action Buttons (Below Card) */}
          <div className="flex justify-center gap-8 mt-8 z-40">
            <button
              onClick={() => handleButtonReject(itemsToRender[itemsToRender.length - 1].id)}
              disabled={isBusy}
              className="w-16 h-16 rounded-full bg-card border border-border shadow-xl flex items-center justify-center text-muted-foreground hover:bg-destructive hover:text-destructive-foreground hover:border-destructive transition-all duration-300 hover:scale-110 disabled:opacity-50"
            >
              <X className="w-8 h-8" />
            </button>
            <button
              onClick={() => handleButtonAccept(itemsToRender[itemsToRender.length - 1].id)}
              disabled={isBusy}
              className="w-16 h-16 rounded-full bg-card border border-border shadow-xl flex items-center justify-center text-green-500 hover:bg-green-500 hover:text-white hover:border-green-500 transition-all duration-300 hover:scale-110 disabled:opacity-50"
            >
              <Heart className="w-8 h-8 fill-current" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

function ScrollableCardDetails({ currentItem, isProfiles }: { currentItem: any, isProfiles: boolean }) {
  const [bioExpanded, setBioExpanded] = useState(false);
  
  const bio = isProfiles 
    ? (currentItem.profile?.bio || 'Bu kullanıcı henüz bir biyografi eklememiş.')
    : (currentItem.description || 'Detaylı bir açıklama girilmemiş.');
  
  const isBioLong = bio.length > 150;
  
  const skills = isProfiles ? (currentItem.profile?.skills?.map((s:any) => s.skill.skillName) || []) : (currentItem.requirements?.map((r:any) => r.skillName) || []);

  return (
    <div className="flex flex-col gap-6">
      {/* Bio */}
      <div>
        <h3 className="font-bold text-lg text-black mb-2">Hakkında</h3>
        <p className={`text-[#444] text-[14px] leading-relaxed ${!bioExpanded && isBioLong ? 'line-clamp-4' : ''}`}>
          {bio}
        </p>
        {isBioLong && !bioExpanded && (
          <button onClick={() => setBioExpanded(true)} className="text-[#666] text-[14px] font-bold mt-1">
            ...devam et
          </button>
        )}
      </div>

      {/* All Skills */}
      {skills.length > 3 && (
        <div>
           <h3 className="font-bold text-lg text-black mb-2">Tüm Yetenekler</h3>
           <div className="flex flex-wrap gap-2">
             {(!isProfiles && (currentItem as any).matchScore > 0) && (
                <span className="bg-yellow-500/10 text-yellow-600 border border-yellow-400/50 px-3 py-1.5 rounded-[20px] text-[13px] font-semibold flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5" /> Önerilen
                </span>
             )}
             {skills.map((s: string) => (
               <span key={s} className="bg-black/5 border border-black/5 text-[#333] px-3 py-1.5 rounded-[20px] text-[13px] font-semibold">
                 {s}
               </span>
             ))}
           </div>
        </div>
      )}

      {/* Experiences */}
      {isProfiles && currentItem.profile?.experiences?.length > 0 && (
        <div>
           <h3 className="font-bold text-lg text-black mb-2">Deneyimler</h3>
           <div className="flex flex-col">
             {currentItem.profile.experiences.map((exp: any) => (
               <div key={exp.expId} className="flex flex-col mb-4 pb-4 border-b border-black/5">
                 <span className="font-bold text-[16px] text-black mb-1">{exp.title}</span>
                 <span className="text-[15px] text-[#666] mb-1">{exp.corp}</span>
                 <span className="text-[13px] text-[#999] mb-1.5">
                   {new Date(exp.startDate).getFullYear()} - {exp.endDate ? new Date(exp.endDate).getFullYear() : 'Devam Ediyor'}
                 </span>
                 {exp.desc && <span className="text-[14px] text-[#444] leading-[20px]">{exp.desc}</span>}
               </div>
             ))}
           </div>
        </div>
      )}

      {/* Educations */}
      {isProfiles && currentItem.profile?.educations?.length > 0 && (
        <div>
           <h3 className="font-bold text-lg text-black mb-2">Eğitim</h3>
           <div className="flex flex-col">
             {currentItem.profile.educations.map((edu: any) => (
               <div key={edu.eduId} className="flex flex-col mb-4 pb-4 border-b border-black/5">
                 <span className="font-bold text-[16px] text-black mb-1">{edu.instName}</span>
                 <span className="text-[15px] text-[#666] mb-1">{edu.instProgram} • {edu.instDegree}</span>
                 <span className="text-[13px] text-[#999] mb-1.5">
                   {new Date(edu.startDate).getFullYear()} - {edu.endDate ? new Date(edu.endDate).getFullYear() : 'Devam Ediyor'}
                 </span>
               </div>
             ))}
           </div>
        </div>
      )}

      {/* Certificates */}
      {isProfiles && currentItem.profile?.certificates?.length > 0 && (
        <div>
           <h3 className="font-bold text-lg text-black mb-2">Sertifikalar</h3>
           <div className="flex flex-col">
             {currentItem.profile.certificates.map((cert: any) => (
               <div key={cert.cerId} className="flex flex-col mb-4 pb-4 border-b border-black/5">
                 <span className="font-bold text-[16px] text-black mb-1">{cert.title}</span>
                 <span className="text-[15px] text-[#666] mb-1">{cert.org}</span>
                 <span className="text-[13px] text-[#999] mb-1.5">
                   {new Date(cert.startDate).getFullYear()}
                 </span>
               </div>
             ))}
           </div>
        </div>
      )}
    </div>
  )
}

function ScrollContainer({ children, className, onScroll, ...props }: any) {
  const [isScrolling, setIsScrolling] = useState(false);
  const scrollTimeout = useRef<any>(null);

  const handleScroll = (e: any) => {
    setIsScrolling(true);
    if (scrollTimeout.current) clearTimeout(scrollTimeout.current);
    scrollTimeout.current = setTimeout(() => {
      setIsScrolling(false);
    }, 800);
    if (onScroll) onScroll(e);
  };

  return (
    <div 
      onScroll={handleScroll}
      className={`${className || ''} ${isScrolling ? 'is-scrolling' : ''}`}
      {...props}
    >
      {children}
    </div>
  );
}
