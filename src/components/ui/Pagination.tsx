import { ChevronLeft, ChevronRight } from 'lucide-react'
import { cn } from '@/utils/cn'
import { Button } from './Button'

interface PaginationProps {
  page: number
  totalPages: number
  onPageChange: (page: number) => void
  /** Nombre total d'éléments (avant pagination) — pour le résumé. */
  totalItems?: number
  /** Libellé singulier de l'élément listé (ex. "produit", "commande"). */
  itemLabel?: string
  className?: string
}

/**
 * Contrôle de pagination réutilisable (résumé + Précédent/Suivant).
 * Extrait de la logique inline du catalogue pour être partagé entre les pages.
 */
export const Pagination = ({
  page,
  totalPages,
  onPageChange,
  totalItems,
  itemLabel = 'élément',
  className,
}: PaginationProps) => {
  const safeTotal = Math.max(1, totalPages)
  const current = Math.min(Math.max(1, page), safeTotal)

  return (
    <div className={cn('flex items-center justify-between gap-3 pt-2', className)}>
      <p className="font-body text-xs text-slate-500">
        {totalItems !== undefined && (
          <>
            {totalItems} {itemLabel}
            {totalItems > 1 ? 's' : ''} ·{' '}
          </>
        )}
        page {current}/{safeTotal}
      </p>
      <div className="flex gap-2">
        <Button
          variant="outline"
          size="sm"
          icon={<ChevronLeft size={13} />}
          onClick={() => onPageChange(Math.max(1, current - 1))}
          disabled={current <= 1}
        >
          Précédent
        </Button>
        <Button
          variant="outline"
          size="sm"
          iconRight={<ChevronRight size={13} />}
          onClick={() => onPageChange(Math.min(safeTotal, current + 1))}
          disabled={current >= safeTotal}
        >
          Suivant
        </Button>
      </div>
    </div>
  )
}
