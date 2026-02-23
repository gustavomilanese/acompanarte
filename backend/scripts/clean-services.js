import 'dotenv/config'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  const latest = await prisma.service.findFirst({
    orderBy: { createdAt: 'desc' },
    select: { id: true },
  })

  if (!latest) {
    console.log('No hay servicios para limpiar.')
    return
  }

  const result = await prisma.service.deleteMany({
    where: {
      id: { not: latest.id },
    },
  })

  console.log(`Servicios eliminados: ${result.count}`)
  console.log(`Servicio conservado: ${latest.id}`)
}

main()
  .catch((err) => {
    console.error(err)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
