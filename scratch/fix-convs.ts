import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
  const connections = await prisma.connection.findMany({
    where: { status: 'ACCEPTED' },
  });

  console.log(`Found ${connections.length} accepted connections.`);
  for (const conn of connections) {
    const existing = await prisma.conversation.findMany({
      where: {
        isGroup: false,
        AND: [
          { participants: { some: { userId: conn.requesterId } } },
          { participants: { some: { userId: conn.addresseeId } } },
        ],
      },
    });

    if (existing.length === 0) {
      await prisma.conversation.create({
        data: {
          isGroup: false,
          participants: {
            create: [
              { userId: conn.requesterId },
              { userId: conn.addresseeId },
            ],
          },
        },
      });
      console.log(`Created conversation for ${conn.requesterId} and ${conn.addresseeId}`);
    }
  }
}
main().catch(console.error).finally(() => prisma.$disconnect());
