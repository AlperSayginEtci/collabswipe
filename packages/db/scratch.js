const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function main() {
  const user = await prisma.user.upsert({
    where: { email: 'mock@example.com' },
    update: {},
    create: {
      id: 'mock-user-id',
      email: 'mock@example.com',
      name: 'Mock',
      surname: 'User',
    },
  });
  console.log('Mock user ensured:', user.id);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
