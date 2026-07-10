import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Mail, Lock, Eye, EyeOff, ArrowRight, Heart, ShieldCheck, ShoppingBag, Zap } from 'lucide-react'
import { useAuth, useApiError } from '@/adapters/react'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { toast } from '@/components/ui/Toast'
import { HowItWorksStrip } from '@/components/ui/HowItWorksStrip'
import type { User } from '@/core'

const DEMO_CLIENT: User = {
  id: 'demo-client', nom: 'Demo', prenom: 'Client', email: 'client@pharma.cd',
  role: 'CLIENT', createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(),
}

export const LoginClientPage = () => {
  const navigate = useNavigate()
  const { login, loginAs, homeForRole, signOut } = useAuth()
  const { getErrorMessage } = useApiError()

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPw, setShowPw] = useState(false)
  const [loading, setLoading] = useState(false)
  const [errors, setErrors] = useState<{ email?: string; password?: string }>({})

  const validate = () => {
    const e: typeof errors = {}
    if (!email) e.email = 'Email requis'
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) e.email = 'Email invalide'
    if (!password) e.password = 'Mot de passe requis'
    return e
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    const v = validate()
    if (Object.keys(v).length) { setErrors(v); return }
    setLoading(true)
    try {
      const u = await login(email, password)
      if (u.role !== 'CLIENT') {
        await signOut()
        toast.error('Compte professionnel détecté. Utilisez la connexion personnel.')
        navigate('/login-staff')
        return
      }
      toast.success(`Bonjour ${u.prenom} !`)
      navigate(homeForRole())
    } catch (err) {
      toast.error(getErrorMessage(err))
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="relative mx-auto max-w-6xl px-4 sm:px-6 lg:px-8 py-8 lg:py-16">
      {/* Bandeau mobile */}
      <motion.div
        initial={{ opacity: 0, y: -8 }}
        animate={{ opacity: 1, y: 0 }}
        className="lg:hidden mb-8 relative overflow-hidden rounded-2xl bg-gradient-to-br from-emerald-600 to-teal-700 p-5 text-white shadow-card"
      >
        <p className="font-display text-xl font-bold">Vos médicaments, à portée de clic.</p>
        <p className="mt-1 font-body text-sm text-white/85">Commandez en ligne, retirez en pharmacie.</p>
      </motion.div>

      <div className="grid lg:grid-cols-2 gap-10 lg:gap-12 items-center">
        {/* Form */}
        <motion.div
          initial={{ opacity: 0, x: -16 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
          className="relative w-full max-w-md mx-auto lg:mx-0"
        >
          <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 border border-emerald-200/70 px-2.5 py-1 mb-4 font-medical text-2xs font-semibold text-emerald-700 uppercase tracking-wider">
            <Heart size={11} />
            Espace Client
          </span>

          <h1 className="font-display text-4xl lg:text-5xl font-bold text-slate-900 tracking-tightest leading-[1.05]">
            Bon retour parmi nous, <span className="text-gradient-medical">connectez-vous.</span>
          </h1>
          <p className="font-body text-sm text-slate-500 mt-3 max-w-sm leading-relaxed">
            Accédez à votre espace pour passer vos commandes et suivre l'historique de vos achats.
          </p>

          <form onSubmit={handleSubmit} className="mt-7 space-y-4">
            <Input
              label="Adresse email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="vous@email.com"
              icon={<Mail size={15} />}
              error={errors.email}
              autoComplete="email"
            />
            <Input
              label="Mot de passe"
              type={showPw ? 'text' : 'password'}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              icon={<Lock size={15} />}
              iconRight={
                <button type="button" onClick={() => setShowPw(!showPw)} aria-label="Afficher le mot de passe">
                  {showPw ? <EyeOff size={15} /> : <Eye size={15} />}
                </button>
              }
              error={errors.password}
              autoComplete="current-password"
            />

            <Button
              type="submit"
              size="lg"
              loading={loading}
              className="w-full mt-2"
              iconRight={!loading && <ArrowRight size={16} />}
            >
              Se connecter
            </Button>
          </form>

          {/* Accès rapide test */}
          <button
            type="button"
            onClick={() => { loginAs(DEMO_CLIENT); navigate(homeForRole()) }}
            className="mt-4 w-full flex items-center justify-center gap-2 rounded-xl border border-dashed border-slate-200 py-2.5 text-xs font-semibold text-slate-500 hover:border-teal-300 hover:text-teal-700 transition-colors"
          >
            <Zap size={12} /> Accès rapide — Demo Client (test local)
          </button>

          <p className="mt-4 text-center text-sm text-slate-600 font-body">
            Nouveau client ?{' '}
            <Link to="/inscription" className="text-teal-700 hover:text-teal-800 font-semibold transition-colors">
              Créer un compte
            </Link>
          </p>
          <p className="mt-2 text-center text-2xs text-slate-400 font-body">
            <Link to="/login-staff" className="hover:text-slate-600 inline-flex items-center gap-1">
              <ShieldCheck size={10} /> Vous êtes un membre du personnel ?
            </Link>
          </p>

          <div className="mt-8 lg:hidden">
            <p className="font-medical text-2xs font-semibold text-slate-400 uppercase tracking-widest mb-3">
              Comment ça marche
            </p>
            <HowItWorksStrip variant="client" />
          </div>
        </motion.div>

        {/* Visual card */}
        <motion.div
          initial={{ opacity: 0, x: 16 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1], delay: 0.1 }}
          className="hidden lg:block relative rounded-3xl overflow-hidden shadow-glass-lg aspect-[4/5] ring-1 ring-slate-200/70"
        >
          <img
            src="/images/hands-african-american-woman-show-pills.jpg"
            alt="Accès client"
            className="absolute inset-0 h-full w-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-tr from-slate-950/70 via-slate-900/20 to-transparent" />
          <div className="absolute inset-x-0 bottom-0 p-8">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-white/15 backdrop-blur px-2.5 py-1 font-medical text-2xs font-semibold text-white uppercase tracking-widest">
              <ShoppingBag size={11} />
              Commande en ligne
            </span>
            <h2 className="mt-3 font-display text-3xl font-bold text-white tracking-tight">
              Vos médicaments, à portée de clic.
            </h2>
            <p className="mt-2 font-body text-sm text-white/80 max-w-sm">
              Parcourez le catalogue, passez votre commande et laissez nos pharmaciens prendre le relais.
            </p>
          </div>
        </motion.div>
      </div>
    </div>
  )
}
