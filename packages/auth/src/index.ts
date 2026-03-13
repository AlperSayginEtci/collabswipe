import { betterAuth } from "better-auth"
import { prismaAdapter } from "better-auth/adapters/prisma"
import { prisma } from "@collabswipe/db"

export const auth = betterAuth({
  /**
   * Veritabanı adaptörü — mevcut Prisma instance'ını kullan
   */
  database: prismaAdapter(prisma, {
    provider: "postgresql",
  }),

  /**
   * E-posta / Şifre ile giriş
   */
  emailAndPassword: {
    enabled: true,
    requireEmailVerification: false, // Geliştirme aşamasında kapalı
  },

  /**
   * Session ayarları
   */
  session: {
    expiresIn: 60 * 60 * 24 * 7,        // 7 gün
    updateAge: 60 * 60 * 24,             // 1 günde bir yenile
    cookieCache: {
      enabled: true,
      maxAge: 60 * 5,                    // 5 dakika cookie cache
    },
  },

  /**
   * Kullanıcı modeli — Prisma şemasındaki field'larla eşleştirme
   */
  user: {
    additionalFields: {
      surname: {
        type: "string",
        required: false,
        defaultValue: null,
        input: true,
      },
      role: {
        type: "string",
        required: false,
        defaultValue: "user",
        input: false,
      },
      banned: {
        type: "boolean",
        required: false,
        defaultValue: false,
        input: false,
      },
    },
  },
})

export type Auth = typeof auth
