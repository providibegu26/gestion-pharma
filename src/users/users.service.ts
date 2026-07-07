/**
 * @file users.service.ts
 * @description Service de gestion du personnel de la pharmacie.
 *              CRUD complet avec exclusion systématique des champs sensibles.
 * @module UsersModule
 *
 * RÔLE : Logique métier pour la gestion des utilisateurs (ADMIN uniquement).
 * UTILISÉ PAR : UsersController
 * DÉPENDANCES : PrismaService, bcrypt
 * SUPPRESSION : Aucune gestion du personnel possible
 */

import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { User } from '@prisma/client';
import * as bcrypt from 'bcrypt';
import * as crypto from 'crypto';
import { PrismaService } from '../prisma/prisma.service';
import { MailService } from '../mail/mail.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';

/** Sélection Prisma excluant les champs sensibles */
const USER_SAFE_SELECT = {
  id: true,
  nom: true,
  prenom: true,
  email: true,
  role: true,
  createdAt: true,
  updatedAt: true,
} as const;

/** Type utilisateur sans champs sensibles (correspond à USER_SAFE_SELECT) */
type SafeUser = Omit<User, 'motDePasse' | 'refreshToken'>;

/** Génère un mot de passe temporaire sécurisé de 12 caractères */
function genererMotDePasseTemp(): string {
  const majuscules = 'ABCDEFGHJKLMNPQRSTUVWXYZ';
  const minuscules = 'abcdefghjkmnpqrstuvwxyz';
  const chiffres = '23456789';
  const speciaux = '@#$!';
  const tous = majuscules + minuscules + chiffres + speciaux;

  const bytes = crypto.randomBytes(8);
  let mdp = '';
  for (let i = 0; i < 8; i++) {
    mdp += tous[bytes[i] % tous.length];
  }
  // Garantit au moins 1 majuscule, 1 chiffre, 1 spécial
  return (
    majuscules[crypto.randomBytes(1)[0] % majuscules.length] +
    chiffres[crypto.randomBytes(1)[0] % chiffres.length] +
    speciaux[crypto.randomBytes(1)[0] % speciaux.length] +
    mdp
  );
}

@Injectable()
export class UsersService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly mail: MailService,
  ) {}

  /**
   * @method create
   * @description Crée un nouveau membre du personnel avec mot de passe haché.
   * @param {CreateUserDto} dto - Données validées
   * @returns {Promise<{ data: SafeUser; message: string }>}
   * @throws {ConflictException} Si email déjà utilisé
   */
  async create(dto: CreateUserDto): Promise<{ data: SafeUser; message: string }> {
    const existing = await this.prisma.user.findUnique({
      where: { email: dto.email },
    });

    if (existing) {
      throw new ConflictException('Un compte avec cet email existe déjà.');
    }

    // Génère un mot de passe temporaire que l'employé devra changer à sa première connexion
    const motDePasseTemp = genererMotDePasseTemp();
    const hashedPassword = await bcrypt.hash(motDePasseTemp, 12);

    const user = await this.prisma.user.create({
      data: {
        nom: dto.nom,
        prenom: dto.prenom,
        email: dto.email,
        motDePasse: hashedPassword,
        role: dto.role,
      },
      select: USER_SAFE_SELECT,
    });

    // Envoie les identifiants par email (mot de passe en clair, une seule fois)
    await this.mail.sendCredentiels(dto.email, dto.prenom, dto.role, motDePasseTemp);

    return { data: user, message: `Compte créé. Les identifiants ont été envoyés à ${dto.email}.` };
  }

  /**
   * @method findAll
   * @description Retourne la liste de tous les membres du personnel.
   * @returns {Promise<{ data: SafeUser[]; message: string }>}
   */
  async findAll(): Promise<{ data: SafeUser[]; message: string }> {
    const users = await this.prisma.user.findMany({
      select: USER_SAFE_SELECT,
      orderBy: { createdAt: 'desc' },
    });

    return { data: users, message: `${users.length} utilisateur(s) trouvé(s).` };
  }

  /**
   * @method findOne
   * @description Retourne un utilisateur par son ID.
   * @param {string} id - UUID de l'utilisateur
   * @returns {Promise<{ data: SafeUser; message: string }>}
   * @throws {NotFoundException} Si l'utilisateur n'existe pas
   */
  async findOne(id: string): Promise<{ data: SafeUser; message: string }> {
    const user = await this.prisma.user.findUnique({
      where: { id },
      select: USER_SAFE_SELECT,
    });

    if (!user) {
      throw new NotFoundException(`Utilisateur avec l'ID ${id} introuvable.`);
    }

    return { data: user, message: 'Utilisateur récupéré.' };
  }

  /**
   * @method update
   * @description Met à jour un utilisateur. Rehache le mot de passe si fourni.
   * @param {string} id - UUID de l'utilisateur
   * @param {UpdateUserDto} dto - Champs à mettre à jour (tous optionnels)
   * @returns {Promise<{ data: SafeUser; message: string }>}
   * @throws {NotFoundException} Si l'utilisateur n'existe pas
   * @throws {ConflictException} Si le nouvel email est déjà utilisé
   */
  async update(
    id: string,
    dto: UpdateUserDto,
  ): Promise<{ data: SafeUser; message: string }> {
    // Vérifie que l'utilisateur existe
    await this.findOne(id);

    // Si l'email est modifié, vérifie l'unicité
    if (dto.email) {
      const emailExists = await this.prisma.user.findFirst({
        where: { email: dto.email, NOT: { id } },
      });
      if (emailExists) {
        throw new ConflictException('Cet email est déjà utilisé par un autre compte.');
      }
    }

    // Les mots de passe se changent uniquement via PATCH /auth/change-password
    const updateData: Partial<{ nom: string; prenom: string; email: string; role: typeof dto.role }> = {};

    if (dto.nom) updateData.nom = dto.nom;
    if (dto.prenom) updateData.prenom = dto.prenom;
    if (dto.email) updateData.email = dto.email;
    if (dto.role) updateData.role = dto.role;

    const updatedUser = await this.prisma.user.update({
      where: { id },
      data: updateData,
      select: USER_SAFE_SELECT,
    });

    return { data: updatedUser, message: 'Utilisateur mis à jour.' };
  }

  /**
   * @method remove
   * @description Supprime définitivement un utilisateur.
   * @param {string} id - UUID de l'utilisateur
   * @returns {Promise<{ data: null; message: string }>}
   * @throws {NotFoundException} Si l'utilisateur n'existe pas
   */
  async remove(id: string): Promise<{ data: null; message: string }> {
    await this.findOne(id);

    await this.prisma.user.delete({ where: { id } });

    return { data: null, message: 'Utilisateur supprimé.' };
  }
}
