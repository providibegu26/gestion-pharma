/**
 * @file response.interceptor.ts
 * @description Interceptor global qui enveloppe toutes les réponses réussies dans
 *              le format uniforme { success: true, data, message }.
 * @module Common
 *
 * RÔLE : Standardiser le format de toutes les réponses succès de l'application.
 * UTILISÉ PAR : main.ts (app.useGlobalInterceptors)
 * DÉPENDANCES : @nestjs/common, rxjs
 * SUPPRESSION : Les réponses retournent les données brutes sans enveloppe uniforme
 */

import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

/** Structure uniforme de toutes les réponses succès */
export interface ApiResponse<T> {
  success: true;
  data: T;
  message: string;
}

/** Structure que les controllers peuvent retourner pour personnaliser le message */
export interface ControllerResponse<T> {
  data: T;
  message: string;
}

@Injectable()
export class ResponseInterceptor<T>
  implements NestInterceptor<T, ApiResponse<T>>
{
  /**
   * @method intercept
   * @description Intercepte la réponse du controller et l'enveloppe dans ApiResponse
   * @param {ExecutionContext} context - Contexte d'exécution NestJS
   * @param {CallHandler} next - Gestionnaire de la suite du pipeline
   * @returns {Observable<ApiResponse<T>>} Flux de la réponse transformée
   */
  intercept(
    context: ExecutionContext,
    next: CallHandler<T>,
  ): Observable<ApiResponse<T>> {
    return next.handle().pipe(
      map((responseData) => {
        // Si le controller retourne { data, message }, on les extrait
        if (
          responseData !== null &&
          typeof responseData === 'object' &&
          'data' in responseData &&
          'message' in responseData
        ) {
          const typed = responseData as ControllerResponse<T>;
          return {
            success: true as const,
            data: typed.data,
            message: typed.message,
          };
        }

        // Sinon on enveloppe les données brutes avec un message par défaut
        return {
          success: true as const,
          data: responseData,
          message: 'Opération réussie',
        };
      }),
    );
  }
}
