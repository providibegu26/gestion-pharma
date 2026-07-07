import { motion } from 'framer-motion'
import { Pill } from 'lucide-react'

export const PageLoader = () => (
  <div className="fixed inset-0 z-50 flex items-center justify-center bg-bg-base">
    <motion.div
      initial={{ opacity: 0, scale: 0.92 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.25 }}
      className="flex flex-col items-center gap-5"
    >
      <div className="relative">
        <div className="w-14 h-14 rounded-2xl bg-teal-50 ring-1 ring-inset ring-teal-200 flex items-center justify-center shadow-soft">
          <Pill size={22} className="text-teal-700" />
        </div>
        <svg
          className="absolute -inset-2 animate-spin"
          style={{ animationDuration: '1.2s' }}
          viewBox="0 0 64 64"
        >
          <circle cx="32" cy="32" r="30" fill="none" stroke="rgba(21,178,152,0.12)" strokeWidth="2" />
          <circle
            cx="32" cy="32" r="30"
            fill="none"
            stroke="rgba(21,178,152,0.9)"
            strokeWidth="2"
            strokeDasharray="188"
            strokeDashoffset="135"
            strokeLinecap="round"
            transform="rotate(-90 32 32)"
          />
        </svg>
      </div>
      <p className="font-medical text-xs text-slate-500 tracking-[0.25em] uppercase">
        Chargement
      </p>
    </motion.div>
  </div>
)
