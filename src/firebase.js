/* eslint-disable no-unused-vars */
// src/firebase.js
import { initializeApp } from "firebase/app";
import { initializeAppCheck, ReCaptchaV3Provider } from "firebase/app-check";
import { getAuth } from "firebase/auth";
import { initializeFirestore, persistentLocalCache, persistentMultipleTabManager } from "firebase/firestore";
import { getFunctions } from "firebase/functions";
import { getMessaging, isSupported } from "firebase/messaging";
// import { getAnalytics } from "firebase/analytics";

const firebaseConfig = {
  apiKey: "AIzaSyD4kgFudYyiC-Nks4-KeGIb96NGLlFpBrU",
  authDomain: "budgetplanapp.com",
  projectId: "budget-plan-2c150",
  storageBucket: "budget-plan-2c150.appspot.com",
  messagingSenderId: "450979548885",
  appId: "1:450979548885:web:eadcb1b4f77268daf51c5c",
  measurementId: "G-98FRX6BYZB"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
// const analytics = getAnalytics(app);
// Pass your reCAPTCHA v3 site key (public key) to activate(). Make sure this
// key is the counterpart to the secret key you set in the Firebase console.
const appCheck = initializeAppCheck(app, {
  provider: new ReCaptchaV3Provider('6LcCMjArAAAAAG6juHPaV53COvz4y4u3xbiH2A9Q'),

  // Optional argument. If true, the SDK automatically refreshes App Check
  // tokens as needed.
  isTokenAutoRefreshEnabled: true
});

// Inicializa los servicios que necesites
const auth = getAuth(app);
const db = initializeFirestore(app, {
  localCache: persistentLocalCache({ tabManager: persistentMultipleTabManager() })
});
const functions = getFunctions(app);

// Messaging: promesa que resuelve a la instancia o null según soporte
const messagingPromise = isSupported().then((supported) => {
  return supported ? getMessaging(app) : null;
});

export { auth, db, functions, messagingPromise };
