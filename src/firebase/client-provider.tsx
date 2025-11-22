'use client';

import React, { useMemo, type ReactNode } from 'react';
import { FirebaseProvider } from '@/firebase/provider';
import { initializeFirebase } from '@/firebase';

interface FirebaseClientProviderProps {
  children: ReactNode;
}

export function FirebaseClientProvider({ children }: FirebaseClientProviderProps) {
  const firebaseServices = useMemo(() => {
    // Initialize Firebase on the client side, once per component mount.
    const services = initializeFirebase();
    if (!services) {
      // Return a structure with null services for server-side rendering
      return { firebaseApp: null, auth: null, firestore: null, storage: null };
    }
    return services;
  }, []); // Empty dependency array ensures this runs only once on mount

  // If services are not available (e.g., during SSR), we can render children in a non-Firebase context
  // or show a loader. Here, we'll proceed to the provider which will handle the null services.
  return (
    <FirebaseProvider
      firebaseApp={firebaseServices.firebaseApp}
      auth={firebaseServices.auth}
      firestore={firebaseServices.firestore}
      storage={firebaseServices.storage}
    >
      {children}
    </FirebaseProvider>
  );
}
