-- CreateEnum
CREATE TYPE "StatutCodeQr" AS ENUM ('ACTIF', 'UTILISE', 'ANNULE');

-- CreateTable
CREATE TABLE "CodeQr" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "venteId" TEXT NOT NULL,
    "ligneVenteId" TEXT NOT NULL,
    "medicamentId" TEXT NOT NULL,
    "patientId" TEXT,
    "statut" "StatutCodeQr" NOT NULL DEFAULT 'ACTIF',
    "qrImage" TEXT,
    "utiliseAt" TIMESTAMP(3),
    "verifieParId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CodeQr_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "CodeQr_code_key" ON "CodeQr"("code");

-- AddForeignKey
ALTER TABLE "CodeQr" ADD CONSTRAINT "CodeQr_venteId_fkey" FOREIGN KEY ("venteId") REFERENCES "Vente"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CodeQr" ADD CONSTRAINT "CodeQr_ligneVenteId_fkey" FOREIGN KEY ("ligneVenteId") REFERENCES "LigneVente"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CodeQr" ADD CONSTRAINT "CodeQr_medicamentId_fkey" FOREIGN KEY ("medicamentId") REFERENCES "Medicament"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CodeQr" ADD CONSTRAINT "CodeQr_patientId_fkey" FOREIGN KEY ("patientId") REFERENCES "Patient"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CodeQr" ADD CONSTRAINT "CodeQr_verifieParId_fkey" FOREIGN KEY ("verifieParId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
