import './src/config/load-env.js'
import { usesProductionDb } from './src/config/load-env.js'
import { PrismaClient } from '@prisma/client'

async function main() {
  const prisma = new PrismaClient()
  try {
    await prisma.$queryRaw`SELECT 1 AS ok`
    console.log(usesProductionDb() ? 'OK — banco de produção' : 'OK — banco local')
  } finally {
    await prisma.$disconnect()
  }
}

main().catch((error) => {
  console.error('Falha na conexão:', error instanceof Error ? error.message : error)
  process.exit(1)
})
