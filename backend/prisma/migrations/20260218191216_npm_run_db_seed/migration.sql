-- CreateTable
CREATE TABLE "Caregiver" (
    "id" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "telefono" TEXT NOT NULL,
    "codigo" TEXT NOT NULL,
    "disponibilidad" TEXT NOT NULL,
    "estado" TEXT NOT NULL DEFAULT 'activo',
    "avatar" TEXT,
    "bio" TEXT,
    "especialidades" TEXT[],
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Caregiver_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Patient" (
    "id" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,
    "edad" INTEGER NOT NULL,
    "tipo" TEXT NOT NULL,
    "condicion" TEXT NOT NULL,
    "direccion" TEXT NOT NULL,
    "contactoEmergenciaNombre" TEXT NOT NULL,
    "contactoEmergenciaTelefono" TEXT NOT NULL,
    "acompananteAsignadoId" TEXT,
    "foto" TEXT,
    "notas" TEXT,
    "necesidadesEspeciales" TEXT[],
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Patient_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Caregiver_email_key" ON "Caregiver"("email");

-- AddForeignKey
ALTER TABLE "Patient" ADD CONSTRAINT "Patient_acompananteAsignadoId_fkey" FOREIGN KEY ("acompananteAsignadoId") REFERENCES "Caregiver"("id") ON DELETE SET NULL ON UPDATE CASCADE;
