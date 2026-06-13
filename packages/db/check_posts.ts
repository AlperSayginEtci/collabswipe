import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();
async function main() {
  // Fix isShadowbanned NULL values for all users
  const result = await prisma.user.updateMany({
    where: { isShadowbanned: null as any },
    data: { isShadowbanned: false },
  });
  console.log('Fixed isShadowbanned NULL for users:', result.count);

  // Check total posts and their status
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
      author: { select: { id: true, email: true, isShadowbanned: true } }
    }
  });
  console.log('Last 5 posts:');
  posts.forEach(p => {
    console.log(` - id: ${p.id.substring(0,8)}, content: "${p.content?.substring(0,20)}", mediaUrl: ${p.mediaUrl ? 'YES' : 'NO'}, banned: ${p.isBanned}, quarantined: ${p.isQuarantined}, author_shadowbanned: ${p.author?.isShadowbanned}`);
  });

  const totalPosts = await prisma.post.count();
  const bannedPosts = await prisma.post.count({ where: { isBanned: true } });
  const quarantinedPosts = await prisma.post.count({ where: { isQuarantined: true } });
  console.log(`\nTotal: ${totalPosts}, Banned: ${bannedPosts}, Quarantined: ${quarantinedPosts}`);

  await prisma.$disconnect();
}
main().catch(console.error);
