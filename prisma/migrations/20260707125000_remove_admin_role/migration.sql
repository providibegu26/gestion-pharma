-- Convertir les comptes ADMIN existants en PHARMACIEN
UPDATE "User" SET role = 'PHARMACIEN' WHERE role = 'ADMIN';

-- Recréer l'enum Role sans la valeur ADMIN
ALTER TYPE "Role" RENAME TO "Role_old";
CREATE TYPE "Role" AS ENUM ('PHARMACIEN', 'PREPARATEUR', 'CAISSIER', 'CLIENT');
ALTER TABLE "User" ALTER COLUMN "role" DROP DEFAULT;
ALTER TABLE "User" ALTER COLUMN "role" TYPE "Role" USING ("role"::text::"Role");
ALTER TABLE "User" ALTER COLUMN "role" SET DEFAULT 'CLIENT';
DROP TYPE "Role_old";
