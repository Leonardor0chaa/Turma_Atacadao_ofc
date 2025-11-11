import firebase_admin
from firebase_admin import credentials, firestore

# ============================================
# Conexão com o Firebase
# ============================================
cred = credentials.Certificate("serviceAccountKey.json")
firebase_admin.initialize_app(cred)
db = firestore.client()

# ============================================
# Atualiza apenas campos 'estoque' e 'vendidos'
# ============================================
inicio_id = 45
fim_id = 65

for i in range(inicio_id, fim_id + 1):
    doc_id = f"P{i:04d}"
    doc_ref = db.collection("produtos").document(doc_id)
    doc = doc_ref.get()

    if doc.exists:
        dados = doc.to_dict()
        atualizacao = {}

        # Adiciona os campos apenas se ainda não existirem
        if "estoque" not in dados:
            atualizacao["estoque"] = 100
        if "vendidos" not in dados:
            atualizacao["vendidos"] = 0

        if atualizacao:
            doc_ref.update(atualizacao)
            print(f"✅ {doc_id}: campos adicionados → {atualizacao}")
        else:
            print(f"ℹ️ {doc_id}: já possui os campos necessários.")
    else:
        print(f"⚠️ {doc_id}: documento não encontrado no banco.")

print("🎯 Atualização concluída com sucesso!")
