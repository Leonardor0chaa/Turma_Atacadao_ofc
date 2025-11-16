# migrar_em_programacao.py
import json
import os
from firebase_admin import credentials, firestore, initialize_app
import firebase_admin
from datetime import datetime

# ---------- CONFIG ----------
SERVICE_ACCOUNT = "serviceAccountKey.json"  # coloque o caminho correto se necessário
COLLECTION = "produtos"
ID_START = 69   # corresponde a P0069
ID_END = 200    # corresponde a P0200
BACKUP_FILENAME = f"backup_produtos_P{ID_START:04d}_P{ID_END:04d}_{datetime.now().strftime('%Y%m%d_%H%M%S')}.json"
# ----------------------------

def main():
    if not os.path.exists(SERVICE_ACCOUNT):
        print(f"Arquivo de credenciais não encontrado: {SERVICE_ACCOUNT}")
        print("Coloque serviceAccountKey.json na mesma pasta ou ajuste SERVICE_ACCOUNT no script.")
        return

    # Inicializa o Firebase Admin
    cred = credentials.Certificate(SERVICE_ACCOUNT)
    try:
        # evita reinicializar se já estiver inicializado
        if not firebase_admin._apps:
            initialize_app(cred)
    except Exception as e:
        print("Erro ao inicializar o Firebase Admin:", e)
        return

    db = firestore.client()

    backup = {}
    atualizados = 0
    pulados = 0
    erros = 0
    inexistentes = 0

    print(f"Iniciando migração P{ID_START:04d} .. P{ID_END:04d} na coleção '{COLLECTION}'")
    for n in range(ID_START, ID_END + 1):
        doc_id = f"P{n:04d}"
        doc_ref = db.collection(COLLECTION).document(doc_id)
        try:
            snap = doc_ref.get()
            if not snap.exists:
                inexistentes += 1
                # registra no backup com valor null para referência
                backup[doc_id] = None
                print(f"[{doc_id}] NÃO existe -> pulando")
                continue

            data = snap.to_dict()
            backup[doc_id] = data  # guarda cópia original

            # Decide novo valor para em_promocao
            if "em_programacao" in data:
                raw_val = data.get("em_programacao")
                # converte para boolean: se for str/num, aplica regras simples
                new_em_promocao = bool(raw_val)
                # Atualiza: define em_promocao e remove em_programacao
                doc_ref.update({
                    "em_promocao": new_em_promocao,
                    "em_programacao": firestore.DELETE_FIELD
                })
                atualizados += 1
                print(f"[{doc_id}] atualizado: em_programacao -> em_promocao = {new_em_promocao}")
            else:
                # se não tem em_programacao, verifica se já existe em_promocao
                if "em_promocao" in data:
                    pulados += 1
                    print(f"[{doc_id}] já possui 'em_promocao' ({data.get('em_promocao')}) -> pulado")
                else:
                    # define em_promocao como False (padrão seguro)
                    doc_ref.update({"em_promocao": False})
                    atualizados += 1
                    print(f"[{doc_id}] não tinha 'em_programacao' nem 'em_promocao' -> defini em_promocao = False")

        except Exception as e:
            erros += 1
            print(f"[{doc_id}] ERRO ao processar: {e}")

    # grava backup local (json)
    try:
        with open(BACKUP_FILENAME, "w", encoding="utf-8") as f:
            json.dump(backup, f, ensure_ascii=False, indent=2)
        print(f"\nBackup salvo em: {BACKUP_FILENAME}")
    except Exception as e:
        print("Erro ao salvar backup local:", e)

    print("\n=== RESUMO ===")
    print(f"Atualizados: {atualizados}")
    print(f"Pulados (já tinham em_promocao): {pulados}")
    print(f"Inexistentes: {inexistentes}")
    print(f"Erros: {erros}")
    print("Migração finalizada.")

if __name__ == "__main__":
    main()
