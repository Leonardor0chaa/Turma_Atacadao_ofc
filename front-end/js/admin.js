// ======================================================
// admin.js — Painel de administração (com verificação de role)
// ======================================================

import { auth, db } from "./firebaseConfig.js";
import { 
  signInWithEmailAndPassword, 
  onAuthStateChanged, 
  signOut 
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";
import { doc, getDoc } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

// Referências aos elementos da página
const loginCard = document.getElementById("loginCard");
const adminCard = document.getElementById("adminCard");
const emailInput = document.getElementById("email");
const senhaInput = document.getElementById("senha");
const btnLogin = document.getElementById("btnLogin");
const btnLogout = document.getElementById("btnLogout");
const loginMsg = document.getElementById("loginMsg");

// 🔹 Função para exibir/ocultar seções
function mostrarPainelAdmin(mostrar) {
  if (mostrar) {
    loginCard.classList.add("hidden");
    adminCard.classList.remove("hidden");
  } else {
    loginCard.classList.remove("hidden");
    adminCard.classList.add("hidden");
  }
}

// 🔹 Verifica se o usuário é admin
async function verificarPermissaoAdmin(user) {
  try {
    const userDoc = await getDoc(doc(db, "usuarios", user.uid));

    if (!userDoc.exists()) {
      throw new Error("Usuário não encontrado no banco de dados.");
    }

    const dados = userDoc.data();

    if (dados.role === "admin") {
      console.log("✅ Usuário tem permissão de administrador.");
      mostrarPainelAdmin(true);
    } else {
      console.warn("⛔ Acesso negado. Usuário não é administrador.");
      alert("Acesso negado! Apenas administradores podem acessar esta página.");
      await signOut(auth);
      mostrarPainelAdmin(false);
    }
  } catch (erro) {
    console.error("Erro ao verificar permissão:", erro);
    alert("Erro ao verificar permissão de administrador.");
  }
}

// 🔹 Listener de login automático (verifica se está logado)
onAuthStateChanged(auth, async (user) => {
  if (user) {
    await verificarPermissaoAdmin(user);
  } else {
    mostrarPainelAdmin(false);
  }
});

// 🔹 Evento de login
btnLogin.addEventListener("click", async () => {
  const email = emailInput.value.trim();
  const senha = senhaInput.value.trim();
  loginMsg.textContent = "";

  if (!email || !senha) {
    loginMsg.textContent = "Preencha todos os campos.";
    return;
  }

  try {
    const credenciais = await signInWithEmailAndPassword(auth, email, senha);
    console.log("✅ Login realizado:", credenciais.user.email);
    await verificarPermissaoAdmin(credenciais.user);
  } catch (erro) {
    console.error("Erro ao fazer login:", erro);
    loginMsg.textContent = "Falha no login. Verifique email e senha.";
  }
});

// 🔹 Evento de logout
btnLogout.addEventListener("click", async () => {
  await signOut(auth);
  mostrarPainelAdmin(false);
  console.log("👋 Usuário deslogado.");
});
