import { useEffect, useState } from 'react'
import QRCode from 'qrcode'

interface QrCodeProps {
  value: string
  size?: number
  label?: string
}

export const QrCode = ({ value, size = 180, label }: QrCodeProps) => {
  const [src, setSrc] = useState('')

  useEffect(() => {
    let mounted = true
    QRCode.toDataURL(value, {
      width: size,
      margin: 2,
      errorCorrectionLevel: 'M',
      color: { dark: '#0f172a', light: '#ffffff' },
    }).then((url) => {
      if (mounted) setSrc(url)
    })
    return () => { mounted = false }
  }, [value, size])

  return (
    <div className="inline-flex flex-col items-center rounded-2xl border border-slate-200 bg-white p-3 shadow-soft">
      {src ? (
        <img src={src} width={size} height={size} alt={label ?? 'Code QR'} />
      ) : (
        <div className="animate-pulse rounded-xl bg-slate-100" style={{ width: size, height: size }} />
      )}
      {label && <p className="mt-2 text-center text-2xs font-mono text-slate-500">{label}</p>}
    </div>
  )
}

