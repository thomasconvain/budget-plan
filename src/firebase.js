// src/firebase.js
import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
// import { getAnalytics } from "firebase/analytics";
// Otros servicios de Firebase que puedas necesitar

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

// Inicializa los servicios que necesites
const auth = getAuth(app);
const db = getFirestore(app);
// Exporta los servicios para que puedan ser utilizados en otros archivos
export { auth, db };
