import { Controller, Get } from '@nestjs/common';
import { ApiCookieAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';

const STOCK_ALERTE_EXEMPLE = {
  medicamentId: '550e8400-e29b-41d4-a716-446655440000',
  nom: 'Paracetamol 500mg',
  quantite: 5,
  seuilMinimum: 10,
  message: 'Stock critique : Paracetamol 500mg — 5 unité(s) restante(s) (seuil : 10)',
  timestamp: '2026-07-07T10:30:00.000Z',
};

const COMMANDE_NOTIFICATION_EXEMPLE = {
  commandeId: '550e8400-e29b-41d4-a716-446655440001',
  clientId: '550e8400-e29b-41d4-a716-446655440002',
  type: 'refusee',
  motifRefus: 'Stock insuffisant — Ibuprofène (demandé : 10, disponible : 3)',
  automatique: true,
  message: 'Commande refusée : Stock insuffisant — Ibuprofène (demandé : 10, disponible : 3)',
  timestamp: '2026-07-07T10:30:00.000Z',
};

const FILE_ATTENTE_EXEMPLE = {
  type: 'appele',
  ticketId: '550e8400-e29b-41d4-a716-446655440003',
  numeroTicket: 15,
  typeService: 'PHARMACIE',
  statut: 'APPELE',
  position: 0,
  nomAffiche: 'Mme Kabongo',
  message: 'Ticket n°15 — veuillez vous présenter',
  timestamp: '2026-07-07T10:30:00.000Z',
};

const FILE_ATTENTE_STATS_EXEMPLE = {
  pharmacie: { enAttente: 4, enCours: 1, estimeeProchaine: 32 },
  caisse: { enAttente: 2, enCours: 0, estimeeProchaine: 10 },
  timestamp: '2026-07-07T10:30:00.000Z',
};

const WEBSOCKET_DOC = {
  description:
    'WebSocket temps réel via Socket.IO. Le serveur pousse les événements aux clients connectés.',
  connexion: {
    url: 'ws://<host>:<port>  (même host/port que l\'API REST)',
    bibliotheque: 'socket.io-client',
    exemple_js: [
      "import { io } from 'socket.io-client';",
      "const socket = io('http://localhost:3000');",
      "socket.on('stock-alerte', (data) => console.log(data));",
      "socket.on('commande-notification', (data) => console.log(data));",
      "socket.on('file-attente', (data) => console.log(data));",
      "socket.on('file-attente-stats', (data) => console.log(data));",
    ].join('\n'),
  },
  evenements: [
    {
      nom: 'stock-alerte',
      sens: 'serveur → client',
      ecouteurs: ['PHARMACIEN'],
      description:
        'Émis quand le stock atteint ou descend sous le seuil minimum. Afficher une boîte de dialogue.',
      declencheurs: [
        'Validation commande (déduction stock)',
        'Vente finalisée',
        'PATCH /api/stock/:medicamentId',
      ],
      payload: STOCK_ALERTE_EXEMPLE,
    },
    {
      nom: 'commande-notification',
      sens: 'serveur → client',
      ecouteurs: ['CLIENT', 'PHARMACIEN'],
      description:
        'Émis quand une commande est validée, refusée (auto ou manuel) ou prête au retrait.',
      declencheurs: [
        'PATCH /api/commandes/:id/valider',
        'PATCH /api/commandes/:id/refuser',
        'PATCH /api/commandes/:id/prete',
      ],
      payload: COMMANDE_NOTIFICATION_EXEMPLE,
      types: ['validee', 'refusee', 'prete'],
    },
    {
      nom: 'file-attente',
      sens: 'serveur → client',
      ecouteurs: ['CLIENT', 'PHARMACIEN', 'CAISSIER'],
      description:
        'Émis à chaque mouvement dans la file (rejoint, appelé, terminé, annulé, mise à jour).',
      declencheurs: [
        'POST /api/file-attente/rejoindre',
        'POST /api/file-attente/appeler-suivant',
        'PATCH /api/file-attente/:id/terminer',
        'PATCH /api/file-attente/:id/annuler',
      ],
      payload: FILE_ATTENTE_EXEMPLE,
      types: ['rejoint', 'appele', 'termine', 'annule', 'mise-a-jour'],
    },
    {
      nom: 'file-attente-stats',
      sens: 'serveur → client',
      ecouteurs: ['PHARMACIEN', 'CAISSIER'],
      description: 'Compteurs temps réel des files pharmacie et caisse.',
      payload: FILE_ATTENTE_STATS_EXEMPLE,
    },
  ],
  guide_frontend: 'Voir GUIDE_FRONTEND.md pour l\'intégration complète des boutons et écrans.',
};

@ApiTags('notifications')
@ApiCookieAuth('access_token')
@Controller('notifications')
export class NotificationsController {
  @Get('events')
  @ApiOperation({
    summary: 'Documentation des événements WebSocket (Socket.IO)',
    description:
      'Contrat complet : stock-alerte, commande-notification, file-attente, file-attente-stats.',
  })
  @ApiResponse({
    status: 200,
    description: 'Contrat WebSocket',
    schema: { example: WEBSOCKET_DOC },
  })
  getEventsDoc() {
    return WEBSOCKET_DOC;
  }
}
