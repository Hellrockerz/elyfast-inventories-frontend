import { initializeApp, getApps, getApp } from "firebase/app";
import { getAuth, GoogleAuthProvider, PhoneAuthProvider } from "firebase/auth";
import { getMessaging, getToken, onMessage, isSupported } from "firebase/messaging";

const firebaseConfig = {
  apiKey: "AIzaSyDIbJWUwxYj8P5EzO8fwNiaZIbmAWeNklU",
  authDomain: "elyfast-inventory.firebaseapp.com",
  projectId: "elyfast-inventory",
  storageBucket: "elyfast-inventory.firebasestorage.app",
  messagingSenderId: "345402873839",
  appId: "1:345402873839:web:490de17920675daec3481a",
  measurementId: "G-CFQEZVMZBF"
};

// Initialize Firebase
const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
const auth = getAuth(app);

// Messaging should only be initialized if supported (e.g. HTTPS/Localhost and Browser)
const initMessaging = async () => {
  if (typeof window !== 'undefined' && await isSupported()) {
    return getMessaging(app);
  }
  return null;
};

export { app, auth, initMessaging, isSupported, GoogleAuthProvider, PhoneAuthProvider, getToken, onMessage };
export default app;
