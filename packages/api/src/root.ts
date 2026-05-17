import { createTRPCRouter } from "./trpc"
import { userRouter } from "./routers/user"
import { profileRouter } from "./routers/profile"
import { connectionRouter } from "./routers/connection"
import { postRouter } from "./routers/post"
import { jobRouter } from "./routers/job"
import { conversationRouter } from "./routers/conversation"
import { adminRouter } from "./routers/admin"
import { chatRouter } from "./routers/chat"

export const appRouter = createTRPCRouter({
  user: userRouter,
  profile: profileRouter,
  connection: connectionRouter,
  post: postRouter,
  job: jobRouter,
  conversation: conversationRouter,
  admin: adminRouter,
  chat: chatRouter,
})

export type AppRouter = typeof appRouter
