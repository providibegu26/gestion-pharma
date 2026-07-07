/**
 * @file ventes.service.ts
 * @description Service de gestion des ventes. Cœur de la logique métier :
 *              vérification des stocks, création atomique de la vente, décrément
 *              des stocks, génération du QR code et du ticket PDF.
 * @module VentesModule
 *
 * RÔLE : Orchestrer tout le processus de vente de façon atomique et sécurisée.
 * UTILISÉ PAR : VentesController
 * DÉPENDANCES : PrismaService, QrCodeService
 * SUPPRESSION : Aucune vente possible dans l'application
 *
 * TRANSACTION INTERACTIVE : La création d'une vente utilise $transaction(async tx => {})
 * car les opérations sont interdépendantes :
 *   1. Lire les stocks (READ)
 *   2. Décider si la quantité est disponible (CONDITION)
 *   3. Créer la vente et ses lignes (WRITE)
 *   4. Décrémenter les stocks (WRITE)
 * Si l'étape 2 échoue (stock insuffisant), les étapes 3 et 4 ne sont pas exécutées
 * et la transaction est rollbackée automatiquement.
 */

import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Devise, StatutOrdonnance, StatutVente } from '@prisma/client';
import Decimal from 'decimal.js';
import { Response } from 'express';
import { PrismaService } from '../prisma/prisma.service';
import { QrCodeService } from '../qrcode/qrcode.service';
import { NotificationsService } from '../notifications/notifications.service';
import { CodesQrService } from '../codes-qr/codes-qr.service';
import { CreateVenteDto, LigneVenteDto } from './dto/create-vente.dto';

@Injectable()
export class VentesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly qrCodeService: QrCodeService,
    private readonly notifications: NotificationsService,
    private readonly codesQrService: CodesQrService,
  ) {}

  /**
   * @method create
   * @description Crée une vente complète de façon atomique.
   *              Vérifie les stocks, crée la vente, décrémente les stocks,
   *              génère le QR code et le ticket PDF.
   * @param {CreateVenteDto} dto - Données de la vente avec ses lignes
   * @param {string} userId - ID du caissier connecté (extrait du JWT)
   * @returns {Promise<{ data: object; message: string }>}
   * @throws {NotFoundException} Si un médicament n'existe pas
   * @throws {BadRequestException} Si le stock est insuffisant pour un médicament
   * @throws {BadRequestException} Si l'ordonnance n'est pas validée
   * @transaction INTERACTIVE — Lecture + vérification + écriture interdépendantes.
   *              Rollback automatique si le stock est insuffisant.
   */
  async create(
    dto: CreateVenteDto,
    userId: string,
  ): Promise<{ data: object; message: string }> {
    // Vérifie l'existence et la validité de l'ordonnance si fournie
    if (dto.ordonnanceId) {
      const ordonnance = await this.prisma.ordonnance.findUnique({
        where: { id: dto.ordonnanceId },
        include: { vente: true }, // Inclut la relation vente pour vérifier si déjà utilisée
      });

      if (!ordonnance) {
        throw new NotFoundException(
          `Ordonnance ${dto.ordonnanceId} introuvable.`,
        );
      }

      // Une vente sur ordonnance ne peut être faite que si elle est validée
      if (ordonnance.statut !== StatutOrdonnance.VALIDEE) {
        throw new BadRequestException(
          `L'ordonnance doit être validée avant de pouvoir être utilisée (statut : ${ordonnance.statut}).`,
        );
      }

      // Vérifie qu'aucune vente n'est déjà liée à cette ordonnance
      if (ordonnance.vente !== null) {
        throw new BadRequestException(
          'Cette ordonnance a déjà été utilisée pour une vente.',
        );
      }
    }

    // Collecte des infos de stock pour vérification d'alerte après la transaction
    const stockSnapshot: Array<{
      medicamentId: string;
      nom: string;
      quantiteAvant: number;
      seuilMinimum: number;
      vendu: number;
    }> = [];

    // Transaction interactive : toutes les opérations sont atomiques
    const vente = await this.prisma.$transaction(async (tx) => {
      let montantTotal = new Decimal(0);
      const lignesData: Array<{
        medicamentId: string;
        quantite: number;
        prixUnitaire: Decimal;
        devise: Devise;
      }> = [];

      // Phase 1 : Vérification des stocks et calcul du montant total
      for (const ligne of dto.lignes) {
        // Récupère le médicament avec son stock (dans la transaction)
        const medicament = await tx.medicament.findUnique({
          where: { id: ligne.medicamentId },
          include: { stock: true },
        });

        if (!medicament) {
          throw new NotFoundException(
            `Médicament ${ligne.medicamentId} introuvable.`,
          );
        }

        if (!medicament.stock) {
          throw new BadRequestException(
            `Le stock du médicament "${medicament.nom}" n'est pas initialisé.`,
          );
        }

        // Vérifie que le stock disponible est suffisant pour la quantité demandée
        if (medicament.stock.quantite < ligne.quantite) {
          throw new BadRequestException(
            `Stock insuffisant pour "${medicament.nom}". ` +
            `Disponible : ${medicament.stock.quantite} ${medicament.unite}. ` +
            `Demandé : ${ligne.quantite} ${medicament.unite}.`,
          );
        }

        // Détermine le prix unitaire selon la devise de la ligne
        const prixUnitaire =
          ligne.devise === Devise.USD ? medicament.prixUSD : medicament.prixCDF;

        // Calcule le sous-total de cette ligne et l'ajoute au total
        const sousTotal = prixUnitaire.mul(ligne.quantite);
        montantTotal = montantTotal.add(sousTotal);

        lignesData.push({
          medicamentId: ligne.medicamentId,
          quantite: ligne.quantite,
          prixUnitaire,
          devise: ligne.devise,
        });

        // Sauvegarde pour vérification d'alerte post-transaction
        stockSnapshot.push({
          medicamentId: ligne.medicamentId,
          nom: medicament.nom,
          quantiteAvant: medicament.stock.quantite,
          seuilMinimum: medicament.stock.seuilMinimum,
          vendu: ligne.quantite,
        });
      }

      // Phase 2 : Création de la vente avec ses lignes
      const nouvelleVente = await tx.vente.create({
        data: {
          patientId: dto.patientId,
          userId,
          ordonnanceId: dto.ordonnanceId,
          montantTotal,
          devise: dto.devise,
          statut: StatutVente.FINALISEE, // Vente directement finalisée à la création
          lignes: {
            create: lignesData,
          },
        },
        include: {
          lignes: {
            include: { medicament: true },
          },
          patient: {
            select: { id: true, nom: true, prenom: true },
          },
          user: {
            select: { id: true, nom: true, prenom: true },
          },
        },
      });

      // Phase 3 : Décrément atomique des stocks (dans la même transaction)
      for (const ligne of dto.lignes) {
        await tx.stock.update({
          where: { medicamentId: ligne.medicamentId },
          data: {
            // Décrémente la quantité de façon atomique (évite les race conditions)
            quantite: { decrement: ligne.quantite },
          },
        });
      }

      return nouvelleVente;
    });

    // Vérification des seuils d'alerte après la transaction
    for (const snap of stockSnapshot) {
      const quantiteApres = snap.quantiteAvant - snap.vendu;
      if (quantiteApres <= snap.seuilMinimum) {
        this.notifications.notifierStockCritique({
          medicamentId: snap.medicamentId,
          nom: snap.nom,
          quantite: quantiteApres,
          seuilMinimum: snap.seuilMinimum,
        });
      }
    }

    // Phase 4 : QR récapitulatif de la vente (ticket global)
    const qrCodeBase64 = await this.qrCodeService.generateQrCode(vente.id);

    await this.prisma.vente.update({
      where: { id: vente.id },
      data: { qrCode: qrCodeBase64 },
    });

    // Phase 5 : Codes QR unitaires (1 par produit vendu — uniques, usage unique)
    await this.codesQrService.genererPourVente(
      vente.id,
      dto.patientId,
      vente.lignes.map((l) => ({
        id: l.id,
        medicamentId: l.medicamentId,
        quantite: l.quantite,
      })),
    );

    const codesQr = await this.prisma.codeQr.findMany({
      where: { venteId: vente.id },
      include: {
        medicament: { select: { id: true, nom: true, unite: true } },
      },
      orderBy: { createdAt: 'asc' },
    });

    const venteAvecQr = { ...vente, qrCode: qrCodeBase64, codesQr };

    return {
      data: venteAvecQr,
      message:
        'Vente créée avec succès. ' +
        `${codesQr.length} code(s) QR unitaire(s) généré(s). ` +
        'Ticket : GET /ventes/:id/ticket — Codes : GET /ventes/:id/codes-qr',
    };
  }

  /**
   * @method findAll
   * @description Liste toutes les ventes avec leurs lignes et informations associées.
   * @returns {Promise<{ data: object[]; message: string }>}
   */
  async findAll(): Promise<{ data: object[]; message: string }> {
    const ventes = await this.prisma.vente.findMany({
      include: {
        lignes: {
          include: { medicament: { select: { nom: true, unite: true } } },
        },
        patient: { select: { id: true, nom: true, prenom: true } },
        user: { select: { id: true, nom: true, prenom: true } },
      },
      orderBy: { createdAt: 'desc' },
    });

    return { data: ventes, message: `${ventes.length} vente(s) trouvée(s).` };
  }

  /**
   * @method findOne
   * @description Retourne le détail complet d'une vente.
   * @param {string} id - UUID de la vente
   * @returns {Promise<{ data: object; message: string }>}
   * @throws {NotFoundException} Si la vente n'existe pas
   */
  async findOne(id: string): Promise<{ data: object; message: string }> {
    const vente = await this.prisma.vente.findUnique({
      where: { id },
      include: {
        lignes: {
          include: { medicament: true },
        },
        patient: { select: { id: true, nom: true, prenom: true, telephone: true } },
        user: { select: { id: true, nom: true, prenom: true } },
        ordonnance: {
          select: { id: true, prescripteur: true, statut: true },
        },
        codesQr: {
          include: {
            medicament: { select: { id: true, nom: true, unite: true } },
            patient: { select: { id: true, nom: true, prenom: true } },
          },
          orderBy: { createdAt: 'asc' },
        },
      },
    });

    if (!vente) {
      throw new NotFoundException(`Vente avec l'ID ${id} introuvable.`);
    }

    return { data: vente, message: 'Vente récupérée.' };
  }

  /**
   * @method getTicketPdf
   * @description Génère et envoie le ticket PDF d'une vente.
   */
  async getTicketPdf(id: string, res: Response): Promise<void> {
    const { data: vente } = await this.findOne(id);
    const v = vente as {
      id: string;
      qrCode: string | null;
      montantTotal: Decimal;
      devise: string;
      createdAt: Date;
      user: { nom: string; prenom: string };
      patient: { nom: string; prenom: string } | null;
      lignes: Array<{
        medicament: { nom: string };
        quantite: number;
        prixUnitaire: Decimal;
        devise: string;
      }>;
    };

    const qrCodeBase64 =
      v.qrCode ?? (await this.qrCodeService.generateQrCode(id));

    const pdfBuffer = await this.qrCodeService.generateTicketPdf({
      venteId: v.id,
      nomCaissier: `${v.user.prenom} ${v.user.nom}`,
      nomPatient: v.patient
        ? `${v.patient.prenom} ${v.patient.nom}`
        : undefined,
      lignes: v.lignes.map((l) => ({
        nomMedicament: l.medicament.nom,
        quantite: l.quantite,
        prixUnitaire: l.prixUnitaire,
        devise: l.devise,
      })),
      montantTotal: v.montantTotal,
      devise: v.devise,
      createdAt: v.createdAt,
      qrCodeBase64,
    });

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader(
      'Content-Disposition',
      `attachment; filename="ticket-${id.slice(0, 8)}.pdf"`,
    );
    res.setHeader('Content-Length', pdfBuffer.length);
    res.end(pdfBuffer);
  }

  async findCodesQr(venteId: string) {
    return this.codesQrService.findByVente(venteId);
  }

  /**
   * @method annuler
   * @description Annule une vente et restitue les stocks (PHARMACIEN uniquement).
   * @param {string} id - UUID de la vente à annuler
   * @returns {Promise<{ data: object; message: string }>}
   * @throws {NotFoundException} Si la vente n'existe pas
   * @throws {BadRequestException} Si la vente est déjà annulée
   * @transaction INTERACTIVE — Annulation + restitution des stocks atomique.
   */
  async annuler(id: string): Promise<{ data: object; message: string }> {
    const { data: venteData } = await this.findOne(id);
    const vente = venteData as {
      statut: string;
      lignes: Array<{ medicamentId: string; quantite: number }>;
    };

    if (vente.statut === StatutVente.ANNULEE) {
      throw new BadRequestException('Cette vente est déjà annulée.');
    }

    // Transaction interactive : annulation + restitution des stocks en une opération
    const venteAnnulee = await this.prisma.$transaction(async (tx) => {
      // Passe le statut à ANNULEE
      const updated = await tx.vente.update({
        where: { id },
        data: { statut: StatutVente.ANNULEE },
        include: {
          lignes: { include: { medicament: { select: { nom: true } } } },
        },
      });

      // Restitue les stocks pour chaque médicament de la vente annulée
      for (const ligne of vente.lignes) {
        await tx.stock.update({
          where: { medicamentId: ligne.medicamentId },
          data: { quantite: { increment: ligne.quantite } },
        });
      }

      return updated;
    });

    await this.codesQrService.annulerPourVente(id);

    return { data: venteAnnulee, message: 'Vente annulée, stocks restitués et codes QR invalidés.' };
  }
}
