import React from 'react';
import { Link } from '@tanstack/react-router';
import { Sparkles, ArrowRight, User as UserIcon, Sliders, X, Heart, Hand, Handshake, MessageSquare, CheckCircle } from 'lucide-react';
import { motion } from 'framer-motion';

export function LandingPage() {
  return (
    <>
      <style>{`
        .glow-hover:hover {
            box-shadow: 0 0 20px rgba(167, 139, 250, 0.15);
            transform: translateY(-2px);
        }
        .swipe-card {
            transition: transform 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275);
        }
        .swipe-card:hover {
            transform: rotate(5deg) scale(1.05);
        }
      `}</style>

      {/* TopNavBar */}
      <header className="fixed top-0 w-full z-50 bg-background/70 backdrop-blur-xl border-b border-border shadow-sm transition-all duration-300">
        <div className="max-w-[1280px] mx-auto px-5 md:px-20 flex justify-between items-center h-20">
          <div className="flex items-center gap-4">
            <span className="text-2xl font-bold text-primary">Collab Swipe</span>
          </div>
          <nav className="hidden md:flex items-center gap-8">
            <a className="text-sm font-semibold text-muted-foreground hover:text-primary transition-colors active:scale-95" href="#features">Özellikler</a>
            <a className="text-sm font-semibold text-muted-foreground hover:text-primary transition-colors active:scale-95" href="#candidates">İş Arayanlar İçin</a>
            <a className="text-sm font-semibold text-muted-foreground hover:text-primary transition-colors active:scale-95" href="#employers">İşverenler İçin</a>
          </nav>
          <div className="flex items-center gap-4">
            <Link to="/login" className="hidden md:block text-sm font-semibold text-muted-foreground hover:text-primary transition-colors hover:opacity-80 active:scale-95">Giriş Yap</Link>
            <Link to="/login" className="bg-primary/20 border border-primary/50 text-primary font-bold text-sm px-6 py-2 rounded-full hover:opacity-80 transition-all active:scale-95 shadow-[0_0_15px_rgba(206,189,255,0.15)]">Hemen Başla</Link>
          </div>
        </div>
      </header>

      <main className="flex-grow pt-24 overflow-x-hidden">
        {/* Hero Section */}
        <section className="max-w-[1280px] mx-auto px-5 md:px-20 py-[120px] flex flex-col lg:flex-row items-center gap-6 relative">
          <motion.div 
            initial={{ opacity: 0, x: -50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8, ease: "easeOut" }}
            className="lg:w-1/2 flex flex-col gap-8 z-10"
          >
            <div className="inline-flex items-center gap-2 bg-secondary/20 px-4 py-2 rounded-full border border-border w-max">
              <Sparkles className="text-primary w-4 h-4" />
              <span className="text-xs font-medium text-muted-foreground">Eşleşmenin Yeni Yolu</span>
            </div>
            <h1 className="text-5xl md:text-7xl font-extrabold tracking-tight text-foreground leading-[1.1]">
              Kariyerini <span className="text-primary">Kaydır</span>,<br />Geleceğini Bul.
            </h1>
            <p className="text-lg text-muted-foreground max-w-xl">
              Hayalinizdeki kariyere doğru sağa kaydırın. Yetenekleri ve yenilikçi şirketleri hızlı, sezgisel ve modern bir deneyimle buluşturuyoruz.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 pt-2">
              <Link to="/login" className="bg-primary text-primary-foreground font-bold text-lg px-8 py-4 rounded-xl hover:opacity-90 transition-all active:scale-95 shadow-[0_0_20px_rgba(206,189,255,0.4)] flex justify-center items-center gap-2">
                Hemen Başla
                <ArrowRight className="w-5 h-5" />
              </Link>
              <a href="#features" className="border border-primary/50 text-foreground font-bold text-lg px-8 py-4 rounded-xl hover:bg-secondary/20 transition-all active:scale-95 flex justify-center items-center">
                Nasıl Çalışır?
              </a>
            </div>
          </motion.div>
          
          <motion.div 
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.8, ease: "easeOut", delay: 0.2 }}
            className="lg:w-1/2 relative mt-16 lg:mt-0 flex justify-center perspective-1000"
          >
            {/* Mockup Background Glow */}
            <div className="absolute inset-0 bg-primary/20 blur-[100px] rounded-full pointer-events-none"></div>
            {/* Main Phone Mockup */}
            <div className="relative z-10 w-[300px] h-[600px] bg-background rounded-[40px] border-8 border-secondary/20 shadow-2xl overflow-hidden flex flex-col">
              {/* Notch */}
              <div className="absolute top-0 inset-x-0 h-6 bg-secondary/20 rounded-b-3xl w-1/2 mx-auto z-20"></div>
              {/* App Content UI */}
              <div className="flex-1 bg-background/50 p-4 pt-10 flex flex-col gap-4 relative">
                {/* Top Bar */}
                <div className="flex justify-between items-center px-2">
                  <UserIcon className="text-muted-foreground w-6 h-6" />
                  <span className="text-sm font-bold text-primary">Collab Swipe</span>
                  <Sliders className="text-muted-foreground w-6 h-6" />
                </div>
                {/* Swipe Card Deck */}
                <div className="flex-1 relative mt-4">
                  {/* Background Card */}
                  <div className="absolute inset-0 bg-secondary/20 rounded-2xl border border-white/5 scale-95 translate-y-4 opacity-50"></div>
                  {/* Foreground Card */}
                  <div className="absolute inset-0 bg-card rounded-2xl border border-border overflow-hidden flex flex-col swipe-card shadow-lg z-10">
                    <img alt="Office Workspace" className="h-1/2 w-full object-cover" src="https://lh3.googleusercontent.com/aida-public/AB6AXuB47bviWNFVM90IDiCtusP-MPmxe0BY-Hbxz1VkfS_HqTrE30Qyxxpz1XVLdIZKvLuA8gaIeGLarTSdEX7h2zxudUl7Lq-Lafa7YLaZtOxyQNdN4wnIgOhlx5RWdEHCcKntkpIZXgkZmX3JoyxGAIaWX1t2wTkeCkh4EWlolzZxa3-QsJSeDcvabEV0g4fTgtFtTLKZHuHuNd7-YTi_RLVgNVmdnPHY9IDDjNARgtqRlwoVGqd8AZSLFVFKX6WzxmYIhf23oecp3Do6" />
                    <div className="p-4 flex flex-col gap-2 flex-1 justify-end">
                      <div className="inline-flex px-2 py-1 bg-secondary/50 rounded text-xs text-primary font-bold w-max mb-1">Tech / Remote</div>
                      <h3 className="text-xl font-bold text-foreground">Senior Frontend Dev</h3>
                      <p className="text-sm text-muted-foreground">TechFlow Solutions • $120k - $150k</p>
                    </div>
                  </div>
                </div>
                {/* Action Buttons */}
                <div className="h-20 flex justify-center items-center gap-6 pb-4">
                  <button className="w-14 h-14 rounded-full bg-secondary/20 border border-border flex items-center justify-center text-destructive hover:bg-secondary/40 transition-colors">
                    <X className="w-8 h-8" />
                  </button>
                  <button className="w-16 h-16 rounded-full bg-primary flex items-center justify-center text-primary-foreground shadow-[0_0_15px_rgba(206,189,255,0.4)] hover:scale-105 transition-transform">
                    <Heart className="w-8 h-8 fill-current" />
                  </button>
                </div>
              </div>
            </div>
          </motion.div>
        </section>

        {/* How it Works Section */}
        <section className="max-w-[1280px] mx-auto px-5 md:px-20 py-[120px] overflow-hidden" id="features">
          <motion.div 
            initial={{ opacity: 0, y: 50 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ duration: 0.6 }}
            className="text-center mb-12"
          >
            <h2 className="text-4xl md:text-5xl font-bold text-foreground mb-4">Nasıl Çalışır?</h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">Hayalinizdeki fırsatlara ulaşmak için 3 basit adım.</p>
          </motion.div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Step 1 */}
            <motion.div 
              initial={{ opacity: 0, y: 50 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-50px" }}
              transition={{ duration: 0.6, delay: 0.1 }}
              className="bg-card backdrop-blur-xl border border-border shadow-xl p-8 rounded-3xl glow-hover transition-all duration-300 flex flex-col items-center text-center"
            >
              <div className="w-16 h-16 rounded-full bg-secondary/30 flex items-center justify-center mb-6 border border-primary/20">
                <Hand className="text-primary w-8 h-8" />
              </div>
              <h3 className="text-2xl font-bold text-foreground mb-3">1. Kaydır</h3>
              <p className="text-base text-muted-foreground leading-relaxed">İş ilanlarına veya aday profillerine göz atın. Beğenmek için sağa, geçmek için sola kaydırın. Çok basit.</p>
            </motion.div>
            {/* Step 2 */}
            <motion.div 
              initial={{ opacity: 0, y: 50 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-50px" }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="bg-card backdrop-blur-xl border border-border shadow-xl p-8 rounded-3xl glow-hover transition-all duration-300 flex flex-col items-center text-center relative md:translate-y-4"
            >
              <div className="absolute inset-0 bg-primary/5 rounded-3xl pointer-events-none"></div>
              <div className="w-16 h-16 rounded-full bg-primary flex items-center justify-center mb-6 shadow-[0_0_15px_rgba(206,189,255,0.3)] relative z-10">
                <Handshake className="text-primary-foreground w-8 h-8" />
              </div>
              <h3 className="text-2xl font-bold text-foreground mb-3 relative z-10">2. Eşleş</h3>
              <p className="text-base text-muted-foreground leading-relaxed relative z-10">İki taraf da sağa kaydırdığında eşleşme gerçekleşir! Özgeçmişinizi boşluğa göndermeye son.</p>
            </motion.div>
            {/* Step 3 */}
            <motion.div 
              initial={{ opacity: 0, y: 50 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-50px" }}
              transition={{ duration: 0.6, delay: 0.3 }}
              className="bg-card backdrop-blur-xl border border-border shadow-xl p-8 rounded-3xl glow-hover transition-all duration-300 flex flex-col items-center text-center"
            >
              <div className="w-16 h-16 rounded-full bg-secondary/30 flex items-center justify-center mb-6 border border-primary/20">
                <MessageSquare className="text-primary w-8 h-8" />
              </div>
              <h3 className="text-2xl font-bold text-foreground mb-3">3. Sohbet Et</h3>
              <p className="text-base text-muted-foreground leading-relaxed">Doğrudan sohbete başlayın. Detayları, kültürü tartışın ve anında mülakat ayarlayın.</p>
            </motion.div>
          </div>
        </section>

        {/* Split Section */}
        <section className="max-w-[1280px] mx-auto px-5 md:px-20 py-[120px] overflow-hidden">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* For Candidates */}
            <motion.div 
              initial={{ opacity: 0, x: -50 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true, margin: "-100px" }}
              transition={{ duration: 0.7 }}
              className="bg-card backdrop-blur-lg rounded-[32px] p-10 lg:p-14 border border-border shadow-xl relative overflow-hidden group" id="candidates"
            >
              <div className="absolute top-0 right-0 w-64 h-64 bg-primary/10 rounded-full blur-[80px] -translate-y-1/2 translate-x-1/2 group-hover:bg-primary/20 transition-colors duration-500"></div>
              <div className="inline-flex px-4 py-1.5 bg-secondary/30 rounded-full text-xs text-foreground font-bold mb-6 border border-border shadow-sm relative z-10">Adaylar İçin</div>
              <h2 className="text-3xl lg:text-4xl font-extrabold text-foreground mb-4 relative z-10">İş Arayanlar İçin</h2>
              <p className="text-lg text-muted-foreground mb-8 leading-relaxed relative z-10">Tam zamanlı bir kariyer ya da freelance projeler... Tercihlerinizi belirleyin ve doğru fırsatların sizi bulmasına izin verin.</p>
              <ul className="flex flex-col gap-5 mb-10 relative z-10">
                <li className="flex items-center gap-4">
                  <CheckCircle className="text-primary w-6 h-6 shrink-0" />
                  <span className="text-foreground font-medium text-lg">Anonim gezinme seçenekleri</span>
                </li>
                <li className="flex items-center gap-4">
                  <CheckCircle className="text-primary w-6 h-6 shrink-0" />
                  <span className="text-foreground font-medium text-lg">Karar vericilerle doğrudan sohbet</span>
                </li>
                <li className="flex items-center gap-4">
                  <CheckCircle className="text-primary w-6 h-6 shrink-0" />
                  <span className="text-foreground font-medium text-lg">Yetenek odaklı eşleşme algoritması</span>
                </li>
              </ul>
              <Link to="/login" className="text-base font-bold text-primary hover:text-primary/80 transition-colors flex items-center gap-2 w-max relative z-10">
                Profilinizi oluşturun <ArrowRight className="w-5 h-5" />
              </Link>
            </motion.div>
            
            {/* For Employers */}
            <motion.div 
              initial={{ opacity: 0, x: 50 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true, margin: "-100px" }}
              transition={{ duration: 0.7 }}
              className="bg-card backdrop-blur-lg rounded-[32px] p-10 lg:p-14 border border-border shadow-xl relative overflow-hidden group" id="employers"
            >
              <div className="absolute bottom-0 left-0 w-64 h-64 bg-accent/10 rounded-full blur-[80px] translate-y-1/2 -translate-x-1/2 group-hover:bg-accent/20 transition-colors duration-500"></div>
              <div className="inline-flex px-4 py-1.5 bg-secondary/30 rounded-full text-xs text-foreground font-bold mb-6 border border-border shadow-sm relative z-10">Şirketler İçin</div>
              <h2 className="text-3xl lg:text-4xl font-extrabold text-foreground mb-4 relative z-10">İşverenler İçin</h2>
              <p className="text-lg text-muted-foreground mb-8 leading-relaxed relative z-10">İşe alım sürecinizi hızlandırın. Önceden elenmiş adaylar arasında kaydırın ve yetenek havuzunuzu kolayca yönetin.</p>
              <ul className="flex flex-col gap-5 mb-10 relative z-10">
                <li className="flex items-center gap-4">
                  <CheckCircle className="text-primary w-6 h-6 shrink-0" />
                  <span className="text-foreground font-medium text-lg">İşe alım süresini %50 azaltın</span>
                </li>
                <li className="flex items-center gap-4">
                  <CheckCircle className="text-primary w-6 h-6 shrink-0" />
                  <span className="text-foreground font-medium text-lg">Entegre aday yönetimi</span>
                </li>
                <li className="flex items-center gap-4">
                  <CheckCircle className="text-primary w-6 h-6 shrink-0" />
                  <span className="text-foreground font-medium text-lg">Otomatik ilk filtreleme</span>
                </li>
              </ul>
              <Link to="/login" className="text-base font-bold text-primary hover:text-primary/80 transition-colors flex items-center gap-2 w-max relative z-10">
                İlan verin <ArrowRight className="w-5 h-5" />
              </Link>
            </motion.div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="bg-background border-t border-border mt-auto">
        <div className="max-w-[1280px] mx-auto px-5 md:px-20 py-8 flex flex-col md:flex-row justify-between items-center gap-4">
          <div className="flex items-center gap-4">
            <span className="text-xl font-bold text-primary">Collab Swipe</span>
          </div>
          <nav className="flex flex-wrap justify-center gap-6">
            <a className="text-sm text-muted-foreground hover:text-primary transition-colors" href="#">Gizlilik Politikası</a>
            <a className="text-sm text-muted-foreground hover:text-primary transition-colors" href="#">Kullanım Şartları</a>
            <a className="text-sm text-muted-foreground hover:text-primary transition-colors" href="#">İletişim</a>
            <a className="text-sm text-muted-foreground hover:text-primary transition-colors" href="#">Kariyer</a>
          </nav>
          <p className="text-sm text-muted-foreground">
            © 2024 Collab Swipe. Tüm hakları saklıdır.
          </p>
        </div>
      </footer>
    </>
  );
}
