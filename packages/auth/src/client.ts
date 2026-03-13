import { createAuthClient } from "better-auth/react"

/**
 * Tarayıcı tarafı auth client.
 * Bileşenlerde: useSession(), signIn(), signUp(), signOut() gibi hook'ları sağlar.
 *
 * Kullanım:
 *   import { authClient } from "@collabswipe/auth/client"
 *   const { data: session } = authClient.useSession()
 */
export const authClient = createAuthClient({
  baseURL: process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000",
})

export type Session = typeof authClient.$Infer.Session
export const { signIn, signUp, signOut, useSession, getSession } = authClient
