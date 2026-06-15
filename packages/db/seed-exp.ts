import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient({
  datasources: {
    db: {
      url: "postgresql://postgres:xIuBQcghskvgpZhKCwZNTGkHikBHpjgg@thomas.proxy.rlwy.net:22228/railway"
    }
  }
});

async function main() {
  console.log('Deneyim ve eğitim verileri ekleniyor...');

  const users = [
    { email: 'ahmet.yilmaz.mock@example.com', role: 'user' },
    { email: 'zeynep.kaya.mock@example.com', role: 'user' }
  ];

  for (const u of users) {
    const user = await prisma.user.findUnique({ where: { email: u.email }, include: { profile: true } });
    if (user && user.profile) {
      if (u.email === 'ahmet.yilmaz.mock@example.com') {
        await prisma.experience.create({
          data: {
            profileId: user.profile.id,
            title: 'Senior Frontend Developer',
            corp: 'TechNova',
            type: 'WORK',
            locType: 'REMOTE',
            startDate: new Date('2021-06-01'),
            desc: 'React ve Next.js kullanarak yüksek performanslı e-ticaret altyapıları geliştirdim.',
          }
        });
        await prisma.education.create({
          data: {
            profileId: user.profile.id,
            instName: 'Orta Doğu Teknik Üniversitesi',
            instDegree: 'Lisans',
            instProgram: 'Bilgisayar Mühendisliği',
            startDate: new Date('2015-09-01'),
            endDate: new Date('2019-06-01'),
          }
        });
        await prisma.certificate.create({
          data: {
            profileId: user.profile.id,
            title: 'AWS Certified Developer',
            org: 'Amazon Web Services',
            startDate: new Date('2022-05-15'),
            competencyURL: 'https://aws.amazon.com',
          }
        });
      } else if (u.email === 'zeynep.kaya.mock@example.com') {
        await prisma.experience.create({
          data: {
            profileId: user.profile.id,
            title: 'Lead UI/UX Designer',
            corp: 'GlobalTech A.Ş.',
            type: 'WORK',
            locType: 'ONSITE',
            startDate: new Date('2020-03-01'),
            desc: 'Mobil ve web platformlarında yüz binlerce kullanıcının kullandığı arayüzleri tasarladım.',
          }
        });
        await prisma.education.create({
          data: {
            profileId: user.profile.id,
            instName: 'Mimar Sinan Güzel Sanatlar Üniversitesi',
            instDegree: 'Lisans',
            instProgram: 'Grafik Tasarımı',
            startDate: new Date('2014-09-01'),
            endDate: new Date('2018-06-01'),
          }
        });
      }
      console.log(`${user.name} kullanıcısına veriler eklendi.`);
    }
  }

  console.log('İşlem tamamlandı!');
}

main().catch(console.error).finally(() => prisma.$disconnect());
