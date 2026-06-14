import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('Admin hesapları güncelleniyor...');
  const admins = ['collabswipe@collabswipe.com', 'oggy4469@gmail.com', 'alper@gmail.com'];
  
  for (const email of admins) {
    await prisma.user.updateMany({
      where: { email },
      data: { role: 'admin' },
    });
    console.log(`${email} admin yapıldı (eğer kayıtlıysa).`);
  }

  console.log('\nSahte Kullanıcılar oluşturuluyor...');
  const dummyUsers = [
    {
      name: 'Ahmet',
      surname: 'Yılmaz',
      email: 'ahmet.yilmaz.mock@example.com',
      image: 'https://images.unsplash.com/photo-1599566150163-29194dcaad36?auto=format&fit=crop&w=400&q=80',
      role: 'user',
      bio: 'Full Stack Developer | React & Node.js tutkunu. Yeni teknolojiler öğrenmeyi ve açık kaynak projelere katkıda bulunmayı seviyorum.',
      location: 'İstanbul, Türkiye',
      workingFields: ['Yazılım Geliştirme', 'Web Programlama'],
      skills: ['React', 'Node.js', 'TypeScript', 'SQL']
    },
    {
      name: 'Zeynep',
      surname: 'Kaya',
      email: 'zeynep.kaya.mock@example.com',
      image: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=400&q=80',
      role: 'user',
      bio: 'UI/UX Tasarımcısı. Kullanıcı odaklı dijital deneyimler tasarlıyorum. Renkler ve tipografi ile oynamak en sevdiğim şey.',
      location: 'İzmir, Türkiye',
      workingFields: ['Tasarım', 'UI/UX'],
      skills: ['Figma', 'Adobe Photoshop', 'UI/UX Tasarımı', 'İletişim']
    }
  ];

  for (const u of dummyUsers) {
    let user = await prisma.user.findUnique({ where: { email: u.email } });
    if (!user) {
      user = await prisma.user.create({
        data: {
          name: u.name,
          surname: u.surname,
          email: u.email,
          image: u.image,
          role: u.role,
        }
      });
      
      const profile = await prisma.profile.create({
        data: {
          userId: user.id,
          bio: u.bio,
          location: u.location,
          workingFields: u.workingFields,
        }
      });

      for (const s of u.skills) {
        let skill = await prisma.skill.findUnique({ where: { skillName: s } });
        if (!skill) skill = await prisma.skill.create({ data: { skillName: s } });
        await prisma.userSkill.create({
          data: { profileId: profile.id, skillId: skill.skillId }
        });
      }
      
      await prisma.post.create({
        data: {
          authorId: user.id,
          content: `Herkese merhaba! collabswipe'a yeni katıldım. ${u.workingFields.join(', ')} alanlarında çalışıyorum. Tanıştığımıza memnun oldum!`,
        }
      });
      console.log(`${u.name} kullanıcısı oluşturuldu.`);
    }
  }

  console.log('\nSahte Şirketler (İşverenler) oluşturuluyor...');
  const dummyCompanies = [
    {
      name: 'TechNova',
      surname: 'Yazılım Çözümleri',
      email: 'hr@technova.mock.com',
      image: 'https://images.unsplash.com/photo-1560179707-f14e90ef3623?auto=format&fit=crop&w=400&q=80',
      role: 'company',
      sector: 'Bilişim Teknolojileri',
      bio: 'TechNova olarak kurumların dijital dönüşüm süreçlerine liderlik ediyoruz. İnovatif yazılım çözümleri üretiyoruz.',
      location: 'Ankara, Türkiye',
      jobs: [
        {
          title: 'Senior Frontend Developer',
          description: 'React ve modern web teknolojilerinde en az 4 yıl deneyimli takım arkadaşı arıyoruz. Güçlü problem çözme yeteneğine sahip olmalısınız.',
          type: 'CORPORATE' as any,
          reqs: ['React', 'TypeScript', 'Tailwind CSS']
        },
        {
          title: 'Freelance UI Designer',
          description: 'Yeni mobil uygulamamızın arayüzlerini tasarlayacak yetenekli bir freelance tasarımcı arıyoruz.',
          type: 'FREELANCE' as any,
          reqs: ['Figma', 'UI/UX Tasarımı']
        }
      ]
    },
    {
      name: 'GlobalTech',
      surname: 'A.Ş.',
      email: 'info@globaltech.mock.com',
      image: 'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?auto=format&fit=crop&w=400&q=80',
      role: 'company',
      sector: 'E-Ticaret',
      bio: 'Türkiye\'nin hızla büyüyen e-ticaret altyapı sağlayıcısı.',
      location: 'İstanbul, Türkiye',
      jobs: [
        {
          title: 'Backend Engineer (Node.js)',
          description: 'Mikroservis mimarisinde tecrübeli Node.js geliştiricisi arıyoruz. High-traffic sistemlerde deneyim şarttır.',
          type: 'CORPORATE' as any,
          reqs: ['Node.js', 'PostgreSQL', 'Redis', 'Docker']
        }
      ]
    }
  ];

  for (const c of dummyCompanies) {
    let company = await prisma.user.findUnique({ where: { email: c.email } });
    if (!company) {
      company = await prisma.user.create({
        data: {
          name: c.name,
          surname: c.surname,
          email: c.email,
          image: c.image,
          role: c.role,
          sector: c.sector
        }
      });
      
      const profile = await prisma.profile.create({
        data: {
          userId: company.id,
          bio: c.bio,
          location: c.location,
        }
      });

      for (const job of c.jobs) {
        const jobPosting = await prisma.jobPosting.create({
          data: {
            publisherId: company.id,
            title: job.title,
            description: job.description,
            type: job.type,
          }
        });

        for (const req of job.reqs) {
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

      await prisma.post.create({
        data: {
          authorId: company.id,
          content: `${c.name} olarak yeni yetenekler arıyoruz! İlanlarımıza göz atmayı unutmayın.`,
        }
      });

      console.log(`${c.name} şirketi oluşturuldu ve ilanları eklendi.`);
    }
  }

  console.log('Tüm işlemler tamamlandı!');
}

main().catch(console.error).finally(() => prisma.$disconnect());
