/**
 * Point d'entrée public des adaptateurs React.
 * 
 * Cette couche est volontairement séparée du `core/` :
 * - `core/` contient la logique métier framework-agnostic.
 * - `adapters/react/` fait uniquement la liaison avec React.
 *
 * En cas de migration Angular/Vue, ce dossier est remplacé par
 * `adapters/angular/` ou `adapters/vue/` sans toucher au `core/`.
 */
export { ServicesProvider, useServices } from './ServicesContext'
export type { ServicesProviderProps } from './ServicesContext'
export * from './hooks'
