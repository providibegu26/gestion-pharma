import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import * as bcrypt from 'bcrypt';
import * as dotenv from 'dotenv';
import {
  commandes,
  fournisseurs,
  medicaments,
  ordonnances,
  patients,
  SEED_PASSWORD,
  users,
  ventes,
} from './seed-data';

dotenv.config();

const adapter = new PrismaPg(process.env.DATABASE_URL as string);
const prisma = new PrismaClient({ adapter });

const SEED_FORCE = process.env.SEED_FORCE === 'true';
const password = process.env.SEED_DEFAULT_PASSWORD ?? SEED_PASSWORD;

async function clearDatabase(): Promise<void> {
  await prisma.fileAttente.deleteMany();
  await prisma.codeQr.deleteMany();
  await prisma.ligneVente.deleteMany();
  await prisma.ligneCommande.deleteMany();
  await prisma.vente.deleteMany();
  await prisma.commande.deleteMany();
  await prisma.ordonnance.deleteMany();
  await prisma.stock.deleteMany();
  await prisma.medicament.deleteMany();
  await prisma.patient.deleteMany();
  await prisma.fournisseur.deleteMany();
  await prisma.user.deleteMany();
}

async function main(): Promise<void> {
  const existingCount = await prisma.user.count();

  if (existingCount > 0 && !SEED_FORCE) {
    console.log(
      `Base déjà peuplée (${existingCount} utilisateur(s)). Seed ignoré.`,
    );
    console.log('Pour tout recréer : SEED_FORCE=true npx prisma db seed');
    return;
  }

  if (SEED_FORCE && existingCount > 0) {
    console.log('SEED_FORCE=true — suppression des données existantes...');
    await clearDatabase();
  }

  const hashedPassword = await bcrypt.hash(password, 12);

  // ── Utilisateurs ────────────────────────────────────────────
  const userIds: Record<string, string> = {};
  for (const u of users) {
    const created = await prisma.user.create({
      data: {
        nom: u.nom,
        prenom: u.prenom,
        email: u.email,
        motDePasse: hashedPassword,
        role: u.role,
      },
    });
    userIds[u.key] = created.id;
  }
  console.log(`✓ ${users.length} utilisateurs créés (mot de passe : ${password})`);

  // ── Patients ────────────────────────────────────────────────
  const patientIds: Record<string, string> = {};
  for (const p of patients) {
    const { key, ...patientData } = p;
    const created = await prisma.patient.create({ data: patientData });
    patientIds[key] = created.id;
  }
  console.log(`✓ ${patients.length} patients créés`);

  // ── Fournisseurs ────────────────────────────────────────────
  for (const f of fournisseurs) {
    await prisma.fournisseur.create({ data: f });
  }
  console.log(`✓ ${fournisseurs.length} fournisseurs créés`);

  // ── Médicaments + stocks ────────────────────────────────────
  const medicamentIds: Record<string, string> = {};
  for (const m of medicaments) {
    const { key, quantite, seuilMinimum, ...medData } = m;
    const created = await prisma.medicament.create({
      data: {
        ...medData,
        stock: {
          create: { quantite, seuilMinimum },
        },
      },
    });
    medicamentIds[key] = created.id;
  }
  console.log(`✓ ${medicaments.length} médicaments + stocks créés`);

  // ── Ordonnances (sans lien vente pour l'instant) ─────────────
  const ordonnanceIds: Record<string, string> = {};
  for (const o of ordonnances) {
    const created = await prisma.ordonnance.create({
      data: {
        patientId: patientIds[o.patientKey],
        prescripteur: o.prescripteur,
        statut: o.statut,
        imageUrl: o.imageUrl,
      },
    });
    ordonnanceIds[o.key] = created.id;
  }
  console.log(`✓ ${ordonnances.length} ordonnances créées`);

  // ── Ventes + lignes ─────────────────────────────────────────
  for (const v of ventes) {
    await prisma.vente.create({
      data: {
        userId: userIds[v.caissierKey],
        patientId: v.patientKey ? patientIds[v.patientKey] : null,
        ordonnanceId: v.ordonnanceKey ? ordonnanceIds[v.ordonnanceKey] : null,
        montantTotal: v.montantTotal,
        devise: v.devise,
        statut: v.statut,
        lignes: {
          create: v.lignes.map((l) => ({
            medicamentId: medicamentIds[l.medicamentKey],
            quantite: l.quantite,
            prixUnitaire: l.prixUnitaire,
            devise: l.devise,
          })),
        },
      },
    });
  }
  console.log(`✓ ${ventes.length} ventes créées`);

  // ── Commandes + lignes ──────────────────────────────────────
  for (const c of commandes) {
    const montantLignes = c.lignes.reduce((sum, l) => {
      const med = medicaments.find((m) => m.key === l.medicamentKey);
      return sum + Number(med?.prixCDF ?? 0) * l.quantite;
    }, 0);

    await prisma.commande.create({
      data: {
        clientId: userIds[c.clientKey],
        statut: c.statut,
        note: c.note ?? undefined,
        codeRetrait: c.codeRetrait,
        montantTotal: montantLignes,
        motifRefus: 'motifRefus' in c ? c.motifRefus : undefined,
        refuseAutomatique: 'refuseAutomatique' in c ? c.refuseAutomatique : false,
        lignes: {
          create: c.lignes.map((l) => ({
            medicamentId: medicamentIds[l.medicamentKey],
            quantite: l.quantite,
          })),
        },
      },
    });
  }
  console.log(`✓ ${commandes.length} commandes créées`);

  console.log('\n── Comptes de connexion ──────────────────────');
  for (const u of users) {
    console.log(`  [${u.role.padEnd(11)}] ${u.email}`);
  }
  console.log(`  Mot de passe : ${password}`);
  console.log('────────────────────────────────────────────\n');
}

main()
  .catch((e: unknown) => {
    console.error('Erreur lors du seed :', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
