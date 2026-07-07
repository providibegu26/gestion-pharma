import * as crypto from 'crypto';

const CODE_PREFIX_COMMANDE = 'CMD';

/** Génère un code unique pour une commande (ex: CMD-A3F2-9B1C) */
export function genererCodeCommandeUnique(): string {
  const part1 = crypto.randomBytes(2).toString('hex').toUpperCase();
  const part2 = crypto.randomBytes(2).toString('hex').toUpperCase();
  return `${CODE_PREFIX_COMMANDE}-${part1}-${part2}`;
}

/** Payload encodé dans le QR de commande scanné */
export function construirePayloadQrCommande(code: string): string {
  return `PHARMACIE-COMMANDE:${code}`;
}

/** Extrait le code commande depuis un texte scanné */
export function extraireCodeCommandeDepuisScan(scan: string): string {
  const trimmed = scan.trim();
  if (trimmed.startsWith('PHARMACIE-COMMANDE:')) {
    return trimmed.replace('PHARMACIE-COMMANDE:', '');
  }
  return trimmed;
}
