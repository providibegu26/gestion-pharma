import { Link } from 'react-router-dom'
import { Pill, ShieldCheck, ShoppingBag } from 'lucide-react'
import { motion } from 'framer-motion'
import { Button } from '@/components/ui/Button'

/**
 * Page d'accueil publique.
 * Doit être la première page affichée avant tout parcours de connexion.
 */
export const AccueilPage = () => {
  return (
    <div className="min-h-screen bg-bg-base">
      <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8 py-10 lg:py-14">
        <header className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-teal-500 to-teal-700 flex items-center justify-center shadow-teal-sm">
              <Pill size={20} className="text-white" />
            </div>
            <div>
              <p className="font-display text-base font-bold text-slate-900">PharmaDigital</p>
              <p className="font-medical text-2xs text-slate-500 uppercase tracking-widest">Pharmacie Hospitalière</p>
            </div>
          </div>
        </header>

        <section className="mt-12 grid lg:grid-cols-2 gap-8 items-center">
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.35 }}
          >
            <h1 className="font-display text-4xl lg:text-5xl font-bold text-slate-900 tracking-tight">
              Bienvenue sur votre plateforme pharmacie.
            </h1>
            <p className="mt-4 text-slate-600 font-body max-w-xl">
              Choisissez votre espace pour accéder rapidement aux fonctionnalités adaptées
              à votre profil.
            </p>

            <div className="mt-8 flex flex-wrap gap-3">
              <Link to="/login-staff">
                <Button size="lg">
                  <ShieldCheck size={16} />
                  Espace professionnel
                </Button>
              </Link>
              <Link to="/connexion">
                <Button variant="outline" size="lg">
                  <ShoppingBag size={16} />
                  Espace client
                </Button>
              </Link>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.35, delay: 0.08 }}
            className="rounded-3xl overflow-hidden ring-1 ring-slate-200/70 shadow-glass-lg"
          >
            <img
              src="/images/african-american-pharmacist-providing-personalized-pharmacist-service-medication-guidance.jpg"
              alt="Accueil pharmacie"
              className="w-full h-[340px] object-cover"
            />
          </motion.div>
        </section>
      </div>
    </div>
  )
}

