
'use client';

import { firebaseConfig } from '@/firebase/config';
import { initializeApp, getApps, getApp, FirebaseApp } from 'firebase/app';
import { getAuth, type Auth, signInAnonymously } from 'firebase/auth';
import { getFirestore, type Firestore } from 'firebase/firestore';
import { getStorage, type FirebaseStorage } from 'firebase/storage';


// IMPORTANT: DO NOT MODIFY THIS FUNCTION
export function initializeFirebase() {
  if (typeof window !== 'undefined') {
    if (!getApps().length) {
      // Always initialize with the config object in this setup to avoid warnings.
      const firebaseApp = initializeApp(firebaseConfig);
      return getSdks(firebaseApp);
    }

    // If already initialized, return the SDKs with the already initialized App
    return getSdks(getApp());
  }
  return null;
}

export function getSdks(firebaseApp: FirebaseApp) {
  // Initialize Auth first to ensure it's ready.
  const auth = getAuth(firebaseApp);
  
  // Initiate a non-blocking anonymous sign-in. This ensures an auth
  // token is available for Firestore before any user interaction.
  // The `onAuthStateChanged` listener will handle the user state.
  signInAnonymously(auth).catch((error) => {
    // This can fail if there are network issues, but we don't block.
    // The SDK will retry.
    console.error('Initial anonymous sign-in failed quietly:', error);
  });
  
  // Now initialize other services.
  const firestore = getFirestore(firebaseApp);
  const storage = getStorage(firebaseApp);

  return {
    firebaseApp,
    auth,
    firestore,
    storage,
  };
}

export * from './provider';
export * from './client-provider';
export * from './auth/use-user';
export * from './firestore/use-collection';
export * from './firestore/use-doc';
export * from './non-blocking-updates';
export * from './auth/non-blocking-login';
export * from './errors';
export * from './error-emitter';
