import { NavLink, useLocation } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { Pill, LogOut, ChevronLeft, ChevronRight, Sparkles } from 'lucide-react'
import { cn } from '@/utils/cn'
import { useAuth } from '@/adapters/react'
import { getInitials, getRoleLabel } from '@/utils/helpers'

export interface NavItemDef {
  to: string
  icon: React.ReactNode
  label: string
  badge?: number
  section?: string
  exact?: boolean
}

interface RoleSidebarProps {
  collapsed: boolean
  setCollapsed: (v: boolean) => void
  navItems: NavItemDef[]
  bottomItems?: NavItemDef[]
  brand?: { title: string; subtitle: string }
  promo?: { title: string; description: string } | null
  accent?: 'teal' | 'cyan' | 'sand' | 'violet' | 'emerald'
}

const accentGradients = {
  teal:    'from-teal-500 to-teal-700',
  cyan:    'from-cyan-500 to-cyan-700',
  sand:    'from-sand-500 to-sand-700',
  violet:  'from-violet-500 to-violet-700',
  emerald: 'from-emerald-500 to-emerald-700',
}

export const RoleSidebar = ({
  collapsed, setCollapsed,
  navItems, bottomItems = [],
  brand = { title: 'PharmaDigital', subtitle: 'Pharmacie Hospitalière' },
  promo = null,
  accent = 'teal',
}: RoleSidebarProps) => {
  const { user, signOut } = useAuth()

  const grouped = navItems.reduce<Record<string, NavItemDef[]>>((acc, item) => {
    const section = item.section ?? '—'
    if (!acc[section]) acc[section] = []
    acc[section].push(item)
    return acc
  }, {})

  return (
    <motion.aside
      animate={{ width: collapsed ? 72 : 264 }}
      transition={{ duration: 0.32, ease: [0.22, 1, 0.36, 1] }}
      className="relative z-20 flex flex-col h-full border-r border-slate-200/80 bg-white/85 backdrop-blur-xl overflow-hidden flex-shrink-0 shadow-soft"
    >
      {/* Logo */}
      <div className="flex items-center gap-3 px-4 h-16 border-b border-slate-100">
        <div className={cn(
          'flex-shrink-0 w-10 h-10 rounded-xl bg-gradient-to-br flex items-center justify-center shadow-teal-sm ring-1 ring-black/5',
          accentGradients[accent]
        )}>
          <Pill size={20} className="text-white" strokeWidth={2.2} />
        </div>
        <AnimatePresence>
          {!collapsed && (
            <motion.div
              initial={{ opacity: 0, x: -8 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -8 }}
              transition={{ duration: 0.2 }}
              className="overflow-hidden"
            >
              <p className="font-display text-base font-bold text-slate-900 leading-none tracking-tight">
                {brand.title}
              </p>
              <p className="font-medical text-2xs text-slate-500 mt-1 uppercase tracking-widest">
                {brand.subtitle}
              </p>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto overflow-x-hidden py-4 px-3 scrollbar-none">
        {Object.entries(grouped).map(([section, items]) => (
          <div key={section} className="mb-5">
            <AnimatePresence>
              {!collapsed && section !== '—' && (
                <motion.p
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.15 }}
                  className="px-3 mb-1.5 font-medical text-2xs font-semibold text-slate-400 uppercase tracking-[0.12em]"
                >
                  {section}
                </motion.p>
              )}
            </AnimatePresence>
            <div className="space-y-0.5">
              {items.map((item) => (
                <SidebarItem key={item.to} item={item} collapsed={collapsed} />
              ))}
            </div>
          </div>
        ))}

        {bottomItems.length > 0 && (
          <>
            <div className="my-4 border-t border-slate-100" />
            <div className="space-y-0.5">
              {bottomItems.map((item) => (
                <SidebarItem key={item.to} item={item} collapsed={collapsed} />
              ))}
            </div>
          </>
        )}
      </nav>

      {/* Promo card */}
      {promo && (
        <AnimatePresence>
          {!collapsed && (
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className={cn(
                'mx-3 mb-3 rounded-xl p-3 text-white shadow-teal-sm relative overflow-hidden',
                'bg-gradient-to-br', accentGradients[accent]
              )}
            >
              <div className="absolute -top-2 -right-2 w-16 h-16 rounded-full bg-white/10 blur-xl" />
              <div className="relative flex items-center gap-2 mb-1">
                <Sparkles size={13} className="text-white/90" />
                <p className="font-display text-xs font-semibold">{promo.title}</p>
              </div>
              <p className="relative font-body text-2xs text-white/80 leading-snug">
                {promo.description}
              </p>
            </motion.div>
          )}
        </AnimatePresence>
      )}

      {/* User */}
      <div className="border-t border-slate-100 px-3 py-3">
        <div className={cn(
          'flex items-center gap-3 rounded-xl p-2 transition-colors hover:bg-slate-50',
          collapsed && 'justify-center'
        )}>
          <div className="flex-shrink-0 w-9 h-9 rounded-lg bg-teal-50 ring-1 ring-inset ring-teal-200 flex items-center justify-center">
            <span className="font-mono text-xs font-bold text-teal-700">
              {user ? getInitials(user.nom, user.prenom) : '?'}
            </span>
          </div>
          <AnimatePresence>
            {!collapsed && user && (
              <motion.div
                initial={{ opacity: 0, x: -6 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -6 }}
                transition={{ duration: 0.18 }}
                className="flex-1 min-w-0 overflow-hidden"
              >
                <p className="text-xs font-semibold text-slate-900 font-body truncate">
                  {user.prenom} {user.nom}
                </p>
                <p className="font-medical text-2xs text-slate-500 truncate">
                  {getRoleLabel(user.role)}
                </p>
              </motion.div>
            )}
          </AnimatePresence>
          {!collapsed && (
            <button
              onClick={signOut}
              className="flex-shrink-0 p-1.5 rounded-lg text-slate-400 hover:bg-rose-50 hover:text-rose-600 transition-colors"
              aria-label="Se déconnecter"
              title="Se déconnecter"
            >
              <LogOut size={14} />
            </button>
          )}
        </div>
      </div>

      <button
        onClick={() => setCollapsed(!collapsed)}
        aria-label={collapsed ? 'Déplier' : 'Replier'}
        className="absolute -right-3 top-20 z-10 flex h-6 w-6 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-500 shadow-soft hover:border-teal-300 hover:text-teal-600 transition-colors"
      >
        {collapsed ? <ChevronRight size={12} /> : <ChevronLeft size={12} />}
      </button>
    </motion.aside>
  )
}

const SidebarItem = ({ item, collapsed }: { item: NavItemDef; collapsed: boolean }) => {
  const location = useLocation()
  const isActive = item.exact
    ? location.pathname === item.to
    : location.pathname === item.to || (item.to !== '/' && location.pathname.startsWith(item.to + '/'))

  return (
    <NavLink
      to={item.to}
      className={cn(
        'group relative flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-body font-medium transition-colors duration-200',
        collapsed && 'justify-center px-2',
        isActive ? 'text-teal-700' : 'text-slate-600 hover:text-slate-900'
      )}
    >
      {isActive && (
        <motion.div
          layoutId="sidebar-active"
          className="absolute inset-0 rounded-xl bg-teal-50 ring-1 ring-inset ring-teal-100"
          transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
        />
      )}
      {!isActive && (
        <span className="absolute inset-0 rounded-xl opacity-0 group-hover:opacity-100 bg-slate-50 transition-opacity duration-200" />
      )}
      <span className={cn('relative flex-shrink-0 transition-colors',
        isActive ? 'text-teal-600' : 'text-slate-500 group-hover:text-slate-700'
      )}>
        {item.icon}
      </span>
      <AnimatePresence>
        {!collapsed && (
          <motion.span
            initial={{ opacity: 0, x: -4 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -4 }}
            transition={{ duration: 0.15 }}
            className="relative flex-1 truncate"
          >
            {item.label}
          </motion.span>
        )}
      </AnimatePresence>
      {item.badge && item.badge > 0 && (
        <span className={cn(
          'flex-shrink-0 rounded-full bg-rose-500 text-white text-2xs font-mono font-bold flex items-center justify-center min-w-[18px] h-[18px] px-1',
          collapsed ? 'absolute -top-1 -right-1' : 'relative'
        )}>
          {item.badge}
        </span>
      )}
      {collapsed && (
        <div className="pointer-events-none absolute left-full ml-3 z-50 whitespace-nowrap rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs text-slate-800 font-medium opacity-0 group-hover:opacity-100 transition-opacity shadow-card">
          {item.label}
        </div>
      )}
    </NavLink>
  )
}
