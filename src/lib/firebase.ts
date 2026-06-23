import { getApp, getApps, initializeApp, type FirebaseApp } from 'firebase/app'
import { getAuth, type Auth } from 'firebase/auth'
import { getFirestore, type Firestore } from 'firebase/firestore'
import { firebaseConfig, hasFirebaseConfig } from './env'

export const app: FirebaseApp = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig)
export const auth: Auth = getAuth(app)
export const db: Firestore = getFirestore(app)

if (import.meta.env.DEV) {
  console.info('[TrackDocs][Firebase]', {
    projectId: firebaseConfig.projectId,
    authDomain: firebaseConfig.authDomain,
    envLoaded: hasFirebaseConfig(),
  })
}

export { app as firebaseApp }
