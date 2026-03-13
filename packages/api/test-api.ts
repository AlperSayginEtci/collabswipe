import { createTRPCContext } from "./src/trpc"
import { appRouter } from "./src/root"

async function main() {
  const ctx = await createTRPCContext()  // async now
  const caller = appRouter.createCaller(ctx)

  try {
    const users = await caller.user.search({ query: "test" })
    console.log("✅ user.search çalışıyor, sonuç:", users.length, "kayıt")

    const feed = await caller.post.getFeed({ limit: 5 })
    console.log("✅ post.getFeed çalışıyor, sonuç:", feed.items.length, "gönderi")

    const jobs = await caller.job.list({ limit: 5 })
    console.log("✅ job.list çalışıyor, sonuç:", jobs.items.length, "ilan")

    const announcements = await caller.admin.getAnnouncements()
    console.log("✅ admin.getAnnouncements çalışıyor, sonuç:", announcements.length, "duyuru")

    console.log("\n🎉 Tüm router'lar sorunsuz çalışıyor!")
  } catch (err) {
    console.error("❌ Hata:", err)
    process.exit(1)
  }
}

main()
