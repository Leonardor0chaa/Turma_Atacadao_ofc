//import { auth, db } from "./firebaseConfig.js";
//import { signInWithEmailAndPassword } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";
//import { doc, getDoc } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

//console.log("%c📂 login.js carregado", "color: cyan; font-weight: bold;");

//document.getElementById("login-form").addEventListener("submit", async (e) => {
    //e.preventDefault();

    //const email = document.getElementById("login-email").value.trim();
    //const senha = document.getElementById("login-senha").value.trim();

    //if (!email || !senha) {
        //alert("Preencha todos os campos!");
       //return;
    //}

    //try {
        //const cred = await signInWithEmailAndPassword(auth, email, senha);
        //const user = cred.user;

        //const docRef = doc(db, "usuarios", user.uid);
        //const docSnap = await getDoc(docRef);

        //if (!docSnap.exists()) {
            //alert("Erro: dados do usuário não encontrados!");
            //return;
        //}

        //const dados = docSnap.data();

        //localStorage.setItem("usuarioLogado", JSON.stringify({
            //: user.uid,
            //nome: dados.nome_completo,
            //email: dados.email,
            //cpf: dados.cpf
        //}));

        //alert(`Bem-vindo(a), ${dados.nome_completo}!`);
        //window.location.href = "index.html";

    //} catch (error) {
        //console.error("Erro no login:", error);
        //if (error.code === "auth/user-not-found") {
            //alert("Usuário não encontrado.");
        //} else if (error.code === "auth/wrong-password") {
            //alert("Senha incorreta.");
        //} else if (error.code === "auth/invalid-credential") {
            //alert("Credenciais inválidas. Verifique seu e-mail e senha.");
        //} else {
            //alert("Erro ao entrar: " + error.message);
        //}
    //}
//});
