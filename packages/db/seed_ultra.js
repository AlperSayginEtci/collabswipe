const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

const SKILLS = [
  "Deep Learning", "Python", "PyTorch", "TensorFlow",
  "UI/UX", "Figma", "Tailwind CSS", "User Research",
  "Go", "Node.js", "PostgreSQL", "Redis",
  "React", "TypeScript", "GraphQL", "Next.js",
  "Docker", "Kubernetes", "AWS", "CI/CD", "Terraform",
  "Swift", "SwiftUI", "React Native", "Penetration Testing",
  "Product Management", "Agile", "Scrum", "Analytics",
  "Vue", "Nuxt.js", "Cypress", "Jest", "Data Science",
  "Three.js", "WebGL", "Flutter", "Dart", "Solidity", "Rust"
];

const LANGUAGES = [
  { name: "Turkish" },
  { name: "English" },
  { name: "German" },
  { name: "Spanish" },
  { name: "French" }
];

const CANDIDATES = [
  {
    id: "seeker-can",
    email: "can@collabswipe.com",
    name: "Can",
    surname: "Yılmaz",
    image: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=200",
    bio: "AI & Machine Learning Engineer with a deep passion for Neural Networks, NLP, and Computer Vision. Seeking co-founders or high-impact roles.",
    location: "Istanbul, Turkey",
    age: 27,
    skills: ["Deep Learning", "Python", "PyTorch", "TensorFlow"],
    experiences: [
      {
        title: "AI Research Engineer",
        corp: "Trendyol Group",
        type: "WORK",
        startDate: new Date("2023-01-10"),
        location: "Istanbul",
        locType: "HYBRID",
        desc: "Designed and implemented recommendation system models using PyTorch, serving millions of users."
      },
      {
        title: "Machine Learning Intern",
        corp: "TÜBİTAK BİLGEM",
        type: "INTERNSHIP",
        startDate: new Date("2022-06-01"),
        endDate: new Date("2022-09-01"),
        location: "Kocaeli",
        locType: "ONSITE",
        desc: "Worked on text classification models using BERT and fine-tuning scripts."
      }
    ],
    educations: [
      {
        instName: "Istanbul Technical University",
        instDegree: "Bachelor's Degree",
        instProgram: "Computer Engineering",
        startDate: new Date("2018-09-15"),
        endDate: new Date("2022-06-20")
      }
    ],
    languages: [
      { name: "Turkish", proficiency: "NATIVE" },
      { name: "English", proficiency: "C1" }
    ]
  },
  {
    id: "seeker-elif",
    email: "elif@collabswipe.com",
    name: "Elif",
    surname: "Demir",
    image: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&q=80&w=200",
    bio: "UI/UX Designer who focuses on clean typography, accessible color palettes, and interactive Figma prototypes. 3+ years experience.",
    location: "Izmir, Turkey",
    age: 25,
    skills: ["UI/UX", "Figma", "Tailwind CSS", "User Research"],
    experiences: [
      {
        title: "UI/UX Designer",
        corp: "Getir",
        type: "WORK",
        startDate: new Date("2022-03-15"),
        location: "Istanbul",
        locType: "REMOTE",
        desc: "Designed user flows, wireframes, and interactive hi-fi mockups in Figma for the delivery apps."
      }
    ],
    educations: [
      {
        instName: "Ege University",
        instDegree: "Bachelor's Degree",
        instProgram: "Visual Communication Design",
        startDate: new Date("2017-09-15"),
        endDate: new Date("2021-06-18")
      }
    ],
    languages: [
      { name: "Turkish", proficiency: "NATIVE" },
      { name: "English", proficiency: "B2" }
    ]
  },
  {
    id: "seeker-mert",
    email: "mert@collabswipe.com",
    name: "Mert",
    surname: "Kaya",
    image: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&q=80&w=200",
    bio: "Go Backend Developer specializing in microservices architecture, gRPC, and high-concurrency systems. Fan of Docker and PostgreSQL.",
    location: "Ankara, Turkey",
    age: 29,
    skills: ["Go", "Node.js", "PostgreSQL", "Redis"],
    experiences: [
      {
        title: "Senior Go Developer",
        corp: "Insider",
        type: "WORK",
        startDate: new Date("2021-05-01"),
        location: "Istanbul",
        locType: "HYBRID",
        desc: "Built scalable message broker systems in Go handling over 50k events per second."
      }
    ],
    educations: [
      {
        instName: "Middle East Technical University",
        instDegree: "Bachelor's Degree",
        instProgram: "Software Engineering",
        startDate: new Date("2014-09-15"),
        endDate: new Date("2019-06-25")
      }
    ],
    languages: [
      { name: "Turkish", proficiency: "NATIVE" },
      { name: "English", proficiency: "C1" },
      { name: "German", proficiency: "A2" }
    ]
  },
  {
    id: "seeker-zeynep",
    email: "zeynep@collabswipe.com",
    name: "Zeynep",
    surname: "Çelik",
    image: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?auto=format&fit=crop&q=80&w=200",
    bio: "Fullstack Engineer comfortable writing React SPAs and scaling REST/GraphQL APIs with Node.js. 4 years of startup experience.",
    location: "Istanbul, Turkey",
    age: 26,
    skills: ["React", "Node.js", "TypeScript", "GraphQL", "Next.js"],
    experiences: [
      {
        title: "Fullstack Developer",
        corp: "Dream Games",
        type: "WORK",
        startDate: new Date("2022-09-01"),
        location: "Istanbul",
        locType: "ONSITE",
        desc: "Built dashboard tools using Next.js and Tailwind CSS for the analytics team."
      }
    ],
    educations: [
      {
        instName: "Boğaziçi University",
        instDegree: "Bachelor's Degree",
        instProgram: "Computer Engineering",
        startDate: new Date("2016-09-15"),
        endDate: new Date("2021-06-30")
      }
    ],
    languages: [
      { name: "Turkish", proficiency: "NATIVE" },
      { name: "English", proficiency: "C2" }
    ]
  },
  {
    id: "seeker-burak",
    email: "burak@collabswipe.com",
    name: "Burak",
    surname: "Öztürk",
    image: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=crop&q=80&w=200",
    bio: "DevOps & Infrastructure Lead. Passionate about automating Kubernetes deployments, writing declarative Terraform, and managing AWS costs.",
    location: "Istanbul, Turkey",
    age: 31,
    skills: ["Docker", "Kubernetes", "AWS", "CI/CD", "Terraform"],
    experiences: [
      {
        title: "DevOps Engineer",
        corp: "Hepsiburada",
        type: "WORK",
        startDate: new Date("2020-11-01"),
        location: "Istanbul",
        locType: "HYBRID",
        desc: "Managed AWS infrastructure, reduced hosting costs by 25% using Spot instances, automated with Terraform."
      }
    ],
    educations: [
      {
        instName: "Yıldız Technical University",
        instDegree: "Bachelor's Degree",
        instProgram: "Mathematical Engineering",
        startDate: new Date("2012-09-15"),
        endDate: new Date("2017-06-15")
      }
    ],
    languages: [
      { name: "Turkish", proficiency: "NATIVE" },
      { name: "English", proficiency: "B2" }
    ]
  }
];

const EMPLOYERS = [
  {
    id: "emp-stripe",
    email: "stripe@collabswipe.com",
    name: "Stripe",
    surname: "Turkey",
    image: "https://images.unsplash.com/photo-1614680376593-902f74fa0d41?auto=format&fit=crop&q=80&w=200",
    sector: "Fintech",
    role: "company"
  },
  {
    id: "emp-vercel",
    email: "vercel@collabswipe.com",
    name: "Vercel",
    surname: "Inc.",
    image: "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&q=80&w=200",
    sector: "Cloud Computing & DevTools",
    role: "company"
  },
  {
    id: "emp-spotify",
    email: "spotify@collabswipe.com",
    name: "Spotify",
    surname: "AB",
    image: "https://images.unsplash.com/photo-1611339555312-e607c8352fd7?auto=format&fit=crop&q=80&w=200",
    sector: "Music & Podcast Streaming",
    role: "company"
  },
  {
    id: "emp-netflix",
    email: "netflix@collabswipe.com",
    name: "Netflix",
    surname: "Tech",
    image: "https://images.unsplash.com/photo-1522869635100-9f4c5e86aa37?auto=format&fit=crop&q=80&w=200",
    sector: "Entertainment & Streaming",
    role: "company"
  },
  {
    id: "emp-slack",
    email: "slack@collabswipe.com",
    name: "Slack",
    surname: "Technologies",
    image: "https://images.unsplash.com/photo-1611162617213-7d7a39e9b1d7?auto=format&fit=crop&q=80&w=200",
    sector: "Enterprise Software",
    role: "company"
  },
  {
    id: "emp-google",
    email: "google@collabswipe.com",
    name: "Google",
    surname: "LLC",
    image: "https://images.unsplash.com/photo-1573804633927-bfcbcd909acd?auto=format&fit=crop&q=80&w=200",
    sector: "Technology & AI",
    role: "company"
  }
];

const JOBS = [
  {
    id: "job-stripe-1",
    employerId: "emp-stripe",
    title: "Senior AI / Machine Learning Engineer",
    description: "Looking for an expert AI engineer to help optimize our real-time fraud detection models. You will design, train, and deploy deep learning models using PyTorch on distributed GPUs. Heavy emphasis on transaction safety and latency optimization.",
    type: "CORPORATE",
    reqSkill: "Deep Learning"
  },
  {
    id: "job-spotify-1",
    employerId: "emp-spotify",
    title: "Lead Product Designer",
    description: "Design next-generation music and podcast player experiences for over 500 million active listeners globally. Collaboration with frontend developers and product owners is core to this role. Familiarity with component libraries and design systems in Figma is essential.",
    type: "CORPORATE",
    reqSkill: "UI/UX"
  },
  {
    id: "job-slack-1",
    employerId: "emp-slack",
    title: "Go Backend Architect",
    description: "Scale our real-time messaging pipeline built on high-concurrency Go services. Experience with WebSockets, high-throughput message brokers (Kafka/NATS), and performance profiling is highly valued. Help us shave off precious milliseconds from message delivery times.",
    type: "CORPORATE",
    reqSkill: "Go"
  },
  {
    id: "job-vercel-1",
    employerId: "emp-vercel",
    title: "Freelance Next.js Specialist",
    description: "Help us build beautiful documentation, landing pages, and interactive analytics dashboards for our modern developer hosting platform. High focus on cumulative layout shifts (CLS), page loading speed, and responsive aesthetics.",
    type: "FREELANCE",
    reqSkill: "Next.js"
  },
  {
    id: "job-netflix-1",
    employerId: "emp-netflix",
    title: "Senior Kubernetes Administrator",
    description: "Manage and scale our massive multi-region video streaming clusters hosted on AWS. Develop secure CI/CD pipelines, automate server provisioning with Terraform, and build robust disaster recovery systems.",
    type: "CORPORATE",
    reqSkill: "Kubernetes"
  }
];

const SOCIAL_POSTS = [
  {
    id: "post-1",
    authorId: "seeker-can",
    content: "Bugün PyTorch ve Transformer modelleri kullanarak eğittiğimiz yeni Türkçe NLP modelinin testlerini tamamladık! Doğruluk oranımız önceki modellere göre %14 arttı. Detayları yakında paylaşıyor olacağım. Destek veren tüm ekibe teşekkürler! 🚀 #DeepLearning #NLP #ArtificialIntelligence #PyTorch",
  },
  {
    id: "post-2",
    authorId: "emp-vercel",
    content: "Next.js v15 is now globally stable! ⚡ This release brings optimized routing performance, server components caching updates, and improved cold starts. Run 'pnpm create next-app@latest' to try it out today! Let us know your feedback. #Nextjs #Vercel #WebDevelopment",
  },
  {
    id: "post-3",
    authorId: "seeker-elif",
    content: "Yeni tasarladığım mobil iş arama uygulamasının prototipini Figma üzerinden paylaşıyorum. Tasarımda özellikle renk kontrastı ve erişilebilirlik (A11y) kurallarına dikkat ettim. Sizce nasıl olmuş? Yorumlarınızı bekliyorum! 👇 #UIUX #DesignSystem #Accessibility #Figma",
  },
  {
    id: "post-4",
    authorId: "seeker-mert",
    content: "Büyük ölçekli projelerde Redis Cluster mimarisi mi yoksa Redis Sentinel mi kullanmalıyız? Cache invalidate ederken ne gibi stratejiler izliyorsunuz? Tecrübelerinizi paylaşırsanız sevinirim. #Redis #Backend #SystemDesign",
  },
  {
    id: "post-5",
    authorId: "emp-google",
    content: "We are excited to share our latest research on neural rendering! Our new models can render 3D scenes in real-time on standard mobile browsers. Open-source code and details on Google AI Blog. #GoogleAI #Research #Threejs",
  }
];

const COMMENTS = [
  {
    id: "comment-1",
    postId: "post-1",
    authorId: "seeker-mert",
    content: "Harika bir çalışma Can, eline sağlık! Backend kısmında bu modeli hangi framework ile servis etmeyi düşünüyorsunuz? FastAPI mi, yoksa Go mu?",
    replies: [
      {
        id: "reply-1",
        postId: "post-1",
        authorId: "seeker-can",
        content: "Teşekkürler Mert! Python'da FastAPI ile prototipledik ama production tarafında Go veya C++ gRPC servisi ile servis etmeyi planlıyoruz."
      }
    ]
  },
  {
    id: "comment-2",
    postId: "post-2",
    authorId: "seeker-zeynep",
    content: "Server Actions are getting better and better. Speed improvement on navigation is huge. Thank you for this release!",
    replies: []
  },
  {
    id: "comment-3",
    postId: "post-4",
    authorId: "seeker-burak",
    content: "Use Redis Sentinel if you just need high availability and automatic failover. Go for Redis Cluster if you have a massive dataset and need data sharding across multiple nodes.",
    replies: []
  }
];

async function main() {
  console.log("--- Ultra Seeding Started ---");

  // Clean up existing data to prevent conflict and have clean database
  console.log("Cleaning database...");
  await prisma.commentLike.deleteMany({});
  await prisma.comment.deleteMany({});
  await prisma.like.deleteMany({});
  await prisma.post.deleteMany({});
  await prisma.jobApplication.deleteMany({});
  await prisma.jobPosting.deleteMany({});
  await prisma.userSkill.deleteMany({});
  await prisma.userLanguage.deleteMany({});
  await prisma.certificate.deleteMany({});
  await prisma.education.deleteMany({});
  await prisma.experience.deleteMany({});
  await prisma.profile.deleteMany({});
  await prisma.follows.deleteMany({});
  await prisma.connection.deleteMany({});
  await prisma.session.deleteMany({});
  await prisma.account.deleteMany({});
  await prisma.user.deleteMany({});
  await prisma.skill.deleteMany({});
  await prisma.language.deleteMany({});
  console.log("Database clean completed.");

  // 1. Seed Skills
  console.log("Seeding Skills...");
  for (const skillName of SKILLS) {
    await prisma.skill.upsert({
      where: { skillName },
      update: {},
      create: { skillName }
    });
  }

  // 2. Seed Languages
  console.log("Seeding Languages...");
  for (const lang of LANGUAGES) {
    await prisma.language.upsert({
      where: { name: lang.name },
      update: {},
      create: { name: lang.name }
    });
  }

  // 3. Seed Candidates (Users + Profiles + Experiences + Educations + Skills + Languages)
  console.log("Seeding Candidates...");
  for (const candidate of CANDIDATES) {
    const user = await prisma.user.create({
      data: {
        id: candidate.id,
        email: candidate.email,
        name: candidate.name,
        surname: candidate.surname,
        image: candidate.image,
        role: "user",
        emailVerified: true
      }
    });

    const profile = await prisma.profile.create({
      data: {
        userId: user.id,
        bio: candidate.bio,
        location: candidate.location,
        age: candidate.age,
        profileName: `${candidate.name.toLowerCase()}-${candidate.surname.toLowerCase()}`
      }
    });

    // Experiences
    for (const exp of candidate.experiences) {
      await prisma.experience.create({
        data: {
          profileId: profile.id,
          title: exp.title,
          corp: exp.corp,
          type: exp.type,
          startDate: exp.startDate,
          endDate: exp.endDate || null,
          location: exp.location,
          locType: exp.locType
        }
      });
    }

    // Educations
    for (const edu of candidate.educations) {
      await prisma.education.create({
        data: {
          profileId: profile.id,
          instName: edu.instName,
          instDegree: edu.instDegree,
          instProgram: edu.instProgram,
          startDate: edu.startDate,
          endDate: edu.endDate || null
        }
      });
    }

    // Connect skills
    for (const skillName of candidate.skills) {
      const dbSkill = await prisma.skill.findUnique({
        where: { skillName }
      });
      if (dbSkill) {
        await prisma.userSkill.create({
          data: {
            profileId: profile.id,
            skillId: dbSkill.skillId
          }
        });
      }
    }

    // Connect languages
    for (const lang of candidate.languages) {
      const dbLang = await prisma.language.findUnique({
        where: { name: lang.name }
      });
      if (dbLang) {
        await prisma.userLanguage.create({
          data: {
            profileId: profile.id,
            languageId: dbLang.id,
            proficiency: lang.proficiency
          }
        });
      }
    }

    console.log(`Candidate ${user.name} ${user.surname} seeded.`);
  }

  // 4. Seed Employers (Companies)
  console.log("Seeding Employers...");
  for (const emp of EMPLOYERS) {
    const user = await prisma.user.create({
      data: {
        id: emp.id,
        email: emp.email,
        name: emp.name,
        surname: emp.surname,
        image: emp.image,
        role: emp.role,
        sector: emp.sector,
        emailVerified: true
      }
    });

    await prisma.profile.create({
      data: {
        userId: user.id,
        bio: `Official profile of ${emp.name}. We specialize in ${emp.sector}. Join our team!`,
        location: "Global",
        profileName: emp.name.toLowerCase()
      }
    });

    console.log(`Employer ${user.name} ${user.surname || ''} seeded.`);
  }

  // 5. Seed Jobs
  console.log("Seeding Job Postings...");
  for (const job of JOBS) {
    const dbSkill = await prisma.skill.findUnique({
      where: { skillName: job.reqSkill }
    });

    await prisma.jobPosting.create({
      data: {
        id: job.id,
        publisherId: job.employerId,
        title: job.title,
        description: job.description,
        type: job.type,
        requirements: dbSkill ? {
          connect: { skillId: dbSkill.skillId }
        } : undefined
      }
    });
    console.log(`Job "${job.title}" seeded.`);
  }

  // 6. Seed Social Posts
  console.log("Seeding Social Posts...");
  for (const post of SOCIAL_POSTS) {
    await prisma.post.create({
      data: {
        id: post.id,
        authorId: post.authorId,
        content: post.content
      }
    });
  }

  // 7. Seed Comments & Replies
  console.log("Seeding Comments...");
  for (const comment of COMMENTS) {
    const dbComment = await prisma.comment.create({
      data: {
        id: comment.id,
        postId: comment.postId,
        authorId: comment.authorId,
        content: comment.content
      }
    });

    for (const reply of comment.replies) {
      await prisma.comment.create({
        data: {
          id: reply.id,
          postId: reply.postId,
          authorId: reply.authorId,
          content: reply.content,
          parentCommentId: dbComment.id
        }
      });
    }
  }

  // 8. Seed Likes
  console.log("Seeding Likes...");
  // Let's add some likes to post-1
  await prisma.like.create({ data: { postId: "post-1", userId: "seeker-mert" } });
  await prisma.like.create({ data: { postId: "post-1", userId: "seeker-zeynep" } });
  await prisma.like.create({ data: { postId: "post-1", userId: "emp-stripe" } });

  // Let's add some likes to post-2
  await prisma.like.create({ data: { postId: "post-2", userId: "seeker-zeynep" } });
  await prisma.like.create({ data: { postId: "post-2", userId: "seeker-can" } });

  console.log("--- Ultra Seeding Completed Successfully ---");
}

main()
  .catch((e) => {
    console.error("Seeding failed with error:");
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
