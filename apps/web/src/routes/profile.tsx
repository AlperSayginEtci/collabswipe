import { createFileRoute } from '@tanstack/react-router';
import { Mail, Briefcase, GraduationCap, LinkIcon } from 'lucide-react';

export const Route = createFileRoute('/profile')({
  component: ProfilePage,
});

function ProfilePage() {
  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-20 md:pb-0">
      {/* Profile Header */}
      <div className="bg-card rounded-2xl shadow-sm border border-border overflow-hidden">
        <div className="h-48 bg-gradient-to-r from-primary/80 to-primary w-full" />
        <div className="px-6 sm:px-10 pb-8 relative">
          <div className="w-32 h-32 rounded-full border-4 border-card bg-secondary overflow-hidden absolute -top-16 shadow-lg">
             <img src="https://api.dicebear.com/7.x/notionists/svg?seed=AdminUser" alt="My Profile" className="w-full h-full object-cover" />
          </div>
          
          <div className="mt-20 flex flex-col sm:flex-row sm:items-end justify-between gap-4">
            <div>
              <h1 className="text-3xl font-black text-foreground">Oguz Sonmezer</h1>
              <p className="text-muted-foreground font-medium text-lg">Full-Stack Engineer</p>
              <div className="flex items-center gap-2 mt-2 text-sm text-muted-foreground">
                <Mail className="w-4 h-4" /> oguz@example.com
              </div>
            </div>
            <button className="bg-primary text-primary-foreground px-6 py-2 rounded-lg font-bold hover:opacity-90">
              Edit Profile
            </button>
          </div>
        </div>
      </div>

      <div className="grid md:grid-cols-3 gap-6">
        {/* Left Column: Details */}
        <div className="md:col-span-1 space-y-6">
          <div className="bg-card rounded-2xl shadow-sm border border-border p-6">
            <h3 className="font-bold text-foreground mb-4">Skills</h3>
            <div className="flex flex-wrap gap-2">
              {['TypeScript', 'React', 'Node.js', 'PostgreSQL', 'Tailwind', 'Go'].map(skill => (
                <span key={skill} className="bg-secondary text-secondary-foreground px-3 py-1 rounded-full text-xs font-bold">
                  {skill}
                </span>
              ))}
            </div>
          </div>
          
          <div className="bg-card rounded-2xl shadow-sm border border-border p-6">
            <h3 className="font-bold text-foreground mb-4">Links</h3>
            <div className="space-y-3">
              <a href="#" className="flex items-center gap-2 text-primary hover:underline text-sm font-medium">
                <LinkIcon className="w-4 h-4" /> github.com/oguz
              </a>
              <a href="#" className="flex items-center gap-2 text-primary hover:underline text-sm font-medium">
                <LinkIcon className="w-4 h-4" /> linkedin.com/in/oguz
              </a>
            </div>
          </div>
        </div>

        {/* Right Column: Experience & Edu */}
        <div className="md:col-span-2 space-y-6">
          <div className="bg-card rounded-2xl shadow-sm border border-border p-6">
            <h3 className="font-bold text-foreground text-xl mb-6 flex items-center gap-2">
              <Briefcase className="w-5 h-5 text-primary" /> Experience
            </h3>
            <div className="space-y-6">
              <div className="relative pl-6 border-l-2 border-border">
                <div className="absolute w-3 h-3 bg-primary rounded-full -left-[7px] top-1" />
                <h4 className="font-bold text-foreground text-lg">Senior Developer</h4>
                <p className="text-primary font-medium">Tech Startup Inc.</p>
                <p className="text-sm text-muted-foreground mt-1 mb-2">2022 - Present</p>
                <p className="text-foreground leading-relaxed">Leading the front-end team in transitioning our monolithic application to a micro-frontend architecture using React and Vite.</p>
              </div>
            </div>
          </div>

          <div className="bg-card rounded-2xl shadow-sm border border-border p-6">
            <h3 className="font-bold text-foreground text-xl mb-6 flex items-center gap-2">
              <GraduationCap className="w-5 h-5 text-primary" /> Education
            </h3>
             <div className="space-y-6">
              <div className="relative pl-6 border-l-2 border-border">
                <div className="absolute w-3 h-3 bg-primary rounded-full -left-[7px] top-1" />
                <h4 className="font-bold text-foreground text-lg">B.Sc. Computer Engineering</h4>
                <p className="text-primary font-medium">University of Tech</p>
                <p className="text-sm text-muted-foreground mt-1">2018 - 2022</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
