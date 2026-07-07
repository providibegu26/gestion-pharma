import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Role, StatutCommande } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { QrCodeService } from '../qrcode/qrcode.service';
import { NotificationsService } from '../notifications/notifications.service';
import { CreateCommandeDto } from './dto/create-commande.dto';
import { RefuserCommandeDto } from './dto/refuser-commande.dto';
import {
  construirePayloadQrCommande,
  extraireCodeCommandeDepuisScan,
  genererCodeCommandeUnique,
} from './commandes-qr.utils';

const COMMANDE_INCLUDE = {
  client: {
    select: { id: true, nom: true, prenom: true, email: true },
  },
  refusePar: {
    select: { id: true, nom: true, prenom: true },
  },
  retirePar: {
    select: { id: true, nom: true, prenom: true },
  },
  lignes: {
    include: {
      medicament: {
        select: {
          id: true,
          nom: true,
          unite: true,
          prixCDF: true,
          prixUSD: true,
          stock: { select: { quantite: true, seuilMinimum: true } },
        },
      },
    },
  },
} as const;

interface StockInsuffisant {
  medicamentId: string;
  nom: string;
  demande: number;
  disponible: number;
}

@Injectable()
export class CommandesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly qrCodeService: QrCodeService,
    private readonly notifications: NotificationsService,
  ) {}

  async create(clientId: string, dto: CreateCommandeDto) {
    const ids = dto.lignes.map((l) => l.medicamentId);
    const medicaments = await this.prisma.medicament.findMany({
      where: { id: { in: ids } },
      select: { id: true, nom: true, prixCDF: true },
    });

    if (medicaments.length !== ids.length) {
      const found = new Set(medicaments.map((m) => m.id));
      const missing = ids.filter((id) => !found.has(id));
      throw new NotFoundException(
        `Médicament(s) introuvable(s) : ${missing.join(', ')}`,
      );
    }

    const prixMap = new Map(
      medicaments.map((m) => [m.id, Number(m.prixCDF)]),
    );
    const montantTotal = dto.lignes.reduce(
      (sum, l) => sum + (prixMap.get(l.medicamentId) ?? 0) * l.quantite,
      0,
    );

    let codeRetrait = genererCodeCommandeUnique();
    let collision = await this.prisma.commande.findUnique({
      where: { codeRetrait },
    });
    while (collision) {
      codeRetrait = genererCodeCommandeUnique();
      collision = await this.prisma.commande.findUnique({
        where: { codeRetrait },
      });
    }

    const qrImage = await this.qrCodeService.generateQrCodeFromPayload(
      construirePayloadQrCommande(codeRetrait),
    );

    const commande = await this.prisma.commande.create({
      data: {
        clientId,
        note: dto.note,
        montantTotal,
        codeRetrait,
        qrImage,
        lignes: {
          create: dto.lignes.map((l) => ({
            medicamentId: l.medicamentId,
            quantite: l.quantite,
          })),
        },
      },
      include: COMMANDE_INCLUDE,
    });

    return {
      data: {
        ...commande,
        payloadQr: construirePayloadQrCommande(codeRetrait),
      },
      message:
        'Commande créée avec code QR de retrait. Elle sera traitée par notre équipe.',
    };
  }

  async findAll() {
    const commandes = await this.prisma.commande.findMany({
      include: COMMANDE_INCLUDE,
      orderBy: { createdAt: 'desc' },
    });

    return {
      data: commandes.map((c) => this.enrichirCommande(c)),
      message: `${commandes.length} commande(s) trouvée(s).`,
    };
  }

  async findMesCommandes(clientId: string) {
    const commandes = await this.prisma.commande.findMany({
      where: { clientId },
      include: COMMANDE_INCLUDE,
      orderBy: { createdAt: 'desc' },
    });

    return {
      data: commandes.map((c) => this.enrichirCommande(c)),
      message: `${commandes.length} commande(s) trouvée(s).`,
    };
  }

  async findOne(id: string, requesterId: string, requesterRole: Role) {
    const commande = await this.prisma.commande.findUnique({
      where: { id },
      include: COMMANDE_INCLUDE,
    });

    if (!commande) {
      throw new NotFoundException(`Commande ${id} introuvable.`);
    }

    if (requesterRole === Role.CLIENT && commande.clientId !== requesterId) {
      throw new ForbiddenException(
        "Vous ne pouvez accéder qu'à vos propres commandes.",
      );
    }

    return {
      data: this.enrichirCommande(commande),
      message: 'Commande récupérée.',
    };
  }

  async findParCode(codeScan: string) {
    const code = extraireCodeCommandeDepuisScan(codeScan);
    const commande = await this.prisma.commande.findUnique({
      where: { codeRetrait: code },
      include: COMMANDE_INCLUDE,
    });

    if (!commande) {
      throw new NotFoundException(`Aucune commande pour le code "${code}".`);
    }

    return {
      data: {
        ...this.enrichirCommande(commande),
        retirable:
          commande.statut === StatutCommande.PRETE ||
          commande.statut === StatutCommande.VALIDEE,
      },
      message: this.messagePourStatut(commande.statut),
    };
  }

  async valider(id: string, pharmacienId: string) {
    const commande = await this.prisma.commande.findUnique({
      where: { id },
      include: {
        lignes: {
          include: {
            medicament: {
              select: { id: true, nom: true, stock: true },
            },
          },
        },
      },
    });

    if (!commande) {
      throw new NotFoundException(`Commande ${id} introuvable.`);
    }

    if (commande.statut !== StatutCommande.EN_ATTENTE) {
      throw new BadRequestException(
        `Impossible de valider : la commande est déjà "${commande.statut}".`,
      );
    }

    const stockInsuffisant = this.verifierStock(commande.lignes);
    if (stockInsuffisant.length > 0) {
      const motifRefus = this.construireMotifStockInsuffisant(stockInsuffisant);
      const refusee = await this.prisma.commande.update({
        where: { id },
        data: {
          statut: StatutCommande.REFUSEE,
          motifRefus,
          refuseAutomatique: true,
          refuseAt: new Date(),
        },
        include: COMMANDE_INCLUDE,
      });

      this.notifications.notifierCommandeRefusee({
        commandeId: id,
        clientId: commande.clientId,
        motifRefus,
        automatique: true,
      });

      return {
        data: this.enrichirCommande(refusee),
        message: motifRefus,
        refuseAutomatique: true,
      };
    }

    const updated = await this.prisma.$transaction(async (tx) => {
      for (const ligne of commande.lignes) {
        const stock = ligne.medicament.stock;
        if (!stock) {
          throw new BadRequestException(
            `Stock introuvable pour ${ligne.medicament.nom}.`,
          );
        }

        const nouvelleQuantite = stock.quantite - ligne.quantite;
        const stockUpdated = await tx.stock.update({
          where: { medicamentId: ligne.medicamentId },
          data: { quantite: nouvelleQuantite },
          include: {
            medicament: { select: { id: true, nom: true } },
          },
        });

        if (stockUpdated.quantite <= stockUpdated.seuilMinimum) {
          this.notifications.notifierStockCritique({
            medicamentId: stockUpdated.medicamentId,
            nom: stockUpdated.medicament.nom,
            quantite: stockUpdated.quantite,
            seuilMinimum: stockUpdated.seuilMinimum,
          });
        }
      }

      return tx.commande.update({
        where: { id },
        data: { statut: StatutCommande.PRETE },
        include: COMMANDE_INCLUDE,
      });
    });

    this.notifications.notifierCommandeValidee({
      commandeId: id,
      clientId: commande.clientId,
    });

    return {
      data: this.enrichirCommande(updated),
      message:
        'Commande validée — tous les produits sont confirmés. Prête pour retrait en pharmacie.',
    };
  }

  async refuser(id: string, pharmacienId: string, dto: RefuserCommandeDto) {
    const commande = await this.prisma.commande.findUnique({ where: { id } });

    if (!commande) {
      throw new NotFoundException(`Commande ${id} introuvable.`);
    }

    if (commande.statut !== StatutCommande.EN_ATTENTE) {
      throw new BadRequestException(
        `Impossible de refuser : la commande est déjà "${commande.statut}".`,
      );
    }

    const updated = await this.prisma.commande.update({
      where: { id },
      data: {
        statut: StatutCommande.REFUSEE,
        motifRefus: dto.motifRefus,
        refuseAutomatique: false,
        refuseParId: pharmacienId,
        refuseAt: new Date(),
      },
      include: COMMANDE_INCLUDE,
    });

    this.notifications.notifierCommandeRefusee({
      commandeId: id,
      clientId: commande.clientId,
      motifRefus: dto.motifRefus,
      automatique: false,
    });

    return {
      data: this.enrichirCommande(updated),
      message: 'Commande refusée avec justification.',
    };
  }

  async marquerPrete(id: string) {
    const commande = await this.prisma.commande.findUnique({ where: { id } });

    if (!commande) {
      throw new NotFoundException(`Commande ${id} introuvable.`);
    }

    if (
      commande.statut !== StatutCommande.VALIDEE &&
      commande.statut !== StatutCommande.PRETE
    ) {
      throw new BadRequestException(
        `Seule une commande validée peut être marquée prête (statut actuel : ${commande.statut}).`,
      );
    }

    if (commande.statut === StatutCommande.PRETE) {
      const existing = await this.prisma.commande.findUnique({
        where: { id },
        include: COMMANDE_INCLUDE,
      });
      return {
        data: this.enrichirCommande(existing!),
        message: 'Commande déjà prête pour retrait.',
      };
    }

    const updated = await this.prisma.commande.update({
      where: { id },
      data: { statut: StatutCommande.PRETE },
      include: COMMANDE_INCLUDE,
    });

    this.notifications.notifierCommandePrete({
      commandeId: id,
      clientId: commande.clientId,
    });

    return {
      data: this.enrichirCommande(updated),
      message: 'Commande prête pour retrait.',
    };
  }

  async retirerParCode(codeScan: string, pharmacienId: string) {
    const code = extraireCodeCommandeDepuisScan(codeScan);

    const commande = await this.prisma.commande.findUnique({
      where: { codeRetrait: code },
      include: COMMANDE_INCLUDE,
    });

    if (!commande) {
      throw new NotFoundException(`Aucune commande pour le code "${code}".`);
    }

    if (commande.statut === StatutCommande.RETIREE) {
      throw new BadRequestException(
        `Cette commande a déjà été retirée le ${commande.retraitAt?.toLocaleString('fr-CD') ?? '—'}.`,
      );
    }

    if (commande.statut === StatutCommande.REFUSEE) {
      throw new BadRequestException('Cette commande a été refusée.');
    }

    if (commande.statut === StatutCommande.EN_ATTENTE) {
      throw new BadRequestException(
        'Cette commande n\'a pas encore été validée par le pharmacien.',
      );
    }

    const updated = await this.prisma.commande.update({
      where: { id: commande.id },
      data: {
        statut: StatutCommande.RETIREE,
        retraitAt: new Date(),
        retireParId: pharmacienId,
      },
      include: COMMANDE_INCLUDE,
    });

    const nbProduits = updated.lignes.reduce((s, l) => s + l.quantite, 0);

    return {
      data: this.enrichirCommande(updated),
      message: `Retrait confirmé — ${nbProduits} produit(s) remis au client.`,
    };
  }

  async annuler(id: string, clientId: string) {
    const commande = await this.prisma.commande.findUnique({ where: { id } });

    if (!commande) {
      throw new NotFoundException(`Commande ${id} introuvable.`);
    }

    if (commande.clientId !== clientId) {
      throw new ForbiddenException('Vous ne pouvez annuler que vos propres commandes.');
    }

    if (commande.statut !== StatutCommande.EN_ATTENTE) {
      throw new BadRequestException(
        `Impossible d'annuler : la commande est "${commande.statut}".`,
      );
    }

    const updated = await this.prisma.commande.update({
      where: { id },
      data: {
        statut: StatutCommande.REFUSEE,
        motifRefus: 'Annulée par le client.',
        refuseAutomatique: true,
        refuseAt: new Date(),
      },
      include: COMMANDE_INCLUDE,
    });

    return {
      data: this.enrichirCommande(updated),
      message: 'Commande annulée.',
    };
  }

  private verifierStock(
    lignes: Array<{
      medicamentId: string;
      quantite: number;
      medicament: { id: string; nom: string; stock: { quantite: number } | null };
    }>,
  ): StockInsuffisant[] {
    const insuffisants: StockInsuffisant[] = [];

    for (const ligne of lignes) {
      const disponible = ligne.medicament.stock?.quantite ?? 0;
      if (disponible < ligne.quantite) {
        insuffisants.push({
          medicamentId: ligne.medicamentId,
          nom: ligne.medicament.nom,
          demande: ligne.quantite,
          disponible,
        });
      }
    }

    return insuffisants;
  }

  private construireMotifStockInsuffisant(items: StockInsuffisant[]): string {
    const details = items
      .map(
        (i) =>
          `${i.nom} (demandé : ${i.demande}, disponible : ${i.disponible})`,
      )
      .join(' ; ');
    return `Stock insuffisant — ${details}`;
  }

  private enrichirCommande<T extends { codeRetrait: string | null }>(commande: T) {
    return {
      ...commande,
      payloadQr: commande.codeRetrait
        ? construirePayloadQrCommande(commande.codeRetrait)
        : null,
    };
  }

  private messagePourStatut(statut: StatutCommande): string {
    switch (statut) {
      case StatutCommande.EN_ATTENTE:
        return 'Commande en attente de validation.';
      case StatutCommande.PRETE:
      case StatutCommande.VALIDEE:
        return 'Commande validée — prête pour retrait.';
      case StatutCommande.RETIREE:
        return 'Commande déjà retirée.';
      case StatutCommande.REFUSEE:
        return 'Commande refusée.';
      default:
        return 'Commande récupérée.';
    }
  }
}
