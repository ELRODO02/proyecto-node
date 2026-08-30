import { applicationDefault, getApps, initializeApp } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore'
import { env } from './env.js'

const firebaseApp = getApps().length > 0 ? getApps()[0] : initializeApp({
    credential: applicationDefault(),
    projectId: env.FIREBASE_PROJECT_ID
})



export const db= getFirestore(firebaseApp)