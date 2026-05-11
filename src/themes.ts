// @mostajs/qrpanel/themes — built-in theme registry
// Author: Dr Hamid MADANI <drmdh@msn.com>
//
// Chaque thème = un petit motif SVG répliqué aux 4 coins du composite,
// laissant le centre libre pour le cartouche blanc + QR. Style ligne
// minimaliste mono-color via `currentColor` (le composer pilote la
// couleur via CSS sur le <g> wrapper).
//
// Création maison — design original, libre de droits.
// viewBox local du motif : centré sur l'origine, ~14 unités d'envergure.

export type ThemeKey =
  | 'baby'
  | 'animals'
  | 'science'
  | 'physics'
  | 'chemistry'
  | 'math'
  | 'nature'
  | 'tech'
  | 'space'
  | 'music'
  | 'book'
  | 'health'

export interface ThemeAsset {
  key: ThemeKey
  label: string
  /** Fragment SVG (sans <svg> wrapper) — un motif centré sur (0,0). */
  motif: string
}

/** Communs à tous les motifs (style ligne fine et propre). */
const STROKE = 'stroke="currentColor" stroke-width="2.4" fill="none" stroke-linecap="round" stroke-linejoin="round"'
const FILL = 'fill="currentColor"'

export const THEMES: Record<ThemeKey, ThemeAsset> = {
  // ─── 1. baby — sucette + cœur ─────────────────────────────────
  baby: {
    key: 'baby', label: 'Bébé',
    motif: `
      <circle cx="-2" cy="-3" r="4.5" ${STROKE}/>
      <line x1="-2" y1="1.5" x2="-2" y2="6" ${STROKE}/>
      <path d="M 5 -2 c 0.8 -1.2 2.5 -1.2 2.5 0.4 c 0 1.4 -2.5 2.8 -2.5 2.8 c 0 0 -2.5 -1.4 -2.5 -2.8 c 0 -1.6 1.7 -1.6 2.5 -0.4 z" ${FILL} opacity="0.9"/>
    `,
  },

  // ─── 2. animals — empreinte de patte (4 doigts + pad) ─────────
  animals: {
    key: 'animals', label: 'Animaux',
    motif: `
      <ellipse cx="-3.5" cy="-3" rx="1.3" ry="1.8" ${FILL}/>
      <ellipse cx="-1" cy="-5" rx="1.2" ry="1.7" ${FILL}/>
      <ellipse cx="1.8" cy="-5" rx="1.2" ry="1.7" ${FILL}/>
      <ellipse cx="4.3" cy="-3" rx="1.3" ry="1.8" ${FILL}/>
      <ellipse cx="0.5" cy="2" rx="3.5" ry="3.2" ${FILL}/>
    `,
  },

  // ─── 3. science — éprouvette + bulles ─────────────────────────
  science: {
    key: 'science', label: 'Science',
    motif: `
      <path d="M -2 -6 L -2 4 a 2.5 2.5 0 0 0 5 0 L 3 -6" ${STROKE}/>
      <line x1="-3" y1="-6" x2="4" y2="-6" ${STROKE}/>
      <circle cx="-0.5" cy="2" r="0.7" ${FILL}/>
      <circle cx="1.4" cy="0" r="0.5" ${FILL}/>
      <circle cx="0.4" cy="-2" r="0.4" ${FILL}/>
    `,
  },

  // ─── 4. physics — atome (noyau + 2 orbites croisées) ──────────
  physics: {
    key: 'physics', label: 'Physique',
    motif: `
      <ellipse cx="0" cy="0" rx="6" ry="2.4" ${STROKE}/>
      <ellipse cx="0" cy="0" rx="6" ry="2.4" transform="rotate(60)" ${STROKE}/>
      <ellipse cx="0" cy="0" rx="6" ry="2.4" transform="rotate(-60)" ${STROKE}/>
      <circle cx="0" cy="0" r="1.4" ${FILL}/>
    `,
  },

  // ─── 5. chemistry — bécher avec graduation et liquide ─────────
  chemistry: {
    key: 'chemistry', label: 'Chimie',
    motif: `
      <path d="M -3.5 -5 L -3.5 4 a 1.5 1.5 0 0 0 1.5 1.5 L 2 5.5 a 1.5 1.5 0 0 0 1.5 -1.5 L 3.5 -5" ${STROKE}/>
      <line x1="-4" y1="-5" x2="4" y2="-5" ${STROKE}/>
      <line x1="-2.7" y1="-2.5" x2="-1.4" y2="-2.5" ${STROKE}/>
      <line x1="-2.7" y1="0" x2="-1.4" y2="0" ${STROKE}/>
      <path d="M -3.5 1.5 L 3.5 1.5 L 3.5 4 a 1.5 1.5 0 0 1 -1.5 1.5 L -2 5.5 a 1.5 1.5 0 0 1 -1.5 -1.5 z" ${FILL} opacity="0.35"/>
    `,
  },

  // ─── 6. math — symbole π et signe = ───────────────────────────
  math: {
    key: 'math', label: 'Mathématique',
    motif: `
      <line x1="-5" y1="-3.5" x2="5" y2="-3.5" ${STROKE}/>
      <line x1="-2.5" y1="-3.5" x2="-2.5" y2="3.5" ${STROKE}/>
      <line x1="2.5" y1="-3.5" x2="2.5" y2="3.5" ${STROKE}/>
      <line x1="-5" y1="5.5" x2="5" y2="5.5" ${STROKE}/>
      <line x1="-5" y1="7.2" x2="5" y2="7.2" ${STROKE}/>
    `,
  },

  // ─── 7. nature — feuille + tige ───────────────────────────────
  nature: {
    key: 'nature', label: 'Nature',
    motif: `
      <path d="M 0 6 C -6 4 -6 -4 0 -6 C 6 -4 6 4 0 6 Z" ${STROKE}/>
      <line x1="0" y1="-6" x2="0" y2="6" ${STROKE}/>
      <line x1="0" y1="-3" x2="-3" y2="-1" ${STROKE}/>
      <line x1="0" y1="0" x2="-3.5" y2="2" ${STROKE}/>
      <line x1="0" y1="-3" x2="3" y2="-1" ${STROKE}/>
      <line x1="0" y1="0" x2="3.5" y2="2" ${STROKE}/>
    `,
  },

  // ─── 8. tech — engrenage 8 dents ──────────────────────────────
  tech: {
    key: 'tech', label: 'Tech',
    motif: `
      <path d="
        M -1 -5.6 L 1 -5.6 L 1.4 -4 L 3 -3.4 L 4.2 -4.5 L 5.5 -3.2 L 4.4 -2 L 5 -0.4 L 6.6 0 L 6.6 2
        L 5 2.4 L 4.4 4 L 5.5 5.2 L 4.2 6.5 L 3 5.4 L 1.4 6 L 1 7.6 L -1 7.6 L -1.4 6 L -3 5.4
        L -4.2 6.5 L -5.5 5.2 L -4.4 4 L -5 2.4 L -6.6 2 L -6.6 0 L -5 -0.4 L -4.4 -2 L -5.5 -3.2
        L -4.2 -4.5 L -3 -3.4 L -1.4 -4 Z" transform="translate(0 -1) scale(0.7)" ${STROKE}/>
      <circle cx="0" cy="-1" r="1.5" transform="scale(0.7)" ${STROKE}/>
    `,
  },

  // ─── 9. space — planète saturne + étoile ──────────────────────
  space: {
    key: 'space', label: 'Espace',
    motif: `
      <circle cx="-1" cy="0" r="3.2" ${STROKE}/>
      <ellipse cx="-1" cy="0" rx="6" ry="1.4" transform="rotate(-20 -1 0)" ${STROKE}/>
      <path d="M 5 -5 L 5.6 -3.5 L 7.2 -3.5 L 6 -2.6 L 6.5 -1.1 L 5 -2 L 3.5 -1.1 L 4 -2.6 L 2.8 -3.5 L 4.4 -3.5 Z" ${FILL}/>
    `,
  },

  // ─── 10. music — note + portée ────────────────────────────────
  music: {
    key: 'music', label: 'Musique',
    motif: `
      <ellipse cx="-2" cy="4" rx="2.2" ry="1.7" transform="rotate(-22 -2 4)" ${FILL}/>
      <line x1="0" y1="3" x2="0" y2="-6" ${STROKE}/>
      <path d="M 0 -6 C 3 -5 4 -2 1.5 -1" ${STROKE}/>
      <ellipse cx="3.5" cy="2.5" rx="1.7" ry="1.3" transform="rotate(-22 3.5 2.5)" ${FILL} opacity="0.6"/>
      <line x1="5" y1="1.5" x2="5" y2="-4" ${STROKE} opacity="0.6"/>
    `,
  },

  // ─── 11. book — livre ouvert ──────────────────────────────────
  book: {
    key: 'book', label: 'Livre',
    motif: `
      <path d="M -6 -4 L 0 -3 L 6 -4 L 6 4 L 0 5 L -6 4 Z" ${STROKE}/>
      <line x1="0" y1="-3" x2="0" y2="5" ${STROKE}/>
      <line x1="-4.5" y1="-2" x2="-1.5" y2="-1.5" ${STROKE} opacity="0.6"/>
      <line x1="-4.5" y1="0" x2="-1.5" y2="0.5" ${STROKE} opacity="0.6"/>
      <line x1="1.5" y1="-1.5" x2="4.5" y2="-2" ${STROKE} opacity="0.6"/>
      <line x1="1.5" y1="0.5" x2="4.5" y2="0" ${STROKE} opacity="0.6"/>
    `,
  },

  // ─── 12. health — croix médicale + battement ──────────────────
  health: {
    key: 'health', label: 'Santé',
    motif: `
      <rect x="-1.8" y="-6" width="3.6" height="12" rx="0.8" ${FILL}/>
      <rect x="-6" y="-1.8" width="12" height="3.6" rx="0.8" ${FILL}/>
      <path d="M -8 7 L -5 7 L -3.5 4 L -1.5 9 L 0 6 L 2 8 L 4 7 L 8 7" stroke="currentColor" stroke-width="1.5" fill="none" stroke-linecap="round" stroke-linejoin="round" transform="translate(0 2)"/>
    `,
  },
}

/** Liste des clés thèmes natifs (ordre fixe pour itération déterministe). */
export const THEME_KEYS: ThemeKey[] = [
  'baby', 'animals', 'science', 'physics', 'chemistry', 'math',
  'nature', 'tech', 'space', 'music', 'book', 'health',
]

/** Renvoie la liste des clés thèmes natifs. */
export function listThemes(): ThemeKey[] {
  return [...THEME_KEYS]
}

/** Récupère un thème par clé. Lance si inconnu. */
export function getTheme(key: ThemeKey): ThemeAsset {
  const theme = THEMES[key]
  if (!theme) throw new Error(`[qrpanel] unknown theme: "${key}". Available: ${THEME_KEYS.join(', ')}`)
  return theme
}

/**
 * Tire un thème au hasard dans le pool fourni (ou tous les thèmes si pool absent).
 * Utilise Math.random() — pas de seed (déterminisme = à la charge du caller s'il
 * en a besoin).
 */
export function pickRandomTheme(pool?: ThemeKey[]): ThemeKey {
  const candidates = pool && pool.length > 0 ? pool : THEME_KEYS
  return candidates[Math.floor(Math.random() * candidates.length)]!
}

/**
 * Construit le fragment SVG du cadre thématique :
 *   4 instances du motif aux 4 coins, monochrome via CSS color, opacité.
 *
 * Le fragment est destiné à être inséré dans un SVG composite global
 * (viewBox 0 0 width width). Coordonnées dans l'espace [0..width].
 */
export interface BuildFrameOpts {
  /** Largeur du canvas SVG englobant en unités utilisateur. */
  width: number
  /** Couleur monochrome appliquée via CSS. Default '#1e293b'. */
  color?: string
  /** Opacité 0..1. Default 1. */
  opacity?: number
  /**
   * Proportion du cartouche blanc central / canvas (0..1). Détermine la
   * largeur de la zone-marge où sont placés les motifs.
   * Default 0.62.
   */
  centerWhiteRatio?: number
  /**
   * Position du motif dans la zone-marge (0..1) :
   *   0   = motif collé au bord du canvas
   *   0.5 = motif centré dans la zone-marge (default, optimal)
   *   1   = motif collé contre le cartouche blanc
   */
  framePadding?: number
  /**
   * Échelle du motif (override de l'auto-calc).
   * Auto = (marginZone × 0.65 / 14) où 14 ≈ envergure locale du motif.
   */
  motifScale?: number
}

/** Envergure approximative d'un motif local (en unités SVG). */
const MOTIF_BASE_SIZE = 14

export function buildThemeFrameSvg(theme: ThemeAsset, opts: BuildFrameOpts): string {
  const w = opts.width
  const ratio = opts.centerWhiteRatio ?? 0.62
  const marginZone = (w - w * ratio) / 2  // largeur libre entre cartouche et bord
  const padFactor = opts.framePadding ?? 0.5
  const offset = marginZone * padFactor    // distance du bord au centre du motif
  const scale = opts.motifScale ?? (marginZone * 0.65 / MOTIF_BASE_SIZE)
  const color = opts.color ?? '#1e293b'
  const opacity = opts.opacity ?? 1

  const corners: [number, number][] = [
    [offset, offset],            // top-left
    [w - offset, offset],        // top-right
    [offset, w - offset],        // bottom-left
    [w - offset, w - offset],    // bottom-right
  ]

  const groups = corners.map(([cx, cy]) =>
    `<g transform="translate(${cx} ${cy}) scale(${scale})" style="color:${color};opacity:${opacity}">${theme.motif}</g>`
  ).join('')

  return groups
}
