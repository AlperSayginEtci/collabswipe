import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
  // Let's create a user directly bypassing better-auth to see if Prisma handles it
  // Wait, I already tested Better Auth's API and it worked!
  // In test2.ts, test_company_2@test.com was created with role: 'company'!
  // Let me check if test_company_2@test.com has role: 'company' in the database!
  const u = await prisma.user.findUnique({ where: { email: 'test_company_2@test.com' } });
  console.log(u);
}

main().finally(() => prisma.$disconnect());
