import { initializeApp, getApps, getApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';
import firebaseAppletConfig from '../../firebase-applet-config.json';

export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

export interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
    isAnonymous?: boolean | null;
    tenantId?: string | null;
    providerInfo?: {
      providerId?: string | null;
      email?: string | null;
    }[];
  }
}

const firebaseConfig = {
  apiKey: firebaseAppletConfig.apiKey || "",
  authDomain: firebaseAppletConfig.authDomain || "",
  projectId: firebaseAppletConfig.projectId || "",
  storageBucket: firebaseAppletConfig.storageBucket || "",
  messagingSenderId: firebaseAppletConfig.messagingSenderId || "",
  appId: firebaseAppletConfig.appId || ""
};

let app;
let auth: any = null;
let db: any = null;
let storage: any = null;
let isFirebaseConfigured = false;

try {
  if (firebaseConfig.apiKey && firebaseConfig.projectId) {
    app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();
    auth = getAuth(app);
    
    const dbId = (firebaseAppletConfig as any).firestoreDatabaseId;
    if (dbId && dbId !== "(default)") {
      db = getFirestore(app, dbId);
    } else {
      db = getFirestore(app);
    }
    
    storage = getStorage(app);
    isFirebaseConfigured = true;
    console.log("Firebase initialized successfully with config:", firebaseConfig.projectId);
  } else {
    console.warn("Firebase configuration is missing. Running in high-fidelity offline mode.");
  }
} catch (error) {
  console.error("Firebase initialization failed:", error);
}

export function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null) {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth?.currentUser?.uid,
      email: auth?.currentUser?.email,
      emailVerified: auth?.currentUser?.emailVerified,
      isAnonymous: auth?.currentUser?.isAnonymous,
      tenantId: auth?.currentUser?.tenantId,
      providerInfo: auth?.currentUser?.providerData?.map((provider: any) => ({
        providerId: provider.providerId,
        email: provider.email,
      })) || []
    },
    operationType,
    path
  };
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

export { auth, db, storage, isFirebaseConfigured };

