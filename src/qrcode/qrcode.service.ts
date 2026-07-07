/**
 * @file qrcode.service.ts
 * @description Service de génération de QR codes et de tickets PDF.
 *              Utilisé par VentesService pour générer les reçus de vente.
 * @module QrCodeModule
 *
 * RÔLE : Générer des QR codes PNG (base64) et des PDF de tickets de caisse.
 * UTILISÉ PAR : VentesService (injecté via QrCodeModule exporté)
 * DÉPENDANCES : qrcode, pdfkit, ConfigService
 * SUPPRESSION : Impossible de générer les QR codes et tickets PDF des ventes
 */

import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as QRCode from 'qrcode';
import PDFDocument from 'pdfkit';
import Decimal from 'decimal.js';

/** Structure d'une ligne de vente pour le ticket PDF */
export interface LignePourTicket {
  nomMedicament: string;
  quantite: number;
  prixUnitaire: Decimal;
  devise: string;
}

/** Paramètres pour la génération du ticket PDF */
export interface TicketParams {
  venteId: string;
  nomCaissier: string;
  nomPatient?: string;
  lignes: LignePourTicket[];
  montantTotal: Decimal;
  devise: string;
  createdAt: Date;
  qrCodeBase64: string;
}

@Injectable()
export class QrCodeService {
  constructor(private readonly config: ConfigService) {}

  /**
   * @method generateQrCodeFromPayload
   * @description Génère un QR code PNG à partir d'un payload texte (code unitaire).
   */
  async generateQrCodeFromPayload(payload: string): Promise<string> {
    try {
      return await QRCode.toDataURL(payload, {
        errorCorrectionLevel: 'H',
        width: 200,
        margin: 2,
        color: { dark: '#000000', light: '#FFFFFF' },
      });
    } catch {
      throw new InternalServerErrorException('Impossible de générer le QR code.');
    }
  }

  /**
   * @method generateQrCode
   * @description Génère un QR code PNG encodé en base64 pour une vente (récapitulatif ticket).
   */
  async generateQrCode(venteId: string): Promise<string> {
    return this.generateQrCodeFromPayload(`PHARMACIE-VENTE:${venteId}`);
  }

  /**
   * @method generateTicketPdf
   * @description Génère un ticket de caisse PDF complet pour une vente.
   *              Contient : en-tête pharmacie, lignes produits, total, QR code.
   * @param {TicketParams} params - Données nécessaires pour le ticket
   * @returns {Promise<Buffer>} Buffer du fichier PDF généré
   * @throws {InternalServerErrorException} Si la génération échoue
   */
  async generateTicketPdf(params: TicketParams): Promise<Buffer> {
    return new Promise((resolve, reject) => {
      try {
        const nomPharmacie =
          this.config.get<string>('PHARMACIE_NOM') ?? 'Pharmacie Centrale';

        // Crée le document PDF au format A6 (format ticket de caisse)
        const doc = new PDFDocument({
          size: 'A6',    // 105mm × 148mm, adapté aux tickets
          margin: 20,    // Marges de 20 points
        });

        const chunks: Buffer[] = [];

        // Collecte les chunks du PDF au fur et à mesure de la génération
        doc.on('data', (chunk: Buffer) => chunks.push(chunk));
        doc.on('end', () => resolve(Buffer.concat(chunks)));
        doc.on('error', reject);

        // ── EN-TÊTE ──────────────────────────────────────────────────────────
        doc
          .fontSize(14)
          .font('Helvetica-Bold')
          .text(nomPharmacie.toUpperCase(), { align: 'center' });

        doc
          .fontSize(8)
          .font('Helvetica')
          .text('République Démocratique du Congo', { align: 'center' });

        doc.moveDown(0.5);

        // Ligne de séparation
        doc
          .moveTo(doc.page.margins.left, doc.y)
          .lineTo(doc.page.width - doc.page.margins.right, doc.y)
          .stroke();

        doc.moveDown(0.5);

        // Informations de la vente
        doc.fontSize(8).font('Helvetica');
        doc.text(`N° Vente : ${params.venteId.slice(0, 8).toUpperCase()}`);
        doc.text(`Date     : ${params.createdAt.toLocaleDateString('fr-CD')} ${params.createdAt.toLocaleTimeString('fr-CD')}`);
        doc.text(`Caissier : ${params.nomCaissier}`);

        if (params.nomPatient) {
          doc.text(`Patient  : ${params.nomPatient}`);
        }

        doc.moveDown(0.5);

        // Ligne de séparation
        doc
          .moveTo(doc.page.margins.left, doc.y)
          .lineTo(doc.page.width - doc.page.margins.right, doc.y)
          .stroke();

        doc.moveDown(0.5);

        // ── DÉTAIL DES ARTICLES ───────────────────────────────────────────────
        doc.fontSize(8).font('Helvetica-Bold');
        doc.text('MÉDICAMENTS', { underline: true });
        doc.moveDown(0.3);

        doc.font('Helvetica');
        params.lignes.forEach((ligne) => {
          const prixTotal =
            Number(ligne.prixUnitaire) * ligne.quantite;

          // Format : "Paracétamol 500mg x2 = 1 000 CDF"
          doc.text(
            `${ligne.nomMedicament}`,
          );
          doc.text(
            `  ${ligne.quantite} × ${Number(ligne.prixUnitaire).toLocaleString('fr-CD')} = ${prixTotal.toLocaleString('fr-CD')} ${ligne.devise}`,
          );
          doc.moveDown(0.2);
        });

        // Ligne de séparation
        doc
          .moveTo(doc.page.margins.left, doc.y)
          .lineTo(doc.page.width - doc.page.margins.right, doc.y)
          .stroke();

        doc.moveDown(0.3);

        // ── MONTANT TOTAL ─────────────────────────────────────────────────────
        doc
          .fontSize(12)
          .font('Helvetica-Bold')
          .text(
            `TOTAL : ${Number(params.montantTotal).toLocaleString('fr-CD')} ${params.devise}`,
            { align: 'right' },
          );

        doc.moveDown(0.5);

        // ── QR CODE ───────────────────────────────────────────────────────────
        // Convertit le data URL base64 en Buffer pour pdfkit
        const base64Data = params.qrCodeBase64.replace(/^data:image\/png;base64,/, '');
        const qrBuffer = Buffer.from(base64Data, 'base64');

        doc.image(qrBuffer, {
          width: 70,
          align: 'center',
        });

        doc.moveDown(0.3);
        doc.fontSize(7).font('Helvetica').text('Scannez pour vérifier', { align: 'center' });

        doc.moveDown(0.5);

        // ── PIED DE PAGE ──────────────────────────────────────────────────────
        doc
          .moveTo(doc.page.margins.left, doc.y)
          .lineTo(doc.page.width - doc.page.margins.right, doc.y)
          .stroke();

        doc.moveDown(0.3);
        doc
          .fontSize(7)
          .font('Helvetica')
          .text('Merci de votre confiance. Conservez ce ticket.', { align: 'center' });

        // Finalise le PDF
        doc.end();
      } catch (error) {
        reject(
          new InternalServerErrorException('Impossible de générer le ticket PDF.'),
        );
      }
    });
  }
}
