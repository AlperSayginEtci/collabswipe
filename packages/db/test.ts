import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
  const users = await prisma.user.findMany({ select: { id:true, email:true, role:true, surname:true, sector:true }, orderBy: { createdAt: 'desc' }, take: 5 });
  console.log(users);
}

main().finally(() => prisma.$disconnect());
