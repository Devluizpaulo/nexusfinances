
import { initializeApp, getApps, getApp, FirebaseApp } from 'firebase/app';
import { getFirestore, Firestore } from 'firebase/firestore';
import { firebaseConfig } from './config';

let app: FirebaseApp;
let firestore: Firestore;

// Este arquivo é para ser usado APENAS no lado do servidor (API Routes, etc.)
// Ele não lida com autenticação do cliente.

export function initializeFirebase() {
  if (!getApps().length) {
    try {
      // Tenta inicializar via variáveis de ambiente do Firebase App Hosting
      app = initializeApp();
    } catch (e) {
      // Fallback para o objeto de configuração local
      app = initializeApp(firebaseConfig);
    }
    firestore = getFirestore(app);
  } else {
    app = getApp();
    firestore = getFirestore(app);
  }

  return { firebaseApp: app, firestore };
}
