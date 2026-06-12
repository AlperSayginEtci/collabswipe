import { createRootRoute, Link, Outlet, useLocation, useNavigate } from '@tanstack/react-router';
import { Home, Compass, Briefcase, MessageSquare, User as UserIcon, Bell, LogOut, ChevronDown, PlusCircle, Heart, Inbox, ArrowUp } from 'lucide-react';
import { useSession, signOut } from '@collabswipe/auth/client';
import React, { useEffect, useState, useRef } from 'react';
import { Toaster } from 'react-hot-toast';

export const Route = createRootRoute({
  component: RootLayout,
});

function RootLayout() {
  const { data: session, isPending } = useSession();
  const location = useLocation();
  const navigate = useNavigate();
  const [isDiscoverOpen, setIsDiscoverOpen] = useState(location.pathname === '/discover');
  
  const scrollRef = useRef<HTMLDivElement>(null);
  const [showScrollTop, setShowScrollTop] = useState(false);

  const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
    if (location.pathname === '/') {
      setShowScrollTop(e.currentTarget.scrollTop > 300);
    } else {
      setShowScrollTop(false);
    }
  };

  const scrollToTop = () => {
    scrollRef.current?.scrollTo({ top: 0, behavior: 'smooth' });
  };

  useEffect(() => {
    if (!isPending && !session && location.pathname !== '/login') {
      navigate({ to: '/login' });
    }
  }, [session, isPending, location.pathname, navigate]);

  useEffect(() => {
    if (location.pathname.startsWith('/discover')) {
      setIsDiscoverOpen(true);
    }
  }, [location.pathname]);

  if (isPending) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background text-foreground font-sans">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin" />
          <p className="text-muted-foreground font-bold animate-pulse">CollabSwipe Yükleniyor...</p>
        </div>
      </div>
    );
  }

  const isLoginPage = location.pathname === '/login';

  // If not logged in and not on login page, show nothing while redirecting
  if (!session && !isLoginPage) {
    return null;
  }

  // If it's the login page, render it cleanly without sidebars/headers
  if (isLoginPage) {
    return (
      <div className="min-h-screen bg-background text-foreground font-sans flex items-center justify-center">
        <Outlet />
      </div>
    );
  }

  // Calculate user initials
  const name = session?.user?.name || 'User';
  const surname = (session?.user as any)?.surname || '';
  const initials = (name[0] + (surname[0] || '')).toUpperCase();
  const fullName = `${name} ${surname}`.trim();

  return (
    <div className="flex h-screen bg-background text-foreground font-sans">
      {/* Sidebar — fixed height, does not scroll with content */}
      <aside className="w-64 border-r border-border bg-card hidden md:flex flex-col h-full flex-shrink-0">
        <div className="p-6">
          <h1 className="text-2xl font-black text-primary tracking-tighter">CollabSwipe</h1>
        </div>
        
        <nav className="flex-1 px-4 space-y-2">
          <Link to="/" className="[&.active]:bg-secondary [&.active]:text-foreground flex items-center gap-3 px-4 py-3 rounded-lg text-muted-foreground hover:bg-secondary/50 hover:text-foreground font-medium transition-colors">
            <Home className="w-5 h-5" />
            Ana Sayfa
          </Link>
          
          <div className="flex flex-col">
            <div 
              onClick={() => {
                setIsDiscoverOpen(!isDiscoverOpen);
                if (!isDiscoverOpen && location.pathname !== '/discover') {
                  navigate({ to: '/discover', search: { tab: 'PROFILES' } });
                }
              }}
              className={`flex items-center justify-between px-4 py-3 rounded-lg text-muted-foreground hover:bg-secondary/50 hover:text-foreground font-medium transition-colors cursor-pointer ${location.pathname.startsWith('/discover') ? 'bg-secondary text-foreground' : ''}`}
            >
              <div className="flex items-center gap-3">
                <Compass className="w-5 h-5" />
                Keşfet
              </div>
              <ChevronDown className={`w-4 h-4 transition-transform ${isDiscoverOpen ? 'rotate-180' : ''}`} />
            </div>
            
            {isDiscoverOpen && (
              <div className="ml-8 mt-1 space-y-1 flex flex-col">
                <Link 
                  to="/discover" 
                  search={{ tab: 'PROFILES' }} 
                  activeOptions={{ exact: true, includeSearch: true }}
                  className="[&.active]:text-foreground [&.active]:font-bold text-sm text-muted-foreground hover:text-foreground py-2 flex items-center gap-2 transition-colors"
                >
                  <UserIcon className="w-4 h-4" /> İş Arkadaşları
                </Link>
                <Link 
                  to="/discover" 
                  search={{ tab: 'JOBS' }} 
                  activeOptions={{ exact: true, includeSearch: true }}
                  className="[&.active]:text-foreground [&.active]:font-bold text-sm text-muted-foreground hover:text-foreground py-2 flex items-center gap-2 transition-colors"
                >
                  <Briefcase className="w-4 h-4" /> İş İlanları
                </Link>
              </div>
            )}
          </div>
          <Link to="/likes" className="[&.active]:bg-secondary [&.active]:text-foreground flex items-center gap-3 px-4 py-3 rounded-lg text-muted-foreground hover:bg-secondary/50 hover:text-foreground font-medium transition-colors">
            {((session?.user as any)?.role === 'company') ? <Inbox className="w-5 h-5" /> : <Heart className="w-5 h-5" />}
            {((session?.user as any)?.role === 'company') ? 'Başvuranlar' : 'Beğeniler'}
          </Link>
          <Link to="/matches" className="[&.active]:bg-secondary [&.active]:text-foreground flex items-center gap-3 px-4 py-3 rounded-lg text-muted-foreground hover:bg-secondary/50 hover:text-foreground font-medium transition-colors">
            <MessageSquare className="w-5 h-5" />
            Eşleşmeler
          </Link>
          <Link to="/profile" className="[&.active]:bg-secondary [&.active]:text-foreground flex items-center gap-3 px-4 py-3 rounded-lg text-muted-foreground hover:bg-secondary/50 hover:text-foreground font-medium transition-colors">
            <UserIcon className="w-5 h-5" />
            Profil
          </Link>
          {(session?.user as any)?.role === 'company' && (
            <Link to="/post-job" className="[&.active]:bg-primary/20 [&.active]:text-primary flex items-center gap-3 px-4 py-3 mt-4 rounded-lg bg-primary/10 text-primary hover:bg-primary/20 font-bold transition-colors border border-primary/20">
              <PlusCircle className="w-5 h-5" />
              İlan Ver
            </Link>
          )}
        </nav>
        
        <div className="p-4 border-t border-border space-y-3">
          <Link to="/profile" className="flex items-center gap-3 p-2 rounded-lg cursor-pointer hover:bg-secondary/50 transition-colors">
            {session?.user?.image ? (
              <img src={session.user.image} alt={name} className="w-10 h-10 rounded-full object-cover shrink-0 border border-border" />
            ) : (
              <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center text-primary font-bold shrink-0">
                {initials}
              </div>
            )}
            <div className="flex-1 overflow-hidden">
              <p className="text-sm font-bold text-foreground truncate">{fullName}</p>
            </div>
          </Link>
          <button 
            onClick={() => signOut({ fetchOptions: { onSuccess: () => navigate({ to: '/login' }) } })}
            className="flex items-center justify-center gap-2 w-full bg-destructive/10 hover:bg-destructive/20 text-destructive text-sm font-bold py-2.5 rounded-xl transition-colors"
          >
            <LogOut className="w-4 h-4" />
            Çıkış Yap
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col min-h-0 overflow-hidden">
        {/* Mobile Header */}
        <header className="md:hidden flex items-center justify-between p-4 border-b border-border bg-card flex-shrink-0">
          <h1 className="text-xl font-black text-primary">CollabSwipe</h1>
          <button className="text-muted-foreground" onClick={() => signOut({ fetchOptions: { onSuccess: () => navigate({ to: '/login' }) } })}>
            <LogOut className="w-6 h-6 text-destructive" />
          </button>
        </header>

        {/* Desktop Topbar */}
        <div className="hidden md:flex items-center justify-end p-4 border-b border-border bg-background/95 backdrop-blur z-10 flex-shrink-0">
          <button className="p-2 text-muted-foreground hover:text-foreground hover:bg-secondary rounded-full transition-colors">
            <Bell className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Content — this is the ONLY scroll container */}
        <div ref={scrollRef} onScroll={handleScroll} className="flex-1 overflow-y-auto p-4 md:p-8">
          <div className="max-w-6xl mx-auto w-full">
            <Outlet />
          </div>
        </div>

        {/* Scroll to Top Button */}
        {showScrollTop && location.pathname === '/' && (
          <button 
            onClick={scrollToTop}
            className="fixed bottom-20 md:bottom-8 right-4 md:right-8 p-3 rounded-full bg-primary text-primary-foreground shadow-lg hover:opacity-90 transition-opacity z-50 flex items-center justify-center"
            aria-label="En üste dön"
          >
            <ArrowUp className="w-6 h-6" />
          </button>
        )}
      </main>

      {/* Mobile Bottom Tab Navigation */}
      <nav className="md:hidden fixed bottom-0 w-full bg-card border-t border-border flex justify-around p-3 pb-safe z-40">
        <Link to="/" className="[&.active]:text-primary flex flex-col items-center gap-1 text-muted-foreground">
          <Home className="w-6 h-6" />
          <span className="text-[10px] font-medium">Ana Sayfa</span>
        </Link>
        <Link to="/discover" className="[&.active]:text-primary flex flex-col items-center gap-1 text-muted-foreground">
          <Compass className="w-6 h-6" />
          <span className="text-[10px] font-medium">Keşfet</span>
        </Link>
        <Link to="/likes" className="[&.active]:text-primary flex flex-col items-center gap-1 text-muted-foreground">
          {((session?.user as any)?.role === 'company') ? <Inbox className="w-6 h-6" /> : <Heart className="w-6 h-6" />}
          <span className="text-[10px] font-medium">{((session?.user as any)?.role === 'company') ? 'Başvuranlar' : 'Beğeniler'}</span>
        </Link>
        <Link to="/matches" className="[&.active]:text-primary flex flex-col items-center gap-1 text-muted-foreground">
          <MessageSquare className="w-6 h-6" />
          <span className="text-[10px] font-medium">Eşleşmeler</span>
        </Link>
        <Link to="/profile" className="[&.active]:text-primary flex flex-col items-center gap-1 text-muted-foreground md:hidden">
          <UserIcon className="w-6 h-6" />
          <span className="text-[10px] font-medium">Profil</span>
        </Link>
        {(session?.user as any)?.role === 'company' && (
          <Link to="/post-job" className="[&.active]:text-primary flex flex-col items-center gap-1 text-primary">
            <PlusCircle className="w-6 h-6" />
            <span className="text-[10px] font-medium">İlan Ver</span>
          </Link>
        )}
      </nav>
      <Toaster position="bottom-right" />
    </div>
  );
}
