import { collection, serverTimestamp, Firestore } from 'firebase/firestore';
import { addDocumentNonBlocking } from '@/firebase';

export type LogLevel = 'info' | 'warn' | 'error';

interface LogPayload {
  message: string;
  level: LogLevel;
  createdBy: string;
  createdByName: string;
}

/**
 * Logs a new event to the Firestore 'logs' collection without blocking.
 *
 * @param firestore - The Firestore instance.
 * @param payload - The log data to be saved.
 */
export function logEvent(firestore: Firestore, payload: LogPayload) {
  if (!firestore) {
    console.error('Logger: Firestore instance is not available.');
    return;
  }

  const logsCollection = collection(firestore, 'logs');
  const logData = {
    ...payload,
    timestamp: serverTimestamp(),
  };

  addDocumentNonBlocking(logsCollection, logData);
}
