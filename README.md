# @mostajs/qrpanel

QR code panel — générateur server-side *(PNG / SVG / data URL via la lib `qrcode`)* avec **12 thèmes natifs** *(image-as-frame composite, ECC=H par défaut)*, piloté par un fichier de config `.qrconfig.json` éditable. Composant React `<QrPanel>` *(QR + lien hypertexte copiable + actions copier / ouvrir / mailto)*.

**Auteur** : Dr Hamid MADANI <drmdh@msn.com>

## Cross-OS

Aucune dépendance Chromium / Puppeteer / node-gyp. Pure-JS pour `qrcode`, prebuilt-binaries Rust pour le rasterizer (`@resvg/resvg-js`). Fonctionne identiquement sur **Linux, macOS, Windows** *(Node ≥18)*.

## ⚠️ Next.js (App Router)

`@resvg/resvg-js` charge un **binaire natif** (`.node`). Webpack ne sait pas le bundler — il faut le déclarer en *server external* dans `next.config.js` :

```js
/** @type {import('next').NextConfig} */
const nextConfig = {
  // Seulement @resvg/resvg-js (vraie dep native).
  // ⚠️ Ne PAS mettre '@mostajs/qrpanel' ici : ça externaliserait
  //    aussi /client (composant React <QrPanel>), et un Server
  //    Component qui le rend crasherait avec "React.useState=null".
  serverExternalPackages: ['@resvg/resvg-js'],
}
export default nextConfig
```

*(Sur Next.js < 15, la clé s'appelle `experimental.serverComponentsExternalPackages`.)* Sans ça, `npm run build` échoue avec :
```
Module parse failed: Unexpected character '' (1:0)
./node_modules/@resvg/resvg-js-linux-x64-gnu/resvgjs.linux-x64-gnu.node
```

## Installation

```bash
npm install @mostajs/qrpanel
```

## Quickstart

```ts
import { generateQrPng, ensureQrConfig } from '@mostajs/qrpanel/server'

// (Optionnel) écrire .qrconfig.json à la racine — lifecycle init / boot.
ensureQrConfig()

// Génère un PNG composite (cadre thème "random" tiré dans themePool).
const png = await generateQrPng('https://example.com/invite/abc')
```

## v0.3 — thèmes & config

Le module embarque **12 thèmes vectoriels** *(SVG inline mono-color, ~2-3 Ko chacun, libres de droits — création maison)*, répliqués aux 4 coins d'un cadre décoratif. Le QR reste centré sur un cartouche blanc plein, ECC=H par défaut → scannable même avec cadre coloré.

### Thèmes natifs

| Clé | Label | Clé | Label |
|---|---|---|---|
| `baby` | Bébé | `nature` | Nature |
| `animals` | Animaux | `tech` | Tech |
| `science` | Science | `space` | Espace |
| `physics` | Physique | `music` | Musique |
| `chemistry` | Chimie | `book` | Livre |
| `math` | Mathématique | `health` | Santé |

### Fichier `.qrconfig.json`

Généré à `process.cwd()` via `ensureQrConfig()` ou `npx qrpanel init`. Pilote tous les générateurs au runtime *(cache invalidé par `mtime` — édite le fichier, le prochain appel le relit)*.

```jsonc
{
  "default": {
    "genimage": true,                  // ← master toggle (false = QR pur, bypass total)
    "format": "svg",
    "width": 600,
    "margin": 2,
    "errorCorrectionLevel": "H",       // overlay-safe (30% redondance)
    "darkColor": "#0f172a",
    "lightColor": "#ffffff",
    "theme": "random",                 // 'random' | clé thème | 'none'
    "themePool": [
      "baby", "animals", "science", "physics",
      "chemistry", "math", "nature", "tech",
      "space", "music", "book", "health"
    ],
    "framePadding": 0.13,
    "centerWhiteRatio": 0.62,
    "themeOpacity": 1.0,
    "themeColor": "#1e293b"
  }
}
```

### Cascade de résolution

```
defaults compilés  <  .qrconfig.json (cwd)  <  options passées à l'appel
```

### Master toggle `genimage`

```jsonc
{ "default": { "genimage": false } }    // OU :
generateQrPng(url, { genimage: false }) // override ponctuel
```

→ court-circuite tout le pipeline composite, retombe sur le **QR pur** *(comportement v0.2.x identique)*. Utile en debug / CI / mode "print neutre".

## Usage côté serveur

```ts
import {
  generateQrPng, generateQrSvg, generateQrDataUrl,
  listThemes, ensureQrConfig,
} from '@mostajs/qrpanel/server'

// Buffer PNG composite (cadre thème science)
const png = await generateQrPng('https://example.com/x', {
  theme: 'science',
  width: 600,
  themeColor: '#0ea5e9',
})

// SVG composite avec random tiré dans un sous-set
const svg = await generateQrSvg('https://example.com/x', {
  theme: 'random',
  themePool: ['math', 'physics', 'chemistry'],
})

// DataURL PNG composite (image inline)
const dataUrl = await generateQrDataUrl('https://example.com/x')

// Override ponctuel — désactive le composite ne serait-ce qu'une fois
const plain = await generateQrPng('https://example.com/x', { genimage: false })
```

### Endpoint Next.js (App Router)

```ts
// app/api/qr/route.ts
import { NextResponse } from 'next/server'
import { generateQrPng } from '@mostajs/qrpanel/server'

export const runtime = 'nodejs'

export async function GET(req: Request) {
  const url = new URL(req.url).searchParams.get('text') ?? ''
  const theme = (new URL(req.url).searchParams.get('theme') ?? 'random') as any
  const png = await generateQrPng(url, { theme })
  return new NextResponse(png as any, {
    headers: { 'Content-Type': 'image/png' },
  })
}
```

### Thème custom inline

```ts
const png = await generateQrPng(url, {
  theme: { svg: '<circle cx="0" cy="0" r="5" fill="currentColor"/>', label: 'My logo' },
  themeColor: '#ff0000',
})
```

## Usage côté client (React)

```tsx
import { QrPanel } from '@mostajs/qrpanel/client'

<QrPanel
  modes={[
    {
      key: 'direct',
      label: 'Direct',
      url: 'https://app.example.com/projet-x',
      qrSrc: '/api/qr?text=' + encodeURIComponent('https://app.example.com/projet-x') + '&theme=science',
      description: 'Le QR mène directement au questionnaire.',
    },
    {
      key: 'invite',
      label: 'Invite token',
      url: 'https://app.example.com/invite/eyJ...',
      qrSrc: '/api/qr?text=...&theme=random',
      description: 'Token signé valable 60 jours, idéal pour mailing.',
    },
  ]}
  title="QR code & lien d'invitation"
  mailSubject="Invitation au questionnaire"
/>
```

## CLI

```bash
npx qrpanel init           # écrit .qrconfig.json (idempotent)
npx qrpanel themes         # liste les 12 thèmes
npx qrpanel --version
```

## Helper combiné — `buildInviteUrls`

Inchangé depuis v0.2.

```ts
import { buildInviteUrls } from '@mostajs/qrpanel/server'

const { directUrl, inviteUrl, inviteToken } = buildInviteUrls({
  baseUrl: 'https://app.example.com',
  directPath: '/projet-x',
  inviteSecret: process.env.INVITE_SECRET!,
  inviteId: project.id,
  ttlMs: 60 * 24 * 3600 * 1000,
  inviteMeta: { kind: 'cohort-invite' },
})
```

## API

### Server

| Fonction | Retour | Cas |
|----------|--------|-----|
| `generateQrPng(text, opts?)` | `Promise<Buffer>` | PNG composite ou QR pur si genimage=false |
| `generateQrSvg(text, opts?)` | `Promise<string>` | SVG composite ou QR pur |
| `generateQrDataUrl(text, opts?)` | `Promise<string>` | DataURL PNG |
| `loadQrConfig(cwd?)` | `QrConfig` | Lit `.qrconfig.json` *(cached mtime)* |
| `ensureQrConfig(cwd?, overrides?)` | `string` | Crée `.qrconfig.json` si absent (idempotent) |
| `listThemes()` | `ThemeKey[]` | Liste des 12 clés natives |
| `buildInviteUrls(opts)` | `InviteUrls` | URL builder + invite-token signé |

### `QrOptions`

```ts
interface QrOptions {
  // Communs
  width?: number
  margin?: number
  errorCorrectionLevel?: 'L' | 'M' | 'Q' | 'H'
  darkColor?: string
  lightColor?: string

  // v0.3 thématique
  genimage?: boolean             // master toggle (override config)
  theme?: ThemeKey | 'random' | 'none' | { svg: string; label?: string }
  themePool?: ThemeKey[]
  framePadding?: number          // 0..0.5
  centerWhiteRatio?: number      // 0..1
  themeOpacity?: number          // 0..1
  themeColor?: string            // CSS color
}
```

### Client `<QrPanel>` — inchangé v0.2

```ts
interface QrPanelProps {
  modes: QrPanelMode[]
  initialModeIndex?: number
  title?: string
  mailSubject?: string
  mailBodyTemplate?: string
  qrSize?: number
  className?: string
}
```

## Dépendances

| Package | Rôle | Pourquoi pas X |
|---|---|---|
| `qrcode` | Génère le QR pur (SVG/PNG) | Pure-JS, cross-OS, déjà éprouvé |
| `@resvg/resvg-js` | Rasterise le SVG composite en PNG | Rust prebuilt binaries (no node-gyp, no chromium) |
| `@mostajs/auth` | `signInviteToken` pour `buildInviteUrls` | Cohérence écosystème mostajs |

## Licence

AGPL-3.0-or-later.
