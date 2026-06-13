const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
async function main() {
  // Check total posts
  const totalPosts = await prisma.post.count();
  console.log('Total posts:', totalPosts);

  // Check users with isShadowbanned issues
  const users = await prisma.user.findMany({
    select: { id: true, email: true, isShadowbanned: true }
  });
  console.log('Users:');
  users.forEach(u => console.log(` - ${u.email}: isShadowbanned=${u.isShadowbanned}`));

  // Fix NULL isShadowbanned
  const raw = await prisma.$executeRaw`UPDATE "User" SET "isShadowbanned" = false WHERE "isShadowbanned" IS NULL`;
  console.log('Fixed NULL isShadowbanned rows:', raw);

  // Last 5 posts
  const posts = await prisma.post.findMany({
    orderBy: { createdAt: 'desc' },
    take: 5,
    select: {
      id: true,
      content: true,
      mediaUrl: true,
      isBanned: true,
      isQuarantined: true,
      authorId: true,
      createdAt: true,
    }
  });
  console.log('Last 5 posts:');
  posts.forEach(p => {
    console.log(` - "${p.content.substring(0,30)}", mediaUrl: ${p.mediaUrl ? p.mediaUrl.substring(0,40) : 'null'}, banned:${p.isBanned}, quarantined:${p.isQuarantined}`);
  });

  await prisma.$disconnect();
}
main().catch(e => { console.error(e); process.exit(1); });
