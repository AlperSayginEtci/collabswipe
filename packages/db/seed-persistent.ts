import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  console.log("Seeding persistent jobs for UI testing...");
  
  const email = `company_ui_${Date.now()}@test.com`;
  
  const company = await prisma.user.create({
    data: {
      email,
      name: "Tech Corp",
      role: "company",
      banned: false,
      emailVerified: true,
      postedJobs: {
        create: [
          {
            title: "Frontend Developer UI Test",
            description: "Need someone good at React and UI.",
            type: "CORPORATE",
            requirements: {
              connectOrCreate: [
                { where: { skillName: "react" }, create: { skillName: "react" } },
                { where: { skillName: "typescript" }, create: { skillName: "typescript" } }
              ]
            }
          },
          {
            title: "Backend Developer UI Test",
            description: "Need someone good at Node.js and Databases.",
            type: "CORPORATE",
            requirements: {
              connectOrCreate: [
                { where: { skillName: "node.js" }, create: { skillName: "node.js" } },
                { where: { skillName: "sql" }, create: { skillName: "sql" } }
              ]
            }
          }
        ]
      }
    }
  });

  console.log("Seeded company and jobs. Company Email:", email);
}

main().catch(console.error).finally(() => prisma.$disconnect());
