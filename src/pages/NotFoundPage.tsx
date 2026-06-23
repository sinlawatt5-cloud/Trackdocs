import { Link } from 'react-router-dom'

export function NotFoundPage() {
  return (
    <div className="trackdocs-page flex items-center justify-center px-6">
      <div className="trackdocs-card trackdocs-card-strong max-w-lg p-8 text-center">
        <p className="trackdocs-text-badge text-[var(--td-text-muted)]">404</p>
        <h1 className="mt-3 trackdocs-text-page-title">Page not found</h1>
        <p className="mt-3 trackdocs-text-body text-[var(--td-text-muted)]">
          The requested TrackDocs route does not exist or is not available for this role.
        </p>
        <Link
          to="/login"
          className="trackdocs-button-primary mt-6 inline-flex items-center justify-center rounded-full px-5 py-3 text-sm font-semibold"
        >
          Go to login
        </Link>
      </div>
    </div>
  )
}

