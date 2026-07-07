import { Injectable, Logger } from '@nestjs/common';
import { MailerService } from '@nestjs-modules/mailer';

export interface SendMailOptions {
  to: string;
  subject: string;
  html: string;
}

@Injectable()
export class MailService {
  private readonly logger = new Logger(MailService.name);

  constructor(private readonly mailer: MailerService) {}

  async sendMail(options: SendMailOptions): Promise<void> {
    await this.mailer.sendMail({
      to: options.to,
      subject: options.subject,
      html: options.html,
    });
    this.logger.log(`Email envoyé à ${options.to} — "${options.subject}"`);
  }

  async sendBienvenue(destinataire: string, nom: string): Promise<void> {
    await this.sendMail({
      to: destinataire,
      subject: 'Bienvenue sur la plateforme Pharmacie',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #2563eb;">Bienvenue, ${nom} !</h2>
          <p>Votre compte a été créé avec succès sur la plateforme de gestion de pharmacie.</p>
          <p>Vous pouvez maintenant vous connecter avec vos identifiants.</p>
          <hr style="border-color: #e5e7eb;" />
          <p style="color: #6b7280; font-size: 12px;">Ce message a été envoyé automatiquement, ne pas répondre.</p>
        </div>
      `,
    });
  }

  async sendAlerteStock(
    destinataire: string,
    medicaments: Array<{ nom: string; quantite: number; seuilMinimum: number }>,
  ): Promise<void> {
    const lignes = medicaments
      .map(
        (m) =>
          `<tr>
            <td style="padding: 8px; border: 1px solid #e5e7eb;">${m.nom}</td>
            <td style="padding: 8px; border: 1px solid #e5e7eb; color: #dc2626;">${m.quantite}</td>
            <td style="padding: 8px; border: 1px solid #e5e7eb;">${m.seuilMinimum}</td>
          </tr>`,
      )
      .join('');

    await this.sendMail({
      to: destinataire,
      subject: `Alerte stock — ${medicaments.length} médicament(s) en rupture`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #dc2626;">Alerte : Stock insuffisant</h2>
          <p>Les médicaments suivants sont en dessous du seuil minimum :</p>
          <table style="width: 100%; border-collapse: collapse;">
            <thead>
              <tr style="background-color: #f3f4f6;">
                <th style="padding: 8px; border: 1px solid #e5e7eb; text-align: left;">Médicament</th>
                <th style="padding: 8px; border: 1px solid #e5e7eb; text-align: left;">Quantité actuelle</th>
                <th style="padding: 8px; border: 1px solid #e5e7eb; text-align: left;">Seuil minimum</th>
              </tr>
            </thead>
            <tbody>${lignes}</tbody>
          </table>
          <p style="margin-top: 16px;">Veuillez procéder au réapprovisionnement dès que possible.</p>
          <hr style="border-color: #e5e7eb;" />
          <p style="color: #6b7280; font-size: 12px;">Message automatique — Système de gestion Pharmacie.</p>
        </div>
      `,
    });
  }

  async sendCredentiels(
    destinataire: string,
    prenom: string,
    role: string,
    motDePasse: string,
  ): Promise<void> {
    await this.sendMail({
      to: destinataire,
      subject: 'Vos identifiants de connexion — Pharmacie',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #2563eb;">Bonjour ${prenom},</h2>
          <p>L'administrateur vient de créer votre compte sur la plateforme de gestion de pharmacie.</p>
          <p>Voici vos identifiants de connexion :</p>
          <div style="background-color: #f3f4f6; padding: 16px; border-radius: 8px; margin: 16px 0;">
            <p style="margin: 4px 0;"><strong>Email :</strong> ${destinataire}</p>
            <p style="margin: 4px 0;"><strong>Mot de passe temporaire :</strong> <code style="background:#e5e7eb;padding:2px 6px;border-radius:4px;">${motDePasse}</code></p>
            <p style="margin: 4px 0;"><strong>Rôle :</strong> ${role}</p>
          </div>
          <p style="color: #dc2626;"><strong>Important :</strong> Connectez-vous et changez votre mot de passe dès que possible via <em>PATCH /auth/change-password</em>.</p>
          <hr style="border-color: #e5e7eb;" />
          <p style="color: #6b7280; font-size: 12px;">Ce message a été envoyé automatiquement, ne pas répondre.</p>
        </div>
      `,
    });
  }

  async sendRapportCommande(
    destinataire: string,
    nomFournisseur: string,
    piecesJointes: Array<{ filename: string; content: Buffer; contentType: string }>,
    commentaire?: string,
  ): Promise<void> {
    await this.mailer.sendMail({
      to: destinataire,
      subject: `Bon de commande — ${new Date().toLocaleDateString('fr-CD')}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #1d4ed8;">Bon de commande</h2>
          <p>Bonjour <strong>${nomFournisseur}</strong>,</p>
          <p>Veuillez trouver ci-joint notre bon de commande pour réapprovisionnement de stock.</p>
          ${
            commentaire
              ? `<div style="background:#f3f4f6;padding:12px 16px;border-left:4px solid #1d4ed8;border-radius:4px;margin:16px 0;">
                   <p style="margin:0;color:#374151;">${commentaire}</p>
                 </div>`
              : ''
          }
          <p>Merci de confirmer la réception de cette commande et d'indiquer les délais de livraison.</p>
          <hr style="border-color: #e5e7eb;" />
          <p style="color: #6b7280; font-size: 12px;">Message automatique — Système de gestion Pharmacie RDC. Ne pas répondre à cet email.</p>
        </div>
      `,
      attachments: piecesJointes.map((pj) => ({
        filename: pj.filename,
        content: pj.content,
        contentType: pj.contentType,
      })),
    });
    this.logger.log(`Rapport commande envoyé à ${destinataire} (${piecesJointes[0]?.filename})`);
  }

  async sendTicketVente(
    destinataire: string,
    venteId: string,
    montantTotal: number,
    devise: string,
  ): Promise<void> {
    await this.sendMail({
      to: destinataire,
      subject: `Reçu de vente #${venteId.slice(0, 8).toUpperCase()}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #2563eb;">Reçu de vente</h2>
          <p><strong>Référence :</strong> #${venteId.slice(0, 8).toUpperCase()}</p>
          <p><strong>Montant total :</strong> ${montantTotal} ${devise}</p>
          <p>Merci pour votre achat.</p>
          <hr style="border-color: #e5e7eb;" />
          <p style="color: #6b7280; font-size: 12px;">Message automatique — Système de gestion Pharmacie.</p>
        </div>
      `,
    });
  }
}
