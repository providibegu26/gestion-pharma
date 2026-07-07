/**
 * @file http-exception.filter.ts
 * @description Filtre global qui capture toutes les HttpException et les formate
 *              en réponse JSON uniforme avec success: false.
 * @module Common
 *
 * RÔLE : Standardiser le format de toutes les erreurs HTTP de l'application.
 * UTILISÉ PAR : main.ts (app.useGlobalFilters)
 * DÉPENDANCES : @nestjs/common
 * SUPPRESSION : Les erreurs retournent le format par défaut NestJS (incohérent)
 */

import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { Request, Response } from 'express';

/** Structure uniforme de toutes les réponses d'erreur */
interface ErrorResponse {
  success: false;
  statusCode: number;
  message: string | string[];
  timestamp: string;
  path: string;
}

// @Catch(HttpException) : intercepte uniquement les HttpException (pas les erreurs système)
@Catch(HttpException)
export class HttpExceptionFilter implements ExceptionFilter {
  /**
   * @method catch
   * @description Intercepte une HttpException et retourne une réponse formatée
   * @param {HttpException} exception - L'exception levée
   * @param {ArgumentsHost} host - Contexte d'exécution (accès à req/res)
   * @returns {void} Envoie directement la réponse HTTP
   */
  catch(exception: HttpException, host: ArgumentsHost): void {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    // Récupère le code HTTP (400, 401, 403, 404, 500, etc.)
    const statusCode = exception.getStatus();

    // Récupère le message d'erreur (peut être string ou objet avec validation errors)
    const exceptionResponse = exception.getResponse();
    const message =
      typeof exceptionResponse === 'object' &&
      'message' in (exceptionResponse as object)
        ? (exceptionResponse as { message: string | string[] }).message
        : exception.message;

    const errorBody: ErrorResponse = {
      success: false,
      statusCode,
      message,
      timestamp: new Date().toISOString(),
      path: request.url,
    };

    response.status(statusCode).json(errorBody);
  }
}

/** Format des erreurs non-HTTP (erreurs serveur inattendues) */
@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  /**
   * @method catch
   * @description Intercepte toutes les erreurs non-HTTP (erreurs Prisma, bugs, etc.)
   * @param {unknown} exception - N'importe quelle erreur
   * @param {ArgumentsHost} host - Contexte d'exécution
   */
  catch(exception: unknown, host: ArgumentsHost): void {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    const statusCode = HttpStatus.INTERNAL_SERVER_ERROR;
    const message =
      exception instanceof Error ? exception.message : 'Erreur interne du serveur';

    response.status(statusCode).json({
      success: false,
      statusCode,
      message,
      timestamp: new Date().toISOString(),
      path: request.url,
    });
  }
}
