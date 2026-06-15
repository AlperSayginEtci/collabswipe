import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient({
  datasources: {
    db: {
      url: "postgresql://postgres:xIuBQcghskvgpZhKCwZNTGkHikBHpjgg@thomas.proxy.rlwy.net:22228/railway"
    }
  }
});

const firstNames = ['Ali', 'Ayşe', 'Can', 'Elif', 'Burak', 'Zehra', 'Emre', 'Merve', 'Kaan', 'Ceren', 'Onur', 'İrem', 'Deniz', 'Selin', 'Ozan', 'Ece', 'Görkem', 'Ezgi', 'Batuhan', 'Duygu', 'Mert', 'Tuğçe', 'Oğuz', 'Gizem', 'Kerem'];
const lastNames = ['Yılmaz', 'Kaya', 'Demir', 'Şahin', 'Çelik', 'Yıldız', 'Öztürk', 'Aydın', 'Özdemir', 'Arslan', 'Doğan', 'Kılıç', 'Aslan', 'Çetin', 'Kara', 'Koç', 'Kurt', 'Özkan', 'Şimşek', 'Polat', 'Öz', 'Korkmaz', 'Erdoğan', 'Yavuz', 'Can'];
const jobTitles = ['Frontend Developer', 'Backend Developer', 'Full Stack Developer', 'Data Scientist', 'Product Manager', 'UX/UI Designer', 'DevOps Engineer', 'Mobile Developer', 'QA Engineer', 'System Administrator', 'Marketing Manager', 'Content Creator', 'Sales Representative', 'HR Specialist', 'Graphic Designer', 'Business Analyst'];
const skillsList = ['React', 'Node.js', 'Python', 'Figma', 'AWS', 'Docker', 'Kubernetes', 'TypeScript', 'Next.js', 'TailwindCSS', 'SQL', 'MongoDB', 'Go', 'Rust', 'Java', 'Kotlin', 'Swift', 'Flutter', 'React Native'];
const companyNames = ['InnovateX', 'DataFlow', 'CloudSys', 'NextGen Solutions', 'VisionaryTech', 'Pioneer Apps', 'Nexus Corp', 'Stellar AI', 'Quantum Tech', 'Apex Software', 'Horizon Labs', 'Alpha Digital', 'Omega Systems', 'Peak Performance', 'Summit Technologies', 'Crest Solutions', 'Zenith Software', 'Pinnacle Tech', 'Acme Corp', 'Globex', 'Soylent Corp', 'Initech', 'Umbrella Corp', 'Stark Industries', 'Wayne Enterprises'];
const sectors = ['Yazılım', 'Finans', 'Sağlık', 'Eğitim', 'E-ticaret', 'Lojistik', 'Üretim', 'Telekomünikasyon', 'Medya', 'Otomotiv', 'Enerji', 'Perakende', 'Tarım', 'Turizm', 'İnşaat'];
const jobDescriptions = [
  'Ekibimize katılacak deneyimli bir çalışma arkadaşı arıyoruz. Modern teknolojilerle geliştirdiğimiz projelerde yer alarak şirketimizin büyümesine katkıda bulunacaksınız.',
  'Yenilikçi vizyonumuzu paylaşan, öğrenmeye ve kendini geliştirmeye açık takım arkadaşları arıyoruz. Esnek çalışma saatleri ve harika yan haklar sunuyoruz.',
  'Büyüyen ekibimiz için dinamik, sorumluluk sahibi ve takım çalışmasına yatkın profesyoneller arıyoruz. Uluslararası projelerde yer alma fırsatı!',
  'Sektöründe öncü şirketimizde kariyerinize yön verin. Güçlü altyapımız ve vizyoner projelerimizle geleceği birlikte inşa edelim.'
];
const postContents = [
  'Bugün harika bir projeyi tamamladık! Ekip çalışmasının önemini bir kez daha anladım. #başarı #takımçalışması',
  'Yeni bir teknoloji öğrenmek her zaman heyecan verici. Son günlerde bu konuya odaklandım ve sonuçlardan çok memnunum.',
  'Sektördeki son gelişmeleri takip etmek başarı için kritik öneme sahip. Sürekli öğrenme ve adaptasyon şart.',
  'Harika bir haftayı geride bıraktık. Önümüzdeki hafta için hedeflerimizi belirledik ve sabırsızlıkla çalışmaya başlamayı bekliyoruz.',
  'Kariyer yolculuğumda yeni bir sayfa açıyorum. Destekleyen herkese teşekkürler!',
  'Yeni bir iş arayışındayım. İlgilenenler profilime göz atabilir.'
];
const companyPostContents = [
  'Şirketimiz hızla büyümeye devam ediyor! Yeni yetenekleri ekibimizde görmekten mutluluk duyarız.',
  'Son ürünümüzü duyurmaktan gurur duyuyoruz. Müşterilerimize en iyi deneyimi sunmak için çalışıyoruz.',
  'Sektör lideri olarak yenilikçi çözümler sunmaya devam ediyoruz. Bizi takip etmeye devam edin!',
  'Harika bir ekip etkinliği gerçekleştirdik. Takım ruhumuz her geçen gün güçleniyor.',
  'Yeni ofisimize taşındık! Daha modern ve ferah bir çalışma ortamıyla ekibimizin motivasyonunu artırmayı hedefliyoruz.'
];

function getRandomElement(arr: any[]) {
  return arr[Math.floor(Math.random() * arr.length)];
}

function getRandomElements(arr: any[], count: number) {
  const shuffled = arr.slice().sort(() => 0.5 - Math.random());
  return shuffled.slice(0, count);
}

async function main() {
  console.log('20 Kullanıcı ve 20 Şirket oluşturuluyor...');

  // Create 20 Users
  for (let i = 0; i < 20; i++) {
    const fn = getRandomElement(firstNames);
    const ln = getRandomElement(lastNames);
    const title = getRandomElement(jobTitles);
    const email = `mockuser_${Date.now()}_${i}@example.com`;

    const user = await prisma.user.create({
      data: {
        name: fn,
        surname: ln,
        email: email,
        role: 'user',
        image: `https://ui-avatars.com/api/?name=${fn}+${ln}&background=random`,
        profile: {
          create: {
            bio: `${title} olarak çalışıyorum. Yeni teknolojileri öğrenmeyi ve uygulamayı seviyorum.`,
            location: 'İstanbul, Türkiye',
            workingFields: getRandomElements(skillsList, 3),
            experiences: {
              create: [
                {
                  title: title,
                  corp: getRandomElement(companyNames),
                  type: 'WORK',
                  locType: 'HYBRID',
                  startDate: new Date(2020 + Math.floor(Math.random() * 4), Math.floor(Math.random() * 12), 1),
                  desc: 'Bu şirkette harika projelere imza attık.',
                }
              ]
            },
            educations: {
              create: [
                {
                  instName: 'Örnek Üniversitesi',
                  instDegree: 'Lisans',
                  instProgram: 'Mühendislik',
                  startDate: new Date('2015-09-01'),
                  endDate: new Date('2019-06-01'),
                }
              ]
            }
          }
        },
        posts: {
          create: [
            {
              content: getRandomElement(postContents)
            }
          ]
        }
      }
    });

    // Add skills
    const userSkills = getRandomElements(skillsList, Math.floor(Math.random() * 3) + 2);
    for (const skill of userSkills) {
      let dbSkill = await prisma.skill.findUnique({ where: { skillName: skill } });
      if (!dbSkill) {
        dbSkill = await prisma.skill.create({ data: { skillName: skill } });
      }
      const profile = await prisma.profile.findUnique({ where: { userId: user.id } });
      if (profile) {
        await prisma.userSkill.create({
          data: {
            profileId: profile.id,
            skillId: dbSkill.skillId
          }
        });
      }
    }
  }
  console.log('20 Kullanıcı başarıyla oluşturuldu.');

  // Create 20 Companies
  for (let i = 0; i < 20; i++) {
    const cName = getRandomElement(companyNames) + ' ' + (Math.floor(Math.random() * 1000));
    const sector = getRandomElement(sectors);
    const email = `mockcompany_${Date.now()}_${i}@example.com`;

    const user = await prisma.user.create({
      data: {
        name: cName,
        surname: 'A.Ş.',
        email: email,
        role: 'company',
        sector: sector,
        image: `https://ui-avatars.com/api/?name=${encodeURIComponent(cName)}&background=random`,
        profile: {
          create: {
            bio: `${sector} sektöründe öncü bir şirketiz. İnovasyon ve teknoloji odaklı çözümler sunuyoruz.`,
            location: 'İstanbul, Türkiye',
            workingFields: [sector],
          }
        },
        posts: {
          create: [
            {
              content: getRandomElement(companyPostContents)
            }
          ]
        }
      }
    });

    // Create Jobs for Company
    const jobCount = Math.floor(Math.random() * 3) + 1; // 1 to 3 jobs
    for (let j = 0; j < jobCount; j++) {
      const jTitle = getRandomElement(jobTitles);
      const reqs = getRandomElements(skillsList, 2);
      
      const jobPosting = await prisma.jobPosting.create({
        data: {
          publisherId: user.id,
          title: jTitle,
          description: getRandomElement(jobDescriptions),
          type: Math.random() > 0.5 ? 'CORPORATE' : 'FREELANCE',
        }
      });

      for (const req of reqs) {
        let skill = await prisma.skill.findUnique({ where: { skillName: req } });
        if (!skill) skill = await prisma.skill.create({ data: { skillName: req } });
        await prisma.jobPosting.update({
          where: { id: jobPosting.id },
          data: {
            requirements: { connect: { skillId: skill.skillId } }
          }
        });
      }
    }
  }
  console.log('20 Şirket ve ilanları başarıyla oluşturuldu.');

  console.log('Tüm işlemler başarıyla tamamlandı!');
}

main().catch(console.error).finally(() => prisma.$disconnect());
