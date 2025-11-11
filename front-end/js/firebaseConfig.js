// ===============================
// Firebase Configuração Front-End
// ===============================
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

  const firebaseConfig = {
  apiKey: "AIzaSyDJOjPITt8aZZkiRPHlNhO0Lj8u2NyoWSs",
  authDomain: "turma-atacadao.firebaseapp.com",
  databaseURL: "https://turma-atacadao-default-rtdb.firebaseio.com",
  projectId: "turma-atacadao",
  storageBucket: "turma-atacadao.firebasestorage.app",
  messagingSenderId: "116235021723",
  appId: "1:116235021723:web:dd234f523e048f0090c53e"
};

// Inicializando Firebase
const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);

console.log("%c✅ Firebase carregado com sucesso", "color: green; font-weight: bold;");
