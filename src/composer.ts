// @mostajs/qrpanel/composer — themed composite generator
// Author: Dr Hamid MADANI <drmdh@msn.com>
//
// Compose un SVG global :
//   1. background blanc full canvas
//   2. cadre thématique (4 motifs aux coins) via themes.buildThemeFrameSvg
//   3. cartouche blanc central (rect)
//   4. QR centré dans le cartouche, ECC élevé recommandé
//
// Le PNG composite est obtenu en rasterisant le SVG via @resvg/resvg-js
// (rust prebuilt-binaries cross-OS, no chromium, no node-gyp).

import QRCode from 'qrcode'
import { Resvg } from '@resvg/resvg-js'
import {
  type ThemeKey, type ThemeAsset, getTheme, pickRandomTheme,
  buildThemeFrameSvg,
} from './themes.js'
import type { QrConfigDefaults } from './config.js'

export interface ComposeOptions {
  width: number
  errorCorrectionLevel: 'L' | 'M' | 'Q' | 'H'
  darkColor: string
  lightColor: string
  theme: ThemeKey | 'random' | 'none' | { svg: string; label?: string }
  themePool: ThemeKey[]
  framePadding: number
  centerWhiteRatio: number
  themeOpacity: number
  themeColor: string
}

/**
 * Résout la prop `theme` en thème concret.
 * - 'random' → tire dans themePool
 * - 'none'   → null (caller doit fallback sur QR pur)
 * - { svg }  → thème inline custom
 * - clé      → thème natif via registry
 */
export function resolveTheme(
  theme: ComposeOptions['theme'],
  pool: ThemeKey[],
): ThemeAsset | null {
  if (theme === 'none') return null
  if (typeof theme === 'object' && theme && 'svg' in theme) {
    return { key: 'custom' as ThemeKey, label: theme.label ?? 'Custom', motif: theme.svg }
  }
  const key: ThemeKey = theme === 'random' ? pickRandomTheme(pool) : theme
  return getTheme(key)
}

/**
 * Génère le SVG composite (theme frame + center white card + QR).
 * Si theme='none', retourne null — le caller doit fallback sur le QR pur.
 */
export async function composeThemedSvg(
  text: string,
  opts: ComposeOptions,
): Promise<string | null> {
  const themeAsset = resolveTheme(opts.theme, opts.themePool)
  if (!themeAsset) return null

  const w = opts.width

  // 1. QR SVG inline — margin=0, on lui donne sa propre marge via le cartouche
  const qrRawSvg = await QRCode.toString(text, {
    type: 'svg',
    margin: 0,
    errorCorrectionLevel: opts.errorCorrectionLevel,
    color: { dark: opts.darkColor, light: opts.lightColor },
  })

  // 2. Extrait le viewBox et le contenu interne du QR SVG
  const vbMatch = qrRawSvg.match(/viewBox="([^"]+)"/)
  const qrViewBox = vbMatch?.[1] ?? '0 0 21 21'
  const qrInner = qrRawSvg
    .replace(/<\?xml[^>]*\?>\s*/, '')
    .replace(/<svg[^>]*>/, '')
    .replace(/<\/svg>\s*$/, '')

  // 3. Géométrie : cartouche blanc central + QR à l'intérieur (avec
  //    une marge de respiration entre le QR et le bord du cartouche)
  const centerSize = w * opts.centerWhiteRatio
  const centerX = (w - centerSize) / 2
  const qrInsideMargin = centerSize * 0.06   // 6% de la taille cartouche
  const qrSize = centerSize - 2 * qrInsideMargin
  const qrX = centerX + qrInsideMargin
  const qrY = centerX + qrInsideMargin

  // 4. Cadre thématique (4 coins) — scale et positions auto-calculés
  //    depuis centerWhiteRatio (zone marge entre cartouche et bord).
  const frame = buildThemeFrameSvg(themeAsset, {
    width: w,
    color: opts.themeColor,
    opacity: opts.themeOpacity,
    framePadding: opts.framePadding,
    centerWhiteRatio: opts.centerWhiteRatio,
  })

  // 5. SVG composite final
  const svg = `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${w} ${w}" width="${w}" height="${w}">
  <rect width="${w}" height="${w}" fill="${opts.lightColor}"/>
  ${frame}
  <rect x="${centerX}" y="${centerX}" width="${centerSize}" height="${centerSize}" fill="${opts.lightColor}"/>
  <svg x="${qrX}" y="${qrY}" width="${qrSize}" height="${qrSize}" viewBox="${qrViewBox}" shape-rendering="crispEdges">
    ${qrInner}
  </svg>
</svg>`

  return svg
}

/**
 * Génère le PNG composite via @resvg/resvg-js.
 * Si theme='none', retourne null — le caller doit fallback.
 */
export async function composeThemedPng(
  text: string,
  opts: ComposeOptions,
): Promise<Buffer | null> {
  const svg = await composeThemedSvg(text, opts)
  if (!svg) return null

  const resvg = new Resvg(svg, {
    fitTo: { mode: 'width', value: opts.width },
    background: opts.lightColor,
  })
  const rendered = resvg.render()
  return Buffer.from(rendered.asPng())
}

/**
 * Génère un Data URL PNG du composite.
 * Si theme='none', retourne null — le caller doit fallback.
 */
export async function composeThemedDataUrl(
  text: string,
  opts: ComposeOptions,
): Promise<string | null> {
  const png = await composeThemedPng(text, opts)
  if (!png) return null
  return `data:image/png;base64,${png.toString('base64')}`
}

/** Helper de merge config + opts pour les fonctions de génération. */
export function mergeComposeOpts(
  cfg: QrConfigDefaults,
  opts: Partial<ComposeOptions> = {},
): ComposeOptions {
  return {
    width: opts.width ?? cfg.width,
    errorCorrectionLevel: opts.errorCorrectionLevel ?? cfg.errorCorrectionLevel,
    darkColor: opts.darkColor ?? cfg.darkColor,
    lightColor: opts.lightColor ?? cfg.lightColor,
    theme: opts.theme ?? cfg.theme,
    themePool: opts.themePool ?? cfg.themePool,
    framePadding: opts.framePadding ?? cfg.framePadding,
    centerWhiteRatio: opts.centerWhiteRatio ?? cfg.centerWhiteRatio,
    themeOpacity: opts.themeOpacity ?? cfg.themeOpacity,
    themeColor: opts.themeColor ?? cfg.themeColor,
  }
}
