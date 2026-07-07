import { motion } from 'framer-motion'
import { User } from 'lucide-react'
import { cn } from '@/utils/cn'
import { getStatutFileColor, getStatutFileLabel } from '@/utils/helpers'
import type { TicketFile } from '@/core'

interface QueueTicketProps {
  ticket: TicketFile
  highlight?: boolean
  onClick?: () => void
}

export const QueueTicket = ({ ticket, highlight, onClick }: QueueTicketProps) => (
  <motion.div
    layout
    initial={{ opacity: 0, scale: 0.95 }}
    animate={{ opacity: 1, scale: 1 }}
    className={cn(
      'rounded-2xl border p-4 transition-all',
      highlight
        ? 'border-teal-300 bg-teal-50/60 shadow-teal-sm'
        : 'border-slate-200/80 bg-white shadow-soft hover:shadow-card',
      onClick && 'cursor-pointer hover:border-teal-200',
    )}
    onClick={onClick}
  >
    <div className="flex items-center justify-between gap-3">
      <div className="flex items-center gap-3 min-w-0">
        <div className={cn(
          'flex h-12 w-12 items-center justify-center rounded-xl font-mono text-lg font-bold',
          highlight ? 'bg-teal-600 text-white' : 'bg-slate-100 text-slate-700',
        )}>
          {ticket.numero}
        </div>
        <div className="min-w-0">
          <p className="font-body text-sm font-semibold text-slate-900 truncate">{ticket.clientNom ?? 'Client'}</p>
          {ticket.commandeId && (
            <p className="font-mono text-2xs text-slate-500">Cmd #{ticket.commandeId.slice(-6).toUpperCase()}</p>
          )}
        </div>
      </div>
      <span className={cn(
        'inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-2xs font-medical font-semibold flex-shrink-0',
        getStatutFileColor(ticket.statut),
      )}>
        {getStatutFileLabel(ticket.statut)}
      </span>
    </div>
  </motion.div>
)

interface CurrentClientPanelProps {
  ticket: TicketFile | null
  label: string
  emptyMessage: string
  accent?: 'teal' | 'amber' | 'emerald'
}

const accentMap = {
  teal: 'from-teal-500 to-teal-700 border-teal-200',
  amber: 'from-amber-400 to-amber-600 border-amber-200',
  emerald: 'from-emerald-500 to-emerald-700 border-emerald-200',
}

export const CurrentClientPanel = ({ ticket, label, emptyMessage, accent = 'teal' }: CurrentClientPanelProps) => (
  <div className={cn('rounded-2xl border bg-gradient-to-br p-6 text-center', accentMap[accent], 'bg-opacity-10')}>
    <p className="font-medical text-2xs text-slate-500 uppercase tracking-widest">{label}</p>
    {ticket ? (
      <>
        <p className="font-mono text-6xl font-bold text-slate-900 mt-2">#{ticket.numero}</p>
        <div className="flex items-center justify-center gap-2 mt-3">
          <User size={14} className="text-slate-500" />
          <p className="font-display text-base font-bold text-slate-800">{ticket.clientNom}</p>
        </div>
        <p className="font-mono text-2xs text-slate-500 mt-1">
          {ticket.commandeId
            ? `Commande #${ticket.commandeId.slice(-6).toUpperCase()}`
            : `Ticket #${ticket.numero}`}
        </p>
      </>
    ) : (
      <p className="font-body text-sm text-slate-500 mt-6 py-8">{emptyMessage}</p>
    )}
  </div>
)
