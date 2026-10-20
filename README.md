<p align="center">
  <img src="collabs.png" alt="CollabSwipe" width="160">
</p>

<h1 align="center">CollabSwipe</h1>

<p align="center">
  A professional networking and job platform where you <b>swipe</b> to discover collaborators and job postings.<br>
  Web + mobile, end-to-end type-safe, with realtime messaging.
</p>

<!-- LIVE DEMO: add the Vercel URL here if it is still online, e.g. **[Live demo →](https://...)** -->

<!-- DEMO VIDEO: drag CollabS.mov into this README in the GitHub web editor to get a user-attachments link, then paste it here -->

<p align="center">
  <img src="docs/screenshots/web-landing.png" alt="Landing page" width="800">
</p>

<p align="center">
  <img src="docs/screenshots/mobile-swipe.jpg" alt="Swipe through profiles and jobs" width="220">
  <img src="docs/screenshots/mobile-filters.jpg" alt="Discovery filters" width="220">
  <img src="docs/screenshots/mobile-support.jpg" alt="Support ticket" width="220">
</p>

<details>
<summary><b>More screenshots (web)</b></summary>
<br>
<p align="center">
  <img src="docs/screenshots/web-feed.png" alt="Social feed" width="800">
  <br><em>Social feed with network suggestions</em><br><br>
  <img src="docs/screenshots/web-post-job.png" alt="Posting a job" width="800">
  <br><em>Company view: posting a job with required skills</em>
</p>
</details>

## Features

- **Swipe-based discovery:** swipe through people and job postings, then like or pass. Mutual interest creates a match, which automatically opens a conversation
- **Professional profiles:** experience, education, certificates, skills (with suggestions), languages and links. Private profiles use follow requests
- **Jobs with skill matching:** companies and freelancers post jobs with required skills. The job feed is ranked by how well each posting matches the user's skills. Users apply with a cover letter
- **Social feed:** posts, reposts, likes, nested comments and infinite scrolling
- **Realtime messaging:** one-to-one chat over WebSockets (tRPC subscriptions), with read receipts, unread counts, reactions, message editing and deletion, and message requests
- **Notifications** and a **support ticket** system with attachments
- **Moderation and admin panel:** user management, reports, bans, mutes, shadowbans, post quarantine and edit requests
- **Media uploads** with client-side compression and Cloudinary storage

## Tech Stack

| Layer | Technologies |
|---|---|
| Monorepo | Turborepo, pnpm workspaces |
| Web | React 19, Vite, TanStack Router, TanStack Query, Tailwind CSS, Framer Motion |
| Mobile | React Native, Expo (Expo Router), Reanimated, Gesture Handler |
| API | tRPC (HTTP + WebSocket), Express, Zod, SuperJSON |
| Auth | Better Auth (session-based) |
| Database | PostgreSQL, Prisma ORM |
| Storage | Cloudinary |
| Deployment | Vercel (web), Railway (API and DB), EAS (Android build), Docker Compose (local DB) |

## Architecture

```
collabswipe/
├── apps/
│   ├── web/        # React + Vite SPA
│   ├── mobile/     # Expo / React Native app
│   └── server/     # Express server: tRPC HTTP + WebSocket, uploads, auth routes
└── packages/
    ├── api/        # tRPC routers (user, profile, post, job, chat, connection, notification, ticket, admin)
    ├── auth/       # shared Better Auth config and client
    └── db/         # Prisma schema and client (25+ models)
```

Both clients import the `AppRouter` type from `@collabswipe/api`, so every API call is **type-checked end to end** without code generation. Queries and mutations go over HTTP. Chat and typing events go over a WebSocket link, using a `splitLink` on the client and an `EventEmitter` pub/sub on the server.

## Getting Started

### Prerequisites
- Node.js 18+
- pnpm (`npm install -g pnpm`)
- Docker (for the local PostgreSQL)

### Setup
```bash
git clone https://github.com/AlperSayginEtci/collabswipe.git
cd collabswipe
pnpm install

# 1. Start PostgreSQL
docker compose up -d

# 2. Configure the database URL
echo 'DATABASE_URL="postgresql://user:password@localhost:5432/collabswipe"' > packages/db/.env

# 3. Push the Prisma schema
cd packages/db && npx prisma db push && cd ../..

# 4. Run everything (web, server, mobile)
pnpm dev
```

The web app runs on the Vite dev server (by default `http://localhost:5173`). To open the mobile app, scan the Expo QR code with Expo Go.

## Team

Built as a two-person team project. We both worked across the whole stack. The main areas each of us led:

- **Alper Saygın Etci** ([@AlperSayginEtci](https://github.com/AlperSayginEtci)): realtime chat (WebSocket / tRPC subscriptions), the home feed and the profile pages
- **Oğuz Mert Abidinoğlu** ([@oxgy](https://github.com/oxgy)): deployment (Vercel, Railway, EAS), media uploads with Cloudinary, job postings, admin tools and infinite scrolling
