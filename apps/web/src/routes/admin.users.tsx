import { createFileRoute } from '@tanstack/react-router';
import { trpc } from '../lib/trpc';
import toast from 'react-hot-toast';
import { useState } from 'react';
import { X, ShieldAlert, Search, Filter } from 'lucide-react';

export const Route = createFileRoute('/admin/users')({
  component: AdminUsers,
});

function AdminUsers() {
  const { data: users, isLoading, refetch } = trpc.admin.getUsers.useQuery();
  
  // Filters state
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState('ALL'); // 'ALL', 'ACTIVE', 'BANNED'
  const [filterRole, setFilterRole] = useState('ALL'); // 'ALL', 'admin', 'company', 'user'

  const [banModalOpen, setBanModalOpen] = useState(false);
  const [banTargetUser, setBanTargetUser] = useState<any>(null);
  const [banReason, setBanReason] = useState('');
  const [banDuration, setBanDuration] = useState('PERMANENT');

  const banUser = trpc.admin.banUser.useMutation({
    onSuccess: () => {
      toast.success('Kullanıcı başarıyla yasaklandı');
      setBanModalOpen(false);
      setBanTargetUser(null);
      setBanReason('');
      setBanDuration('PERMANENT');
      refetch();
    },
    onError: (err) => {
      toast.error(err.message || 'Yasaklama işlemi başarısız oldu');
    }
  });

  const unbanUser = trpc.admin.unbanUser.useMutation({
    onSuccess: () => {
      toast.success('Kullanıcı yasağı kaldırıldı');
      refetch();
    }
  });

  const handleBanSubmit = () => {
    if (!banTargetUser || !banReason.trim()) {
      toast.error('Lütfen yasaklama sebebi girin.');
      return;
    }

    let banExpires: Date | undefined = undefined;
    if (banDuration === '24H') {
      banExpires = new Date();
      banExpires.setHours(banExpires.getHours() + 24);
    } else if (banDuration === '7D') {
      banExpires = new Date();
      banExpires.setDate(banExpires.getDate() + 7);
    } else if (banDuration === '30D') {
      banExpires = new Date();
      banExpires.setDate(banExpires.getDate() + 30);
    }

    banUser.mutate({
      userId: banTargetUser.id,
      reason: banReason,
      banExpires
    });
  };

  const openBanModal = (user: any) => {
    setBanTargetUser(user);
    setBanModalOpen(true);
    setBanReason('');
    setBanDuration('PERMANENT');
  };

  if (isLoading) return <div className="p-4">Yükleniyor...</div>;

  // Filter the users based on the selected filters and search query
  const filteredUsers = users?.filter(user => {
    // Status filter
    if (filterStatus === 'ACTIVE' && user.banned) return false;
    if (filterStatus === 'BANNED' && !user.banned) return false;
    
    // Role filter
    if (filterRole !== 'ALL' && user.role !== filterRole) return false;

    // Search query
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase().trim();
      const fullName = `${user.name} ${user.surname}`.toLowerCase();
      const username = user.username?.toLowerCase() || '';
      const email = user.email.toLowerCase();
      
      if (!fullName.includes(query) && !username.includes(query) && !email.includes(query)) {
        return false;
      }
    }

    return true;
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <h2 className="text-2xl font-bold text-foreground">Kullanıcı Yönetimi</h2>
      </div>

      {/* Filters and Search Bar */}
      <div className="bg-secondary/10 border border-border p-4 rounded-2xl flex flex-col md:flex-row gap-4 items-center shadow-sm">
        <div className="relative flex-1 w-full">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input 
            type="text" 
            placeholder="İsim, e-posta veya kullanıcı adı ile ara..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-card border border-border rounded-xl pl-10 pr-4 py-2.5 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all"
          />
        </div>
        
        <div className="flex gap-4 w-full md:w-auto">
          <div className="flex items-center gap-2 bg-card border border-border rounded-xl px-3 py-2.5 flex-1 md:flex-none">
            <Filter className="w-4 h-4 text-muted-foreground shrink-0" />
            <select 
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="bg-transparent border-none text-sm font-semibold outline-none w-full"
            >
              <option value="ALL">Tüm Durumlar</option>
              <option value="ACTIVE">Aktif Hesaplar</option>
              <option value="BANNED">Yasaklı Hesaplar</option>
            </select>
          </div>
          
          <div className="flex items-center gap-2 bg-card border border-border rounded-xl px-3 py-2.5 flex-1 md:flex-none">
            <select 
              value={filterRole}
              onChange={(e) => setFilterRole(e.target.value)}
              className="bg-transparent border-none text-sm font-semibold outline-none w-full"
            >
              <option value="ALL">Tüm Roller</option>
              <option value="user">Kullanıcı</option>
              <option value="company">Şirket</option>
              <option value="admin">Yönetici</option>
            </select>
          </div>
        </div>
      </div>

      <div className="overflow-x-auto bg-card rounded-2xl border border-border shadow-sm">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="border-b border-border text-muted-foreground bg-muted/20">
              <th className="p-4 font-bold text-xs uppercase tracking-wider">Kullanıcı</th>
              <th className="p-4 font-bold text-xs uppercase tracking-wider">Email</th>
              <th className="p-4 font-bold text-xs uppercase tracking-wider">Rol</th>
              <th className="p-4 font-bold text-xs uppercase tracking-wider">Durum</th>
              <th className="p-4 font-bold text-xs uppercase tracking-wider text-right">İşlemler</th>
            </tr>
          </thead>
          <tbody>
            {filteredUsers?.map(user => (
              <tr key={user.id} className="border-b border-border hover:bg-secondary/20 transition-colors">
                <td className="p-3 font-medium">{user.name} {user.surname} <span className="text-muted-foreground text-xs block">@{user.username}</span></td>
                <td className="p-3 text-muted-foreground">{user.email}</td>
                <td className="p-3">
                  <span className={`px-2 py-1 rounded-full text-xs font-bold ${user.role === 'admin' ? 'bg-red-500/10 text-red-500' : user.role === 'company' ? 'bg-blue-500/10 text-blue-500' : 'bg-secondary text-foreground'}`}>
                    {user.role}
                  </span>
                </td>
                <td className="p-3">
                  {user.banned ? (
                    <div className="flex flex-col">
                      <span className="text-destructive font-bold text-sm bg-destructive/10 px-2 py-1 rounded-full inline-block w-max">Yasaklı</span>
                      {user.banReason && <span className="text-[10px] text-muted-foreground mt-1 max-w-[150px] truncate" title={user.banReason}>{user.banReason}</span>}
                    </div>
                  ) : (
                    <span className="text-green-500 font-bold text-sm bg-green-500/10 px-2 py-1 rounded-full">Aktif</span>
                  )}
                </td>
                <td className="p-4 text-right">
                  {user.role === 'admin' ? (
                    <span className="text-muted-foreground text-[11px] font-bold bg-secondary/50 px-2.5 py-1.5 rounded-lg inline-block">İşlem Yapılamaz</span>
                  ) : user.banned ? (
                    <button 
                      onClick={() => unbanUser.mutate({ userId: user.id })}
                      className="px-4 py-2 bg-secondary hover:bg-secondary/80 text-foreground text-xs font-bold rounded-xl transition-all shadow-sm"
                      disabled={unbanUser.isPending}
                    >
                      Yasağı Kaldır
                    </button>
                  ) : (
                    <button 
                      onClick={() => openBanModal(user)}
                      className="px-4 py-2 bg-destructive/10 hover:bg-destructive/20 text-destructive text-xs font-bold rounded-xl transition-all shadow-sm"
                    >
                      Yasakla
                    </button>
                  )}
                </td>
              </tr>
            ))}
            {filteredUsers?.length === 0 && (
              <tr>
                <td colSpan={5} className="p-8 text-center text-muted-foreground font-medium">
                  Aranan kriterlere uygun kullanıcı bulunamadı.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Ban Modal */}
      {banModalOpen && banTargetUser && (
        <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-card border border-border/70 rounded-2xl shadow-2xl max-w-md w-full flex flex-col overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between px-5 py-4 border-b border-border/50 bg-destructive/5">
              <h3 className="font-bold text-lg text-destructive flex items-center gap-2">
                <ShieldAlert className="w-5 h-5" /> Kullanıcıyı Yasakla
              </h3>
              <button 
                onClick={() => setBanModalOpen(false)}
                className="p-1.5 hover:bg-muted rounded-lg text-muted-foreground hover:text-foreground transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="p-5 space-y-4">
              <div>
                <label className="text-sm font-semibold text-foreground mb-1.5 block">Kullanıcı</label>
                <div className="bg-muted/50 border border-border p-3 rounded-lg text-sm text-muted-foreground">
                  <span className="font-bold text-foreground">{banTargetUser.name} {banTargetUser.surname}</span> (@{banTargetUser.username})
                </div>
              </div>

              <div>
                <label className="text-sm font-semibold text-foreground mb-1.5 block">Yasaklama Süresi</label>
                <div className="grid grid-cols-2 gap-2">
                  <button 
                    onClick={() => setBanDuration('24H')}
                    className={`py-2 px-3 rounded-lg border text-sm font-semibold transition-colors ${banDuration === '24H' ? 'bg-primary/10 border-primary text-primary' : 'bg-card border-border hover:bg-muted text-muted-foreground'}`}
                  >
                    24 Saat
                  </button>
                  <button 
                    onClick={() => setBanDuration('7D')}
                    className={`py-2 px-3 rounded-lg border text-sm font-semibold transition-colors ${banDuration === '7D' ? 'bg-primary/10 border-primary text-primary' : 'bg-card border-border hover:bg-muted text-muted-foreground'}`}
                  >
                    7 Gün
                  </button>
                  <button 
                    onClick={() => setBanDuration('30D')}
                    className={`py-2 px-3 rounded-lg border text-sm font-semibold transition-colors ${banDuration === '30D' ? 'bg-primary/10 border-primary text-primary' : 'bg-card border-border hover:bg-muted text-muted-foreground'}`}
                  >
                    30 Gün
                  </button>
                  <button 
                    onClick={() => setBanDuration('PERMANENT')}
                    className={`py-2 px-3 rounded-lg border text-sm font-semibold transition-colors ${banDuration === 'PERMANENT' ? 'bg-destructive/10 border-destructive text-destructive' : 'bg-card border-border hover:bg-muted text-muted-foreground'}`}
                  >
                    Süresiz (Kalıcı)
                  </button>
                </div>
              </div>

              <div>
                <label className="text-sm font-semibold text-foreground mb-1.5 block">Sebep</label>
                <textarea 
                  value={banReason}
                  onChange={(e) => setBanReason(e.target.value)}
                  placeholder="Kullanıcının yasaklanma sebebini detaylı olarak belirtin..."
                  className="w-full bg-background border border-border rounded-lg p-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 min-h-[100px]"
                />
              </div>
            </div>

            <div className="px-5 py-4 border-t border-border/50 bg-muted/20 flex justify-end gap-2">
              <button 
                onClick={() => setBanModalOpen(false)}
                className="px-4 py-2 font-semibold text-sm rounded-lg hover:bg-secondary transition-colors text-foreground"
              >
                İptal
              </button>
              <button 
                onClick={handleBanSubmit}
                disabled={banUser.isPending || !banReason.trim()}
                className="px-4 py-2 bg-destructive text-destructive-foreground font-semibold text-sm rounded-lg hover:opacity-90 transition-opacity disabled:opacity-50"
              >
                {banUser.isPending ? 'İşleniyor...' : 'Kullanıcıyı Yasakla'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
