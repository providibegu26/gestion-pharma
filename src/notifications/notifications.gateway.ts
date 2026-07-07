import { WebSocketGateway, WebSocketServer } from '@nestjs/websockets';
import { Server } from 'socket.io';

export interface StockAlertePayload {
  medicamentId: string;
  nom: string;
  quantite: number;
  seuilMinimum: number;
  message: string;
  timestamp: string;
}

export interface CommandeNotificationPayload {
  commandeId: string;
  clientId: string;
  type: 'validee' | 'refusee' | 'prete';
  motifRefus?: string;
  automatique?: boolean;
  message: string;
  timestamp: string;
}

export interface FileAttentePayload {
  type: 'rejoint' | 'appele' | 'termine' | 'annule' | 'mise-a-jour';
  ticketId: string;
  numeroTicket: number;
  typeService: string;
  statut: string;
  position?: number;
  estimeeMinutes?: number;
  nomAffiche?: string | null;
  message: string;
  timestamp: string;
}

export interface FileAttenteStatsPayload {
  pharmacie: { enAttente: number; enCours: number; estimeeProchaine: number };
  caisse: { enAttente: number; enCours: number; estimeeProchaine: number };
  timestamp: string;
}

@WebSocketGateway({
  cors: {
    origin: '*',
    credentials: false,
  },
})
export class NotificationsGateway {
  @WebSocketServer()
  server: Server;

  emitStockAlerte(data: Omit<StockAlertePayload, 'message' | 'timestamp'>) {
    const payload: StockAlertePayload = {
      ...data,
      message: `Stock critique : ${data.nom} — ${data.quantite} unité(s) restante(s) (seuil : ${data.seuilMinimum})`,
      timestamp: new Date().toISOString(),
    };
    this.server.emit('stock-alerte', payload);
  }

  emitCommandeNotification(data: Omit<CommandeNotificationPayload, 'message' | 'timestamp'>) {
    const messages: Record<CommandeNotificationPayload['type'], string> = {
      validee: 'Votre commande a été validée et est prête pour retrait.',
      refusee: data.motifRefus
        ? `Commande refusée : ${data.motifRefus}`
        : 'Votre commande a été refusée.',
      prete: 'Votre commande est prête — vous pouvez venir la récupérer.',
    };

    const payload: CommandeNotificationPayload = {
      ...data,
      message: messages[data.type],
      timestamp: new Date().toISOString(),
    };

    this.server.emit('commande-notification', payload);
    this.server.to(`client:${data.clientId}`).emit('commande-notification', payload);
  }

  emitFileAttente(data: Omit<FileAttentePayload, 'message' | 'timestamp'>) {
    const messages: Record<FileAttentePayload['type'], string> = {
      rejoint: `Ticket n°${data.numeroTicket} — position ${data.position ?? '—'}`,
      appele: `Ticket n°${data.numeroTicket} — veuillez vous présenter`,
      termine: `Ticket n°${data.numeroTicket} — service terminé`,
      annule: `Ticket n°${data.numeroTicket} — annulé`,
      'mise-a-jour': 'File d\'attente mise à jour',
    };

    const payload: FileAttentePayload = {
      ...data,
      message: messages[data.type],
      timestamp: new Date().toISOString(),
    };

    this.server.emit('file-attente', payload);
  }

  emitFileAttenteStats(stats: Omit<FileAttenteStatsPayload, 'timestamp'>) {
    const payload: FileAttenteStatsPayload = {
      ...stats,
      timestamp: new Date().toISOString(),
    };
    this.server.emit('file-attente-stats', payload);
  }
}
