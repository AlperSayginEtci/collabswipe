import { initTRPC, TRPCError } from "@trpc/server"
import superjson from "superjson"
import { ZodError } from "zod"
import { prisma } from "@collabswipe/db"
import { auth } from "@collabswipe/auth"

/**
 * 1. CONTEXT
 * Her tRPC isteğinde çağrılır.
 * Better Auth'tan session okunur ve context'e eklenir.
 */
export type TRPCContext = {
  session: { user: { id: string; email: string; name?: string | null; role?: string | null } } | null
  prisma: typeof prisma
}

export const createTRPCContext = async (opts?: {
  headers?: Headers
}): Promise<TRPCContext> => {
  let session: TRPCContext["session"] = null

  if (opts?.headers) {
    try {
      const headerObj: Record<string, string> = {};
      opts.headers.forEach((val, key) => {
        headerObj[key] = val;
      });
      console.log("[createTRPCContext] Incoming Headers:", JSON.stringify(headerObj));

      const betterAuthSession = await auth.api.getSession({
        headers: opts.headers,
      });
      
      console.log("[createTRPCContext] getSession result exists:", !!betterAuthSession);
      
      if (betterAuthSession?.session && betterAuthSession?.user) {
        session = {
          user: {
            id: betterAuthSession.user.id,
            email: betterAuthSession.user.email,
            name: betterAuthSession.user.name,
            role: (betterAuthSession.user as any).role ?? "user",
          },
        }
      }
    } catch (err: any) {
      console.error("[createTRPCContext] Error in getSession:", err);
    }
  }

  return { session, prisma }
}

/**
 * 2. INITIALIZATION
 */
const t = initTRPC.context<TRPCContext>().create({
  transformer: superjson,
  errorFormatter({ shape, error }) {
    return {
      ...shape,
      data: {
        ...shape.data,
        zodError:
          error.cause instanceof ZodError ? error.cause.flatten() : null,
      },
    }
  },
})

/**
 * 3. ROUTER & PROCEDURE
 */
export const createTRPCRouter = t.router
export const publicProcedure = t.procedure

/**
 * Korumalı procedure — oturum açık olmalı
 */
const isAuthed = t.middleware(({ ctx, next }) => {
  if (!ctx.session) {
    throw new TRPCError({ code: "UNAUTHORIZED" })
  }
  const session = ctx.session as NonNullable<TRPCContext["session"]>
  return next({ ctx: { session } })
})

export const protectedProcedure = t.procedure.use(isAuthed)

const isAdmin = t.middleware(({ ctx, next }) => {
  if (!ctx.session || ctx.session.user.role !== "admin") {
    throw new TRPCError({ code: "UNAUTHORIZED", message: "Admin access required" })
  }
  const session = ctx.session as NonNullable<TRPCContext["session"]>
  return next({ ctx: { session } })
})

export const adminProcedure = t.procedure.use(isAdmin)
