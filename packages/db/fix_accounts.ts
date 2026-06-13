import { PrismaClient } from '@prisma/client';
import { auth } from '../auth';

const prisma = new PrismaClient();

async function main() {
  const ctx = await auth.$context;
  if (!ctx.password) {
    throw new Error("Better Auth password helper is not initialized");
  }

  const defaultPassword = "123456";
  const hashedPassword = await ctx.password.hash(defaultPassword);
  console.log(`Generated standard scrypt hash for "${defaultPassword}": ${hashedPassword}`);

  const users = await prisma.user.findMany();
  console.log(`Found ${users.length} users in the database. Fixing accounts...`);

  for (const user of users) {
    console.log(`Processing user: ${user.email} (${user.id})`);

    // 1. credential provider (accountId = user.id)
    const credAccount = await prisma.account.findFirst({
      where: { userId: user.id, providerId: "credential" }
    });

    if (credAccount) {
      await prisma.account.update({
        where: { id: credAccount.id },
        data: { password: hashedPassword, accountId: user.id }
      });
      console.log(`  Updated existing 'credential' account`);
    } else {
      await prisma.account.create({
        data: {
          userId: user.id,
          providerId: "credential",
          accountId: user.id,
          password: hashedPassword
        }
      });
      console.log(`  Created new 'credential' account`);
    }

    // 2. email provider (accountId = user.email)
    const emailAccount = await prisma.account.findFirst({
      where: { userId: user.id, providerId: "email" }
    });

    if (emailAccount) {
      await prisma.account.update({
        where: { id: emailAccount.id },
        data: { password: hashedPassword, accountId: user.email }
      });
      console.log(`  Updated existing 'email' account`);
    } else {
      await prisma.account.create({
        data: {
          userId: user.id,
          providerId: "email",
          accountId: user.email,
          password: hashedPassword
        }
      });
      console.log(`  Created new 'email' account`);
    }
  }

  console.log("=== All user accounts fixed successfully ===");
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
