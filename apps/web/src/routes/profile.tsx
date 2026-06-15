import { useState } from 'react';
import { Link, useNavigate } from '@tanstack/react-router';
import { createFileRoute } from '@tanstack/react-router';
import { Mail, Briefcase, GraduationCap, LinkIcon, Edit2, Plus, X, Globe, Camera, Award, ExternalLink, UserPlus, UserCheck, Users, Check, Clock as ClockIcon, FileWarning, LogOut, Trash2 } from 'lucide-react';
import { useDropzone } from 'react-dropzone';
import { useSession, authClient } from '@collabswipe/auth/client';
import { trpc } from '@/lib/trpc';
import toast from 'react-hot-toast';
import { ReportModal } from '@/components/ReportModal';
import { Country, State } from 'country-state-city';

export const Route = createFileRoute('/profile')({
  validateSearch: (search: Record<string, unknown>): { userId?: string } => {
    return {
      userId: search.userId as string | undefined,
    };
  },
  component: ProfilePage,
});

const formatDate = (dateString: string | Date) => {
  const date = new Date(dateString);
  return date.toLocaleDateString('tr-TR', { year: 'numeric', month: 'long' });
};

function ProfilePage() {
  const search = Route.useSearch();
  const { data: session } = useSession();
  const navigate = useNavigate();
  
  const loggedInUserId = session?.user?.id;
  const userId = search.userId || loggedInUserId;
  const isOwnProfile = !search.userId || search.userId === loggedInUserId;
  const utils = trpc.useUtils();

  const today = new Date().toISOString().split('T')[0];

  const [isEditing, setIsEditing] = useState(false);
  const [reportModalOpen, setReportModalOpen] = useState(false);
  const [reportTarget, setReportTarget] = useState<{ type: 'USER', id: string } | null>(null);
  
  const [editName, setEditName] = useState('');
  const [editSurname, setEditSurname] = useState('');
  const [editBio, setEditBio] = useState('');
  const [editLocation, setEditLocation] = useState('');
  const [editCountryCode, setEditCountryCode] = useState('');
  const [editCityName, setEditCityName] = useState('');
  const [editLinks, setEditLinks] = useState<string[]>([]);
  const [editImage, setEditImage] = useState('');
  const [editBanner, setEditBanner] = useState('');
  const [editIsPrivate, setEditIsPrivate] = useState(false);
  
  // Skills
  const [skillSearch, setSkillSearch] = useState('');
  const [isSkillFocused, setIsSkillFocused] = useState(false);
  
  // Image Compression Utility
  const compressImage = async (file: File): Promise<File> => {
    return new Promise((resolve) => {
      // 1MB altındaysa sıkıştırma yapma
      if (file.size < 1024 * 1024) return resolve(file);

      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = (event) => {
        const img = new Image();
        img.src = event.target?.result as string;
        img.onload = () => {
          const canvas = document.createElement('canvas');
          const MAX_WIDTH = 1500;
          const MAX_HEIGHT = 1500;
          let width = img.width;
          let height = img.height;

          if (width > height) {
            if (width > MAX_WIDTH) {
              height *= MAX_WIDTH / width;
              width = MAX_WIDTH;
            }
          } else {
            if (height > MAX_HEIGHT) {
              width *= MAX_HEIGHT / height;
              height = MAX_HEIGHT;
            }
          }

          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');
          ctx?.drawImage(img, 0, 0, width, height);

          canvas.toBlob((blob) => {
            if (blob) {
              const newFile = new File([blob], file.name.replace(/\.[^/.]+$/, "") + ".jpg", {
                type: 'image/jpeg',
                lastModified: Date.now(),
              });
              resolve(newFile);
            } else {
              resolve(file);
            }
          }, 'image/jpeg', 0.85); // %85 kalite
        };
        img.onerror = () => resolve(file);
      };
      reader.onerror = () => resolve(file);
    });
  };

  // Image Upload Logic
  const validateImage = (file: File, type: 'avatar' | 'banner'): Promise<boolean> => {
    return new Promise((resolve) => {
      if (file.size > 5 * 1024 * 1024) {
        toast.error("Hata: Dosya boyutu çok büyük. Lütfen en fazla 5MB boyutunda bir resim seçin.");
        return resolve(false);
      }
      const img = new Image();
      const objectUrl = URL.createObjectURL(file);
      img.onload = () => {
        URL.revokeObjectURL(objectUrl);
        if (type === 'avatar' && (img.width < 200 || img.height < 200)) {
          toast.error("Uyarı: Profil fotoğrafı kalitesi çok düşük. En az 200x200 piksel boyutunda kare bir resim (Önerilen: 400x400) yüklemelisiniz.");
          return resolve(false);
        }
        if (type === 'banner' && img.width < 800) {
          toast.error("Uyarı: Arka plan (banner) resmi çok küçük. Genişliği en az 800 piksel olan yatay bir resim (Önerilen: 1500x500) yüklemelisiniz.");
          return resolve(false);
        }
        resolve(true);
      };
      img.onerror = () => {
        URL.revokeObjectURL(objectUrl);
        toast.error("Hata: Geçersiz veya bozuk resim dosyası.");
        resolve(false);
      };
      img.src = objectUrl;
    });
  };

  const uploadImage = async (file: File): Promise<string | null> => {
    try {
      const formData = new FormData();
      formData.append('file', file);
      let apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:3001';
      if (typeof window !== 'undefined' && window.location.hostname !== 'localhost' && !window.location.hostname.includes('192.168.')) {
        apiUrl = window.location.origin;
      }
      if (apiUrl.endsWith('/')) apiUrl = apiUrl.slice(0, -1);
      const res = await fetch(`${apiUrl}/api/upload`, {
        method: 'POST',
        body: formData
      });
      const data = await res.json();
      return data.url || null;
    } catch (err) {
      console.error(err);
      toast.error("Resim yüklenirken sunucu hatası oluştu.");
      return null;
    }
  };

  const { getRootProps: getBannerRootProps, getInputProps: getBannerInputProps, isDragActive: isBannerDragActive } = useDropzone({
    accept: { 'image/*': [] },
    multiple: false,
    onDrop: async (acceptedFiles) => {
      if (acceptedFiles?.[0]) {
        toast.success("Fotoğraf hazırlanıyor...");
        const compressedFile = await compressImage(acceptedFiles[0]);
        const isValid = await validateImage(compressedFile, 'banner');
        if (!isValid) return;
        const url = await uploadImage(compressedFile);
        if (url) setEditBanner(url);
      }
    }
  });

  const { getRootProps: getAvatarRootProps, getInputProps: getAvatarInputProps, isDragActive: isAvatarDragActive } = useDropzone({
    accept: { 'image/*': [] },
    multiple: false,
    onDrop: async (acceptedFiles) => {
      if (acceptedFiles?.[0]) {
        toast.success("Fotoğraf hazırlanıyor...");
        const compressedFile = await compressImage(acceptedFiles[0]);
        const isValid = await validateImage(compressedFile, 'avatar');
        if (!isValid) return;
        const url = await uploadImage(compressedFile);
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

  // Devam Ediyor States
  const [expIsCurrent, setExpIsCurrent] = useState(true);
  const [eduIsCurrent, setEduIsCurrent] = useState(true);
  const [certIsCurrent, setCertIsCurrent] = useState(true);

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
          setEditName(data.user?.name || session.user.name || '');
          setEditSurname((data.user as any)?.surname || (session.user as any).surname || '');
          setEditImage(data.user?.image || session.user.image || '');
          setEditIsPrivate(data.isPrivate || false);
        }
      }
    }
  );

  const isCompany = isOwnProfile 
    ? ((session?.user as any)?.role === 'company' || (session?.user as any)?.email === 'collabswipe@collabswipe.com') 
    : ((profile?.user as any)?.role === 'company' || (profile?.user as any)?.email === 'collabswipe@collabswipe.com');

  const { data: allSkills } = trpc.profile.getAllSkills.useQuery();
  const { data: myJobs } = trpc.job.getMyPostings.useQuery(undefined, {
    enabled: !!isCompany,
  });

  const { data: connectionData } = trpc.connection.status.useQuery(
    { loggedInUserId: loggedInUserId || '', targetUserId: userId || '' },
    { enabled: !isOwnProfile && !!loggedInUserId && !!userId }
  );

  const isAdmin = (session?.user as any)?.email === 'collabswipe@collabswipe.com';

  const deleteUserMut = trpc.admin.deleteUser.useMutation({
    onSuccess: () => {
      toast.success('Kullanıcı başarıyla silindi.');
      navigate({ to: '/discover' });
    },
    onError: (err) => toast.error('Hata: ' + err.message)
  });

  const followMutation = trpc.connection.follow.useMutation({
    onSuccess: () => {
      utils.connection.status.invalidate();
      toast.success('Takip isteği gönderildi');
    },
    onError: (err) => toast.error('Hata: ' + err.message)
  });
  const unfollowMutation = trpc.connection.unfollow.useMutation({
    onSuccess: () => {
      utils.connection.status.invalidate();
      toast.success('Takipten çıkıldı');
    },
    onError: (err) => toast.error('Hata: ' + err.message)
  });
  const connectMutation = trpc.connection.sendRequest.useMutation({
    onSuccess: () => {
      utils.connection.status.invalidate();
      toast.success('Bağlantı isteği gönderildi');
    },
    onError: (err) => {
      toast.error('Bağlantı isteği gönderilemedi: ' + err.message);
    }
  });

  const updateProfile = trpc.profile.update.useMutation({
    onSuccess: () => {
      utils.profile.getByUserId.invalidate({ userId: userId || '' });
      setIsEditing(false);
      window.location.reload(); // Oturum bilgisini (Better Auth) tazelemek için
    },
    onError: (err) => {
      try {
        const parsed = JSON.parse(err.message);
        if (Array.isArray(parsed) && parsed[0]?.message) {
          toast.error(parsed[0].message);
          return;
        }
      } catch (e) {
        // Not JSON
      }
      toast.error("Profil güncellenirken hata oluştu: " + err.message);
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
    onError: (err) => toast.error("Hata: " + err.message)
  });

  const updateExpMut = trpc.profile.updateExperience.useMutation({
    onSuccess: () => {
      setShowAddExp(false);
      resetExpForm();
      utils.profile.getByUserId.invalidate({ userId: userId || '' });
    },
    onError: (err) => toast.error("Hata: " + err.message)
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
    onError: (err) => toast.error("Hata: " + err.message)
  });

  const updateEduMut = trpc.profile.updateEducation.useMutation({
    onSuccess: () => {
      setShowAddEdu(false);
      resetEduForm();
      utils.profile.getByUserId.invalidate({ userId: userId || '' });
    },
    onError: (err) => toast.error("Hata: " + err.message)
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
    onError: (err) => toast.error("Hata: " + err.message)
  });

  const updateCertMut = trpc.profile.updateCertificate.useMutation({
    onSuccess: () => {
      setShowAddCert(false);
      resetCertForm();
      utils.profile.getByUserId.invalidate({ userId: userId || '' });
    },
    onError: (err) => toast.error("Hata: " + err.message)
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
    if (editName !== session?.user?.name || editImage !== session?.user?.image || editSurname !== (session?.user as any)?.surname) {
      await authClient.updateUser({
        name: editName,
        image: editImage,
        surname: editSurname,
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

    let finalLoc = editLocation;
    if (editCountryCode) {
      const cName = Country.getCountryByCode(editCountryCode)?.name || '';
      if (editCityName && cName) finalLoc = `${editCityName}, ${cName}`;
      else if (cName) finalLoc = cName;
    }

    updateProfile.mutate({
      userId,
      name: editName,
      surname: editSurname,
      image: editImage,
      bio: editBio,
      location: finalLoc,
      links: formattedLinks,
      banner: editBanner,
      isPrivate: editIsPrivate,
    });
  };

  const handleAddSkill = (skillName: string) => {
    if (!profile?.id || !skillName.trim()) return;
    addSkill.mutate({ profileId: profile.id, skillName: skillName.trim() }, {
      onSuccess: () => setSkillSearch('')
    });
  };

  const POPULAR_SKILLS = [
    "React", "Node.js", "TypeScript", "Python", "UI/UX Tasarımı", "Figma", 
    "Pazarlama", "Proje Yönetimi", "Yapay Zeka (AI)", "SQL", "İletişim", "Liderlik",
    "Java", "C++", "C#", "Go", "Rust", "Ruby", "PHP", "Swift", "Kotlin", "React Native",
    "Flutter", "Vue.js", "Angular", "Svelte", "Tailwind CSS", "SASS", "MongoDB",
    "PostgreSQL", "MySQL", "Redis", "Docker", "Kubernetes", "AWS", "Google Cloud", 
    "Azure", "Linux", "Makine Öğrenimi", "Veri Bilimi", "Veri Analizi", "Excel",
    "Dijital Pazarlama", "SEO", "Sosyal Medya Yönetimi", "İçerik Üretimi", 
    "Satış", "İnsan Kaynakları", "Agile", "Scrum", "Problem Çözme", "Zaman Yönetimi",
    "İngilizce", "Almanca", "Adobe Photoshop", "Adobe Illustrator", "Video Kurgu"
  ];

  const filteredSkills = allSkills?.filter(s => s.skillName.toLowerCase().includes(skillSearch.toLowerCase()) && !profile?.skills.find((ps: any) => ps.skill.skillName === s.skillName)) || [];
  
  let suggestedSkills: string[] = [];
  if (!skillSearch) {
    suggestedSkills = POPULAR_SKILLS.filter(ps => !profile?.skills.find((s: any) => s.skill.skillName === ps));
  }

  const resetExpForm = () => {
    setEditingExpId(null);
    setExpTitle(''); setExpCorp(''); setExpStartDate(''); setExpEndDate(''); setExpDesc(''); setExpIsCurrent(true);
  };

  const resetEduForm = () => {
    setEditingEduId(null);
    setEduInstName(''); setEduDegree(''); setEduStartDate(''); setEduEndDate(''); setEduProgram(''); setEduDesc(''); setEduIsCurrent(true);
  };

  const resetCertForm = () => {
    setEditingCertId(null);
    setCertTitle(''); setCertOrg(''); setCertStartDate(''); setCertEndDate(''); setCertCompetencyId(''); setCertCompetencyURL(''); setCertIsCurrent(true);
  };

  const handleSaveExp = () => {
    if (!profile?.id) return;
    if (!expTitle || !expCorp || !expStartDate) {
      toast.error("Lütfen Pozisyon, Şirket ve Başlangıç Tarihi alanlarını doldurun.");
      return;
    }
    const payload = {
      title: expTitle,
      corp: expCorp,
      type: expType,
      locType: expLocType,
      startDate: new Date(expStartDate),
      endDate: expIsCurrent ? undefined : (expEndDate ? new Date(expEndDate) : undefined),
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
    if (exp.endDate) {
      setExpEndDate(new Date(exp.endDate).toISOString().split('T')[0]);
      setExpIsCurrent(false);
    } else {
      setExpEndDate('');
      setExpIsCurrent(true);
    }
    setExpDesc(exp.desc || '');
  };

  const handleSaveEdu = () => {
    if (!profile?.id) return;
    if (!eduInstName || !eduStartDate) {
      toast.error("Lütfen Okul/Kurum ve Başlangıç Tarihi alanlarını doldurun.");
      return;
    }
    const payload = {
      instName: eduInstName,
      instDegree: eduDegree,
      instProgram: eduProgram,
      startDate: new Date(eduStartDate),
      endDate: eduIsCurrent ? undefined : (eduEndDate ? new Date(eduEndDate) : undefined),
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
    if (edu.endDate) {
      setEduEndDate(new Date(edu.endDate).toISOString().split('T')[0]);
      setEduIsCurrent(false);
    } else {
      setEduEndDate('');
      setEduIsCurrent(true);
    }
    setEduDesc(edu.instDesc || '');
  };

  const handleSaveCert = () => {
    if (!profile?.id) return;
    if (!certTitle || !certOrg || !certStartDate) {
      toast.error("Lütfen Sertifika Adı, Veren Kurum ve Veriliş Tarihi alanlarını doldurun.");
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
      endDate: certIsCurrent ? undefined : (certEndDate ? new Date(certEndDate) : undefined),
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
    if (cert.endDate) {
      setCertEndDate(new Date(cert.endDate).toISOString().split('T')[0]);
      setCertIsCurrent(false);
    } else {
      setCertEndDate('');
      setCertIsCurrent(true);
    }
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
               <img src={(isEditing ? editImage : (isOwnProfile ? session?.user?.image : profile?.user?.image)) || ((isOwnProfile ? session?.user : profile?.user)?.role === 'company' ? `https://ui-avatars.com/api/?name=%F0%9F%92%BC&background=e2e8f0&color=94a3b8&size=1024` : 'https://www.gravatar.com/avatar/00000000000000000000000000000000?d=mp&f=y&s=1024')} alt="User Profile" className="w-full h-full object-cover" />
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
                    <input type="text" value={editName} onChange={e => setEditName(e.target.value)} placeholder={isCompany ? "Şirket Adı" : "Ad"} className="bg-background border border-border rounded px-3 py-1.5 font-black text-xl w-32" />
                    {!isCompany && (
                      <input type="text" value={editSurname} onChange={e => setEditSurname(e.target.value)} placeholder="Soyad" className="bg-background border border-border rounded px-3 py-1.5 font-black text-xl w-32" />
                    )}
                  </div>
                  <div className="mb-2 flex items-center gap-2 mt-3">
                    <input 
                      type="checkbox" 
                      id="privateProfile" 
                      checked={editIsPrivate} 
                      onChange={(e) => setEditIsPrivate(e.target.checked)}
                      className="w-4 h-4 text-primary rounded border-border focus:ring-primary"
                    />
                    <label htmlFor="privateProfile" className="text-sm font-medium text-foreground cursor-pointer flex items-center gap-1.5">
                      Gizli Hesap Yap <span className="text-xs text-muted-foreground font-normal">(Takip istekleri onaya düşer)</span>
                    </label>
                  </div>
                </>
              ) : (
                <>
                  <h1 className="text-2xl sm:text-3xl font-black text-foreground">
                    {profile?.user?.name} {!isCompany && profile?.user?.surname}
                  </h1>
                </>
              )}
              {isOwnProfile && (
                <div className="flex items-center gap-2 mt-2 sm:mt-3 text-sm text-muted-foreground font-medium">
                  <Mail className="w-4 h-4" /> {session?.user?.email}
                </div>
              )}
              <div className="text-muted-foreground mt-2 font-medium text-base sm:text-lg">
                {isEditing ? (
                  <div className="flex flex-col sm:flex-row gap-2 max-w-sm">
                    <select
                      value={editCountryCode}
                      onChange={e => {
                        setEditCountryCode(e.target.value);
                        setEditCityName('');
                      }}
                      className="bg-background border border-border rounded px-3 py-1.5 text-sm w-full focus:outline-none focus:ring-2 focus:ring-primary/50"
                    >
                      <option value="">Ülke Seçiniz...</option>
                      {Country.getAllCountries().map(country => (
                        <option key={country.isoCode} value={country.isoCode}>{country.name}</option>
                      ))}
                    </select>
                    {editCountryCode && (
                      <select
                        value={editCityName}
                        onChange={e => setEditCityName(e.target.value)}
                        className="bg-background border border-border rounded px-3 py-1.5 text-sm w-full focus:outline-none focus:ring-2 focus:ring-primary/50"
                      >
                        <option value="">Şehir Seçiniz (Tümü)</option>
                        {State.getStatesOfCountry(editCountryCode)?.map(state => (
                          <option key={state.isoCode} value={state.name}>{state.name}</option>
                        ))}
                      </select>
                    )}
                  </div>
                ) : (
                  profile?.location || 'Konum belirtilmemiş'
                )}
              </div>
              
              <div className="flex items-center gap-4 mt-3 text-sm text-muted-foreground font-semibold flex-wrap">
                <Link to="/network" search={{ userId: userId || loggedInUserId, tab: 'followers' }} className="flex items-center gap-1.5 hover:text-primary transition-colors cursor-pointer"><Users className="w-4 h-4 text-primary" /> {(profile?.user as any)?._count?.followers || 0} Takipçi</Link>
                <Link to="/network" search={{ userId: userId || loggedInUserId, tab: 'following' }} className="flex items-center gap-1.5 hover:text-primary transition-colors cursor-pointer">{(profile?.user as any)?._count?.following || 0} Takip Edilen</Link>
                <Link to="/network" search={{ userId: userId || loggedInUserId, tab: 'connections' }} className="flex items-center gap-1.5 hover:text-primary transition-colors cursor-pointer"><UserCheck className="w-4 h-4 text-primary" /> Bağlantılarım</Link>
              </div>
            </div>
            
            {/* Action Buttons */}
            {isOwnProfile && (
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
                    const loc = profile?.location || '';
                    setEditBio(profile?.bio || '');
                    setEditLocation(loc);
                    
                    let cc = '';
                    let cname = '';
                    if (loc) {
                      const parts = loc.split(',').map((s: string) => s.trim());
                      if (parts.length === 2) {
                        const c = Country.getAllCountries().find(c => c.name === parts[1] || c.isoCode === parts[1]);
                        if (c) {
                          cc = c.isoCode;
                          cname = parts[0];
                        }
                      } else {
                        const c = Country.getAllCountries().find(c => c.name === loc || c.isoCode === loc);
                        if (c) cc = c.isoCode;
                      }
                    }
                    setEditCountryCode(cc);
                    setEditCityName(cname);

                    setEditLinks(profile?.links || []);
                    setEditBanner(profile?.banner || '');
                    setEditName(profile?.user?.name || session?.user?.name || '');
                    setEditSurname(profile?.user?.surname || (session?.user as any)?.surname || '');
                    setEditImage(profile?.user?.image || session?.user?.image || '');
                    setIsEditing(true);
                  }} className="w-full sm:w-auto bg-primary text-primary-foreground px-6 py-2.5 rounded-lg font-bold hover:opacity-90 flex items-center justify-center gap-2 shadow-sm">
                    <Edit2 className="w-4 h-4" /> Profili Düzenle
                  </button>
                )}
                {!isEditing && (
                  <button 
                    onClick={() => authClient.signOut({ fetchOptions: { onSuccess: () => navigate({ to: '/login' }) } })}
                    className="md:hidden w-full sm:w-auto bg-destructive/10 text-destructive px-6 py-2.5 rounded-lg font-bold hover:bg-destructive/20 flex items-center justify-center gap-2 shadow-sm"
                  >
                    <LogOut className="w-4 h-4" /> Çıkış Yap
                  </button>
                )}
              </div>
            )}

            {/* Target Profile Action Buttons */}
            {!isOwnProfile && loggedInUserId && userId && (
              <div className="sm:pb-2 mt-4 sm:mt-0 flex gap-2 w-full sm:w-auto">
                <button 
                  onClick={() => {
                    if (connectionData?.isFollowing || connectionData?.isFollowPending) unfollowMutation.mutate({ followerId: loggedInUserId || '', followingId: userId || '' });
                    else followMutation.mutate({ followerId: loggedInUserId || '', followingId: userId || '' });
                  }}
                  disabled={followMutation.isLoading || unfollowMutation.isLoading}
                  className={`flex-1 sm:flex-none px-6 py-2 rounded-lg font-bold flex items-center justify-center gap-2 shadow-sm transition-all duration-200 ${connectionData?.isFollowing ? 'bg-secondary text-secondary-foreground hover:bg-destructive hover:text-destructive-foreground' : connectionData?.isFollowPending ? 'bg-orange-500/10 text-orange-600 hover:bg-orange-500/20' : 'bg-primary text-primary-foreground hover:opacity-90'}`}
                >
                  {connectionData?.isFollowing ? (
                    <><Check className="w-4 h-4" /> Takip Ediliyor</>
                  ) : connectionData?.isFollowPending ? (
                    <><ClockIcon className="w-4 h-4" /> İstek Gönderildi</>
                  ) : (
                    <><Plus className="w-4 h-4" /> Takip Et</>
                  )}
                </button>
                
                <button 
                  onClick={() => {
                    if (!connectionData?.connectionStatus) connectMutation.mutate({ requesterId: loggedInUserId || '', addresseeId: userId || '' });
                  }}
                  disabled={!!connectionData?.connectionStatus || connectMutation.isLoading}
                  className={`flex-1 sm:flex-none px-6 py-2 rounded-lg font-bold flex items-center justify-center gap-2 shadow-sm transition-all duration-200 ${connectionData?.connectionStatus === 'ACCEPTED' ? 'bg-teal-500/10 text-teal-600' : connectionData?.connectionStatus === 'PENDING' ? 'bg-orange-500/10 text-orange-600' : 'bg-card border border-border text-foreground hover:bg-muted'}`}
                >
                  {connectionData?.connectionStatus === 'ACCEPTED' ? (
                    <><Users className="w-4 h-4" /> Bağlantı Kuruldu</>
                  ) : connectionData?.connectionStatus === 'PENDING' ? (
                    <><ClockIcon className="w-4 h-4" /> Bağlantı İsteği Gönderildi</>
                  ) : (
                    <><UserPlus className="w-4 h-4" /> Bağlantı Kur</>
                  )}
                </button>

                {isAdmin && (
                  <button 
                    onClick={() => {
                      if (window.confirm("Bu profili ve tüm gönderilerini kalıcı olarak silmek istediğinize emin misiniz?")) {
                        deleteUserMut.mutate({ userId: userId || '' });
                      }
                    }}
                    disabled={deleteUserMut.isLoading}
                    className="flex-1 sm:flex-none px-4 py-2 bg-destructive/10 text-destructive border border-destructive/20 rounded-lg font-bold hover:bg-destructive/20 transition-all flex items-center justify-center shadow-sm disabled:opacity-50"
                  >
                    <Trash2 className="w-4 h-4 sm:mr-2" />
                    <span className="hidden sm:inline">{deleteUserMut.isLoading ? 'Siliniyor...' : 'Profili Tamamen Sil'}</span>
                  </button>
                )}

                <button 
                  onClick={() => {
                    setReportTarget({ type: 'USER', id: userId });
                    setReportModalOpen(true);
                  }}
                  className="flex-none px-4 py-2 rounded-lg font-bold flex items-center justify-center gap-2 shadow-sm transition-all duration-200 bg-red-500/10 text-red-500 hover:bg-red-500/20 border border-red-500/20"
                  title="Kullanıcıyı Şikayet Et"
                >
                  <FileWarning className="w-4 h-4" />
                </button>
              </div>
            )}
            
          </div>
        </div>
      </div>

      <div className="grid md:grid-cols-3 gap-6">
        {/* Left Column: Details */}
        <div className="md:col-span-1 space-y-6">
          <div className="bg-card rounded-2xl shadow-sm border border-border p-6">
            <h3 className="font-bold text-foreground mb-4">{isCompany ? 'Şirket Hakkında' : 'Hakkımda'}</h3>
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

          {!isCompany ? (
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
                  onFocus={() => setIsSkillFocused(true)}
                  onBlur={() => setTimeout(() => setIsSkillFocused(false), 200)}
                  placeholder="Yetenek ara veya yeni yetenek yazıp Enter'a bas..." 
                  className="w-full bg-background border border-border rounded-lg px-3 py-2 text-sm"
                  onKeyDown={e => {
                    if (e.key === 'Enter' && skillSearch.trim()) {
                      handleAddSkill(skillSearch.trim());
                    }
                  }}
                />
                {isSkillFocused && (
                <div className="absolute top-full left-0 right-0 mt-1 bg-card border border-border rounded-lg shadow-lg z-20 max-h-48 overflow-y-auto">
                  {!skillSearch ? (
                    <>
                      <div className="px-3 py-2 text-xs font-semibold text-muted-foreground uppercase tracking-wider bg-secondary/50">
                        Önerilen Yetenekler
                      </div>
                      {suggestedSkills.map(s => (
                        <button 
                          key={s} 
                          onClick={() => handleAddSkill(s)}
                          className="w-full text-left px-3 py-2 text-sm hover:bg-secondary flex justify-between items-center"
                        >
                          {s} <span className="text-xs text-primary bg-primary/10 px-2 py-0.5 rounded-full">+ Ekle</span>
                        </button>
                      ))}
                    </>
                  ) : (
                    <>
                      {filteredSkills.map(s => (
                        <button 
                          key={s.skillId} 
                          onClick={() => handleAddSkill(s.skillName)}
                          className="w-full text-left px-3 py-2 text-sm hover:bg-secondary"
                        >
                          {s.skillName}
                        </button>
                      ))}
                      
                      {/* Allow custom skill adding */}
                      {skillSearch.trim() && !filteredSkills.find(s => s.skillName.toLowerCase() === skillSearch.toLowerCase().trim()) && (
                        <button 
                          onClick={() => handleAddSkill(skillSearch.trim())}
                          className="w-full text-left px-3 py-2 text-sm hover:bg-secondary text-primary font-medium border-t border-border flex items-center gap-2"
                        >
                          <span className="bg-primary/10 text-primary px-2 py-0.5 rounded-full text-xs">+ Yeni Ekle</span>
                          "{skillSearch.trim()}"
                        </button>
                      )}
                    </>
                  )}
                </div>
                )}
              </div>
            )}
          </div>
          ) : (
            <div className="bg-card rounded-2xl shadow-sm border border-border p-6">
              <h3 className="font-bold text-foreground mb-4">Şirket Bilgileri</h3>
              <div className="space-y-3">
                <div className="flex items-center gap-2 text-foreground text-sm font-medium">
                  <Briefcase className="w-4 h-4 text-primary" /> 
                  <span className="text-muted-foreground">Sektör:</span> 
                  {(isOwnProfile ? (session?.user as any)?.sector : (profile?.user as any)?.sector) || 'Belirtilmemiş'}
                </div>
              </div>
            </div>
          )}
          
          <div className="bg-card rounded-2xl shadow-sm border border-border p-6">
            <h3 className="font-bold text-foreground mb-4">Linkler</h3>
            <div className="space-y-3">
              {isOwnProfile && session?.user?.email && (
                <div className="flex items-center gap-2 text-muted-foreground text-sm font-medium">
                  <Mail className="w-4 h-4" /> {session.user.email}
                </div>
              )}
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
                <div className="space-y-2">
                  {(profile?.links && profile.links.length > 0) ? (
                    profile.links.map((link: string, idx: number) => (
                      <a key={idx} href={link} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 text-primary hover:underline text-sm font-medium break-all">
                        <Globe className="w-4 h-4 shrink-0" /> <span className="truncate">{link.replace(/^https?:\/\//, '')}</span>
                      </a>
                    ))
                  ) : (
                    <div className="text-muted-foreground text-sm italic">Henüz link eklenmemiş.</div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Right Column: Experience & Edu */}
        <div className="md:col-span-2 space-y-6">
          {!isCompany ? (
            <>
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
                <div className="flex flex-col gap-2">
                  <div className="flex gap-3">
                     <div className="flex-1">
                       <label className="text-xs text-muted-foreground">Başlangıç</label>
                       <input type="date" max={today} value={expStartDate} onChange={e => setExpStartDate(e.target.value)} className="w-full bg-background border border-border rounded px-3 py-2 text-sm" />
                     </div>
                     <div className="flex-1">
                       <label className="text-xs text-muted-foreground">Bitiş</label>
                       <input type="date" max={today} value={expEndDate} disabled={expIsCurrent} onChange={e => setExpEndDate(e.target.value)} className={`w-full bg-background border border-border rounded px-3 py-2 text-sm ${expIsCurrent ? 'opacity-50' : ''}`} />
                     </div>
                  </div>
                  <label className="flex items-center gap-2 text-sm font-medium text-foreground cursor-pointer w-fit px-1">
                    <input type="checkbox" checked={expIsCurrent} onChange={(e) => setExpIsCurrent(e.target.checked)} className="rounded border-border accent-primary w-4 h-4" />
                    Devam Ediyor
                  </label>
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
                <div className="flex flex-col gap-2">
                  <div className="flex gap-3">
                     <div className="flex-1">
                       <label className="text-xs text-muted-foreground">Başlangıç</label>
                       <input type="date" max={today} value={eduStartDate} onChange={e => setEduStartDate(e.target.value)} className="w-full bg-background border border-border rounded px-3 py-2 text-sm" />
                     </div>
                     <div className="flex-1">
                       <label className="text-xs text-muted-foreground">Bitiş</label>
                       <input type="date" max={today} value={eduEndDate} disabled={eduIsCurrent} onChange={e => setEduEndDate(e.target.value)} className={`w-full bg-background border border-border rounded px-3 py-2 text-sm ${eduIsCurrent ? 'opacity-50' : ''}`} />
                     </div>
                  </div>
                  <label className="flex items-center gap-2 text-sm font-medium text-foreground cursor-pointer w-fit px-1">
                    <input type="checkbox" checked={eduIsCurrent} onChange={(e) => setEduIsCurrent(e.target.checked)} className="rounded border-border accent-primary w-4 h-4" />
                    Devam Ediyor
                  </label>
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
                <div className="flex flex-col gap-2">
                  <div className="flex gap-3">
                     <div className="flex-1">
                       <label className="text-xs text-muted-foreground">Veriliş Tarihi</label>
                       <input type="date" max={today} value={certStartDate} onChange={e => setCertStartDate(e.target.value)} className="w-full bg-background border border-border rounded px-3 py-2 text-sm" />
                     </div>
                     <div className="flex-1">
                       <label className="text-xs text-muted-foreground">Geçerlilik Bitiş</label>
                       <input type="date" value={certEndDate} disabled={certIsCurrent} onChange={e => setCertEndDate(e.target.value)} className={`w-full bg-background border border-border rounded px-3 py-2 text-sm ${certIsCurrent ? 'opacity-50' : ''}`} />
                     </div>
                  </div>
                  <label className="flex items-center gap-2 text-sm font-medium text-foreground cursor-pointer w-fit px-1">
                    <input type="checkbox" checked={certIsCurrent} onChange={(e) => setCertIsCurrent(e.target.checked)} className="rounded border-border accent-primary w-4 h-4" />
                    Geçerliliği Devam Ediyor
                  </label>
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
            </>
          ) : (
            <div className="bg-card rounded-2xl shadow-sm border border-border p-6">
              <h3 className="font-bold text-foreground text-xl flex items-center gap-2 mb-6">
                <Briefcase className="w-5 h-5 text-primary" /> İlanlar
              </h3>
              {isOwnProfile ? (
                myJobs && myJobs.length > 0 ? (
                  <div className="space-y-4">
                    {myJobs.map((job: any) => (
                      <div key={job.id} className="border border-border rounded-lg p-4 bg-background">
                        <div className="flex justify-between items-start mb-2">
                          <h4 className="font-bold text-lg">{job.title}</h4>
                          <span className={`text-xs px-2 py-1 rounded font-medium ${job.status === 'OPEN' ? 'bg-green-500/10 text-green-600' : 'bg-destructive/10 text-destructive'}`}>
                            {job.status === 'OPEN' ? 'Aktif' : 'Kapalı'}
                          </span>
                        </div>
                        <p className="text-sm text-muted-foreground mb-3">{job.description}</p>
                        <div className="flex gap-2 text-xs text-muted-foreground">
                          <span className="bg-secondary px-2 py-1 rounded font-medium">{job.type === 'FREELANCE' ? 'Freelance' : 'Kurumsal'}</span>
                          <span className="bg-secondary px-2 py-1 rounded font-medium">{job.locationType}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-muted-foreground text-sm italic">Henüz ilan paylaşmadınız.</p>
                )
              ) : (
                <p className="text-muted-foreground text-sm italic">Bu şirketin ilanları yakında görüntülenebilecek.</p>
              )}
            </div>
          )}
          
        </div>
      </div>

      <ReportModal 
        isOpen={reportModalOpen} 
        onClose={() => setReportModalOpen(false)} 
        targetType="USER"
        targetId={reportTarget?.id || ''} 
      />
    </div>
  );
}
