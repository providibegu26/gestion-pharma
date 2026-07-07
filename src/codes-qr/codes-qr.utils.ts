import * as crypto from 'crypto';

const CODE_PREFIX = 'PHARM';

/** Génère un code alphanumérique unique lisible (ex: PHARM-A3F2-9B1C) */
export function genererCodeQrUnique(): string {
  const part1 = crypto.randomBytes(2).toString('hex').toUpperCase();
  const part2 = crypto.randomBytes(2).toString('hex').toUpperCase();
  return `${CODE_PREFIX}-${part1}-${part2}`;
}

/** Payload encodé dans le QR scanné */
export function construirePayloadQr(code: string): string {
  return `PHARMACIE-CODE:${code}`;
}

/** Extrait le code depuis un texte scanné (payload ou code brut) */
export function extraireCodeDepuisScan(scan: string): string {
  const trimmed = scan.trim();
  if (trimmed.startsWith('PHARMACIE-CODE:')) {
    return trimmed.replace('PHARMACIE-CODE:', '');
  }
  return trimmed;
}
