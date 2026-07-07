/**
 * ─────────────────────────────────────────────────────────────────────────────
 *  useMedicaments — Hook React encapsulant MedicamentsService + StockService
 * ─────────────────────────────────────────────────────────────────────────────
 *  Catalogue (lecture, public) :
 *   - list()    => GET /medicaments
 *   - getById() => GET /medicaments/:id
 *
 *  CRUD (PHARMACIEN uniquement, protégé par `can('produits.manage')`) :
 *   - create()      => POST   /medicaments
 *   - update()      => PATCH  /medicaments/:id
 *   - remove()      => DELETE /medicaments/:id
 *   - updateStock() => PATCH  /stock/:medicamentId
 *   - getAlertes()  => GET    /stock/alertes
 * ─────────────────────────────────────────────────────────────────────────────
 */

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import type {
  CreateMedicamentPayload,
  UpdateMedicamentPayload,
  UpdateStockPayload,
} from '@/core'
import { useServices } from '../ServicesContext'

const MEDICAMENTS_KEY = ['medicaments'] as const
const ALERTES_KEY = ['stock-alertes'] as const

export const useMedicaments = () => {
  const { medicaments, stock } = useServices()
  const qc = useQueryClient()

  const list = useQuery({
    queryKey: MEDICAMENTS_KEY,
    queryFn: () => medicaments.list(),
    staleTime: 5 * 60_000,
  })

  const alertes = useQuery({
    queryKey: ALERTES_KEY,
    queryFn: () => stock.getAlertes(),
    staleTime: 60_000,
  })

  const invalidate = () => qc.invalidateQueries({ queryKey: MEDICAMENTS_KEY })

  const create = useMutation({
    mutationFn: (payload: CreateMedicamentPayload) => medicaments.create(payload),
    onSuccess: invalidate,
  })

  const update = useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateMedicamentPayload }) =>
      medicaments.update(id, data),
    onSuccess: invalidate,
  })

  const remove = useMutation({
    mutationFn: (id: string) => medicaments.remove(id),
    onSuccess: invalidate,
  })

  const updateStock = useMutation({
    mutationFn: ({ medicamentId, payload }: { medicamentId: string; payload: UpdateStockPayload }) =>
      stock.update(medicamentId, payload),
    onSuccess: () => {
      invalidate()
      qc.invalidateQueries({ queryKey: ALERTES_KEY })
    },
  })

  return { list, alertes, create, update, remove, updateStock }
}

export const useMedicament = (id: string | undefined) => {
  const { medicaments } = useServices()
  return useQuery({
    queryKey: ['medicaments', id],
    queryFn: () => medicaments.getById(id as string),
    enabled: !!id,
    staleTime: 5 * 60_000,
  })
}
