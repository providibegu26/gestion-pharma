-- Migration: commande QR, file d'attente, retrait PREPARATEUR

-- 1. Migrer les utilisateurs PREPARATEUR vers PHARMACIEN
UPDATE "User" SET role = 'PHARMACIEN' WHERE role = 'PREPARATEUR';

-- 2. Nouveaux statuts commande
ALTER TYPE "StatutCommande" ADD VALUE IF NOT EXISTS 'PRETE';
ALTER TYPE "StatutCommande" ADD VALUE IF NOT EXISTS 'RETIREE';

-- 3. Champs commande
ALTER TABLE "Commande" ADD COLUMN IF NOT EXISTS "motifRefus" TEXT;
ALTER TABLE "Commande" ADD COLUMN IF NOT EXISTS "refuseAutomatique" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "Commande" ADD COLUMN IF NOT EXISTS "refuseParId" TEXT;
ALTER TABLE "Commande" ADD COLUMN IF NOT EXISTS "refuseAt" TIMESTAMP(3);
ALTER TABLE "Commande" ADD COLUMN IF NOT EXISTS "codeRetrait" TEXT;
ALTER TABLE "Commande" ADD COLUMN IF NOT EXISTS "qrImage" TEXT;
ALTER TABLE "Commande" ADD COLUMN IF NOT EXISTS "montantTotal" DECIMAL(10,2);
ALTER TABLE "Commande" ADD COLUMN IF NOT EXISTS "retraitAt" TIMESTAMP(3);
ALTER TABLE "Commande" ADD COLUMN IF NOT EXISTS "retireParId" TEXT;

CREATE UNIQUE INDEX IF NOT EXISTS "Commande_codeRetrait_key" ON "Commande"("codeRetrait");

ALTER TABLE "Commande" DROP CONSTRAINT IF EXISTS "Commande_refuseParId_fkey";
ALTER TABLE "Commande" ADD CONSTRAINT "Commande_refuseParId_fkey"
  FOREIGN KEY ("refuseParId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "Commande" DROP CONSTRAINT IF EXISTS "Commande_retireParId_fkey";
ALTER TABLE "Commande" ADD CONSTRAINT "Commande_retireParId_fkey"
  FOREIGN KEY ("retireParId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- 4. Nouveaux enums file d'attente
DO $$ BEGIN
  CREATE TYPE "TypeServiceFile" AS ENUM ('PHARMACIE', 'CAISSE');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE "StatutFile" AS ENUM ('EN_ATTENTE', 'APPELE', 'EN_COURS', 'TERMINE', 'ANNULE');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

CREATE TABLE IF NOT EXISTS "FileAttente" (
  "id" TEXT NOT NULL,
  "numeroTicket" INTEGER NOT NULL,
  "clientId" TEXT,
  "nomAffiche" TEXT,
  "typeService" "TypeServiceFile" NOT NULL,
  "statut" "StatutFile" NOT NULL DEFAULT 'EN_ATTENTE',
  "position" INTEGER NOT NULL,
  "estimeeMinutes" INTEGER,
  "appeleParId" TEXT,
  "appeleAt" TIMESTAMP(3),
  "termineAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "FileAttente_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "FileAttente_typeService_statut_createdAt_idx"
  ON "FileAttente"("typeService", "statut", "createdAt");
CREATE INDEX IF NOT EXISTS "FileAttente_clientId_statut_idx"
  ON "FileAttente"("clientId", "statut");

ALTER TABLE "FileAttente" DROP CONSTRAINT IF EXISTS "FileAttente_clientId_fkey";
ALTER TABLE "FileAttente" ADD CONSTRAINT "FileAttente_clientId_fkey"
  FOREIGN KEY ("clientId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "FileAttente" DROP CONSTRAINT IF EXISTS "FileAttente_appeleParId_fkey";
ALTER TABLE "FileAttente" ADD CONSTRAINT "FileAttente_appeleParId_fkey"
  FOREIGN KEY ("appeleParId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- 5. Retirer PREPARATEUR de l'enum Role
ALTER TYPE "Role" RENAME TO "Role_old";
CREATE TYPE "Role" AS ENUM ('ADMIN', 'PHARMACIEN', 'CAISSIER', 'CLIENT');
ALTER TABLE "User" ALTER COLUMN "role" DROP DEFAULT;
ALTER TABLE "User" ALTER COLUMN "role" TYPE "Role" USING ("role"::text::"Role");
ALTER TABLE "User" ALTER COLUMN "role" SET DEFAULT 'CLIENT';
DROP TYPE "Role_old";
