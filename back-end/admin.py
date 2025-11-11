# ==============================================
# app.py - Backend Admin Turma Atacadão (Seguro)
# ==============================================

from flask import Flask, render_template, request, jsonify, session, redirect, url_for
from flask_cors import CORS
from firebase_admin import credentials, firestore, initialize_app
import os
from dotenv import load_dotenv

# ----------------------------------------------
# Configuração básica
# ----------------------------------------------
load_dotenv()
app = Flask(__name__)
CORS(app)
app.secret_key = os.getenv("SECRET_KEY")

# Firebase
cred = credentials.Certificate("firebase_admin.json")
initialize_app(cred)
db = firestore.client()
produtos_ref = db.collection("produtos")

ADMIN_EMAIL = os.getenv("ADMIN_EMAIL")
ADMIN_PASSWORD = os.getenv("ADMIN_PASSWORD")

# ----------------------------------------------
# Rotas públicas
# ----------------------------------------------
@app.route("/")
def home():
    return redirect("/login")

@app.route("/login")
def login():
    return render_template("login.html")

@app.route("/admin")
def admin():
    if "user" not in session or session["user"] != ADMIN_EMAIL:
        return redirect("/login")
    return render_template("admin.html")

# ----------------------------------------------
# Autenticação
# ----------------------------------------------
@app.route("/api/login", methods=["POST"])
def api_login():
    data = request.json
    email = data.get("email")
    senha = data.get("senha")

    if email == ADMIN_EMAIL and senha == ADMIN_PASSWORD:
        session["user"] = email
        return jsonify({"success": True, "message": "Login realizado!"})
    else:
        return jsonify({"success": False, "message": "Acesso negado."}), 401

@app.route("/api/logout", methods=["POST"])
def api_logout():
    session.pop("user", None)
    return jsonify({"success": True})

# ----------------------------------------------
# CRUD - Rotas protegidas
# ----------------------------------------------
@app.route("/api/produtos", methods=["GET"])
def listar_produtos():
    if "user" not in session:
        return jsonify({"error": "Não autorizado"}), 403

    docs = produtos_ref.stream()
    lista = [doc.to_dict() for doc in docs]
    return jsonify(lista)

@app.route("/api/produtos", methods=["POST"])
def criar_produto():
    if "user" not in session:
        return jsonify({"error": "Não autorizado"}), 403

    data = request.json
    produtos_ref.document(data["id"]).set(data)
    return jsonify({"success": True})

@app.route("/api/produtos/<produto_id>", methods=["DELETE"])
def deletar_produto(produto_id):
    if "user" not in session:
        return jsonify({"error": "Não autorizado"}), 403

    produtos_ref.document(produto_id).delete()
    return jsonify({"success": True})

@app.route("/api/produtos/<produto_id>", methods=["PUT"])
def editar_produto(produto_id):
    if "user" not in session:
        return jsonify({"error": "Não autorizado"}), 403

    data = request.json
    produtos_ref.document(produto_id).update(data)
    return jsonify({"success": True})

# ----------------------------------------------
# Inicializa servidor
# ----------------------------------------------
if __name__ == "__main__":
    app.run(debug=True)
