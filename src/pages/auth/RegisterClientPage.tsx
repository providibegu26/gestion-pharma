import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Mail, Lock, User, Eye, EyeOff, ArrowRight, ShieldCheck, Check, Sparkles, Heart } from 'lucide-react'
import { useAuth, useApiError } from '@/adapters/react'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { toast } from '@/components/ui/Toast'
import { HowItWorksStrip } from '@/components/ui/HowItWorksStrip'

export const RegisterClientPage = () => {
  const navigate = useNavigate()
  const { register, login, homeForRole } = useAuth()
  const { getErrorMessage } = useApiError()

  const [form, setForm] = useState({
    nom: '', prenom: '', email: '', motDePasse: '',
  })
  const [showPw, setShowPw] = useState(false)
  const [loading, setLoading] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})

  const set = (field: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm((f) => ({ ...f, [field]: e.target.value }))

  const validate = () => {
    const e: Record<string, string> = {}
    if (!form.nom.trim())    e.nom = 'Nom requis'
    if (!form.prenom.trim()) e.prenom = 'Prénom requis'
    if (!form.email)         e.email = 'Email requis'
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) e.email = 'Email invalide'
    if (!form.motDePasse) e.motDePasse = 'Mot de passe requis'
    else if (form.motDePasse.length < 8) e.motDePasse = 'Minimum 8 caractères'
    return e
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    const v = validate()
    if (Object.keys(v).length) { setErrors(v); return }
    setLoading(true)
    try {
      await register(form)
      // Login automatique après inscription pour une UX fluide
      try { await login(form.email, form.motDePasse) } catch { /* ignore */ }
      toast.success(`Compte créé, bienvenue ${form.prenom} !`)
      navigate(homeForRole())
    } catch (err) {
      toast.error(getErrorMessage(err))
    } finally {
      setLoading(false)
    }
  }

  const pwStrength = (() => {
    const p = form.motDePasse
    if (!p) return 0
    let s = 0
    if (p.length >= 8) s++
    if (/[A-Z]/.test(p)) s++
    if (/[0-9]/.test(p)) s++
    if (/[^A-Za-z0-9]/.test(p)) s++
    return s
  })()

  const strengthLabel = ['', 'Faible', 'Moyen', 'Bon', 'Fort'][pwStrength]
  const strengthColor = ['', 'bg-rose-400', 'bg-amber-400', 'bg-teal-400', 'bg-emerald-500'][pwStrength]

  return (
    <div className="relative mx-auto max-w-6xl px-4 sm:px-6 lg:px-8 py-8 lg:py-16">
      <motion.div
        initial={{ opacity: 0, y: -8 }}
        animate={{ opacity: 1, y: 0 }}
        className="lg:hidden mb-8 relative overflow-hidden rounded-2xl bg-gradient-to-br from-emerald-600 to-teal-700 p-5 text-white shadow-card"
      >
        <p className="font-display text-xl font-bold">Créez votre compte gratuit</p>
        <p className="mt-1 font-body text-sm text-white/85">Inscription en moins de 30 secondes.</p>
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
            <Sparkles size={11} />
            Compte client gratuit
          </span>

          <h1 className="font-display text-4xl lg:text-5xl font-bold text-slate-900 tracking-tightest leading-[1.05]">
            Rejoignez{' '}
            <span className="text-gradient-medical">PharmaDigital.</span>
          </h1>
          <p className="font-body text-sm text-slate-500 mt-3 max-w-sm leading-relaxed">
            Créez votre compte en moins de 30 secondes et commandez vos médicaments en ligne.
          </p>

          <form onSubmit={handleSubmit} className="mt-7 space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <Input
                label="Prénom"
                value={form.prenom}
                onChange={set('prenom')}
                placeholder="Patrice"
                icon={<User size={15} />}
                error={errors.prenom}
                autoComplete="given-name"
              />
              <Input
                label="Nom"
                value={form.nom}
                onChange={set('nom')}
                placeholder="Lumumba"
                error={errors.nom}
                autoComplete="family-name"
              />
            </div>
            <Input
              label="Adresse email"
              type="email"
              value={form.email}
              onChange={set('email')}
              placeholder="vous@email.com"
              icon={<Mail size={15} />}
              error={errors.email}
              autoComplete="email"
            />
            <Input
              label="Mot de passe"
              type={showPw ? 'text' : 'password'}
              value={form.motDePasse}
              onChange={set('motDePasse')}
              placeholder="Minimum 8 caractères"
              icon={<Lock size={15} />}
              iconRight={
                <button type="button" onClick={() => setShowPw(!showPw)} aria-label="Afficher le mot de passe">
                  {showPw ? <EyeOff size={15} /> : <Eye size={15} />}
                </button>
              }
              error={errors.motDePasse}
              autoComplete="new-password"
            />
            {form.motDePasse && (
              <div className="space-y-1.5">
                <div className="flex gap-1">
                  {[1, 2, 3, 4].map((i) => (
                    <div
                      key={i}
                      className={`h-1 flex-1 rounded-full transition-colors ${i <= pwStrength ? strengthColor : 'bg-slate-200'}`}
                    />
                  ))}
                </div>
                <p className="font-body text-2xs text-slate-500">
                  Force du mot de passe : <span className="font-semibold text-slate-700">{strengthLabel}</span>
                </p>
              </div>
            )}

            <div className="flex items-start gap-2 pt-2">
              <Check size={13} className="mt-0.5 flex-shrink-0 text-teal-600" />
              <p className="font-body text-2xs text-slate-500 leading-relaxed">
                En créant un compte, vous acceptez nos conditions d'utilisation
                et notre politique de confidentialité.
              </p>
            </div>

            <Button
              type="submit"
              size="lg"
              loading={loading}
              className="w-full mt-2"
              iconRight={!loading && <ArrowRight size={16} />}
            >
              Créer mon compte
            </Button>
          </form>

          <p className="mt-6 text-center text-sm text-slate-600 font-body">
            Déjà inscrit ?{' '}
            <Link to="/connexion" className="text-teal-700 hover:text-teal-800 font-semibold transition-colors">
              Se connecter
            </Link>
          </p>
          <p className="mt-2 text-center text-2xs text-slate-400 font-body">
            <Link to="/login-staff" className="hover:text-slate-600 inline-flex items-center gap-1">
              <ShieldCheck size={10} /> Membre du personnel ?
            </Link>
          </p>

          <div className="mt-8 lg:hidden">
            <HowItWorksStrip variant="client" />
          </div>
        </motion.div>

        {/* Visual */}
        <motion.div
          initial={{ opacity: 0, x: 16 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1], delay: 0.1 }}
          className="hidden lg:block relative rounded-3xl overflow-hidden shadow-glass-lg aspect-[4/5] ring-1 ring-slate-200/70"
        >
          <img
            src="/images/african-american-pharmacist-providing-personalized-pharmacist-service-medication-guidance.jpg"
            alt="Inscription client"
            className="absolute inset-0 h-full w-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-tr from-slate-950/70 via-slate-900/20 to-transparent" />
          <div className="absolute inset-x-0 bottom-0 p-8">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-white/15 backdrop-blur px-2.5 py-1 font-medical text-2xs font-semibold text-white uppercase tracking-widest">
              <Heart size={11} />
              Service personnalisé
            </span>
            <h2 className="mt-3 font-display text-3xl font-bold text-white tracking-tight">
              Vos médicaments, votre santé, notre priorité.
            </h2>
            <p className="mt-2 font-body text-sm text-white/80 max-w-sm">
              Profitez d'un service client premium et d'une équipe de pharmaciens disponibles pour vous accompagner.
            </p>
          </div>
        </motion.div>
      </div>
    </div>
  )
}
