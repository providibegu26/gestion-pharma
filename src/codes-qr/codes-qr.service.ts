import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { StatutCodeQr, StatutVente } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { QrCodeService } from '../qrcode/qrcode.service';
import {
  construirePayloadQr,
  extraireCodeDepuisScan,
  genererCodeQrUnique,
} from './codes-qr.utils';

const CODE_QR_INCLUDE = {
  medicament: {
    select: { id: true, nom: true, categorie: true, unite: true },
  },
  patient: {
    select: { id: true, nom: true, prenom: true, telephone: true },
  },
  vente: {
    select: {
      id: true,
      statut: true,
      devise: true,
      montantTotal: true,
      createdAt: true,
      user: { select: { id: true, nom: true, prenom: true } },
    },
  },
  verifiePar: {
    select: { id: true, nom: true, prenom: true, role: true },
  },
} as const;

@Injectable()
export class CodesQrService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly qrCodeService: QrCodeService,
  ) {}

  /**
   * Génère les codes QR unitaires pour chaque produit vendu.
   * 1 code unique par unité (si quantité = 3 → 3 codes distincts).
   */
  async genererPourVente(
    venteId: string,
    patientId: string | null | undefined,
    lignes: Array<{ id: string; medicamentId: string; quantite: number }>,
  ): Promise<void> {
    const codesACreer: Array<{
      code: string;
      venteId: string;
      ligneVenteId: string;
      medicamentId: string;
      patientId: string | null;
    }> = [];

    for (const ligne of lignes) {
      for (let unite = 0; unite < ligne.quantite; unite++) {
        let code = genererCodeQrUnique();
        let collision = await this.prisma.codeQr.findUnique({ where: { code } });
        while (collision) {
          code = genererCodeQrUnique();
          collision = await this.prisma.codeQr.findUnique({ where: { code } });
        }
        codesACreer.push({
          code,
          venteId,
          ligneVenteId: ligne.id,
          medicamentId: ligne.medicamentId,
          patientId: patientId ?? null,
        });
      }
    }

    if (codesACreer.length === 0) return;

    await this.prisma.codeQr.createMany({ data: codesACreer });

    const codes = await this.prisma.codeQr.findMany({
      where: { venteId },
      select: { id: true, code: true },
    });

    for (const { id, code } of codes) {
      const qrImage = await this.qrCodeService.generateQrCodeFromPayload(
        construirePayloadQr(code),
      );
      await this.prisma.codeQr.update({
        where: { id },
        data: { qrImage },
      });
    }
  }

  /** Annule tous les codes d'une vente (lors d'une annulation de vente) */
  async annulerPourVente(venteId: string): Promise<void> {
    await this.prisma.codeQr.updateMany({
      where: { venteId, statut: StatutCodeQr.ACTIF },
      data: { statut: StatutCodeQr.ANNULE },
    });
  }

  async findByVente(venteId: string) {
    const vente = await this.prisma.vente.findUnique({ where: { id: venteId } });
    if (!vente) {
      throw new NotFoundException(`Vente ${venteId} introuvable.`);
    }

    const codes = await this.prisma.codeQr.findMany({
      where: { venteId },
      include: CODE_QR_INCLUDE,
      orderBy: { createdAt: 'asc' },
    });

    return {
      data: codes.map((c) => ({
        ...c,
        payload: construirePayloadQr(c.code),
      })),
      message: `${codes.length} code(s) QR pour cette vente.`,
    };
  }

  /** Consultation sans consommer le code (prévisualisation après scan) */
  async consulter(scan: string) {
    const code = extraireCodeDepuisScan(scan);
    const codeQr = await this.prisma.codeQr.findUnique({
      where: { code },
      include: CODE_QR_INCLUDE,
    });

    if (!codeQr) {
      throw new NotFoundException(`Code QR "${code}" introuvable.`);
    }

    return {
      data: {
        ...codeQr,
        payload: construirePayloadQr(codeQr.code),
        utilisable: codeQr.statut === StatutCodeQr.ACTIF && codeQr.vente.statut === StatutVente.FINALISEE,
      },
      message:
        codeQr.statut === StatutCodeQr.ACTIF
          ? 'Code valide — en attente de validation.'
          : codeQr.statut === StatutCodeQr.UTILISE
            ? 'Code déjà utilisé.'
            : 'Code annulé.',
    };
  }

  /**
   * Valide et consomme le code (usage unique).
   * Un code ACTIF devient UTILISE — impossible de le réutiliser.
   */
  async utiliser(scan: string, verifieParId: string) {
    const code = extraireCodeDepuisScan(scan);

    const result = await this.prisma.$transaction(async (tx) => {
      const codeQr = await tx.codeQr.findUnique({
        where: { code },
        include: CODE_QR_INCLUDE,
      });

      if (!codeQr) {
        throw new NotFoundException(`Code QR "${code}" introuvable.`);
      }

      if (codeQr.statut === StatutCodeQr.UTILISE) {
        throw new BadRequestException(
          `Ce code a déjà été utilisé le ${codeQr.utiliseAt?.toLocaleString('fr-CD') ?? '—'}.`,
        );
      }

      if (codeQr.statut === StatutCodeQr.ANNULE) {
        throw new BadRequestException('Ce code a été annulé (vente annulée).');
      }

      if (codeQr.vente.statut === StatutVente.ANNULEE) {
        throw new BadRequestException('La vente associée a été annulée.');
      }

      if (codeQr.vente.statut !== StatutVente.FINALISEE) {
        throw new BadRequestException(
          `La vente n'est pas finalisée (statut : ${codeQr.vente.statut}).`,
        );
      }

      return tx.codeQr.update({
        where: { code },
        data: {
          statut: StatutCodeQr.UTILISE,
          utiliseAt: new Date(),
          verifieParId,
        },
        include: CODE_QR_INCLUDE,
      });
    });

    return {
      data: {
        ...result,
        payload: construirePayloadQr(result.code),
      },
      message: `Code validé — 1 × ${result.medicament.nom} authentifié.`,
    };
  }
}
