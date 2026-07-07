/**
 * @file stock.service.ts
 * @description Service de gestion des stocks. Consultation, réapprovisionnement,
 *              génération et envoi du bon de commande fournisseur (PDF ou Excel).
 * @module StockModule
 */

import {
  BadRequestException,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Stock } from '@prisma/client';
import PDFDocument from 'pdfkit';
import ExcelJS from 'exceljs';
import { PrismaService } from '../prisma/prisma.service';
import { NotificationsService } from '../notifications/notifications.service';
import { MailService } from '../mail/mail.service';
import { UpdateStockDto } from './dto/update-stock.dto';
import { EnvoyerRapportCommandeDto, FormatRapport } from './dto/envoyer-rapport-commande.dto';

/** Type stock avec médicament inclus */
type StockWithMedicament = Stock & {
  medicament: {
    id: string;
    nom: string;
    categorie: string;
    unite: string;
    prixCDF: object;
    prixUSD: object;
  };
};

/** Ligne du rapport de commande */
interface LigneRapport {
  medicamentId: string;
  nom: string;
  categorie: string;
  unite: string;
  quantiteActuelle: number;
  seuilMinimum: number;
  quantiteACommander: number;
}

/** Résultat brut de la requête SQL d'alerte */
interface StockAlerteRaw {
  medicamentId: string;
  nom: string;
  categorie: string;
  unite: string;
  quantite: number;
  seuilMinimum: number;
}

@Injectable()
export class StockService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly notifications: NotificationsService,
    private readonly mail: MailService,
    private readonly config: ConfigService,
  ) {}

  async findAll(): Promise<{ data: StockWithMedicament[]; message: string }> {
    const stocks = await this.prisma.stock.findMany({
      include: {
        medicament: {
          select: { id: true, nom: true, categorie: true, unite: true, prixCDF: true, prixUSD: true },
        },
      },
      orderBy: { medicament: { nom: 'asc' } },
    });
    return { data: stocks, message: `${stocks.length} ligne(s) de stock.` };
  }

  async findAlertes(): Promise<{ data: StockWithMedicament[]; message: string }> {
    const stocksEnAlerte = await this.prisma.$queryRaw<Array<{ id: string }>>`
      SELECT id FROM "Stock" WHERE quantite <= "seuilMinimum"
    `;
    const ids = stocksEnAlerte.map((s) => s.id);

    const alertes = await this.prisma.stock.findMany({
      where: { id: { in: ids } },
      include: {
        medicament: {
          select: { id: true, nom: true, categorie: true, unite: true, prixCDF: true, prixUSD: true },
        },
      },
      orderBy: { quantite: 'asc' },
    });

    return { data: alertes, message: `${alertes.length} médicament(s) sous le seuil d'alerte.` };
  }

  async findByMedicament(medicamentId: string): Promise<{ data: StockWithMedicament; message: string }> {
    const stock = await this.prisma.stock.findUnique({
      where: { medicamentId },
      include: {
        medicament: {
          select: { id: true, nom: true, categorie: true, unite: true, prixCDF: true, prixUSD: true },
        },
      },
    });

    if (!stock) {
      throw new NotFoundException(`Stock introuvable pour le médicament ${medicamentId}.`);
    }

    return { data: stock, message: 'Stock récupéré.' };
  }

  async update(medicamentId: string, dto: UpdateStockDto): Promise<{ data: StockWithMedicament; message: string }> {
    await this.findByMedicament(medicamentId);

    const updated = await this.prisma.stock.update({
      where: { medicamentId },
      data: {
        quantite: dto.quantite,
        ...(dto.seuilMinimum !== undefined && { seuilMinimum: dto.seuilMinimum }),
      },
      include: {
        medicament: {
          select: { id: true, nom: true, categorie: true, unite: true, prixCDF: true, prixUSD: true },
        },
      },
    });

    if (updated.quantite <= updated.seuilMinimum) {
      this.notifications.notifierStockCritique({
        medicamentId: updated.medicamentId,
        nom: updated.medicament.nom,
        quantite: updated.quantite,
        seuilMinimum: updated.seuilMinimum,
      });
    }

    return { data: updated, message: 'Stock mis à jour.' };
  }

  /**
   * @method getRapportCommande
   * @description Retourne la liste des produits sous seuil avec les quantités suggérées.
   *              Prévisualisation avant envoi au fournisseur.
   */
  async getRapportCommande(): Promise<{ data: object; message: string }> {
    const lignes = await this.fetchLignesAlerte();

    const message =
      lignes.length > 0
        ? `${lignes.length} produit(s) à commander. Rapport prêt à envoyer.`
        : 'Aucun produit sous le seuil minimum. Aucun bon de commande nécessaire.';

    return {
      data: {
        genereLe: new Date().toISOString(),
        nombreProduits: lignes.length,
        lignes,
      },
      message,
    };
  }

  /**
   * @method envoyerRapportCommande
   * @description Génère le bon de commande (PDF ou Excel) et l'envoie au fournisseur par email.
   *              Les quantités peuvent être personnalisées ; sinon la suggestion automatique s'applique.
   */
  async envoyerRapportCommande(dto: EnvoyerRapportCommandeDto): Promise<{ data: object | null; message: string }> {
    // Vérifier le fournisseur et son email
    const fournisseur = await this.prisma.fournisseur.findUnique({ where: { id: dto.fournisseurId } });
    if (!fournisseur) throw new NotFoundException('Fournisseur introuvable.');
    if (!fournisseur.email) {
      throw new BadRequestException(
        `Le fournisseur "${fournisseur.nom}" n'a pas d'email enregistré. Ajoutez-en un via PATCH /fournisseurs/:id.`,
      );
    }

    // Récupérer les produits sous seuil
    const lignesBase = await this.fetchLignesAlerte();
    if (lignesBase.length === 0) {
      return { data: null, message: 'Aucun produit sous le seuil minimum. Rapport non envoyé.' };
    }

    // Appliquer les quantités personnalisées si fournies
    const qMap = new Map(
      (dto.quantitesPersonnalisees ?? []).map((q) => [q.medicamentId, q.quantiteACommander]),
    );
    const lignes: LigneRapport[] = lignesBase.map((l) => ({
      ...l,
      quantiteACommander: qMap.get(l.medicamentId) ?? l.quantiteACommander,
    }));

    const pharmacieNom = this.config.get<string>('PHARMACIE_NOM') ?? 'Pharmacie';
    const format = dto.format ?? FormatRapport.PDF;

    let buffer: Buffer;
    let filename: string;
    let contentType: string;

    if (format === FormatRapport.EXCEL) {
      buffer = await this.genererExcel(lignes, pharmacieNom);
      filename = `bon-commande-${Date.now()}.xlsx`;
      contentType = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';
    } else {
      buffer = await this.genererPdf(lignes, pharmacieNom);
      filename = `bon-commande-${Date.now()}.pdf`;
      contentType = 'application/pdf';
    }

    await this.mail.sendRapportCommande(
      fournisseur.email,
      fournisseur.nom,
      [{ filename, content: buffer, contentType }],
      dto.commentaire,
    );

    return {
      data: {
        fournisseur: { id: fournisseur.id, nom: fournisseur.nom, email: fournisseur.email },
        nombreProduits: lignes.length,
        format,
        fichier: filename,
      },
      message: `Bon de commande (${lignes.length} produit(s)) envoyé à ${fournisseur.email}.`,
    };
  }

  // ── Méthodes privées ──────────────────────────────────────────────────────

  /** Récupère les produits sous seuil avec la quantité suggérée à commander */
  private async fetchLignesAlerte(): Promise<LigneRapport[]> {
    const alertes = await this.prisma.$queryRaw<StockAlerteRaw[]>`
      SELECT s."medicamentId", m.nom, m.categorie, m.unite,
             s.quantite, s."seuilMinimum"
      FROM "Stock" s
      JOIN "Medicament" m ON m.id = s."medicamentId"
      WHERE s.quantite <= s."seuilMinimum"
      ORDER BY (s.quantite::float / NULLIF(s."seuilMinimum"::float, 0)) ASC
    `;

    return alertes.map((a) => {
      const quantite = Number(a.quantite);
      const seuil = Number(a.seuilMinimum);
      return {
        medicamentId: a.medicamentId,
        nom: a.nom,
        categorie: a.categorie,
        unite: a.unite,
        quantiteActuelle: quantite,
        seuilMinimum: seuil,
        // Commander assez pour atteindre le double du seuil, minimum = seuil
        quantiteACommander: Math.max(seuil * 2 - quantite, seuil),
      };
    });
  }

  /** Génère le rapport au format PDF */
  private genererPdf(lignes: LigneRapport[], pharmacieNom: string): Promise<Buffer> {
    return new Promise((resolve, reject) => {
      try {
        const doc = new PDFDocument({ size: 'A4', margin: 40 });
        const chunks: Buffer[] = [];
        doc.on('data', (c: Buffer) => chunks.push(c));
        doc.on('end', () => resolve(Buffer.concat(chunks)));
        doc.on('error', reject);

        const now = new Date();
        const L = 40; // left margin
        const tableWidth = 515;

        // ── EN-TÊTE ───────────────────────────────────────────────────────
        doc.fontSize(16).font('Helvetica-Bold').text(pharmacieNom.toUpperCase(), { align: 'center' });
        doc.fontSize(11).font('Helvetica').text('BON DE COMMANDE FOURNISSEUR', { align: 'center' });
        doc.moveDown(0.5);
        doc.moveTo(L, doc.y).lineTo(L + tableWidth, doc.y).strokeColor('#aaaaaa').stroke();
        doc.moveDown(0.5);
        doc.fontSize(9).text(`Date d'émission : ${now.toLocaleDateString('fr-CD')} à ${now.toLocaleTimeString('fr-CD')}`);
        doc.text(`Nombre de produits à réapprovisionner : ${lignes.length}`);
        doc.moveDown(1);

        // ── TABLE ─────────────────────────────────────────────────────────
        // col x positions and widths (total = 515)
        const cx = [L, L + 175, L + 265, L + 330, L + 385, L + 440];
        const cw = [170,  85,   60,   50,   50,   75];
        const headers = ['Médicament', 'Catégorie', 'Unité', 'Qté act.', 'Seuil', 'Qté cmd'];
        const rowH = 18;

        const drawRow = (
          y: number,
          cells: string[],
          bg: string | null,
          bold = false,
          textColor = 'black',
        ) => {
          if (bg) doc.rect(L, y, tableWidth, rowH).fill(bg);
          doc.rect(L, y, tableWidth, rowH).strokeColor('#d1d5db').stroke();
          doc.fillColor(textColor)
            .fontSize(8)
            .font(bold ? 'Helvetica-Bold' : 'Helvetica');
          cells.forEach((cell, i) => {
            const text = i === 0 && cell.length > 24 ? cell.slice(0, 23) + '…' : cell;
            doc.text(text, cx[i] + 3, y + 5, { width: cw[i] - 6, lineBreak: false });
          });
        };

        let y = doc.y;

        // Header row
        drawRow(y, headers, '#1d4ed8', true, 'white');
        y += rowH;

        // Data rows
        lignes.forEach((l, i) => {
          if (y > doc.page.height - 80) {
            doc.addPage();
            y = 40;
            drawRow(y, headers, '#1d4ed8', true, 'white');
            y += rowH;
          }
          drawRow(
            y,
            [l.nom, l.categorie, l.unite,
             String(l.quantiteActuelle), String(l.seuilMinimum), String(l.quantiteACommander)],
            i % 2 === 0 ? null : '#eff6ff',
          );
          y += rowH;
        });

        // ── PIED DE PAGE ─────────────────────────────────────────────────
        doc.text('', L, y + 20);
        doc.moveDown(1);
        doc.fontSize(8).fillColor('#9ca3af').font('Helvetica')
          .text('Document généré automatiquement — Système de gestion Pharmacie RDC.', { align: 'center' });

        doc.end();
      } catch {
        reject(new InternalServerErrorException('Impossible de générer le rapport PDF.'));
      }
    });
  }

  /** Génère le rapport au format Excel */
  private async genererExcel(lignes: LigneRapport[], pharmacieNom: string): Promise<Buffer> {
    const workbook = new ExcelJS.Workbook();
    workbook.creator = pharmacieNom;
    workbook.created = new Date();

    const sheet = workbook.addWorksheet('Bon de commande');

    // Titre
    sheet.mergeCells('A1:F1');
    const titleCell = sheet.getCell('A1');
    titleCell.value = `${pharmacieNom} — BON DE COMMANDE FOURNISSEUR`;
    titleCell.font = { bold: true, size: 14 };
    titleCell.alignment = { horizontal: 'center' };

    sheet.mergeCells('A2:F2');
    const dateCell = sheet.getCell('A2');
    dateCell.value = `Émis le ${new Date().toLocaleDateString('fr-CD')} — ${lignes.length} produit(s)`;
    dateCell.font = { italic: true, size: 10, color: { argb: 'FF6b7280' } };
    dateCell.alignment = { horizontal: 'center' };

    sheet.addRow([]); // ligne vide

    // En-têtes de colonnes
    const headerRow = sheet.addRow([
      'Médicament', 'Catégorie', 'Unité', 'Qté actuelle', 'Seuil minimum', 'Qté à commander',
    ]);
    headerRow.eachCell((cell) => {
      cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF1d4ed8' } };
      cell.font = { bold: true, color: { argb: 'FFFFFFFF' }, size: 10 };
      cell.alignment = { horizontal: 'center', vertical: 'middle' };
      cell.border = {
        top: { style: 'thin' }, left: { style: 'thin' },
        bottom: { style: 'thin' }, right: { style: 'thin' },
      };
    });
    headerRow.height = 22;

    // Données
    lignes.forEach((ligne, i) => {
      const row = sheet.addRow([
        ligne.nom,
        ligne.categorie,
        ligne.unite,
        ligne.quantiteActuelle,
        ligne.seuilMinimum,
        ligne.quantiteACommander,
      ]);

      const bg = i % 2 === 0 ? 'FFFFFFFF' : 'FFeff6ff';
      row.eachCell((cell) => {
        cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: bg } };
        cell.border = {
          top: { style: 'thin' }, left: { style: 'thin' },
          bottom: { style: 'thin' }, right: { style: 'thin' },
        };
        cell.alignment = { vertical: 'middle' };
      });

      // Colonne "Qté à commander" en jaune si stock = 0
      if (ligne.quantiteActuelle === 0) {
        row.getCell(6).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFBBF24' } };
        row.getCell(6).font = { bold: true };
      }
    });

    // Largeurs de colonnes
    sheet.getColumn(1).width = 36;
    sheet.getColumn(2).width = 18;
    sheet.getColumn(3).width = 12;
    sheet.getColumn(4).width = 15;
    sheet.getColumn(5).width = 16;
    sheet.getColumn(6).width = 18;

    const arrayBuffer = await workbook.xlsx.writeBuffer();
    return Buffer.from(arrayBuffer);
  }
}
