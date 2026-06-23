import { useEffect } from 'react'
import { Navigate, Outlet, useLocation } from 'react-router-dom'
import { LoadingState } from './LoadingState'
import { useAuth } from '../auth/useAuth'
import { roleHomePath } from '../lib/roles'
import type { Role } from '../types'

interface RoleGuardProps {
  allow: Role[]
}

export function RoleGuard({ allow }: RoleGuardProps) {
  const { session, loading } = useAuth()
  const location = useLocation()

  useEffect(() => {
    document.title = 'TrackDocs'
  }, [])

  if (loading) {
    return (
      <div className="trackdocs-page px-4 py-8">
        <LoadingState />
      </div>
    )
  }

  if (!session) {
    return <Navigate to="/login" replace state={{ from: location }} />
  }

  if (!allow.includes(session.role)) {
    return <Navigate to={roleHomePath[session.role]} replace />
  }

  return <Outlet />
}
