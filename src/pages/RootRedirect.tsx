import { Navigate } from 'react-router-dom'
import { LoadingState } from '../components/LoadingState'
import { useAuth } from '../auth/useAuth'
import { roleHomePath } from '../lib/roles'

export function RootRedirect() {
  const { session, loading } = useAuth()

  if (loading) {
    return (
      <div className="trackdocs-page px-4 py-8">
        <LoadingState />
      </div>
    )
  }

  if (!session) {
    return <Navigate to="/login" replace />
  }

  return <Navigate to={roleHomePath[session.role]} replace />
}
