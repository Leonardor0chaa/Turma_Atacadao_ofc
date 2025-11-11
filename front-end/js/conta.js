// ==============================================
// conta.js - Gerenciamento do botão de conta no cabeçalho
// ==============================================

const contaBtn = document.getElementById("conta-btn");
const menu = document.getElementById("conta-dropdown");
const opcoes = document.getElementById("conta-opcoes");

// Verifica se o usuário está logado e atualiza as opções
function verificarLogin() {
    // padroniza chave "usuarioLogado"
    const usuario = JSON.parse(localStorage.getItem("usuarioLogado"));

    if (usuario) {
        opcoes.innerHTML = `
            <p>Olá, <strong>${usuario.nome}</strong></p>
            <a href="#" id="sair-link">Sair</a>
        `;
        const sair = document.getElementById("sair-link");
        if (sair) sair.addEventListener("click", (e) => {
            e.preventDefault();
            logout();
        });
    } else {
        opcoes.innerHTML = `
            <a href="login.html">Entrar</a>
            <a href="cadastro.html">Criar conta</a>
        `;
    }
}

// Protege se botão não existir
if (contaBtn) {
    contaBtn.addEventListener("click", () => {
        verificarLogin();
        menu.style.display = menu.style.display === "none" ? "block" : "none";
    });
}

// Logout: remove usuário do localStorage e atualiza a tela
function logout() {
    localStorage.removeItem("usuarioLogado");
    alert("Você saiu da conta!");
    location.reload();
}

// Exibe informações detalhadas se existir elemento opcional (conta-link)
const contaLinkEl = document.getElementById("conta-link");
if (contaLinkEl) {
    const usuario = JSON.parse(localStorage.getItem("usuarioLogado"));
    if (usuario) {
        contaLinkEl.textContent = usuario.nome;
        contaLinkEl.addEventListener("click", () => {
            alert(`Nome: ${usuario.nome}\nEmail: ${usuario.email}\nCPF: ${usuario.cpf || ''}`);
        });
    } else {
        contaLinkEl.addEventListener("click", () => {
            window.location.href = "login.html";
        });
    }
}
