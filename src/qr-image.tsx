// @mostajs/qrpanel/qr-image — composant QR généré côté navigateur
// Author: Dr Hamid MADANI <drmdh@msn.com>
//
// QR code généré 100% dans le navigateur (data URL via `qrcode`), sans
// appel réseau ni round-trip serveur. Complète les deux briques
// existantes de qrpanel :
//   - `<QrPanel>` (./client) attend un `qrSrc` déjà fourni par l'app.
//   - `generateQr*` (./server) génère côté Node uniquement (@resvg natif).
// `<QrImage>` couvre le cas manquant : génération locale, côté client.
//
// Cas d'usage clé — COEP `require-corp` : sous cross-origin isolation
// (requise par ex. par ffmpeg.wasm / SharedArrayBuffer), une image QR
// servie par un service externe est bloquée par la politique. La
// génération locale est alors la seule option côté client.
//
// Sub-export dédié (`@mostajs/qrpanel/qr-image`) : `qrcode` n'est
// embarqué dans le bundle client que pour les consumers qui l'importent.

'use client'

import { useEffect, useState } from 'react'
import QRCode from 'qrcode'

export interface QrDataUrlOptions {
  /** Côté de l'image en pixels. Défaut 200. */
  size?: number
  /** Marge blanche autour du QR (en modules). Défaut 2. */
  margin?: number
  /** Correction d'erreur : L 7 % | M 15 % | Q 25 % | H 30 %. Défaut 'M'. */
  errorCorrectionLevel?: 'L' | 'M' | 'Q' | 'H'
  /** Couleur des modules sombres. Défaut '#0f172a'. */
  darkColor?: string
  /** Couleur du fond. Défaut '#ffffff'. */
  lightColor?: string
}

export interface UseQrDataUrlResult {
  /** Data URL `data:image/png;base64,…` du QR, ou '' tant que non prêt. */
  src: string
  /** True pendant la génération. */
  loading: boolean
  /** Message d'erreur si la génération a échoué, sinon null. */
  error: string | null
}

/** Hook : génère le data URL d'un QR localement (navigateur). */
export function useQrDataUrl(data: string, opts: QrDataUrlOptions = {}): UseQrDataUrlResult {
  const {
    size = 200, margin = 2, errorCorrectionLevel = 'M',
    darkColor = '#0f172a', lightColor = '#ffffff',
  } = opts
  const [src, setSrc] = useState('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let alive = true
    setLoading(true); setError(null); setSrc('')
    QRCode.toDataURL(data, {
      width: size, margin, errorCorrectionLevel,
      color: { dark: darkColor, light: lightColor },
    })
      .then((url) => { if (alive) { setSrc(url); setLoading(false) } })
      .catch((e) => {
        if (alive) { setError(e?.message || 'QR generation failed'); setLoading(false) }
      })
    return () => { alive = false }
  }, [data, size, margin, errorCorrectionLevel, darkColor, lightColor])

  return { src, loading, error }
}

export interface QrImageProps extends QrDataUrlOptions {
  /** Donnée encodée dans le QR (URL, texte…). */
  data: string
  alt?: string
  style?: React.CSSProperties
  className?: string
}

/** QR code généré localement et rendu en `<img>` data-URL (COEP-safe). */
export default function QrImage({
  data, alt = 'QR code', style, className, ...opts
}: QrImageProps) {
  const size = opts.size ?? 200
  const { src, loading, error } = useQrDataUrl(data, opts)

  const box: React.CSSProperties = {
    width: size, height: size, display: 'flex',
    alignItems: 'center', justifyContent: 'center',
    background: '#fff', borderRadius: 6, border: '1px solid #e2e8f0',
    fontSize: 11, color: '#94a3b8', textAlign: 'center',
    ...style,
  }

  if (error) return <div style={box} className={className}>QR indisponible</div>
  if (loading || !src) return <div style={box} className={className} aria-busy="true">…</div>
  return (
    <img
      src={src} alt={alt} width={size} height={size}
      style={{ background: '#fff', borderRadius: 6, display: 'block', ...style }}
      className={className}
    />
  )
}
