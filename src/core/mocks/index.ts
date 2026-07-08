/**
 * Point d'entrée des handlers de mocks.
 *
 * Utilisé uniquement par `MockHttpClient` pour enregistrer les routes
 * simulées des modules actifs (auth, users, commandes).
 */
export type { MockHandler, MockHandlerContext, MockMethod, RegisterMockFn } from './types'
export { registerAuthMocks } from './auth.mocks'
export { registerUsersMocks } from './users.mocks'
export { registerCommandesMocks } from './commandes.mocks'
export { registerMedicamentsMocks } from './medicaments.mocks'
export { registerStockMocks } from './stock.mocks'
