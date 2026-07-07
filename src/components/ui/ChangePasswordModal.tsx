import { useState } from 'react'
import { Lock, Eye, EyeOff, KeyRound } from 'lucide-react'
import { Modal } from './Modal'
import { Button } from './Button'
import { Input } from './Input'
import { toast } from './Toast'
import { useAuth, useApiError } from '@/adapters/react'

interface ChangePasswordModalProps {
  isOpen: boolean
  onClose: () => void
  /** Affiche un message d'incitation pour le staff (premier login) */
  firstLogin?: boolean
}

export const ChangePasswordModal = ({ isOpen, onClose, firstLogin = false }: ChangePasswordModalProps) => {
  const { changePassword } = useAuth()
  const { getErrorMessage } = useApiError()
  const [form, setForm] = useState({ ancien: '', nouveau: '', confirm: '' })
  const [showOld, setShowOld] = useState(false)
  const [showNew, setShowNew] = useState(false)
  const [loading, setLoading] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})

  const set = (key: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm(f => ({ ...f, [key]: e.target.value }))

  const validate = () => {
    const e: Record<string, string> = {}
    if (!form.ancien) e.ancien = 'Ancien mot de passe requis'
    if (!form.nouveau) e.nouveau = 'Nouveau mot de passe requis'
    else if (form.nouveau.length < 8) e.nouveau = 'Minimum 8 caractères'
    if (form.nouveau !== form.confirm) e.confirm = 'Les mots de passe ne correspondent pas'
    return e
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    const v = validate()
    if (Object.keys(v).length) { setErrors(v); return }
    setLoading(true)
    try {
      await changePassword({ ancienMotDePasse: form.ancien, nouveauMotDePasse: form.nouveau })
      toast.success('Mot de passe mis à jour avec succès.')
      setForm({ ancien: '', nouveau: '', confirm: '' })
      setErrors({})
      onClose()
    } catch (err) {
      toast.error(getErrorMessage(err))
    } finally {
      setLoading(false)
    }
  }

  return (
    <Modal open={isOpen} onClose={onClose} title="Changer mon mot de passe">
      <form onSubmit={handleSubmit} className="space-y-4">
        {firstLogin && (
          <div className="flex items-start gap-3 rounded-xl border border-amber-200/70 bg-amber-50/60 p-3.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-amber-100 text-amber-700">
              <KeyRound size={15} />
            </div>
            <div>
              <p className="font-display text-sm font-bold text-amber-900">Premier accès</p>
              <p className="font-body text-2xs text-amber-700 leading-relaxed mt-0.5">
                Votre mot de passe temporaire a été envoyé par email. Veuillez le remplacer dès maintenant.
              </p>
            </div>
          </div>
        )}

        <Input
          label="Mot de passe actuel"
          type={showOld ? 'text' : 'password'}
          value={form.ancien}
          onChange={set('ancien')}
          placeholder="••••••••"
          icon={<Lock size={15} />}
          iconRight={
            <button type="button" onClick={() => setShowOld(!showOld)} aria-label="Afficher">
              {showOld ? <EyeOff size={15} /> : <Eye size={15} />}
            </button>
          }
          error={errors.ancien}
          autoComplete="current-password"
        />
        <Input
          label="Nouveau mot de passe"
          type={showNew ? 'text' : 'password'}
          value={form.nouveau}
          onChange={set('nouveau')}
          placeholder="Minimum 8 caractères"
          icon={<Lock size={15} />}
          iconRight={
            <button type="button" onClick={() => setShowNew(!showNew)} aria-label="Afficher">
              {showNew ? <EyeOff size={15} /> : <Eye size={15} />}
            </button>
          }
          error={errors.nouveau}
          autoComplete="new-password"
        />
        <Input
          label="Confirmer le nouveau mot de passe"
          type={showNew ? 'text' : 'password'}
          value={form.confirm}
          onChange={set('confirm')}
          placeholder="Retapez le mot de passe"
          icon={<Lock size={15} />}
          error={errors.confirm}
          autoComplete="new-password"
        />

        <div className="flex gap-3 pt-2">
          <Button type="button" variant="outline" onClick={onClose} className="flex-1">Annuler</Button>
          <Button type="submit" loading={loading} className="flex-1">Mettre à jour</Button>
        </div>
      </form>
    </Modal>
  )
}
