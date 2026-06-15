import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();
prisma.user.findMany({select: {image: true}}).then(u => console.log(JSON.stringify(u, null, 2))).finally(() => prisma.$disconnect());
