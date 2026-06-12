import { createFileRoute, useNavigate } from '@tanstack/react-router';
import { trpc } from '../lib/trpc';
import { Bell, CheckCircle2, AlertTriangle, ShieldAlert, XCircle, Info } from 'lucide-react';
import toast from 'react-hot-toast';

export const Route = createFileRoute('/notifications')({
  component: NotificationsPage,
});

function NotificationsPage() {
  const navigate = useNavigate();
  const { data: notifications, isLoading, refetch } = trpc.notification.getMyNotifications.useQuery();
  
  const markAsRead = trpc.notification.markAsRead.useMutation({
    onSuccess: () => refetch()
  });

  const markAllAsRead = trpc.notification.markAllAsRead.useMutation({
    onSuccess: () => {
      toast.success('Tümü okundu olarak işaretlendi');
      refetch();
    }
  });

  if (isLoading) {
    return <div className="p-8 text-center text-muted-foreground animate-pulse">Bildirimler Yükleniyor...</div>;
  }

  const unreadCount = notifications?.filter(n => !n.isRead).length || 0;

  const getIconForTitle = (title: string) => {
    if (title.includes('Kapatıldı')) return <XCircle className="w-6 h-6 text-destructive" />;
    if (title.includes('Strike')) return <AlertTriangle className="w-6 h-6 text-orange-500" />;
    if (title.includes('Karantina') || title.includes('Mute') || title.includes('Shadowban')) return <ShieldAlert className="w-6 h-6 text-red-500" />;
    return <Info className="w-6 h-6 text-blue-500" />;
  };

  return (
    <div className="max-w-3xl mx-auto pb-20">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-foreground flex items-center gap-2">
          <Bell className="w-6 h-6" /> Bildirimler
        </h2>
        {unreadCount > 0 && (
          <button 
            onClick={() => markAllAsRead.mutate()}
            disabled={markAllAsRead.isPending}
            className="text-sm font-semibold bg-secondary/50 hover:bg-secondary px-4 py-2 rounded-lg transition-colors flex items-center gap-2 text-foreground"
          >
            <CheckCircle2 className="w-4 h-4" /> Tümünü Okundu İşaretle
          </button>
        )}
      </div>

      <div className="space-y-3">
        {notifications?.map((notification) => (
          <div 
            key={notification.id}
            onClick={() => {
              if (!notification.isRead) {
                markAsRead.mutate({ id: notification.id });
              }
              if (notification.link) {
                navigate({ to: notification.link as any });
              }
            }}
            className={`p-4 rounded-2xl border transition-all cursor-pointer flex gap-4 ${notification.isRead ? 'bg-background border-border/50 opacity-70' : 'bg-primary/5 border-primary/20 shadow-sm'}`}
          >
            <div className="shrink-0 mt-1">
              {getIconForTitle(notification.title)}
            </div>
            <div className="flex-1">
              <div className="flex justify-between items-start gap-2">
                <h3 className={`font-bold text-base ${notification.isRead ? 'text-foreground/80' : 'text-foreground'}`}>
                  {notification.title}
                </h3>
                <span className="text-xs font-medium text-muted-foreground whitespace-nowrap">
                  {new Date(notification.createdAt).toLocaleDateString()}
                </span>
              </div>
              <p className={`text-sm mt-1 leading-relaxed ${notification.isRead ? 'text-muted-foreground' : 'text-foreground/90 font-medium'}`}>
                {notification.message}
              </p>
            </div>
            {!notification.isRead && (
              <div className="shrink-0 flex items-center justify-center w-3">
                <div className="w-2.5 h-2.5 rounded-full bg-primary animate-pulse" />
              </div>
            )}
          </div>
        ))}

        {notifications?.length === 0 && (
          <div className="text-center p-12 border border-dashed border-border rounded-2xl bg-secondary/10">
            <Bell className="w-12 h-12 mx-auto text-muted-foreground/50 mb-4" />
            <p className="text-muted-foreground font-medium text-lg">Hiç bildiriminiz yok.</p>
          </div>
        )}
      </div>
    </div>
  );
}
