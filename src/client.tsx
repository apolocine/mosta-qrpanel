// @mostajs/qrpanel/client — React component
// Author: Dr Hamid MADANI <drmdh@msn.com>
//
// Composant `<QrPanel>` agnostique de l'app. Affiche un QR + l'URL
// textuelle copiable + 3 actions (copier, ouvrir, mailto).
// Le composant ne génère pas le QR lui-même : l'app fournit le `qrSrc`
// (URL d'un endpoint API ou data URL inline).
//
// Style : Tailwind classes — l'app les compile dans son build (le
// component reste portable car les classes sont des chaînes).
//
// Note: marqué 'use client' pour Next.js App Router. Pour SPA (Vite,
// CRA, etc.), la directive est ignorée — le component fonctionne tel
// quel.

'use client'
import { useState, useId } from 'react'

export interface QrPanelMode {
  /** Identifiant interne du mode (libre — sera passé en argument à `qrSrc`). */
  key: string
  /** Libellé bouton. */
  label: string
  /** URL absolue à afficher / copier dans ce mode. */
  url: string
  /** URL de l'image QR pour ce mode (endpoint API ou data URL). */
  qrSrc: string
  /** Description courte affichée sous l'en-tête. */
  description?: string
}

export interface QrPanelProps {
  /** Liste des modes proposés (1 ou plusieurs). */
  modes: QrPanelMode[]
  /** Mode initial — index dans `modes`. Default 0. */
  initialModeIndex?: number
  /** Titre du panel. Default 'QR code & lien d\'invitation'. */
  title?: string
  /** Pré-remplissage `mailto`. Default 'Invitation'. */
  mailSubject?: string
  /** Pré-remplissage `mailto` body — `{url}` est remplacé par l'URL courante. */
  mailBodyTemplate?: string
  /**
   * Destinataires placés dans `To:` du `mailto:` *(visibles entre eux)*.
   * Liste d'emails (array ou string CSV). Combinable avec `mailBcc`.
   */
  mailTo?: string[] | string
  /**
   * Destinataires placés dans `Bcc:` *(invisibles entre eux — recommandé
   * pour les listes de cohort où les participants ne doivent pas voir
   * les adresses des autres)*. Liste d'emails (array ou string CSV).
   */
  mailBcc?: string[] | string
  /** Taille de l'image QR. Default 260. */
  qrSize?: number
  /** Classe CSS racine optionnelle. */
  className?: string
}

const DEFAULT_BODY = 'Bonjour,\n\nVoici ton lien personnel :\n\n{url}\n\n'

/** Accepte une string CSV ou un array, normalise en array d'emails non-vides. */
function normaliseRecipients(input: string[] | string | undefined): string[] {
  if (!input) return []
  const arr = Array.isArray(input) ? input : input.split(',')
  return arr.map(s => s.trim()).filter(s => s.length > 0)
}

export function QrPanel({
  modes, initialModeIndex = 0, title = 'QR code & lien d\'invitation',
  mailSubject = 'Invitation', mailBodyTemplate = DEFAULT_BODY,
  mailTo, mailBcc,
  qrSize = 260, className = '',
}: QrPanelProps) {
  const [idx, setIdx] = useState(Math.min(Math.max(0, initialModeIndex), modes.length - 1))
  const [copied, setCopied] = useState(false)
  const textareaId = useId()
  const current = modes[idx] ?? modes[0]
  if (!current) return null

  const toList = normaliseRecipients(mailTo)
  const bccList = normaliseRecipients(mailBcc)
  const parts: string[] = []
  parts.push(`subject=${encodeURIComponent(mailSubject)}`)
  parts.push(`body=${encodeURIComponent(mailBodyTemplate.replace('{url}', current.url))}`)
  if (bccList.length > 0) parts.push(`bcc=${encodeURIComponent(bccList.join(','))}`)
  // `To:` est positionné juste après `mailto:` quand fourni (les
  // destinataires To: sont rendus visibles entre eux par tous les clients).
  // Les Bcc: passent par query param `&bcc=`.
  const toPart = toList.length > 0 ? encodeURIComponent(toList.join(',')) : ''
  const mailto = `mailto:${toPart}?${parts.join('&')}`
  const recipientCount = toList.length + bccList.length

  async function copy() {
    try {
      await navigator.clipboard.writeText(current.url)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      const el = document.getElementById(textareaId) as HTMLTextAreaElement | null
      el?.select()
    }
  }

  return (
    <div className={'bg-white border border-slate-200 rounded-xl p-4 space-y-3 ' + className}>
      <div className="flex items-center justify-between gap-2">
        <h2 className="font-semibold text-slate-900">{title}</h2>
        {modes.length > 1 && (
          <div className="flex items-center gap-1 text-xs">
            {modes.map((m, i) => (
              <button
                key={m.key} type="button" onClick={() => setIdx(i)}
                className={'px-2 py-1 rounded ' + (i === idx ? 'bg-blue-600 text-white' : 'bg-slate-100 hover:bg-slate-200')}
              >
                {m.label}
              </button>
            ))}
          </div>
        )}
      </div>

      {current.description && (
        <p className="text-xs text-slate-500">{current.description}</p>
      )}

      <div className="grid md:grid-cols-2 gap-4 items-start">
        <div className="flex flex-col items-center gap-2">
          <img
            src={current.qrSrc}
            alt={`QR ${current.label}`}
            width={qrSize} height={qrSize}
            className="border border-slate-200 rounded-lg"
          />
          <a
            href={current.qrSrc}
            download={`qr-${current.key}.png`}
            className="px-3 py-1.5 rounded text-xs bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200"
          >
            ⬇ Télécharger le PNG
          </a>
        </div>

        <div className="space-y-2">
          <label className="block">
            <span className="block text-xs font-medium text-slate-700 mb-1">
              Lien direct *(à coller dans un email)*
            </span>
            <textarea
              id={textareaId}
              readOnly
              value={current.url}
              rows={current.url.length > 60 ? 4 : 2}
              onClick={(e) => (e.currentTarget as HTMLTextAreaElement).select()}
              className="w-full px-2 py-1.5 border border-slate-300 rounded text-xs font-mono bg-slate-50 break-all"
            />
          </label>
          <div className="flex items-center gap-2 flex-wrap">
            <button
              type="button" onClick={copy}
              className="px-3 py-1.5 rounded text-xs bg-blue-600 text-white hover:bg-blue-700"
            >
              {copied ? '✓ Copié' : '📋 Copier le lien'}
            </button>
            <a
              href={current.url}
              target="_blank" rel="noreferrer"
              className="px-3 py-1.5 rounded text-xs bg-slate-100 hover:bg-slate-200 text-slate-700"
            >
              ↗ Ouvrir
            </a>
            <a
              href={mailto}
              className="px-3 py-1.5 rounded text-xs bg-amber-50 hover:bg-amber-100 text-amber-700 border border-amber-200"
              title={recipientCount > 0 ? `Ouvre le client mail avec ${recipientCount} destinataire(s) pré-remplis` : 'Ouvre le client mail avec sujet + corps pré-remplis'}
            >
              ✉ Pré-remplir un mail{recipientCount > 0 ? ` (${recipientCount})` : ''}
            </a>
          </div>
        </div>
      </div>
    </div>
  )
}
