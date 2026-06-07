const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const posts = await prisma.post.findMany({
    include: {
      author: { select: { id: true, name: true, surname: true, image: true, role: true, sector: true, profile: { select: { bio: true } } } },
      likes: {
        where: {
          userId: "kPNblabrw4L4yisRyAxkyq1SjB8Tx4iF"
        }
      },
      originalPost: {
        include: {
          author: { select: { id: true, name: true, surname: true, image: true, role: true, sector: true, profile: { select: { bio: true } } } }
        }
      },
      comments: {
        include: {
          author: { select: { id: true, name: true, surname: true, image: true, role: true, sector: true, profile: { select: { bio: true } } } }
        },
        orderBy: { createdAt: "asc" }
      },
      _count: { select: { likes: true, comments: true, reposts: true } },
    }
  });
  console.dir(posts, { depth: null });
}

main().finally(() => prisma.$disconnect());
