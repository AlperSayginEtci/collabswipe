import { createFileRoute, Link } from '@tanstack/react-router';
import { Info, Target, Users, Zap, Shield, ArrowLeft } from 'lucide-react';

export const Route = createFileRoute('/about')({
  component: AboutPage,
});

function AboutPage() {
  return (
    <div className="max-w-4xl mx-auto py-12 px-6 animate-in fade-in duration-500">
      <Link to="/" className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground mb-8 transition-colors group font-semibold text-sm">
        <div className="p-2 rounded-full bg-muted/50 group-hover:bg-muted transition-colors">
          <ArrowLeft className="w-4 h-4" />
        </div>
        Ana Sayfaya Dön
      </Link>

      <div className="bg-card/80 backdrop-blur-xl border border-border/60 rounded-[2.5rem] p-8 md:p-14 shadow-2xl shadow-shadow/5">
        
        {/* Header Section */}
        <div className="flex flex-col items-center text-center space-y-6 mb-16">
          <div className="w-24 h-24 bg-gradient-to-br from-teal-400/20 to-emerald-500/20 text-teal-600 rounded-3xl flex items-center justify-center shadow-inner border border-teal-500/20">
            <Info className="w-10 h-10" />
          </div>
          <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight text-foreground bg-clip-text text-transparent bg-gradient-to-r from-foreground to-foreground/70">
            CollabSwipe Hakkında
          </h1>
          <p className="text-lg md:text-xl text-muted-foreground max-w-2xl leading-relaxed">
            Profesyonelleri bir araya getiren, yeni nesil iş ağı ve proje odaklı işbirliği platformu.
          </p>
        </div>

        <div className="space-y-16">
          {/* Mission Section */}
          <section className="space-y-6">
            <div className="flex items-center gap-3 border-b border-border/50 pb-4">
              <Target className="w-6 h-6 text-primary" />
              <h2 className="text-2xl md:text-3xl font-bold text-foreground">Amacımız</h2>
            </div>
            <p className="text-foreground/80 leading-relaxed text-[17px] md:text-lg">
              CollabSwipe, yetenekli bireyleri, yenilikçi şirketleri ve vizyoner profesyonelleri tek bir çatı altında toplamayı hedefler. Amacımız, insanların doğru projelere, doğru yeteneklere ve doğru kariyer fırsatlarına en hızlı ve etkili şekilde ulaşmasını sağlamaktır. Klasik özgeçmişlerin ve karmaşık arayüzlerin ötesine geçerek, insanların potansiyellerini doğrudan işbirlikleri ve somut projelerle gösterebilecekleri dinamik bir ekosistem yaratıyoruz.
            </p>
          </section>

          {/* Features Section */}
          <section className="space-y-6">
            <div className="flex items-center gap-3 border-b border-border/50 pb-4">
              <Zap className="w-6 h-6 text-primary" />
              <h2 className="text-2xl md:text-3xl font-bold text-foreground">Neler Sunuyoruz?</h2>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2">
              <div className="bg-muted/30 p-6 md:p-8 rounded-3xl border border-border/40 hover:border-primary/30 transition-colors group">
                <h3 className="font-bold text-xl text-foreground mb-3 flex items-center gap-2 group-hover:text-primary transition-colors">
                  <Zap className="w-5 h-5 text-amber-500" />
                  Hızlı Eşleşme
                </h3>
                <p className="text-muted-foreground leading-relaxed">
                  İhtiyaç duyduğunuz yeteneği veya katılmak istediğiniz projeyi bulmak için akıllı algoritmalarımızdan faydalanın. Sağa kaydırın ve işbirliğine hemen başlayın.
                </p>
              </div>
              <div className="bg-muted/30 p-6 md:p-8 rounded-3xl border border-border/40 hover:border-primary/30 transition-colors group">
                <h3 className="font-bold text-xl text-foreground mb-3 flex items-center gap-2 group-hover:text-primary transition-colors">
                  <Users className="w-5 h-5 text-blue-500" />
                  Canlı Topluluk
                </h3>
                <p className="text-muted-foreground leading-relaxed">
                  Ağınızdaki kişilerin neler üzerinde çalıştığını görün, fikirlerinizi paylaşın, gönderileri destekleyin ve sektörel gelişmeleri anında takip edin.
                </p>
              </div>
              <div className="bg-muted/30 p-6 md:p-8 rounded-3xl border border-border/40 hover:border-primary/30 transition-colors group">
                <h3 className="font-bold text-xl text-foreground mb-3 flex items-center gap-2 group-hover:text-primary transition-colors">
                  <Target className="w-5 h-5 text-teal-500" />
                  Zengin Profiller
                </h3>
                <p className="text-muted-foreground leading-relaxed">
                  Portföyünüzü, önceki işbirliklerinizi ve becerilerinizi ön plana çıkaran interaktif profiller oluşturun. Kendinizi en etkili şekilde ifade edin.
                </p>
              </div>
              <div className="bg-muted/30 p-6 md:p-8 rounded-3xl border border-border/40 hover:border-primary/30 transition-colors group">
                <h3 className="font-bold text-xl text-foreground mb-3 flex items-center gap-2 group-hover:text-primary transition-colors">
                  <Shield className="w-5 h-5 text-emerald-500" />
                  Güvenli İletişim
                </h3>
                <p className="text-muted-foreground leading-relaxed">
                  Bağlantı kurduğunuz profesyonellerle anında ve güvenli bir şekilde mesajlaşın, proje detaylarını platformdan ayrılmadan rahatça konuşun.
                </p>
              </div>
            </div>
          </section>

          {/* Values Section */}
          <section className="space-y-6">
            <div className="flex items-center gap-3 border-b border-border/50 pb-4">
              <Shield className="w-6 h-6 text-primary" />
              <h2 className="text-2xl md:text-3xl font-bold text-foreground">Değerlerimiz</h2>
            </div>
            <ul className="grid grid-cols-1 md:grid-cols-2 gap-4 text-foreground/80 text-[16px] leading-relaxed">
              <li className="flex gap-3 bg-card border border-border/40 p-5 rounded-2xl">
                <span className="text-primary font-bold text-xl shrink-0">•</span>
                <div>
                  <strong className="text-foreground block mb-1">Şeffaflık</strong>
                  <span className="text-muted-foreground text-sm">Tüm işbirlikleri ve fırsatlar için açık ve net bir iletişim ortamı sağlarız.</span>
                </div>
              </li>
              <li className="flex gap-3 bg-card border border-border/40 p-5 rounded-2xl">
                <span className="text-primary font-bold text-xl shrink-0">•</span>
                <div>
                  <strong className="text-foreground block mb-1">Yenilikçilik</strong>
                  <span className="text-muted-foreground text-sm">Geleneksel işe alım ve ağ kurma süreçlerini yıkarak modern çözümler üretiriz.</span>
                </div>
              </li>
              <li className="flex gap-3 bg-card border border-border/40 p-5 rounded-2xl">
                <span className="text-primary font-bold text-xl shrink-0">•</span>
                <div>
                  <strong className="text-foreground block mb-1">Güven</strong>
                  <span className="text-muted-foreground text-sm">Kullanıcılarımızın veri gizliliğini korur, güvenilir bir topluluk oluştururuz.</span>
                </div>
              </li>
              <li className="flex gap-3 bg-card border border-border/40 p-5 rounded-2xl">
                <span className="text-primary font-bold text-xl shrink-0">•</span>
                <div>
                  <strong className="text-foreground block mb-1">Çeşitlilik</strong>
                  <span className="text-muted-foreground text-sm">Her sektörden insanların bir araya gelip sinerji yaratmasını destekleriz.</span>
                </div>
              </li>
            </ul>
          </section>
        </div>

        {/* Footer */}
        <div className="mt-16 text-center pt-10 border-t border-border/40">
          <p className="text-lg text-foreground/90 font-medium mb-4">
            Bize katılın ve geleceğin projelerini birlikte inşa edelim!
          </p>
          <div className="inline-block px-6 py-2 bg-primary/10 text-primary rounded-full font-bold tracking-wide">
            CollabSwipe Ekibi
          </div>
        </div>
      </div>
    </div>
  );
}
