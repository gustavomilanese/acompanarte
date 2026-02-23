-- CreateTable
CREATE TABLE "Service" (
    "id" TEXT NOT NULL,
    "fechaInicio" TIMESTAMP(3) NOT NULL,
    "duracionMinutos" INTEGER NOT NULL DEFAULT 60,
    "estado" TEXT NOT NULL DEFAULT 'pendiente',
    "notas" TEXT,
    "pacienteId" TEXT NOT NULL,
    "cuidadorId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Service_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "Service" ADD CONSTRAINT "Service_pacienteId_fkey" FOREIGN KEY ("pacienteId") REFERENCES "Patient"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Service" ADD CONSTRAINT "Service_cuidadorId_fkey" FOREIGN KEY ("cuidadorId") REFERENCES "Caregiver"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
