# ==============================================
# app.py - Backend do Turma Atacadão
# ==============================================
# Servidor Flask que expõe:
# - Rotas para produtos (listagem)
# - Rotas para carrinho (adicionar/listar/total)
# - Rota de finalizar compra (atualiza estoque/vendidos com transação)
# - Rota para cadastrar usuário (cria no Firebase Auth e salva dados no Firestore
# OBS: NÃO armazena senha no Firestore)
#
# Observações:
# - O login é realizado no FRONT-END usando Firebase Auth (SDK Web).
# - Este back-end serve também os arquivos estáticos (pasta front-end) para facilitar testes.
# ==============================================

from flask import Flask, jsonify, request, send_from_directory
import firebase_admin
from firebase_admin import credentials, firestore, auth
from flask_cors import CORS
import os

# ==============================
# Inicialização do Firebase Admin
# ==============================
# Certifique-se de ter o arquivo serviceAccountKey.json na raiz do projeto
# (o mesmo usado para inicializar o admin SDK).
cred_path = "serviceAccountKey.json"
if not os.path.exists(cred_path):
    raise RuntimeError(f"Arquivo de credenciais não encontrado: {cred_path}. Coloque serviceAccountKey.json na raiz.")

cred = credentials.Certificate(cred_path)
firebase_admin.initialize_app(cred)
db = firestore.client()

# ==============================
# Inicialização do Flask
# ==============================
# Servimos os arquivos estáticos da pasta 'front-end' para facilitar testes locais
app = Flask(__name__, static_folder="front-end", static_url_path="")
CORS(app, resources={r"/*": {"origins": "*"}})  # Permite chamadas do front-end (ajuste em produção)

# ==============================
# Estrutura de carrinho em memória
# (Note: é apenas um exemplo simples. Em produção, persistir por usuário no DB.)
# ==============================
carrinho_global = []

# ==============================
# Servir HTML / assets (front-end)
# ==============================
@app.route('/')
def index():
    return send_from_directory('front-end', 'index.html')

@app.route('/<path:path>')
def static_files(path):
    # Rota genérica para servir arquivos (html, js, css) da pasta front-end
    return send_from_directory('front-end', path)

# ==============================
# Rota: Listar todos os produtos
# ==============================
@app.route("/produtos", methods=["GET"])
def get_produtos():
    produtos_ref = db.collection("produtos")
    docs = produtos_ref.stream()
    lista = []
    for doc in docs:
        produto = doc.to_dict()
        produto["id"] = doc.id
        lista.append(produto)
    return jsonify(lista)

# ==============================
# Rota: Adicionar produto ao carrinho
# (simples: adiciona em lista em memória)
# ==============================
@app.route('/carrinho', methods=['POST'])
def adicionar_carrinho():
    dados = request.get_json()
    produto_id = dados.get("id")
    quantidade = dados.get("quantidade", 1)

    # Validações básicas
    if not produto_id or not isinstance(quantidade, int) or quantidade < 1:
        return jsonify({"erro": "Dados inválidos para adicionar ao carrinho"}), 400

    produto_ref = db.collection("produtos").document(produto_id)
    produto_doc = produto_ref.get()

    if not produto_doc.exists:
        return jsonify({"erro": "Produto não encontrado"}), 404

    produto_info = produto_doc.to_dict()

    # Verifica estoque
    if produto_info.get("estoque", 0) < quantidade:
        return jsonify({
            "erro": f"Estoque insuficiente para {produto_info.get('nome','produto')}. "
                    f"Disponível: {produto_info.get('estoque',0)}"
        }), 400

    # 🟢 Define o preço final: se tiver promocional, usa ele
    preco_final = produto_info.get("preco_promocional") or produto_info.get("preco")

    # Verifica se já existe no carrinho
    item_existente = next((item for item in carrinho_global if item["id"] == produto_id), None)
    if item_existente:
        item_existente["quantidade"] += quantidade
        return jsonify({"mensagem": f"Quantidade de {produto_info.get('nome')} atualizada no carrinho."})
    else:
        carrinho_global.append({
            "id": produto_id,
            "nome": produto_info.get("nome"),
            "quantidade": quantidade,
            "preco": preco_final,  # 🟢 Usa o preço final
            "imagem": produto_info.get("imagem")
        })
        return jsonify({"mensagem": f"{quantidade}x {produto_info.get('nome')} adicionado ao carrinho."})

# ==============================
# Rota: Listar itens do carrinho
# ==============================
@app.route('/carrinho', methods=['GET'])
def get_itens_carrinho():
    return jsonify(carrinho_global)

# ==============================
# Atualizar quantidade do item no carrinho
# ==============================
@app.route('/carrinho/atualizar', methods=['PUT'])
def atualizar_quantidade_carrinho():
    dados = request.get_json()
    id_produto = dados.get('id')
    delta = int(dados.get('delta', 0))

    if not id_produto or delta == 0:
        return jsonify({"erro": "Dados inválidos para atualização"}), 400

    for item in carrinho_global:
        if item["id"] == id_produto:
            nova_qtd = item["quantidade"] + delta
            if nova_qtd <= 0:
                carrinho_global.remove(item)
                return jsonify({"mensagem": f"{item['nome']} removido do carrinho."})
            else:
                item["quantidade"] = nova_qtd
                return jsonify({"mensagem": f"Quantidade de {item['nome']} atualizada para {nova_qtd}."})
    
    return jsonify({"erro": "Produto não encontrado no carrinho"}), 404

# ==============================
# Remover item do carrinho
# ==============================
@app.route('/carrinho/<id_produto>', methods=['DELETE'])
def remover_item_carrinho(id_produto):
    global carrinho_global
    for item in carrinho_global:
        if item["id"] == id_produto:
            carrinho_global = [i for i in carrinho_global if i["id"] != id_produto]
            return jsonify({"mensagem": f"{item['nome']} removido do carrinho."})
    return jsonify({"erro": "Produto não encontrado no carrinho"}), 404

# ==============================
# Rota: Finalizar compra
# - Faz checagem de estoque e atualiza estoque/vendidos em transação
# - Limpa o carrinho em memória
# ==============================
@app.route('/comprar', methods=['POST'])
def finalizar_compra():
    if not carrinho_global:
        return jsonify({"erro": "Carrinho vazio"}), 400

    try:
        produtos_docs = {}  # Carrega docs antes da transação para checar disponibilidade
        for item in carrinho_global:
            produto_ref = db.collection("produtos").document(item["id"])
            produto_doc = produto_ref.get()
            if not produto_doc.exists:
                return jsonify({"erro": f"Produto {item['id']} não encontrado."}), 404
            produtos_docs[item["id"]] = produto_doc.to_dict()

        transaction = db.transaction()

        @firestore.transactional
        def atualizar_estoque(transaction):
            for item in carrinho_global:
                produto_ref = db.collection("produtos").document(item["id"])
                produto = produtos_docs[item["id"]]
                if produto.get("estoque", 0) < item["quantidade"]:
                    raise Exception(f"Estoque insuficiente para {item['nome']}.")
                novo_estoque = produto.get("estoque", 0) - item["quantidade"]
                novos_vendidos = produto.get("vendidos", 0) + item["quantidade"]
                transaction.update(produto_ref, {
                    "estoque": novo_estoque,
                    "vendidos": novos_vendidos
                })

        # Executa a transação
        atualizar_estoque(transaction)

        # Limpa carrinho local
        carrinho_global.clear()
        return jsonify({"mensagem": "Compra finalizada com sucesso!"})
    except Exception as e:
        print(f"Erro ao finalizar compra: {e}")
        return jsonify({"erro": f"Erro ao finalizar a compra: {str(e)}"}), 500

# ==============================
# Rota: Cadastro de usuário
# - Cria o usuário no Firebase Auth (auth.create_user)
# - Salva metadados no Firestore (sem senha)
# ==============================
@app.route("/usuarios/cadastrar", methods=["POST"])
def cadastrar_usuario():
    data = request.json or {}
    nome = data.get("nome_completo")
    cpf = data.get("cpf")
    email = data.get("email")
    telefone = data.get("telefone")
    endereco = data.get("endereco")
    senha = data.get("senha")

    # Validação básica
    required = ["nome_completo", "cpf", "email", "telefone", "endereco", "senha"]
    for campo in required:
        if not data.get(campo):
            return jsonify({"success": False, "error": f"Campo {campo} é obrigatório"}), 400

    try:
        # Cria usuário no Firebase Auth (senha é gerenciada pelo Auth)
        user = auth.create_user(
            email=email,
            password=senha
        )

        # Salva os dados do usuário no Firestore (NÃO salvar a senha!)
        db.collection("usuarios").document(user.uid).set({
            "nome_completo": nome,
            "cpf": cpf,
            "email": email,
            "telefone": telefone,
            "endereco": endereco,
            "criado_em": firestore.SERVER_TIMESTAMP
        })

        return jsonify({"success": True, "message": "Usuário cadastrado!", "uid": user.uid}), 200
    except Exception as e:
        # Retorna mensagem de erro do Firebase em caso de problema (ex: email já usado)
        return jsonify({"success": False, "error": str(e)}), 400

# ==============================
# Observação: não fornecemos rota de login usando senha aqui.
# O login (signInWithEmailAndPassword) deve ser feito no front-end com Firebase SDK.
# Isto evita lidar com senhas no servidor e segue boas práticas.
# ==============================

# ==============================
# Rodar servidor Flask
# ==============================
if __name__ == '__main__':
    # Porta padrão 5000. Se quiser outra porta, altere aqui.
    app.run(host="0.0.0.0", port=5000, debug=True)