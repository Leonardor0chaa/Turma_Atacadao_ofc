# set_admin_doc.py
import firebase_admin
from firebase_admin import credentials, firestore

cred = credentials.Certificate("firebase_admin.json")
firebase_admin.initialize_app(cred)
db = firestore.client()

def set_admin(uid, email, nome=None):
    doc_ref = db.collection("users").document(uid)
    doc_ref.set({
        "email": email,
        "role": "admin",
        "nome": nome or "",
    }, merge=True)
    print("Admin salvo:", uid)

# Exemplo de uso
if __name__ == "__main__":
    uid = "ViCMvhbO5pa0O7yextfd0AkV4Am1"
    email = "vitrix@gmail.com"
    set_admin(uid, email, "Admin Principal")
