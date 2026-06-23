import { createContext, useEffect, useState, type ReactNode } from 'react'
import type { User } from 'firebase/auth'
import { toast } from 'sonner'
import {
  loginWithEmailPassword,
  logoutUser,
  subscribeToAuthState,
} from '../lib/auth'
import type { LoginCredentials } from '../lib/auth'
import type { Role, SessionUser, UserProfile } from '../types'

export interface AuthContextValue {
  currentUser: User | null
  userProfile: UserProfile | null
  loading: boolean
  login: (email: string, password: string) => Promise<UserProfile>
  logout: () => Promise<void>
  session: SessionUser | null
  signIn: (credentials: LoginCredentials) => Promise<SessionUser>
  signOut: () => Promise<void>
}

export const AuthContext = createContext<AuthContextValue | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [currentUser, setCurrentUser] = useState<User | null>(null)
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const unsubscribe = subscribeToAuthState({
      onChange: (nextSession) => {
        setCurrentUser(nextSession?.currentUser ?? null)
        setUserProfile(nextSession?.userProfile ?? null)
        setLoading(false)
      },
      onError: (message) => {
        toast.error(message)
      },
      onReady: () => {
        setLoading(false)
      },
    })

    return () => {
      unsubscribe()
    }
  }, [])

  async function handleLogin(email: string, password: string) {
    setLoading(true)
    try {
      const nextSession = await loginWithEmailPassword({ email, password })
      setCurrentUser(nextSession.currentUser)
      setUserProfile(nextSession.userProfile)
      return nextSession.userProfile
    } finally {
      setLoading(false)
    }
  }

  async function handleLogout() {
    await logoutUser()
    setCurrentUser(null)
    setUserProfile(null)
  }

  async function handleSignIn(credentials: LoginCredentials) {
    return handleLogin(credentials.email, credentials.password)
  }

  return (
    <AuthContext.Provider
      value={{
        currentUser,
        userProfile,
        loading,
        login: handleLogin,
        logout: handleLogout,
        session: userProfile,
        signIn: handleSignIn,
        signOut: handleLogout,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export function hasRoleAccess(session: SessionUser | null, allowed: Role[]) {
  if (!session) {
    return false
  }

  return allowed.includes(session.role)
}
