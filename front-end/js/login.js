import { auth, db } from "./firebaseConfig.js";
import { signInWithEmailAndPassword } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";
import { doc, getDoc } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

console.log("%c📂 login.js carregado", "color: cyan; font-weight: bold;");

document.getElementById("login-form").addEventListener("submit", async (e) => {
    e.preventDefault();

    const email = document.getElementById("login-email").value.trim();
    const senha = document.getElementById("login-senha").value.trim();

    if (!email || !senha) {
        alert("Preencha todos os campos!");
        return;
    }

    try {
        const cred = await signInWithEmailAndPassword(auth, email, senha);
        const user = cred.user;

        const docRef = doc(db, "usuarios", user.uid);
        const docSnap = await getDoc(docRef);

        if (!docSnap.exists()) {
            alert("Erro: dados do usuário não encontrados!");
            return;
        }

        const dados = docSnap.data();

        // 🔹 Salva dados básicos no localStorage (mantido igual)
        localStorage.setItem("usuarioLogado", JSON.stringify({
            uid: user.uid,
            nome: dados.nome_completo,
            email: dados.email,
            cpf: dados.cpf,
            role: dados.role || "usuario" // 🔹 adicionamos o role aqui
        }));

        // 🔹 Verifica o papel do usuário
        if (dados.role && dados.role.toLowerCase() === "admin") {
            alert(`Bem-vindo(a), ${dados.nome_completo}! Você entrou como administrador.`);
            window.location.href = "painel_admin.html";
        } else {
            alert(`Bem-vindo(a), ${dados.nome_completo}!`);
            window.location.href = "index.html";
        }

    } catch (error) {
        console.error("Erro no login:", error);
        if (error.code === "auth/user-not-found") {
            alert("Usuário não encontrado.");
        } else if (error.code === "auth/wrong-password") {
            alert("Senha incorreta.");
        } else if (error.code === "auth/invalid-credential") {
            alert("Credenciais inválidas. Verifique seu e-mail e senha.");
        } else {
            alert("Erro ao entrar: " + error.message);
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