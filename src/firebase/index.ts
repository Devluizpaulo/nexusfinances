'use client';

import { firebaseConfig } from '@/firebase/config';
import { initializeApp, getApps, getApp, FirebaseApp } from 'firebase/app';
import { getAuth, type Auth } from 'firebase/auth';
import { getFirestore, type Firestore } from 'firebase/firestore';
import { getStorage, type FirebaseStorage } from 'firebase/storage';
import React, { useMemo, type DependencyList } from 'react';


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

/**
 * A hook for memoizing Firestore queries and document references. It's a wrapper around React's useMemo
 * that adds a marker to the returned object. This marker is used by useCollection and useDoc to verify
 * that the query or reference has been properly memoized, preventing unstable references from being
 * passed to Firestore listeners, which can cause infinite render loops and other issues.
 *
 * @template T - The type of the value to be memoized.
 * @param {() => T} factory - A function that computes the value to be memoized.
 * @param {DependencyList} deps - An array of dependencies for the useMemo hook.
 * @returns {T} The memoized value with a stability marker.
 */
export function useMemoFirebase<T>(factory: () => T, deps: DependencyList): T {
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const memoized = useMemo(factory, deps);

  // Attach a non-enumerable property to the memoized object to mark it as stable.
  // This helps `useCollection` and `useDoc` to verify that the query is memoized.
  if (memoized && typeof memoized === 'object') {
    try {
      Object.defineProperty(memoized, '__memo', {
        value: true,
        writable: false,
        enumerable: false,
        configurable: true, // Set to true to allow re-definition in development hot-reloads
      });
    } catch (e) {
      // It might fail on some objects, but it's not critical.
    }
  }

  return memoized;
}

export * from './provider';
export * from './client-provider';
export * from './auth/use-user';
export * from './firestore/use-collection';
export * from './firestore/use-doc';
export * from './firestore/use-user-subcollection';
export * from './non-blocking-updates';
export * from './errors';
export * from './error-emitter';
