import { createFileRoute } from '@tanstack/react-router';
import { trpc } from '../lib/trpc';
import { Users, FileWarning, ShieldAlert } from 'lucide-react';

export const Route = createFileRoute('/admin/')({
  component: AdminDashboard,
});

function AdminDashboard() {
  const { data: users, isLoading: usersLoading } = trpc.admin.getUsers.useQuery();
  const { data: reports, isLoading: reportsLoading } = trpc.admin.getReports.useQuery();

  if (usersLoading || reportsLoading) {
    return <div className="p-4">Yükleniyor...</div>;
  }

  const bannedUsersCount = users?.filter(u => u.banned).length || 0;
  const pendingReportsCount = reports?.filter(r => r.status === 'PENDING').length || 0;

  return (
    <div>
      <h2 className="text-2xl font-bold mb-6 text-foreground">Genel Bakış</h2>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-primary/5 border border-primary/20 p-6 rounded-2xl flex items-center gap-4 shadow-sm hover:shadow-md transition-shadow">
          <div className="bg-primary/20 p-4 rounded-xl text-primary">
            <Users className="w-8 h-8" />
          </div>
          <div>
            <p className="text-muted-foreground text-sm font-semibold">Toplam Kullanıcı</p>
            <p className="text-3xl font-black text-foreground">{users?.length || 0}</p>
          </div>
        </div>
        
        <div className="bg-orange-500/5 border border-orange-500/20 p-6 rounded-2xl flex items-center gap-4 shadow-sm hover:shadow-md transition-shadow">
          <div className="bg-orange-500/20 p-4 rounded-xl text-orange-500">
            <FileWarning className="w-8 h-8" />
          </div>
          <div>
            <p className="text-muted-foreground text-sm font-semibold">Bekleyen Şikayetler</p>
            <p className="text-3xl font-black text-foreground">{pendingReportsCount}</p>
          </div>
        </div>

        <div className="bg-destructive/5 border border-destructive/20 p-6 rounded-2xl flex items-center gap-4 shadow-sm hover:shadow-md transition-shadow">
          <div className="bg-destructive/20 p-4 rounded-xl text-destructive">
            <ShieldAlert className="w-8 h-8" />
          </div>
          <div>
            <p className="text-muted-foreground text-sm font-semibold">Yasaklı Kullanıcılar</p>
            <p className="text-3xl font-black text-foreground">{bannedUsersCount}</p>
          </div>
        </div>
      </div>
    </div>
  );
}
