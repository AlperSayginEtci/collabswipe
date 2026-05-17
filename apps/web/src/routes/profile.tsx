import { useState } from 'react';
import { createFileRoute } from '@tanstack/react-router';
import { Mail, Briefcase, GraduationCap, LinkIcon, Edit2, Plus, X } from 'lucide-react';
import { useSession } from '@collabswipe/auth/client';
import { trpc } from '@/lib/trpc';

export const Route = createFileRoute('/profile')({
  component: ProfilePage,
});

function ProfilePage() {
  const { data: session } = useSession();
  const userId = session?.user?.id;
  const utils = trpc.useUtils();

  const [isEditing, setIsEditing] = useState(false);
  const [editBio, setEditBio] = useState('');
  const [editLocation, setEditLocation] = useState('');
  const [newSkill, setNewSkill] = useState('');

  // Fetch true profile data
  const { data: profile, isLoading } = trpc.profile.getByUserId.useQuery(
    { userId: userId || '' },
    { 
      enabled: !!userId,
      onSuccess: (data) => {
        if (data && !isEditing) {
          setEditBio(data.bio || '');
          setEditLocation(data.location || '');
        }
      }
    }
  );

  const updateProfile = trpc.profile.update.useMutation({
    onSuccess: () => {
      utils.profile.getByUserId.invalidate({ userId: userId || '' });
      setIsEditing(false);
    }
  });

  const addSkill = trpc.profile.addSkill.useMutation({
    onSuccess: () => {
      setNewSkill('');
      utils.profile.getByUserId.invalidate({ userId: userId || '' });
    }
  });

  const removeSkill = trpc.profile.removeSkill.useMutation({
    onSuccess: () => {
      utils.profile.getByUserId.invalidate({ userId: userId || '' });
    }
  });

  if (isLoading || !session) {
    return <div className="p-10 text-center text-muted-foreground font-semibold">Loading profile...</div>;
  }

  const handleSave = () => {
    if (!userId) return;
    updateProfile.mutate({
      userId,
      bio: editBio,
      location: editLocation,
    });
  };

  const handleAddSkill = () => {
    if (!profile?.id || !newSkill.trim()) return;
    addSkill.mutate({ profileId: profile.id, skillName: newSkill.trim() });
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-20 md:pb-0">
      {/* Profile Header */}
      <div className="bg-card rounded-2xl shadow-sm border border-border overflow-hidden">
        <div className="h-48 bg-gradient-to-r from-primary/80 to-primary w-full" />
        <div className="px-6 sm:px-10 pb-8">
          <div className="flex flex-col sm:flex-row gap-6 sm:items-end">
            
            {/* Avatar */}
            <div className="-mt-12 sm:-mt-16 w-28 h-28 sm:w-32 sm:h-32 rounded-full border-4 border-card bg-secondary overflow-hidden shadow-lg shrink-0 z-10 relative">
               <img src={session.user?.image || `https://api.dicebear.com/7.x/notionists/svg?seed=${session.user?.name}`} alt="My Profile" className="w-full h-full object-cover" />
            </div>
            
            {/* User Info */}
            <div className="flex-1 pt-2 sm:pt-4">
              <h1 className="text-2xl sm:text-3xl font-black text-foreground">{session.user?.name} {(session.user as any)?.surname}</h1>
              <div className="flex items-center gap-2 mt-1 sm:mt-2 text-sm text-muted-foreground font-medium">
                <Mail className="w-4 h-4" /> {session.user?.email}
              </div>
              <div className="text-muted-foreground mt-2 font-medium text-base sm:text-lg">
                {isEditing ? (
                  <input 
                    type="text" 
                    value={editLocation} 
                    onChange={e => setEditLocation(e.target.value)} 
                    placeholder="Location (e.g. Istanbul, Turkey)" 
                    className="bg-background border border-border rounded px-3 py-1.5 text-sm w-full max-w-xs focus:outline-none focus:ring-2 focus:ring-primary/50"
                  />
                ) : (
                  profile?.location || 'Konum belirtilmemiş'
                )}
              </div>
            </div>
            
            {/* Action Buttons */}
            <div className="sm:pb-2 mt-4 sm:mt-0 flex gap-2 w-full sm:w-auto">
              {isEditing ? (
                <>
                  <button onClick={() => setIsEditing(false)} className="flex-1 sm:flex-none bg-secondary text-foreground px-6 py-2 rounded-lg font-bold hover:opacity-90">
                    İptal
                  </button>
                  <button onClick={handleSave} disabled={updateProfile.isLoading} className="flex-1 sm:flex-none bg-primary text-primary-foreground px-6 py-2 rounded-lg font-bold hover:opacity-90">
                    {updateProfile.isLoading ? 'Kaydediliyor...' : 'Kaydet'}
                  </button>
                </>
              ) : (
                <button onClick={() => {
                  setEditBio(profile?.bio || '');
                  setEditLocation(profile?.location || '');
                  setIsEditing(true);
                }} className="w-full sm:w-auto bg-primary text-primary-foreground px-6 py-2.5 rounded-lg font-bold hover:opacity-90 flex items-center justify-center gap-2 shadow-sm">
                  <Edit2 className="w-4 h-4" /> Profili Düzenle
                </button>
              )}
            </div>
            
          </div>
        </div>
      </div>

      <div className="grid md:grid-cols-3 gap-6">
        {/* Left Column: Details */}
        <div className="md:col-span-1 space-y-6">
          <div className="bg-card rounded-2xl shadow-sm border border-border p-6">
            <h3 className="font-bold text-foreground mb-4">Hakkımda</h3>
            {isEditing ? (
              <textarea 
                value={editBio} 
                onChange={e => setEditBio(e.target.value)} 
                className="w-full bg-background border border-border rounded-lg p-2 text-sm min-h-[100px]"
                placeholder="Kendinizden bahsedin..."
              />
            ) : (
              <p className="text-sm text-muted-foreground leading-relaxed">
                {profile?.bio || 'Henüz bir biyografi eklenmemiş.'}
              </p>
            )}
          </div>

          <div className="bg-card rounded-2xl shadow-sm border border-border p-6">
            <h3 className="font-bold text-foreground mb-4">Yetenekler</h3>
            <div className="flex flex-wrap gap-2 mb-4">
              {profile?.skills && profile.skills.length > 0 ? (
                profile.skills.map((s: any) => (
                  <span key={s.skillId} className="bg-secondary text-secondary-foreground px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1">
                    {s.skill.skillName}
                    {isEditing && (
                      <button onClick={() => removeSkill.mutate({ profileId: profile.id, skillId: s.skillId })} className="hover:text-destructive ml-1">
                        <X className="w-3 h-3" />
                      </button>
                    )}
                  </span>
                ))
              ) : (
                <span className="text-sm text-muted-foreground italic">Yetenek eklenmemiş.</span>
              )}
            </div>
            
            {isEditing && (
              <div className="flex gap-2">
                <input 
                  type="text" 
                  value={newSkill} 
                  onChange={e => setNewSkill(e.target.value)} 
                  placeholder="Yeni yetenek..." 
                  className="flex-1 bg-background border border-border rounded-lg px-3 py-1 text-sm"
                  onKeyDown={e => e.key === 'Enter' && handleAddSkill()}
                />
                <button onClick={handleAddSkill} disabled={addSkill.isLoading || !newSkill.trim()} className="bg-primary text-primary-foreground p-2 rounded-lg">
                  <Plus className="w-4 h-4" />
                </button>
              </div>
            )}
          </div>
          
          <div className="bg-card rounded-2xl shadow-sm border border-border p-6">
            <h3 className="font-bold text-foreground mb-4">Linkler</h3>
            <div className="space-y-3">
              <a href="#" className="flex items-center gap-2 text-primary hover:underline text-sm font-medium">
                <LinkIcon className="w-4 h-4" /> {session.user?.email?.split('@')[0]}
              </a>
            </div>
          </div>
        </div>

        {/* Right Column: Experience & Edu */}
        <div className="md:col-span-2 space-y-6">
          <div className="bg-card rounded-2xl shadow-sm border border-border p-6">
            <h3 className="font-bold text-foreground text-xl mb-6 flex items-center gap-2">
              <Briefcase className="w-5 h-5 text-primary" /> Deneyimler
            </h3>
            <div className="space-y-6">
              <div className="relative pl-6 border-l-2 border-border">
                <div className="absolute w-3 h-3 bg-primary rounded-full -left-[7px] top-1" />
                <h4 className="font-bold text-foreground text-lg">Yazılım Geliştirici</h4>
                <p className="text-primary font-medium">CollabSwipe Ağı</p>
                <p className="text-sm text-muted-foreground mt-1 mb-2">Güncel</p>
                <p className="text-foreground leading-relaxed text-sm">Buradaki deneyim geçmişi yakında dinamikleştirilecektir.</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
