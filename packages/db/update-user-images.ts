import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient({
  datasources: {
    db: {
      url: "postgresql://postgres:xIuBQcghskvgpZhKCwZNTGkHikBHpjgg@thomas.proxy.rlwy.net:22228/railway"
    }
  }
});

const userImages = [
  "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=800&q=80",
  "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?auto=format&fit=crop&w=800&q=80",
  "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=800&q=80",
  "https://images.unsplash.com/photo-1580489944761-15a19d654956?auto=format&fit=crop&w=800&q=80",
  "https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=800&q=80",
  "https://images.unsplash.com/photo-1531427186611-ecfd6d936c79?auto=format&fit=crop&w=800&q=80",
  "https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=800&q=80",
  "https://images.unsplash.com/photo-1531746020798-e6953c6e8e04?auto=format&fit=crop&w=800&q=80",
  "https://images.unsplash.com/photo-1552058544-f397effc3604?auto=format&fit=crop&w=800&q=80",
  "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=800&q=80",
  "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?auto=format&fit=crop&w=800&q=80",
  "https://images.unsplash.com/photo-1544723795311-608df20a0559?auto=format&fit=crop&w=800&q=80",
  "https://images.unsplash.com/photo-1522075469751-3a6694fb2f61?auto=format&fit=crop&w=800&q=80",
  "https://images.unsplash.com/photo-1566492031773-4f4e44671857?auto=format&fit=crop&w=800&q=80",
  "https://images.unsplash.com/photo-1499952127939-9bbf5af6c51c?auto=format&fit=crop&w=800&q=80",
  "https://images.unsplash.com/photo-1548142813-c348350df52b?auto=format&fit=crop&w=800&q=80",
  "https://images.unsplash.com/photo-1589156280159-27698a70f29e?auto=format&fit=crop&w=800&q=80",
  "https://images.unsplash.com/photo-1508214751196-bcfd4ca60f91?auto=format&fit=crop&w=800&q=80",
  "https://images.unsplash.com/photo-1532073150508-0c1df0221c21?auto=format&fit=crop&w=800&q=80",
  "https://images.unsplash.com/photo-1570295999919-56ceb5ecca61?auto=format&fit=crop&w=800&q=80"
];

async function main() {
  const allUsers = await prisma.user.findMany({
    where: {
      role: 'user'
    }
  });

  const mockUsers = allUsers.filter(u => u.image && (u.image.includes('randomuser.me') || u.image.includes('ui-avatars.com')));

  console.log(`Found ${mockUsers.length} mock users to update.`);

  for (let i = 0; i < mockUsers.length; i++) {
    const user = mockUsers[i];
    const imageUrl = userImages[i % userImages.length];
    await prisma.user.update({
      where: { id: user.id },
      data: { image: imageUrl },
    });
    console.log(`Updated user ${user.name} with ${imageUrl}`);
  }

  // Check ahmet and zeynep
  const testUsers = allUsers.filter(u => ['ahmet.yilmaz@example.com', 'zeynep.kaya@example.com'].includes(u.email));
  for (let i = 0; i < testUsers.length; i++) {
    const user = testUsers[i];
    const imageUrl = userImages[(mockUsers.length + i) % userImages.length];
    await prisma.user.update({
      where: { id: user.id },
      data: { image: imageUrl },
    });
    console.log(`Updated test user ${user.name} with ${imageUrl}`);
  }

  console.log('✅ Done replacing user images!');
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
}).finally(() => {
  prisma.$disconnect();
});
