import { useState } from 'react';
import { Mail, Lock, User as UserIcon, ArrowRight, Building2, Briefcase, Camera, Plus, Trash2, ChevronRight, X } from 'lucide-react';
import { signUp } from '@collabswipe/auth/client';
import { trpc } from '@/lib/trpc';
import toast from 'react-hot-toast';

interface RegisterWizardProps {
  onComplete: () => void;
  onCancel: () => void;
}

export function RegisterWizard({ onComplete, onCancel }: RegisterWizardProps) {
  const [step, setStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Step 0: Account Type
  const [isCompany, setIsCompany] = useState(false);

  // Core User Info
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [surname, setSurname] = useState('');
  const [sector, setSector] = useState(''); // Company only

  // Profile Details
  const [image, setImage] = useState(''); // Base64
  const [bio, setBio] = useState('');
  
  // Arrays
  const [skills, setSkills] = useState<string[]>([]);
  const [workingFields, setWorkingFields] = useState<string[]>([]);
  
  // Lists
  const [experiences, setExperiences] = useState<any[]>([]);
  const [educations, setEducations] = useState<any[]>([]);
  const [certificates, setCertificates] = useState<any[]>([]);

  // Temp inputs
  const [tempSkill, setTempSkill] = useState('');
  const [tempField, setTempField] = useState('');
  
  // Current switches
  const [expIsCurrent, setExpIsCurrent] = useState(true);
  const [eduIsCurrent, setEduIsCurrent] = useState(true);
  const [certIsCurrent, setCertIsCurrent] = useState(true);

  // TRPC utils
  const { data: standardSkills } = trpc.profile.getAllSkills.useQuery();
  const completeOnboarding = trpc.profile.completeOnboarding.useMutation();

  const handleNext = () => {
    setError('');
    // Validations
    if (step === 1 && !email) return setError('Lütfen e-posta giriniz.');
    if (step === 2 && password.length < 8) return setError('Şifre en az 8 karakter olmalıdır.');
    if (step === 3 && !isCompany && (!name || !surname)) return setError('Ad ve soyad zorunludur.');
    if (step === 3 && isCompany && !name) return setError('Şirket adı zorunludur.');
    if (step === 4 && isCompany && !sector) return setError('Sektör zorunludur.');

    setStep(s => s + 1);
  };

  const handleBack = () => {
    setError('');
    if (step === 0) onCancel();
    else setStep(s => s - 1);
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

  const handleImageSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setLoading(true);
      const url = await uploadImage(file);
      if (url) {
        setImage(url);
      }
      setLoading(false);
    }
  };

  const handleAddSkill = (skill: string) => {
    if (skill.trim() && !skills.includes(skill.trim())) {
      setSkills([...skills, skill.trim()]);
    }
    setTempSkill('');
  };

  const handleAddField = () => {
    if (tempField.trim() && !workingFields.includes(tempField.trim())) {
      setWorkingFields([...workingFields, tempField.trim()]);
    }
    setTempField('');
  };

  const handleSubmit = async () => {
    setLoading(true);
    setError('');
    try {
      // 1. Sign Up User via Better Auth
      const res = await signUp.email({
        email,
        password,
        name,
        surname: isCompany ? '' : surname,
        role: isCompany ? 'company' : 'user',
        sector: isCompany ? sector : undefined,
        callbackURL: '/', // Though we might not redirect immediately
      });

      if (res?.error) {
        throw new Error(res.error.message || 'Kayıt olunamadı.');
      }

      // We should have a session now. The returned user has id.
      const userId = res?.data?.user?.id;
      if (!userId) throw new Error('Kullanıcı oluşturuldu ancak ID alınamadı.');

      // 2. Complete Onboarding Profile via TRPC
      await completeOnboarding.mutateAsync({
        userId,
        image: image || undefined,
        bio: bio || undefined,
        skills,
        workingFields,
        experiences,
        educations,
        certificates,
      });

      toast.success('Kayıt ve profil oluşturma başarılı!');
      onComplete(); // Navigate to home
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'Bir hata oluştu.');
    } finally {
      setLoading(false);
    }
  };

  // Determine Max Steps based on type
  const isIndividual = !isCompany;
  const maxSteps = isIndividual ? 9 : 7;

  // Generic Step View Wrapper
  const renderStepWrapper = (title: string, subtitle: string, content: React.ReactNode, isOptional: boolean = false) => (
    <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
      <div className="text-center">
        <h3 className="text-2xl font-bold">{title}</h3>
        <p className="text-muted-foreground text-sm mt-1">{subtitle}</p>
      </div>

      {error && (
        <div className="p-3 bg-destructive/10 text-destructive text-sm font-semibold rounded-xl">
          {error}
        </div>
      )}

      <div className="space-y-4">
        {content}
      </div>

      <div className="flex gap-3 pt-4">
        <button
          type="button"
          onClick={handleBack}
          className="flex-1 py-3 rounded-xl font-bold border border-border text-foreground hover:bg-secondary transition-colors"
        >
          Geri
        </button>
        {step < maxSteps ? (
          <button
            type="button"
            onClick={handleNext}
            className="flex-[2] bg-primary hover:opacity-90 text-primary-foreground font-bold py-3 rounded-xl transition-all shadow-lg shadow-primary/20"
          >
            İleri <ChevronRight className="w-4 h-4 inline-block ml-1" />
          </button>
        ) : (
          <button
            type="button"
            onClick={handleSubmit}
            disabled={loading}
            className="flex-[2] bg-primary hover:opacity-90 text-primary-foreground font-bold py-3 rounded-xl transition-all shadow-lg shadow-primary/20 disabled:opacity-50"
          >
            {loading ? <span className="w-5 h-5 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin inline-block align-middle" /> : 'Kaydı Tamamla'}
          </button>
        )}
      </div>
      {isOptional && step < maxSteps && (
        <div className="text-center">
          <button type="button" onClick={handleNext} className="text-xs text-muted-foreground hover:text-foreground underline underline-offset-4">
            Bu adımı atla
          </button>
        </div>
      )}
    </div>
  );

  // --- Step 0: Type ---
  if (step === 0) {
    return renderStepWrapper("Hesap Türü", "Size uygun hesap tipini seçin.", (
      <div className="grid grid-cols-2 gap-4">
        <button
          type="button"
          onClick={() => { setIsCompany(false); handleNext(); }}
          className="p-6 border-2 border-border rounded-2xl hover:border-primary/50 hover:bg-primary/5 transition-all flex flex-col items-center gap-3 group"
        >
          <div className="w-12 h-12 rounded-full bg-primary/10 text-primary flex items-center justify-center group-hover:scale-110 transition-transform">
            <UserIcon className="w-6 h-6" />
          </div>
          <span className="font-bold text-foreground">Bireysel</span>
          <span className="text-xs text-muted-foreground text-center">Öğrenci, Mezun, Profesyonel</span>
        </button>
        <button
          type="button"
          onClick={() => { setIsCompany(true); handleNext(); }}
          className="p-6 border-2 border-border rounded-2xl hover:border-primary/50 hover:bg-primary/5 transition-all flex flex-col items-center gap-3 group"
        >
          <div className="w-12 h-12 rounded-full bg-primary/10 text-primary flex items-center justify-center group-hover:scale-110 transition-transform">
            <Building2 className="w-6 h-6" />
          </div>
          <span className="font-bold text-foreground">Şirket</span>
          <span className="text-xs text-muted-foreground text-center">Kurum, Kuruluş, Topluluk</span>
        </button>
      </div>
    ));
  }

  // --- Step 1: Email ---
  if (step === 1) {
    return renderStepWrapper("E-posta Adresi", "Giriş yaparken bu adresi kullanacaksınız.", (
      <div className="relative">
        <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="ornek@email.com"
          autoFocus
          className="w-full bg-background/50 border border-border rounded-2xl pl-12 pr-4 py-4 text-sm focus:outline-none focus:border-primary transition-colors"
          onKeyDown={(e) => e.key === 'Enter' && handleNext()}
        />
      </div>
    ));
  }

  // --- Step 2: Password ---
  if (step === 2) {
    return renderStepWrapper("Şifre Belirleyin", "Hesabınız için güvenli bir şifre seçin.", (
      <div className="relative">
        <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="••••••••"
          autoFocus
          className="w-full bg-background/50 border border-border rounded-2xl pl-12 pr-4 py-4 text-sm focus:outline-none focus:border-primary transition-colors"
          onKeyDown={(e) => e.key === 'Enter' && handleNext()}
        />
      </div>
    ));
  }

  // --- Step 3: Name / Company Name ---
  if (step === 3) {
    return renderStepWrapper(
      isCompany ? "Şirket Adı" : "Ad Soyad",
      isCompany ? "Kurumunuzun adını girin." : "Profilinizde görünecek adınız.",
      isCompany ? (
        <div className="relative">
          <Building2 className="absolute left-3.5 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Şirket Adı"
            autoFocus
            className="w-full bg-background/50 border border-border rounded-2xl pl-12 pr-4 py-4 text-sm focus:outline-none focus:border-primary transition-colors"
            onKeyDown={(e) => e.key === 'Enter' && handleNext()}
          />
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-4">
          <div className="relative">
            <UserIcon className="absolute left-3.5 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Adınız"
              autoFocus
              className="w-full bg-background/50 border border-border rounded-2xl pl-12 pr-4 py-4 text-sm focus:outline-none focus:border-primary transition-colors"
            />
          </div>
          <div className="relative">
            <UserIcon className="absolute left-3.5 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
            <input
              type="text"
              value={surname}
              onChange={(e) => setSurname(e.target.value)}
              placeholder="Soyadınız"
              className="w-full bg-background/50 border border-border rounded-2xl pl-12 pr-4 py-4 text-sm focus:outline-none focus:border-primary transition-colors"
              onKeyDown={(e) => e.key === 'Enter' && handleNext()}
            />
          </div>
        </div>
      )
    );
  }

  // --- Step 4: Sector (Company Only) OR Profile Picture (Individual) ---
  if (step === 4) {
    if (isCompany) {
      return renderStepWrapper("Sektör", "Şirketinizin faaliyet gösterdiği ana sektörü belirtin.", (
        <div className="relative">
          <Briefcase className="absolute left-3.5 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
          <input
            type="text"
            value={sector}
            onChange={(e) => setSector(e.target.value)}
            placeholder="Örn: Yazılım, Finans, Sağlık"
            autoFocus
            className="w-full bg-background/50 border border-border rounded-2xl pl-12 pr-4 py-4 text-sm focus:outline-none focus:border-primary transition-colors"
            onKeyDown={(e) => e.key === 'Enter' && handleNext()}
          />
        </div>
      ));
    } else {
      // Individual: Profile Picture
      return renderStepWrapper("Profil Fotoğrafı", "Profilinizi öne çıkarın.", (
        <div className="flex flex-col items-center justify-center gap-4 py-4">
          <div className="relative w-32 h-32 rounded-full border-4 border-background shadow-xl bg-secondary/50 flex items-center justify-center overflow-hidden">
            {image ? (
              <img src={image} alt="Profile" className="w-full h-full object-cover" />
            ) : (
              <Camera className="w-10 h-10 text-muted-foreground opacity-50" />
            )}
            <input
              type="file"
              accept="image/*"
              onChange={handleImageSelect}
              className="absolute inset-0 opacity-0 cursor-pointer"
            />
          </div>
          <p className="text-xs text-muted-foreground">Fotoğraf seçmek için tıklayın</p>
        </div>
      ), true);
    }
  }

  // --- Step 5: Profile Picture (Company) OR Skills (Individual) ---
  if (step === 5) {
    if (isCompany) {
      return renderStepWrapper("Şirket Logosu", "Kurumunuzun logosunu ekleyin.", (
        <div className="flex flex-col items-center justify-center gap-4 py-4">
          <div className="relative w-32 h-32 rounded-3xl border-4 border-background shadow-xl bg-secondary/50 flex items-center justify-center overflow-hidden">
            {image ? (
              <img src={image} alt="Logo" className="w-full h-full object-contain bg-white" />
            ) : (
              <Building2 className="w-10 h-10 text-muted-foreground opacity-50" />
            )}
            <input
              type="file"
              accept="image/*"
              onChange={handleImageSelect}
              className="absolute inset-0 opacity-0 cursor-pointer"
            />
          </div>
          <p className="text-xs text-muted-foreground">Logo seçmek için tıklayın</p>
        </div>
      ), true);
    } else {
      // Individual: Skills
      return renderStepWrapper("Yetenekler", "Hangi alanlarda uzmansınız?", (
        <div className="space-y-4">
          <div className="flex gap-2">
            <input
              type="text"
              value={tempSkill}
              onChange={(e) => setTempSkill(e.target.value)}
              placeholder="Yeni bir yetenek ekle..."
              className="flex-1 bg-background/50 border border-border rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-primary"
              onKeyDown={(e) => e.key === 'Enter' && handleAddSkill(tempSkill)}
            />
            <button
              type="button"
              onClick={() => handleAddSkill(tempSkill)}
              className="bg-primary text-primary-foreground px-4 rounded-xl hover:opacity-90 transition-opacity flex items-center justify-center"
            >
              <Plus className="w-5 h-5" />
            </button>
          </div>
          
          <div className="flex flex-wrap gap-2 min-h-[100px] content-start p-3 bg-secondary/20 rounded-xl border border-border/50">
            {skills.length === 0 && <span className="text-sm text-muted-foreground italic w-full text-center py-2">Henüz yetenek eklemediniz.</span>}
            {skills.map(s => (
              <span key={s} className="bg-primary/10 text-primary border border-primary/20 px-3 py-1.5 rounded-lg text-sm font-medium flex items-center gap-1.5 animate-in zoom-in duration-200">
                {s}
                <button type="button" onClick={() => setSkills(skills.filter(x => x !== s))} className="hover:text-destructive transition-colors">
                  <X className="w-3.5 h-3.5" />
                </button>
              </span>
            ))}
          </div>

          <div className="pt-2">
            <p className="text-xs font-semibold text-muted-foreground mb-2">Önerilen Yetenekler</p>
            <div className="flex flex-wrap gap-1.5 max-h-[120px] overflow-y-auto pr-1 custom-scrollbar">
              {standardSkills?.filter(s => !skills.includes(s.skillName)).map(s => (
                <button
                  key={s.skillId}
                  type="button"
                  onClick={() => handleAddSkill(s.skillName)}
                  className="bg-secondary hover:bg-secondary/80 text-secondary-foreground px-2.5 py-1 rounded-md text-xs transition-colors border border-border"
                >
                  + {s.skillName}
                </button>
              ))}
            </div>
          </div>
        </div>
      ), true);
    }
  }

  // --- Step 6: Working Fields (Company) OR Experience (Individual) ---
  if (step === 6) {
    if (isCompany) {
      return renderStepWrapper("Çalışma Alanları", "Şirketinizin faaliyet alanlarını madde madde ekleyin.", (
        <div className="space-y-4">
          <div className="flex gap-2">
            <input
              type="text"
              value={tempField}
              onChange={(e) => setTempField(e.target.value)}
              placeholder="Örn: Yapay Zeka Ar-Ge"
              className="flex-1 bg-background/50 border border-border rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-primary"
              onKeyDown={(e) => e.key === 'Enter' && handleAddField()}
            />
            <button
              type="button"
              onClick={handleAddField}
              className="bg-primary text-primary-foreground px-4 rounded-xl hover:opacity-90 transition-opacity"
            >
              Ekle
            </button>
          </div>
          
          <ul className="space-y-2 max-h-[200px] overflow-y-auto">
            {workingFields.length === 0 && <p className="text-sm text-muted-foreground text-center py-4">Eklenmiş alan yok.</p>}
            {workingFields.map((f, i) => (
              <li key={i} className="flex justify-between items-center bg-secondary/30 p-3 rounded-lg border border-border/50 text-sm">
                <span>• {f}</span>
                <button type="button" onClick={() => setWorkingFields(workingFields.filter((_, idx) => idx !== i))} className="text-destructive/70 hover:text-destructive">
                  <Trash2 className="w-4 h-4" />
                </button>
              </li>
            ))}
          </ul>
        </div>
      ), true);
    } else {
      // Individual: Experience
      return renderStepWrapper("Deneyimler", "İş ve staj deneyimlerinizi ekleyin.", (
        <div className="space-y-4">
          <div className="bg-secondary/20 border border-border/50 p-4 rounded-xl space-y-3">
            <input id="expTitle" placeholder="Ünvan (Örn: Yazılım Mühendisi)" className="w-full bg-background/50 border border-border rounded-lg px-3 py-2 text-sm" />
            <input id="expCorp" placeholder="Şirket Adı" className="w-full bg-background/50 border border-border rounded-lg px-3 py-2 text-sm" />
            <div className="grid grid-cols-2 gap-2">
              <input id="expStart" type="date" className="w-full bg-background/50 border border-border rounded-lg px-3 py-2 text-sm text-muted-foreground" />
              <input id="expEnd" type="date" disabled={expIsCurrent} className={`w-full bg-background/50 border border-border rounded-lg px-3 py-2 text-sm ${expIsCurrent ? 'opacity-50' : 'text-muted-foreground'}`} />
            </div>
            <label className="flex items-center gap-2 text-sm font-medium text-foreground px-1 cursor-pointer">
              <input type="checkbox" checked={expIsCurrent} onChange={(e) => setExpIsCurrent(e.target.checked)} className="rounded border-border accent-primary w-4 h-4" />
              Devam Ediyor
            </label>
            <button
              type="button"
              onClick={() => {
                const title = (document.getElementById('expTitle') as HTMLInputElement).value;
                const corp = (document.getElementById('expCorp') as HTMLInputElement).value;
                const start = (document.getElementById('expStart') as HTMLInputElement).value;
                const end = (document.getElementById('expEnd') as HTMLInputElement).value;
                if (!title || !corp || !start) return toast.error('Ünvan, Şirket ve Başlangıç Tarihi zorunludur.');
                
                setExperiences([...experiences, {
                  type: "WORK", title, corp, startDate: new Date(start), endDate: expIsCurrent ? undefined : (end ? new Date(end) : undefined)
                }]);
                
                (document.getElementById('expTitle') as HTMLInputElement).value = '';
                (document.getElementById('expCorp') as HTMLInputElement).value = '';
                (document.getElementById('expStart') as HTMLInputElement).value = '';
                (document.getElementById('expEnd') as HTMLInputElement).value = '';
                setExpIsCurrent(true);
              }}
              className="w-full bg-secondary hover:bg-secondary/80 text-foreground py-2 rounded-lg text-sm font-semibold transition-colors"
            >
              Listeye Ekle
            </button>
          </div>

          <div className="space-y-2 max-h-[150px] overflow-y-auto">
            {experiences.map((exp, i) => (
              <div key={i} className="flex justify-between items-center p-3 border border-border rounded-lg bg-card text-sm">
                <div>
                  <p className="font-bold">{exp.title}</p>
                  <p className="text-muted-foreground text-xs">{exp.corp} • {exp.startDate.getFullYear()}</p>
                </div>
                <button type="button" onClick={() => setExperiences(experiences.filter((_, idx) => idx !== i))} className="text-destructive/70 hover:text-destructive">
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        </div>
      ), true);
    }
  }

  // --- Step 7: About (Company) OR Education (Individual) ---
  if (step === 7) {
    if (isCompany) {
      return renderStepWrapper("Hakkında", "Şirketiniz hakkında kısa bir açıklama girin.", (
        <textarea
          value={bio}
          onChange={(e) => setBio(e.target.value)}
          placeholder="Şirketimizin vizyonu ve misyonu..."
          rows={5}
          className="w-full bg-background/50 border border-border rounded-2xl p-4 text-sm focus:outline-none focus:border-primary transition-colors resize-none"
        />
      ), true);
    } else {
      // Individual: Education
      return renderStepWrapper("Eğitim", "Öğrenim bilgilerinizi ekleyin.", (
        <div className="space-y-4">
          <div className="bg-secondary/20 border border-border/50 p-4 rounded-xl space-y-3">
            <input id="eduName" placeholder="Okul Adı (Örn: Boğaziçi Üniversitesi)" className="w-full bg-background/50 border border-border rounded-lg px-3 py-2 text-sm" />
            <input id="eduProg" placeholder="Bölüm (Örn: Bilgisayar Mühendisliği)" className="w-full bg-background/50 border border-border rounded-lg px-3 py-2 text-sm" />
            <div className="grid grid-cols-2 gap-2">
              <input id="eduStart" type="date" className="w-full bg-background/50 border border-border rounded-lg px-3 py-2 text-sm text-muted-foreground" />
              <input id="eduEnd" type="date" disabled={eduIsCurrent} className={`w-full bg-background/50 border border-border rounded-lg px-3 py-2 text-sm ${eduIsCurrent ? 'opacity-50' : 'text-muted-foreground'}`} />
            </div>
            <label className="flex items-center gap-2 text-sm font-medium text-foreground px-1 cursor-pointer">
              <input type="checkbox" checked={eduIsCurrent} onChange={(e) => setEduIsCurrent(e.target.checked)} className="rounded border-border accent-primary w-4 h-4" />
              Devam Ediyor
            </label>
            <button
              type="button"
              onClick={() => {
                const instName = (document.getElementById('eduName') as HTMLInputElement).value;
                const instProgram = (document.getElementById('eduProg') as HTMLInputElement).value;
                const start = (document.getElementById('eduStart') as HTMLInputElement).value;
                const end = (document.getElementById('eduEnd') as HTMLInputElement).value;
                if (!instName || !start) return toast.error('Okul Adı ve Başlangıç Tarihi zorunludur.');
                
                setEducations([...educations, {
                  instName, instProgram, startDate: new Date(start), endDate: eduIsCurrent ? undefined : (end ? new Date(end) : undefined)
                }]);
                
                (document.getElementById('eduName') as HTMLInputElement).value = '';
                (document.getElementById('eduProg') as HTMLInputElement).value = '';
                (document.getElementById('eduStart') as HTMLInputElement).value = '';
                (document.getElementById('eduEnd') as HTMLInputElement).value = '';
                setEduIsCurrent(true);
              }}
              className="w-full bg-secondary hover:bg-secondary/80 text-foreground py-2 rounded-lg text-sm font-semibold transition-colors"
            >
              Listeye Ekle
            </button>
          </div>

          <div className="space-y-2 max-h-[150px] overflow-y-auto">
            {educations.map((edu, i) => (
              <div key={i} className="flex justify-between items-center p-3 border border-border rounded-lg bg-card text-sm">
                <div>
                  <p className="font-bold">{edu.instName}</p>
                  <p className="text-muted-foreground text-xs">{edu.instProgram} • {edu.startDate.getFullYear()}</p>
                </div>
                <button type="button" onClick={() => setEducations(educations.filter((_, idx) => idx !== i))} className="text-destructive/70 hover:text-destructive">
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        </div>
      ), true);
    }
  }

  // --- Step 8: Certificates (Individual Only) ---
  if (step === 8 && !isCompany) {
    return renderStepWrapper("Sertifikalar", "Sahip olduğunuz sertifikaları ekleyin.", (
      <div className="space-y-4">
          <div className="bg-secondary/20 border border-border/50 p-4 rounded-xl space-y-3">
            <input id="certTitle" placeholder="Sertifika Adı" className="w-full bg-background/50 border border-border rounded-lg px-3 py-2 text-sm" />
            <input id="certOrg" placeholder="Veren Kurum" className="w-full bg-background/50 border border-border rounded-lg px-3 py-2 text-sm" />
            <div className="grid grid-cols-2 gap-2">
              <input id="certStart" type="date" className="w-full bg-background/50 border border-border rounded-lg px-3 py-2 text-sm text-muted-foreground" />
              <input id="certEnd" type="date" disabled={certIsCurrent} className={`w-full bg-background/50 border border-border rounded-lg px-3 py-2 text-sm ${certIsCurrent ? 'opacity-50' : 'text-muted-foreground'}`} />
            </div>
            <label className="flex items-center gap-2 text-sm font-medium text-foreground px-1 cursor-pointer">
              <input type="checkbox" checked={certIsCurrent} onChange={(e) => setCertIsCurrent(e.target.checked)} className="rounded border-border accent-primary w-4 h-4" />
              Geçerliliği Devam Ediyor
            </label>
            <button
              type="button"
              onClick={() => {
                const title = (document.getElementById('certTitle') as HTMLInputElement).value;
                const org = (document.getElementById('certOrg') as HTMLInputElement).value;
                const start = (document.getElementById('certStart') as HTMLInputElement).value;
                const end = (document.getElementById('certEnd') as HTMLInputElement).value;
                if (!title || !org || !start) return toast.error('Ad, Kurum ve Başlangıç Tarihi zorunludur.');
                
                setCertificates([...certificates, {
                  title, org, startDate: new Date(start), endDate: certIsCurrent ? undefined : (end ? new Date(end) : undefined)
                }]);
                
                (document.getElementById('certTitle') as HTMLInputElement).value = '';
                (document.getElementById('certOrg') as HTMLInputElement).value = '';
                (document.getElementById('certStart') as HTMLInputElement).value = '';
                if(document.getElementById('certEnd')) (document.getElementById('certEnd') as HTMLInputElement).value = '';
                setCertIsCurrent(true);
              }}
              className="w-full bg-secondary hover:bg-secondary/80 text-foreground py-2 rounded-lg text-sm font-semibold transition-colors"
            >
              Listeye Ekle
            </button>
          </div>

          <div className="space-y-2 max-h-[150px] overflow-y-auto">
            {certificates.map((cert, i) => (
              <div key={i} className="flex justify-between items-center p-3 border border-border rounded-lg bg-card text-sm">
                <div>
                  <p className="font-bold">{cert.title}</p>
                  <p className="text-muted-foreground text-xs">{cert.org} • {cert.startDate.getFullYear()}</p>
                </div>
                <button type="button" onClick={() => setCertificates(certificates.filter((_, idx) => idx !== i))} className="text-destructive/70 hover:text-destructive">
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        </div>
    ), true);
  }

  // --- Step 9: About (Individual Only) ---
  if (step === 9 && !isCompany) {
    return renderStepWrapper("Hakkında", "Kendinizi kısaca tanıtın.", (
      <textarea
        value={bio}
        onChange={(e) => setBio(e.target.value)}
        placeholder="Ben bir yazılım geliştiricisiyim..."
        rows={5}
        className="w-full bg-background/50 border border-border rounded-2xl p-4 text-sm focus:outline-none focus:border-primary transition-colors resize-none"
      />
    ), true);
  }

  return null;
}
