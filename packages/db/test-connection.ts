import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  try {
    await prisma.$connect()
    console.log("✅ Veritabanı bağlantısı başarılı! Database çalışıyor.")
  } catch (error) {
    console.error("❌ Veritabanı bağlantı hatası:", error)
  } finally {
    await prisma.$disconnect()
  }
}

main()
