/**
 * Export centralisé des services métier.
 *
 * Ces classes encapsulent les endpoints backend et ne dépendent que de
 * l'interface `HttpClient` (pas de dépendance UI/framework).
 */
export { AuthService } from './AuthService'
export { UsersService } from './UsersService'
export { CommandesService } from './CommandesService'
export { MedicamentsService } from './MedicamentsService'
export { PatientsService } from './PatientsService'
export { FournisseursService } from './FournisseursService'
export { StockService } from './StockService'
export { OrdonnancesService } from './OrdonnancesService'
export { VentesService } from './VentesService'
export { NotificationsService } from './NotificationsService'
