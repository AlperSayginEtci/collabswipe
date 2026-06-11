import { createFileRoute, Outlet, Link, useNavigate } from '@tanstack/react-router';
import { Users, FileWarning, LayoutDashboard, LifeBuoy } from 'lucide-react';
import { useSession } from '@collabswipe/auth/client';
import { useEffect } from 'react';

export const Route = createFileRoute('/admin')({
  component: AdminLayout,
});

function AdminLayout() {
  const { data: session, isPending } = useSession();
  const navigate = useNavigate();

  useEffect(() => {
    if (!isPending) {
      if (!session || (session.user as any)?.role !== 'admin') {
        navigate({ to: '/' });
      }
    }
  }, [session, isPending, navigate]);

  if (isPending || !session || (session.user as any)?.role !== 'admin') {
    return (
      <div className="flex justify-center items-center h-full min-h-[50vh]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      <div className="mb-6 flex gap-6 border-b border-border pb-1">
        <Link 
          to="/admin" 
          activeOptions={{ exact: true }}
          className="[&.active]:text-primary [&.active]:border-b-2 [&.active]:border-primary pb-2 font-bold text-muted-foreground hover:text-foreground transition-colors flex items-center gap-2"
        >
          <LayoutDashboard className="w-4 h-4" />
          Dashboard
        </Link>
        <Link 
          to="/admin/users" 
          className="[&.active]:text-primary [&.active]:border-b-2 [&.active]:border-primary pb-2 font-bold text-muted-foreground hover:text-foreground transition-colors flex items-center gap-2"
        >
          <Users className="w-4 h-4" />
          Kullanıcılar
        </Link>
        <Link 
          to="/admin/reports" 
          className="[&.active]:text-primary [&.active]:border-b-2 [&.active]:border-primary pb-2 font-bold text-muted-foreground hover:text-foreground transition-colors flex items-center gap-2"
        >
          <FileWarning className="w-4 h-4" />
          Şikayetler
        </Link>
        <Link 
          to="/admin/tickets" 
          className="[&.active]:text-primary [&.active]:border-b-2 [&.active]:border-primary pb-2 font-bold text-muted-foreground hover:text-foreground transition-colors flex items-center gap-2"
        >
          <LifeBuoy className="w-4 h-4" />
          Destek Talepleri
        </Link>
      </div>
      <div className="flex-1 bg-card rounded-xl border border-border p-4 md:p-6 shadow-sm">
        <Outlet />
      </div>
    </div>
  );
}
