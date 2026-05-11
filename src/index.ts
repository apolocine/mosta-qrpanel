// @mostajs/qrpanel — barrel
// Author: Dr Hamid MADANI <drmdh@msn.com>
//
// Re-export complet pour les consumers qui ne séparent pas client/server.
// Préfère `@mostajs/qrpanel/server` ou `@mostajs/qrpanel/client` pour
// éviter d'inclure React côté serveur ou qrcode côté client.

export * from './server.js'
export * from './client.js'
export {
  type ThemeKey, type ThemeAsset, THEME_KEYS, listThemes, getTheme,
} from './themes.js'
export {
  type QrConfig, type QrConfigDefaults, type QrFormat, type QrEcc,
  DEFAULT_CONFIG, loadQrConfig, ensureQrConfig, clearConfigCache,
} from './config.js'
