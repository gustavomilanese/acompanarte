import 'dotenv/config'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

function normalizeText(value = '') {
  return String(value)
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim()
}

const AMBA_ZONE_GROUP_BY_PARTIDO = {
  'almirante brown': 'zona_sur',
  avellaneda: 'zona_sur',
  berazategui: 'zona_sur',
  berisso: 'zona_sur',
  brandsen: 'zona_sur',
  canuelas: 'zona_sur',
  campana: 'zona_norte',
  ensenada: 'zona_sur',
  escobar: 'zona_norte',
  'esteban echeverria': 'zona_sur',
  ezeiza: 'zona_sur',
  'exaltacion de la cruz': 'zona_norte',
  'florencio varela': 'zona_sur',
  'general las heras': 'zona_oeste',
  'general rodriguez': 'zona_oeste',
  'general san martin': 'zona_norte',
  hurlingham: 'zona_oeste',
  ituzaingo: 'zona_oeste',
  'jose c. paz': 'zona_norte',
  'la matanza': 'zona_oeste',
  'la plata': 'zona_sur',
  lanus: 'zona_sur',
  'lomas de zamora': 'zona_sur',
  lujan: 'zona_oeste',
  'malvinas argentinas': 'zona_norte',
  'marcos paz': 'zona_oeste',
  merlo: 'zona_oeste',
  moreno: 'zona_oeste',
  moron: 'zona_oeste',
  pilar: 'zona_norte',
  'presidente peron': 'zona_sur',
  quilmes: 'zona_sur',
  'san fernando': 'zona_norte',
  'san isidro': 'zona_norte',
  'san miguel': 'zona_norte',
  'san vicente': 'zona_sur',
  tigre: 'zona_norte',
  'tres de febrero': 'zona_oeste',
  'vicente lopez': 'zona_norte',
  zarate: 'zona_norte',
}

function inferAmbaZoneGroup(provincia, zona) {
  const provinciaNorm = normalizeText(provincia)
  const zonaNorm = normalizeText(zona)
  if (!provinciaNorm) return null
  if (provinciaNorm === 'caba') return 'caba'
  if (provinciaNorm !== 'buenos aires' && provinciaNorm !== 'provincia de buenos aires') return null
  if (!zonaNorm) return null
  return AMBA_ZONE_GROUP_BY_PARTIDO[zonaNorm] || null
}

async function main() {
  const caregivers = await prisma.caregiver.findMany({
    select: { id: true, provincia: true, zona: true, zonaAmba: true },
  })

  let updated = 0
  for (const caregiver of caregivers) {
    const nextZone = inferAmbaZoneGroup(caregiver.provincia, caregiver.zona)
    if ((caregiver.zonaAmba || null) === (nextZone || null)) continue
    await prisma.caregiver.update({
      where: { id: caregiver.id },
      data: { zonaAmba: nextZone },
    })
    updated += 1
  }

  console.log(`Cuidadores revisados: ${caregivers.length}`)
  console.log(`Cuidadores actualizados con zona AMBA: ${updated}`)
}

main()
  .catch((error) => {
    console.error(error)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })

