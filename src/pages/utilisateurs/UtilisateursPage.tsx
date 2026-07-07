import { useState } from 'react'
import { Plus, Edit2, Trash2, Shield, Mail, AlertTriangle, KeyRound } from 'lucide-react'
import { useAuth, useApiError, useUsers, useRoles } from '@/adapters/react'
import { PageHeader } from '@/components/ui/PageHeader'
import { Button } from '@/components/ui/Button'
import { GlassCard } from '@/components/ui/GlassCard'
import { Table } from '@/components/ui/Table'
import { Badge } from '@/components/ui/Badge'
import { Modal } from '@/components/ui/Modal'
import { Input } from '@/components/ui/Input'
import { Select } from '@/components/ui/Select'
import { toast } from '@/components/ui/Toast'
import { formatDateShort, getRoleColor, getRoleLabel, getInitials } from '@/utils/helpers'
import type { User, StaffRole, UserRole, CreateStaffUserPayload, UpdateUserPayload } from '@/core'
import { isSystemRole } from '@/config/permissions'

const STAFF_ROLE_OPTIONS: { value: StaffRole; label: string }[] = [
  { value: 'PHARMACIEN', label: 'Pharmacien' },
  { value: 'CAISSIER',    label: 'Caissier' },
]

export const UtilisateursPage = () => {
  const { user: currentUser } = useAuth()
  const { getErrorMessage } = useApiError()
  const { list, create, update, remove } = useUsers()
  const { list: rolesList } = useRoles()

  const roleOptions: { value: string; label: string }[] = [
    ...STAFF_ROLE_OPTIONS,
    ...(rolesList.data ?? [])
      .filter((r) => !r.isSystem && !isSystemRole(r.code))
      .map((r) => ({ value: r.code, label: r.label })),
  ]

  const [modal, setModal] = useState<'create' | 'edit' | 'delete' | null>(null)
  const [selected, setSelected] = useState<User | null>(null)
  const [createForm, setCreateForm] = useState<CreateStaffUserPayload>({
    nom: '', prenom: '', email: '', role: 'CAISSIER',
  })
  const [editForm, setEditForm] = useState<UpdateUserPayload>({})

  const createMut = {
    ...create,
    mutate: (payload: CreateStaffUserPayload) => create.mutate(payload, {
      onSuccess: (r) => { toast.success(r.message ?? 'Compte créé — identifiants envoyés par email.'); setModal(null) },
      onError: (e) => toast.error(getErrorMessage(e)),
    }),
  }
  const updateMut = {
    ...update,
    mutate: (args: { id: string; data: UpdateUserPayload }) => update.mutate(args, {
      onSuccess: () => { toast.success('Utilisateur mis à jour'); setModal(null) },
      onError: (e) => toast.error(getErrorMessage(e)),
    }),
  }
  const deleteMut = {
    ...remove,
    mutate: (id: string) => remove.mutate(id, {
      onSuccess: () => { toast.success('Utilisateur supprimé'); setModal(null) },
      onError: (e) => toast.error(getErrorMessage(e)),
    }),
  }

  const users = list.data ?? []
  const isLoading = list.isLoading

  const openEdit = (u: User) => {
    setSelected(u)
    setEditForm({ nom: u.nom, prenom: u.prenom, email: u.email, role: u.role as StaffRole })
    setModal('edit')
  }

  // Le rôle CLIENT n'est pas attribuable depuis l'admin — on filtre la liste pour ne montrer que le staff.
  const staffUsers = users.filter(u => u.role !== 'CLIENT' && u.role !== 'PREPARATEUR')

  return (
    <div>
      <PageHeader
        title="Gestion du personnel"
        subtitle="Administration des comptes staff (Admin, Pharmacien, Caissier)"
        icon={<Shield size={20} />}
        actions={
          <Button icon={<Plus size={15} />} onClick={() => {
            setCreateForm({ nom: '', prenom: '', email: '', role: 'CAISSIER' })
            setModal('create')
          }}>
            Nouveau compte staff
          </Button>
        }
      />

      <GlassCard variant="solid">
        <Table<User>
          loading={isLoading}
          data={staffUsers}
          keyExtractor={(u) => u.id}
          emptyMessage="Aucun utilisateur"
          columns={[
            {
              key: 'identity', header: 'Utilisateur',
              render: (u) => (
                <div className="flex items-center gap-3">
                  <div className="flex-shrink-0 w-10 h-10 rounded-xl bg-gradient-to-br from-teal-100 to-teal-50 ring-1 ring-inset ring-teal-200 flex items-center justify-center">
                    <span className="font-mono text-xs font-bold text-teal-700">
                      {getInitials(u.nom, u.prenom)}
                    </span>
                  </div>
                  <div className="min-w-0">
                    <p className="font-body text-sm font-semibold text-slate-900 flex items-center gap-2">
                      {u.prenom} {u.nom}
                      {u.id === currentUser?.id && (
                        <span className="font-medical text-2xs font-semibold text-teal-700 bg-teal-50 border border-teal-200/70 px-1.5 py-0.5 rounded uppercase tracking-wider">
                          Vous
                        </span>
                      )}
                    </p>
                    <div className="inline-flex items-center gap-1 mt-0.5">
                      <Mail size={10} className="text-slate-400" />
                      <p className="font-body text-xs text-slate-500">{u.email}</p>
                    </div>
                  </div>
                </div>
              ),
            },
            {
              key: 'role', header: 'Rôle',
              render: (u) => <Badge className={getRoleColor(u.role)}>{getRoleLabel(u.role)}</Badge>,
            },
            {
              key: 'createdAt', header: 'Créé le',
              render: (u) => <span className="font-body text-xs text-slate-500">{formatDateShort(u.createdAt)}</span>,
            },
            {
              key: 'actions', header: '',
              render: (u) => u.id !== currentUser?.id ? (
                <div className="flex items-center gap-1.5 justify-end">
                  <Button variant="ghost" size="sm" icon={<Edit2 size={13} />} onClick={() => openEdit(u)} aria-label="Modifier" />
                  <Button variant="ghost" size="sm" icon={<Trash2 size={13} className="text-rose-600" />} onClick={() => { setSelected(u); setModal('delete') }} aria-label="Supprimer" />
                </div>
              ) : (
                <span className="font-medical text-2xs text-slate-400 uppercase tracking-wider text-right block">
                  Compte courant
                </span>
              ),
              headerClass: 'text-right',
            },
          ]}
        />
      </GlassCard>

      {/* Create — pas de mot de passe : généré par le backend et envoyé par email */}
      <Modal open={modal === 'create'} onClose={() => setModal(null)} title="Nouveau compte staff" subtitle="Le mot de passe sera envoyé par email" size="md">
        <form
          onSubmit={(e) => { e.preventDefault(); createMut.mutate(createForm) }}
          className="space-y-4"
        >
          <div className="flex items-start gap-3 rounded-xl border border-teal-200/70 bg-teal-50/40 p-3.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-teal-100 text-teal-700">
              <KeyRound size={15} />
            </div>
            <div>
              <p className="font-display text-sm font-bold text-teal-900">Mot de passe automatique</p>
              <p className="font-body text-2xs text-teal-700 leading-relaxed mt-0.5">
                Le système génère un mot de passe temporaire sécurisé et l'envoie à l'adresse email du nouvel employé.
                Il devra le remplacer lors de sa première connexion.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <Input label="Prénom" value={createForm.prenom} onChange={(e) => setCreateForm(f => ({ ...f, prenom: e.target.value }))} placeholder="Marie" />
            <Input label="Nom"    value={createForm.nom}    onChange={(e) => setCreateForm(f => ({ ...f, nom: e.target.value }))}    placeholder="Mukeba" />
          </div>
          <Input label="Email" type="email" value={createForm.email} onChange={(e) => setCreateForm(f => ({ ...f, email: e.target.value }))} placeholder="marie.mukeba@pharmacie.cd" hint="Le mot de passe temporaire sera envoyé à cette adresse" />
          <Select label="Rôle" value={String(createForm.role)} onChange={(e) => setCreateForm(f => ({ ...f, role: e.target.value }))} options={roleOptions} />
          <div className="flex gap-3 justify-end pt-3 border-t border-slate-100">
            <Button variant="ghost" type="button" onClick={() => setModal(null)}>Annuler</Button>
            <Button type="submit" loading={createMut.isPending}>
              <Mail size={14} className="mr-1" />
              Créer & envoyer
            </Button>
          </div>
        </form>
      </Modal>

      {/* Edit */}
      <Modal open={modal === 'edit'} onClose={() => setModal(null)} title="Modifier l'utilisateur" subtitle={selected ? `${selected.prenom} ${selected.nom}` : undefined} size="md">
        <form
          onSubmit={(e) => { e.preventDefault(); selected && updateMut.mutate({ id: selected.id, data: editForm }) }}
          className="space-y-4"
        >
          <div className="grid grid-cols-2 gap-3">
            <Input label="Prénom" value={editForm.prenom ?? ''} onChange={(e) => setEditForm(f => ({ ...f, prenom: e.target.value }))} />
            <Input label="Nom"    value={editForm.nom ?? ''}    onChange={(e) => setEditForm(f => ({ ...f, nom: e.target.value }))} />
          </div>
          <Input  label="Email" type="email" value={editForm.email ?? ''} onChange={(e) => setEditForm(f => ({ ...f, email: e.target.value }))} />
          <Select label="Rôle"  value={String(editForm.role ?? '')} onChange={(e) => setEditForm(f => ({ ...f, role: e.target.value as UserRole }))} options={roleOptions} />
          <div className="flex gap-3 justify-end pt-3 border-t border-slate-100">
            <Button variant="ghost" type="button" onClick={() => setModal(null)}>Annuler</Button>
            <Button type="submit" loading={updateMut.isPending}>Sauvegarder</Button>
          </div>
        </form>
      </Modal>

      {/* Delete */}
      <Modal open={modal === 'delete'} onClose={() => setModal(null)} title="Supprimer l'utilisateur" size="sm">
        <div className="flex items-start gap-3 mb-5">
          <div className="rounded-lg bg-rose-50 ring-1 ring-inset ring-rose-200 p-2 flex-shrink-0">
            <AlertTriangle size={16} className="text-rose-700" />
          </div>
          <div>
            <p className="font-body text-sm text-slate-700">
              Supprimer le compte de{' '}
              <strong className="text-slate-900">{selected?.prenom} {selected?.nom}</strong> ?
            </p>
            <p className="font-body text-xs text-slate-500 mt-1">
              L'utilisateur perdra immédiatement l'accès au système. Cette action est irréversible.
            </p>
          </div>
        </div>
        <div className="flex gap-3 justify-end">
          <Button variant="ghost" onClick={() => setModal(null)}>Annuler</Button>
          <Button variant="danger" loading={deleteMut.isPending} onClick={() => selected && deleteMut.mutate(selected.id)}>
            Supprimer
          </Button>
        </div>
      </Modal>
    </div>
  )
}
