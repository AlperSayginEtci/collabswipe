import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient({
  datasources: {
    db: {
      url: "postgresql://postgres:xIuBQcghskvgpZhKCwZNTGkHikBHpjgg@thomas.proxy.rlwy.net:22228/railway"
    }
  }
});

const companyImages = [
  'https://images.unsplash.com/photo-1560179707-f14e90ef3623?auto=format&fit=crop&w=400&q=80',
  'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?auto=format&fit=crop&w=400&q=80',
  'https://images.unsplash.com/photo-1497366216548-37526070297c?auto=format&fit=crop&w=400&q=80',
  'https://images.unsplash.com/photo-1554469384-e58fac16e23a?auto=format&fit=crop&w=400&q=80',
  'https://images.unsplash.com/photo-1497215728101-856f4ea42174?auto=format&fit=crop&w=400&q=80',
  'https://images.unsplash.com/photo-1542744173-8e7e53415bb0?auto=format&fit=crop&w=400&q=80',
  'https://images.unsplash.com/photo-1522071820081-009f0129c71c?auto=format&fit=crop&w=400&q=80',
  'https://images.unsplash.com/photo-1556761175-4b46a572b786?auto=format&fit=crop&w=400&q=80',
  'https://images.unsplash.com/photo-1517048676732-d65bc937f952?auto=format&fit=crop&w=400&q=80',
  'https://images.unsplash.com/photo-1573164713988-8665fc963095?auto=format&fit=crop&w=400&q=80',
  'https://images.unsplash.com/photo-1497366754035-f200968a6e72?auto=format&fit=crop&w=400&q=80',
  'https://images.unsplash.com/photo-1504384308090-c894fdcc538d?auto=format&fit=crop&w=400&q=80'
];

async function main() {
  const users = await prisma.user.findMany({
    where: {
      email: {
        startsWith: 'mockuser_'
      }
    }
  });

  for (let i = 0; i < users.length; i++) {
    const user = users[i];
    const gender = Math.random() > 0.5 ? 'men' : 'women';
    const picId = Math.floor(Math.random() * 90) + 1;
    const imageUrl = `https://randomuser.me/api/portraits/${gender}/${picId}.jpg`;
    
    await prisma.user.update({
      where: { id: user.id },
      data: { image: imageUrl }
    });
  }
  console.log(`${users.length} kullanıcının fotoğrafı güncellendi.`);

  const companies = await prisma.user.findMany({
    where: {
      email: {
        startsWith: 'mockcompany_'
      }
    }
  });

  for (let i = 0; i < companies.length; i++) {
    const company = companies[i];
    const imageUrl = companyImages[i % companyImages.length];
    
    await prisma.user.update({
      where: { id: company.id },
      data: { image: imageUrl }
    });
  }
  console.log(`${companies.length} şirketin fotoğrafı güncellendi.`);
}

main().catch(console.error).finally(() => prisma.$disconnect());
