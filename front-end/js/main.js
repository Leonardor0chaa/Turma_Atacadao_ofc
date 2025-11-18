// ==============================================
// main.js - Gerenciamento de Produtos, Carrinho e Login
// ==============================================

// URL do back-end Flask
const apiProdutos = "http://127.0.0.1:5000/produtos";
let contadorCarrinho = 0; // Usado para o contador visual no cabeçalho

// ==============================================
// Funções de Gerenciamento de Produtos e Carrinho
// ==============================================

// ==============================================
// Função para carregar e exibir SOMENTE produtos em promoção
// ==============================================
async function carregarProdutos() {
    const produtosContainer = document.getElementById("produtos-container");
    if (!produtosContainer) {
        console.log("Não é a página de produtos, pulando carregamento.");
        return;
    }

    produtosContainer.innerHTML = "<p>Carregando produtos em oferta...</p>";

    try {
        const resposta = await fetch(apiProdutos);
        const produtos = await resposta.json();

        // Filtra apenas os produtos em promoção
        const produtosPromocao = produtos.filter(p => p.em_promocao === true);

        produtosContainer.innerHTML = ""; // Limpa antes de exibir

        if (produtosPromocao.length === 0) {
            produtosContainer.innerHTML = "<p>Nenhum produto em promoção no momento.</p>";
            return;
        }

        // Exibe cada produto promocional
        produtosPromocao.forEach(produto => {
            const card = document.createElement("div");
            card.className = "produto-card";

            // Verifica se tem preço promocional válido
            const precoPromo = produto.preco_promocional || produto.preco;
            const temDesconto = produto.preco_promocional && produto.preco_promocional < produto.preco;

            card.innerHTML = `
                <img src="${produto.imagem}" alt="${produto.nome}">
                <h3>${produto.nome}</h3>
                ${
                    temDesconto
                        ? `<p><span style="text-decoration: line-through; color: #999;">R$ ${produto.preco.toFixed(2)}</span>
                           <br><strong style="color: #e63946;">R$ ${precoPromo.toFixed(2)}</strong></p>`
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
        produtosContainer.innerHTML = "<p>Erro ao carregar produtos em promoção. Tente novamente mais tarde.</p>";
    }
}


// Função para mudar a quantidade de um item no input
function mudarQuantidade(btn, delta) {
    const input = btn.parentNode.querySelector('.input-quantidade');
    let quantidade = parseInt(input.value);

    if (isNaN(quantidade) || quantidade < 1) quantidade = 1;

    quantidade += delta;
    if (quantidade < 1) quantidade = 1;

    input.value = quantidade;
}

// Função para adicionar produto ao carrinho
async function adicionarProdutoAoCarrinho(produtoId) {
    let usuarioLogado = JSON.parse(localStorage.getItem("usuarioLogado"));
    if (!usuarioLogado) {
        alert("Você precisa estar logado para adicionar ao carrinho.");
        window.location.href = "login.html";
        return;
    }

    const inputQuantidade = document.getElementById(`quantidade-${produtoId}`);
    let quantidade = parseInt(inputQuantidade.value);

    if (isNaN(quantidade) || quantidade < 1) {
        alert("Por favor, insira uma quantidade válida (mínimo 1).");
        return;
    }

    try {
        const resposta = await fetch("http://127.0.0.1:5000/carrinho", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ id: produtoId, quantidade: quantidade })
        });

        const data = await resposta.json();

        if (resposta.ok) {
            alert(data.mensagem);
            await atualizarContadorCarrinho();
        } else {
            alert(data.erro || "Erro desconhecido ao adicionar ao carrinho.");
        }

    } catch (erro) {
        console.error("Erro ao adicionar ao carrinho:", erro);
        alert("Ocorreu um erro ao tentar adicionar o produto. Verifique sua conexão ou tente mais tarde.");
    }
}

// ==============================================
// ✅ Função corrigida: atualizar contador de itens no carrinho
// ==============================================
async function atualizarContadorCarrinho() {
    const carrinhoInfoText = document.getElementById("contador-carrinho-texto");
    if (!carrinhoInfoText) return;

    try {
        const resposta = await fetch("http://127.0.0.1:5000/carrinho");
        const dados = await resposta.json();

        if (resposta.ok && Array.isArray(dados)) {
            const totalItens = dados.reduce((soma, item) => soma + (item.quantidade || 0), 0);
            contadorCarrinho = totalItens;
            carrinhoInfoText.textContent = `Carrinho: ${contadorCarrinho} ${contadorCarrinho === 1 ? "item" : "itens"}`;

        } else {
            carrinhoInfoText.textContent = `Carrinho: ? itens`;
        }
    } catch (erro) {
        console.error("Erro na comunicação com o backend:", erro);
        carrinhoInfoText.textContent = `Carrinho: ? itens`;
    }
}

// ==============================================
// Funções de Gerenciamento da Página do Carrinho (atualizadas)
// ==============================================

async function carregarItensCarrinho() {
    const carrinhoContainer = document.getElementById("carrinho-container");
    if (!carrinhoContainer) return;

    carrinhoContainer.innerHTML = "<h2>Itens no seu Carrinho</h2>";

    try {
        const resposta = await fetch("http://127.0.0.1:5000/carrinho");
        const itensCarrinho = await resposta.json();

        if (resposta.ok && itensCarrinho.length > 0) {
            let totalGeral = 0;
            carrinhoContainer.innerHTML = ""; // limpa antes de exibir

            itensCarrinho.forEach(item => {
                const subtotal = item.quantidade * item.preco;
                totalGeral += subtotal;

                const itemDiv = document.createElement("div");
                itemDiv.className = "item-carrinho-card";
                itemDiv.dataset.id = item.id;

                itemDiv.innerHTML = `
                    <div class="info-produto">
                        <img src="${item.imagem}" alt="${item.nome}" class="img-carrinho">
                        <div class="texto-produto">
                            <h4>${item.nome}</h4>
                            <p>Preço unitário: R$ ${item.preco.toFixed(2)}</p>
                        </div>
                    </div>

                    <div class="controles-carrinho">
                        <button class="btn-menos">−</button>
                        <span class="quantidade">${item.quantidade}</span>
                        <button class="btn-mais">+</button>
                        <button class="btn-remover">🗑️ Remover</button>
                    </div>

                    <p class="subtotal">Subtotal: R$ ${subtotal.toFixed(2)}</p>
                    <hr>
                `;

                carrinhoContainer.appendChild(itemDiv);
            });

            const totalDiv = document.createElement("h3");
            totalDiv.id = "total-geral";
            totalDiv.textContent = `Total da Compra: R$ ${totalGeral.toFixed(2)}`;
            carrinhoContainer.appendChild(totalDiv);

            // Liga eventos dos botões dinamicamente
            carrinhoContainer.querySelectorAll(".btn-mais").forEach(btn =>
                btn.addEventListener("click", () => {
                    const id = btn.closest(".item-carrinho-card").dataset.id;
                    alterarQuantidadeCarrinho(id, 1);
                })
            );

            carrinhoContainer.querySelectorAll(".btn-menos").forEach(btn =>
                btn.addEventListener("click", () => {
                    const id = btn.closest(".item-carrinho-card").dataset.id;
                    alterarQuantidadeCarrinho(id, -1);
                })
            );

            carrinhoContainer.querySelectorAll(".btn-remover").forEach(btn =>
                btn.addEventListener("click", () => {
                    const id = btn.closest(".item-carrinho-card").dataset.id;
                    removerItemCarrinho(id);
                })
            );

        } else if (resposta.ok && itensCarrinho.length === 0) {
            carrinhoContainer.innerHTML = "<p>Seu carrinho está vazio.</p>";
        } else {
            alert(itensCarrinho.erro || "Erro ao carregar o carrinho.");
        }

    } catch (erro) {
        console.error("Erro ao carregar itens do carrinho:", erro);
        carrinhoContainer.innerHTML += "<p>Erro ao carregar os itens do carrinho. Tente novamente.</p>";
    }
}

// ==============================================
// Alterar quantidade (+ / −)
// ==============================================
async function alterarQuantidadeCarrinho(produtoId, delta) {
    try {
        const resposta = await fetch(`http://127.0.0.1:5000/carrinho/atualizar`, {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ id: produtoId, delta })
        });

        const data = await resposta.json();

        if (resposta.ok) {
            await carregarItensCarrinho();
            await atualizarContadorCarrinho();
        } else {
            alert(data.erro || "Erro ao atualizar quantidade.");
        }
    } catch (erro) {
        console.error("Erro ao atualizar quantidade:", erro);
        alert("Erro ao atualizar o item. Verifique sua conexão.");
    }
}

// ==============================================
// Remover item do carrinho
// ==============================================
async function removerItemCarrinho(produtoId) {
    if (!confirm("Deseja realmente remover este item do carrinho?")) return;

    try {
        const resposta = await fetch(`http://127.0.0.1:5000/carrinho/${produtoId}`, {
            method: "DELETE"
        });

        const data = await resposta.json();
        if (resposta.ok) {
            await carregarItensCarrinho();
            await atualizarContadorCarrinho();
        } else {
            alert(data.erro || "Erro ao remover o item.");
        }
    } catch (erro) {
        console.error("Erro ao remover item:", erro);
        alert("Erro ao remover o item do carrinho. Verifique sua conexão.");
    }
}

// ==============================================
// Finalizar compra - chama /comprar no backend
// ==============================================
async function finalizarCompra() {
    const finalizarBtn = document.getElementById("finalizar-btn");
    if (!finalizarBtn) {
        alert("Botão de finalizar não encontrado na página.");
        return;
    }

    // Confirmação com o usuário
    if (!confirm("Deseja realmente finalizar a compra?")) return;

    try {
        // Desabilita o botão enquanto processa
        finalizarBtn.disabled = true;
        finalizarBtn.textContent = "Processando...";

        const resposta = await fetch("http://127.0.0.1:5000/comprar", {
            method: "POST",
            headers: { "Content-Type": "application/json" }
            // não enviamos corpo: o backend usa o carrinho em memória (carrinho_global)
        });

        const data = await resposta.json().catch(() => ({}));

        if (resposta.ok) {
            alert(data.mensagem || "Compra finalizada com sucesso!");
            // Atualiza UI
            await carregarItensCarrinho();
            await atualizarContadorCarrinho();
            // opcional: redirecionar para home ou exibir comprovante
            // window.location.href = "index.html";
        } else {
            // Mensagem de erro do backend (ex: estoque insuficiente)
            const erroMsg = data.erro || data.message || "Erro ao finalizar a compra.";
            alert("Falha: " + erroMsg);
        }
    } catch (erro) {
        console.error("Erro ao finalizar compra:", erro);
        alert("Erro ao finalizar compra. Verifique o servidor/backend e sua conexão.");
    } finally {
        // Restaura o botão
        if (finalizarBtn) {
            finalizarBtn.disabled = false;
            finalizarBtn.textContent = "Finalizar Compra";
        }
    }
}

// ==============================================
// Funções de Navegação
// ==============================================

function irParaCarrinho() {
    window.location.href = "carrinho.html";
}

// ==============================================
// Lógica de Inicialização da Página
// ==============================================

window.onload = async () => {
    await carregarProdutos();
    await atualizarContadorCarrinho();
    await carregarItensCarrinho();

    const finalizarBtn = document.getElementById("finalizar-btn");
    if (finalizarBtn) finalizarBtn.addEventListener("click", finalizarCompra);
};

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

// ==============================================
// Funções de login/logout
// ==============================================

function logout() {
    localStorage.removeItem("usuario_logado");
    window.location.href = "login.html";
}

(function () {
            const slider = document.getElementById('slider');
            const slides = Array.from(slider.children);
            const prevBtn = document.getElementById('prev');
            const nextBtn = document.getElementById('next');
            const dotsWrap = document.getElementById('dots');
            const wrap = document.getElementById('sliderWrap');

            let index = 0;
            let autoplay = true;
            let interval = 8000;
            let timer = null;

            function goTo(i, animate = true) {
                index = (i + slides.length) % slides.length;
                if (!animate) slider.style.transition = 'none'; else slider.style.transition = '';
                slider.style.transform = `translateX(${-index * 100}%)`;
                updateDots();
                setTimeout(() => slider.style.transition = '', 20);
            }

            function next() { goTo(index + 1) }
            function prev() { goTo(index - 1) }

            // build dots
            slides.forEach((s, i) => {
                const btn = document.createElement('button');
                btn.className = 'dot';
                btn.setAttribute('aria-label', `Ir para slide ${i + 1}`);
                btn.setAttribute('role', 'tab');
                btn.addEventListener('click', () => { goTo(i); resetTimer(); });
                dotsWrap.appendChild(btn);
            });

            function updateDots() {
                Array.from(dotsWrap.children).forEach((d, i) => d.classList.toggle('active', i === index));
            }

            prevBtn.addEventListener('click', () => { prev(); resetTimer(); });
            nextBtn.addEventListener('click', () => { next(); resetTimer(); });

            // keyboard
            document.addEventListener('keydown', (e) => {
                if (e.key === 'ArrowRight') { next(); resetTimer(); }
                if (e.key === 'ArrowLeft') { prev(); resetTimer(); }
            });

            // autoplay
            function startTimer() { if (autoplay) timer = setInterval(next, interval); }
            function stopTimer() { if (timer) { clearInterval(timer); timer = null } }
            function resetTimer() { stopTimer(); startTimer(); }

            wrap.addEventListener('mouseenter', () => stopTimer());
            wrap.addEventListener('mouseleave', () => startTimer());

            // swipe support (touch)
            let startX = 0; let deltaX = 0;
            wrap.addEventListener('touchstart', (e) => { startX = e.touches[0].clientX; stopTimer(); });
            wrap.addEventListener('touchmove', (e) => { deltaX = e.touches[0].clientX - startX; });
            wrap.addEventListener('touchend', () => { if (Math.abs(deltaX) > 50) { if (deltaX < 0) next(); else prev(); } deltaX = 0; startTimer(); resetTimer(); });

            // init
            goTo(0, false);
            startTimer();

            // expose for debugging
            window._bannerSlider = { goTo, next, prev };
        })();
