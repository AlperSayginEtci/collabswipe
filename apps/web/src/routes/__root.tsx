import { createRootRoute, Link, Outlet, useLocation, useNavigate } from '@tanstack/react-router';
import { Home, Compass, Briefcase, MessageSquare, User as UserIcon, Bell, LogOut, ChevronDown } from 'lucide-react';
import { useSession, signOut } from '@collabswipe/auth/client';
import { useEffect, useState } from 'react';
import { Toaster } from 'react-hot-toast';

export const Route = createRootRoute({
  component: RootLayout,
});

function RootLayout() {
  const { data: session, isPending } = useSession();
  const location = useLocation();
  const navigate = useNavigate();
  const [isDiscoverOpen, setIsDiscoverOpen] = useState(location.pathname === '/discover');

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
  const username = `@${name.toLowerCase()}${surname ? surname.toLowerCase() : ''}`;

  return (
    <div className="flex min-h-screen bg-background text-foreground font-sans">
      {/* Sidebar Layout */}
      <aside className="w-64 border-r border-border bg-card hidden md:flex flex-col">
        <div className="p-6">
          <h1 className="text-2xl font-black text-primary tracking-tighter">CollabSwipe</h1>
        </div>
        
        <nav className="flex-1 px-4 space-y-2">
          <Link to="/" className="[&.active]:bg-secondary [&.active]:text-foreground flex items-center gap-3 px-4 py-3 rounded-lg text-muted-foreground hover:bg-secondary/50 hover:text-foreground font-medium transition-colors">
            <Home className="w-5 h-5" />
            Home
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
                Discover
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
          <Link to="/jobs" className="[&.active]:bg-secondary [&.active]:text-foreground flex items-center gap-3 px-4 py-3 rounded-lg text-muted-foreground hover:bg-secondary/50 hover:text-foreground font-medium transition-colors">
            <Briefcase className="w-5 h-5" />
            Jobs
          </Link>
          <Link to="/matches" className="[&.active]:bg-secondary [&.active]:text-foreground flex items-center gap-3 px-4 py-3 rounded-lg text-muted-foreground hover:bg-secondary/50 hover:text-foreground font-medium transition-colors">
            <MessageSquare className="w-5 h-5" />
            Matches
          </Link>
          <Link to="/profile" className="[&.active]:bg-secondary [&.active]:text-foreground flex items-center gap-3 px-4 py-3 rounded-lg text-muted-foreground hover:bg-secondary/50 hover:text-foreground font-medium transition-colors">
            <UserIcon className="w-5 h-5" />
            Profile
          </Link>
        </nav>
        
        <div className="p-4 border-t border-border space-y-3">
          <Link to="/profile" className="flex items-center gap-3 p-2 rounded-lg cursor-pointer hover:bg-secondary/50 transition-colors">
            <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center text-primary font-bold">
              {initials}
            </div>
            <div className="flex-1 overflow-hidden">
              <p className="text-sm font-medium truncate">{name} {surname}</p>
              <p className="text-xs text-muted-foreground truncate">{username}</p>
            </div>
          </Link>
          <button 
            onClick={() => signOut({ callbackURL: '/login' })}
            className="flex items-center justify-center gap-2 w-full bg-destructive/10 hover:bg-destructive/20 text-destructive text-sm font-bold py-2.5 rounded-xl transition-colors"
          >
            <LogOut className="w-4 h-4" />
            Çıkış Yap
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col h-screen overflow-hidden">
        {/* Mobile Header */}
        <header className="md:hidden flex items-center justify-between p-4 border-b border-border bg-card">
          <h1 className="text-xl font-black text-primary">CollabSwipe</h1>
          <button className="text-muted-foreground" onClick={() => signOut({ callbackURL: '/login' })}>
            <LogOut className="w-6 h-6 text-destructive" />
          </button>
        </header>

        {/* Desktop Topbar */}
        <div className="hidden md:flex items-center justify-end p-4 border-b border-border bg-background/95 backdrop-blur z-10 sticky top-0">
          <button className="p-2 text-muted-foreground hover:text-foreground hover:bg-secondary rounded-full transition-colors">
            <Bell className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto p-4 md:p-8 flex flex-col">
          <div className="max-w-6xl mx-auto w-full flex-1 flex flex-col">
            <Outlet />
          </div>
        </div>
      </main>

      {/* Mobile Bottom Tab Navigation */}
      <nav className="md:hidden fixed bottom-0 w-full bg-card border-t border-border flex justify-around p-3 pb-safe z-50">
        <Link to="/" className="[&.active]:text-primary flex flex-col items-center gap-1 text-muted-foreground">
          <Home className="w-6 h-6" />
          <span className="text-[10px] font-medium">Home</span>
        </Link>
        <Link to="/discover" className="[&.active]:text-primary flex flex-col items-center gap-1 text-muted-foreground">
          <Compass className="w-6 h-6" />
          <span className="text-[10px] font-medium">Discover</span>
        </Link>
        <Link to="/jobs" className="[&.active]:text-primary flex flex-col items-center gap-1 text-muted-foreground">
          <Briefcase className="w-6 h-6" />
          <span className="text-[10px] font-medium">Jobs</span>
        </Link>
        <Link to="/matches" className="[&.active]:text-primary flex flex-col items-center gap-1 text-muted-foreground">
          <MessageSquare className="w-6 h-6" />
          <span className="text-[10px] font-medium">Matches</span>
        </Link>
      </nav>
      <Toaster position="bottom-right" />
    </div>
  );
}
