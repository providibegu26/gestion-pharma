/**
 * ─────────────────────────────────────────────────────────────────────────────
 *  QueueStore — File d'attente locale (framework-agnostic) — REPLI de simulation
 * ─────────────────────────────────────────────────────────────────────────────
 *  Le backend expose désormais /file-attente (voir QueueService). Ce store reste
 *  un REPLI : si l'API est indisponible (démo hors-ligne, backend éteint),
 *  `useQueue` bascule dessus pour garder la file entièrement démontrable.
 *
 *  - Étend Observable<QueueTicket[]> : réactif, compatible useSyncExternalStore.
 *  - Persiste dans localStorage (survit aux rechargements).
 *  - Reproduit fidèlement la logique backend : numérotation, statuts
 *    (EN_ATTENTE → APPELE → EN_COURS → TERMINE | ANNULE), positions et
 *    estimations recalculées, appel automatique du suivant à la fin d'un service.
 * ─────────────────────────────────────────────────────────────────────────────
 */

import type {
  QueueServiceStats,
  QueueStats,
  QueueTicket,
  TypeService,
} from '../types'
import { Observable } from '../stores/Observable'

const STORAGE_KEY = 'pharma-file-attente'

/** Temps moyen par personne (minutes), aligné sur la doc backend. */
const TEMPS_MOYEN: Record<TypeService, number> = { PHARMACIE: 8, CAISSE: 5 }

const safeWindow = (): Window | null => (typeof window === 'undefined' ? null : window)

const load = (): QueueTicket[] => {
  const w = safeWindow()
  if (!w) return []
  try {
    const raw = w.localStorage.getItem(STORAGE_KEY)
    return raw ? (JSON.parse(raw) as QueueTicket[]) : []
  } catch {
    return []
  }
}

const genId = (): string => {
  const w = safeWindow()
  if (w?.crypto?.randomUUID) return w.crypto.randomUUID()
  return `q_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`
}

export class QueueStore extends Observable<QueueTicket[]> {
  constructor() {
    super(load())
    this.subscribe((state) => {
      const w = safeWindow()
      if (!w) return
      try { w.localStorage.setItem(STORAGE_KEY, JSON.stringify(state)) } catch { /* silencieux */ }
    })
  }

  list = (typeService?: TypeService): QueueTicket[] =>
    typeService ? this.getState().filter((t) => t.typeService === typeService) : this.getState()

  private nextNumero = (typeService: TypeService): number => {
    const tickets = this.getState().filter((t) => t.typeService === typeService)
    return tickets.length === 0 ? 1 : Math.max(...tickets.map((t) => t.numeroTicket)) + 1
  }

  /** Recalcule positions + estimations des tickets en attente de chaque guichet. */
  private recompute = (tickets: QueueTicket[]): QueueTicket[] => {
    const counters: Record<TypeService, number> = { PHARMACIE: 0, CAISSE: 0 }
    return tickets.map((t) => {
      if (t.statut !== 'EN_ATTENTE') {
        return { ...t, position: null, estimeeMinutes: t.statut === 'APPELE' ? 0 : t.estimeeMinutes }
      }
      counters[t.typeService] += 1
      const position = counters[t.typeService]
      return { ...t, position, estimeeMinutes: position * TEMPS_MOYEN[t.typeService] }
    })
  }

  /** Ajoute un ticket en fin de file (client connecté ou borne publique). */
  join = (typeService: TypeService, nomAffiche?: string): QueueTicket => {
    const ticket: QueueTicket = {
      id: genId(),
      numeroTicket: this.nextNumero(typeService),
      typeService,
      statut: 'EN_ATTENTE',
      nomAffiche: nomAffiche?.trim() || null,
      position: null,
      estimeeMinutes: null,
      createdAt: new Date().toISOString(),
    }
    this.setState((s) => this.recompute([...s, ticket]))
    return this.getState().find((t) => t.id === ticket.id) ?? ticket
  }

  /** Appelle le prochain client en attente d'un guichet (→ APPELE). */
  callNext = (typeService: TypeService): QueueTicket | null => {
    let called: QueueTicket | null = null
    this.setState((s) => {
      const idx = s.findIndex((t) => t.typeService === typeService && t.statut === 'EN_ATTENTE')
      if (idx === -1) return s
      const updated = s.map((t, i) => (i === idx ? { ...t, statut: 'APPELE' as const } : t))
      called = updated[idx]
      return this.recompute(updated)
    })
    return called
  }

  /** Démarre le service d'un ticket appelé (→ EN_COURS). */
  start = (id: string): void => {
    this.setState((s) =>
      this.recompute(s.map((t) => (t.id === id ? { ...t, statut: 'EN_COURS' } : t))),
    )
  }

  /** Termine un service (→ TERMINE) puis appelle automatiquement le suivant. */
  complete = (id: string): void => {
    this.setState((s) => {
      const target = s.find((t) => t.id === id)
      let next = s.map((t) => (t.id === id ? { ...t, statut: 'TERMINE' as const } : t))
      if (target) {
        const idx = next.findIndex(
          (t) => t.typeService === target.typeService && t.statut === 'EN_ATTENTE',
        )
        if (idx !== -1) next = next.map((t, i) => (i === idx ? { ...t, statut: 'APPELE' as const } : t))
      }
      return this.recompute(next)
    })
  }

  /** Annule un ticket. */
  cancel = (id: string): void => {
    this.setState((s) => this.recompute(s.map((t) => (t.id === id ? { ...t, statut: 'ANNULE' } : t))))
  }

  /** Vide les tickets terminés et annulés (nettoyage de la file). */
  clearFinished = (): void => {
    this.setState((s) =>
      this.recompute(s.filter((t) => !['TERMINE', 'ANNULE'].includes(t.statut))),
    )
  }

  /** Statistiques (mêmes compteurs que GET /file-attente/stats). */
  stats = (): QueueStats => {
    const build = (type: TypeService): QueueServiceStats => {
      const list = this.getState().filter((t) => t.typeService === type)
      const enAttente = list.filter((t) => t.statut === 'EN_ATTENTE').length
      const enCours = list.filter((t) => t.statut === 'EN_COURS' || t.statut === 'APPELE').length
      return { enAttente, enCours, estimeeProchaine: enAttente * TEMPS_MOYEN[type] }
    }
    return { pharmacie: build('PHARMACIE'), caisse: build('CAISSE') }
  }
}
