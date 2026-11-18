
import { initializeApp } from
"https://www.gstatic.com/firebasejs/13.3.0/firebase-app.js";

import {
    getAuth,
    onAuthStateChanged,
    signOut
} from
"https://www.gstatic.com/firebasejs/13.3.0/firebase-auth.js";

import {
    getFirestore,
    doc,
    getDoc,
    collection,
    addDoc,
    getDocs,
    updateDoc,
    deleteDoc
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

const formulario = document.getElementById("formProduto");
const mensagem = document.getElementById("mensagem");
const lista = document.getElementById("listaProdutos");

let usuarioAdmin = null;

onAuthStateChanged(auth, async (usuario) => {

    if (!usuario) {
        window.location.replace("./login.html");
        return;
    }

    try {

        const referencia = doc(db, "usuarios", usuario.uid);
        const documento = await getDoc(referencia);

        if (
            !documento.exists() ||
            documento.data().perfil !== "admin"
        ) {
            await signOut(auth);
            window.location.replace("./login.html");
            return;
        }

        usuarioAdmin = usuario;
        carregarProdutos();

    } catch (erro) {
        console.error(erro);
        mensagem.textContent = "Não foi possível verificar sua autorização.";
    }

});

formulario.addEventListener("submit", async (event) => {

    event.preventDefault();

    if (!usuarioAdmin) return;

    const nome = document.getElementById("nome").value.trim();
    const descricao = document.getElementById("descricao").value.trim();
    const preco = Number(document.getElementById("preco").value);
    const estoque = Number(document.getElementById("estoque").value);

    if (!nome || !Number.isFinite(preco) ||
        preco < 0 || !Number.isInteger(estoque) || estoque < 0) {
        mensagem.textContent = "Confira os dados do produto.";
        return;
    }

    try {

        await addDoc(collection(db, "produtos"), {
            nome,
            descricao,
            preco,
            estoque,
            criadoEm: new Date()
        });

        mensagem.textContent = "Produto cadastrado com sucesso!";

        formulario.reset();

        carregarProdutos();

    } catch (erro) {

        console.error(erro);
        mensagem.textContent = "Erro ao cadastrar produto.";

    }

});

async function carregarProdutos() {

    lista.textContent = "Carregando...";

    try {

        const consulta = await getDocs(
            collection(db, "produtos")
        );

        lista.innerHTML = "";

        if (consulta.empty) {
            lista.textContent = "Nenhum produto cadastrado.";
            return;
        }

        consulta.forEach((documento) => {

            const produto = documento.data();
            const id = documento.id;

            const div = document.createElement("div");
            div.className = "produto";

            const titulo = document.createElement("h3");
            titulo.textContent = produto.nome || "Sem nome";

            const descricao = document.createElement("p");
            descricao.textContent = produto.descricao || "";

            const preco = document.createElement("p");
            preco.textContent =
                "Preço: " + Number(produto.preco).toLocaleString(
                    "pt-BR",
                    { style: "currency", currency: "BRL" }
                );

            const estoque = document.createElement("p");
            estoque.textContent = "Estoque: " + produto.estoque;

            const editar = document.createElement("button");
            editar.textContent = "Alterar";

            editar.addEventListener("click", () => editarProduto(id, produto));

            const excluir = document.createElement("button");
            excluir.textContent = "Excluir";
            excluir.className = "excluir";

            excluir.addEventListener("click", () => excluirProduto(id));

            div.append(
                titulo,
                descricao,
                preco,
                estoque,
                editar,
                excluir
            );

            lista.appendChild(div);

        });

    } catch (erro) {

        console.error(erro);
        lista.textContent = "Erro ao consultar produtos.";

    }

}

async function editarProduto(id, produto) {

    const nome = prompt("Nome do produto:", produto.nome);
    if (nome === null) return;

    const precoTexto = prompt("Novo preço:", produto.preco);
    if (precoTexto === null) return;

    const estoqueTexto = prompt("Novo estoque:", produto.estoque);
    if (estoqueTexto === null) return;

    const preco = Number(precoTexto);
    const estoque = Number(estoqueTexto);

    if (
        !nome.trim() ||
        !Number.isFinite(preco) ||
        preco < 0 ||
        !Number.isInteger(estoque) ||
        estoque < 0
    ) {
        alert("Dados inválidos.");
        return;
    }

    try {

        await updateDoc(doc(db, "produtos", id), {
            nome: nome.trim(),
            preco,
            estoque
        });

        alert("Produto atualizado com sucesso!");

        carregarProdutos();

    } catch (erro) {

        console.error(erro);
        alert("Erro ao atualizar produto.");

    }

}

async function excluirProduto(id) {

    if (!confirm("Deseja realmente excluir este produto?")) {
        return;
    }

    try {

        await deleteDoc(doc(db, "produtos", id));

        alert("Produto excluído com sucesso!");

        carregarProdutos();

    } catch (erro) {

        console.error(erro);
        alert("Erro ao excluir produto.");

    }

}

document.getElementById("btnSair").addEventListener("click", async () => {

    await signOut(auth);

    window.location.replace("./login.html");

});
