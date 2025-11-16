import { db, auth } from "./firebaseConfig.js";
import {
  collection,
  getDocs,
  setDoc,
  updateDoc,
  deleteDoc,
  doc,
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";
import { signOut } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";

console.log("%c📂 admin.js carregado", "color: orange; font-weight: bold;");

// ===============================
// VERIFICAÇÃO DE ADMIN
// ===============================
const usuario = JSON.parse(localStorage.getItem("usuarioLogado"));
if (!usuario || usuario.role?.toLowerCase() !== "admin") {
  alert("Acesso negado! Apenas administradores podem acessar.");
  window.location.href = "login.html";
}

// Mostrar dados do admin
document.getElementById("admin-nome").textContent = usuario.nome;
document.getElementById("admin-email").textContent = usuario.email;

// ===============================
// CRUD DE PRODUTOS
// ===============================
const listaProdutos = document.getElementById("listaProdutos");
const form = document.getElementById("produtoForm");
const btnSalvar = document.getElementById("btnSalvar");
const btnCancelar = document.getElementById("btnCancelar");

let editandoId = null;

// Função para gerar o próximo ID sequencial (ex: P0066)
async function gerarProximoId() {
  const produtosRef = collection(db, "produtos");
  const snapshot = await getDocs(produtosRef);
  let maiorNumero = 0;

  snapshot.forEach((docSnap) => {
    const id = docSnap.id;
    const numero = parseInt(id.replace("P", ""), 10);
    if (!isNaN(numero) && numero > maiorNumero) {
      maiorNumero = numero;
    }
  });

  const proximoNumero = maiorNumero + 1;
  return `P${String(proximoNumero).padStart(4, "0")}`;
}

// CREATE / UPDATE
form.addEventListener("submit", async (e) => {
  e.preventDefault();

  const produto = {
    nome: document.getElementById("nome").value,
    categoria: document.getElementById("categoria").value,
    preco: parseFloat(document.getElementById("preco").value),
    estoque: parseInt(document.getElementById("estoque").value),
    imagem: document.getElementById("imagem").value,
    em_promocao: document.getElementById("emPromocao").checked,
    preco_promocional: parseFloat(
      document.getElementById("precoPromocional").value || 0
    ),
    vendidos: 0,
  };

  try {
    if (editandoId) {
      // Atualizar produto existente
      const ref = doc(db, "produtos", editandoId);
      await updateDoc(ref, produto);
      alert("✅ Produto atualizado com sucesso!");
      editandoId = null;
      btnCancelar.classList.add("hidden");
    } else {
      // Criar novo produto com ID sequencial
      const novoId = await gerarProximoId();
      await setDoc(doc(db, "produtos", novoId), produto);
      alert(`✅ Produto cadastrado com sucesso! ID: ${novoId}`);
    }

    form.reset();
    carregarProdutos();
  } catch (error) {
    console.error(error);
    alert("❌ Erro ao salvar produto.");
  }
});

// READ
async function carregarProdutos() {
  listaProdutos.innerHTML = "<p>Carregando produtos...</p>";

  const querySnapshot = await getDocs(collection(db, "produtos"));
  listaProdutos.innerHTML = "";

  querySnapshot.forEach((docSnap) => {
    const p = docSnap.data();
    const card = document.createElement("div");
    card.classList.add("produto-card");
    card.innerHTML = `
      <div class="produto-card-left">
        <img src="${p.imagem || 'https://via.placeholder.com/100'}" 
         alt="${p.nome}" 
         class="produto-img">
      </div>

      <div class="produto-info">
        <h3>${p.nome}</h3>
        <p><strong>Categoria:</strong> ${p.categoria}</p>
        <p><strong>Preço:</strong> R$ ${p.preco.toFixed(2)}</p>
        <p><strong>Estoque:</strong> ${p.estoque}</p>
      </div>

      <div class="produto-acoes">
        <button class="editar">✏️</button>
        <button class="excluir">🗑️</button>
      </div>
      `;

    // Editar produto
    card.querySelector(".editar").addEventListener("click", () => {
      editandoId = docSnap.id;
      document.getElementById("nome").value = p.nome;
      document.getElementById("categoria").value = p.categoria;
      document.getElementById("preco").value = p.preco;
      document.getElementById("estoque").value = p.estoque;
      document.getElementById("imagem").value = p.imagem;
      document.getElementById("emPromocao").checked = p.em_promocao;
      document.getElementById("precoPromocional").value =
        p.preco_promocional || "";
      btnCancelar.classList.remove("hidden");
      window.scrollTo({ top: 0, behavior: "smooth" });
    });

    // Excluir produto
    card.querySelector(".excluir").addEventListener("click", async () => {
      if (confirm(`Tem certeza que deseja excluir "${p.nome}"?`)) {
        await deleteDoc(doc(db, "produtos", docSnap.id));
        alert("🗑️ Produto excluído com sucesso!");
        carregarProdutos();
      }
    });

    listaProdutos.appendChild(card);
  });
}

// Cancelar edição
btnCancelar.addEventListener("click", () => {
  editandoId = null;
  form.reset();
  btnCancelar.classList.add("hidden");
});

// Botão atualizar
document
  .getElementById("btnRecarregar")
  .addEventListener("click", carregarProdutos);

// Logout
document.getElementById("btn-logout").addEventListener("click", async () => {
  await signOut(auth);
  localStorage.removeItem("usuarioLogado");
  window.location.href = "login.html";
});

// Ao carregar
carregarProdutos();
