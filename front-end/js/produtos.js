// ==============================================
// produtos.js - Lógica exclusiva da página de Produtos
// ==============================================

let todosProdutos = []; // 🔹 Novo: armazenará todos os produtos carregados

async function carregarProdutos() {
    const produtosContainer = document.getElementById("produtos-container");
    if (!produtosContainer) return;

    produtosContainer.innerHTML = "<p>Carregando produtos...</p>";

    try {
        const resposta = await fetch("http://127.0.0.1:5000/produtos");
        const produtos = await resposta.json();

        // 🔹 Novo: salva todos os produtos globalmente
        todosProdutos = produtos;

        produtosContainer.innerHTML = "";

        if (produtos.length === 0) {
            produtosContainer.innerHTML = "<p>Nenhum produto encontrado.</p>";
            return;
        }

        produtos.forEach(produto => {
            const card = document.createElement("div");
            card.className = "produto-card";

            const temPromocao = produto.em_promocao && produto.preco_promocional && produto.preco_promocional < produto.preco;
            const precoExibido = temPromocao ? produto.preco_promocional : produto.preco;

            card.innerHTML = `
                <img src="${produto.imagem}" alt="${produto.nome}">
                <h3>${produto.nome}</h3>
                ${
                    temPromocao
                        ? `
                            <p>
                                <span style="text-decoration: line-through; color: #999;">R$ ${produto.preco.toFixed(2)}</span><br>
                                <strong style="color: #e63946;">R$ ${precoExibido.toFixed(2)}</strong>
                            </p>
                            <span class="badge-oferta">🔥 Em promoção!</span>
                          `
                        : `<p><strong>R$ ${produto.preco.toFixed(2)}</strong></p>`
                }
                <div class="quantidade-controle">
                    <button type="button" onclick="mudarQuantidade(this, -1)">-</button>
                    <input type="number" id="quantidade-${produto.id}" value="1" min="1" class="input-quantidade">
                    <button type="button" onclick="mudarQuantidade(this, 1)">+</button>
                </div>
                <button type="button" onclick="adicionarProdutoAoCarrinho('${produto.id}')">
                    Adicionar ao carrinho
                </button>
            `;

            produtosContainer.appendChild(card);
        });

    } catch (erro) {
        console.error("Erro ao carregar produtos:", erro);
        produtosContainer.innerHTML = "<p>Erro ao carregar produtos. Tente novamente mais tarde.</p>";
    }
}

// ==============================================
// 🔹 Novo: Função para filtrar produtos por categoria
// ==============================================
function filtrarPorCategoria(categoria) {
    const produtosContainer = document.getElementById("produtos-container");
    produtosContainer.innerHTML = "";

    let produtosFiltrados = [];

    if (categoria === "todos") {
        produtosFiltrados = todosProdutos;
    } else {
        produtosFiltrados = todosProdutos.filter(p => p.categoria === categoria);
    }

    if (produtosFiltrados.length === 0) {
        produtosContainer.innerHTML = "<p>Nenhum produto encontrado nesta categoria.</p>";
        return;
    }

    produtosFiltrados.forEach(produto => {
        const card = document.createElement("div");
        card.className = "produto-card";

        const temPromocao = produto.em_promocao && produto.preco_promocional && produto.preco_promocional < produto.preco;
        const precoExibido = temPromocao ? produto.preco_promocional : produto.preco;

        card.innerHTML = `
            <img src="${produto.imagem}" alt="${produto.nome}">
            <h3>${produto.nome}</h3>
            ${
                temPromocao
                    ? `
                        <p>
                            <span style="text-decoration: line-through; color: #999;">R$ ${produto.preco.toFixed(2)}</span><br>
                            <strong style="color: #e63946;">R$ ${precoExibido.toFixed(2)}</strong>
                        </p>
                        <span class="badge-oferta">🔥 Em promoção!</span>
                      `
                    : `<p><strong>R$ ${produto.preco.toFixed(2)}</strong></p>`
            }
            <div class="quantidade-controle">
                <button type="button" onclick="mudarQuantidade(this, -1)">-</button>
                <input type="number" id="quantidade-${produto.id}" value="1" min="1" class="input-quantidade">
                <button type="button" onclick="mudarQuantidade(this, 1)">+</button>
            </div>
            <button type="button" onclick="adicionarProdutoAoCarrinho('${produto.id}')">
                Adicionar ao carrinho
            </button>
        `;

        produtosContainer.appendChild(card);
    });
}

// ==============================================
// Inicialização da página de produtos
// ==============================================
document.addEventListener("DOMContentLoaded", async () => {
    await carregarProdutos();

    if (typeof atualizarContadorCarrinho === "function") {
        await atualizarContadorCarrinho();
    }

    // 🔹 Captura todos os botões de filtro (se existirem)
    const botoesFiltro = document.querySelectorAll(".btn-filtro");

    botoesFiltro.forEach(btn => {
        btn.addEventListener("click", () => {
            // Remove a classe "ativo" de todos
            botoesFiltro.forEach(b => b.classList.remove("ativo"));

            // Adiciona a classe "ativo" ao botão clicado
            btn.classList.add("ativo");

            // Pega a categoria clicada
            const categoria = btn.getAttribute("data-categoria");

            // Filtra produtos pela categoria
            filtrarPorCategoria(categoria);
        });
    });
});

