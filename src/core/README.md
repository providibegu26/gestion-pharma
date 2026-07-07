# Core — Couche métier framework-agnostic

Ce dossier contient **100 % du code "moteur"** de l'application :
modèles, accès HTTP, services métier et stores réactifs.

> Règle d'or : **aucun import React, Angular ou Vue**. Si vous voyez
> `from 'react'` ou `@angular/...` ici, c'est un bug.

## Pourquoi ?

Pour pouvoir migrer un jour vers **Angular** ou **Vue** *sans réécrire
la logique métier*. Seule la couche de présentation (pages,
composants UI, hooks) est spécifique au framework et vit dans
`src/adapters/<framework>/` + `src/pages/`.

## Arborescence

```
core/
├── types/        # Modèles partagés avec le backend (User, Commande…)
├── http/         # Abstraction HTTP — bascule Axios ⇄ Fetch
│   ├── HttpClient.ts        # Interface unique
│   ├── AxiosHttpClient.ts   # Implémentation Axios
│   ├── FetchHttpClient.ts   # Implémentation fetch natif
│   ├── HttpError.ts         # Erreur normalisée (jamais d'AxiosError)
│   └── index.ts             # Factory + sélection via VITE_HTTP_CLIENT
├── services/     # Logique métier (consomme HttpClient)
│   ├── AuthService.ts
│   ├── UsersService.ts
│   └── CommandesService.ts
├── stores/       # Stores réactifs framework-agnostiques
│   ├── Observable.ts        # Mini-store observable (50 LOC)
│   └── AuthStore.ts
└── bootstrap.ts  # Composition root : assemble HTTP → services → stores
```

## Comment basculer Axios → Fetch

**Une seule variable à changer** :

```bash
# .env
VITE_HTTP_CLIENT=fetch     # ou 'axios' (défaut)
```

Aucun service, aucune page n'a besoin d'être touché.
La fonctionnalité est strictement équivalente : refresh automatique
sur 401, file d'attente des requêtes pendant le refresh, mapping
unifié vers `HttpError`, etc.

Bascule programmatique aussi possible :

```ts
import { createCore } from '@/core'
const core = createCore({ httpClientKind: 'fetch' })
```

## Comment migrer vers Angular / Vue

Étapes (zéro modification du `core/`) :

1. **Garder** tout `src/core/` tel quel.
2. **Créer** `src/adapters/angular/` (ou `src/adapters/vue/`) qui
   expose les services au framework cible.
3. **Réécrire** uniquement `src/pages/` et `src/components/` avec le
   nouveau framework.

### Exemple : adapter Angular

```ts
// src/adapters/angular/services.module.ts
import { NgModule, InjectionToken } from '@angular/core'
import { createCore, type CoreContainer } from '@/core'

export const CORE = new InjectionToken<CoreContainer>('CORE')

@NgModule({
  providers: [
    { provide: CORE, useFactory: () => createCore() },
  ],
})
export class CoreModule {}
```

```ts
// src/adapters/angular/auth.facade.ts
import { Injectable, Inject } from '@angular/core'
import { BehaviorSubject } from 'rxjs'
import type { AuthState } from '@/core'
import { CORE } from './services.module'

@Injectable({ providedIn: 'root' })
export class AuthFacade {
  readonly state$ = new BehaviorSubject<AuthState>(this.core.authStore.getState())

  constructor(@Inject(CORE) private readonly core: ReturnType<typeof createCore>) {
    // Bind le store agnostique vers un BehaviorSubject Angular
    this.core.authStore.subscribe((s) => this.state$.next(s))
  }

  login = this.core.authStore.login
  signOut = this.core.authStore.signOut
}
```

### Exemple : adapter Vue 3 (Composition API)

```ts
// src/adapters/vue/useAuth.ts
import { onMounted, onUnmounted, ref } from 'vue'
import type { AuthState } from '@/core'
import { useServices } from './services'

export const useAuth = () => {
  const { authStore } = useServices()
  const state = ref<AuthState>(authStore.getState())

  let unsub = () => {}
  onMounted(() => { unsub = authStore.subscribe((s) => (state.value = s)) })
  onUnmounted(() => unsub())

  return {
    state,
    login: authStore.login,
    signOut: authStore.signOut,
  }
}
```

```ts
// src/adapters/vue/services.ts
import { inject, type InjectionKey } from 'vue'
import { createCore, type CoreContainer } from '@/core'

export const ServicesKey: InjectionKey<CoreContainer> = Symbol('services')
export const useServices = () => {
  const c = inject(ServicesKey)
  if (!c) throw new Error('Provide createCore() in main.ts')
  return c
}

// main.ts
// app.provide(ServicesKey, createCore())
```

## Pourquoi un `Observable<T>` maison plutôt que Zustand / RxJS ?

- **Zustand** est lié à React (`useStore`) — pas portable.
- **RxJS** est gros (~50 KB) et idiomatique Angular uniquement.
- Notre `Observable<T>` fait ~30 lignes, sans dépendance, compatible
  `useSyncExternalStore` (React), `BehaviorSubject` (Angular via
  bridge) et `reactive()` (Vue via bridge).

## Tests

Tout le core est **trivialement testable** sans framework UI :

```ts
import { createCore } from '@/core'
const core = createCore({ baseURL: 'http://localhost:3000' })
const user = await core.auth.login({ email: '...', motDePasse: '...' })
expect(core.authStore.getUser()).toEqual(user)
```
