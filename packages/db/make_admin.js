const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const user = await prisma.user.findFirst({
    where: { email: { contains: 'oggy4469@gmail' } }
  });
  
  if (user) {
    const updated = await prisma.user.update({
      where: { id: user.id },
      data: { role: 'admin' }
    });
    console.log(`Successfully updated ${updated.email} to admin. Name: ${updated.name} ${updated.surname}`);
  } else {
    console.log(`User not found.`);
  }
}

main()
  .catch(e => { console.error(e); process.exit(1); })
  .finally(async () => { await prisma.$disconnect(); });
