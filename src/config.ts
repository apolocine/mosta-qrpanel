// @mostajs/qrpanel/config — runtime config layer
// Author: Dr Hamid MADANI <drmdh@msn.com>
//
// Cascade :
//   1. defaults compilés (ce fichier)
//   2. .qrconfig.json (ou .qrconfig.js / .qrconfig) à process.cwd()
//   3. options passées explicitement à l'appel generateQr* (highest)
//
// Cache : la lecture du fichier est cachée en mémoire avec invalidation
// par mtime — édite le fichier, le prochain appel le relit. Pas de
// watcher (overkill pour ce cas d'usage).

import { readFileSync, existsSync, statSync, writeFileSync } from 'node:fs'
import { join, resolve } from 'node:path'
import type { ThemeKey } from './themes.js'

// ─── Types ─────────────────────────────────────────────────────────

export type QrFormat = 'svg' | 'png' | 'dataUrl'
export type QrEcc = 'L' | 'M' | 'Q' | 'H'

/** Valeurs par défaut éditables dans .qrconfig.json. */
export interface QrConfigDefaults {
  /** Master toggle — false = QR pur (legacy), bypass tout le pipeline thématique. */
  genimage: boolean
  /** Format préféré quand l'app n'en spécifie pas un. */
  format: QrFormat
  /** Largeur/hauteur du canvas SVG/PNG en pixels. */
  width: number
  /** Marge blanche autour du QR (en modules). */
  margin: number
  /** Niveau de correction d'erreur. 'H' recommandé pour composite (ECC=30%). */
  errorCorrectionLevel: QrEcc
  /** Couleur des modules sombres du QR. */
  darkColor: string
  /** Couleur du fond (cartouche central). */
  lightColor: string
  /** 'random' = tirage dans themePool, ou clé thème, ou 'none' (= image off ponctuel). */
  theme: ThemeKey | 'random' | 'none'
  /** Sous-set des thèmes utilisés quand theme='random'. */
  themePool: ThemeKey[]
  /**
   * Position du motif dans la zone-marge (0..1) :
   *   0   = collé au bord
   *   0.5 = centre de la marge (optimal — default)
   *   1   = collé contre le cartouche
   */
  framePadding: number
  /** Taille du cartouche blanc central (proportion du canvas, 0..1). */
  centerWhiteRatio: number
  /** Opacité du cadre image (0..1). */
  themeOpacity: number
  /** Couleur monochrome du cadre image (CSS color). */
  themeColor: string
}

export interface QrConfig {
  default: QrConfigDefaults
  /** Thèmes custom — clé arbitraire, override ou ajout. */
  customThemes?: Record<string, { svg: string; label?: string }>
}

// ─── Defaults ──────────────────────────────────────────────────────

export const DEFAULT_CONFIG: QrConfig = {
  default: {
    genimage: true,
    format: 'svg',
    width: 600,
    margin: 2,
    errorCorrectionLevel: 'H',
    darkColor: '#0f172a',
    lightColor: '#ffffff',
    theme: 'random',
    themePool: [
      'baby', 'animals', 'science', 'physics', 'chemistry', 'math',
      'nature', 'tech', 'space', 'music', 'book', 'health',
    ],
    framePadding: 0.5,
    centerWhiteRatio: 0.62,
    themeOpacity: 1.0,
    themeColor: '#1e293b',
  },
}

// ─── Lookup file paths ─────────────────────────────────────────────

const CONFIG_FILES = ['.qrconfig.json', '.qrconfig.js', '.qrconfig'] as const

/** Cherche le fichier config existant à `cwd`, retourne le path absolu ou null. */
function findConfigFile(cwd: string): string | null {
  for (const name of CONFIG_FILES) {
    const p = join(cwd, name)
    if (existsSync(p)) return p
  }
  return null
}

// ─── Cache ─────────────────────────────────────────────────────────

interface CacheEntry {
  mtimeMs: number
  config: QrConfig
}
const _cache = new Map<string, CacheEntry>()

// ─── Readers ───────────────────────────────────────────────────────

/**
 * Décide si l'auto-création silencieuse est activée.
 * Désactivable via `process.env.QRPANEL_AUTO_ENSURE=false` ou `=0` ou `=off`.
 * Activée par défaut (depuis 0.3.2).
 */
function isAutoEnsureEnabled(): boolean {
  const v = process.env.QRPANEL_AUTO_ENSURE
  if (v == null) return true
  const lower = String(v).toLowerCase().trim()
  return !(lower === 'false' || lower === '0' || lower === 'off' || lower === 'no')
}

// Mémoire pour ne pas re-tenter writeFileSync à chaque appel sur un FS readonly
const _autoEnsureFailedFor = new Set<string>()

/**
 * Lit la config depuis `cwd` (default `process.cwd()`).
 *
 * Comportement (depuis 0.3.2) :
 *   - Si `.qrconfig.json/.js/.qrconfig` trouvé → lecture + cache mtime.
 *   - Si absent ET auto-ensure activé → tente writeFileSync silencieux.
 *   - Si writeFileSync échoue (readonly fs, perm denied) → fallback transparent
 *     sur DEFAULT_CONFIG, l'échec est mémorisé pour ne pas retenter.
 *
 * Désactiver l'auto-ensure : `QRPANEL_AUTO_ENSURE=false`.
 */
export function loadQrConfig(cwd: string = process.cwd()): QrConfig {
  let path = findConfigFile(cwd)

  // Auto-création (0.3.2+) : si pas de fichier et pas déjà échoué une fois ici
  if (!path && isAutoEnsureEnabled() && !_autoEnsureFailedFor.has(cwd)) {
    try {
      path = ensureQrConfig(cwd)
    } catch {
      _autoEnsureFailedFor.add(cwd)  // FS readonly / perm denied → on retombe sur defaults sans bruit
    }
  }

  if (!path) return DEFAULT_CONFIG

  const stat = statSync(path)
  const cached = _cache.get(path)
  if (cached && cached.mtimeMs === stat.mtimeMs) {
    return cached.config
  }

  let parsed: Partial<QrConfig>
  try {
    if (path.endsWith('.js')) {
      // require() interop pour .js — sync, pas d'import dynamique
      // eslint-disable-next-line @typescript-eslint/no-var-requires
      const mod = (require)(path)
      parsed = (mod.default ?? mod) as Partial<QrConfig>
    } else {
      const raw = readFileSync(path, 'utf-8')
      parsed = JSON.parse(raw) as Partial<QrConfig>
    }
  } catch (e) {
    throw new Error(`[qrpanel] failed to parse ${path}: ${(e as Error).message}`)
  }

  const merged: QrConfig = {
    default: { ...DEFAULT_CONFIG.default, ...(parsed.default ?? {}) },
    customThemes: parsed.customThemes,
  }

  _cache.set(path, { mtimeMs: stat.mtimeMs, config: merged })
  return merged
}

/**
 * Crée `.qrconfig.json` à `cwd` s'il n'existe pas. Idempotent.
 * Retourne le path écrit (ou path existant si déjà là).
 *
 * @param overrides — valeurs par défaut à patcher dans le fichier généré.
 */
export function ensureQrConfig(
  cwd: string = process.cwd(),
  overrides: Partial<QrConfigDefaults> = {},
): string {
  const existing = findConfigFile(cwd)
  if (existing) return existing

  const path = join(resolve(cwd), '.qrconfig.json')
  const config: QrConfig = {
    default: { ...DEFAULT_CONFIG.default, ...overrides },
  }

  const header = '// @mostajs/qrpanel — édite ce fichier pour piloter la génération QR.\n'
    + '// Le master toggle "genimage": false bypass tout le pipeline thématique.\n'
    + '// "theme": "random" tire dans themePool ; figer un thème = "theme": "science" par exemple.\n'
  const body = JSON.stringify(config, null, 2) + '\n'

  // JSON pur (pas de commentaire dans .qrconfig.json) — header en commentaire
  // de fichier .json est invalide, on l'ignore. On garde juste le JSON.
  void header

  writeFileSync(path, body, { mode: 0o644 })
  return path
}

/** Vide le cache mémoire (utile pour les tests). */
export function clearConfigCache(): void {
  _cache.clear()
}
