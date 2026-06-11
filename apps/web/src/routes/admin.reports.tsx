import { createFileRoute } from '@tanstack/react-router';
import { trpc } from '../lib/trpc';
import toast from 'react-hot-toast';
import { useState, useEffect, useRef } from 'react';
import { AlertTriangle, ChevronDown, Flag, UserX, ShieldAlert, MailWarning, EyeOff } from 'lucide-react';

export const Route = createFileRoute('/admin/reports')({
  component: AdminReports,
});

type ActionType = 'STRIKE' | 'QUARANTINE' | 'REQUEST_EDIT' | 'MUTE' | 'SHADOWBAN' | 'WARN_REPORTER' | null;

function AdminReports() {
  const { data: reports, isLoading, refetch } = trpc.admin.getReports.useQuery();
  
  const [banModalOpen, setBanModalOpen] = useState(false);
  const [banTargetId, setBanTargetId] = useState<string | null>(null);
  
  const [activeMenu, setActiveMenu] = useState<string | null>(null);

  // Action Modal States
  const [actionModalOpen, setActionModalOpen] = useState(false);
  const [currentAction, setCurrentAction] = useState<ActionType>(null);
  const [actionTargetId, setActionTargetId] = useState<string>(''); // Can be userId, postId, or reporterId
  const [actionReason, setActionReason] = useState('');
  const [actionDefaultReason, setActionDefaultReason] = useState('');

  const updateStatus = trpc.admin.updateReportStatus.useMutation({
    onSuccess: () => { toast.success('Durum güncellendi'); refetch(); }
  });

  const banPost = trpc.admin.banPost.useMutation({
    onSuccess: () => { toast.success('Gönderi yasaklandı'); refetch(); },
    onError: (err) => toast.error(err.message)
  });
  const unbanPost = trpc.admin.unbanPost.useMutation({
    onSuccess: () => { toast.success('Yasak kaldırıldı'); refetch(); },
    onError: (err) => toast.error(err.message)
  });

  // Gelişmiş Moderasyon Mutasyonları
  const issueStrike = trpc.admin.issueStrike.useMutation({ onSuccess: () => { toast.success('Uyarı (Strike) verildi'); refetch(); closeActionModal(); }, onError: (err) => toast.error(err.message || 'Bir hata oluştu') });
  const quarantinePost = trpc.admin.quarantinePost.useMutation({ onSuccess: () => { toast.success('Gönderi karantinaya alındı'); refetch(); closeActionModal(); }, onError: (err) => toast.error(err.message || 'Bir hata oluştu') });
  const requestPostEdit = trpc.admin.requestPostEdit.useMutation({ onSuccess: () => { toast.success('Düzenleme talebi gönderildi'); refetch(); closeActionModal(); }, onError: (err) => toast.error(err.message || 'Bir hata oluştu') });
  const muteUser = trpc.admin.muteUser.useMutation({ onSuccess: () => { toast.success('Kullanıcı 7 gün susturuldu'); refetch(); closeActionModal(); }, onError: (err) => toast.error(err.message || 'Bir hata oluştu') });
  const toggleShadowban = trpc.admin.toggleShadowban.useMutation({ onSuccess: () => { toast.success('Shadowban uygulandı'); refetch(); closeActionModal(); }, onError: (err) => toast.error(err.message || 'Bir hata oluştu') });
  const warnReporter = trpc.admin.warnReporter.useMutation({ onSuccess: () => { toast.success('Şikayet edene uyarı gönderildi'); refetch(); closeActionModal(); }, onError: (err) => toast.error(err.message || 'Bir hata oluştu') });

  const closeActionModal = () => {
    setActionModalOpen(false);
    setCurrentAction(null);
    setActionReason('');
  };

  const openActionModal = (action: ActionType, targetId: string, defaultReason: string) => {
    setCurrentAction(action);
    setActionTargetId(targetId);
    setActionDefaultReason(defaultReason);
    setActionReason(defaultReason); // Populate with the report's reason initially
    setActionModalOpen(true);
    setActiveMenu(null); // Close dropdown
  };

  const handleActionSubmit = () => {
    if (!currentAction || !actionTargetId) return;

    if (currentAction === 'STRIKE') issueStrike.mutate({ userId: actionTargetId, reason: actionReason });
    if (currentAction === 'QUARANTINE') quarantinePost.mutate({ postId: actionTargetId, reason: actionReason });
    if (currentAction === 'REQUEST_EDIT') requestPostEdit.mutate({ postId: actionTargetId, reason: actionReason });
    if (currentAction === 'MUTE') muteUser.mutate({ userId: actionTargetId, durationDays: 7, reason: actionReason });
    if (currentAction === 'SHADOWBAN') toggleShadowban.mutate({ userId: actionTargetId, isShadowbanned: true });
    if (currentAction === 'WARN_REPORTER') warnReporter.mutate({ reporterId: actionTargetId });
  };

  // Click outside listener to close dropdowns
  const menuRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setActiveMenu(null);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  if (isLoading) return <div className="p-4">Yükleniyor...</div>;

  const isActionPending = issueStrike.isPending || quarantinePost.isPending || requestPostEdit.isPending || muteUser.isPending || toggleShadowban.isPending || warnReporter.isPending;

  return (
    <div className="pb-20" ref={menuRef}>
      <h2 className="text-2xl font-bold mb-6 text-foreground">Şikayetler ve Moderasyon</h2>
      <div className="space-y-4">
        {reports?.map(report => (
          <div key={report.id} className={`bg-secondary/10 border border-border p-4 rounded-xl flex flex-col gap-4 shadow-sm relative ${activeMenu === report.id ? 'z-20' : 'z-10'}`}>
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
              <div className="flex-1">
                <div className="flex gap-2 items-center mb-2">
                  <span className="bg-primary/10 text-primary px-2 py-0.5 rounded text-xs font-black">{report.targetType}</span>
                  <span className="text-muted-foreground text-xs font-mono bg-secondary px-2 py-0.5 rounded">Target: {report.targetId}</span>
                  {report.isTargetBanned && (
                     <span className="text-xs bg-destructive/10 text-destructive border border-destructive/20 px-2 py-0.5 rounded font-bold">Yasaklı</span>
                  )}
                </div>
                <p className="font-medium text-foreground text-lg">{report.reason}</p>
                <div className="text-sm text-muted-foreground mt-2 flex items-center gap-2">
                  {report.reporter.image ? (
                    <img src={report.reporter.image} alt="reporter" className="w-5 h-5 rounded-full" />
                  ) : (
                    <div className="w-5 h-5 rounded-full bg-secondary" />
                  )}
                  Şikayet eden: <span className="font-bold">{report.reporter.name} {report.reporter.surname}</span>
                </div>
              </div>
              
              <div className="flex flex-col gap-2 min-w-[150px] shrink-0">
                <select 
                  value={report.status}
                  onChange={(e) => updateStatus.mutate({ reportId: report.id, status: e.target.value as any })}
                  disabled={updateStatus.isPending}
                  className={`border text-sm rounded-lg p-2 font-bold focus:ring-2 focus:ring-primary outline-none transition-colors ${report.status === 'PENDING' ? 'bg-orange-500/10 text-orange-500 border-orange-500/20' : report.status === 'RESOLVED' ? 'bg-green-500/10 text-green-500 border-green-500/20' : report.status === 'DISMISSED' ? 'bg-secondary text-muted-foreground border-border' : 'bg-blue-500/10 text-blue-500 border-blue-500/20'}`}
                >
                  <option value="PENDING" className="text-foreground bg-background">Bekliyor</option>
                  <option value="REVIEWED" className="text-foreground bg-background">İncelendi</option>
                  <option value="RESOLVED" className="text-foreground bg-background">Çözüldü</option>
                  <option value="DISMISSED" className="text-foreground bg-background">Reddedildi</option>
                </select>
              </div>
            </div>

            {/* Aksiyon Barı */}
            <div className="pt-3 border-t border-border/50 flex flex-wrap gap-2 items-center">
              {report.targetType === 'POST' && (
                report.isTargetBanned ? (
                  <button onClick={() => unbanPost.mutate({ postId: report.targetId })} disabled={unbanPost.isPending} className="text-xs bg-secondary hover:bg-secondary/80 text-foreground border border-border px-3 py-1.5 rounded-lg font-bold transition-colors disabled:opacity-50 cursor-pointer">
                    {unbanPost.isPending ? 'İşleniyor...' : 'Yasağı Kaldır'}
                  </button>
                ) : (
                  <button onClick={() => { setBanTargetId(report.targetId); setBanModalOpen(true); }} disabled={banPost.isPending} className="text-xs bg-destructive/10 text-destructive border border-destructive/20 px-3 py-1.5 rounded-lg font-bold hover:bg-destructive/20 transition-colors disabled:opacity-50 cursor-pointer">
                    Gönderiyi Banla
                  </button>
                )
              )}

              {/* Gelişmiş Aksiyonlar Dropdown */}
              <div className="relative">
                <button 
                  onClick={() => setActiveMenu(activeMenu === report.id ? null : report.id)}
                  className="text-xs bg-primary/10 text-primary border border-primary/20 px-3 py-1.5 rounded-lg font-bold hover:bg-primary/20 transition-colors flex items-center gap-1 cursor-pointer"
                >
                  Gelişmiş İşlemler <ChevronDown className="w-3 h-3" />
                </button>
                
                {activeMenu === report.id && (
                  <div className="absolute top-full left-0 mt-2 w-64 bg-card border border-border rounded-xl shadow-2xl z-50 overflow-hidden flex flex-col py-1 animate-in slide-in-from-top-2">
                    
                    {(report as any).targetUserId && (
                      <>
                        <button onClick={() => openActionModal('STRIKE', (report as any).targetUserId, report.reason)} className="text-left px-4 py-2.5 text-xs font-bold hover:bg-secondary flex items-center gap-2 cursor-pointer text-foreground">
                          <Flag className="w-4 h-4 text-orange-500" /> Kullanıcıya Uyarı (Strike) Ver
                        </button>
                        <button onClick={() => openActionModal('MUTE', (report as any).targetUserId, report.reason)} className="text-left px-4 py-2.5 text-xs font-bold hover:bg-secondary flex items-center gap-2 cursor-pointer text-foreground">
                          <UserX className="w-4 h-4 text-blue-500" /> 7 Gün Mute (Sustur)
                        </button>
                        <button onClick={() => openActionModal('SHADOWBAN', (report as any).targetUserId, report.reason)} className="text-left px-4 py-2.5 text-xs font-bold hover:bg-secondary flex items-center gap-2 cursor-pointer text-foreground">
                          <EyeOff className="w-4 h-4 text-purple-500" /> Shadowban Uygula
                        </button>
                      </>
                    )}

                    {report.targetType === 'POST' && (
                      <>
                        <div className="h-px bg-border/60 my-1 mx-2" />
                        <button onClick={() => openActionModal('REQUEST_EDIT', report.targetId, report.reason)} className="text-left px-4 py-2.5 text-xs font-bold hover:bg-secondary flex items-center gap-2 cursor-pointer text-foreground">
                          <MailWarning className="w-4 h-4 text-yellow-500" /> Düzenleme İste (24 Saat)
                        </button>
                        <button onClick={() => openActionModal('QUARANTINE', report.targetId, report.reason)} className="text-left px-4 py-2.5 text-xs font-bold hover:bg-secondary flex items-center gap-2 cursor-pointer text-foreground">
                          <ShieldAlert className="w-4 h-4 text-red-500" /> Karantinaya Al (Gizle)
                        </button>
                      </>
                    )}

                    <div className="h-px bg-border/60 my-1 mx-2" />
                    <button onClick={() => openActionModal('WARN_REPORTER', report.reporterId, 'Şikayetiniz asılsız bulunmuştur.')} className="text-left px-4 py-2.5 text-xs font-bold hover:bg-destructive/10 text-destructive flex items-center gap-2 cursor-pointer">
                      <AlertTriangle className="w-4 h-4" /> Şikayet Edeni Uyar (Asılsız)
                    </button>
                  </div>
                )}
              </div>

            </div>
          </div>
        ))}
        {reports?.length === 0 && (
          <div className="bg-secondary/10 border border-dashed border-border rounded-xl p-12 text-center">
            <p className="text-muted-foreground font-medium">Şu an hiç şikayet bulunmuyor. 🎉</p>
          </div>
        )}
      </div>

      {/* Action Data Modal */}
      {actionModalOpen && currentAction && (
        <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-[100] flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-card border border-border/70 rounded-2xl shadow-2xl max-w-md w-full flex flex-col overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="p-6 space-y-4">
              <h3 className="font-bold text-lg text-foreground flex items-center gap-2">
                {currentAction === 'STRIKE' && <><Flag className="w-5 h-5 text-orange-500" /> Kullanıcıya Uyarı (Strike) Ver</>}
                {currentAction === 'MUTE' && <><UserX className="w-5 h-5 text-blue-500" /> Kullanıcıyı Sustur (Mute)</>}
                {currentAction === 'SHADOWBAN' && <><EyeOff className="w-5 h-5 text-purple-500" /> Shadowban Uygula</>}
                {currentAction === 'REQUEST_EDIT' && <><MailWarning className="w-5 h-5 text-yellow-500" /> Düzenleme İsteği Gönder</>}
                {currentAction === 'QUARANTINE' && <><ShieldAlert className="w-5 h-5 text-red-500" /> Gönderiyi Karantinaya Al</>}
                {currentAction === 'WARN_REPORTER' && <><AlertTriangle className="w-5 h-5 text-destructive" /> Asılsız Şikayet Uyarısı</>}
              </h3>
              
              <div className="space-y-2">
                <label className="text-sm font-semibold text-muted-foreground">Kullanıcıya İletilecek Gerekçe / Mesaj:</label>
                <textarea 
                  value={actionReason}
                  onChange={(e) => setActionReason(e.target.value)}
                  className="w-full h-32 p-3 bg-secondary/30 border border-border rounded-xl text-sm focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-colors resize-none"
                  placeholder="Kullanıcıya gönderilecek bildirimin içeriği..."
                />
              </div>
            </div>
            <div className="px-5 py-4 border-t border-border/50 bg-muted/20 flex justify-end gap-2">
              <button 
                onClick={closeActionModal}
                className="px-4 py-2 font-semibold text-sm rounded-lg hover:bg-secondary transition-colors text-foreground flex-1 cursor-pointer"
              >
                İptal
              </button>
              <button 
                onClick={handleActionSubmit}
                disabled={isActionPending || !actionReason.trim()}
                className="px-4 py-2 bg-primary text-primary-foreground font-semibold text-sm rounded-lg hover:bg-primary/90 transition-opacity disabled:opacity-50 flex-1 cursor-pointer"
              >
                {isActionPending ? 'İşleniyor...' : 'Onayla ve Gönder'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Ban Post Modal */}
      {banModalOpen && banTargetId && (
        <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-[100] flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-card border border-border/70 rounded-2xl shadow-2xl max-w-sm w-full flex flex-col overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="p-6 text-center space-y-4">
              <div className="w-12 h-12 rounded-full bg-destructive/10 text-destructive flex items-center justify-center mx-auto"><AlertTriangle className="w-6 h-6" /></div>
              <h3 className="font-bold text-lg text-foreground">Emin misiniz?</h3>
              <p className="text-sm text-muted-foreground">Bu gönderiyi tamamen yayından kaldırmak istediğinize emin misiniz?</p>
            </div>
            <div className="px-5 py-4 border-t border-border/50 bg-muted/20 flex justify-end gap-2">
              <button onClick={() => setBanModalOpen(false)} className="px-4 py-2 font-semibold text-sm rounded-lg hover:bg-secondary transition-colors text-foreground flex-1 cursor-pointer">İptal</button>
              <button onClick={() => { banPost.mutate({ postId: banTargetId }); setBanModalOpen(false); setBanTargetId(null); }} className="px-4 py-2 bg-destructive text-destructive-foreground font-semibold text-sm rounded-lg flex-1 hover:opacity-90 cursor-pointer">Evet, Kaldır</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
