import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Role, StatutFile, TypeServiceFile } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { NotificationsService } from '../notifications/notifications.service';
import { RejoindreFileDto } from './dto/rejoindre-file.dto';

const TEMPS_MOYEN: Record<TypeServiceFile, number> = {
  [TypeServiceFile.PHARMACIE]: 8,
  [TypeServiceFile.CAISSE]: 5,
};

const FILE_INCLUDE = {
  client: { select: { id: true, nom: true, prenom: true, email: true } },
  appelePar: { select: { id: true, nom: true, prenom: true } },
} as const;

const STATUTS_ACTIFS: StatutFile[] = [
  StatutFile.EN_ATTENTE,
  StatutFile.APPELE,
  StatutFile.EN_COURS,
];

@Injectable()
export class FileAttenteService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly notifications: NotificationsService,
  ) {}

  async rejoindre(
    dto: RejoindreFileDto,
    clientId?: string,
    nomClient?: string,
  ) {
    if (clientId) {
      const existant = await this.prisma.fileAttente.findFirst({
        where: {
          clientId,
          typeService: dto.typeService,
          statut: { in: STATUTS_ACTIFS },
        },
      });
      if (existant) {
        return {
          data: existant,
          message: `Vous êtes déjà en file — ticket n°${existant.numeroTicket}, position ${existant.position}.`,
        };
      }
    }

    const debutJour = this.debutJournee();
    const finJour = this.finJournee();

    const numeroTicket = await this.prochainNumeroTicket(
      dto.typeService,
      debutJour,
      finJour,
    );

    const enAttente = await this.prisma.fileAttente.count({
      where: {
        typeService: dto.typeService,
        statut: StatutFile.EN_ATTENTE,
        createdAt: { gte: debutJour, lt: finJour },
      },
    });

    const position = enAttente + 1;
    const estimeeMinutes = this.calculerEstimee(dto.typeService, position);

    const nomAffiche =
      dto.nomAffiche ?? (nomClient ? nomClient : clientId ? 'Client' : null);

    const ticket = await this.prisma.fileAttente.create({
      data: {
        numeroTicket,
        clientId: clientId ?? null,
        nomAffiche,
        typeService: dto.typeService,
        position,
        estimeeMinutes,
      },
      include: FILE_INCLUDE,
    });

    this.notifierTicket('rejoint', ticket);

    await this.emitStats();

    return {
      data: ticket,
      message: `Ticket n°${numeroTicket} — position ${position}, attente estimée ~${estimeeMinutes} min.`,
    };
  }

  async maPosition(clientId: string) {
    const ticket = await this.prisma.fileAttente.findFirst({
      where: {
        clientId,
        statut: { in: STATUTS_ACTIFS },
      },
      orderBy: { createdAt: 'desc' },
      include: FILE_INCLUDE,
    });

    if (!ticket) {
      throw new NotFoundException('Vous n\'êtes pas dans la file d\'attente.');
    }

    const positionActuelle = await this.calculerPositionReelle(ticket);

    return {
      data: {
        ...ticket,
        positionActuelle,
        estimeeMinutes: this.calculerEstimee(
          ticket.typeService,
          positionActuelle,
        ),
      },
      message: `Position ${positionActuelle} — ticket n°${ticket.numeroTicket}.`,
    };
  }

  async lister(typeService?: TypeServiceFile) {
    const debutJour = this.debutJournee();

    const tickets = await this.prisma.fileAttente.findMany({
      where: {
        ...(typeService && { typeService }),
        statut: { in: STATUTS_ACTIFS },
        createdAt: { gte: debutJour },
      },
      include: FILE_INCLUDE,
      orderBy: [{ typeService: 'asc' }, { position: 'asc' }, { createdAt: 'asc' }],
    });

    return {
      data: tickets,
      message: `${tickets.length} personne(s) en file aujourd'hui.`,
    };
  }

  async stats() {
    const stats = await this.calculerStats();
    return { data: stats, message: 'Statistiques file d\'attente.' };
  }

  async appelerSuivant(typeService: TypeServiceFile, staffId: string, staffRole: Role) {
    this.verifierRolePourService(typeService, staffRole);

    const enCours = await this.prisma.fileAttente.findFirst({
      where: {
        appeleParId: staffId,
        typeService,
        statut: { in: [StatutFile.APPELE, StatutFile.EN_COURS] },
        createdAt: { gte: this.debutJournee() },
      },
    });

    if (enCours) {
      throw new BadRequestException(
        `Terminez d'abord le ticket n°${enCours.numeroTicket} avant d'appeler le suivant.`,
      );
    }

    const appele = await this.appelerProchainTicket(typeService, staffId);

    if (!appele) {
      throw new NotFoundException('Aucune personne en attente dans cette file.');
    }

    await this.emitStats();

    return {
      data: appele,
      message: `Ticket n°${appele.numeroTicket} appelé — ${appele.nomAffiche ?? 'client'}.`,
    };
  }

  async demarrerService(id: string, staffId: string) {
    const ticket = await this.getTicketOrThrow(id);

    if (ticket.statut !== StatutFile.APPELE) {
      throw new BadRequestException('Seul un ticket appelé peut démarrer le service.');
    }

    if (ticket.appeleParId && ticket.appeleParId !== staffId) {
      throw new BadRequestException('Ce ticket est géré par un autre membre du personnel.');
    }

    const updated = await this.prisma.fileAttente.update({
      where: { id },
      data: { statut: StatutFile.EN_COURS },
      include: FILE_INCLUDE,
    });

    await this.emitStats();

    return { data: updated, message: `Service démarré — ticket n°${updated.numeroTicket}.` };
  }

  async terminer(id: string, staffId: string) {
    const ticket = await this.getTicketOrThrow(id);

    if (
      ticket.statut !== StatutFile.APPELE &&
      ticket.statut !== StatutFile.EN_COURS
    ) {
      throw new BadRequestException('Ce ticket ne peut pas être terminé.');
    }

    const updated = await this.prisma.fileAttente.update({
      where: { id },
      data: {
        statut: StatutFile.TERMINE,
        termineAt: new Date(),
        appeleParId: ticket.appeleParId ?? staffId,
      },
      include: FILE_INCLUDE,
    });

    await this.recalculerPositions(ticket.typeService);

    this.notifierTicket('termine', updated);

    await this.emitStats();

  // Appel automatique du suivant si file chargée
    const stats = await this.calculerStats();
    const fileStats =
      ticket.typeService === TypeServiceFile.PHARMACIE
        ? stats.pharmacie
        : stats.caisse;

    if (fileStats.enAttente > 0) {
      try {
        await this.appelerProchainTicket(ticket.typeService, staffId);
      } catch {
        // Pas de suivant ou staff occupé — ignoré
      }
    }

    return {
      data: updated,
      message: `Ticket n°${updated.numeroTicket} terminé.`,
    };
  }

  async annuler(id: string, requesterId: string, requesterRole: Role) {
    const ticket = await this.getTicketOrThrow(id);

    if (ticket.statut === StatutFile.TERMINE) {
      throw new BadRequestException('Ce ticket est déjà terminé.');
    }

    const isStaff =
      requesterRole === Role.PHARMACIEN ||
      requesterRole === Role.CAISSIER ||
      requesterRole === Role.ADMIN;
    const isOwner = ticket.clientId === requesterId;

    if (!isStaff && !isOwner) {
      throw new BadRequestException('Vous ne pouvez pas annuler ce ticket.');
    }

    const updated = await this.prisma.fileAttente.update({
      where: { id },
      data: { statut: StatutFile.ANNULE, termineAt: new Date() },
      include: FILE_INCLUDE,
    });

    await this.recalculerPositions(ticket.typeService);

    this.notifierTicket('annule', updated);

    await this.emitStats();

    return { data: updated, message: `Ticket n°${updated.numeroTicket} annulé.` };
  }

  /**
   * Appelle le prochain ticket EN_ATTENTE d'une file et le passe à APPELE.
   * Utilisé à la fois par l'appel manuel (appelerSuivant) et l'appel
   * automatique déclenché après qu'un ticket soit terminé.
   */
  private async appelerProchainTicket(
    typeService: TypeServiceFile,
    staffId: string,
  ) {
    const suivant = await this.prisma.fileAttente.findFirst({
      where: {
        typeService,
        statut: StatutFile.EN_ATTENTE,
        createdAt: { gte: this.debutJournee() },
      },
      orderBy: [{ position: 'asc' }, { createdAt: 'asc' }],
    });

    if (!suivant) return null;

    const appele = await this.prisma.fileAttente.update({
      where: { id: suivant.id },
      data: {
        statut: StatutFile.APPELE,
        appeleParId: staffId,
        appeleAt: new Date(),
      },
      include: FILE_INCLUDE,
    });

    await this.recalculerPositions(typeService);

    this.notifierTicket('appele', appele);

    return appele;
  }

  private notifierTicket(
    type: 'rejoint' | 'appele' | 'termine' | 'annule',
    ticket: {
      id: string;
      numeroTicket: number;
      typeService: TypeServiceFile;
      statut: StatutFile;
      nomAffiche: string | null;
      position?: number;
      estimeeMinutes?: number | null;
    },
  ) {
    this.notifications.notifierFileAttente({
      type,
      ticketId: ticket.id,
      numeroTicket: ticket.numeroTicket,
      typeService: ticket.typeService,
      statut: ticket.statut,
      nomAffiche: ticket.nomAffiche,
      ...(ticket.position !== undefined && { position: ticket.position }),
      ...(ticket.estimeeMinutes !== undefined && {
        estimeeMinutes: ticket.estimeeMinutes ?? undefined,
      }),
    });
  }

  private async recalculerPositions(typeService: TypeServiceFile) {
    const debutJour = this.debutJournee();
    const enAttente = await this.prisma.fileAttente.findMany({
      where: {
        typeService,
        statut: StatutFile.EN_ATTENTE,
        createdAt: { gte: debutJour },
      },
      orderBy: [{ createdAt: 'asc' }],
    });

    await Promise.all(
      enAttente.map((ticket, i) => {
        const position = i + 1;
        return this.prisma.fileAttente.update({
          where: { id: ticket.id },
          data: {
            position,
            estimeeMinutes: this.calculerEstimee(typeService, position),
          },
        });
      }),
    );

    this.notifications.notifierFileAttente({
      type: 'mise-a-jour',
      ticketId: 'system',
      numeroTicket: 0,
      typeService,
      statut: 'MISE_A_JOUR',
    });
  }

  private async calculerPositionReelle(ticket: {
    id: string;
    typeService: TypeServiceFile;
    statut: StatutFile;
    createdAt: Date;
  }): Promise<number> {
    if (ticket.statut !== StatutFile.EN_ATTENTE) return 0;

    const avant = await this.prisma.fileAttente.count({
      where: {
        typeService: ticket.typeService,
        statut: StatutFile.EN_ATTENTE,
        createdAt: { gte: this.debutJournee(), lt: ticket.createdAt },
      },
    });

    return avant + 1;
  }

  private calculerEstimee(typeService: TypeServiceFile, position: number): number {
    return Math.max(1, position * TEMPS_MOYEN[typeService]);
  }

  private async prochainNumeroTicket(
    typeService: TypeServiceFile,
    debut: Date,
    fin: Date,
  ): Promise<number> {
    const dernier = await this.prisma.fileAttente.findFirst({
      where: {
        typeService,
        createdAt: { gte: debut, lt: fin },
      },
      orderBy: { numeroTicket: 'desc' },
    });

    return (dernier?.numeroTicket ?? 0) + 1;
  }

  private async calculerStats() {
    const debutJour = this.debutJournee();

    const [pharmaAttente, pharmaCours, caisseAttente, caisseCours] =
      await Promise.all([
        this.prisma.fileAttente.count({
          where: {
            typeService: TypeServiceFile.PHARMACIE,
            statut: StatutFile.EN_ATTENTE,
            createdAt: { gte: debutJour },
          },
        }),
        this.prisma.fileAttente.count({
          where: {
            typeService: TypeServiceFile.PHARMACIE,
            statut: { in: [StatutFile.APPELE, StatutFile.EN_COURS] },
            createdAt: { gte: debutJour },
          },
        }),
        this.prisma.fileAttente.count({
          where: {
            typeService: TypeServiceFile.CAISSE,
            statut: StatutFile.EN_ATTENTE,
            createdAt: { gte: debutJour },
          },
        }),
        this.prisma.fileAttente.count({
          where: {
            typeService: TypeServiceFile.CAISSE,
            statut: { in: [StatutFile.APPELE, StatutFile.EN_COURS] },
            createdAt: { gte: debutJour },
          },
        }),
      ]);

    return {
      pharmacie: {
        enAttente: pharmaAttente,
        enCours: pharmaCours,
        estimeeProchaine: this.calculerEstimee(
          TypeServiceFile.PHARMACIE,
          Math.max(1, pharmaAttente),
        ),
      },
      caisse: {
        enAttente: caisseAttente,
        enCours: caisseCours,
        estimeeProchaine: this.calculerEstimee(
          TypeServiceFile.CAISSE,
          Math.max(1, caisseAttente),
        ),
      },
    };
  }

  private async emitStats() {
    const stats = await this.calculerStats();
    this.notifications.notifierFileAttenteStats(stats);
  }

  private async getTicketOrThrow(id: string) {
    const ticket = await this.prisma.fileAttente.findUnique({ where: { id } });
    if (!ticket) {
      throw new NotFoundException(`Ticket ${id} introuvable.`);
    }
    return ticket;
  }

  private verifierRolePourService(typeService: TypeServiceFile, role: Role) {
    if (typeService === TypeServiceFile.PHARMACIE && role !== Role.PHARMACIEN) {
      throw new BadRequestException('Seul un pharmacien peut gérer la file pharmacie.');
    }
    if (typeService === TypeServiceFile.CAISSE && role !== Role.CAISSIER) {
      throw new BadRequestException('Seul un caissier peut gérer la file caisse.');
    }
  }

  private debutJournee(): Date {
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    return d;
  }

  private finJournee(): Date {
    const d = new Date();
    d.setHours(23, 59, 59, 999);
    return d;
  }
}
