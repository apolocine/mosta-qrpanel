# @mostajs/qrpanel — Changelog

**Auteur** : Dr Hamid MADANI <drmdh@msn.com>

## 0.5.0 — 2026-05-21

### Feature — `<QrImage>` : génération QR locale côté navigateur

Nouveau sous-export **`@mostajs/qrpanel/qr-image`** comblant le cas non
couvert jusqu'ici : générer un QR code **dans le navigateur**, sans
round-trip serveur ni service externe.

- **`<QrImage data size … />`** — composant React qui génère le QR
  localement (data URL via `qrcode`) et le rend en `<img>`. Style-neutre
  (`style` / `className`), utilisable sans Tailwind.
- **`useQrDataUrl(data, opts)`** — hook primitif renvoyant
  `{ src, loading, error }`.
- **COEP-safe** : sous cross-origin isolation (`require-corp`), une image
  QR cross-origin est bloquée par la politique ; la génération locale est
  alors la seule option côté client.
- Sous-export dédié : `qrcode` n'entre dans le bundle client que pour les
  consumers qui importent `@mostajs/qrpanel/qr-image`.

Complémentarité des trois briques :
- `./server` — `generateQr{Png,Svg,DataUrl}` (Node, thèmes, @resvg natif).
- `./client` — `<QrPanel>` (copie / partage / mailto, `qrSrc` fourni).
- `./qr-image` — `<QrImage>` (génération locale navigateur).

### Change — `@mostajs/auth` et `@resvg/resvg-js` en peer deps optionnelles

Ces deux dépendances ne servent qu'à `./server` (`@resvg` pour la
rasterisation thématique, `@mostajs/auth` pour `buildInviteUrls`). Elles
passent de `dependencies` à **`peerDependencies` optionnelles** : un
consumer de `./qr-image` ou `./client` n'embarque plus la galaxie
auth/rbac/net ni un binaire natif inutile. Les consumers de `./server`
doivent désormais installer `@mostajs/auth` et `@resvg/resvg-js`
eux-mêmes.

## 0.4.0

Générateur QR serveur (PNG/SVG/DataUrl) avec 12 thèmes intégrés
(image-as-frame, ECC=H), pilotage par `.qrconfig.json`, cross-OS sans
chromium ; composant React `<QrPanel>` (copie / ouvrir / mailto) ;
helper `buildInviteUrls` (invite-token HMAC) ; CLI `qrpanel`.
