import { useState } from 'react';
import { createFileRoute, useNavigate } from '@tanstack/react-router';
import { Search, Building, Clock, MapPin, Inbox } from 'lucide-react';
import { trpc } from '@/lib/trpc';
import { useSession } from '@collabswipe/auth/client';
import toast from 'react-hot-toast';

export const Route = createFileRoute('/jobs/')({
  component: JobsPage,
});

function JobsPage() {
  const navigate = useNavigate();
  const { data: session } = useSession();
  const [searchQuery, setSearchQuery] = useState('');
  const [showFreelance, setShowFreelance] = useState(true);
  const [showCorporate, setShowCorporate] = useState(true);

  const utils = trpc.useUtils();
  const { data: jobsResponse, isLoading } = trpc.job.list.useQuery({
    userId: session?.user?.id
  });
  
  const applyJob = trpc.job.apply.useMutation({
    onSuccess: () => {
      toast.success('Successfully applied for the job!');
      utils.job.list.invalidate();
    },
    onError: (err) => {
      console.error(err);
      toast.error('Failed to apply. Is the database running?');
    }
  });

  if (isLoading) {
    return <div className="p-8 text-center text-muted-foreground font-semibold">Loading jobs...</div>;
  }

  const jobs = jobsResponse?.items || [];

  // Filtreleme ve arama mantığı
  const filteredJobs = jobs.filter((job: any) => {
    // İş tipi filtreleri
    if (job.type === 'FREELANCE' && !showFreelance) return false;
    if (job.type === 'CORPORATE' && !showCorporate) return false;

    // Arama filtreleri (başlık, açıklama, şirket adı veya yetenek)
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      const titleMatch = job.title?.toLowerCase().includes(query);
      const descMatch = job.description?.toLowerCase().includes(query);
      const companyMatch = `${job.publisher?.name || ''} ${job.publisher?.surname || ''}`.toLowerCase().includes(query);
      const skillMatch = job.skill?.skillName?.toLowerCase().includes(query);

      return titleMatch || descMatch || companyMatch || skillMatch;
    }

    return true;
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-2 mb-8">
        <h2 className="text-3xl font-extrabold tracking-tight">Job Board</h2>
        <p className="text-muted-foreground text-lg">Find freelance projects or corporate roles.</p>
      </div>

      <div className="flex gap-4">
        {/* Sidebar Filters */}
        <div className="w-64 hidden lg:block space-y-6 bg-card border border-border p-5 rounded-xl h-fit">
          <h3 className="font-bold text-foreground">Filters</h3>
          <div className="space-y-3">
            <h4 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">Job Type</h4>
            <label className="flex items-center gap-2 cursor-pointer">
              <input 
                type="checkbox" 
                className="rounded border-border bg-background" 
                checked={showFreelance}
                onChange={(e) => setShowFreelance(e.target.checked)}
              />
              <span className="text-sm text-foreground">Freelance</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer">
              <input 
                type="checkbox" 
                className="rounded border-border bg-background" 
                checked={showCorporate}
                onChange={(e) => setShowCorporate(e.target.checked)}
              />
              <span className="text-sm text-foreground">Corporate</span>
            </label>
          </div>
        </div>

        {/* Main Job List */}
        <div className="flex-1 space-y-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
            <input 
              type="text" 
              placeholder="Search for roles, skills, or companies..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-card border border-border rounded-xl pl-10 pr-4 py-3 focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary shadow-sm"
            />
          </div>

          <div className="grid gap-4 mt-6">
            {filteredJobs.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 px-4 bg-card border border-border rounded-xl text-center">
                <Inbox className="w-12 h-12 text-muted-foreground mb-3" />
                <h3 className="font-bold text-lg mb-1">No Jobs Found</h3>
                <p className="text-muted-foreground text-sm max-w-xs">
                  We couldn't find any jobs matching your search filters. Try adjusting your query.
                </p>
              </div>
            ) : (
              filteredJobs.map((job: any) => {
                const isCurrentlyApplying = applyJob.isLoading && applyJob.variables?.jobId === job.id;
                
                return (
                  <div 
                    key={job.id} 
                    onClick={() => navigate({ to: '/jobs/$jobId', params: { jobId: job.id } })}
                    className="bg-card border border-border rounded-xl p-5 shadow-sm hover:border-primary/50 hover:shadow-md transition-all cursor-pointer flex flex-col md:flex-row md:items-center justify-between gap-4"
                  >
                    <div className="flex items-start gap-4">
                      <div className="w-12 h-12 rounded-lg bg-secondary flex items-center justify-center shrink-0">
                        <Building className="w-6 h-6 text-muted-foreground" />
                      </div>
                      <div>
                        <h3 className="font-bold text-lg text-foreground">{job.title}</h3>
                        <p className="text-primary font-medium text-sm">{job.publisher?.name || 'Company'} {job.publisher?.surname || ''}</p>
                        <div className="flex flex-wrap items-center gap-3 mt-2 text-muted-foreground text-sm">
                          <span className="flex items-center gap-1"><MapPin className="w-4 h-4" /> Remote</span>
                          <span className="flex items-center gap-1"><Clock className="w-4 h-4" /> {new Date(job.createdAt).toLocaleDateString()}</span>
                          <span className="bg-secondary text-secondary-foreground px-2 py-0.5 rounded text-xs font-bold uppercase">{job.type}</span>
                          {job.skill?.skillName && (
                            <span className="bg-primary/10 text-primary px-2 py-0.5 rounded text-xs font-bold uppercase">{job.skill.skillName}</span>
                          )}
                        </div>
                      </div>
                    </div>
                    <button 
                      onClick={(e) => {
                        e.stopPropagation();
                        if (!session?.user?.id) return;
                        applyJob.mutate({ jobId: job.id, applicantId: session.user.id });
                      }}
                      disabled={isCurrentlyApplying}
                      className="bg-foreground text-background font-bold px-5 py-2 rounded-lg hover:opacity-90 w-full md:w-auto disabled:opacity-50"
                    >
                      {isCurrentlyApplying ? 'Applying...' : 'Apply'}
                    </button>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
