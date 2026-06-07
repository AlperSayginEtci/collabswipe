import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  console.log("🚀 Starting Matching Algorithm Test...");
  
  // 1. Create a dummy company user and job postings
  const company = await prisma.user.create({
    data: {
      email: `company_${Date.now()}@test.com`,
      name: "Tech Corp",
      role: "company",
      banned: false,
      emailVerified: true,
      postedJobs: {
        create: [
          {
            title: "Frontend Developer",
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
            title: "Backend Developer",
            description: "Need someone good at Node.js and Databases.",
            type: "CORPORATE",
            requirements: {
              connectOrCreate: [
                { where: { skillName: "node.js" }, create: { skillName: "node.js" } },
                { where: { skillName: "sql" }, create: { skillName: "sql" } }
              ]
            }
          },
          {
            title: "Fullstack Ninja",
            description: "React, Node, Typescript.",
            type: "CORPORATE",
            requirements: {
              connectOrCreate: [
                { where: { skillName: "react" }, create: { skillName: "react" } },
                { where: { skillName: "node.js" }, create: { skillName: "node.js" } },
                { where: { skillName: "typescript" }, create: { skillName: "typescript" } }
              ]
            }
          }
        ]
      }
    }
  });

  // 2. Create a dummy user profile with "react" and "typescript"
  const applicant = await prisma.user.create({
    data: {
      email: `applicant_${Date.now()}@test.com`,
      name: "React Dev",
      role: "user",
      banned: false,
      emailVerified: true,
      profile: {
        create: {
          profileName: "React Dev Profile",
          skills: {
            create: [
              { skill: { connectOrCreate: { where: { skillName: "react" }, create: { skillName: "react" } } } },
              { skill: { connectOrCreate: { where: { skillName: "typescript" }, create: { skillName: "typescript" } } } }
            ]
          }
        }
      }
    }
  });

  console.log(`✅ Dummy data created.\n   Company ID: ${company.id}\n   Applicant ID: ${applicant.id}\n`);

  // 3. Test the matching algorithm logic directly
  console.log("🔍 Fetching jobs and applying Matching Algorithm for Applicant...");
  const userId = applicant.id;
  
  // Same logic as our jobRouter.list
  let userSkills = new Set<string>();
  if (userId) {
    const profile = await prisma.profile.findUnique({
      where: { userId },
      include: { skills: { select: { skill: { select: { skillName: true } } } } }
    });
    if (profile?.skills) {
      profile.skills.forEach((s: any) => {
        if (s.skill?.skillName) userSkills.add(s.skill.skillName.toLowerCase());
      });
    }
  }
  
  console.log(`💡 Applicant's Skills: [${Array.from(userSkills).join(", ")}]`);

  const allJobs = await prisma.jobPosting.findMany({
    orderBy: { createdAt: "desc" },
    include: {
      publisher: { select: { id: true, name: true, surname: true, image: true } },
      requirements: { select: { skillName: true } },
      _count: { select: { applications: true } },
    },
  });

  const jobsWithScores = allJobs.map((job: any) => {
    let matchScore = 0;
    if (userSkills.size > 0 && job.requirements) {
      matchScore = job.requirements.filter((req: any) => req.skillName && userSkills.has(req.skillName.toLowerCase())).length;
    }
    return { ...job, matchScore };
  });

  jobsWithScores.sort((a: any, b: any) => {
    if (b.matchScore !== a.matchScore) {
      return b.matchScore - a.matchScore;
    }
    return b.createdAt.getTime() - a.createdAt.getTime();
  });

  console.log("\n=== 🎯 MATCHING RESULTS ===");
  jobsWithScores.forEach((job: any, index: number) => {
    const matchPrefix = job.matchScore > 0 ? "✨" : "  ";
    console.log(`${matchPrefix} ${index + 1}. [Score: ${job.matchScore}] ${job.title}`);
    console.log(`      Required Skills: ${job.requirements.map((r: any) => r.skillName).join(', ')}`);
  });

  // 4. Cleanup
  console.log("\n🧹 Cleaning up dummy data...");
  await prisma.user.delete({ where: { id: company.id } });
  await prisma.user.delete({ where: { id: applicant.id } });
  console.log("✅ Cleanup done. Test Finished.");
}

main().catch(console.error).finally(() => prisma.$disconnect());
