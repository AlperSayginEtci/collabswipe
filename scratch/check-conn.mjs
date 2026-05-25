import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
  const pending = await prisma.connection.findMany({ where: { status: 'PENDING' } });
  console.log(`Found ${pending.length} pending connections`);
  
  for (const p of pending) {
    const mutual = pending.find(m => m.requesterId === p.addresseeId && m.addresseeId === p.requesterId);
    if (mutual) {
      await prisma.connection.update({
        where: { requesterId_addresseeId: { requesterId: p.requesterId, addresseeId: p.addresseeId } },
        data: { status: 'ACCEPTED' }
      });
      console.log(`Auto-matched ${p.requesterId} and ${p.addresseeId}`);
    }
  }
}
main().catch(console.error).finally(() => prisma.$disconnect());
