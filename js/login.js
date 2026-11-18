
import { initializeApp } from
"https://www.gstatic.com/firebasejs/13.3.0/firebase-app.js";

import {
    getAuth,
    signInWithEmailAndPassword,
    GoogleAuthProvider,
    signInWithPopup,
    signOut
} from
"https://www.gstatic.com/firebasejs/13.3.0/firebase-auth.js";

import {
    getFirestore,
    doc,
    getDoc
} from
"https://www.gstatic.com/firebasejs/13.3.0/firebase-firestore.js";

const firebaseConfig = {
    apiKey: "AIzaSyDHd_BwA3nC0mNQA3vI5T6jWKCQj-g8K3U",
    authDomain: "lojavirtual-43aa2.firebaseapp.com",
    projectId: "lojavirtual-43aa2",
    storageBucket: "lojavirtual-43aa2.firebasestorage.app",
    messagingSenderId: "745894792727",
    appId: "1:745894792727:web:f9a1fc5c3efb4546c99652"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

const formulario = document.getElementById("formLogin");
const mensagem = document.getElementById("mensagem");

const googleProvider = new GoogleAuthProvider();

/* Verifica se o usuário é administrador
async function verificarAdmin(usuario) {
    const referencia = doc(db, "usuarios", usuario.uid);
    const documento = await getDoc(referencia);

    if (!documento.exists() ||
        documento.data().perfil !== "admin") {

        await signOut(auth);
        throw new Error("nao-admin");
    }

    window.location.href = "./admin.html";
}*/
async function verificarAdmin(usuario) {

    console.log("UID Google:", usuario.uid);
    console.log("E-mail Google:", usuario.email);

    const referencia = doc(
        db,
        "usuarios",
        usuario.uid
    );

    const documento = await getDoc(referencia);

    console.log("Documento existe:", documento.exists());

    if (documento.exists()) {
        console.log("Dados do usuário:", documento.data());
        console.log("Perfil:", documento.data().perfil);
    }

    if (
        !documento.exists() ||
        documento.data().perfil !== "admin"
    ) {
        await signOut(auth);

        throw new Error("nao-admin");
    }

    window.location.href = "gerenciar-produtos.html";
}

// Login com e-mail e senha
formulario.addEventListener("submit", async (event) => {
    event.preventDefault();

    const email = document.getElementById("email").value.trim();
    const senha = document.getElementById("senha").value;

    mensagem.style.color = "#333";
    mensagem.textContent = "Verificando acesso...";

    try {
        const credencial = await signInWithEmailAndPassword(
            auth, email, senha
        );

        await verificarAdmin(credencial.user);

    } catch (erro) {
        console.error(erro);

        mensagem.style.color = "#dc3545";

        mensagem.textContent =
            erro.message === "nao-admin"
            ? "Acesso não autorizado. Sua conta não é administradora."
            : "E-mail ou senha incorretos. Verifique seus dados.";
    }
});

// Login com Google
document.getElementById("btnGoogle")
.addEventListener("click", async () => {

    mensagem.style.color = "#333";
    mensagem.textContent = "Conectando com Google...";

    try {
        const resultado = await signInWithPopup(
            auth,
            googleProvider
        );

        await verificarAdmin(resultado.user);

    } catch (erro) {
        console.error(erro);

        mensagem.style.color = "#dc3545";

        mensagem.textContent =
            erro.message === "nao-admin"
            ? "Esta conta Google não tem permissão de administrador."
            : "Não foi possível entrar com Google. Tente novamente.";
    }
});

// Voltar para a loja
document.getElementById("btnVoltar")
.addEventListener("click", () => {
    window.location.assign("./index.html");
});
