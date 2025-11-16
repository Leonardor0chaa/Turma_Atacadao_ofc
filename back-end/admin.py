from flask import Flask, jsonify, request
from firebase_admin import credentials, firestore, initialize_app

app = Flask(__name__)

cred = credentials.Certificate("serviceAccountKey.json")
initialize_app(cred)
db = firestore.client()

# Listar produtos
@app.route("/admin/produtos", methods=["GET"])
def listar_produtos():
    produtos_ref = db.collection("produtos")
    docs = produtos_ref.stream()
    produtos = [{**doc.to_dict(), "id": doc.id} for doc in docs]
    return jsonify(produtos)

# Atualizar estoque/vendidos
@app.route("/admin/produtos/<id>", methods=["PUT"])
def atualizar_produto(id):
    data = request.json
    db.collection("produtos").document(id).update(data)
    return jsonify({"msg": "Produto atualizado com sucesso!"})

if __name__ == "__main__":
    app.run(debug=True)
