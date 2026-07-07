import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Patch,
  Post,
} from '@nestjs/common';
import { ApiCookieAuth, ApiOperation, ApiParam, ApiTags } from '@nestjs/swagger';
import { Role } from '@prisma/client';
import { FournisseursService } from './fournisseurs.service';
import { CreateFournisseurDto } from './dto/create-fournisseur.dto';
import { UpdateFournisseurDto } from './dto/update-fournisseur.dto';
import { Roles } from '../auth/decorators/roles.decorator';

@ApiTags('fournisseurs')
@ApiCookieAuth('access_token')
@Controller('fournisseurs')
export class FournisseursController {
  constructor(private readonly fournisseursService: FournisseursService) {}

  @Post()
  @Roles(Role.PHARMACIEN)
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Créer un fournisseur' })
  create(@Body() dto: CreateFournisseurDto) {
    return this.fournisseursService.create(dto);
  }

  @Get()
  @ApiOperation({ summary: 'Lister tous les fournisseurs' })
  findAll() {
    return this.fournisseursService.findAll();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Détail d\'un fournisseur' })
  @ApiParam({ name: 'id', description: 'UUID du fournisseur' })
  findOne(@Param('id') id: string) {
    return this.fournisseursService.findOne(id);
  }

  @Patch(':id')
  @Roles(Role.PHARMACIEN)
  @ApiOperation({ summary: 'Modifier un fournisseur' })
  @ApiParam({ name: 'id', description: 'UUID du fournisseur' })
  update(@Param('id') id: string, @Body() dto: UpdateFournisseurDto) {
    return this.fournisseursService.update(id, dto);
  }

  @Delete(':id')
  @Roles(Role.PHARMACIEN)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Supprimer un fournisseur' })
  @ApiParam({ name: 'id', description: 'UUID du fournisseur' })
  remove(@Param('id') id: string) {
    return this.fournisseursService.remove(id);
  }
}
