import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Fournisseur } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { CreateFournisseurDto } from './dto/create-fournisseur.dto';
import { UpdateFournisseurDto } from './dto/update-fournisseur.dto';

@Injectable()
export class FournisseursService {
  constructor(private readonly prisma: PrismaService) {}

  async create(dto: CreateFournisseurDto): Promise<{ data: Fournisseur; message: string }> {
    const existing = await this.prisma.fournisseur.findUnique({
      where: { telephone: dto.telephone },
    });

    if (existing) {
      throw new ConflictException('Un fournisseur avec ce numéro de téléphone existe déjà.');
    }

    if (dto.email) {
      const emailExisting = await this.prisma.fournisseur.findUnique({
        where: { email: dto.email },
      });
      if (emailExisting) {
        throw new ConflictException('Un fournisseur avec cet email existe déjà.');
      }
    }

    const fournisseur = await this.prisma.fournisseur.create({ data: dto });

    return { data: fournisseur, message: 'Fournisseur créé avec succès.' };
  }

  async findAll(): Promise<{ data: Fournisseur[]; message: string }> {
    const fournisseurs = await this.prisma.fournisseur.findMany({
      orderBy: { nom: 'asc' },
    });

    return { data: fournisseurs, message: `${fournisseurs.length} fournisseur(s) trouvé(s).` };
  }

  async findOne(id: string): Promise<{ data: Fournisseur; message: string }> {
    const fournisseur = await this.prisma.fournisseur.findUnique({ where: { id } });

    if (!fournisseur) {
      throw new NotFoundException(`Fournisseur avec l'ID ${id} introuvable.`);
    }

    return { data: fournisseur, message: 'Fournisseur récupéré.' };
  }

  async update(
    id: string,
    dto: UpdateFournisseurDto,
  ): Promise<{ data: Fournisseur; message: string }> {
    await this.findOne(id);

    if (dto.telephone) {
      const telExisting = await this.prisma.fournisseur.findFirst({
        where: { telephone: dto.telephone, NOT: { id } },
      });
      if (telExisting) {
        throw new ConflictException('Ce numéro de téléphone est déjà utilisé.');
      }
    }

    if (dto.email) {
      const emailExisting = await this.prisma.fournisseur.findFirst({
        where: { email: dto.email, NOT: { id } },
      });
      if (emailExisting) {
        throw new ConflictException('Cet email est déjà utilisé par un autre fournisseur.');
      }
    }

    const fournisseur = await this.prisma.fournisseur.update({
      where: { id },
      data: dto,
    });

    return { data: fournisseur, message: 'Fournisseur mis à jour.' };
  }

  async remove(id: string): Promise<{ data: null; message: string }> {
    await this.findOne(id);
    await this.prisma.fournisseur.delete({ where: { id } });

    return { data: null, message: 'Fournisseur supprimé.' };
  }
}
