'use client';

import React, { DependencyList, createContext, useContext, ReactNode, useMemo, useState, useEffect } from 'react';
import { FirebaseApp } from 'firebase/app';
import { Firestore, doc, setDoc, getDoc, serverTimestamp, Timestamp, FieldValue } from 'firebase/firestore';
import { FirebaseStorage } from 'firebase/storage';
import { Auth, User, onAuthStateChanged, UserMetadata } from 'firebase/auth';
import { FirebaseErrorListener } from '@/components/FirebaseErrorListener'

// Extends the default Firebase User type to include our custom fields
export interface AppUser extends Omit<User, 'metadata' | 'phoneNumber'> {
  firstName?: string;
  lastName?: string;
  phoneNumber?: string | null;
  role?: 'user' | 'superadmin';
  registrationDate?: Timestamp | string | FieldValue;
  metadata: UserMetadata;
  customIncomeCategories?: string[];
  customExpenseCategories?: string[];
  completedTracks?: string[];
}

// Internal state for user authentication, using our extended AppUser
interface UserAuthState {
  user: AppUser | null;
  isUserLoading: boolean;
  userError: Error | null;
}

// Combined state for the Firebase context
export interface FirebaseContextState {
  areServicesAvailable: boolean;
  firebaseApp: FirebaseApp | null;
  firestore: Firestore | null;
  auth: Auth | null;
  storage: FirebaseStorage | null;
  user: AppUser | null;
  isUserLoading: boolean;
  userError: Error | null;
}

// Return type for useFirebase()
export interface FirebaseServicesAndUser {
  firebaseApp: FirebaseApp;
  firestore: Firestore;
  auth: Auth;
  storage: FirebaseStorage;
  user: AppUser | null;
  isUserLoading: boolean;
  userError: Error | null;
}

// React Context
export const FirebaseContext = createContext<FirebaseContextState | undefined>(undefined);

// Props for FirebaseProvider
interface FirebaseProviderProps {
  children: ReactNode;
  firebaseApp: FirebaseApp | null;
  firestore: Firestore | null;
  auth: Auth | null;
  storage: FirebaseStorage | null;
}


/**
 * FirebaseProvider manages and provides Firebase services and user authentication state.
 */
export const FirebaseProvider: React.FC<FirebaseProviderProps> = ({
  children,
  firebaseApp,
  firestore,
  auth,
  storage,
}) => {
  const [userAuthState, setUserAuthState] = useState<UserAuthState>({
    user: null,
    isUserLoading: true, // Start loading until first auth event
    userError: null,
  });

  // Effect to subscribe to Firebase auth state changes
  useEffect(() => {
    if (!auth || !firestore) {
      setUserAuthState({ user: null, isUserLoading: false, userError: null });
      return;
    }

    setUserAuthState({ user: null, isUserLoading: true, userError: null });

    const unsubscribe = onAuthStateChanged(
      auth,
      async (firebaseUser) => {
        if (firebaseUser) {
          const userDocRef = doc(firestore, 'users', firebaseUser.uid);
          const userDocSnap = await getDoc(userDocRef);

          let appUser: AppUser = { ...firebaseUser, phoneNumber: firebaseUser.phoneNumber };

          if (userDocSnap.exists()) {
            const firestoreData = userDocSnap.data();
            appUser = {
              ...appUser,
              firstName: firestoreData.firstName,
              lastName: firestoreData.lastName,
              phoneNumber: firestoreData.phoneNumber,
              role: firestoreData.role,
              registrationDate: firestoreData.registrationDate,
              customIncomeCategories: firestoreData.customIncomeCategories || [],
              customExpenseCategories: firestoreData.customExpenseCategories || [],
              completedTracks: firestoreData.completedTracks || [],
            };
          } else {
            const nameParts = (firebaseUser.displayName || firebaseUser.email || '').split(' ');
            const firstName = nameParts[0];
            const lastName = nameParts.length > 1 ? nameParts.slice(1).join(' ') : '';
            const registrationDate = serverTimestamp();
             await setDoc(userDocRef, {
              id: firebaseUser.uid,
              displayName: firebaseUser.displayName || `${firstName} ${lastName}`.trim(),
              email: firebaseUser.email,
              photoURL: firebaseUser.photoURL,
              registrationDate: registrationDate,
              firstName: firstName,
              lastName: lastName,
              phoneNumber: firebaseUser.phoneNumber || '',
              role: 'user', // Default role
              completedTracks: [], // Initialize completedTracks
            }, { merge: true });
             appUser = {
                ...appUser,
                firstName,
                lastName,
                phoneNumber: firebaseUser.phoneNumber || '',
                role: 'user',
                registrationDate: registrationDate,
                completedTracks: [],
            };
          }
          setUserAuthState({ user: appUser, isUserLoading: false, userError: null });
        } else {
            setUserAuthState({ user: null, isUserLoading: false, userError: null });
        }
      },
      (error) => {
        console.error("FirebaseProvider: onAuthStateChanged error:", error);
        setUserAuthState({ user: null, isUserLoading: false, userError: error });
      }
    );
    return () => unsubscribe();
  }, [auth, firestore]);

  // Memoize the context value
  const contextValue = useMemo((): FirebaseContextState => {
    const servicesAvailable = !!(firebaseApp && firestore && auth && storage);
    return {
      areServicesAvailable: servicesAvailable,
      firebaseApp: servicesAvailable ? firebaseApp : null,
      firestore: servicesAvailable ? firestore : null,
      auth: servicesAvailable ? auth : null,
      storage: servicesAvailable ? storage : null,
      user: userAuthState.user,
      isUserLoading: userAuthState.isUserLoading,
      userError: userAuthState.userError,
    };
  }, [firebaseApp, firestore, auth, storage, userAuthState]);

  return (
    <FirebaseContext.Provider value={contextValue}>
      {contextValue.areServicesAvailable && <FirebaseErrorListener />}
      {children}
    </FirebaseContext.Provider>
  );
};

/**
 * Hook to access core Firebase services and user authentication state.
 * Returns a fallback value if used during server-side rendering or if core services are not available.
 */
export const useFirebase = (): FirebaseServicesAndUser => {
  const context = useContext(FirebaseContext);

  if (context === undefined) {
    throw new Error('useFirebase must be used within a FirebaseProvider.');
  }

  if (!context.areServicesAvailable || !context.firebaseApp || !context.firestore || !context.auth || !context.storage) {
    if (typeof window === 'undefined') {
      // Server-side rendering, return a fallback value
      return {
        firebaseApp: null,
        firestore: null,
        auth: null,
        storage: null,
        user: null,
        isUserLoading: false,
        userError: null,
      } as unknown as FirebaseServicesAndUser;
    } else {
      // Client-side, throw an error
      throw new Error('Firebase core services not available. Check FirebaseProvider props.');
    }
  }

  return {
    firebaseApp: context.firebaseApp,
    firestore: context.firestore,
    auth: context.auth,
    storage: context.storage,
    user: context.user,
    isUserLoading: context.isUserLoading,
    userError: context.userError,
  };
};

/** Hook to access Firebase Auth instance. */
export const useAuth = (): Auth => {
  const { auth } = useFirebase();
  return auth;
};

/** Hook to access Firestore instance. */
export const useFirestore = (): Firestore => {
  const { firestore } = useFirebase();
  return firestore;
};

/** Hook to access Firebase App instance. */
export const useFirebaseApp = (): FirebaseApp => {
  const { firebaseApp } = useFirebase();
  return firebaseApp;
};

/** Hook to access Firebase Storage instance. */
export const useStorage = (): FirebaseStorage => {
  const { storage } = useFirebase();
  return storage;
}

type MemoFirebase <T> = T & {__memo?: boolean};

export function useMemoFirebase<T>(factory: () => T, deps: DependencyList): T | (MemoFirebase<T>) {
  const memoized = useMemo(factory, deps);
  
  if(typeof memoized !== 'object' || memoized === null) return memoized;
  (memoized as MemoFirebase<T>).__memo = true;
  
  return memoized;
}
