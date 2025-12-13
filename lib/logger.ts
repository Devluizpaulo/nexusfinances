import { collection, serverTimestamp, Firestore, addDoc } from 'firebase/firestore';

export type LogLevel = 'info' | 'warn' | 'error';

interface LogPayload {
  message: string;
  level: LogLevel;
  createdBy: string;
  createdByName: string;
}

/**
 * Logs a new event to the Firestore 'logs' collection.
 *
 * @param firestore - The Firestore instance.
 * @param payload - The log data to be saved.
 */
export async function logEvent(firestore: Firestore, payload: LogPayload) {
  if (!firestore) {
    console.error('Logger: Firestore instance is not available.');
    return;
  }

  const logsCollection = collection(firestore, 'logs');
  const logData = {
    ...payload,
    timestamp: serverTimestamp(),
  };

  try {
    await addDoc(logsCollection, logData);
  } catch (error) {
    console.error("Failed to write log to Firestore:", error);
    // Optionally, you could have a fallback logging mechanism here
  }
}
