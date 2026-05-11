// @mostajs/qrpanel/server — server-side QR generation (Node)
// Author: Dr Hamid MADANI <drmdh@msn.com>
//
// Wrap minimaliste de la lib `qrcode` (npm) + extension thématique
// pilotée par .qrconfig.json (chargée à process.cwd() au runtime, cache
// invalidé par mtime).
//
// Cross-OS natif (Linux, macOS, Windows) — qrcode est pure-JS, et la
// rasterization PNG composite passe par @resvg/resvg-js (rust prebuilt
// binaries cross-OS, pas de chromium ni puppeteer).
//
// API legacy 100% rétro-compatible :
//   - generateQrPng/Svg/DataUrl(text, opts) marchent comme en 0.2.x
//     si .qrconfig.json est absent ET opts.genimage non-précisé.
//   - Le master toggle genimage=false (config ou opts) court-circuite
//     toute la chaîne thématique.

import QRCode from 'qrcode'
import { signInviteToken } from '@mostajs/auth/lib/invite-token'
import {
  loadQrConfig, type QrConfigDefaults,
} from './config.js'
import {
  composeThemedSvg, composeThemedPng, composeThemedDataUrl, mergeComposeOpts,
  type ComposeOptions,
} from './composer.js'
import type { ThemeKey } from './themes.js'

// ─── Public types ──────────────────────────────────────────────────

export interface QrOptions {
  /** Largeur/hauteur de l'image en pixels. Default 600 (ou config). */
  width?: number
  /** Marge blanche autour du QR (en modules). Default 2 (ou config). */
  margin?: number
  /**
   * Niveau de correction d'erreur :
   *   L = 7 % | M = 15 % | Q = 25 % | H = 30 % (recommandé pour overlay)
   */
  errorCorrectionLevel?: 'L' | 'M' | 'Q' | 'H'
  /** Couleur des modules sombres. Default '#0f172a'. */
  darkColor?: string
  /** Couleur du fond. Default '#ffffff'. */
  lightColor?: string

  // ── v0.3 — extension thématique ─────────────────────────────────
  /**
   * Master toggle. `false` court-circuite tout le pipeline thématique
   * et retombe sur le QR pur (comportement v0.2.x). Override de la
   * valeur config.
   */
  genimage?: boolean
  /**
   * Thème à appliquer en cadre (4 motifs aux coins). Pris dans le
   * registry natif (12 thèmes). 'random' tire dans `themePool`.
   * 'none' désactive le composite ponctuellement.
   * Objet `{ svg }` → motif custom inline.
   */
  theme?: ThemeKey | 'random' | 'none' | { svg: string; label?: string }
  /** Sous-set des thèmes pour le tirage 'random'. Default = tous. */
  themePool?: ThemeKey[]
  /** Marge cadre image / canvas (proportion). Default 0.13. */
  framePadding?: number
  /** Taille du cartouche blanc central (proportion 0..1). Default 0.62. */
  centerWhiteRatio?: number
  /** Opacité du cadre image (0..1). Default 1. */
  themeOpacity?: number
  /** Couleur monochrome du cadre image. Default '#1e293b'. */
  themeColor?: string
}

// ─── Internal helpers ──────────────────────────────────────────────

/**
 * Décide si on bascule sur le pipeline composite ou le legacy.
 * Order : opts.genimage > config.default.genimage. theme='none' force legacy.
 */
function shouldComposite(opts: QrOptions, cfg: QrConfigDefaults): boolean {
  if (opts.genimage === false) return false
  if (opts.genimage === true) {
    // explicit on : ne respecte pas theme=none ? Si l'app dit explicitement
    // genimage=true mais theme=none, on respecte theme=none (QR pur ponctuel).
    const theme = opts.theme ?? cfg.theme
    return theme !== 'none'
  }
  // Pas d'override opts → suit la config
  if (cfg.genimage === false) return false
  const theme = opts.theme ?? cfg.theme
  return theme !== 'none'
}

function composeOptsFromQrOptions(opts: QrOptions, cfg: QrConfigDefaults): ComposeOptions {
  return mergeComposeOpts(cfg, {
    width: opts.width,
    errorCorrectionLevel: opts.errorCorrectionLevel,
    darkColor: opts.darkColor,
    lightColor: opts.lightColor,
    theme: opts.theme,
    themePool: opts.themePool,
    framePadding: opts.framePadding,
    centerWhiteRatio: opts.centerWhiteRatio,
    themeOpacity: opts.themeOpacity,
    themeColor: opts.themeColor,
  })
}

// ─── Public API : 3 generators ─────────────────────────────────────

/** Génère un PNG (Buffer) d'un QR code encodant `text`. */
export async function generateQrPng(text: string, opts: QrOptions = {}): Promise<Buffer> {
  const cfg = loadQrConfig().default
  if (shouldComposite(opts, cfg)) {
    const composed = await composeThemedPng(text, composeOptsFromQrOptions(opts, cfg))
    if (composed) return composed
  }
  // Legacy QR pur (qrcode lib direct)
  return QRCode.toBuffer(text, {
    width: opts.width ?? cfg.width,
    margin: opts.margin ?? 2,
    errorCorrectionLevel: opts.errorCorrectionLevel ?? cfg.errorCorrectionLevel,
    color: {
      dark: opts.darkColor ?? cfg.darkColor,
      light: opts.lightColor ?? cfg.lightColor,
    },
  })
}

/** Génère un SVG (string) d'un QR code encodant `text`. */
export async function generateQrSvg(text: string, opts: QrOptions = {}): Promise<string> {
  const cfg = loadQrConfig().default
  if (shouldComposite(opts, cfg)) {
    const composed = await composeThemedSvg(text, composeOptsFromQrOptions(opts, cfg))
    if (composed) return composed
  }
  return QRCode.toString(text, {
    type: 'svg',
    width: opts.width ?? cfg.width,
    margin: opts.margin ?? 2,
    errorCorrectionLevel: opts.errorCorrectionLevel ?? cfg.errorCorrectionLevel,
    color: {
      dark: opts.darkColor ?? cfg.darkColor,
      light: opts.lightColor ?? cfg.lightColor,
    },
  })
}

/** Génère un Data URL `data:image/png;base64,...` */
export async function generateQrDataUrl(text: string, opts: QrOptions = {}): Promise<string> {
  const cfg = loadQrConfig().default
  if (shouldComposite(opts, cfg)) {
    const composed = await composeThemedDataUrl(text, composeOptsFromQrOptions(opts, cfg))
    if (composed) return composed
  }
  return QRCode.toDataURL(text, {
    width: opts.width ?? cfg.width,
    margin: opts.margin ?? 2,
    errorCorrectionLevel: opts.errorCorrectionLevel ?? cfg.errorCorrectionLevel,
    color: {
      dark: opts.darkColor ?? cfg.darkColor,
      light: opts.lightColor ?? cfg.lightColor,
    },
  })
}

// ─── Helpers haut-niveau (URL builder + invite-token combiné) ─────

export interface BuildInviteUrlsOptions {
  /** Base absolue (https://app.example.com), sans slash final. */
  baseUrl: string
  /** Path public direct (ex: '/projet-x'). Sera concaténé à baseUrl. */
  directPath: string
  /** Secret HMAC pour signer le token invite. */
  inviteSecret: string | Buffer
  /** Identifiant opaque encodé dans le token (resource id). */
  inviteId: string
  /** TTL en ms (default 60 jours). */
  ttlMs?: number
  /** Path du callback invite (default '/invite'). */
  invitePath?: string
  /** Meta libre encodée dans le token. */
  inviteMeta?: Record<string, string | number | boolean>
}

export interface InviteUrls {
  /** URL absolue mode "direct" (auth standard derrière). */
  directUrl: string
  /** URL absolue mode "invite" (token HMAC signé). */
  inviteUrl: string
  /** Le token signé seul (pour storage si besoin). */
  inviteToken: string
}

/**
 * Helper combiné — signe un invite-token et construit la paire d'URLs
 * (direct + invite) prête à passer à `<QrPanel>` côté client.
 */
export function buildInviteUrls(opts: BuildInviteUrlsOptions): InviteUrls {
  const base = String(opts.baseUrl).replace(/\/+$/, '')
  const direct = opts.directPath.startsWith('/') ? opts.directPath : '/' + opts.directPath
  const invitePath = (opts.invitePath ?? '/invite').replace(/\/+$/, '')
  const inviteToken = signInviteToken(opts.inviteSecret, opts.inviteId, opts.ttlMs, opts.inviteMeta)
  return {
    directUrl: base + direct,
    inviteUrl: `${base}${invitePath}/${inviteToken}`,
    inviteToken,
  }
}

// ─── Re-exports utiles côté serveur ────────────────────────────────

export { listThemes, THEME_KEYS, THEMES, getTheme, type ThemeKey, type ThemeAsset } from './themes.js'
export { loadQrConfig, ensureQrConfig, DEFAULT_CONFIG, type QrConfig } from './config.js'
