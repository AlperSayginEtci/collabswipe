# Collabswipe

Bu proje, bir iş arama ve profesyonel ağ oluşturma platformudur. Turborepo kullanılarak bir monorepo mimarisinde tasarlanmıştır (Geliştirilen uygulamalar: Web, Mobil ve arka planda çalışan API ile DB paketleri).

---

## 🚀 Başlangıç (Frontend Geliştiricileri İçin)

Projeyi bilgisayarınıza indirip hızlıca kodlamaya başlamak için aşağıdaki adımları sırasıyla uygulayın. (Docker sadece arka planda veritabanının ayağa kalkması için gereklidir, veritabanı ayarları hazır durumdadır.)

### 📌 Gereksinimler

- [Node.js](https://nodejs.org/) (v18.x veya üstü önerilir)
- [pnpm](https://pnpm.io/installation) (Paket yöneticisi olarak kullanılıyor `npm install -g pnpm`)
- [Docker & Docker Compose](https://www.docker.com/products/docker-desktop) (Sadece PostgreSQL veritabanını çalıştırmak için lazım)

---v

### Adım 1: Projeyi Klonlayın ve Bağımlılıkları Yükleyin

Öncelikle projeyi GitHub'dan bilgisayarınıza indirin ve gereksinimleri kurun:

```bash
git clone <GITHUB_DEPO_URL_BURAYA_GELECEK>
cd collabswipe
pnpm install
```

### Adım 2: Çevre Değişkenlerini (Environment Variables) Ayarlayın

Projeyi çalıştırabilmek için veritabanı bağlantı bilgilerini içeren bir `.env` dosyasına ihtiyacınız var.

`packages/db` klasörü içinde bir `.env` dosyası oluşturun ve içerisine şunları yazın:

```env
# packages/db/.env
DATABASE_URL="postgresql://user:password@localhost:5432/collabswipe"
```

> Not: Eğer frontend (Next.js) tarafında `apps/web/.env` gibi değişkenler isteniyorsa arkadaşınız buraya sonradan ekleyebilir, ancak mevcut haliyle tRPC bağlantısı yeterli olacaktır.

### Adım 3: Veritabanını Ayağa Kaldırın (Docker ile)

Projenin kök dizininde `docker-compose.yml` bulunuyor. Terminalde kök dizindeyken veritabanını çalıştırın:

```bash
docker-compose up -d
```
(Bu komut arka planda PostgreSQL'i başlatır.)

### Adım 4: Veritabanı Şemasını Eşitleyin (Prisma Push)

Veritabanı oluşturulduktan sonra, tabloların oluşabilmesi için Prisma şemasını veritabanına göndermemiz gerekiyor.

```bash
pnpm --filter db run build
# ya da alternatif olarak:
cd packages/db && npx prisma db push && cd ../..
```

### Adım 5: Projeyi Çalıştırın

Tüm API, DB ve Frontend paketlerini geliştime ortamında (Development) başlatmak için kök dizinde şu komutu çalıştırın:

```bash
pnpm dev
```
Uygulama başarıyla başladıktan sonra web kısmına `http://localhost:3000` üzerinden erişebilirsiniz. (Varsayılan ayarlarda Next.js 3000 portunu kullanır)

---

## 🤖 Antigravity (Yapay Zeka) İle Birlikte Çalışmak

Projeyi indiren kişi kendi IDE'si (Cursor / benzeri editörler) üzerinden Antigravity (AI) eklentisini kullanabilir. Antigravity'ye şu tarz komutlar verebilirsiniz:

- "Şu anda frontend (`apps/web`) üzerinde çalışıyorum, bana x sayfasının tasarımını Tailwind CSS ve shadcn/ui ile yapar mısın?"
- "Veritabanı bağlantı hatası alıyorum, db paketindeki ayarları kontrol eder misin?"

Antigravity, projedeki klasör yapısını (Turborepo olduğunu vb.) otomatik olarak okuyabildiği için direkt geliştirme sürecinize entegre olacaktır. Hiçbir ekstra bir yapay zeka yapılandırma ayarına (özel bağlam vs.) gerek yoktur. AI zaten tüm kodu görebiliyor.
