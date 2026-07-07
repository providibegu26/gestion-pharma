import { useState } from 'react'
import { Plus, Edit2, Trash2, Shield, Users, AlertTriangle } from 'lucide-react'
import { useApiError, useRoles, useUsers } from '@/adapters/react'
import { PageHeader } from '@/components/ui/PageHeader'
import { Button } from '@/components/ui/Button'
import { GlassCard } from '@/components/ui/GlassCard'
import { Table } from '@/components/ui/Table'
import { Badge } from '@/components/ui/Badge'
import { Modal } from '@/components/ui/Modal'
import { Input } from '@/components/ui/Input'
import { Select } from '@/components/ui/Select'
import { toast } from '@/components/ui/Toast'
import type { CreateRolePayload, PermissionCode, RoleDefinition, UpdateRolePayload } from '@/core'

const PERMISSION_OPTIONS: { value: PermissionCode; label: string }[] = [
  { value: 'dashboard:view',     label: 'Tableau de bord' },
  { value: 'produits:read',      label: 'Lire les produits' },
  { value: 'produits:write',     label: 'Gérer les produits' },
  { value: 'commandes:read',     label: 'Voir les commandes' },
  { value: 'commandes:valider',  label: 'Valider les commandes' },
  { value: 'users:manage',       label: 'Gérer le personnel' },
  { value: 'roles:manage',       label: 'Gérer les rôles' },
  { value: 'file:view',          label: 'Voir la file d\'attente' },
  { value: 'file:manage',        label: 'Gérer la file d\'attente' },
]

const emptyForm: CreateRolePayload = {
  code: '', label: '', description: '', permissions: [],
}

export const RolesPage = () => {
  const { getErrorMessage } = useApiError()
  const { list, create, update, remove, assignToUser } = useRoles()
  const { list: usersList } = useUsers()

  const [modal, setModal] = useState<'create' | 'edit' | 'delete' | 'assign' | null>(null)
  const [selected, setSelected] = useState<RoleDefinition | null>(null)
  const [form, setForm] = useState<CreateRolePayload>(emptyForm)
  const [assignUserId, setAssignUserId] = useState('')
  const [assignRoleCode, setAssignRoleCode] = useState('')

  const roles = list.data ?? []
  const staffUsers = (usersList.data ?? []).filter((u) => u.role !== 'CLIENT' && u.role !== 'PREPARATEUR')

  const openCreate = () => {
    setForm(emptyForm)
    setSelected(null)
    setModal('create')
  }

  const openEdit = (r: RoleDefinition) => {
    setSelected(r)
    setForm({
      code: r.code,
      label: r.label,
      description: r.description ?? '',
      permissions: [...r.permissions],
    })
    setModal('edit')
  }

  const togglePermission = (perm: PermissionCode) => {
    setForm((f) => ({
      ...f,
      permissions: f.permissions.includes(perm)
        ? f.permissions.filter((p) => p !== perm)
        : [...f.permissions, perm],
    }))
  }

  const createMut = {
    ...create,
    mutate: (payload: CreateRolePayload) => create.mutate(payload, {
      onSuccess: () => { toast.success('Rôle créé'); setModal(null) },
      onError: (e) => toast.error(getErrorMessage(e)),
    }),
  }

  const updateMut = {
    ...update,
    mutate: (args: { id: string; data: UpdateRolePayload }) => update.mutate(args, {
      onSuccess: () => { toast.success('Rôle mis à jour'); setModal(null) },
      onError: (e) => toast.error(getErrorMessage(e)),
    }),
  }

  const deleteMut = {
    ...remove,
    mutate: (id: string) => remove.mutate(id, {
      onSuccess: () => { toast.success('Rôle supprimé'); setModal(null) },
      onError: (e) => toast.error(getErrorMessage(e)),
    }),
  }

  const assignMut = {
    ...assignToUser,
    mutate: (args: { userId: string; data: { role: string } }) => assignToUser.mutate(args, {
      onSuccess: () => { toast.success('Rôle attribué à l\'utilisateur'); setModal(null) },
      onError: (e) => toast.error(getErrorMessage(e)),
    }),
  }

  const roleOptions = roles.map((r) => ({ value: r.code, label: r.label }))
  const userOptions = staffUsers.map((u) => ({
    value: u.id,
    label: `${u.prenom} ${u.nom} (${u.role})`,
  }))

  return (
    <div>
      <PageHeader
        title="Gestion des rôles"
        subtitle="Rôles système et rôles personnalisés avec permissions"
        icon={<Shield size={20} />}
        actions={
          <div className="flex gap-2">
            <Button variant="outline" icon={<Users size={15} />} onClick={() => { setAssignUserId(''); setAssignRoleCode(''); setModal('assign') }}>
              Attribuer un rôle
            </Button>
            <Button icon={<Plus size={15} />} onClick={openCreate}>
              Nouveau rôle
            </Button>
          </div>
        }
      />

      <GlassCard variant="solid">
        <Table<RoleDefinition>
          loading={list.isLoading}
          data={roles}
          keyExtractor={(r) => r.id}
          emptyMessage="Aucun rôle"
          columns={[
            {
              key: 'code', header: 'Code',
              render: (r) => (
                <div>
                  <p className="font-mono text-sm font-bold text-slate-900">{r.code}</p>
                  {r.isSystem && (
                    <span className="font-medical text-2xs text-violet-600 uppercase tracking-wider">Système</span>
                  )}
                </div>
              ),
            },
            {
              key: 'label', header: 'Libellé',
              render: (r) => (
                <div>
                  <p className="font-body text-sm font-semibold text-slate-900">{r.label}</p>
                  {r.description && <p className="font-body text-2xs text-slate-500 mt-0.5">{r.description}</p>}
                </div>
              ),
            },
            {
              key: 'permissions', header: 'Permissions',
              render: (r) => (
                <div className="flex flex-wrap gap-1 max-w-xs">
                  {r.permissions.slice(0, 3).map((p) => (
                    <Badge key={p} className="text-2xs">{p.split(':')[1]}</Badge>
                  ))}
                  {r.permissions.length > 3 && (
                    <Badge className="text-2xs">+{r.permissions.length - 3}</Badge>
                  )}
                </div>
              ),
            },
            {
              key: 'users', header: 'Utilisateurs',
              render: (r) => <span className="font-mono text-sm text-slate-600">{r.userCount ?? 0}</span>,
            },
            {
              key: 'actions', header: '',
              render: (r) => !r.isSystem ? (
                <div className="flex items-center gap-1.5 justify-end">
                  <Button variant="ghost" size="sm" icon={<Edit2 size={13} />} onClick={() => openEdit(r)} aria-label="Modifier" />
                  <Button variant="ghost" size="sm" icon={<Trash2 size={13} className="text-rose-600" />} onClick={() => { setSelected(r); setModal('delete') }} aria-label="Supprimer" />
                </div>
              ) : (
                <span className="font-medical text-2xs text-slate-400 uppercase tracking-wider text-right block">
                  Protégé
                </span>
              ),
              headerClass: 'text-right',
            },
          ]}
        />
      </GlassCard>

      {/* Create / Edit */}
      <Modal
        open={modal === 'create' || modal === 'edit'}
        onClose={() => setModal(null)}
        title={modal === 'create' ? 'Nouveau rôle' : 'Modifier le rôle'}
        size="lg"
      >
        <form
          onSubmit={(e) => {
            e.preventDefault()
            if (!form.code.trim() || !form.label.trim()) {
              toast.error('Code et libellé requis')
              return
            }
            if (modal === 'create') {
              createMut.mutate({ ...form, code: form.code.trim().toUpperCase() })
            } else if (selected) {
              updateMut.mutate({
                id: selected.id,
                data: { label: form.label, description: form.description, permissions: form.permissions },
              })
            }
          }}
          className="space-y-4"
        >
          <div className="grid grid-cols-2 gap-3">
            <Input
              label="Code"
              value={form.code}
              onChange={(e) => setForm((f) => ({ ...f, code: e.target.value.toUpperCase() }))}
              placeholder="RECEPTIONNISTE"
              disabled={modal === 'edit'}
              hint={modal === 'create' ? 'Lettres majuscules, sans espaces' : undefined}
            />
            <Input
              label="Libellé"
              value={form.label}
              onChange={(e) => setForm((f) => ({ ...f, label: e.target.value }))}
              placeholder="Réceptionniste"
            />
          </div>
          <Input
            label="Description"
            value={form.description ?? ''}
            onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
            placeholder="Description du rôle…"
          />
          <div>
            <p className="font-medical text-2xs font-semibold text-slate-500 uppercase tracking-widest mb-2">Permissions</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {PERMISSION_OPTIONS.map((opt) => (
                <label key={opt.value} className="flex items-center gap-2 rounded-xl border border-slate-200 p-2.5 cursor-pointer hover:bg-slate-50">
                  <input
                    type="checkbox"
                    checked={form.permissions.includes(opt.value)}
                    onChange={() => togglePermission(opt.value)}
                    className="rounded border-slate-300 text-teal-600 focus:ring-teal-500"
                  />
                  <span className="font-body text-xs text-slate-700">{opt.label}</span>
                </label>
              ))}
            </div>
          </div>
          <div className="flex gap-3 justify-end pt-3 border-t border-slate-100">
            <Button variant="ghost" type="button" onClick={() => setModal(null)}>Annuler</Button>
            <Button type="submit" loading={createMut.isPending || updateMut.isPending}>
              {modal === 'create' ? 'Créer' : 'Sauvegarder'}
            </Button>
          </div>
        </form>
      </Modal>

      {/* Delete */}
      <Modal open={modal === 'delete'} onClose={() => setModal(null)} title="Supprimer le rôle" size="sm">
        <div className="flex items-start gap-3 mb-5">
          <div className="rounded-lg bg-rose-50 ring-1 ring-inset ring-rose-200 p-2 flex-shrink-0">
            <AlertTriangle size={16} className="text-rose-700" />
          </div>
          <div>
            <p className="font-body text-sm text-slate-700">
              Supprimer le rôle <strong className="text-slate-900">{selected?.label}</strong> ?
            </p>
            <p className="font-body text-xs text-slate-500 mt-1">Cette action est irréversible.</p>
          </div>
        </div>
        <div className="flex gap-3 justify-end">
          <Button variant="ghost" onClick={() => setModal(null)}>Annuler</Button>
          <Button variant="danger" loading={deleteMut.isPending} onClick={() => selected && deleteMut.mutate(selected.id)}>
            Supprimer
          </Button>
        </div>
      </Modal>

      {/* Assign */}
      <Modal open={modal === 'assign'} onClose={() => setModal(null)} title="Attribuer un rôle" subtitle="Changer le rôle d'un membre du personnel" size="md">
        <form
          onSubmit={(e) => {
            e.preventDefault()
            if (!assignUserId || !assignRoleCode) {
              toast.error('Sélectionnez un utilisateur et un rôle')
              return
            }
            assignMut.mutate({ userId: assignUserId, data: { role: assignRoleCode } })
          }}
          className="space-y-4"
        >
          <Select label="Utilisateur" value={assignUserId} onChange={(e) => setAssignUserId(e.target.value)} options={[{ value: '', label: '— Choisir —' }, ...userOptions]} />
          <Select label="Rôle" value={assignRoleCode} onChange={(e) => setAssignRoleCode(e.target.value)} options={[{ value: '', label: '— Choisir —' }, ...roleOptions]} />
          <div className="flex gap-3 justify-end pt-3 border-t border-slate-100">
            <Button variant="ghost" type="button" onClick={() => setModal(null)}>Annuler</Button>
            <Button type="submit" loading={assignMut.isPending}>Attribuer</Button>
          </div>
        </form>
      </Modal>
    </div>
  )
}
