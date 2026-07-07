import { lazy, Suspense } from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import { ProtectedRoute, GuestRoute } from './ProtectedRoute'
import { PermissionRoute } from './PermissionRoute'
import { PageLoader } from '@/components/ui/PageLoader'

// ─── Layouts ─────────────────────────────────────────────────────────────────
const AdminLayout = lazy(() =>
  import('@/components/layout/AdminLayout').then((m) => ({ default: m.AdminLayout })),
)

// ─── Pages ───────────────────────────────────────────────────────────────────
const LoginPage = lazy(() =>
  import('@/pages/auth/LoginPage').then((m) => ({ default: m.LoginPage })),
)
const LoginClientPage = lazy(() =>
  import('@/pages/auth/LoginClientPage').then((m) => ({ default: m.LoginClientPage })),
)
const RegisterClientPage = lazy(() =>
  import('@/pages/auth/RegisterClientPage').then((m) => ({ default: m.RegisterClientPage })),
)
const UtilisateursPage = lazy(() =>
  import('@/pages/utilisateurs/UtilisateursPage').then((m) => ({ default: m.UtilisateursPage })),
)
const CommandesPage = lazy(() =>
  import('@/pages/commandes/CommandesPage').then((m) => ({ default: m.CommandesPage })),
)
const ProduitsPage = lazy(() =>
  import('@/pages/produits/ProduitsPage').then((m) => ({ default: m.ProduitsPage })),
)
const AccueilPage = lazy(() =>
  import('@/pages/public/AccueilPage').then((m) => ({ default: m.AccueilPage })),
)
const DashboardPage = lazy(() =>
  import('@/pages/dashboard/DashboardPage').then((m) => ({ default: m.DashboardPage })),
)
const RolesPage = lazy(() =>
  import('@/pages/roles/RolesPage').then((m) => ({ default: m.RolesPage })),
)
const FileAttentePage = lazy(() =>
  import('@/pages/file-attente/FileAttentePage').then((m) => ({ default: m.FileAttentePage })),
)

export const AppRouter = () => (
  <Suspense fallback={<PageLoader />}>
    <Routes>
      {/* ─── Accueil publique ─────────────────────────────────────────────── */}
      <Route path="/" element={<AccueilPage />} />

      {/* ─── Auth (invité uniquement) ──────────────────────────────────── */}
      <Route element={<GuestRoute />}>
        <Route path="/login-staff" element={<LoginPage />} />
        <Route path="/connexion"   element={<LoginClientPage />} />
        <Route path="/inscription" element={<RegisterClientPage />} />
        <Route path="/login"    element={<Navigate to="/login-staff" replace />} />
        <Route path="/register" element={<Navigate to="/inscription" replace />} />
      </Route>

      {/* ─── Espace professionnel (staff) ─────────────────────────────── */}
      <Route element={<ProtectedRoute roles={['ADMIN', 'PHARMACIEN', 'CAISSIER']} />}>
        <Route element={<AdminLayout />}>
          <Route path="/admin"              element={<Navigate to="/professionnel/dashboard" replace />} />
          <Route path="/professionnel"      element={<Navigate to="/professionnel/dashboard" replace />} />
          <Route path="/professionnel/dashboard" element={<DashboardPage />} />
          <Route path="/professionnel/produits" element={<ProduitsPage />} />
          <Route path="/professionnel/commandes" element={<CommandesPage />} />
          <Route path="/professionnel/file-attente" element={<FileAttentePage />} />

          <Route element={<PermissionRoute permission="users:manage" />}>
            <Route path="/professionnel/utilisateurs" element={<UtilisateursPage />} />
          </Route>
          <Route element={<PermissionRoute permission="roles:manage" />}>
            <Route path="/professionnel/roles" element={<RolesPage />} />
          </Route>

          {/* Alias legacy */}
          <Route path="/admin/produits"     element={<Navigate to="/professionnel/produits" replace />} />
          <Route path="/admin/utilisateurs" element={<Navigate to="/professionnel/utilisateurs" replace />} />
          <Route path="/admin/commandes"    element={<Navigate to="/professionnel/commandes" replace />} />
        </Route>
      </Route>

      {/* ─── Espace client ─────────────────────────────────────────────── */}
      <Route element={<ProtectedRoute roles={['CLIENT']} />}>
        <Route element={<AdminLayout />}>
          <Route path="/client"           element={<Navigate to="/client/dashboard" replace />} />
          <Route path="/client/dashboard" element={<DashboardPage />} />
          <Route path="/client/produits"  element={<ProduitsPage />} />
          <Route path="/client/commandes" element={<CommandesPage />} />
        </Route>
      </Route>

      {/* ─── Fallback ───────────────────────────────────────────────────── */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  </Suspense>
)
