import { Injectable } from '@nestjs/common';
import { NotificationsGateway } from './notifications.gateway';

@Injectable()
export class NotificationsService {
  constructor(private readonly gateway: NotificationsGateway) {}

  notifierStockCritique(data: {
    medicamentId: string;
    nom: string;
    quantite: number;
    seuilMinimum: number;
  }) {
    this.gateway.emitStockAlerte(data);
  }

  notifierCommandeValidee(data: { commandeId: string; clientId: string }) {
    this.gateway.emitCommandeNotification({
      ...data,
      type: 'validee',
    });
  }

  notifierCommandeRefusee(data: {
    commandeId: string;
    clientId: string;
    motifRefus: string;
    automatique: boolean;
  }) {
    this.gateway.emitCommandeNotification({
      commandeId: data.commandeId,
      clientId: data.clientId,
      type: 'refusee',
      motifRefus: data.motifRefus,
      automatique: data.automatique,
    });
  }

  notifierCommandePrete(data: { commandeId: string; clientId: string }) {
    this.gateway.emitCommandeNotification({
      ...data,
      type: 'prete',
    });
  }

  notifierFileAttente(
    data: Parameters<NotificationsGateway['emitFileAttente']>[0],
  ) {
    this.gateway.emitFileAttente(data);
  }

  notifierFileAttenteStats(
    stats: Parameters<NotificationsGateway['emitFileAttenteStats']>[0],
  ) {
    this.gateway.emitFileAttenteStats(stats);
  }
}
