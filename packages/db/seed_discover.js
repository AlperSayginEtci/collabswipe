const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

const MOCK_PROFILES = [
  {
    id: "user-felix",
    email: "felix@collabswipe.com",
    name: "Felix",
    surname: "L.",
    image: "https://api.dicebear.com/7.x/notionists/svg?seed=Felix",
    bio: "Frontend developer transitioning to fullstack. I love building smooth React Native and Next.js applications.",
    location: "Istanbul, Turkey",
    skills: ["React Native", "Next.js", "TypeScript", "Tailwind CSS"]
  },
  {
    id: "user-sarah",
    email: "sarah@collabswipe.com",
    name: "Sarah",
    surname: "Connor",
    image: "https://api.dicebear.com/7.x/notionists/svg?seed=Sarah",
    bio: "DevOps specialist who loves automation and high-availability infrastructure. I eat YAML for breakfast.",
    location: "Izmir, Turkey",
    skills: ["Docker", "Kubernetes", "AWS", "CI/CD"]
  },
  {
    id: "user-alex",
    email: "alex@collabswipe.com",
    name: "Alex",
    surname: "Mercer",
    image: "https://api.dicebear.com/7.x/notionists/svg?seed=Alex",
    bio: "High performance systems and APIs. Experienced with Go, GraphQL, Redis, and WebSockets.",
    location: "Ankara, Turkey",
    skills: ["Go", "Node.js", "PostgreSQL", "Redis"]
  },
  {
    id: "user-lily",
    email: "lily@collabswipe.com",
    name: "Lily",
    surname: "Evans",
    image: "https://api.dicebear.com/7.x/notionists/svg?seed=Lily",
    bio: "Creating delightful and stunning user interfaces. Specializing in component-driven design systems and Figma prototyping.",
    location: "Istanbul, Turkey",
    skills: ["Figma", "UI/UX", "Tailwind CSS", "React"]
  },
  {
    id: "user-john",
    email: "john@collabswipe.com",
    name: "John",
    surname: "Doe",
    image: "https://api.dicebear.com/7.x/notionists/svg?seed=John",
    bio: "Bridging the gap between code and business value. Product manager with an engineering background.",
    location: "Istanbul, Turkey",
    skills: ["Agile", "Scrum", "Product Management", "Analytics"]
  }
];

async function main() {
  console.log('Seeding discoverable profiles...');

  for (const mock of MOCK_PROFILES) {
    // 1. Create or update User
    const user = await prisma.user.upsert({
      where: { email: mock.email },
      update: {
        name: mock.name,
        surname: mock.surname,
        image: mock.image,
      },
      create: {
        id: mock.id,
        email: mock.email,
        name: mock.name,
        surname: mock.surname,
        image: mock.image,
      },
    });

    // 2. Create or update Profile
    const profile = await prisma.profile.upsert({
      where: { userId: user.id },
      update: {
        bio: mock.bio,
        location: mock.location,
      },
      create: {
        userId: user.id,
        bio: mock.bio,
        location: mock.location,
      },
    });

    // 3. Create or associate skills
    for (const skillName of mock.skills) {
      const skill = await prisma.skill.upsert({
        where: { skillName },
        update: {},
        create: { skillName },
      });

      // Ensure UserSkill relation exists
      await prisma.userSkill.upsert({
        where: {
          profileId_skillId: {
            profileId: profile.id,
            skillId: skill.skillId,
          }
        },
        update: {},
        create: {
          profileId: profile.id,
          skillId: skill.skillId,
        }
      });
    }

    console.log(`Successfully seeded user: ${user.name} ${user.surname}`);
  }

  console.log('Seeding finished successfully.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
