const env = import.meta.env

function trim(value: string | undefined) {
  return value?.trim() ?? ''
}

function requireEnv(name: string, value: string | undefined) {
  const normalized = trim(value)
  if (!normalized) {
    throw new Error(`กรุณากำหนด ${name} ในไฟล์ .env.local ให้ครบก่อนใช้งาน TrackDocs`)
  }
  return normalized
}

export const appName = trim(env.VITE_APP_NAME) || 'TrackDocs'
export const isDemoMode = trim(env.VITE_DEMO_MODE).toLowerCase() !== 'false'

export const firebaseApiKey = requireEnv('VITE_FIREBASE_API_KEY', env.VITE_FIREBASE_API_KEY)
export const firebaseAuthDomain = requireEnv('VITE_FIREBASE_AUTH_DOMAIN', env.VITE_FIREBASE_AUTH_DOMAIN)
export const firebaseProjectId = requireEnv('VITE_FIREBASE_PROJECT_ID', env.VITE_FIREBASE_PROJECT_ID)
export const firebaseAppId = requireEnv('VITE_FIREBASE_APP_ID', env.VITE_FIREBASE_APP_ID)
export const r2WorkerUrl = requireEnv('VITE_R2_WORKER_URL', env.VITE_R2_WORKER_URL)

export const firebaseConfig = {
  apiKey: firebaseApiKey,
  authDomain: firebaseAuthDomain,
  projectId: firebaseProjectId,
  appId: firebaseAppId,
}

export function hasFirebaseConfig() {
  return Boolean(firebaseApiKey && firebaseAuthDomain && firebaseProjectId && firebaseAppId)
}
