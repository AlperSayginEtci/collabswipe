import { createFileRoute } from '@tanstack/react-router';
import { Search } from 'lucide-react';

export const Route = createFileRoute('/matches')({
  component: MatchesPage,
});

function MatchesPage() {
  return (
    <div className="flex h-[80vh] bg-card border border-border rounded-xl shadow-sm overflow-hidden">
      {/* Matches List Sidebar */}
      <div className="w-full md:w-80 border-r border-border flex flex-col">
        <div className="p-4 border-b border-border">
          <h2 className="text-xl font-bold text-foreground">Messages</h2>
          <div className="relative mt-4">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <input 
              type="text" 
              placeholder="Search matches..." 
              className="w-full bg-background border border-border rounded-lg pl-9 pr-3 py-2 text-sm focus:outline-none focus:border-primary"
            />
          </div>
        </div>
        <div className="flex-1 overflow-y-auto">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="flex items-center gap-3 p-4 border-b border-border hover:bg-secondary/50 cursor-pointer transition-colors">
              <div className="w-12 h-12 rounded-full bg-primary/20 shrink-0 overflow-hidden">
                 <img src={`https://api.dicebear.com/7.x/notionists/svg?seed=${i * 5}`} alt="avatar" className="w-full h-full object-cover" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex justify-between items-baseline mb-1">
                  <h4 className="font-semibold text-foreground truncate">Match {i}</h4>
                  <span className="text-xs text-muted-foreground">12:30</span>
                </div>
                <p className="text-sm text-muted-foreground truncate">Hey! Thanks for connecting. I saw your project and...</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Chat Area (Hidden on mobile by default) */}
      <div className="hidden md:flex flex-col flex-1 bg-background select-none">
        <div className="flex-1 flex items-center justify-center text-muted-foreground">
          <div className="text-center space-y-4">
            <div className="w-20 h-20 bg-secondary rounded-full flex items-center justify-center mx-auto">
              <span className="text-4xl text-primary">👋</span>
            </div>
            <p className="text-lg font-medium">Select a match to start chatting</p>
          </div>
        </div>
      </div>
    </div>
  );
}
