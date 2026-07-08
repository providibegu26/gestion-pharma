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
          Espace PROFESSIONNEL — un seul groupe de routes partagé.
          IMPORTANT : chaque chemin ne doit être déclaré QU'UNE fois.
          (Déclarer le même path dans plusieurs groupes gardés par rôle
          provoque une boucle de redirection infinie → page blanche.)
          Le contrôle fin par rôle se fait via des gardes imbriqués par page.
         ───────────────────────────────────────────────────────────────────── */}
      <Route element={<ProtectedRoute roles={['ADMIN', 'PHARMACIEN', 'CAISSIER']} />}>
        <Route element={<AdminLayout />}>
          <Route path="/admin"          element={<Navigate to="/professionnel/tableau-de-bord" replace />} />
          <Route path="/professionnel"  element={<Navigate to="/professionnel/tableau-de-bord" replace />} />

          {/* Dashboard commun : le switcher interne affiche la vue du rôle */}
          <Route path="/professionnel/tableau-de-bord" element={<DashboardPage />} />

          {/* Admin uniquement : gestion des comptes */}
          <Route element={<ProtectedRoute roles={['ADMIN']} />}>
            <Route path="/professionnel/utilisateurs" element={<UtilisateursPage />} />
            <Route path="/professionnel/roles"        element={<RolesPage />} />
          </Route>

          {/* Pharmacien uniquement : commandes médicales */}
          <Route element={<ProtectedRoute roles={['PHARMACIEN']} />}>
            <Route path="/professionnel/commandes" element={<CommandesPage />} />
          </Route>

          {/* Caissier uniquement : ventes & chiffre d'affaires */}
          <Route element={<ProtectedRoute roles={['CAISSIER']} />}>
            <Route path="/professionnel/ventes" element={<VentesPage />} />
          </Route>

          {/* Pharmacien + Caissier : catalogue et file d'attente */}
          <Route element={<ProtectedRoute roles={['PHARMACIEN', 'CAISSIER']} />}>
            <Route path="/professionnel/produits"     element={<ProduitsPage />} />
            <Route path="/professionnel/file-attente" element={<FileAttentePage />} />
          </Route>
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
