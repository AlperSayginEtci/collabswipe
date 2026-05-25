import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
  await prisma.user.updateMany({
    where: { email: { in: ['google@gmail.com', 'meretxd@gmail.com'] } },
    data: { role: 'company', sector: 'Teknoloji' }
  });
  console.log("Updated users to company!");
}

main().finally(() => prisma.$disconnect());
