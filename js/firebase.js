// ============================================================
// CONFIGURACIÓN DE FIREBASE
// Reemplazá estos valores con los de tu proyecto Firebase
// Firebase Console → Tu Proyecto → ⚙️ → Configuración → SDK
// ============================================================
const firebaseConfig = {
  apiKey: "YOUR_API_KEY",
  authDomain: "YOUR_PROJECT.firebaseapp.com",
  projectId: "YOUR_PROJECT_ID",
  storageBucket: "YOUR_PROJECT.appspot.com",
  messagingSenderId: "YOUR_SENDER_ID",
  appId: "YOUR_APP_ID"
};

// ⚠️ IMPORTANTE: Cambiá este email por el tuyo (será el super-admin)
const ADMIN_EMAIL = "admin@tuempresa.com";

// Inicializar Firebase
firebase.initializeApp(firebaseConfig);
const auth = firebase.auth();
const db = firebase.firestore();
