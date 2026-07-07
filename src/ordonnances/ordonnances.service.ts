/**
 * @file ordonnances.service.ts
 * @description Service de gestion du cycle de vie des ordonnances médicales.
 *              Gère la création, validation, refus et consultation des ordonnances.
 * @module OrdonnancesModule
 *
 * RÔLE : Logique métier des ordonnances avec gestion des statuts.
 * UTILISÉ PAR : OrdonnancesController
 * DÉPENDANCES : PrismaService
 * SUPPRESSION : Aucune gestion des ordonnances possible
 */

import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Ordonnance, StatutOrdonnance } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { CreateOrdonnanceDto } from './dto/create-ordonnance.dto';
import { UpdateOrdonnanceDto } from './dto/update-ordonnance.dto';

/** Type ordonnance avec patient et vente inclus */
type OrdonnanceWithRelations = Ordonnance & {
  patient: { id: string; nom: string; prenom: string; telephone: string };
  vente: { id: string; montantTotal: object; statut: string } | null;
};

@Injectable()
export class OrdonnancesService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * @method create
   * @description Enregistre une nouvelle ordonnance avec statut EN_ATTENTE.
   * @param {CreateOrdonnanceDto} dto - Données de l'ordonnance
   * @returns {Promise<{ data: OrdonnanceWithRelations; message: string }>}
   * @throws {NotFoundException} Si le patient n'existe pas
   */
  async create(
    dto: CreateOrdonnanceDto,
  ): Promise<{ data: OrdonnanceWithRelations; message: string }> {
    // Vérifie que le patient existe
    const patientExists = await this.prisma.patient.findUnique({
      where: { id: dto.patientId },
    });

    if (!patientExists) {
      throw new NotFoundException(
        `Patient avec l'ID ${dto.patientId} introuvable.`,
      );
    }

    const ordonnance = await this.prisma.ordonnance.create({
      data: {
        patientId: dto.patientId,
        prescripteur: dto.prescripteur,
        imageUrl: dto.imageUrl,
        statut: StatutOrdonnance.EN_ATTENTE, // Statut initial toujours EN_ATTENTE
      },
      include: {
        patient: {
          select: { id: true, nom: true, prenom: true, telephone: true },
        },
        vente: {
          select: { id: true, montantTotal: true, statut: true },
        },
      },
    });

    return {
      data: ordonnance,
      message: 'Ordonnance enregistrée, en attente de validation.',
    };
  }

  /**
   * @method findAll
   * @description Liste toutes les ordonnances avec informations patient.
   * @returns {Promise<{ data: OrdonnanceWithRelations[]; message: string }>}
   */
  async findAll(): Promise<{ data: OrdonnanceWithRelations[]; message: string }> {
    const ordonnances = await this.prisma.ordonnance.findMany({
      include: {
        patient: {
          select: { id: true, nom: true, prenom: true, telephone: true },
        },
        vente: {
          select: { id: true, montantTotal: true, statut: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return {
      data: ordonnances,
      message: `${ordonnances.length} ordonnance(s) trouvée(s).`,
    };
  }

  /**
   * @method findOne
   * @description Retourne une ordonnance avec ses relations.
   * @param {string} id - UUID de l'ordonnance
   * @returns {Promise<{ data: OrdonnanceWithRelations; message: string }>}
   * @throws {NotFoundException} Si l'ordonnance n'existe pas
   */
  async findOne(id: string): Promise<{ data: OrdonnanceWithRelations; message: string }> {
    const ordonnance = await this.prisma.ordonnance.findUnique({
      where: { id },
      include: {
        patient: {
          select: { id: true, nom: true, prenom: true, telephone: true },
        },
        vente: {
          select: { id: true, montantTotal: true, statut: true },
        },
      },
    });

    if (!ordonnance) {
      throw new NotFoundException(`Ordonnance avec l'ID ${id} introuvable.`);
    }

    return { data: ordonnance, message: 'Ordonnance récupérée.' };
  }

  /**
   * @method valider
   * @description Valide une ordonnance (PHARMACIEN). Passe le statut à VALIDEE.
   * @param {string} id - UUID de l'ordonnance
   * @returns {Promise<{ data: OrdonnanceWithRelations; message: string }>}
   * @throws {NotFoundException} Si l'ordonnance n'existe pas
   * @throws {BadRequestException} Si l'ordonnance n'est pas EN_ATTENTE
   */
  async valider(id: string): Promise<{ data: OrdonnanceWithRelations; message: string }> {
    const { data: ordonnance } = await this.findOne(id);

    // Seule une ordonnance EN_ATTENTE peut être validée
    if (ordonnance.statut !== StatutOrdonnance.EN_ATTENTE) {
      throw new BadRequestException(
        `L'ordonnance ne peut pas être validée (statut actuel : ${ordonnance.statut}).`,
      );
    }

    const updated = await this.prisma.ordonnance.update({
      where: { id },
      data: { statut: StatutOrdonnance.VALIDEE },
      include: {
        patient: {
          select: { id: true, nom: true, prenom: true, telephone: true },
        },
        vente: {
          select: { id: true, montantTotal: true, statut: true },
        },
      },
    });

    return { data: updated, message: 'Ordonnance validée.' };
  }

  /**
   * @method refuser
   * @description Refuse une ordonnance (PHARMACIEN). Passe le statut à REFUSEE.
   * @param {string} id - UUID de l'ordonnance
   * @returns {Promise<{ data: OrdonnanceWithRelations; message: string }>}
   * @throws {NotFoundException} Si l'ordonnance n'existe pas
   * @throws {BadRequestException} Si l'ordonnance n'est pas EN_ATTENTE
   */
  async refuser(id: string): Promise<{ data: OrdonnanceWithRelations; message: string }> {
    const { data: ordonnance } = await this.findOne(id);

    if (ordonnance.statut !== StatutOrdonnance.EN_ATTENTE) {
      throw new BadRequestException(
        `L'ordonnance ne peut pas être refusée (statut actuel : ${ordonnance.statut}).`,
      );
    }

    const updated = await this.prisma.ordonnance.update({
      where: { id },
      data: { statut: StatutOrdonnance.REFUSEE },
      include: {
        patient: {
          select: { id: true, nom: true, prenom: true, telephone: true },
        },
        vente: {
          select: { id: true, montantTotal: true, statut: true },
        },
      },
    });

    return { data: updated, message: 'Ordonnance refusée.' };
  }

  /**
   * @method update
   * @description Met à jour les informations d'une ordonnance (ex: image URL).
   * @param {string} id - UUID de l'ordonnance
   * @param {UpdateOrdonnanceDto} dto - Champs à modifier
   * @returns {Promise<{ data: OrdonnanceWithRelations; message: string }>}
   */
  async update(
    id: string,
    dto: UpdateOrdonnanceDto,
  ): Promise<{ data: OrdonnanceWithRelations; message: string }> {
    await this.findOne(id);

    const updated = await this.prisma.ordonnance.update({
      where: { id },
      data: dto,
      include: {
        patient: {
          select: { id: true, nom: true, prenom: true, telephone: true },
        },
        vente: {
          select: { id: true, montantTotal: true, statut: true },
        },
      },
    });

    return { data: updated, message: 'Ordonnance mise à jour.' };
  }
}
