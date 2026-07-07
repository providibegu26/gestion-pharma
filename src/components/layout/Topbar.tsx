import { Bell, Search, Menu, Command } from 'lucide-react'
import { motion } from 'framer-motion'
import { useAuth } from '@/adapters/react'
import { useLocation, Link } from 'react-router-dom'

interface TopbarProps {
  onMenuToggle?: () => void
  titles?: Record<string, string>
  notificationsPath?: string
}

const defaultTitles: Record<string, string> = {
  '/admin':                          'Centre de contrôle',
  '/professionnel':                  'Espace professionnel',
  '/professionnel/tableau-de-bord':  'Tableau de bord',
  '/professionnel/produits':         'Produits',
  '/professionnel/utilisateurs':     'Personnel',
  '/professionnel/roles':            'Gestion des rôles',
  '/professionnel/commandes':        'Commandes clients',
  '/professionnel/file-attente':     "File d'attente",
  '/admin/utilisateurs':             'Personnel',
  '/admin/commandes':                'Commandes clients',
  '/client':                         'Mon espace',
  '/client/tableau-de-bord':         'Tableau de bord',
  '/client/produits':                'Produits',
  '/client/commandes':               'Mes commandes',
}

export const Topbar = ({ onMenuToggle, titles, notificationsPath }: TopbarProps) => {
  const { user } = useAuth()
  const location = useLocation()
  const map = { ...defaultTitles, ...titles }
  const title = map[location.pathname] ?? 'PharmaDigital'

  const now = new Date()
  const greeting = now.getHours() < 12 ? 'Bonjour' : now.getHours() < 18 ? 'Bon après-midi' : 'Bonsoir'

  return (
    <motion.header
      initial={{ opacity: 0, y: -6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35 }}
      className="relative z-10 flex h-16 items-center justify-between gap-4 border-b border-slate-200/80 bg-white/75 backdrop-blur-xl px-6 flex-shrink-0"
    >
      <div className="flex items-center gap-3 min-w-0">
        {onMenuToggle && (
          <button
            onClick={onMenuToggle}
            aria-label="Menu"
            className="rounded-lg p-2 text-slate-500 hover:bg-slate-100 hover:text-slate-900 transition-colors lg:hidden"
          >
            <Menu size={18} />
          </button>
        )}
        <div className="min-w-0">
          <h2 className="font-display text-base font-bold text-slate-900 tracking-tight leading-none truncate">
            {title}
          </h2>
          <p className="font-body text-xs text-slate-500 mt-1 truncate">
            {greeting}{user?.prenom ? `, ${user.prenom}` : ''} — voici votre espace
          </p>
        </div>
      </div>

      <div className="flex items-center gap-2.5">
        <div className="hidden md:flex items-center gap-2 rounded-xl border border-slate-200/70 bg-white px-3 h-10 w-72 shadow-soft transition-shadow focus-within:shadow-card focus-within:border-teal-300">
          <Search size={14} className="text-slate-400 flex-shrink-0" />
          <input
            type="text"
            placeholder="Rechercher…"
            className="flex-1 bg-transparent text-sm font-body text-slate-900 placeholder:text-slate-400 focus:outline-none"
          />
          <kbd className="hidden lg:inline-flex items-center gap-1 rounded-md border border-slate-200 bg-slate-50 px-1.5 h-5 font-mono text-2xs text-slate-500">
            <Command size={9} /> K
          </kbd>
        </div>

        {notificationsPath && (
          <Link
            to={notificationsPath}
            aria-label="Notifications"
            className="relative rounded-xl border border-slate-200/70 bg-white p-2.5 text-slate-500 hover:text-teal-700 hover:border-teal-200 transition-colors shadow-soft"
          >
            <Bell size={16} />
            <span className="absolute top-1.5 right-1.5 h-2 w-2 rounded-full bg-teal-500 ring-2 ring-white" />
          </Link>
        )}

        <div className="hidden lg:flex flex-col items-end pl-2 border-l border-slate-200/70 ml-1">
          <p className="font-mono text-xs font-semibold text-slate-700 leading-none">
            {now.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
          </p>
          <p className="font-medical text-2xs text-slate-500 mt-1 capitalize">
            {now.toLocaleDateString('fr-FR', { weekday: 'short', day: 'numeric', month: 'short' })}
          </p>
        </div>
      </div>
    </motion.header>
  )
}
