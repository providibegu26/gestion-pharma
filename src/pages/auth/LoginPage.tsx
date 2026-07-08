import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Mail, Lock, Eye, EyeOff, Pill, ArrowRight, ShieldCheck, Sparkles, Activity, Zap, ChevronDown, ChevronUp } from 'lucide-react'
import { useAuth, useApiError } from '@/adapters/react'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { toast } from '@/components/ui/Toast'
import type { User } from '@/core'

// ─── Comptes de test rapide (mode démo / développement local) ────────────────
const DEMO_USERS: { label: string; color: string; user: User }[] = [
  {
    label: 'Admin',
    color: 'bg-violet-100 text-violet-800 border-violet-200 hover:bg-violet-200',
    user: {
      id: 'demo-admin', nom: 'Demo', prenom: 'Admin', email: 'admin@pharma.cd',
      role: 'ADMIN', createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(),
    },
  },
  {
    label: 'Pharmacien',
    color: 'bg-teal-100 text-teal-800 border-teal-200 hover:bg-teal-200',
    user: {
      id: 'demo-pharma', nom: 'Demo', prenom: 'Pharmacien', email: 'pharma@pharma.cd',
      role: 'PHARMACIEN', createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(),
    },
  },
  {
    label: 'Caissier',
    color: 'bg-sand-100 text-sand-800 border-sand-200 hover:bg-amber-100',
    user: {
      id: 'demo-caissier', nom: 'Demo', prenom: 'Caissier', email: 'caissier@pharma.cd',
      role: 'CAISSIER', createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(),
    },
  },
]

const imgPharmacist = '/images/african-american-pharmacist-working-drugstore-hospital-pharmacy-african-healthcare-stethoscope-black-woman-doctor.jpg'

export const LoginPage = () => {
  const navigate = useNavigate()
  const { login, loginAs, homeForRole, signOut } = useAuth()
  const { getErrorMessage } = useApiError()
  const [showDemo, setShowDemo] = useState(false)

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPw, setShowPw] = useState(false)
  const [loading, setLoading] = useState(false)
  const [errors, setErrors] = useState<{ email?: string; password?: string }>({})
  const [imgLoaded, setImgLoaded] = useState(false)

  // Préchargement de l'image hero dès le montage (sans bloquer le rendu)
  useEffect(() => {
    const img = new Image()
    // Hint au navigateur via attribut DOM (fetchpriority en HTML)
    img.setAttribute('fetchpriority', 'high')
    img.decoding = 'async'
    img.onload = () => setImgLoaded(true)
    img.src = imgPharmacist
    // Si l'image est déjà en cache, onload peut ne pas se déclencher
    if (img.complete) setImgLoaded(true)
  }, [])

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
      const user = await login(email, password)
      if (user.role === 'CLIENT') {
        await signOut()
        toast.error('Cet espace est réservé aux professionnels. Utilisez la connexion client.')
        navigate('/connexion')
        return
      }
      if (user.role === 'PREPARATEUR') {
        await signOut()
        toast.error('Le rôle préparateur n’est pas activé sur cette interface.')
        return
      }
      toast.success(`Bienvenue ${user.prenom} !`)
      navigate(homeForRole())
    } catch (err) {
      toast.error(getErrorMessage(err))
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex bg-bg-base overflow-hidden">
      {/* ═══════════════════════════════════════════════════════════════
          PANEL GAUCHE — formulaire (s'affiche immédiatement)
          ═══════════════════════════════════════════════════════════════ */}
      <div className="flex-1 flex flex-col p-8 lg:p-12 max-w-2xl relative">
        {/* Halos ambiants subtils côté gauche */}
        <div className="pointer-events-none absolute inset-0 -z-10" aria-hidden>
          <div className="absolute -top-20 -left-20 w-[420px] h-[300px] rounded-full bg-teal-200/15 blur-[120px]" />
          <div className="absolute bottom-0 right-0 w-[320px] h-[260px] rounded-full bg-sand-200/20 blur-[110px]" />
        </div>

        {/* Logo — apparaît instantanément */}
        <motion.div
          initial={{ opacity: 0, y: -6 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.25 }}
          className="flex items-center gap-3"
        >
          <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-teal-500 to-teal-700 flex items-center justify-center shadow-teal-sm ring-1 ring-teal-700/20">
            <Pill size={21} className="text-white" strokeWidth={2.2} />
          </div>
          <div>
            <p className="font-display text-base font-bold text-slate-900 tracking-tight">
              PharmaDigital
            </p>
            <p className="font-medical text-2xs text-slate-500 mt-0.5 uppercase tracking-widest">
              Pharmacie Hospitalière
            </p>
          </div>
        </motion.div>

        {/* Form */}
        <div className="flex-1 flex items-center justify-center py-12">
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
            className="w-full max-w-md"
          >
            <div className="mb-8">
              <span className="inline-flex items-center gap-1.5 rounded-full bg-teal-50 border border-teal-200/70 px-2.5 py-1 mb-4 font-medical text-2xs font-semibold text-teal-700 uppercase tracking-wider">
                <ShieldCheck size={11} />
                Espace personnel
              </span>
              <h1 className="font-display text-4xl font-bold text-slate-900 tracking-tightest leading-[1.05]">
                Connexion <span className="text-gradient-teal">personnel.</span>
              </h1>
              <p className="font-body text-sm text-slate-500 mt-3 max-w-sm leading-relaxed">
                Espace réservé aux professionnels de la pharmacie.
                Vos identifiants vous sont fournis lors de la création du compte.
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <Input
                label="Adresse email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="vous@pharmacie.cd"
                icon={<Mail size={15} />}
                error={errors.email}
                autoComplete="email"
                autoFocus
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

              <div className="flex items-center justify-between pt-1">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    className="w-4 h-4 rounded border-slate-300 text-teal-600 focus:ring-teal-500/20"
                  />
                  <span className="font-body text-xs text-slate-600">Se souvenir de moi</span>
                </label>
                <a href="#" className="font-body text-xs text-teal-700 hover:text-teal-800 font-medium">
                  Mot de passe oublié ?
                </a>
              </div>

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

            <div className="mt-8 flex items-center gap-4">
              <div className="flex-1 h-px bg-slate-200" />
              <span className="font-medical text-2xs text-slate-400 uppercase tracking-widest">Ou</span>
              <div className="flex-1 h-px bg-slate-200" />
            </div>

            {/* Accès rapide multi-rôle (tests locaux) */}
            <div className="mt-4 rounded-xl border border-dashed border-slate-200 overflow-hidden">
              <button
                type="button"
                onClick={() => setShowDemo((v) => !v)}
                className="w-full flex items-center justify-between px-4 py-2.5 text-left hover:bg-slate-50 transition-colors"
              >
                <span className="flex items-center gap-2 font-medical text-2xs font-semibold text-slate-500 uppercase tracking-widest">
                  <Zap size={11} /> Accès rapide (tests)
                </span>
                {showDemo ? <ChevronUp size={13} className="text-slate-400" /> : <ChevronDown size={13} className="text-slate-400" />}
              </button>
              {showDemo && (
                <div className="px-4 pb-4 pt-1 space-y-2">
                  <p className="font-body text-2xs text-slate-400">
                    Ouvre chaque rôle dans un onglet séparé — sessions indépendantes.
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {DEMO_USERS.map((d) => (
                      <button
                        key={d.user.id}
                        type="button"
                        onClick={() => { loginAs(d.user); navigate(homeForRole()) }}
                        className={`inline-flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs font-semibold font-body transition-colors ${d.color}`}
                      >
                        {d.label}
                      </button>
                    ))}
                  </div>
                  <p className="font-body text-2xs text-amber-600">
                    ⚠ Mode démo uniquement — les appels API utilisent vos vraies credentials backend.
                  </p>
                </div>
              )}
            </div>

            <p className="mt-4 text-center text-sm text-slate-600 font-body">
              Vous êtes un client ?{' '}
              <Link to="/connexion" className="text-teal-700 hover:text-teal-800 font-semibold transition-colors">
                Espace client
              </Link>
            </p>
            <p className="mt-2 text-center text-2xs text-slate-400 font-body">
              <Link to="/" className="hover:text-slate-600">← Retour à l'accueil</Link>
            </p>
          </motion.div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between gap-4 text-xs font-body text-slate-400">
          <p>© 2026 PharmaDigital · Tous droits réservés</p>
          <div className="flex items-center gap-1.5">
            <ShieldCheck size={12} />
            <span>Connexion chiffrée</span>
          </div>
        </div>
      </div>

      {/* ═══════════════════════════════════════════════════════════════
          PANEL DROIT — visuel premium (skeleton + image en fade-in)
          ═══════════════════════════════════════════════════════════════ */}
      <div className="hidden lg:flex flex-1 relative overflow-hidden">
        {/* Fond skeleton IMMÉDIATEMENT visible — dégradé + animation subtile */}
        <div
          aria-hidden
          className="absolute inset-0 bg-gradient-to-br from-teal-900 via-slate-900 to-slate-950"
        >
          {/* Shimmer ondulant pendant le chargement de l'image */}
          {!imgLoaded && (
            <div
              className="absolute inset-0 opacity-40"
              style={{
                background: 'linear-gradient(110deg, transparent 30%, rgba(255,255,255,0.06) 50%, transparent 70%)',
                backgroundSize: '200% 100%',
                animation: 'shimmer 2.5s linear infinite',
              }}
            />
          )}
        </div>

        {/* Image — fade-in fluide quand chargée */}
        <motion.img
          src={imgPharmacist}
          alt="Pharmacien hospitalier"
          fetchPriority="high"
          decoding="async"
          loading="eager"
          onLoad={() => setImgLoaded(true)}
          initial={{ opacity: 0, scale: 1.04 }}
          animate={{ opacity: imgLoaded ? 1 : 0, scale: imgLoaded ? 1 : 1.04 }}
          transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
          className="absolute inset-0 w-full h-full object-cover"
        />

        {/* Overlay sombre + halo turquoise — visible immédiatement */}
        <div className="absolute inset-0 bg-gradient-to-br from-teal-900/85 via-slate-900/70 to-slate-900/60" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,rgba(21,178,152,0.25),transparent_50%)]" />
        <div className="absolute top-1/4 right-0 w-96 h-96 rounded-full bg-teal-400/20 blur-3xl" />

        {/* Contenu — apparaît instantanément, ne dépend PAS de l'image */}
        <div className="relative z-10 p-12 flex flex-col justify-between h-full w-full">
          {/* Top tag */}
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1, duration: 0.35 }}
            className="self-end inline-flex items-center gap-2 rounded-full bg-white/10 backdrop-blur-md border border-white/20 px-3 py-1.5 text-2xs font-medical font-medium text-white uppercase tracking-widest"
          >
            <span className="size-1.5 rounded-full bg-teal-300 animate-pulse" />
            Plateforme certifiée
          </motion.div>

          {/* Texte principal */}
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15, duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
            className="max-w-lg"
          >
            <h2 className="font-display text-5xl font-bold text-white leading-[1.05] tracking-tightest">
              La pharmacie
              <br />
              hospitalière
              <br />
              <span className="text-teal-300">réinventée.</span>
            </h2>
            <p className="font-body text-base text-white/80 mt-5 max-w-md leading-relaxed">
              Stocks, ordonnances, patients et ventes centralisés dans une interface moderne, sécurisée et intuitive.
            </p>

            {/* Stats */}
            <div className="mt-10 grid grid-cols-3 gap-6 pt-6 border-t border-white/15">
              {[
                { val: '99.9%', label: 'Disponibilité',  icon: <Activity size={14} /> },
                { val: '< 2s',  label: 'Temps réponse',  icon: <Sparkles size={14} /> },
                { val: '100%',  label: 'Sécurisé',       icon: <ShieldCheck size={14} /> },
              ].map((s, i) => (
                <motion.div
                  key={s.label}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.25 + i * 0.05, duration: 0.35 }}
                >
                  <div className="flex items-center gap-1.5 text-teal-300 mb-1">{s.icon}</div>
                  <p className="font-mono text-2xl font-bold text-white tracking-tighter">{s.val}</p>
                  <p className="font-medical text-2xs text-white/60 uppercase tracking-widest mt-0.5">{s.label}</p>
                </motion.div>
              ))}
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  )
}
