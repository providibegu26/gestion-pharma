import { useState } from 'react'
import { Shield, Plus, Edit2, Trash2, Info, Lock } from 'lucide-react'
import { useApiError, useRoles } from '@/adapters/react'
import {
  ALL_PERMISSIONS,
  PERMISSION_LABELS,
  type CreateRolePayload,
  type ManagedRole,
  type Permission,
} from '@/core'
import { PageHeader } from '@/components/ui/PageHeader'
import { Button } from '@/components/ui/Button'
import { GlassCard } from '@/components/ui/GlassCard'
import { Table } from '@/components/ui/Table'
import { Badge } from '@/components/ui/Badge'
import { Modal } from '@/components/ui/Modal'
import { Input } from '@/components/ui/Input'
import { ConfirmDialog } from '@/components/ui/ConfirmDialog'
import { toast } from '@/components/ui/Toast'

type RoleForm = Required<Pick<CreateRolePayload, 'nom'>> & {
  label: string
  description: string
  permissions: string[]
}

const emptyForm: RoleForm = { nom: '', label: '', description: '', permissions: [] }

export const RolesPage = () => {
  const { getErrorMessage } = useApiError()
  const { list, data, isReadOnly, create, update, remove } = useRoles()

  const [modal, setModal] = useState<'create' | 'edit' | 'delete' | null>(null)
  const [selected, setSelected] = useState<ManagedRole | null>(null)
  const [form, setForm] = useState<RoleForm>(emptyForm)
  const [error, setError] = useState<string | null>(null)

  const openCreate = () => {
    setSelected(null)
    setForm(emptyForm)
    setError(null)
    setModal('create')
  }

  const openEdit = (role: ManagedRole) => {
    setSelected(role)
    setForm({
      nom: role.nom,
      label: role.label ?? '',
      description: role.description ?? '',
      permissions: role.permissions ?? [],
    })
    setError(null)
    setModal('edit')
  }

  const togglePermission = (perm: Permission) => {
    setForm((f) => ({
      ...f,
      permissions: f.permissions.includes(perm)
        ? f.permissions.filter((p) => p !== perm)
        : [...f.permissions, perm],
    }))
  }

  const submit = () => {
    const nom = form.nom.trim()
    if (!nom) {
      setError('Le nom technique du rôle est obligatoire.')
      return
    }
    const payload: CreateRolePayload = {
      nom,
      label: form.label.trim() || undefined,
      description: form.description.trim() || undefined,
      permissions: form.permissions,
    }

    if (modal === 'create') {
      create.mutate(payload, {
        onSuccess: () => { toast.success('Rôle créé.'); setModal(null) },
        onError: (e) => toast.error(getErrorMessage(e)),
      })
    } else if (selected) {
      update.mutate({ id: selected.id, data: payload }, {
        onSuccess: () => { toast.success('Rôle mis à jour.'); setModal(null) },
        onError: (e) => toast.error(getErrorMessage(e)),
      })
    }
  }

  const confirmDelete = () => {
    if (!selected) return
    remove.mutate(selected.id, {
      onSuccess: () => { toast.success('Rôle supprimé.'); setModal(null) },
      onError: (e) => toast.error(getErrorMessage(e)),
    })
  }

  return (
    <div className="space-y-5">
      <PageHeader
        title="Gestion des rôles"
        subtitle="Définir les rôles, leurs permissions et les attribuer au personnel"
        icon={<Shield size={20} />}
        actions={
          <Button icon={<Plus size={15} />} onClick={openCreate} disabled={isReadOnly}>
            Nouveau rôle
          </Button>
        }
      />

      {isReadOnly && (
        <div className="flex items-start gap-3 rounded-xl border border-amber-200/70 bg-amber-50/50 p-3.5">
          <Info size={16} className="mt-0.5 flex-shrink-0 text-amber-600" />
          <div>
            <p className="font-body text-sm font-semibold text-amber-900">
              Service de rôles non disponible côté serveur
            </p>
            <p className="font-body text-xs text-amber-700 mt-0.5 leading-relaxed">
              Les rôles système ci-dessous sont affichés en lecture seule. La création et
              l'édition de rôles seront actives dès que le backend exposera l'API dédiée.
              L'attribution d'un rôle à un utilisateur reste disponible depuis la page « Personnel ».
            </p>
          </div>
        </div>
      )}

      <GlassCard variant="solid">
        <Table<ManagedRole>
          loading={list.isLoading}
          data={data}
          keyExtractor={(r) => r.id}
          emptyMessage="Aucun rôle défini"
          columns={[
            {
              key: 'role',
              header: 'Rôle',
              render: (r) => (
                <div className="flex items-center gap-2">
                  <span className="font-body text-sm font-semibold text-slate-900">
                    {r.label ?? r.nom}
                  </span>
                  {r.systeme && (
                    <Badge className="text-slate-600 bg-slate-100 border-slate-200" size="sm">
                      <Lock size={9} /> Système
                    </Badge>
                  )}
                </div>
              ),
            },
            {
              key: 'nom',
              header: 'Clé',
              render: (r) => <span className="font-mono text-xs text-slate-500">{r.nom}</span>,
            },
            {
              key: 'description',
              header: 'Description',
              render: (r) => (
                <span className="font-body text-xs text-slate-500 line-clamp-2">
                  {r.description ?? '—'}
                </span>
              ),
            },
            {
              key: 'permissions',
              header: 'Permissions',
              render: (r) => (
                <span className="inline-flex items-center gap-1 rounded-full bg-teal-50 text-teal-700 border border-teal-200/70 px-2 py-0.5 text-2xs font-medical font-semibold">
                  {r.permissions?.length ?? 0} accordée{(r.permissions?.length ?? 0) > 1 ? 's' : ''}
                </span>
              ),
            },
            {
              key: 'actions',
              header: '',
              headerClass: 'text-right',
              render: (r) => (
                <div className="flex items-center gap-1.5 justify-end">
                  <Button
                    variant="ghost"
                    size="sm"
                    icon={<Edit2 size={13} />}
                    onClick={() => openEdit(r)}
                    disabled={isReadOnly || r.systeme}
                    aria-label="Modifier"
                  />
                  <Button
                    variant="ghost"
                    size="sm"
                    icon={<Trash2 size={13} className="text-rose-600" />}
                    onClick={() => { setSelected(r); setModal('delete') }}
                    disabled={isReadOnly || r.systeme}
                    aria-label="Supprimer"
                  />
                </div>
              ),
            },
          ]}
        />
      </GlassCard>

      {/* Create / Edit */}
      <Modal
        open={modal === 'create' || modal === 'edit'}
        onClose={() => setModal(null)}
        title={modal === 'create' ? 'Nouveau rôle' : 'Modifier le rôle'}
        subtitle="Nom, description et permissions accordées"
        size="lg"
      >
        <form onSubmit={(e) => { e.preventDefault(); submit() }} className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <Input
              label="Nom technique"
              value={form.nom}
              onChange={(e) => setForm((f) => ({ ...f, nom: e.target.value.toUpperCase() }))}
              placeholder="EX: LIVREUR"
              error={error ?? undefined}
              hint="Clé unique en majuscules"
            />
            <Input
              label="Libellé affiché"
              value={form.label}
              onChange={(e) => setForm((f) => ({ ...f, label: e.target.value }))}
              placeholder="Livreur"
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="font-medical text-xs font-medium text-slate-600 tracking-wide">
              Description
            </label>
            <textarea
              value={form.description}
              onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
              placeholder="Rôle et responsabilités de ce profil…"
              className="min-h-20 w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm font-body text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-4 focus:ring-teal-500/10 focus:border-teal-500 transition-all"
            />
          </div>

          <div>
            <p className="font-medical text-xs font-medium text-slate-600 tracking-wide mb-2">
              Permissions accordées
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {ALL_PERMISSIONS.map((perm) => {
                const checked = form.permissions.includes(perm)
                return (
                  <label
                    key={perm}
                    className={`flex items-center gap-2.5 rounded-xl border px-3 py-2.5 cursor-pointer transition-all ${
                      checked
                        ? 'border-teal-300 bg-teal-50/60'
                        : 'border-slate-200 bg-white hover:border-slate-300'
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={checked}
                      onChange={() => togglePermission(perm)}
                      className="h-4 w-4 rounded border-slate-300 text-teal-600 focus:ring-teal-500/30"
                    />
                    <div className="min-w-0">
                      <p className="font-body text-sm text-slate-800 truncate">{PERMISSION_LABELS[perm]}</p>
                      <p className="font-mono text-2xs text-slate-400 truncate">{perm}</p>
                    </div>
                  </label>
                )
              })}
            </div>
          </div>

          <div className="flex gap-3 justify-end pt-3 border-t border-slate-100">
            <Button variant="ghost" type="button" onClick={() => setModal(null)}>Annuler</Button>
            <Button type="submit" loading={create.isPending || update.isPending}>
              {modal === 'create' ? 'Créer le rôle' : 'Sauvegarder'}
            </Button>
          </div>
        </form>
      </Modal>

      <ConfirmDialog
        open={modal === 'delete'}
        onClose={() => setModal(null)}
        onConfirm={confirmDelete}
        title="Supprimer le rôle"
        message={<>Supprimer le rôle <strong className="text-slate-900">{selected?.label ?? selected?.nom}</strong> ?</>}
        detail="Les utilisateurs portant ce rôle devront être réaffectés. Action irréversible."
        confirmLabel="Supprimer"
        loading={remove.isPending}
      />
    </div>
  )
}
