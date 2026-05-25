import { useState } from 'react';
import { createFileRoute } from '@tanstack/react-router';
import { Mail, Briefcase, GraduationCap, LinkIcon, Edit2, Plus, X, Globe, Camera, Award, ExternalLink } from 'lucide-react';
import { useDropzone } from 'react-dropzone';
import { useSession, authClient } from '@collabswipe/auth/client';
import { trpc } from '@/lib/trpc';

export const Route = createFileRoute('/profile')({
  component: ProfilePage,
});

const formatDate = (dateString: string | Date) => {
  const date = new Date(dateString);
  return date.toLocaleDateString('tr-TR', { year: 'numeric', month: 'long' });
};

function ProfilePage() {
  const { data: session } = useSession();
  const userId = session?.user?.id;
  const utils = trpc.useUtils();

  const today = new Date().toISOString().split('T')[0];

  const [isEditing, setIsEditing] = useState(false);
  
  const [editName, setEditName] = useState('');
  const [editSurname, setEditSurname] = useState('');
  const [editUsername, setEditUsername] = useState('');
  const [editBio, setEditBio] = useState('');
  const [editLocation, setEditLocation] = useState('');
  const [editLinks, setEditLinks] = useState<string[]>([]);
  const [editImage, setEditImage] = useState('');
  const [editBanner, setEditBanner] = useState('');
  
  // Skills
  const [skillSearch, setSkillSearch] = useState('');
  
  // Image Upload Logic
  const validateImage = (file: File, type: 'avatar' | 'banner'): Promise<boolean> => {
    return new Promise((resolve) => {
      if (file.size > 5 * 1024 * 1024) {
        alert("Hata: Dosya boyutu çok büyük. Lütfen en fazla 5MB boyutunda bir resim seçin.");
        return resolve(false);
      }
      const img = new Image();
      const objectUrl = URL.createObjectURL(file);
      img.onload = () => {
        URL.revokeObjectURL(objectUrl);
        if (type === 'avatar' && (img.width < 200 || img.height < 200)) {
          alert("Uyarı: Profil fotoğrafı kalitesi çok düşük. En az 200x200 piksel boyutunda kare bir resim (Önerilen: 400x400) yüklemelisiniz.");
          return resolve(false);
        }
        if (type === 'banner' && img.width < 800) {
          alert("Uyarı: Arka plan (banner) resmi çok küçük. Genişliği en az 800 piksel olan yatay bir resim (Önerilen: 1500x500) yüklemelisiniz.");
          return resolve(false);
        }
        resolve(true);
      };
      img.onerror = () => {
        URL.revokeObjectURL(objectUrl);
        alert("Hata: Geçersiz veya bozuk resim dosyası.");
        resolve(false);
      };
      img.src = objectUrl;
    });
  };

  const uploadImage = async (file: File): Promise<string | null> => {
    try {
      const formData = new FormData();
      formData.append('file', file);
      const res = await fetch('http://localhost:3001/api/upload', {
        method: 'POST',
        body: formData
      });
      const data = await res.json();
      return data.url || null;
    } catch (err) {
      console.error(err);
      alert("Resim yüklenirken sunucu hatası oluştu.");
      return null;
    }
  };

  const { getRootProps: getBannerRootProps, getInputProps: getBannerInputProps, isDragActive: isBannerDragActive } = useDropzone({
    accept: { 'image/*': [] },
    multiple: false,
    onDrop: async (acceptedFiles) => {
      if (acceptedFiles?.[0]) {
        const isValid = await validateImage(acceptedFiles[0], 'banner');
        if (!isValid) return;
        const url = await uploadImage(acceptedFiles[0]);
        if (url) setEditBanner(url);
      }
    }
  });

  const { getRootProps: getAvatarRootProps, getInputProps: getAvatarInputProps, isDragActive: isAvatarDragActive } = useDropzone({
    accept: { 'image/*': [] },
    multiple: false,
    onDrop: async (acceptedFiles) => {
      if (acceptedFiles?.[0]) {
        const isValid = await validateImage(acceptedFiles[0], 'avatar');
        if (!isValid) return;
        const url = await uploadImage(acceptedFiles[0]);
        if (url) setEditImage(url);
      }
    }
  });
  
  // Experience Form States
  const [showAddExp, setShowAddExp] = useState(false);
  const [editingExpId, setEditingExpId] = useState<string | null>(null);
  const [expTitle, setExpTitle] = useState('');
  const [expCorp, setExpCorp] = useState('');
  const [expStartDate, setExpStartDate] = useState('');
  const [expEndDate, setExpEndDate] = useState('');
  const [expType, setExpType] = useState<'WORK' | 'INTERNSHIP'>('WORK');
  const [expLocType, setExpLocType] = useState<'REMOTE' | 'ONSITE' | 'HYBRID'>('ONSITE');
  const [expDesc, setExpDesc] = useState('');

  // Education Form States
  const [showAddEdu, setShowAddEdu] = useState(false);
  const [editingEduId, setEditingEduId] = useState<string | null>(null);
  const [eduInstName, setEduInstName] = useState('');
  const [eduDegree, setEduDegree] = useState('');
  const [eduStartDate, setEduStartDate] = useState('');
  const [eduEndDate, setEduEndDate] = useState('');
  const [eduProgram, setEduProgram] = useState('');
  const [eduDesc, setEduDesc] = useState('');

  // Certification Form States
  const [showAddCert, setShowAddCert] = useState(false);
  const [editingCertId, setEditingCertId] = useState<string | null>(null);
  const [certTitle, setCertTitle] = useState('');
  const [certOrg, setCertOrg] = useState('');
  const [certStartDate, setCertStartDate] = useState('');
  const [certEndDate, setCertEndDate] = useState('');
  const [certCompetencyId, setCertCompetencyId] = useState('');
  const [certCompetencyURL, setCertCompetencyURL] = useState('');

  // Fetch true profile data
  const { data: profile, isLoading } = trpc.profile.getByUserId.useQuery(
    { userId: userId || '' },
    { 
      enabled: !!userId,
      onSuccess: (data) => {
        if (data && !isEditing && session?.user) {
          setEditBio(data.bio || '');
          setEditLocation(data.location || '');
          setEditLinks(data.links || []);
          setEditBanner(data.banner || '');
          setEditName(session.user.name || '');
          setEditSurname((session.user as any).surname || '');
          setEditUsername((session.user as any).username || '');
          setEditImage(session.user.image || '');
        }
      }
    }
  );

  const { data: allSkills } = trpc.profile.getAllSkills.useQuery();

  const updateProfile = trpc.profile.update.useMutation({
    onSuccess: () => {
      utils.profile.getByUserId.invalidate({ userId: userId || '' });
      setIsEditing(false);
      window.location.reload(); // Oturum bilgisini (Better Auth) tazelemek için
    },
    onError: (err) => {
      alert("Profil güncellenirken hata oluştu: " + err.message);
    }
  });

  const addSkill = trpc.profile.addSkill.useMutation({
    onSuccess: () => {
      setSkillSearch('');
      utils.profile.getByUserId.invalidate({ userId: userId || '' });
      utils.profile.getAllSkills.invalidate(); // Incase a new skill was created
    }
  });

  const removeSkill = trpc.profile.removeSkill.useMutation({
    onSuccess: () => {
      utils.profile.getByUserId.invalidate({ userId: userId || '' });
    }
  });

  const addExpMut = trpc.profile.addExperience.useMutation({
    onSuccess: () => {
      setShowAddExp(false);
      resetExpForm();
      utils.profile.getByUserId.invalidate({ userId: userId || '' });
    },
    onError: (err) => alert("Hata: " + err.message)
  });

  const updateExpMut = trpc.profile.updateExperience.useMutation({
    onSuccess: () => {
      setShowAddExp(false);
      resetExpForm();
      utils.profile.getByUserId.invalidate({ userId: userId || '' });
    },
    onError: (err) => alert("Hata: " + err.message)
  });

  const removeExpMut = trpc.profile.removeExperience.useMutation({
    onSuccess: () => utils.profile.getByUserId.invalidate({ userId: userId || '' })
  });

  const addEduMut = trpc.profile.addEducation.useMutation({
    onSuccess: () => {
      setShowAddEdu(false);
      resetEduForm();
      utils.profile.getByUserId.invalidate({ userId: userId || '' });
    },
    onError: (err) => alert("Hata: " + err.message)
  });

  const updateEduMut = trpc.profile.updateEducation.useMutation({
    onSuccess: () => {
      setShowAddEdu(false);
      resetEduForm();
      utils.profile.getByUserId.invalidate({ userId: userId || '' });
    },
    onError: (err) => alert("Hata: " + err.message)
  });

  const removeEduMut = trpc.profile.removeEducation.useMutation({
    onSuccess: () => utils.profile.getByUserId.invalidate({ userId: userId || '' })
  });

  const addCertMut = trpc.profile.addCertificate.useMutation({
    onSuccess: () => {
      setShowAddCert(false);
      resetCertForm();
      utils.profile.getByUserId.invalidate({ userId: userId || '' });
    },
    onError: (err) => alert("Hata: " + err.message)
  });

  const updateCertMut = trpc.profile.updateCertificate.useMutation({
    onSuccess: () => {
      setShowAddCert(false);
      resetCertForm();
      utils.profile.getByUserId.invalidate({ userId: userId || '' });
    },
    onError: (err) => alert("Hata: " + err.message)
  });

  const removeCertMut = trpc.profile.removeCertificate.useMutation({
    onSuccess: () => utils.profile.getByUserId.invalidate({ userId: userId || '' })
  });

  if (isLoading || !session) {
    return <div className="p-10 text-center text-muted-foreground font-semibold">Profil Yükleniyor...</div>;
  }

  const handleSave = async () => {
    if (!userId) return;
    
    // Auth sistemindeki oturumu güncelleyelim (Böylece JWT / Cookie içindeki resim de güncellenir)
    if (editName !== session?.user?.name || editImage !== session?.user?.image || editUsername !== (session?.user as any)?.username) {
      await authClient.updateUser({
        name: editName,
        image: editImage,
        username: editUsername,
      } as any);
    }

    // Otomatik URL formatlama (http/https yoksa ekle)
    const formattedLinks = editLinks.map(link => {
      const trimmed = link.trim();
      if (trimmed && !trimmed.startsWith('http://') && !trimmed.startsWith('https://')) {
        return `https://${trimmed}`;
      }
      return trimmed;
    });

    updateProfile.mutate({
      userId,
      username: editUsername,
      name: editName,
      surname: editSurname,
      image: editImage,
      bio: editBio,
      location: editLocation,
      links: formattedLinks,
      banner: editBanner,
    });
  };

  const handleAddSkill = (skillName: string) => {
    if (!profile?.id || !skillName.trim()) return;
    addSkill.mutate({ profileId: profile.id, skillName: skillName.trim() });
  };

  const filteredSkills = allSkills?.filter(s => s.skillName.toLowerCase().includes(skillSearch.toLowerCase()) && !profile?.skills.find((ps: any) => ps.skill.skillName === s.skillName)) || [];

  const resetExpForm = () => {
    setEditingExpId(null);
    setExpTitle(''); setExpCorp(''); setExpStartDate(''); setExpEndDate(''); setExpDesc('');
  };

  const resetEduForm = () => {
    setEditingEduId(null);
    setEduInstName(''); setEduDegree(''); setEduStartDate(''); setEduEndDate(''); setEduProgram(''); setEduDesc('');
  };

  const resetCertForm = () => {
    setEditingCertId(null);
    setCertTitle(''); setCertOrg(''); setCertStartDate(''); setCertEndDate(''); setCertCompetencyId(''); setCertCompetencyURL('');
  };

  const handleSaveExp = () => {
    if (!profile?.id) return;
    if (!expTitle || !expCorp || !expStartDate) {
      alert("Lütfen Pozisyon, Şirket ve Başlangıç Tarihi alanlarını doldurun.");
      return;
    }
    const payload = {
      title: expTitle,
      corp: expCorp,
      type: expType,
      locType: expLocType,
      startDate: new Date(expStartDate),
      endDate: expEndDate ? new Date(expEndDate) : undefined,
      desc: expDesc,
    };
    
    if (editingExpId) {
      updateExpMut.mutate({ expId: editingExpId, ...payload });
    } else {
      addExpMut.mutate({ profileId: profile.id, ...payload });
    }
  };

  const handleEditExp = (exp: any) => {
    setEditingExpId(exp.expId);
    setShowAddExp(true);
    setExpTitle(exp.title);
    setExpCorp(exp.corp);
    setExpType(exp.type);
    setExpLocType(exp.locType || 'ONSITE');
    setExpStartDate(new Date(exp.startDate).toISOString().split('T')[0]);
    setExpEndDate(exp.endDate ? new Date(exp.endDate).toISOString().split('T')[0] : '');
    setExpDesc(exp.desc || '');
  };

  const handleSaveEdu = () => {
    if (!profile?.id) return;
    if (!eduInstName || !eduStartDate) {
      alert("Lütfen Okul/Kurum ve Başlangıç Tarihi alanlarını doldurun.");
      return;
    }
    const payload = {
      instName: eduInstName,
      instDegree: eduDegree,
      instProgram: eduProgram,
      startDate: new Date(eduStartDate),
      endDate: eduEndDate ? new Date(eduEndDate) : undefined,
      instDesc: eduDesc,
    };
    
    if (editingEduId) {
      updateEduMut.mutate({ eduId: editingEduId, ...payload });
    } else {
      addEduMut.mutate({ profileId: profile.id, ...payload });
    }
  };

  const handleEditEdu = (edu: any) => {
    setEditingEduId(edu.eduId);
    setShowAddEdu(true);
    setEduInstName(edu.instName);
    setEduDegree(edu.instDegree || '');
    setEduProgram(edu.instProgram || '');
    setEduStartDate(new Date(edu.startDate).toISOString().split('T')[0]);
    setEduEndDate(edu.endDate ? new Date(edu.endDate).toISOString().split('T')[0] : '');
    setEduDesc(edu.instDesc || '');
  };

  const handleSaveCert = () => {
    if (!profile?.id) return;
    if (!certTitle || !certOrg || !certStartDate) {
      alert("Lütfen Sertifika Adı, Veren Kurum ve Veriliş Tarihi alanlarını doldurun.");
      return;
    }
    
    // Check if URL is valid if provided
    let urlToSave = certCompetencyURL.trim();
    if (urlToSave && !urlToSave.startsWith('http://') && !urlToSave.startsWith('https://')) {
      urlToSave = `https://${urlToSave}`;
    }

    const payload = {
      profileId: profile.id,
      title: certTitle,
      org: certOrg,
      startDate: new Date(certStartDate),
      endDate: certEndDate ? new Date(certEndDate) : undefined,
      competencyId: certCompetencyId,
      competencyURL: urlToSave,
    };
    
    if (editingCertId) {
      updateCertMut.mutate({ cerId: editingCertId, ...payload });
    } else {
      addCertMut.mutate(payload);
    }
  };

  const handleEditCert = (cert: any) => {
    setEditingCertId(cert.cerId);
    setShowAddCert(true);
    setCertTitle(cert.title);
    setCertOrg(cert.org);
    setCertStartDate(new Date(cert.startDate).toISOString().split('T')[0]);
    setCertEndDate(cert.endDate ? new Date(cert.endDate).toISOString().split('T')[0] : '');
    setCertCompetencyId(cert.competencyId || '');
    setCertCompetencyURL(cert.competencyURL || '');
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-20 md:pb-0">
      {/* Profile Header */}
      <div className="bg-card rounded-2xl shadow-sm border border-border overflow-hidden">
        <div 
          {...(isEditing ? getBannerRootProps() : {})}
          className={`h-48 w-full relative bg-cover bg-center bg-no-repeat bg-gradient-to-r from-primary/80 to-primary ${isEditing ? 'cursor-pointer' : ''} ${isBannerDragActive ? 'border-4 border-dashed border-primary' : ''}`} 
          style={{ backgroundImage: (isEditing ? editBanner : profile?.banner) ? `url(${isEditing ? editBanner : profile?.banner})` : undefined }}
        >
          {isEditing && <input {...getBannerInputProps()} />}
          {isEditing && (
            <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity">
               <div className="bg-background/80 backdrop-blur px-4 py-2 rounded-lg flex items-center gap-2 font-medium">
                 <Camera className="w-5 h-5" />
                 <span>Resim Sürükle veya Tıkla</span>
               </div>
            </div>
          )}
        </div>
        <div className="px-6 sm:px-10 pb-8">
          <div className="flex flex-col sm:flex-row gap-6 sm:items-end">
            
            {/* Avatar */}
            <div 
               {...(isEditing ? getAvatarRootProps() : {})}
               className={`-mt-12 sm:-mt-16 w-28 h-28 sm:w-32 sm:h-32 rounded-full border-4 border-card bg-secondary overflow-hidden shadow-lg shrink-0 z-10 relative group ${isEditing ? 'cursor-pointer' : ''} ${isAvatarDragActive ? 'border-primary border-dashed' : ''}`}
            >
               <img src={(isEditing ? editImage : session.user?.image) || `https://api.dicebear.com/7.x/notionists/svg?seed=${session.user?.name}`} alt="My Profile" className="w-full h-full object-cover" />
               {isEditing && <input {...getAvatarInputProps()} />}
               {isEditing && (
                 <div className="absolute inset-0 bg-black/50 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity">
                    <div className="flex flex-col items-center">
                      <Camera className="w-6 h-6 text-white mb-1" />
                      <span className="text-white text-[10px] font-bold text-center leading-tight">Sürükle<br/>veya Seç</span>
                    </div>
                 </div>
               )}
            </div>
            
            {/* User Info */}
            <div className="flex-1 pt-2 sm:pt-4">
              {isEditing ? (
                <>
                  <div className="flex gap-2 mb-2">
                    <input type="text" value={editName} onChange={e => setEditName(e.target.value)} placeholder="Ad" className="bg-background border border-border rounded px-3 py-1.5 font-black text-xl w-32" />
                    <input type="text" value={editSurname} onChange={e => setEditSurname(e.target.value)} placeholder="Soyad" className="bg-background border border-border rounded px-3 py-1.5 font-black text-xl w-32" />
                  </div>
                  <div className="mb-2">
                    <div className="flex items-center text-muted-foreground bg-background border border-border rounded px-3 w-48 focus-within:ring-2 focus-within:ring-primary/50 transition-all">
                      <span className="text-sm font-medium pr-1 select-none">@</span>
                      <input type="text" value={editUsername} onChange={e => setEditUsername(e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, ''))} placeholder="kullanici_adi" className="bg-transparent py-1 text-sm font-bold w-full outline-none" />
                    </div>
                  </div>
                </>
              ) : (
                <>
                  <h1 className="text-2xl sm:text-3xl font-black text-foreground">{session.user?.name} {(session.user as any)?.surname}</h1>
                  <p className="text-primary font-bold text-sm mt-0.5">@{(session.user as any)?.username || `${name.toLowerCase()}${((session.user as any)?.surname || '').toLowerCase()}`}</p>
                </>
              )}
              <div className="flex items-center gap-2 mt-2 sm:mt-3 text-sm text-muted-foreground font-medium">
                <Mail className="w-4 h-4" /> {session.user?.email}
              </div>
              <div className="text-muted-foreground mt-2 font-medium text-base sm:text-lg">
                {isEditing ? (
                  <input 
                    type="text" 
                    value={editLocation} 
                    onChange={e => setEditLocation(e.target.value)} 
                    placeholder="Konum (örn. İstanbul)" 
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
                  <button onClick={() => { setIsEditing(false); resetExpForm(); resetEduForm(); resetCertForm(); setShowAddExp(false); setShowAddEdu(false); setShowAddCert(false); }} className="flex-1 sm:flex-none bg-secondary text-foreground px-6 py-2 rounded-lg font-bold hover:opacity-90">
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
                  setEditLinks(profile?.links || []);
                  setEditBanner(profile?.banner || '');
                  setEditName(session.user?.name || '');
                  setEditSurname((session.user as any)?.surname || '');
                  setEditUsername((session.user as any)?.username || '');
                  setEditImage(session.user?.image || '');
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
              <div className="relative">
                <input 
                  type="text" 
                  value={skillSearch} 
                  onChange={e => setSkillSearch(e.target.value)} 
                  placeholder="Yetenek ara..." 
                  className="w-full bg-background border border-border rounded-lg px-3 py-2 text-sm"
                  onKeyDown={e => {
                    if (e.key === 'Enter' && skillSearch.trim()) {
                      const exactMatch = filteredSkills.find(s => s.skillName.toLowerCase() === skillSearch.toLowerCase().trim());
                      if (exactMatch) {
                        handleAddSkill(exactMatch.skillName);
                      }
                    }
                  }}
                />
                {skillSearch && (
                  <div className="absolute top-full left-0 right-0 mt-1 bg-card border border-border rounded-lg shadow-lg z-20 max-h-48 overflow-y-auto">
                    {filteredSkills.map(s => (
                      <button 
                        key={s.skillId} 
                        onClick={() => handleAddSkill(s.skillName)}
                        className="w-full text-left px-3 py-2 text-sm hover:bg-secondary"
                      >
                        {s.skillName}
                      </button>
                    ))}
                    {filteredSkills.length === 0 && (
                      <div className="w-full text-left px-3 py-2 text-sm text-muted-foreground">
                        "{skillSearch}" bulunamadı. Lütfen listedeki yeteneklerden seçin.
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>
          
          <div className="bg-card rounded-2xl shadow-sm border border-border p-6">
            <h3 className="font-bold text-foreground mb-4">Linkler</h3>
            <div className="space-y-3">
              <div className="flex items-center gap-2 text-muted-foreground text-sm font-medium">
                <Mail className="w-4 h-4" /> {session.user?.email}
              </div>
              {isEditing ? (
                 <div className="space-y-2">
                   {editLinks.map((link, idx) => (
                     <div key={idx} className="flex items-center gap-2">
                        <Globe className="w-4 h-4 text-primary shrink-0" />
                        <input 
                          type="url" 
                          value={link} 
                          onChange={e => {
                            const newLinks = [...editLinks];
                            newLinks[idx] = e.target.value;
                            setEditLinks(newLinks);
                          }} 
                          placeholder="https://website.com" 
                          className="bg-background border border-border rounded px-2 py-1 flex-1 min-w-0 text-foreground font-normal text-sm"
                        />
                        <button onClick={() => setEditLinks(editLinks.filter((_, i) => i !== idx))} className="text-destructive hover:bg-destructive/10 p-1 rounded">
                          <X className="w-4 h-4" />
                        </button>
                     </div>
                   ))}
                   <button onClick={() => setEditLinks([...editLinks, ''])} className="text-xs text-primary font-bold flex items-center gap-1 mt-2 hover:underline">
                     <Plus className="w-3 h-3" /> Link Ekle
                   </button>
                 </div>
              ) : (
                profile?.links && profile.links.length > 0 && (
                  <div className="space-y-2">
                    {profile.links.map((link: string, idx: number) => (
                      <a key={idx} href={link} target="_blank" rel="noreferrer" className="flex items-center gap-2 text-primary hover:underline text-sm font-medium break-all">
                        <Globe className="w-4 h-4 shrink-0" /> {link}
                      </a>
                    ))}
                  </div>
                )
              )}
            </div>
          </div>
        </div>

        {/* Right Column: Experience & Edu */}
        <div className="md:col-span-2 space-y-6">
          {/* EXPERIENCES */}
          <div className="bg-card rounded-2xl shadow-sm border border-border p-6">
            <div className="flex items-center justify-between mb-6">
              <h3 className="font-bold text-foreground text-xl flex items-center gap-2">
                <Briefcase className="w-5 h-5 text-primary" /> Deneyimler
              </h3>
              {isEditing && (
                <button onClick={() => {
                  if (showAddExp) {
                    setShowAddExp(false);
                    resetExpForm();
                  } else {
                    setShowAddExp(true);
                  }
                }} className="text-primary hover:bg-secondary p-1.5 rounded-lg transition-colors">
                  {showAddExp ? <X className="w-5 h-5" /> : <Plus className="w-5 h-5" />}
                </button>
              )}
            </div>

            {/* Add Exp Form */}
            {isEditing && showAddExp && (
              <div className="mb-6 p-4 border border-primary/30 bg-primary/5 rounded-xl space-y-3 shadow-inner">
                <input type="text" placeholder="Pozisyon" value={expTitle} onChange={e => setExpTitle(e.target.value)} className="w-full bg-background border border-border rounded px-3 py-2 text-sm" />
                <input type="text" placeholder="Şirket" value={expCorp} onChange={e => setExpCorp(e.target.value)} className="w-full bg-background border border-border rounded px-3 py-2 text-sm" />
                <div className="flex gap-3">
                  <select value={expType} onChange={e => setExpType(e.target.value as any)} className="bg-background border border-border rounded px-3 py-2 text-sm flex-1">
                    <option value="WORK">Tam Zamanlı</option>
                    <option value="INTERNSHIP">Staj</option>
                  </select>
                  <select value={expLocType} onChange={e => setExpLocType(e.target.value as any)} className="bg-background border border-border rounded px-3 py-2 text-sm flex-1">
                    <option value="ONSITE">Ofis</option>
                    <option value="REMOTE">Uzaktan</option>
                    <option value="HYBRID">Hibrit</option>
                  </select>
                </div>
                <div className="flex gap-3">
                   <div className="flex-1">
                     <label className="text-xs text-muted-foreground">Başlangıç</label>
                     <input type="date" max={today} value={expStartDate} onChange={e => setExpStartDate(e.target.value)} className="w-full bg-background border border-border rounded px-3 py-2 text-sm" />
                   </div>
                   <div className="flex-1">
                     <label className="text-xs text-muted-foreground">Bitiş (Boş ise devam ediyor)</label>
                     <input type="date" max={today} value={expEndDate} onChange={e => setExpEndDate(e.target.value)} className="w-full bg-background border border-border rounded px-3 py-2 text-sm" />
                   </div>
                </div>
                <textarea placeholder="Açıklama..." value={expDesc} onChange={e => setExpDesc(e.target.value)} className="w-full bg-background border border-border rounded px-3 py-2 text-sm h-20" />
                <button 
                  onClick={handleSaveExp} 
                  disabled={addExpMut.isLoading || updateExpMut.isLoading || !expTitle || !expCorp || !expStartDate} 
                  className="w-full bg-primary text-primary-foreground py-2 rounded font-bold hover:opacity-90 disabled:opacity-50"
                >
                  {editingExpId ? 'Değişiklikleri Kaydet' : 'Deneyim Ekle'}
                </button>
              </div>
            )}

            <div className="space-y-6">
              {profile?.experiences && profile.experiences.length > 0 ? (
                profile.experiences.map((exp: any) => (
                  <div key={exp.expId} className={`relative pl-6 border-l-2 border-border group ${editingExpId === exp.expId ? 'opacity-50' : ''}`}>
                    <div className="absolute w-3 h-3 bg-primary rounded-full -left-[7.5px] top-1.5 ring-4 ring-background" />
                    <div className="flex justify-between items-start">
                      <div>
                        <h4 className="font-bold text-foreground text-lg">{exp.title}</h4>
                        <p className="text-primary font-medium">{exp.corp} <span className="text-muted-foreground text-sm font-normal">• {exp.type === 'WORK' ? 'Tam Zamanlı' : 'Staj'} • {exp.locType === 'REMOTE' ? 'Uzaktan' : exp.locType === 'HYBRID' ? 'Hibrit' : 'Ofis'}</span></p>
                        <p className="text-sm text-muted-foreground mt-1 mb-2">
                          {formatDate(exp.startDate)} - {exp.endDate ? formatDate(exp.endDate) : 'Devam Ediyor'}
                        </p>
                      </div>
                      {isEditing && (
                        <div className="flex gap-1 opacity-50 hover:opacity-100 transition-opacity">
                          <button onClick={() => handleEditExp(exp)} className="text-primary hover:bg-primary/10 p-1.5 rounded">
                            <Edit2 className="w-4 h-4" />
                          </button>
                          <button onClick={() => removeExpMut.mutate({ expId: exp.expId })} className="text-destructive hover:bg-destructive/10 p-1.5 rounded">
                            <X className="w-4 h-4" />
                          </button>
                        </div>
                      )}
                    </div>
                    {exp.desc && <p className="text-foreground leading-relaxed text-sm whitespace-pre-wrap mt-2">{exp.desc}</p>}
                  </div>
                ))
              ) : (
                <p className="text-muted-foreground text-sm italic">Henüz bir deneyim eklenmemiş.</p>
              )}
            </div>
          </div>
          
          {/* EDUCATIONS */}
          <div className="bg-card rounded-2xl shadow-sm border border-border p-6">
            <div className="flex items-center justify-between mb-6">
              <h3 className="font-bold text-foreground text-xl flex items-center gap-2">
                <GraduationCap className="w-5 h-5 text-primary" /> Eğitim
              </h3>
              {isEditing && (
                <button onClick={() => {
                  if (showAddEdu) {
                    setShowAddEdu(false);
                    resetEduForm();
                  } else {
                    setShowAddEdu(true);
                  }
                }} className="text-primary hover:bg-secondary p-1.5 rounded-lg transition-colors">
                  {showAddEdu ? <X className="w-5 h-5" /> : <Plus className="w-5 h-5" />}
                </button>
              )}
            </div>

            {/* Add Edu Form */}
            {isEditing && showAddEdu && (
              <div className="mb-6 p-4 border border-primary/30 bg-primary/5 rounded-xl space-y-3 shadow-inner">
                <input type="text" placeholder="Okul / Kurum" value={eduInstName} onChange={e => setEduInstName(e.target.value)} className="w-full bg-background border border-border rounded px-3 py-2 text-sm" />
                <div className="flex gap-3">
                  <input type="text" placeholder="Derece (örn. Lisans)" value={eduDegree} onChange={e => setEduDegree(e.target.value)} className="flex-1 bg-background border border-border rounded px-3 py-2 text-sm" />
                  <input type="text" placeholder="Bölüm" value={eduProgram} onChange={e => setEduProgram(e.target.value)} className="flex-1 bg-background border border-border rounded px-3 py-2 text-sm" />
                </div>
                <div className="flex gap-3">
                   <div className="flex-1">
                     <label className="text-xs text-muted-foreground">Başlangıç</label>
                     <input type="date" max={today} value={eduStartDate} onChange={e => setEduStartDate(e.target.value)} className="w-full bg-background border border-border rounded px-3 py-2 text-sm" />
                   </div>
                   <div className="flex-1">
                     <label className="text-xs text-muted-foreground">Bitiş (Boş ise devam ediyor)</label>
                     <input type="date" max={today} value={eduEndDate} onChange={e => setEduEndDate(e.target.value)} className="w-full bg-background border border-border rounded px-3 py-2 text-sm" />
                   </div>
                </div>
                <textarea placeholder="Açıklama (Projeler, başarılar)..." value={eduDesc} onChange={e => setEduDesc(e.target.value)} className="w-full bg-background border border-border rounded px-3 py-2 text-sm h-20" />
                <button 
                  onClick={handleSaveEdu} 
                  disabled={addEduMut.isLoading || updateEduMut.isLoading || !eduInstName || !eduStartDate} 
                  className="w-full bg-primary text-primary-foreground py-2 rounded font-bold hover:opacity-90 disabled:opacity-50"
                >
                  {editingEduId ? 'Değişiklikleri Kaydet' : 'Eğitim Ekle'}
                </button>
              </div>
            )}

            <div className="space-y-6">
              {profile?.educations && profile.educations.length > 0 ? (
                profile.educations.map((edu: any) => (
                  <div key={edu.eduId} className={`relative pl-6 border-l-2 border-border group ${editingEduId === edu.eduId ? 'opacity-50' : ''}`}>
                    <div className="absolute w-3 h-3 bg-primary rounded-full -left-[7.5px] top-1.5 ring-4 ring-background" />
                    <div className="flex justify-between items-start">
                      <div>
                        <h4 className="font-bold text-foreground text-lg">{edu.instName}</h4>
                        <p className="text-primary font-medium">{edu.instDegree} {edu.instProgram && `- ${edu.instProgram}`}</p>
                        <p className="text-sm text-muted-foreground mt-1 mb-2">
                          {formatDate(edu.startDate)} - {edu.endDate ? formatDate(edu.endDate) : 'Devam Ediyor'}
                        </p>
                      </div>
                      {isEditing && (
                        <div className="flex gap-1 opacity-50 hover:opacity-100 transition-opacity">
                          <button onClick={() => handleEditEdu(edu)} className="text-primary hover:bg-primary/10 p-1.5 rounded">
                            <Edit2 className="w-4 h-4" />
                          </button>
                          <button onClick={() => removeEduMut.mutate({ eduId: edu.eduId })} className="text-destructive hover:bg-destructive/10 p-1.5 rounded">
                            <X className="w-4 h-4" />
                          </button>
                        </div>
                      )}
                    </div>
                    {edu.instDesc && <p className="text-foreground leading-relaxed text-sm whitespace-pre-wrap mt-2">{edu.instDesc}</p>}
                  </div>
                ))
              ) : (
                <p className="text-muted-foreground text-sm italic">Henüz bir eğitim eklenmemiş.</p>
              )}
            </div>
          </div>
          
          {/* CERTIFICATIONS */}
          <div className="bg-card rounded-2xl shadow-sm border border-border p-6">
            <div className="flex items-center justify-between mb-6">
              <h3 className="font-bold text-foreground text-xl flex items-center gap-2">
                <Award className="w-5 h-5 text-primary" /> Sertifikalar
              </h3>
              {isEditing && (
                <button onClick={() => {
                  if (showAddCert) {
                    setShowAddCert(false);
                    resetCertForm();
                  } else {
                    setShowAddCert(true);
                  }
                }} className="text-primary hover:bg-secondary p-1.5 rounded-lg transition-colors">
                  {showAddCert ? <X className="w-5 h-5" /> : <Plus className="w-5 h-5" />}
                </button>
              )}
            </div>

            {/* Add Cert Form */}
            {isEditing && showAddCert && (
              <div className="mb-6 p-4 border border-primary/30 bg-primary/5 rounded-xl space-y-3 shadow-inner">
                <input type="text" placeholder="Sertifika / Başarı Adı" value={certTitle} onChange={e => setCertTitle(e.target.value)} className="w-full bg-background border border-border rounded px-3 py-2 text-sm" />
                <input type="text" placeholder="Veren Kurum (örn. Google, Udemy)" value={certOrg} onChange={e => setCertOrg(e.target.value)} className="w-full bg-background border border-border rounded px-3 py-2 text-sm" />
                <div className="flex gap-3">
                   <div className="flex-1">
                     <label className="text-xs text-muted-foreground">Veriliş Tarihi</label>
                     <input type="date" max={today} value={certStartDate} onChange={e => setCertStartDate(e.target.value)} className="w-full bg-background border border-border rounded px-3 py-2 text-sm" />
                   </div>
                   <div className="flex-1">
                     <label className="text-xs text-muted-foreground">Geçerlilik (Süresiz ise boş bırakın)</label>
                     <input type="date" value={certEndDate} onChange={e => setCertEndDate(e.target.value)} className="w-full bg-background border border-border rounded px-3 py-2 text-sm" />
                   </div>
                </div>
                <div className="flex gap-3">
                  <input type="text" placeholder="Sertifika ID (İsteğe Bağlı)" value={certCompetencyId} onChange={e => setCertCompetencyId(e.target.value)} className="flex-1 bg-background border border-border rounded px-3 py-2 text-sm" />
                  <input type="text" placeholder="Doğrulama Linki (URL)" value={certCompetencyURL} onChange={e => setCertCompetencyURL(e.target.value)} className="flex-1 bg-background border border-border rounded px-3 py-2 text-sm" />
                </div>
                <button 
                  onClick={handleSaveCert} 
                  disabled={addCertMut.isLoading || updateCertMut.isLoading || !certTitle || !certOrg || !certStartDate} 
                  className="w-full bg-primary text-primary-foreground py-2 rounded font-bold hover:opacity-90 disabled:opacity-50"
                >
                  {editingCertId ? 'Değişiklikleri Kaydet' : 'Sertifika Ekle'}
                </button>
              </div>
            )}

            <div className="space-y-6">
              {profile?.certificates && profile.certificates.length > 0 ? (
                profile.certificates.map((cert: any) => (
                  <div key={cert.cerId} className={`relative pl-6 border-l-2 border-border group ${editingCertId === cert.cerId ? 'opacity-50' : ''}`}>
                    <div className="absolute w-3 h-3 bg-primary rounded-full -left-[7.5px] top-1.5 ring-4 ring-background" />
                    <div className="flex justify-between items-start">
                      <div>
                        <h4 className="font-bold text-foreground text-lg">{cert.title}</h4>
                        <p className="text-primary font-medium">{cert.org}</p>
                        <p className="text-sm text-muted-foreground mt-1 mb-2">
                          Veriliş: {formatDate(cert.startDate)} 
                          {cert.endDate ? ` • Geçerlilik: ${formatDate(cert.endDate)}` : ' • Süresiz'}
                        </p>
                        {(cert.competencyId || cert.competencyURL) && (
                          <div className="mt-2 text-sm flex flex-col gap-1">
                            {cert.competencyId && <span className="text-muted-foreground">ID: {cert.competencyId}</span>}
                            {cert.competencyURL && (
                              <a href={cert.competencyURL} target="_blank" rel="noreferrer" className="text-primary hover:underline font-medium inline-flex items-center gap-1">
                                Doğrulama Bağlantısı <ExternalLink className="w-3 h-3" />
                              </a>
                            )}
                          </div>
                        )}
                      </div>
                      {isEditing && (
                        <div className="flex gap-1 opacity-50 hover:opacity-100 transition-opacity">
                          <button onClick={() => handleEditCert(cert)} className="text-primary hover:bg-primary/10 p-1.5 rounded">
                            <Edit2 className="w-4 h-4" />
                          </button>
                          <button onClick={() => removeCertMut.mutate({ cerId: cert.cerId })} className="text-destructive hover:bg-destructive/10 p-1.5 rounded">
                            <X className="w-4 h-4" />
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-muted-foreground text-sm italic">Henüz bir sertifika eklenmemiş.</p>
              )}
            </div>
          </div>
          
        </div>
      </div>
    </div>
  );
}
