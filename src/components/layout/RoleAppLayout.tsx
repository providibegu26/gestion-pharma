import { useState, Suspense } from 'react'
import { Outlet, useLocation } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { RoleSidebar, type NavItemDef } from './RoleSidebar'
import { Topbar } from './Topbar'

const pageVariants = {
  initial: { opacity: 0, y: 8 },
  animate: { opacity: 1, y: 0 },
  exit:    { opacity: 0, y: -4 },
}
const pageTransition = { duration: 0.28, ease: [0.22, 1, 0.36, 1] as const }

const InlineLoader = () => (
  <div className="flex items-center justify-center h-64">
    <div className="flex gap-1.5">
      {[0, 1, 2].map(i => (
        <div
          key={i}
          className="w-1.5 h-1.5 rounded-full bg-teal-500 animate-bounce"
          style={{ animationDelay: `${i * 0.12}s` }}
        />
      ))}
    </div>
  </div>
)

interface RoleAppLayoutProps {
  navItems: NavItemDef[]
  bottomItems?: NavItemDef[]
  brand?: { title: string; subtitle: string }
  promo?: { title: string; description: string } | null
  accent?: 'teal' | 'cyan' | 'sand' | 'violet' | 'emerald'
  theme?: 'client' | 'pro' | 'default'
  notificationsPath?: string
  maxWidth?: string
}

const themeBlobs = {
  client: (
    <>
      <div className="absolute -top-20 left-1/4 w-[640px] h-[420px] rounded-full bg-emerald-200/25 blur-[140px]" />
      <div className="absolute bottom-0 right-1/4 w-[520px] h-[340px] rounded-full bg-teal-100/30 blur-[140px]" />
      <div className="absolute top-1/3 right-0 w-[400px] h-[280px] rounded-full bg-emerald-100/20 blur-[120px]" />
    </>
  ),
  pro: (
    <>
      <div className="absolute -top-20 left-1/4 w-[640px] h-[420px] rounded-full bg-teal-200/25 blur-[140px]" />
      <div className="absolute bottom-0 right-1/4 w-[520px] h-[340px] rounded-full bg-cyan-100/25 blur-[140px]" />
      <div className="absolute top-1/3 right-0 w-[400px] h-[280px] rounded-full bg-teal-100/30 blur-[120px]" />
    </>
  ),
  default: (
    <>
      <div className="absolute -top-20 left-1/4 w-[640px] h-[420px] rounded-full bg-teal-200/20 blur-[140px]" />
      <div className="absolute bottom-0 right-1/4 w-[520px] h-[340px] rounded-full bg-sand-200/30 blur-[140px]" />
      <div className="absolute top-1/3 right-0 w-[400px] h-[280px] rounded-full bg-cyan-100/30 blur-[120px]" />
    </>
  ),
}

export const RoleAppLayout = ({
  navItems,
  bottomItems,
  brand,
  promo,
  accent = 'teal',
  theme = 'default',
  notificationsPath,
  maxWidth = '1600px',
}: RoleAppLayoutProps) => {
  const [collapsed, setCollapsed] = useState(false)
  const location = useLocation()

  return (
    <div className="flex h-screen w-full overflow-hidden bg-bg-base">
      <div className="pointer-events-none fixed inset-0 z-0" aria-hidden>
        {themeBlobs[theme]}
      </div>

      <RoleSidebar
        collapsed={collapsed}
        setCollapsed={setCollapsed}
        navItems={navItems}
        bottomItems={bottomItems}
        brand={brand}
        promo={promo}
        accent={accent}
      />

      <div className="relative z-10 flex flex-1 flex-col overflow-hidden">
        <Topbar notificationsPath={notificationsPath} />
        <main className="flex-1 overflow-y-auto">
          <AnimatePresence mode="wait" initial={false}>
            <motion.div
              key={location.pathname}
              variants={pageVariants}
              initial="initial"
              animate="animate"
              exit="exit"
              transition={pageTransition}
              className="min-h-full px-6 py-6 lg:px-8 lg:py-8 mx-auto w-full"
              style={{ maxWidth }}
            >
              <Suspense fallback={<InlineLoader />}>
                <Outlet />
              </Suspense>
            </motion.div>
          </AnimatePresence>
        </main>
      </div>
    </div>
  )
}
