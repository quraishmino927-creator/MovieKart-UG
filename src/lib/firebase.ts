import { initializeApp, getApps, getApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore, doc, getDocFromServer } from 'firebase/firestore';
import { getStorage, ref, uploadBytesResumable, getDownloadURL } from 'firebase/storage';

const firebaseConfig = {
  apiKey: "AIzaSyBduB6A2ScIAS6Bq9ch7kXQgyIUkW2Xbos",
  authDomain: "moviekart-ug.firebaseapp.com",
  projectId: "moviekart-ug",
  storageBucket: "moviekart-ug.firebasestorage.app",
  messagingSenderId: "879753763456",
  appId: "1:879753763456:web:e1db5d1a0e6ea2bf02a465",
  measurementId: "G-XDK1TXKEXG"
};

const app = getApps().some((a) => a.name === '[DEFAULT]') ? getApp() : initializeApp(firebaseConfig);
const adminApp = getApps().some((a) => a.name === 'admin')
  ? getApp('admin')
  : initializeApp(firebaseConfig, 'admin');
const inviteApp = getApps().some((a) => a.name === 'invite')
  ? getApp('invite')
  : initializeApp(firebaseConfig, 'invite');

// Viewer Firebase instances
export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);

// Isolated Admin Firebase instances
export const adminAuth = getAuth(adminApp);
export const adminDb = getFirestore(adminApp);
export const adminStorage = getStorage(adminApp);

// Isolated secondary Auth instance for inviting Poster accounts without signing Admin out
export const inviteAuth = getAuth(inviteApp);

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
  };
}

export function buildFirestoreErrorInfo(
  error: unknown,
  operationType: OperationType,
  path: string | null
): FirestoreErrorInfo {
  return {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: adminAuth.currentUser?.uid ?? auth.currentUser?.uid ?? null,
      email: adminAuth.currentUser?.email ?? auth.currentUser?.email ?? null,
      emailVerified: auth.currentUser?.emailVerified ?? null,
      isAnonymous: auth.currentUser?.isAnonymous ?? null,
      tenantId: auth.currentUser?.tenantId ?? null,
      providerInfo:
        auth.currentUser?.providerData?.map((provider) => ({
          providerId: provider.providerId,
          email: provider.email,
        })) || [],
    },
    operationType,
    path,
  };
}

export function handleFirestoreError(
  error: unknown,
  operationType: OperationType,
  path: string | null
): never {
  const errInfo = buildFirestoreErrorInfo(error, operationType, path);
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

export async function testFirestoreConnection(): Promise<void> {
  try {
    await getDocFromServer(doc(db, 'test', 'connection'));
  } catch (error) {
    if (error instanceof Error && error.message.includes('the client is offline')) {
      console.error('Please check your Firebase configuration.');
    }
  }
}

export function uploadFileToStorage(
  file: File,
  folder: 'posters' | 'videos' | 'avatars',
  onProgress?: (progressPercent: number, transferredMb: number, totalMb: number) => void,
  useAdminStorage: boolean = true
): Promise<string> {
  return new Promise((resolve, reject) => {
    const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, '_');
    const targetStorage = useAdminStorage ? adminStorage : storage;
    const storageRef = ref(targetStorage, `${folder}/${Date.now()}_${safeName}`);
    const uploadTask = uploadBytesResumable(storageRef, file);

    uploadTask.on(
      'state_changed',
      (snapshot) => {
        const percent = Math.round((snapshot.bytesTransferred / snapshot.totalBytes) * 100);
        const transferredMb = +(snapshot.bytesTransferred / (1024 * 1024)).toFixed(1);
        const totalMb = +(snapshot.totalBytes / (1024 * 1024)).toFixed(1);
        if (onProgress) {
          onProgress(percent, transferredMb, totalMb);
        }
      },
      (error) => {
        reject(error);
      },
      async () => {
        try {
          const downloadUrl = await getDownloadURL(uploadTask.snapshot.ref);
          resolve(downloadUrl);
        } catch (err) {
          reject(err);
        }
      }
    );
  });
}
