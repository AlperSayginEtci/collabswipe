import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
  const posts = await prisma.post.findMany({
    include: {
      comments: {
        include: {
          author: { select: { id: true, name: true, surname: true } }
        }
      },
      _count: true
    }
  });
  console.dir(posts, { depth: null });
}

main().finally(() => prisma.$disconnect());
