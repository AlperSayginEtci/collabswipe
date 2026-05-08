const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function main() {
  // Ensure the mock employer exists
  const employer = await prisma.user.upsert({
    where: { email: 'employer@collabswipe.com' },
    update: {},
    create: {
      id: 'mock-employer-id',
      email: 'employer@collabswipe.com',
      name: 'Google',
      surname: 'Inc.',
    },
  });

  // Ensure the mock mobile user exists (for application)
  const mobileUser = await prisma.user.upsert({
    where: { email: 'mobile-user@collabswipe.com' },
    update: {},
    create: {
      id: 'mock-mobile-user',
      email: 'mobile-user@collabswipe.com',
      name: 'Oguz',
      surname: 'Sonmezer',
    },
  });

  console.log('Mock users verified.');

  // Create mock jobs if they do not exist
  const existingJobsCount = await prisma.jobPosting.count();
  if (existingJobsCount === 0) {
    await prisma.jobPosting.createMany({
      data: [
        {
          id: 'job-1',
          publisherId: 'mock-employer-id',
          title: 'Senior React Native Developer',
          description: 'We are looking for an experienced developer to join our mobile team. Experience with Expo, Reanimated, and TypeScript is a must.',
          type: 'CORPORATE',
        },
        {
          id: 'job-2',
          publisherId: 'mock-employer-id',
          title: 'Fullstack Next.js Developer',
          description: 'Looking for a freelance developer to help us build a beautiful dashboard using Tailwind CSS and tRPC.',
          type: 'FREELANCE',
        },
        {
          id: 'job-3',
          publisherId: 'mock-employer-id',
          title: 'UI/UX Designer',
          description: 'Help us design beautiful interfaces for our web and mobile applications.',
          type: 'CORPORATE',
        },
      ],
    });
    console.log('Mock jobs successfully seeded.');
  } else {
    console.log('Jobs already exist in the database.');
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
