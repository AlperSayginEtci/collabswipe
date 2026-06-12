import { createAuthClient } from "better-auth/react"
import { inferAdditionalFields } from "better-auth/client/plugins"
import type { auth } from "./index"

/**
 * Tarayıcı tarafı auth client.
 * Bileşenlerde: useSession(), signIn(), signUp(), signOut() gibi hook'ları sağlar.
 *
 * Kullanım:
 *   import { authClient } from "@collabswipe/auth/client"
 *   const { data: session } = authClient.useSession()
 */
export const authClient = createAuthClient({
  baseURL: "http://localhost:3001",
  plugins: [
    inferAdditionalFields<typeof auth>()
  ]
})

export type Session = typeof authClient.$Infer.Session
export const { signIn, signUp, signOut, useSession, getSession } = authClient
