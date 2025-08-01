"use client";

import { initializeApp, type FirebaseOptions } from "firebase/app";
import { getAuth, signInAnonymously, signInWithCustomToken } from "firebase/auth";
import { useEffect } from "react";

declare global {
  interface Window {
    __firebase_config?: string;
    __initial_auth_token?: string;
  }
}

export function FirebaseAuthHandler() {
  useEffect(() => {
    const firebaseConfigStr = typeof window !== 'undefined' ? window.__firebase_config : undefined;
    const initialAuthToken = typeof window !== 'undefined' ? window.__initial_auth_token : undefined;

    if (firebaseConfigStr) {
      try {
        const firebaseConfig: FirebaseOptions = JSON.parse(firebaseConfigStr);
        const app = initializeApp(firebaseConfig);
        const auth = getAuth(app);
        
        const signIn = async () => {
          try {
            if (auth.currentUser) return;
            if (initialAuthToken) {
              await signInWithCustomToken(auth, initialAuthToken);
            } else {
              await signInAnonymously(auth);
            }
            console.log("Firebase authenticated successfully.");
          } catch (error) {
            console.error("Firebase sign-in failed:", error);
          }
        };
        signIn();
      } catch (e) {
        console.error("Firebase initialization failed:", e);
      }
    }
  }, []);

  return null;
}
