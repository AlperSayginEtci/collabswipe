import { useState } from 'react';
import { createFileRoute } from '@tanstack/react-router';
import { X, Heart, Code, MapPin, Sparkles, Briefcase, User, Filter } from 'lucide-react';
import { trpc } from '@/lib/trpc';
import { useSession } from '@collabswipe/auth/client';
import toast from 'react-hot-toast';

const COUNTRIES: Record<string, string[]> = {
  'Türkiye': ['İstanbul', 'Ankara', 'İzmir', 'Bursa', 'Antalya', 'Eskişehir', 'Adana', 'Konya', 'Kocaeli', 'Gaziantep'],
  'ABD': ['New York', 'San Francisco', 'Los Angeles', 'Chicago', 'Boston', 'Seattle'],
  'Almanya': ['Berlin', 'Münih', 'Hamburg', 'Frankfurt', 'Köln'],
  'İngiltere': ['Londra', 'Manchester', 'Birmingham', 'Liverpool'],
  'Hollanda': ['Amsterdam', 'Rotterdam', 'Lahey'],
  'Kanada': ['Toronto', 'Vancouver', 'Montreal']
};

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
  const utils = trpc.useUtils();

  // Tabs from search params
  const { tab } = Route.useSearch();
  const activeTab = tab || 'PROFILES';
  const navigate = Route.useNavigate();

  const setActiveTab = (newTab: 'PROFILES' | 'JOBS') => {
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
  const [filterAgeMin, setFilterAgeMin] = useState<number>(18);
  const [filterAgeMax, setFilterAgeMax] = useState<number>(65);

  const { data: allSkills } = trpc.profile.getAllSkills.useQuery();
  const filteredSkills = allSkills?.filter(s => 
    s.skillName.toLowerCase().includes(skillSearch.toLowerCase()) && 
    !selectedSkills.includes(s.skillName)
  ) || [];

  let finalLocation = '';
  let includeRemote: boolean | undefined = undefined;

  if (locationType === 'remote') {
    includeRemote = true;
  } else if (locationType === 'in-person') {
    if (selectedCity && selectedCountry) finalLocation = `${selectedCity}, ${selectedCountry}`;
    else if (selectedCountry) finalLocation = selectedCountry;
    includeRemote = false;
  } else if (locationType === 'any') {
    if (selectedCountry) {
      if (selectedCity && selectedCountry) finalLocation = `${selectedCity}, ${selectedCountry}`;
      else finalLocation = selectedCountry;
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
      ageMin: filterAgeMin !== 18 ? filterAgeMin : undefined,
      ageMax: filterAgeMax < 65 ? filterAgeMax : undefined,
    },
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
    {
      userId: userId || '',
      skills: selectedSkills.length > 0 ? selectedSkills : undefined,
    },
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
    <div className="flex flex-col items-center justify-start flex-1 h-full select-none overflow-hidden pt-4 pb-4 md:pb-8 w-full max-w-6xl mx-auto px-4 md:px-8">

      {/* Top Controls: Tabs & Filter */}
      <div className="w-full max-w-md flex items-center bg-secondary/50 p-1 rounded-2xl mb-6 md:mb-12 border border-border shrink-0 z-50 relative">
        <div className="flex-1 flex">
          <button
            onClick={() => setActiveTab('PROFILES')}
            className={`flex-1 py-2.5 rounded-xl font-bold text-sm transition-all duration-300 flex items-center justify-center gap-2 ${activeTab === 'PROFILES' ? 'bg-background text-foreground shadow-md scale-[1.02]' : 'text-muted-foreground hover:text-foreground hover:bg-background/50'}`}
          >
            <User className="w-4 h-4" /> <span className="hidden sm:inline">İş Arkadaşları</span>
          </button>
          <button
            onClick={() => setActiveTab('JOBS')}
            className={`flex-1 py-2.5 rounded-xl font-bold text-sm transition-all duration-300 flex items-center justify-center gap-2 ${activeTab === 'JOBS' ? 'bg-background text-foreground shadow-md scale-[1.02]' : 'text-muted-foreground hover:text-foreground hover:bg-background/50'}`}
          >
            <Briefcase className="w-4 h-4" /> <span className="hidden sm:inline">İlanlar</span>
          </button>
        </div>
        <div className="w-px h-6 bg-border mx-1"></div>
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
            <h3 className="text-2xl font-black mb-6">Filtreler</h3>

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
                          key={skill.id}
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

              {activeTab === 'PROFILES' && (
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
                          {Object.keys(COUNTRIES).map(country => (
                            <option key={country} value={country}>{country}</option>
                          ))}
                        </select>

                        {selectedCountry && (
                          <select
                            value={selectedCity}
                            onChange={e => setSelectedCity(e.target.value)}
                            className="w-full bg-secondary border-none rounded-xl px-4 py-3 focus:ring-2 focus:ring-primary text-sm font-medium appearance-none"
                          >
                            <option value="">Şehir Seçiniz (Tümü)</option>
                            {COUNTRIES[selectedCountry].map(city => (
                              <option key={city} value={city}>{city}</option>
                            ))}
                          </select>
                        )}
                      </div>
                    )}
                  </div>

                  {/* AGE */}
                  <div>
                    <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-4 flex justify-between">
                      <span>Yaş Aralığı</span>
                      <span className="text-primary font-black">{filterAgeMin} - {filterAgeMax >= 65 ? '65+' : filterAgeMax}</span>
                    </label>
                    
                    <div className="relative w-full h-8 flex items-center mb-4">
                      {/* Track background */}
                      <div className="absolute left-0 right-0 h-2 bg-secondary rounded-full z-0"></div>
                      
                      {/* Track highlight */}
                      <div 
                        className="absolute h-2 bg-primary rounded-full z-10"
                        style={{ 
                          left: `calc(${((filterAgeMin - 18) / (65 - 18)) * 100}%)`, 
                          right: `calc(${100 - ((filterAgeMax - 18) / (65 - 18)) * 100}%)` 
                        }}
                      ></div>

                      {/* Min Slider */}
                      <input
                        type="range"
                        min="18"
                        max="65"
                        value={filterAgeMin}
                        onChange={(e) => {
                          const val = Math.min(Number(e.target.value), filterAgeMax);
                          setFilterAgeMin(val);
                        }}
                        className="absolute w-full left-0 appearance-none bg-transparent pointer-events-none z-20 [&::-webkit-slider-thumb]:pointer-events-auto [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-6 [&::-webkit-slider-thumb]:h-6 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-background [&::-webkit-slider-thumb]:border-4 [&::-webkit-slider-thumb]:border-primary [&::-webkit-slider-thumb]:cursor-grab active:[&::-webkit-slider-thumb]:cursor-grabbing [&::-webkit-slider-thumb]:shadow-md [&::-moz-range-thumb]:pointer-events-auto [&::-moz-range-thumb]:w-6 [&::-moz-range-thumb]:h-6 [&::-moz-range-thumb]:rounded-full [&::-moz-range-thumb]:bg-background [&::-moz-range-thumb]:border-4 [&::-moz-range-thumb]:border-primary [&::-moz-range-thumb]:cursor-grab active:[&::-moz-range-thumb]:cursor-grabbing [&::-moz-range-thumb]:shadow-md"
                      />

                      {/* Max Slider */}
                      <input
                        type="range"
                        min="18"
                        max="65"
                        value={filterAgeMax}
                        onChange={(e) => {
                          const val = Math.max(Number(e.target.value), filterAgeMin);
                          setFilterAgeMax(val);
                        }}
                        className="absolute w-full left-0 appearance-none bg-transparent pointer-events-none z-30 [&::-webkit-slider-thumb]:pointer-events-auto [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-6 [&::-webkit-slider-thumb]:h-6 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-background [&::-webkit-slider-thumb]:border-4 [&::-webkit-slider-thumb]:border-primary [&::-webkit-slider-thumb]:cursor-grab active:[&::-webkit-slider-thumb]:cursor-grabbing [&::-webkit-slider-thumb]:shadow-md [&::-moz-range-thumb]:pointer-events-auto [&::-moz-range-thumb]:w-6 [&::-moz-range-thumb]:h-6 [&::-moz-range-thumb]:rounded-full [&::-moz-range-thumb]:bg-background [&::-moz-range-thumb]:border-4 [&::-moz-range-thumb]:border-primary [&::-moz-range-thumb]:cursor-grab active:[&::-moz-range-thumb]:cursor-grabbing [&::-moz-range-thumb]:shadow-md"
                      />
                    </div>
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
        <div className="w-full max-w-[380px] h-[650px] max-h-[80vh] relative flex flex-col justify-center md:my-4 mx-auto">

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
                  opacity: 1,
                  transition: 'all 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.255)',
                  zIndex: 20 - stackIndex
                }}
                className={`bg-card w-full h-full rounded-[2.5rem] shadow-2xl overflow-hidden absolute top-0 left-0 flex flex-col ${isTop ? 'cursor-grab active:cursor-grabbing' : 'pointer-events-none'}`}
              >
                {/* Full-bleed Image Background */}
                <div className={`absolute inset-0 z-0 ${isProfiles ? 'bg-zinc-900' : 'bg-blue-950'}`}>
                  <img
                    src={
                      isProfiles
                        ? (currentItem.image || `https://api.dicebear.com/7.x/notionists/svg?seed=${currentItem.name}`)
                        : (currentItem.publisher?.image || `https://api.dicebear.com/7.x/shapes/svg?seed=${currentItem.id}`)
                    }
                    alt="Banner"
                    className="w-full h-full object-cover"
                  />
                  {/* Gradient Overlay */}
                  <div className="absolute inset-0 bg-gradient-to-b from-black/20 via-black/10 to-black/90 z-10" />
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

                {/* Location or Type Badge */}
                <div className="absolute top-6 right-6 z-20 bg-black/40 backdrop-blur-md px-4 py-1.5 rounded-full text-xs font-bold text-white flex items-center gap-1.5 border border-white/20">
                  {isProfiles ? (
                    <>
                      <MapPin className="w-4 h-4 text-primary" /> {currentItem.profile?.location || 'Türkiye'}
                    </>
                  ) : (
                    <>
                      <Briefcase className="w-4 h-4 text-primary" /> {currentItem.type}
                    </>
                  )}
                </div>

                {/* Content Area at Bottom */}
                <div className="relative z-20 flex-1 p-6 flex flex-col justify-end pointer-events-none pb-28">
                  <div className="text-white">
                    <h2 className="text-4xl font-black mb-1 drop-shadow-md">
                      {isProfiles
                        ? `${currentItem.name} ${currentItem.surname}`
                        : currentItem.title}
                    </h2>

                    <h3 className="text-primary font-bold text-base mb-3 drop-shadow-sm">
                      {isProfiles
                        ? currentItem.email
                        : `${currentItem.publisher?.name || 'Şirket'} ${currentItem.publisher?.surname || ''}`}
                    </h3>

                    <p className="text-white/90 leading-relaxed text-sm drop-shadow-sm line-clamp-3">
                      {isProfiles
                        ? (currentItem.profile?.bio || 'Bu kullanıcı henüz bir biyografi eklememiş.')
                        : (currentItem.description)}
                    </p>
                  </div>

                  {/* Skills / Tags */}
                  <div className="flex flex-wrap gap-2 mt-4">
                    {isProfiles ? (
                      currentItem.profile?.skills?.map((s: any) => (
                        <span key={s.skill.skillName} className="bg-white/20 backdrop-blur-md text-white border border-white/30 px-3 py-1 rounded-full text-[11px] font-bold uppercase tracking-wider flex items-center gap-1">
                          <Code className="w-3.5 h-3.5" /> {s.skill.skillName}
                        </span>
                      ))
                    ) : (
                      <>
                        {(currentItem as any).matchScore > 0 && (
                          <span className="bg-yellow-500/80 backdrop-blur-md text-white border border-yellow-400 px-3 py-1 rounded-full text-[11px] font-bold uppercase tracking-wider flex items-center gap-1 shadow-lg">
                            <Sparkles className="w-3.5 h-3.5" /> Önerilen
                          </span>
                        )}
                        {currentItem.requirements?.map((req: any, index: number) => (
                          <span key={index} className="bg-white/20 backdrop-blur-md text-white border border-white/30 px-3 py-1 rounded-full text-[11px] font-bold uppercase tracking-wider flex items-center gap-1">
                            <Code className="w-3.5 h-3.5" /> {req.skillName}
                          </span>
                        ))}
                      </>
                    )}
                  </div>
                </div>

                {/* Action Buttons */}
                <div className={`absolute bottom-6 left-0 w-full flex justify-center gap-6 px-8 z-40 transition-opacity duration-300 ${isTop ? 'opacity-100' : 'opacity-0'}`}>
                  <button
                    onMouseDown={(e) => e.stopPropagation()}
                    onTouchStart={(e) => e.stopPropagation()}
                    onClick={() => handleButtonReject(currentItem.id)}
                    disabled={isBusy}
                    className="w-16 h-16 rounded-full bg-white/10 backdrop-blur-xl border border-white/20 shadow-xl flex items-center justify-center text-white hover:bg-destructive hover:text-destructive-foreground hover:border-destructive transition-all duration-300 hover:scale-110 disabled:opacity-50 pointer-events-auto"
                  >
                    <X className="w-8 h-8" />
                  </button>
                  <button
                    onMouseDown={(e) => e.stopPropagation()}
                    onTouchStart={(e) => e.stopPropagation()}
                    onClick={() => handleButtonAccept(currentItem.id)}
                    disabled={isBusy}
                    className="w-16 h-16 rounded-full bg-white/10 backdrop-blur-xl border border-white/20 shadow-xl flex items-center justify-center text-green-400 hover:bg-green-500 hover:text-white hover:border-green-500 transition-all duration-300 hover:scale-110 disabled:opacity-50 pointer-events-auto"
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
