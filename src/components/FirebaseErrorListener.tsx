'use client';

import { useState, useEffect } from 'react';
import { errorEmitter } from '@/firebase/error-emitter';
import { FirestorePermissionError } from '@/firebase/errors';

/**
 * An invisible component that listens for globally emitted 'permission-error' events.
 * It throws any received error to be caught by Next.js's global-error.tsx during development.
 * In production, it does nothing to avoid crashing the application for end-users.
 */
export function FirebaseErrorListener() {
  const [error, setError] = useState<FirestorePermissionError | null>(null);

  useEffect(() => {
    // This component should only be active in development.
    if (process.env.NODE_ENV === 'production') {
      return;
    }

    const handleError = (error: FirestorePermissionError) => {
      setError(error);
    };

    errorEmitter.on('permission-error', handleError);

    return () => {
      errorEmitter.off('permission-error', handleError);
    };
  }, []);

  // In development, throw the error to be caught by Next.js dev overlay.
  if (process.env.NODE_ENV === 'development' && error) {
    throw error;
  }

  // This component renders nothing in production or when there is no error.
  return null;
}
