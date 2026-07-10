import { useEffect, useMemo, useState } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { Pill, Search, Package2, ArrowUpDown, ShoppingCart, Plus, Edit2, Trash2, PackagePlus, AlertTriangle, Sparkles } from 'lucide-react'
import { useAuth, useApiError, useMedicaments, usePermissions, useServices } from '@/adapters/react'
import { PageHeader } from '@/components/ui/PageHeader'
import { Input } from '@/components/ui/Input'
import { Button } from '@/components/ui/Button'
import { GlassCard } from '@/components/ui/GlassCard'
import { Modal } from '@/components/ui/Modal'
import { Pagination } from '@/components/ui/Pagination'
import { toast } from '@/components/ui/Toast'
import type { CreateCommandePayload, CreateMedicamentPayload, Medicament, UpdateMedicamentPayload } from '@/core'

type SortMode = 'name-asc' | 'name-desc' | 'price-asc' | 'price-desc'

const PAGE_SIZE = 8

/**
 * Catalogue produits optimisé pour une grande volumétrie :
 * - filtrage client-side mémorisé (useMemo)
 * - tri mémorisé (useMemo)
 * - pagination pour limiter le coût de rendu DOM
 * - staleTime React Query côté hook pour éviter les refetchs inutiles
 */
export const ProduitsPage = () => {
  const qc = useQueryClient()
  const { list } = useMedicaments()
  const { commandes, medicaments, stock: stockService } = useServices()
  const { isClient } = useAuth()
  const { can } = usePermissions()
  const { getErrorMessage } = useApiError()
  const [query, setQuery] = useState('')
  const [category, setCategory] = useState<string>('ALL')
  const [sort, setSort] = useState<SortMode>('name-asc')
  const [page, setPage] = useState(1)
  const [modal, setModal] = useState<'create' | 'edit' | 'delete' | 'stock' | 'alertes' | null>(null)
  const [selected, setSelected] = useState<Medicament | null>(null)
  const [form, setForm] = useState<CreateMedicamentPayload>({
    nom: '',
    description: '',
    prixCDF: 0,
    prixUSD: 0,
    categorie: '',
    unite: 'boîte',
    quantiteInitiale: 0,
    seuilMinimum: 10,
  })
  const [stockForm, setStockForm] = useState({ quantite: 0, seuilMinimum: 10 })
  const [stockAlertShown, setStockAlertShown] = useState(false)
  const isClientUser = isClient()
  // Gestion catalogue/stock : permission `produits.manage` (PHARMACIEN).
  const canManage = can('produits.manage')

  const createCommandeMut = useMutation({
    mutationFn: (payload: CreateCommandePayload) => commandes.create(payload),
    onSuccess: () => {
      toast.success('Produit ajouté en commande.')
      qc.invalidateQueries({ queryKey: ['commandes'] })
    },
    onError: (e) => toast.error(getErrorMessage(e)),
  })

  const refreshProducts = () => qc.invalidateQueries({ queryKey: ['medicaments'] })

  const createMedicamentMut = useMutation({
    mutationFn: (payload: CreateMedicamentPayload) => medicaments.create(payload),
    onSuccess: () => { toast.success('Médicament créé.'); refreshProducts(); setModal(null) },
    onError: (e) => toast.error(getErrorMessage(e)),
  })

  const updateMedicamentMut = useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateMedicamentPayload }) => medicaments.update(id, data),
    onSuccess: () => { toast.success('Médicament mis à jour.'); refreshProducts(); setModal(null) },
    onError: (e) => toast.error(getErrorMessage(e)),
  })

  const deleteMedicamentMut = useMutation({
    mutationFn: (id: string) => medicaments.remove(id),
    onSuccess: () => { toast.success('Médicament supprimé.'); refreshProducts(); setModal(null) },
    onError: (e) => toast.error(getErrorMessage(e)),
  })

  const updateStockMut = useMutation({
    mutationFn: ({ id, quantite, seuilMinimum }: { id: string; quantite: number; seuilMinimum?: number }) =>
      stockService.update(id, { quantite, seuilMinimum }),
    onSuccess: () => { toast.success('Stock mis à jour.'); refreshProducts(); setModal(null) },
    onError: (e) => toast.error(getErrorMessage(e)),
  })

  const items = list.data ?? []

  const categories = useMemo(() => {
    const set = new Set<string>()
    items.forEach((m) => { if (m.categorie?.trim()) set.add(m.categorie.trim()) })
    return Array.from(set).sort((a, b) => a.localeCompare(b, 'fr'))
  }, [items])

  const alertes = items.filter((m) => {
    const q = m.stock?.quantite
    const seuil = m.stock?.seuilMinimum
    return q !== undefined && seuil !== undefined && q <= seuil
  })

  useEffect(() => {
    if (canManage && alertes.length > 0 && !stockAlertShown) {
      setModal('alertes')
      setStockAlertShown(true)
    }
  }, [alertes.length, canManage, stockAlertShown])

  const filteredAndSorted = useMemo(() => {
    const q = query.trim().toLowerCase()
    let filtered = items
    if (category !== 'ALL') {
      filtered = filtered.filter((m) => (m.categorie ?? '').trim() === category)
    }
    if (q) {
      filtered = filtered.filter((m) =>
          m.nom.toLowerCase().includes(q) ||
          (m.categorie ?? '').toLowerCase().includes(q),
        )
    }

    const sorted = [...filtered].sort((a, b) => {
      switch (sort) {
        case 'name-desc': return b.nom.localeCompare(a.nom, 'fr')
        case 'price-asc': return Number(a.prixCDF ?? 0) - Number(b.prixCDF ?? 0)
        case 'price-desc': return Number(b.prixCDF ?? 0) - Number(a.prixCDF ?? 0)
        case 'name-asc':
        default:          return a.nom.localeCompare(b.nom, 'fr')
      }
    })
    return sorted
  }, [items, query, category, sort])

  const totalPages = Math.max(1, Math.ceil(filteredAndSorted.length / PAGE_SIZE))
  const currentPage = Math.min(page, totalPages)

  const paged = useMemo(
    () => filteredAndSorted.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE),
    [filteredAndSorted, currentPage],
  )

  const changeSort = (mode: SortMode) => {
    setSort(mode)
    setPage(1)
  }

  const changeQuery = (value: string) => {
    setQuery(value)
    setPage(1)
  }

  const openCreate = () => {
    setForm({ nom: '', description: '', prixCDF: 0, prixUSD: 0, categorie: '', unite: 'boîte', quantiteInitiale: 0, seuilMinimum: 10 })
    setSelected(null)
    setModal('create')
  }

  const openEdit = (item: Medicament) => {
    setSelected(item)
    setForm({
      nom: item.nom,
      description: item.description ?? '',
      prixCDF: Number(item.prixCDF ?? 0),
      prixUSD: Number(item.prixUSD ?? 0),
      categorie: item.categorie ?? '',
      unite: item.unite ?? 'boîte',
      quantiteInitiale: item.stock?.quantite ?? 0,
      seuilMinimum: item.stock?.seuilMinimum ?? 10,
    })
    setModal('edit')
  }

  const openStock = (item: Medicament) => {
    setSelected(item)
    setStockForm({ quantite: item.stock?.quantite ?? 0, seuilMinimum: item.stock?.seuilMinimum ?? 10 })
    setModal('stock')
  }

  const changeCategory = (cat: string) => {
    setCategory(cat)
    setPage(1)
  }

  return (
    <div className="space-y-6">
      {isClientUser && (
        <div className="relative overflow-hidden rounded-2xl border border-emerald-200/60 bg-gradient-to-r from-emerald-50 to-teal-50/60 p-5">
          <div className="flex items-start gap-3">
            <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl bg-emerald-100 ring-1 ring-inset ring-emerald-200">
              <Sparkles size={18} className="text-emerald-700" />
            </div>
            <div>
              <p className="font-display text-sm font-bold text-emerald-900">Catalogue médicaments</p>
              <p className="font-body text-xs text-emerald-800/80 mt-0.5 leading-relaxed">
                Recherchez par nom ou catégorie, puis cliquez sur « Commander » pour passer votre commande.
              </p>
            </div>
          </div>
        </div>
      )}

      <PageHeader
        title={isClientUser ? 'Médicaments disponibles' : 'Catalogue produits'}
        subtitle={isClientUser
          ? 'Parcourez et commandez vos médicaments en quelques clics'
          : 'Consultation et gestion des médicaments disponibles'}
        icon={<Pill size={20} />}
        actions={canManage && (
          <Button icon={<Plus size={15} />} onClick={openCreate}>
            Ajouter un médicament
          </Button>
        )}
      />

      <GlassCard variant="solid" className="space-y-4">
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_auto] gap-3">
          <Input
            label={isClientUser ? 'Rechercher un médicament' : 'Rechercher un produit'}
            value={query}
            onChange={(e) => changeQuery(e.target.value)}
            placeholder="Nom ou catégorie…"
            icon={<Search size={14} />}
          />

          <div className="flex flex-wrap items-end gap-2">
            <Button variant={sort === 'name-asc' ? 'primary' : 'outline'} size="sm" onClick={() => changeSort('name-asc')}>
              <ArrowUpDown size={13} /> A-Z
            </Button>
            <Button variant={sort === 'price-asc' ? 'primary' : 'outline'} size="sm" onClick={() => changeSort('price-asc')}>
              Prix ↑
            </Button>
            <Button variant={sort === 'price-desc' ? 'primary' : 'outline'} size="sm" onClick={() => changeSort('price-desc')}>
              Prix ↓
            </Button>
          </div>
        </div>

        {isClientUser && categories.length > 0 && (
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => changeCategory('ALL')}
              className={`rounded-full px-3 py-1.5 text-xs font-body font-medium transition-colors ${
                category === 'ALL'
                  ? 'bg-emerald-600 text-white shadow-soft'
                  : 'border border-slate-200 bg-white text-slate-600 hover:border-emerald-300'
              }`}
            >
              Toutes
            </button>
            {categories.map((cat) => (
              <button
                key={cat}
                type="button"
                onClick={() => changeCategory(cat)}
                className={`rounded-full px-3 py-1.5 text-xs font-body font-medium transition-colors ${
                  category === cat
                    ? 'bg-emerald-600 text-white shadow-soft'
                    : 'border border-slate-200 bg-white text-slate-600 hover:border-emerald-300'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        )}

        {list.isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-3">
            {Array.from({ length: PAGE_SIZE }).map((_, i) => (
              <div key={i} className="h-36 rounded-2xl bg-slate-100/70 animate-pulse" />
            ))}
          </div>
        ) : list.isError ? (
          <div className="rounded-2xl border border-rose-200/70 bg-rose-50/50 p-4 text-rose-700 text-sm">
            Échec du chargement des produits. Vérifiez la connexion backend.
          </div>
        ) : paged.length === 0 ? (
          <div className="rounded-2xl border border-slate-200/70 bg-white/60 p-10 text-center">
            <Package2 size={24} className="mx-auto text-slate-300" />
            <p className="mt-2 text-sm font-semibold text-slate-700">Aucun résultat</p>
            <p className="mt-1 text-sm text-slate-500">
              {isClientUser ? 'Essayez une autre recherche ou catégorie.' : 'Aucun produit ne correspond à votre recherche.'}
            </p>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-3">
              {paged.map((m) => (
                <ProduitCard
                  key={m.id}
                  item={m}
                  isClient={isClientUser}
                  canManage={canManage}
                  isOrdering={createCommandeMut.isPending && createCommandeMut.variables?.lignes?.[0]?.medicamentId === m.id}
                  onCommander={() => createCommandeMut.mutate({
                    lignes: [{ medicamentId: m.id, quantite: 1 }],
                  })}
                  onEdit={() => openEdit(m)}
                  onStock={() => openStock(m)}
                  onDelete={() => { setSelected(m); setModal('delete') }}
                />
              ))}
            </div>

            <Pagination
              page={currentPage}
              totalPages={totalPages}
              onPageChange={setPage}
              totalItems={filteredAndSorted.length}
              itemLabel="produit"
            />
          </>
        )}
      </GlassCard>

      <MedicamentFormModal
        mode={modal === 'edit' ? 'edit' : 'create'}
        open={modal === 'create' || modal === 'edit'}
        form={form}
        setForm={setForm}
        loading={createMedicamentMut.isPending || updateMedicamentMut.isPending}
        onClose={() => setModal(null)}
        onSubmit={() => {
          if (!selected) {
            createMedicamentMut.mutate(form)
            return
          }
          const { quantiteInitiale: _quantiteInitiale, seuilMinimum: _seuilMinimum, ...data } = form
          updateMedicamentMut.mutate({ id: selected.id, data })
        }}
      />

      <Modal open={modal === 'stock'} onClose={() => setModal(null)} title="Mettre à jour le stock">
        <div className="space-y-4">
          <p className="text-sm text-slate-600">{selected?.nom}</p>
          <div className="grid grid-cols-2 gap-3">
            <Input label="Quantité" type="number" value={stockForm.quantite} onChange={(e) => setStockForm((f) => ({ ...f, quantite: Number(e.target.value) }))} />
            <Input label="Seuil minimum" type="number" value={stockForm.seuilMinimum} onChange={(e) => setStockForm((f) => ({ ...f, seuilMinimum: Number(e.target.value) }))} />
          </div>
          <div className="flex justify-end gap-3">
            <Button variant="ghost" onClick={() => setModal(null)}>Annuler</Button>
            <Button loading={updateStockMut.isPending} onClick={() => selected && updateStockMut.mutate({ id: selected.id, ...stockForm })}>
              Enregistrer le stock
            </Button>
          </div>
        </div>
      </Modal>

      <Modal open={modal === 'delete'} onClose={() => setModal(null)} title="Supprimer le médicament" size="sm">
        <div className="space-y-4">
          <p className="text-sm text-slate-600">Supprimer définitivement <strong>{selected?.nom}</strong> ?</p>
          <div className="flex justify-end gap-3">
            <Button variant="ghost" onClick={() => setModal(null)}>Annuler</Button>
            <Button variant="danger" loading={deleteMedicamentMut.isPending} onClick={() => selected && deleteMedicamentMut.mutate(selected.id)}>
              Supprimer
            </Button>
          </div>
        </div>
      </Modal>

      <Modal open={modal === 'alertes'} onClose={() => setModal(null)} title="Alerte rupture de stock" size="lg">
        <div className="space-y-3">
          <div className="flex items-start gap-3 rounded-xl border border-amber-200 bg-amber-50 p-3 text-amber-800">
            <AlertTriangle size={18} className="mt-0.5" />
            <p className="text-sm">
              {alertes.length} produit(s) ont atteint ou dépassé leur seuil minimum.
            </p>
          </div>
          {alertes.map((m) => (
            <div key={m.id} className="flex items-center justify-between rounded-xl border border-slate-200 p-3">
              <div>
                <p className="text-sm font-semibold text-slate-900">{m.nom}</p>
                <p className="text-xs text-slate-500">Stock: {m.stock?.quantite} · Seuil: {m.stock?.seuilMinimum}</p>
              </div>
              <Button size="sm" variant="outline" onClick={() => openStock(m)}>Réapprovisionner</Button>
            </div>
          ))}
        </div>
      </Modal>
    </div>
  )
}

interface ProduitCardProps {
  item: Medicament
  isClient: boolean
  canManage: boolean
  isOrdering: boolean
  onCommander: () => void
  onEdit: () => void
  onStock: () => void
  onDelete: () => void
}

const ProduitCard = ({ item, isClient, canManage, isOrdering, onCommander, onEdit, onStock, onDelete }: ProduitCardProps) => {
  const stock = item.stock?.quantite
  const seuil = item.stock?.seuilMinimum
  const low = stock !== undefined && seuil !== undefined && stock <= seuil
  const outOfStock = (stock ?? 0) <= 0

  return (
    <div className={`rounded-2xl border bg-white p-4 shadow-soft transition-all hover:shadow-card ${
      isClient ? 'border-slate-200/80 hover:border-emerald-200' : 'border-slate-200/80'
    }`}>
      <div className="flex items-start gap-3">
        <div className={`flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl ring-1 ring-inset ${
          isClient ? 'bg-emerald-50 ring-emerald-200 text-emerald-700' : 'bg-teal-50 ring-teal-200 text-teal-700'
        }`}>
          <Pill size={16} />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <h3 className="font-display text-sm font-bold text-slate-900 line-clamp-2">{item.nom}</h3>
            {low && !outOfStock && (
              <span className="rounded-full bg-amber-50 text-amber-700 border border-amber-200 px-2 py-0.5 text-2xs font-semibold flex-shrink-0">
                Stock bas
              </span>
            )}
            {outOfStock && isClient && (
              <span className="rounded-full bg-slate-100 text-slate-600 border border-slate-200 px-2 py-0.5 text-2xs font-semibold flex-shrink-0">
                Indisponible
              </span>
            )}
          </div>
          <p className="mt-0.5 text-2xs font-medical uppercase tracking-wide text-slate-400">
            {item.categorie ?? 'Non catégorisé'}
          </p>
        </div>
      </div>
      {item.description && <p className="mt-2 text-xs text-slate-600 line-clamp-2 pl-[52px]">{item.description}</p>}
      <div className="mt-4 grid grid-cols-2 gap-2 text-xs">
        <div className={`rounded-xl border p-2.5 ${isClient ? 'bg-emerald-50/50 border-emerald-100' : 'bg-slate-50 border-slate-200/80'}`}>
          <p className="text-slate-500 text-2xs">Prix CDF</p>
          <p className="font-mono font-bold text-slate-800 mt-0.5">{Number(item.prixCDF ?? 0).toLocaleString('fr-FR')}</p>
        </div>
        <div className="rounded-xl bg-slate-50 border border-slate-200/80 p-2.5">
          <p className="text-slate-500 text-2xs">Prix USD</p>
          <p className="font-mono font-bold text-slate-800 mt-0.5">{Number(item.prixUSD ?? 0).toFixed(2)} $</p>
        </div>
      </div>
      {!isClient && (
        <div className="mt-2 text-2xs text-slate-500">
          {stock !== undefined ? `Stock: ${stock} ${item.unite ?? 'u.'}` : 'Stock indisponible'}
        </div>
      )}
      {isClient && (
        <Button
          className={`w-full mt-3 ${!outOfStock ? 'bg-emerald-600 hover:bg-emerald-700' : ''}`}
          size="sm"
          icon={<ShoppingCart size={13} />}
          loading={isOrdering}
          onClick={onCommander}
          disabled={outOfStock}
        >
          {outOfStock ? 'Indisponible' : 'Commander'}
        </Button>
      )}
      {canManage && (
        <div className="mt-3 flex flex-wrap gap-2">
          <Button variant="outline" size="sm" onClick={onStock} icon={<PackagePlus size={13} />}>Stock</Button>
          <Button variant="ghost" size="sm" onClick={onEdit} icon={<Edit2 size={13} />}>Modifier</Button>
          <Button variant="danger" size="sm" onClick={onDelete} icon={<Trash2 size={13} />}>Supprimer</Button>
        </div>
      )}
    </div>
  )
}

interface MedicamentFormModalProps {
  mode: 'create' | 'edit'
  open: boolean
  form: CreateMedicamentPayload
  setForm: React.Dispatch<React.SetStateAction<CreateMedicamentPayload>>
  loading: boolean
  onClose: () => void
  onSubmit: () => void
}

const MedicamentFormModal = ({ mode, open, form, setForm, loading, onClose, onSubmit }: MedicamentFormModalProps) => (
  <Modal open={open} onClose={onClose} title={mode === 'create' ? 'Ajouter un médicament' : 'Modifier le médicament'} size="lg">
    <form
      onSubmit={(e) => { e.preventDefault(); onSubmit() }}
      className="space-y-4"
    >
      <div className="grid grid-cols-2 gap-3">
        <Input label="Nom" value={form.nom} onChange={(e) => setForm((f) => ({ ...f, nom: e.target.value }))} />
        <Input label="Catégorie" value={form.categorie} onChange={(e) => setForm((f) => ({ ...f, categorie: e.target.value }))} />
      </div>
      <Input label="Description" value={form.description ?? ''} onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))} />
      <div className="grid grid-cols-3 gap-3">
        <Input label="Prix CDF" type="number" value={form.prixCDF} onChange={(e) => setForm((f) => ({ ...f, prixCDF: Number(e.target.value) }))} />
        <Input label="Prix USD" type="number" value={form.prixUSD} onChange={(e) => setForm((f) => ({ ...f, prixUSD: Number(e.target.value) }))} />
        <Input label="Unité" value={form.unite} onChange={(e) => setForm((f) => ({ ...f, unite: e.target.value }))} />
      </div>
      {mode === 'create' && (
        <div className="grid grid-cols-2 gap-3">
          <Input label="Quantité initiale" type="number" value={form.quantiteInitiale ?? 0} onChange={(e) => setForm((f) => ({ ...f, quantiteInitiale: Number(e.target.value) }))} />
          <Input label="Seuil minimum" type="number" value={form.seuilMinimum ?? 10} onChange={(e) => setForm((f) => ({ ...f, seuilMinimum: Number(e.target.value) }))} />
        </div>
      )}
      <div className="flex justify-end gap-3 pt-3 border-t border-slate-100">
        <Button type="button" variant="ghost" onClick={onClose}>Annuler</Button>
        <Button type="submit" loading={loading}>{mode === 'create' ? 'Créer' : 'Sauvegarder'}</Button>
      </div>
    </form>
  </Modal>
)

