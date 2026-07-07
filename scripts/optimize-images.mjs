/**
 * Script d'optimisation des images du dossier public/images.
 * - Redimensionne au max 1920×1920 (en preservant le ratio)
 * - Recompresse en JPEG mozjpeg quality 78
 * - Conserve le même nom de fichier (remplace l'original)
 *
 * Usage : node scripts/optimize-images.mjs
 */
import sharp from 'sharp'
import { readdir, stat, readFile, writeFile, rename } from 'node:fs/promises'
import { join, extname, basename, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const IMAGES_DIR = join(__dirname, '..', 'public', 'images')
const MAX_DIM = 1920
const QUALITY = 78

const formatKB = (bytes) => (bytes / 1024).toFixed(1) + ' KB'
const pad = (s, n) => (s + ' '.repeat(n)).slice(0, n)

const optimize = async () => {
  const entries = await readdir(IMAGES_DIR)
  const images = entries.filter((f) => /\.(jpe?g|png)$/i.test(f))

  console.log(`\nOptimisation de ${images.length} image(s) dans ${IMAGES_DIR}\n`)
  let totalBefore = 0
  let totalAfter = 0

  for (const file of images) {
    const fullPath = join(IMAGES_DIR, file)
    const ext = extname(file).toLowerCase()
    const before = (await stat(fullPath)).size
    totalBefore += before

    const inputBuffer = await readFile(fullPath)
    let pipeline = sharp(inputBuffer, { failOn: 'none' })
      .rotate()
      .resize({ width: MAX_DIM, height: MAX_DIM, fit: 'inside', withoutEnlargement: true })

    if (ext === '.png') {
      pipeline = pipeline.png({ quality: QUALITY, compressionLevel: 9, palette: true })
    } else {
      pipeline = pipeline.jpeg({ quality: QUALITY, mozjpeg: true, progressive: true })
    }

    const outputBuffer = await pipeline.toBuffer()
    const after = outputBuffer.length
    totalAfter += after

    // Écriture atomique (tmp puis rename)
    const tmpPath = fullPath + '.tmp'
    await writeFile(tmpPath, outputBuffer)
    await rename(tmpPath, fullPath)

    const ratio = ((1 - after / before) * 100).toFixed(0)
    console.log(
      `  ${pad(basename(file), 70)}  ${pad(formatKB(before), 12)} → ${pad(formatKB(after), 12)}  (-${ratio}%)`
    )
  }

  const totalRatio = ((1 - totalAfter / totalBefore) * 100).toFixed(0)
  console.log(
    `\n  Total : ${formatKB(totalBefore)} → ${formatKB(totalAfter)}  (-${totalRatio}%)\n`
  )
}

optimize().catch((err) => {
  console.error('\nErreur :', err)
  process.exit(1)
})
