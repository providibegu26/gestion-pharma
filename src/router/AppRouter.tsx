import { lazy, Suspense } from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import { ProtectedRoute, GuestRoute } from './ProtectedRoute'
import { PageLoader } from '@/components/ui/PageLoader'

// ─── Layouts ─────────────────────────────────────────────────────────────────
const AdminLayout = lazy(() =>
  import('@/components/layout/AdminLayout').then((m) => ({ default: m.AdminLayout })),
)

// ─── Pages publiques ─────────────────────────────────────────────────────────
const AccueilPage = lazy(() =>
  import('@/pages/public/AccueilPage').then((m) => ({ default: m.AccueilPage })),
)

// ─── Auth ─────────────────────────────────────────────────────────────────────
const LoginPage = lazy(() =>
  import('@/pages/auth/LoginPage').then((m) => ({ default: m.LoginPage })),
)
const LoginClientPage = lazy(() =>
  import('@/pages/auth/LoginClientPage').then((m) => ({ default: m.LoginClientPage })),
)
const RegisterClientPage = lazy(() =>
  import('@/pages/auth/RegisterClientPage').then((m) => ({ default: m.RegisterClientPage })),
)

// ─── Tableau de bord (switcher par rôle) ─────────────────────────────────────
const DashboardPage = lazy(() =>
  import('@/pages/dashboard/DashboardPage').then((m) => ({ default: m.DashboardPage })),
)

// ─── Pages ADMIN ─────────────────────────────────────────────────────────────
const UtilisateursPage = lazy(() =>
  import('@/pages/utilisateurs/UtilisateursPage').then((m) => ({ default: m.UtilisateursPage })),
)
const RolesPage = lazy(() =>
  import('@/pages/roles/RolesPage').then((m) => ({ default: m.RolesPage })),
)

// ─── Pages PHARMACIEN ────────────────────────────────────────────────────────
const ProduitsPage = lazy(() =>
  import('@/pages/produits/ProduitsPage').then((m) => ({ default: m.ProduitsPage })),
)
const CommandesPage = lazy(() =>
  import('@/pages/commandes/CommandesPage').then((m) => ({ default: m.CommandesPage })),
)
const FileAttentePage = lazy(() =>
  import('@/pages/file-attente/FileAttentePage').then((m) => ({ default: m.FileAttentePage })),
)

// ─── Pages CAISSIER ──────────────────────────────────────────────────────────
const VentesPage = lazy(() =>
  import('@/pages/ventes/VentesPage').then((m) => ({ default: m.VentesPage })),
)

export const AppRouter = () => (
  <Suspense fallback={<PageLoader />}>
    <Routes>
      {/* ─── Accueil public ─────────────────────────────────────────────────── */}
      <Route path="/" element={<AccueilPage />} />

      {/* ─── Auth (invité uniquement) ─────────────────────────────────────── */}
      <Route element={<GuestRoute />}>
        <Route path="/login-staff" element={<LoginPage />} />
        <Route path="/connexion"   element={<LoginClientPage />} />
        <Route path="/inscription" element={<RegisterClientPage />} />
        <Route path="/login"    element={<Navigate to="/login-staff" replace />} />
        <Route path="/register" element={<Navigate to="/inscription" replace />} />
      </Route>

      {/* ─────────────────────────────────────────────────────────────────────
          Espace ADMIN — gestion du personnel uniquement
          Backend → 403 sur toute route hors /users & /roles
         ───────────────────────────────────────────────────────────────────── */}
      <Route element={<ProtectedRoute roles={['ADMIN']} />}>
        <Route element={<AdminLayout />}>
          <Route path="/admin" element={<Navigate to="/professionnel/tableau-de-bord" replace />} />
          <Route path="/professionnel/tableau-de-bord" element={<DashboardPage />} />
          <Route path="/professionnel/utilisateurs"    element={<UtilisateursPage />} />
          <Route path="/professionnel/roles"           element={<RolesPage />} />
        </Route>
      </Route>

      {/* ─────────────────────────────────────────────────────────────────────
          Espace PHARMACIEN — médicaments, commandes, file pharmacie
         ───────────────────────────────────────────────────────────────────── */}
      <Route element={<ProtectedRoute roles={['PHARMACIEN']} />}>
        <Route element={<AdminLayout />}>
          <Route path="/professionnel" element={<Navigate to="/professionnel/tableau-de-bord" replace />} />
          <Route path="/professionnel/tableau-de-bord" element={<DashboardPage />} />
          <Route path="/professionnel/produits"     element={<ProduitsPage />} />
          <Route path="/professionnel/commandes"    element={<CommandesPage />} />
          <Route path="/professionnel/file-attente" element={<FileAttentePage />} />
        </Route>
      </Route>

      {/* ─────────────────────────────────────────────────────────────────────
          Espace CAISSIER — ventes, CA, catalogue lecture, file caisse
          Aucun accès aux commandes médicales ni à la gestion des comptes.
         ───────────────────────────────────────────────────────────────────── */}
      <Route element={<ProtectedRoute roles={['CAISSIER']} />}>
        <Route element={<AdminLayout />}>
          <Route path="/professionnel/tableau-de-bord" element={<DashboardPage />} />
          <Route path="/professionnel/ventes"          element={<VentesPage />} />
          <Route path="/professionnel/produits"        element={<ProduitsPage />} />
          <Route path="/professionnel/file-attente"    element={<FileAttentePage />} />
        </Route>
      </Route>

      {/* ─────────────────────────────────────────────────────────────────────
          Espace CLIENT — commander, suivre ses commandes
         ───────────────────────────────────────────────────────────────────── */}
      <Route element={<ProtectedRoute roles={['CLIENT']} />}>
        <Route element={<AdminLayout />}>
          <Route path="/client"                  element={<Navigate to="/client/tableau-de-bord" replace />} />
          <Route path="/client/tableau-de-bord"  element={<DashboardPage />} />
          <Route path="/client/produits"         element={<ProduitsPage />} />
          <Route path="/client/commandes"        element={<CommandesPage />} />
        </Route>
      </Route>

      {/* Aliases legacy */}
      <Route path="/admin/produits"     element={<Navigate to="/professionnel/produits" replace />} />
      <Route path="/admin/utilisateurs" element={<Navigate to="/professionnel/utilisateurs" replace />} />
      <Route path="/admin/commandes"    element={<Navigate to="/professionnel/commandes" replace />} />

      {/* ─── Fallback ────────────────────────────────────────────────────── */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  </Suspense>
)
