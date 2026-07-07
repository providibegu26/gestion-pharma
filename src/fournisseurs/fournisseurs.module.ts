import { Module } from '@nestjs/common';
import { FournisseursController } from './fournisseurs.controller';
import { FournisseursService } from './fournisseurs.service';

@Module({
  controllers: [FournisseursController],
  providers: [FournisseursService],
})
export class FournisseursModule {}
