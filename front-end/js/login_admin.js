// login_admin.js (módulo)
import { auth, db } from "./firebaseConfig.js";
import { signInWithEmailAndPassword } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";
import { doc, getDoc } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

const emailEl = document.getElementById("email");
const senhaEl = document.getElementById("senha");
const btnLogin = document.getElementById("btnLogin");
const msg = document.getElementById("msg");

btnLogin.addEventListener("click", async () => {
  msg.textContent = "Verificando...";
  try {
    const cred = await signInWithEmailAndPassword(auth, emailEl.value.trim(), senhaEl.value);
    const user = cred.user;
    const docRef = doc(db, "users", user.uid);
    const snap = await getDoc(docRef);

    if (snap.exists()) {
      const data = snap.data();
      if (data.role === "admin") {
        // sucesso
        msg.textContent = "Acesso concedido — redirecionando...";
        localStorage.setItem("adminLogado", "true");
        // opcional: salvar uid
        localStorage.setItem("adminUid", user.uid);
        window.location.href = "./admin.html";
        return;
      }
    }
    // se chegou aqui: não é admin
    msg.textContent = "Acesso negado: conta sem permissão de admin.";
    await auth.signOut();
  } catch (err) {
    msg.textContent = "Erro no login: " + err.message;
  }
});
