/**
 * @file medicaments.service.ts
 * @description Service de gestion du catalogue de médicaments.
 *              Utilise une transaction séquentielle pour créer médicament + stock atomiquement.
 * @module MedicamentsModule
 *
 * RÔLE : CRUD du catalogue médicaments avec gestion du stock initial.
 * UTILISÉ PAR : MedicamentsController
 * DÉPENDANCES : PrismaService
 * SUPPRESSION : Aucune gestion du catalogue médicaments
 *
 * TRANSACTION SÉQUENTIELLE : Lors de la création, médicament et stock sont créés
 * dans la même transaction $transaction([...]) pour garantir leur cohérence.
 * Si la création du stock échoue, le médicament n'est pas créé non plus.
 */

import {
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Medicament } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { CreateMedicamentDto } from './dto/create-medicament.dto';
import { UpdateMedicamentDto } from './dto/update-medicament.dto';

/** Type médicament avec son stock inclus */
type MedicamentWithStock = Medicament & {
  stock: { quantite: number; seuilMinimum: number } | null;
};

@Injectable()
export class MedicamentsService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * @method create
   * @description Crée un médicament et son stock initial dans une transaction séquentielle.
   *              Les deux opérations sont atomiques : succès ensemble ou rollback.
   * @param {CreateMedicamentDto} dto - Données du médicament avec stock initial optionnel
   * @returns {Promise<{ data: MedicamentWithStock; message: string }>}
   * @transaction SÉQUENTIELLE — Médicament + Stock créés atomiquement.
   *              Si l'une échoue, l'autre est rollbackée.
   */
  async create(
    dto: CreateMedicamentDto,
  ): Promise<{ data: MedicamentWithStock; message: string }> {
    // Génère l'ID manuellement pour pouvoir le référencer dans le Stock
    // (nécessaire car dans $transaction([...]), les opérations sont parallèles)
    // crypto.randomUUID() est disponible nativement depuis Node.js 14.17+
    const medicamentId = crypto.randomUUID();

    // Transaction séquentielle : les deux opérations sont envoyées ensemble
    const [medicament] = await this.prisma.$transaction([
      // Opération 1 : créer le médicament avec l'ID prégénéré
      this.prisma.medicament.create({
        data: {
          id: medicamentId,
          nom: dto.nom,
          description: dto.description,
          prixCDF: dto.prixCDF,
          prixUSD: dto.prixUSD,
          categorie: dto.categorie,
          unite: dto.unite,
        },
      }),
      // Opération 2 : créer le stock initial lié au médicament
      this.prisma.stock.create({
        data: {
          medicamentId,                          // Référence l'ID prégénéré
          quantite: dto.quantiteInitiale ?? 0,   // Stock initial (par défaut 0)
          seuilMinimum: dto.seuilMinimum ?? 10,  // Seuil d'alerte (par défaut 10)
        },
      }),
    ]);

    // Recharge le médicament avec son stock pour la réponse
    const medicamentWithStock = await this.prisma.medicament.findUniqueOrThrow({
      where: { id: medicamentId },
      include: { stock: true },
    });

    return {
      data: medicamentWithStock,
      message: 'Médicament créé avec son stock initial.',
    };
  }

  /**
   * @method findAll
   * @description Liste tous les médicaments avec leur niveau de stock actuel.
   * @returns {Promise<{ data: MedicamentWithStock[]; message: string }>}
   */
  async findAll(): Promise<{ data: MedicamentWithStock[]; message: string }> {
    const medicaments = await this.prisma.medicament.findMany({
      include: { stock: true },
      orderBy: { nom: 'asc' },
    });

    return {
      data: medicaments,
      message: `${medicaments.length} médicament(s) trouvé(s).`,
    };
  }

  /**
   * @method findOne
   * @description Retourne un médicament avec son stock.
   * @param {string} id - UUID du médicament
   * @returns {Promise<{ data: MedicamentWithStock; message: string }>}
   * @throws {NotFoundException} Si le médicament n'existe pas
   */
  async findOne(id: string): Promise<{ data: MedicamentWithStock; message: string }> {
    const medicament = await this.prisma.medicament.findUnique({
      where: { id },
      include: { stock: true },
    });

    if (!medicament) {
      throw new NotFoundException(`Médicament avec l'ID ${id} introuvable.`);
    }

    return { data: medicament, message: 'Médicament récupéré.' };
  }

  /**
   * @method update
   * @description Met à jour les informations d'un médicament (prix, description, etc.).
   * @param {string} id - UUID du médicament
   * @param {UpdateMedicamentDto} dto - Champs à modifier
   * @returns {Promise<{ data: MedicamentWithStock; message: string }>}
   * @throws {NotFoundException} Si le médicament n'existe pas
   */
  async update(
    id: string,
    dto: UpdateMedicamentDto,
  ): Promise<{ data: MedicamentWithStock; message: string }> {
    await this.findOne(id);

    // Extrait les champs médicament (hors stock)
    const { quantiteInitiale, seuilMinimum, ...medicamentData } = dto;

    const updated = await this.prisma.medicament.update({
      where: { id },
      data: medicamentData,
      include: { stock: true },
    });

    // Met à jour le seuil minimum si fourni (pas la quantité, géré par StockModule)
    if (seuilMinimum !== undefined && updated.stock) {
      await this.prisma.stock.update({
        where: { medicamentId: id },
        data: { seuilMinimum },
      });
    }

    return { data: updated, message: 'Médicament mis à jour.' };
  }

  /**
   * @method remove
   * @description Supprime un médicament et son stock (cascade gérée par Prisma).
   * @param {string} id - UUID du médicament
   * @returns {Promise<{ data: null; message: string }>}
   * @throws {NotFoundException} Si le médicament n'existe pas
   */
  async remove(id: string): Promise<{ data: null; message: string }> {
    await this.findOne(id);

    // Supprime le stock d'abord (contrainte FK), puis le médicament
    await this.prisma.$transaction([
      this.prisma.stock.deleteMany({ where: { medicamentId: id } }),
      this.prisma.ligneVente.deleteMany({ where: { medicamentId: id } }),
      this.prisma.medicament.delete({ where: { id } }),
    ]);

    return { data: null, message: 'Médicament supprimé.' };
  }
}
