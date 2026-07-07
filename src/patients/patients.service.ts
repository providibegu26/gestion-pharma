/**
 * @file patients.service.ts
 * @description Service de gestion des patients (fiches clients de la pharmacie).
 * @module PatientsModule
 *
 * RÔLE : CRUD complet des patients avec leurs ordonnances et historique de ventes.
 * UTILISÉ PAR : PatientsController
 * DÉPENDANCES : PrismaService
 * SUPPRESSION : Aucune gestion des patients possible
 */

import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Patient } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { CreatePatientDto } from './dto/create-patient.dto';
import { UpdatePatientDto } from './dto/update-patient.dto';

@Injectable()
export class PatientsService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * @method create
   * @description Enregistre un nouveau patient. Le numéro de téléphone doit être unique.
   * @param {CreatePatientDto} dto - Données validées du patient
   * @returns {Promise<{ data: Patient; message: string }>}
   * @throws {ConflictException} Si le numéro de téléphone est déjà enregistré
   */
  async create(dto: CreatePatientDto): Promise<{ data: Patient; message: string }> {
    // Vérifie l'unicité du numéro de téléphone (identifiant naturel en RDC)
    const existing = await this.prisma.patient.findUnique({
      where: { telephone: dto.telephone },
    });

    if (existing) {
      throw new ConflictException(
        `Un patient avec le numéro ${dto.telephone} est déjà enregistré.`,
      );
    }

    const patient = await this.prisma.patient.create({
      data: dto,
    });

    return { data: patient, message: 'Patient enregistré avec succès.' };
  }

  /**
   * @method findAll
   * @description Liste tous les patients, triés par date de création décroissante.
   * @returns {Promise<{ data: Patient[]; message: string }>}
   */
  async findAll(): Promise<{ data: Patient[]; message: string }> {
    const patients = await this.prisma.patient.findMany({
      orderBy: { createdAt: 'desc' },
    });

    return { data: patients, message: `${patients.length} patient(s) trouvé(s).` };
  }

  /**
   * @method findOne
   * @description Retourne un patient avec ses ordonnances et ses ventes.
   * @param {string} id - UUID du patient
   * @returns {Promise<{ data: object; message: string }>}
   * @throws {NotFoundException} Si le patient n'existe pas
   */
  async findOne(id: string): Promise<{ data: object; message: string }> {
    const patient = await this.prisma.patient.findUnique({
      where: { id },
      include: {
        ordonnances: {
          orderBy: { createdAt: 'desc' },
          take: 10, // Limite à 10 ordonnances récentes pour les performances
        },
        ventes: {
          orderBy: { createdAt: 'desc' },
          take: 10, // Limite à 10 ventes récentes
          include: {
            lignes: {
              include: { medicament: true },
            },
          },
        },
      },
    });

    if (!patient) {
      throw new NotFoundException(`Patient avec l'ID ${id} introuvable.`);
    }

    return { data: patient, message: 'Patient récupéré.' };
  }

  /**
   * @method update
   * @description Met à jour les informations d'un patient.
   * @param {string} id - UUID du patient
   * @param {UpdatePatientDto} dto - Champs à modifier
   * @returns {Promise<{ data: Patient; message: string }>}
   * @throws {NotFoundException} Si le patient n'existe pas
   * @throws {ConflictException} Si le nouveau téléphone est déjà utilisé
   */
  async update(
    id: string,
    dto: UpdatePatientDto,
  ): Promise<{ data: Patient; message: string }> {
    // Vérifie l'existence du patient
    const patient = await this.prisma.patient.findUnique({ where: { id } });
    if (!patient) {
      throw new NotFoundException(`Patient avec l'ID ${id} introuvable.`);
    }

    // Vérifie l'unicité du téléphone si modifié
    if (dto.telephone) {
      const phoneExists = await this.prisma.patient.findFirst({
        where: { telephone: dto.telephone, NOT: { id } },
      });
      if (phoneExists) {
        throw new ConflictException('Ce numéro de téléphone est déjà utilisé.');
      }
    }

    const updated = await this.prisma.patient.update({
      where: { id },
      data: dto,
    });

    return { data: updated, message: 'Patient mis à jour.' };
  }

  /**
   * @method remove
   * @description Supprime un patient (uniquement s'il n'a pas de ventes associées).
   * @param {string} id - UUID du patient
   * @returns {Promise<{ data: null; message: string }>}
   * @throws {NotFoundException} Si le patient n'existe pas
   * @throws {ConflictException} Si le patient a des ventes associées
   */
  async remove(id: string): Promise<{ data: null; message: string }> {
    const patient = await this.prisma.patient.findUnique({
      where: { id },
      include: { ventes: { take: 1 } },
    });

    if (!patient) {
      throw new NotFoundException(`Patient avec l'ID ${id} introuvable.`);
    }

    // Empêche la suppression si des ventes sont associées (intégrité des données)
    if (patient.ventes.length > 0) {
      throw new ConflictException(
        'Impossible de supprimer ce patient : il a des ventes associées. Archivez-le plutôt.',
      );
    }

    await this.prisma.patient.delete({ where: { id } });

    return { data: null, message: 'Patient supprimé.' };
  }
}
