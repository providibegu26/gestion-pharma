import { Component, type ErrorInfo, type ReactNode } from 'react'

interface ErrorBoundaryProps {
  children: ReactNode
}

interface ErrorBoundaryState {
  hasError: boolean
  error?: Error
}

/**
 * Garde-fou global : capture les erreurs de rendu React pour éviter la page
 * blanche. Affiche un message clair + un bouton de rechargement plutôt qu'un
 * écran vide impossible à diagnostiquer pour l'utilisateur.
 */
export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  state: ErrorBoundaryState = { hasError: false }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error }
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    // Trace développeur (visible dans la console, pas dans l'UI).
    console.error('[ErrorBoundary] Erreur de rendu capturée :', error, info)
  }

  private handleReset = () => {
    this.setState({ hasError: false, error: undefined })
  }

  render() {
    if (!this.state.hasError) return this.props.children

    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 px-4">
        <div className="max-w-md w-full rounded-2xl border border-slate-200 bg-white p-8 shadow-card text-center">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-rose-100 text-rose-600">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M10.29 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
              <line x1="12" y1="9" x2="12" y2="13" />
              <line x1="12" y1="17" x2="12.01" y2="17" />
            </svg>
          </div>
          <h1 className="font-display text-lg font-bold text-slate-900">Une erreur est survenue</h1>
          <p className="mt-2 font-body text-sm text-slate-500">
            Cette page a rencontré un problème inattendu. Vous pouvez réessayer ou revenir à l'accueil.
          </p>
          {this.state.error?.message && (
            <p className="mt-3 rounded-lg bg-slate-50 border border-slate-100 px-3 py-2 font-mono text-2xs text-slate-500 break-words">
              {this.state.error.message}
            </p>
          )}
          <div className="mt-6 flex items-center justify-center gap-3">
            <button
              onClick={this.handleReset}
              className="rounded-xl bg-teal-600 px-4 py-2 font-body text-sm font-semibold text-white hover:bg-teal-700 transition-colors"
            >
              Réessayer
            </button>
            <a
              href="/"
              className="rounded-xl border border-slate-200 px-4 py-2 font-body text-sm font-semibold text-slate-700 hover:bg-slate-50 transition-colors"
            >
              Accueil
            </a>
          </div>
        </div>
      </div>
    )
  }
}
