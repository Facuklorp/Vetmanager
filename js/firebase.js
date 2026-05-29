// ============================================================
// CONFIGURACIÓN DE FIREBASE
// Reemplazá estos valores con los de tu proyecto Firebase
// Firebase Console → Tu Proyecto → ⚙️ → Configuración → SDK
// ============================================================
const firebaseConfig = {
  apiKey: "AIzaSyA7gF2vpk75keN4e2xbqrF4mJDJ43uk_ko",
  authDomain: "vetmanager-3c44c.firebaseapp.com",
  projectId: "vetmanager-3c44c",
  storageBucket: "vetmanager-3c44c.firebasestorage.app",
  messagingSenderId: "959669689660",
  appId: "1:959669689660:web:6d0f88398af1cc85565239",
  measurementId: "G-NR5TZ8Y3F7"
};

// ⚠️ IMPORTANTE: Cambiá este email por el tuyo (será el super-admin)
const ADMIN_EMAIL = "facuklorp@gmail.com";

// Inicializar Firebase
firebase.initializeApp(firebaseConfig);
const auth = firebase.auth();
const db = firebase.firestore();
