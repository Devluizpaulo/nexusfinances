'use client';

import React, { DependencyList, createContext, useContext, ReactNode, useMemo, useState, useEffect } from 'react';
import { FirebaseApp } from 'firebase/app';
import { Firestore, doc, setDoc, getDoc, serverTimestamp, Timestamp, FieldValue, onSnapshot, collection, query, where } from 'firebase/firestore';
import { FirebaseStorage } from 'firebase/storage';
import { Auth, User, onAuthStateChanged, UserMetadata } from 'firebase/auth';
import type { SubscriptionPlan, UserSubscription } from '@/lib/types';


// Extends the default Firebase User type to include our custom fields
export interface AppUser extends Omit<User, 'metadata' | 'phoneNumber'> {
  subjectType: 'User'; // Adiciona a propriedade subjectType para o CASL
  firstName?: string;
  lastName?: string;
  phoneNumber?: string | null;
  role?: 'user' | 'superadmin';
  registrationDate?: Timestamp | string | FieldValue;
  metadata: UserMetadata;
  customIncomeCategories?: string[];
  customExpenseCategories?: string[];
  completedTracks?: string[];
  subscription?: UserSubscription;
  subscriptionPlan?: SubscriptionPlan;
  avatar?: {
    icon: string;
    bgColor: string;
  };
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


async function createUserDocument(firestore: Firestore, firebaseUser: User): Promise<AppUser> {
  const userDocRef = doc(firestore, 'users', firebaseUser.uid);

  const nameParts = (firebaseUser.displayName || firebaseUser.email || '').split(' ');
  const firstName = nameParts[0];
  const lastName = nameParts.length > 1 ? nameParts.slice(1).join(' ') : '';
  const registrationDate = serverTimestamp();
  
  const newUserDoc = {
    id: firebaseUser.uid,
    displayName: firebaseUser.displayName || `${firstName} ${lastName}`.trim(),
    email: firebaseUser.email,
    photoURL: firebaseUser.photoURL,
    registrationDate: registrationDate,
    firstName: firstName,
    lastName: lastName,
    phoneNumber: firebaseUser.phoneNumber || '',
    role: 'user' as const,
    status: 'active' as const,
    completedTracks: [],
    customIncomeCategories: [],
    customExpenseCategories: [],
  };

  await setDoc(userDocRef, newUserDoc, { merge: true });

  // Construct a valid AppUser object for immediate use, using client-side date as a placeholder.
  // The server timestamp will be available on the next snapshot read.
  const appUser: AppUser = {
      ...firebaseUser,
      ...newUserDoc,
      subjectType: 'User', // Adiciona o subjectType aqui
      metadata: firebaseUser.metadata,
      registrationDate: new Date().toISOString(), // Use ISO string for consistency
      // Ensure phoneNumber is correctly typed
      phoneNumber: firebaseUser.phoneNumber || null,
  };

  return appUser;
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
  
    // This will hold the unsubscribe function for the Firestore snapshot listener
    let userDocUnsubscribe: (() => void) | undefined;
  
    const authUnsubscribe = onAuthStateChanged(
      auth,
      async (firebaseUser) => {
        // If a previous user listener exists, unsubscribe from it before setting up a new one
        if (userDocUnsubscribe) {
          userDocUnsubscribe();
        }
  
        if (firebaseUser) {
          const userDocRef = doc(firestore, 'users', firebaseUser.uid);
          
          userDocUnsubscribe = onSnapshot(userDocRef, 
            async (userSnapshot) => {
              let userProfileData: Omit<AppUser, keyof User | 'subjectType'>;
  
              if (!userSnapshot.exists()) {
                // If user doc doesn't exist, create it. This is a one-time operation.
                try {
                  const createdUser = await createUserDocument(firestore, firebaseUser);
                  // We can use the returned data directly for the first state update
                  userProfileData = createdUser;
                } catch (error: any) {
                  console.error("FirebaseProvider: Error creating user document:", error);
                  setUserAuthState({ user: null, isUserLoading: false, userError: error });
                  return;
                }
              } else {
                userProfileData = userSnapshot.data() as Omit<AppUser, keyof User | 'subjectType'>;
              }
              
              // Combine auth data with Firestore data
              const combinedUser: AppUser = {
                  ...firebaseUser,
                  ...userProfileData,
                  subjectType: 'User', // Garante que o subjectType está sempre presente
                  metadata: firebaseUser.metadata,
              };

              // Fetch subscription plan ONLY if the planId has changed or doesn't exist
              if (
                combinedUser.subscription?.planId &&
                combinedUser.subscription.planId !== userAuthState.user?.subscriptionPlan?.id
              ) {
                const planDocRef = doc(firestore, 'subscriptionPlans', combinedUser.subscription.planId);
                const planSnapshot = await getDoc(planDocRef);
                if (planSnapshot.exists()) {
                  combinedUser.subscriptionPlan = planSnapshot.data() as SubscriptionPlan;
                }
              } else if (userAuthState.user?.subscriptionPlan) {
                  // Carry over the existing plan if it hasn't changed
                  combinedUser.subscriptionPlan = userAuthState.user.subscriptionPlan;
              }
  
              setUserAuthState({
                user: combinedUser,
                isUserLoading: false,
                userError: null,
              });
            },
            (error) => {
              console.error("FirebaseProvider: onSnapshot error:", error);
              setUserAuthState({ user: null, isUserLoading: false, userError: error });
            }
          );
        } else {
          // No Firebase user, so set auth state to signed out
          setUserAuthState({ user: null, isUserLoading: false, userError: null });
        }
      },
      (error) => {
        console.error("FirebaseProvider: onAuthStateChanged error:", error);
        setUserAuthState({ user: null, isUserLoading: false, userError: error });
      }
    );
  
    // Cleanup function for the auth state listener
    return () => {
      authUnsubscribe();
      if (userDocUnsubscribe) {
        userDocUnsubscribe();
      }
    };
    // userAuthState.user is removed to prevent re-running this complex effect
    // when the user object is updated. The logic inside correctly handles user state transitions.
    // eslint-disable-next-line react-hooks/exhaustive-deps
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
