import { createFileRoute, useNavigate } from '@tanstack/react-router';
import { useState } from 'react';
import { Mail, Lock, Sparkles, ArrowRight } from 'lucide-react';
import { signIn, useSession } from '@collabswipe/auth/client';
import toast from 'react-hot-toast';
import { RegisterWizard } from '../components/auth/RegisterWizard';

export const Route = createFileRoute('/login')({
  component: LoginPage,
});

function LoginPage() {
  const navigate = useNavigate();
  const { data: session } = useSession();
  
  // If user is already logged in, redirect them to home
  if (session) {
    setTimeout(() => navigate({ to: '/' }), 100);
  }

  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [surname, setSurname] = useState('');
  const [sector, setSector] = useState('');
  const [isCompany, setIsCompany] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isLogin) return;
    setError('');
    setLoading(true);

    try {
      const res = await signIn.email({
        email,
        password,
        callbackURL: '/',
      });
      if (res?.error) {
        setError(res.error.message || 'Giriş yapılamadı. Bilgilerinizi kontrol edin.');
      } else {
        navigate({ to: '/' });
      }
    } catch (err: any) {
      console.error(err);
      setError('Bir bağlantı hatası oluştu. Sunucunun çalıştığından emin olun.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[80vh] flex items-center justify-center p-4">
      {/* Background Glows */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-primary/10 rounded-full blur-3xl -z-10" />
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-secondary/10 rounded-full blur-3xl -z-10" />

      {/* Auth Card */}
      <div className="w-full max-w-md bg-card/60 backdrop-blur-xl border border-border rounded-3xl shadow-2xl p-8 relative overflow-hidden">
        {/* Decorative Top Accent */}
        <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-primary via-accent to-secondary" />

        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-primary/10 text-primary mb-4">
            <Sparkles className="w-6 h-6 animate-pulse" />
          </div>
          <h2 className="text-3xl font-black tracking-tight mb-2">CollabSwipe'a Hoş Geldiniz</h2>
          <p className="text-muted-foreground text-sm">
            {isLogin ? 'Hesabınıza giriş yaparak topluluğa katılın.' : 'Yeni bir hesap oluşturun ve kaydırmaya başlayın.'}
          </p>
        </div>

        {/* Tab Toggle */}
        <div className="flex bg-secondary/50 p-1 rounded-2xl mb-8 relative border border-border">
          <button
            type="button"
            onClick={() => { setIsLogin(true); setError(''); }}
            className={`flex-1 py-2.5 rounded-xl font-bold text-sm transition-all duration-300 relative z-10 ${
              isLogin ? 'bg-background text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            Giriş Yap
          </button>
          <button
            type="button"
            onClick={() => { setIsLogin(false); setError(''); }}
            className={`flex-1 py-2.5 rounded-xl font-bold text-sm transition-all duration-300 relative z-10 ${
              !isLogin ? 'bg-background text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            Kayıt Ol
          </button>
        </div>

        {/* Error Alert */}
        {error && (
          <div className="mb-6 p-4 bg-destructive/10 border border-destructive/20 text-destructive text-sm font-semibold rounded-2xl">
            {error}
          </div>
        )}

        {/* Form or Wizard */}
        {isLogin ? (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">E-posta</label>
              <div className="relative">
                <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="ornek@collabswipe.com"
                  className="w-full bg-background/50 border border-border rounded-2xl pl-11 pr-4 py-3 text-sm focus:outline-none focus:border-primary transition-colors placeholder:text-muted-foreground/50"
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Şifre</label>
              <div className="relative">
                <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full bg-background/50 border border-border rounded-2xl pl-11 pr-4 py-3 text-sm focus:outline-none focus:border-primary transition-colors placeholder:text-muted-foreground/50"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-primary hover:opacity-90 active:scale-[0.98] text-primary-foreground font-bold py-3.5 rounded-2xl transition-all flex items-center justify-center gap-2 mt-6 shadow-lg shadow-primary/20 disabled:opacity-50"
            >
              {loading ? (
                <span className="w-5 h-5 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin" />
              ) : (
                <>
                  Giriş Yap
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>
        ) : (
          <RegisterWizard 
            onComplete={() => navigate({ to: '/' })} 
            onCancel={() => setIsLogin(true)} 
          />
        )}
      </div>
    </div>
  );
}
