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
// Check if we are in a Vite environment (web)
let apiUrl = typeof import.meta !== 'undefined' && import.meta.env && import.meta.env.VITE_API_URL 
  ? (import.meta.env.VITE_API_URL as string)
  : "http://localhost:3001";
if (apiUrl.endsWith('/')) apiUrl = apiUrl.slice(0, -1);

export const authClient = createAuthClient({
  baseURL: apiUrl,
  plugins: [
    inferAdditionalFields<typeof auth>()
  ]
})

export type Session = typeof authClient.$Infer.Session
export const { signIn, signUp, signOut, useSession, getSession } = authClient
