import { betterAuth } from "better-auth"
import { prismaAdapter } from "better-auth/adapters/prisma"
import { prisma } from "@collabswipe/db"
import { bearer } from "better-auth/plugins"

export const auth = betterAuth({
  baseURL: process.env.BETTER_AUTH_URL || "http://192.168.0.22:3001/api/auth",
  plugins: [bearer()],
  /**
   * Veritabanı adaptörü — mevcut Prisma instance'ını kullan
   */
  database: prismaAdapter(prisma, {
    provider: "postgresql",
  }),

  /**
   * Güvenilir kaynaklar (Origins) — Vite uygulamamızın çalıştığı adresler
   */
  trustedOrigins: [
    "http://localhost:5173",
    "http://127.0.0.1:5173",
    "http://192.168.0.22:5173",
    "http://192.168.0.22:3000",
    "http://192.168.0.22:3001",
    "http://192.168.0.22:8081",
    "http://192.168.0.22:8082",
    "http://192.168.0.22",
    "exp://192.168.0.22:8081",
    "exp://192.168.0.22:8082",
    "exp://192.168.0.22",
    "https://collabswipe-web.vercel.app",
    process.env.FRONTEND_URL || ""
  ].filter(Boolean),

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
        input: true,
      },
      sector: {
        type: "string",
        required: false,
        input: true,
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
