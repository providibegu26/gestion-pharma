/**
 * @file main.ts
 * @description Point d'entrée de l'application NestJS. Configure globalement les middlewares,
 *              pipes, filtres, interceptors, cookies, CORS et la documentation Swagger.
 * @module Core
 *
 * RÔLE : Bootstrap de l'application. Tous les composants globaux sont enregistrés ici.
 * UTILISÉ PAR : Node.js directement au démarrage via `node dist/main.js`
 * DÉPENDANCES : AppModule, HttpExceptionFilter, ResponseInterceptor, ValidationPipe, Swagger
 * SUPPRESSION : L'application ne peut plus démarrer
 */

import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
// eslint-disable-next-line @typescript-eslint/no-require-imports
const cookieParser = require('cookie-parser') as typeof import('cookie-parser');
import { AppModule } from './app.module';
import { HttpExceptionFilter } from './common/filters/http-exception.filter';
import { ResponseInterceptor } from './common/interceptors/response.interceptor';

/**
 * Origines autorisées à accéder à l'API.
 * - React + Vite tourne par défaut sur http://localhost:5173
 * - Next.js tourne par défaut sur http://localhost:3000
 * - En production, remplacer par l'URL réelle du frontend (ex: https://pharmacie.cd)
 *
 * IMPORTANT : avec les cookies HTTP-only, on NE PEUT PAS utiliser origin: '*'.
 * L'origine doit être explicitement listée sinon le navigateur refuse les cookies.
 */
const ALLOWED_ORIGINS = (process.env.ALLOWED_ORIGINS ?? '')
  .split(',')
  .map((o) => o.trim())
  .filter(Boolean);

// Origines par défaut pour le développement local si ALLOWED_ORIGINS n'est pas défini
const DEFAULT_DEV_ORIGINS = [
  'http://localhost:5173',          // React + Vite
  'http://localhost:5174',          // React + Vite (port alternatif)
  'http://localhost:3000',          // Next.js
  'http://localhost:3001',          // Next.js (port alternatif)
  'https://pharmacie.loophole.site', // Tunnel loophole (npm run start:tunnel)
];

async function bootstrap(): Promise<void> {
  const app = await NestFactory.create(AppModule);

  // Origines autorisées : env variable en production, défauts en développement
  const allowedOrigins =
    ALLOWED_ORIGINS.length > 0 ? ALLOWED_ORIGINS : DEFAULT_DEV_ORIGINS;

  /**
   * CORS — Cross-Origin Resource Sharing
   *
   * Pourquoi credentials: true ?
   * Les cookies HTTP-only ne sont envoyés par le navigateur que si :
   *   1. Le serveur répond avec Access-Control-Allow-Credentials: true
   *   2. L'origine du frontend est explicitement autorisée (pas '*')
   *   3. Le frontend fait ses requêtes avec { credentials: 'include' } (fetch)
   *      ou withCredentials: true (axios)
   *
   * Sans cette configuration, les cookies ne sont jamais envoyés → 401 sur toutes
   * les routes protégées après le login.
   */
  app.enableCors({
    origin: (origin, callback) => {
      // Autorise les requêtes sans origin (Postman, curl, Swagger sur même domaine)
      if (!origin) {
        callback(null, true);
        return;
      }
      if (allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        callback(new Error(`Origine non autorisée par CORS : ${origin}`));
      }
    },
    credentials: true,           // OBLIGATOIRE pour que les cookies soient transmis
    methods: ['GET', 'POST', 'PATCH', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: [
      'Content-Type',
      'Accept',
      'Authorization',
      'X-Requested-With',
    ],
    exposedHeaders: ['Set-Cookie'], // Permet au frontend de voir le header Set-Cookie
  });

  // Préfixe global pour toutes les routes : /api/patients, /api/ventes, etc.
  app.setGlobalPrefix('api');

  // Middleware cookie-parser : permet de lire req.cookies dans les stratégies JWT
  app.use(cookieParser());

  // Filtre global : formate toutes les HttpException en { success: false, statusCode, message }
  app.useGlobalFilters(new HttpExceptionFilter());

  // Interceptor global : enveloppe toutes les réponses en { success: true, data, message }
  app.useGlobalInterceptors(new ResponseInterceptor());

  // Pipe global : valide et transforme les DTO entrants via class-validator
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      transformOptions: {
        enableImplicitConversion: true,
      },
    }),
  );

  // Configuration Swagger — documentation API interactive
  const swaggerConfig = new DocumentBuilder()
    .setTitle('Pharmacie Backend RDC')
    .setDescription(
      'API REST pour la gestion de pharmacie digitale adaptée à la RDC. ' +
      'Authentification via cookies HTTP-only. Double devise CDF/USD.',
    )
    .setVersion('1.0')
    .addTag('auth', 'Authentification et gestion des sessions')
    .addTag('users', 'Gestion du personnel')
    .addTag('patients', 'Gestion des patients')
    .addTag('medicaments', 'Catalogue des médicaments')
    .addTag('stock', 'Gestion des stocks')
    .addTag('ordonnances', 'Gestion des ordonnances médicales')
    .addTag('ventes', 'Processus de vente')
    .addTag('fournisseurs', 'Gestion des fournisseurs')
    .addTag('commandes', 'Commandes clients — catalogue et suivi')
    .addTag('file-attente', 'File d\'attente automatique — pharmacie et caisse')
    .addTag('notifications', 'WebSocket temps réel — alertes de stock critique (Socket.IO)')
    .addCookieAuth('access_token')
    .build();

  const document = SwaggerModule.createDocument(app, swaggerConfig);
  SwaggerModule.setup('api/docs', app, document, {
    swaggerOptions: {
      withCredentials: true, // Envoie les cookies dans les requêtes Swagger
    },
  });

  const port = process.env.PORT ?? 3000;
  const tunnelHostname = process.env.TUNNEL_HOSTNAME ?? 'pharmacie';
  const tunnelUrl = `https://${tunnelHostname}.loophole.site`;

  await app.listen(port);

 
  console.log(` Serveur local   : http://localhost:${port}/api`);
  console.log(` Swagger local   : http://localhost:${port}/api/docs`);
  console.log('----------------------------------------');
  console.log(` Tunnel URL      : ${tunnelUrl}/api`);
  console.log(` Swagger tunnel  : ${tunnelUrl}/api/docs`);
  
  
}

bootstrap();
