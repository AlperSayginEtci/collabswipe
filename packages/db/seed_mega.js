const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

const CANDIDATES = [
  {
    id: "seeker-can",
    email: "can@collabswipe.com",
    name: "Can",
    surname: "Yılmaz",
    image: "https://api.dicebear.com/7.x/notionists/svg?seed=Can",
    bio: "AI & Machine Learning Engineer with a deep passion for Neural Networks, NLP, and Computer Vision. Seeking co-founders or high-impact roles.",
    location: "Istanbul, Turkey",
    skills: ["Deep Learning", "Python", "PyTorch", "TensorFlow"]
  },
  {
    id: "seeker-elif",
    email: "elif@collabswipe.com",
    name: "Elif",
    surname: "Demir",
    image: "https://api.dicebear.com/7.x/notionists/svg?seed=Elif",
    bio: "UI/UX Designer who focuses on clean typography, accessible color palettes, and interactive Figma prototypes. 3+ years experience.",
    location: "Izmir, Turkey",
    skills: ["UI/UX", "Figma", "Tailwind CSS", "User Research"]
  },
  {
    id: "seeker-mert",
    email: "mert@collabswipe.com",
    name: "Mert",
    surname: "Kaya",
    image: "https://api.dicebear.com/7.x/notionists/svg?seed=Mert",
    bio: "Go Backend Developer specializing in microservices architecture, gRPC, and high-concurrency systems. Fan of Docker and PostgreSQL.",
    location: "Ankara, Turkey",
    skills: ["Go", "Node.js", "PostgreSQL", "Redis"]
  },
  {
    id: "seeker-zeynep",
    email: "zeynep@collabswipe.com",
    name: "Zeynep",
    surname: "Çelik",
    image: "https://api.dicebear.com/7.x/notionists/svg?seed=Zeynep",
    bio: "Fullstack Engineer comfortable writing React SPAs and scaling REST/GraphQL APIs with Node.js. 4 years of startup experience.",
    location: "Istanbul, Turkey",
    skills: ["React", "Node.js", "TypeScript", "GraphQL"]
  },
  {
    id: "seeker-burak",
    email: "burak@collabswipe.com",
    name: "Burak",
    surname: "Öztürk",
    image: "https://api.dicebear.com/7.x/notionists/svg?seed=Burak",
    bio: "DevOps & Infrastructure Lead. Passionate about automating Kubernetes deployments, writing declarative Terraform, and managing AWS costs.",
    location: "Istanbul, Turkey",
    skills: ["Docker", "Kubernetes", "AWS", "CI/CD"]
  },
  {
    id: "seeker-selin",
    email: "selin@collabswipe.com",
    name: "Selin",
    surname: "Şahin",
    image: "https://api.dicebear.com/7.x/notionists/svg?seed=Selin",
    bio: "Native iOS Developer building high-performance Swift and SwiftUI apps. Focuses on local databases (CoreData/Realm) and fluid UI animations.",
    location: "Izmir, Turkey",
    skills: ["Swift", "React Native", "TypeScript", "User Research"]
  },
  {
    id: "seeker-kaan",
    email: "kaan@collabswipe.com",
    name: "Kaan",
    surname: "Arslan",
    image: "https://api.dicebear.com/7.x/notionists/svg?seed=Kaan",
    bio: "Cybersecurity Analyst and Ethical Hacker. Skilled in API vulnerability auditing, network scanning, and server hardening.",
    location: "Ankara, Turkey",
    skills: ["Penetration Testing", "Go", "PostgreSQL", "Docker"]
  },
  {
    id: "seeker-asli",
    email: "asli@collabswipe.com",
    name: "Aslı",
    surname: "Yıldız",
    image: "https://api.dicebear.com/7.x/notionists/svg?seed=Asli",
    bio: "Technical Product Manager with a strong coding background. Bridging the gap between software engineers and product stakeholders.",
    location: "Istanbul, Turkey",
    skills: ["Product Management", "Agile", "Scrum", "Analytics"]
  },
  {
    id: "seeker-kerem",
    email: "kerem@collabswipe.com",
    name: "Kerem",
    surname: "Koç",
    image: "https://api.dicebear.com/7.x/notionists/svg?seed=Kerem",
    bio: "Frontend Specialist in Vue and Nuxt. Focuses on Jamstack, headless CMS integrations, and search engine optimization (SEO).",
    location: "Bursa, Turkey",
    skills: ["React", "Tailwind CSS", "TypeScript", "Next.js"]
  },
  {
    id: "seeker-melis",
    email: "melis@collabswipe.com",
    name: "Melis",
    surname: "Aydın",
    image: "https://api.dicebear.com/7.x/notionists/svg?seed=Melis",
    bio: "Quality Assurance Engineer. Experienced in creating complete automated testing suites using Selenium, Cypress, and Jest.",
    location: "Istanbul, Turkey",
    skills: ["Cypress", "CI/CD", "TypeScript", "React"]
  },
  {
    id: "seeker-ali",
    email: "ali@collabswipe.com",
    name: "Ali",
    surname: "Vefa",
    image: "https://api.dicebear.com/7.x/notionists/svg?seed=Ali",
    bio: "Data Scientist focusing on predictive modeling and big data analytics. Loves working with Pandas and Scikit-Learn.",
    location: "Ankara, Turkey",
    skills: ["Python", "Data Science", "Machine Learning"]
  },
  {
    id: "seeker-ayse",
    email: "ayse@collabswipe.com",
    name: "Ayşe",
    surname: "Yılmaz",
    image: "https://api.dicebear.com/7.x/notionists/svg?seed=Ayse",
    bio: "Creative Web Developer with an eye for stunning animations. Expert in Three.js and WebGL.",
    location: "Izmir, Turkey",
    skills: ["JavaScript", "Three.js", "WebGL", "CSS"]
  },
  {
    id: "seeker-onur",
    email: "onur@collabswipe.com",
    name: "Onur",
    surname: "Tekin",
    image: "https://api.dicebear.com/7.x/notionists/svg?seed=Onur",
    bio: "Mobile Developer specializing in Flutter. Built over 10 cross-platform apps currently live on App Store and Play Store.",
    location: "Antalya, Turkey",
    skills: ["Flutter", "Dart", "Firebase"]
  },
  {
    id: "seeker-deniz",
    email: "deniz@collabswipe.com",
    name: "Deniz",
    surname: "Karakaya",
    image: "https://api.dicebear.com/7.x/notionists/svg?seed=Deniz",
    bio: "Game Developer working with Unity and C#. Passionate about indie games and virtual reality experiences.",
    location: "Eskişehir, Turkey",
    skills: ["Unity", "C#", "Game Design"]
  },
  {
    id: "seeker-emre",
    email: "emre@collabswipe.com",
    name: "Emre",
    surname: "Çoban",
    image: "https://api.dicebear.com/7.x/notionists/svg?seed=Emre",
    bio: "Blockchain Engineer with a focus on smart contracts and DeFi protocols. Solidity and Rust enthusiast.",
    location: "Istanbul, Turkey",
    skills: ["Solidity", "Rust", "Web3"]
  }
];

const EMPLOYERS = [
  {
    id: "emp-stripe",
    email: "stripe@collabswipe.com",
    name: "Stripe",
    surname: "Turkey",
    image: "https://api.dicebear.com/7.x/initials/svg?seed=Stripe"
  },
  {
    id: "emp-vercel",
    email: "vercel@collabswipe.com",
    name: "Vercel",
    surname: "Inc.",
    image: "https://api.dicebear.com/7.x/initials/svg?seed=Vercel"
  },
  {
    id: "emp-spotify",
    email: "spotify@collabswipe.com",
    name: "Spotify",
    surname: "AB",
    image: "https://api.dicebear.com/7.x/initials/svg?seed=Spotify"
  },
  {
    id: "emp-netflix",
    email: "netflix@collabswipe.com",
    name: "Netflix",
    surname: "Tech",
    image: "https://api.dicebear.com/7.x/initials/svg?seed=Netflix"
  },
  {
    id: "emp-slack",
    email: "slack@collabswipe.com",
    name: "Slack",
    surname: "Technologies",
    image: "https://api.dicebear.com/7.x/initials/svg?seed=Slack"
  },
  {
    id: "emp-google",
    email: "google@collabswipe.com",
    name: "Google",
    surname: "LLC",
    image: "https://api.dicebear.com/7.x/initials/svg?seed=Google"
  },
  {
    id: "emp-meta",
    email: "meta@collabswipe.com",
    name: "Meta",
    surname: "Platforms",
    image: "https://api.dicebear.com/7.x/initials/svg?seed=Meta"
  },
  {
    id: "emp-amazon",
    email: "amazon@collabswipe.com",
    name: "Amazon",
    surname: "Web Services",
    image: "https://api.dicebear.com/7.x/initials/svg?seed=Amazon"
  }
];

const JOBS = [
  {
    id: "mega-job-1",
    employerId: "emp-stripe",
    title: "Senior AI / Machine Learning Engineer",
    description: "Looking for an expert AI engineer to help optimize our real-time fraud detection models. You will design, train, and deploy deep learning models using PyTorch on distributed GPUs. Heavy emphasis on transaction safety and latency optimization.",
    type: "CORPORATE",
    reqSkill: "Deep Learning"
  },
  {
    id: "mega-job-2",
    employerId: "emp-spotify",
    title: "Lead Product Designer",
    description: "Design next-generation music and podcast player experiences for over 500 million active listeners globally. Collaboration with frontend developers and product owners is core to this role. Familiarity with component libraries and design systems in Figma is essential.",
    type: "CORPORATE",
    reqSkill: "UI/UX"
  },
  {
    id: "mega-job-3",
    employerId: "emp-slack",
    title: "Go Backend Architect",
    description: "Scale our real-time messaging pipeline built on high-concurrency Go services. Experience with WebSockets, high-throughput message brokers (Kafka/NATS), and performance profiling is highly valued. Help us shave off precious milliseconds from message delivery times.",
    type: "CORPORATE",
    reqSkill: "Go"
  },
  {
    id: "mega-job-4",
    employerId: "emp-vercel",
    title: "Freelance Next.js Specialist",
    description: "Help us build beautiful documentation, landing pages, and interactive analytics dashboards for our modern developer hosting platform. High focus on cumulative layout shifts (CLS), page loading speed, and responsive aesthetics.",
    type: "FREELANCE",
    reqSkill: "Next.js"
  },
  {
    id: "mega-job-5",
    employerId: "emp-netflix",
    title: "Senior Kubernetes Administrator",
    description: "Manage and scale our massive multi-region video streaming clusters hosted on AWS. Develop secure CI/CD pipelines, automate server provisioning with Terraform, and build robust disaster recovery systems.",
    type: "CORPORATE",
    reqSkill: "Kubernetes"
  },
  {
    id: "mega-job-6",
    employerId: "emp-spotify",
    title: "Freelance iOS Developer",
    description: "We are looking for an independent iOS engineer to design and implement innovative spatial audio playback features. Strong knowledge of the Swift programming language, AVFoundation library, and SwiftUI is required.",
    type: "FREELANCE",
    reqSkill: "Swift"
  },
  {
    id: "mega-job-7",
    employerId: "emp-stripe",
    title: "Penetration Testing Consultant",
    description: "Help us audit our internal financial clearing pipelines, perform penetration tests on web services, and review security policies across our microservice mesh to guarantee absolute safety of merchants' accounts.",
    type: "FREELANCE",
    reqSkill: "Penetration Testing"
  },
  {
    id: "mega-job-8",
    employerId: "emp-vercel",
    title: "Junior Frontend Developer",
    description: "Join our core developer experience team and help us build modular, accessible, and high-performance React components. Great mentorship and rapid career growth opportunity.",
    type: "CORPORATE",
    reqSkill: "React"
  },
  {
    id: "mega-job-9",
    employerId: "emp-slack",
    title: "Product Manager - Enterprise Integrations",
    description: "Drive the integrations between Slack and enterprise productivity suites. Prioritize features, build roadmap specifications, gather user feedback, and lead a squad of 6 senior software engineers.",
    type: "CORPORATE",
    reqSkill: "Product Management"
  },
  {
    id: "mega-job-10",
    employerId: "emp-netflix",
    title: "Test Automation Engineer",
    description: "Build robust end-to-end automated testing suites for our web, mobile, and smart TV streaming clients. We use Cypress, Jest, and Playwright integrated into our pipeline to guarantee zero bugs on deployments.",
    type: "CORPORATE",
    reqSkill: "Cypress"
  },
  {
    id: "mega-job-11",
    employerId: "emp-google",
    title: "Senior Data Scientist",
    description: "Join our core Search ranking team. You will be responsible for improving query understanding using large language models and vast datasets. Experience with Python, TensorFlow, and BigQuery is a must.",
    type: "CORPORATE",
    reqSkill: "Python"
  },
  {
    id: "mega-job-12",
    employerId: "emp-meta",
    title: "React Native Mobile Developer",
    description: "Help build the next generation of social experiences. We are looking for engineers to optimize our React Native bridges and implement buttery-smooth 60fps animations for the Instagram app.",
    type: "CORPORATE",
    reqSkill: "React Native"
  },
  {
    id: "mega-job-13",
    employerId: "emp-amazon",
    title: "Freelance AWS Cloud Architect",
    description: "We need an independent consultant to help design serverless architectures for our enterprise clients. Strong knowledge of AWS Lambda, DynamoDB, API Gateway, and CloudFormation.",
    type: "FREELANCE",
    reqSkill: "AWS"
  },
  {
    id: "mega-job-14",
    employerId: "emp-google",
    title: "Frontend Developer (Creative)",
    description: "Create mind-blowing interactive web experiences for Google Doodles. Experience with Three.js, WebGL, and advanced CSS animations is required. Show us your creative portfolio!",
    type: "FREELANCE",
    reqSkill: "Three.js"
  },
  {
    id: "mega-job-15",
    employerId: "emp-meta",
    title: "Smart Contract Security Auditor",
    description: "Meta is exploring Web3 initiatives. We need a rigorous security auditor to find vulnerabilities in our Solidity smart contracts before they are deployed to the mainnet. High responsibility role.",
    type: "FREELANCE",
    reqSkill: "Solidity"
  }
];

async function main() {
  console.log('--- Mega Seeding Initiated ---');

  // 1. Seed Candidates (Job Seekers)
  console.log('Seeding 10 Job Seekers...');
  for (const candidate of CANDIDATES) {
    const user = await prisma.user.upsert({
      where: { email: candidate.email },
      update: {
        name: candidate.name,
        surname: candidate.surname,
        image: candidate.image,
      },
      create: {
        id: candidate.id,
        email: candidate.email,
        name: candidate.name,
        surname: candidate.surname,
        image: candidate.image,
      },
    });

    const profile = await prisma.profile.upsert({
      where: { userId: user.id },
      update: {
        bio: candidate.bio,
        location: candidate.location,
      },
      create: {
        userId: user.id,
        bio: candidate.bio,
        location: candidate.location,
      },
    });

    for (const skillName of candidate.skills) {
      const skill = await prisma.skill.upsert({
        where: { skillName },
        update: {},
        create: { skillName },
      });

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
  }
  console.log('Job seekers seeded successfully.');

  // 2. Seed Employers
  console.log('Seeding 5 Employers...');
  for (const employer of EMPLOYERS) {
    await prisma.user.upsert({
      where: { email: employer.email },
      update: {
        name: employer.name,
        surname: employer.surname,
        image: employer.image,
        role: "user"
      },
      create: {
        id: employer.id,
        email: employer.email,
        name: employer.name,
        surname: employer.surname,
        image: employer.image,
        role: "user"
      }
    });
  }
  console.log('Employers seeded successfully.');

  // 3. Seed Job Postings
  console.log('Seeding 10 Job Postings...');
  for (const job of JOBS) {
    // Ensure the required skill exists
    const skill = await prisma.skill.upsert({
      where: { skillName: job.reqSkill },
      update: {},
      create: { skillName: job.reqSkill },
    });

    await prisma.jobPosting.upsert({
      where: { id: job.id },
      update: {
        title: job.title,
        description: job.description,
        type: job.type,
        publisherId: job.employerId,
        reqId: skill.skillId,
      },
      create: {
        id: job.id,
        title: job.title,
        description: job.description,
        type: job.type,
        publisherId: job.employerId,
        reqId: skill.skillId,
      }
    });
  }
  console.log('Job postings seeded successfully.');

  console.log('--- Mega Seeding Completed Successfully ---');
}

main()
  .catch((e) => {
    console.error('Seeding failed with error:');
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
