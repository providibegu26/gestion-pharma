import type { ReactNode } from 'react'
import { AlertTriangle } from 'lucide-react'
import { Modal } from './Modal'
import { Button } from './Button'

interface ConfirmDialogProps {
  open: boolean
  onClose: () => void
  onConfirm: () => void
  title: string
  /** Message principal (texte ou noeud riche). */
  message: ReactNode
  /** Détail secondaire optionnel (ex. avertissement d'irréversibilité). */
  detail?: ReactNode
  confirmLabel?: string
  cancelLabel?: string
  loading?: boolean
  /** Variante visuelle du bouton de confirmation. */
  tone?: 'danger' | 'primary'
}

/**
 * Boîte de dialogue de confirmation générique.
 * Factorise les modales de suppression/action sensible (users, médicaments, rôles).
 */
export const ConfirmDialog = ({
  open,
  onClose,
  onConfirm,
  title,
  message,
  detail,
  confirmLabel = 'Confirmer',
  cancelLabel = 'Annuler',
  loading = false,
  tone = 'danger',
}: ConfirmDialogProps) => {
  return (
    <Modal open={open} onClose={onClose} title={title} size="sm">
      <div className="flex items-start gap-3 mb-5">
        <div
          className={
            tone === 'danger'
              ? 'flex-shrink-0 rounded-lg bg-rose-50 ring-1 ring-inset ring-rose-200 p-2 text-rose-700'
              : 'flex-shrink-0 rounded-lg bg-teal-50 ring-1 ring-inset ring-teal-200 p-2 text-teal-700'
          }
        >
          <AlertTriangle size={16} />
        </div>
        <div>
          <p className="font-body text-sm text-slate-700">{message}</p>
          {detail && <p className="font-body text-xs text-slate-500 mt-1">{detail}</p>}
        </div>
      </div>
      <div className="flex gap-3 justify-end">
        <Button variant="ghost" onClick={onClose} disabled={loading}>
          {cancelLabel}
        </Button>
        <Button
          variant={tone === 'danger' ? 'danger' : 'primary'}
          loading={loading}
          onClick={onConfirm}
        >
          {confirmLabel}
        </Button>
      </div>
    </Modal>
  )
}
