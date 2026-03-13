import { createTRPCRouter } from "./trpc"
import { userRouter } from "./routers/user"
import { profileRouter } from "./routers/profile"
import { connectionRouter } from "./routers/connection"
import { postRouter } from "./routers/post"
import { jobRouter } from "./routers/job"
import { conversationRouter } from "./routers/conversation"
import { adminRouter } from "./routers/admin"

export const appRouter = createTRPCRouter({
  user: userRouter,
  profile: profileRouter,
  connection: connectionRouter,
  post: postRouter,
  job: jobRouter,
  conversation: conversationRouter,
  admin: adminRouter,
})

export type AppRouter = typeof appRouter
