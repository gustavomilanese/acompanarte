import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  await prisma.service.deleteMany()
  await prisma.patient.deleteMany()
  await prisma.caregiver.deleteMany()

  const maria = await prisma.caregiver.create({
    data: {
      nombre: 'María González',
      email: 'maria@ejemplo.com',
      telefono: '+54 11 2345-6789',
      codigo: '1234',
      estado: 'activo',
      disponibilidad: 'mañana y tarde',
      avatar: 'https://i.pravatar.cc/150?u=maria',
      bio: 'Acompañante con 5 años de experiencia en cuidado de adultos mayores.',
      especialidades: ['demencia', 'movilidad reducida'],
    },
  })

  const carlos = await prisma.caregiver.create({
    data: {
      nombre: 'Carlos López',
      email: 'carlos@ejemplo.com',
      telefono: '+54 11 3456-7890',
      codigo: '5678',
      estado: 'activo',
      disponibilidad: 'solo mañana',
      avatar: 'https://i.pravatar.cc/150?u=carlos',
      bio: 'Especializado en acompañamiento escolar y actividades recreativas.',
      especialidades: ['TEA', 'niños'],
    },
  })

  await prisma.patient.createMany({
    data: [
      {
        nombre: 'Don José',
        edad: 78,
        tipo: 'adulto_mayor',
        condicion: 'Demencia leve',
        direccion: 'Av. Corrientes 1234, CABA',
        contactoEmergenciaNombre: 'Pedro (hijo)',
        contactoEmergenciaTelefono: '+54 11 9876-5432',
        acompananteAsignadoId: maria.id,
        foto: 'https://i.pravatar.cc/150?u=jose',
        notas: 'Le gusta escuchar tangos. Tiene buenos días y malos días.',
        necesidadesEspeciales: ['recordatorios de medicación', 'ayuda para caminar'],
      },
      {
        nombre: 'Doña Rosa',
        edad: 82,
        tipo: 'adulto_mayor',
        condicion: 'Movilidad reducida',
        direccion: 'Calle Florida 567, CABA',
        contactoEmergenciaNombre: 'María (hija)',
        contactoEmergenciaTelefono: '+54 11 8765-4321',
        acompananteAsignadoId: maria.id,
        foto: 'https://i.pravatar.cc/150?u=rosa',
        notas: 'Muy conversadora. Disfruta de las actividades manuales.',
        necesidadesEspeciales: ['silla de ruedas', 'baño adaptado'],
      },
      {
        nombre: 'Tomás',
        edad: 6,
        tipo: 'nino',
        condicion: 'TEA (Trastorno del Espectro Autista)',
        direccion: 'Av. Santa Fe 890, CABA',
        contactoEmergenciaNombre: 'Laura (mamá)',
        contactoEmergenciaTelefono: '+54 11 7654-3210',
        acompananteAsignadoId: carlos.id,
        foto: 'https://i.pravatar.cc/150?u=tomas',
        notas: 'Le encantan los dinosaurios. Necesita rutinas predecibles.',
        necesidadesEspeciales: ['comunicación visual', 'pausas sensoriales'],
      },
      {
        nombre: 'Lucía',
        edad: 5,
        tipo: 'nino',
        condicion: 'Acompañamiento post-cole',
        direccion: 'Calle Libertad 234, CABA',
        contactoEmergenciaNombre: 'Carlos (papá)',
        contactoEmergenciaTelefono: '+54 11 6543-2109',
        acompananteAsignadoId: carlos.id,
        foto: 'https://i.pravatar.cc/150?u=lucia',
        notas: 'Muy creativa. Le gusta dibujar y bailar.',
        necesidadesEspeciales: ['tareas guiadas', 'actividades lúdicas'],
      },
    ],
  })

  console.log('Seed OK')
}

main()
  .catch((err) => {
    console.error(err)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
