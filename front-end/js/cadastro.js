import { auth, db } from "./firebaseConfig.js";
import { createUserWithEmailAndPassword } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";
import { doc, setDoc } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

console.log("%c📂 cadastro.js carregado", "color: cyan; font-weight: bold;");

document.getElementById("cadastro-form").addEventListener("submit", async (e) => {
  e.preventDefault();

  const nome_completo = document.getElementById("nome_completo").value.trim();
  const cpf = document.getElementById("cpf").value.trim();
  const email = document.getElementById("email").value.trim();
  const telefone = document.getElementById("telefone").value.trim();
  const endereco = document.getElementById("endereco").value.trim();
  const senha = document.getElementById("senha").value.trim();

  if (!nome_completo || !cpf || !email || !telefone || !endereco || !senha) {
    alert("Por favor, preencha todos os campos!");
    return;
  }

  try {
    const cred = await createUserWithEmailAndPassword(auth, email, senha);
    const user = cred.user;

    await setDoc(doc(db, "usuarios", user.uid), {
      nome_completo,
      cpf,
      email,
      telefone,
      endereco,
      criado_em: new Date()
    });

    alert("Cadastro realizado com sucesso!");
    window.location.href = "login.html";

  } catch (error) {
    console.error("Erro no cadastro:", error);
    if (error.code === "auth/email-already-in-use") {
      alert("Este e-mail já está sendo usado.");
    } else {
      alert("Erro ao cadastrar: " + error.message);
    }
  }
});

// ==============================================
// Alternar tema claro/escuro
// ==============================================

const themeToggleBtn = document.getElementById("theme-toggle");

function aplicarTemaInicial() {
    const temaSalvo = localStorage.getItem("tema") || "claro";
    if (temaSalvo === "escuro") {
        document.body.classList.add("dark-mode");
        if (themeToggleBtn) themeToggleBtn.textContent = "☀️";
    } else {
        document.body.classList.remove("dark-mode");
        if (themeToggleBtn) themeToggleBtn.textContent = "🌙";
    }
}

if (themeToggleBtn) {
    themeToggleBtn.addEventListener("click", () => {
        document.body.classList.toggle("dark-mode");
        const modoEscuroAtivo = document.body.classList.contains("dark-mode");
        localStorage.setItem("tema", modoEscuroAtivo ? "escuro" : "claro");
        themeToggleBtn.textContent = modoEscuroAtivo ? "☀️" : "🌙";
    });
}

window.addEventListener("load", aplicarTemaInicial);