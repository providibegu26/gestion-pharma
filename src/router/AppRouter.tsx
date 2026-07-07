import { lazy, Suspense } from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import { ProtectedRoute, GuestRoute } from './ProtectedRoute'
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
        {/* Alias historiques */}
        <Route path="/login"    element={<Navigate to="/login-staff" replace />} />
        <Route path="/register" element={<Navigate to="/inscription" replace />} />
      </Route>

      {/* ─── Espace professionnel (pharmacien/staff) ────────────────────── */}
      <Route element={<ProtectedRoute roles={['ADMIN', 'PHARMACIEN', 'CAISSIER']} />}>
        <Route element={<AdminLayout />}>
          <Route path="/admin"              element={<Navigate to="/professionnel/commandes" replace />} />
          <Route path="/professionnel"      element={<Navigate to="/professionnel/commandes" replace />} />
          <Route path="/professionnel/produits" element={<ProduitsPage />} />
          <Route path="/professionnel/utilisateurs" element={<UtilisateursPage />} />
          <Route path="/professionnel/commandes" element={<CommandesPage />} />

          {/* Alias legacy pour ne pas casser d'anciens liens */}
          <Route path="/admin/produits"     element={<Navigate to="/professionnel/produits" replace />} />
          <Route path="/admin/utilisateurs" element={<UtilisateursPage />} />
          <Route path="/admin/commandes"    element={<CommandesPage />} />
        </Route>
      </Route>

      {/* ─── Espace client (mêmes commandes mais filtrées côté backend) ──── */}
      <Route element={<ProtectedRoute roles={['CLIENT']} />}>
        <Route element={<AdminLayout />}>
          <Route path="/client"           element={<Navigate to="/client/produits" replace />} />
          <Route path="/client/produits"  element={<ProduitsPage />} />
          <Route path="/client/commandes" element={<CommandesPage />} />
        </Route>
      </Route>

      {/* ─── Fallback ───────────────────────────────────────────────────── */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  </Suspense>
)
