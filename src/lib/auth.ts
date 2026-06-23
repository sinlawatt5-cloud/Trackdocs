import {
  onAuthStateChanged,
  signInWithEmailAndPassword,
  signOut,
  type User,
  type UserCredential,
} from 'firebase/auth'
import { doc, getDoc } from 'firebase/firestore'
import { auth, db } from './firebase'
import type { UserProfile, UserRole } from '../types'

export interface LoginCredentials {
  email: string
  password: string
}

export interface AuthSession {
  currentUser: User
  userProfile: UserProfile
}

function isUserRole(value: unknown): value is UserRole {
  return value === 'customer' || value === 'operation' || value === 'admin'
}

function getFirebaseAuthErrorCode(error: unknown) {
  if (!error || typeof error !== 'object') {
    return ''
  }

  const code = (error as { code?: unknown }).code
  return typeof code === 'string' ? code : ''
}

function mapFirebaseAuthError(error: unknown) {
  const code = getFirebaseAuthErrorCode(error)

  switch (code) {
    case 'auth/invalid-credential':
      return 'อีเมลหรือรหัสผ่านไม่ถูกต้อง หรือยังไม่มีผู้ใช้นี้ใน Firebase Authentication'
    case 'auth/user-not-found':
      return 'ไม่พบผู้ใช้นี้'
    case 'auth/wrong-password':
      return 'รหัสผ่านไม่ถูกต้อง'
    case 'auth/invalid-email':
      return 'รูปแบบอีเมลไม่ถูกต้อง'
    case 'auth/operation-not-allowed':
      return 'ยังไม่ได้เปิด Email/Password provider ใน Firebase'
    case 'auth/user-disabled':
      return 'บัญชีนี้ถูกปิดใช้งาน'
    default:
      return error instanceof Error ? error.message : 'เข้าสู่ระบบไม่สำเร็จ'
  }
}

function debugAuth(message: string, payload?: Record<string, unknown>) {
  if (import.meta.env.DEV) {
    console.info(`[TrackDocs][Auth] ${message}`, payload ?? {})
  }
}

async function signOutSafely() {
  try {
    await signOut(auth)
  } catch {
    return
  }
}

async function readUserProfile(user: User): Promise<UserProfile> {
  const snapshot = await getDoc(doc(db, 'users', user.uid))
  debugAuth('users/{uid} lookup', {
    uid: user.uid,
    email: user.email,
    exists: snapshot.exists(),
  })

  if (!snapshot.exists()) {
    await signOutSafely()
    throw new Error('ไม่พบข้อมูลสิทธิ์ผู้ใช้งาน กรุณาติดต่อผู้ดูแลระบบ')
  }

  const data = snapshot.data() as Partial<UserProfile>

  if (data.isActive === false) {
    await signOutSafely()
    throw new Error('บัญชีนี้ถูกปิดใช้งาน')
  }

  if (!isUserRole(data.role)) {
    await signOutSafely()
    throw new Error('ไม่พบข้อมูลสิทธิ์ผู้ใช้งาน กรุณาติดต่อผู้ดูแลระบบ')
  }

  return {
    uid: user.uid,
    displayName: data.displayName?.trim() || user.displayName || user.email || 'TrackDocs User',
    email: data.email?.trim() || user.email || '',
    role: data.role,
    customerId: data.customerId ?? null,
    customerCode: data.customerCode ?? null,
    isActive: data.isActive ?? true,
  }
}

async function createSessionFromCredential(credential: UserCredential): Promise<AuthSession> {
  const userProfile = await readUserProfile(credential.user)

  return {
    currentUser: credential.user,
    userProfile,
  }
}

export async function loginWithEmailPassword(credentials: LoginCredentials): Promise<AuthSession> {
  const email = credentials.email.trim().toLowerCase()
  const password = credentials.password
  try {
    const credential = await signInWithEmailAndPassword(auth, email, password)
    const session = await createSessionFromCredential(credential)

    debugAuth('login success', {
      uid: session.currentUser.uid,
      email: session.currentUser.email,
      profileExists: Boolean(session.userProfile),
      role: session.userProfile.role,
    })

    return session
  } catch (error) {
    const code = getFirebaseAuthErrorCode(error)
    debugAuth('login failed', {
      code,
      email,
    })
    throw new Error(mapFirebaseAuthError(error))
  }
}

export async function logoutUser() {
  await signOut(auth)
}

export function subscribeToAuthState(params: {
  onChange: (session: AuthSession | null) => void
  onError?: (message: string) => void
  onReady?: () => void
}) {
  return onAuthStateChanged(auth, async (user) => {
    if (!user) {
      params.onChange(null)
      params.onReady?.()
      return
    }

    try {
      const userProfile = await readUserProfile(user)
      debugAuth('auth state session', {
        uid: user.uid,
        email: user.email,
        profileExists: Boolean(userProfile),
        role: userProfile.role,
      })
      params.onChange({
        currentUser: user,
        userProfile,
      })
    } catch (error) {
      params.onChange(null)
      params.onError?.(
        error instanceof Error ? error.message : 'ไม่สามารถตรวจสอบสถานะผู้ใช้งานได้',
      )
    } finally {
      params.onReady?.()
    }
  })
}
