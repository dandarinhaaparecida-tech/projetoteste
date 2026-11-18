
const CHAVE_PRODUTOS = "minhaLoja_produtos";

let produtos = carregarProdutos();

// CARREGAR PRODUTOS
function carregarProdutos() {
    try {
        const dados = localStorage.getItem(CHAVE_PRODUTOS);

        if (dados !== null) {
            const lista = JSON.parse(dados);

            if (Array.isArray(lista)) {
                return lista;
            }
        }
    } catch (erro) {
        console.error("Erro ao carregar produtos:", erro);
    }

    return [];
}

// SALVAR PRODUTOS
function salvarProdutos() {
    localStorage.setItem(
        CHAVE_PRODUTOS,
        JSON.stringify(produtos)
    );

    listarProdutos();
}

// NOVO PRODUTO
function novoProduto() {
    document.getElementById("formProduto").reset();

    document.getElementById("produtoId").value = "";

    document.getElementById("tituloFormulario").textContent =
        "Cadastrar produto";

    document.getElementById("botaoSalvar").textContent =
        "Cadastrar produto";

    document.getElementById("mensagem").textContent = "";
}

// LISTAR PRODUTOS
function listarProdutos(filtro = "") {
    const tabela = document.getElementById("listaProdutos");

    tabela.innerHTML = "";

    const pesquisa = filtro.toLowerCase().trim();

    const encontrados = produtos.filter(produto =>
        String(produto.nome || "").toLowerCase().includes(pesquisa)
    );

    if (encontrados.length === 0) {
        tabela.innerHTML = `
            <tr>
                <td colspan="4">Nenhum produto encontrado.</td>
            </tr>
        `;
        return;
    }

    encontrados.forEach(produto => {

        const linha = document.createElement("tr");

        // IMAGEM
        const colunaImagem = document.createElement("td");

        const imagem = document.createElement("img");

        imagem.src = produto.imagem;
        imagem.alt = produto.nome;

        imagem.onerror = function() {
            this.style.display = "none";
        };

        colunaImagem.appendChild(imagem);

        // NOME
        const colunaNome = document.createElement("td");

        colunaNome.textContent = produto.nome;

        // PREÇO
        const colunaPreco = document.createElement("td");

        colunaPreco.textContent = Number(produto.preco)
            .toLocaleString("pt-BR", {
                style: "currency",
                currency: "BRL"
            });

        // AÇÕES
        const colunaAcoes = document.createElement("td");

        colunaAcoes.className = "acoes";

        // BOTÃO ALTERAR
        const botaoEditar = document.createElement("button");

        botaoEditar.textContent = "Alterar";
        botaoEditar.className = "editar";

        botaoEditar.onclick = function() {
            editarProduto(produto.id);
        };

        // BOTÃO EXCLUIR
        const botaoExcluir = document.createElement("button");

        botaoExcluir.textContent = "Excluir";
        botaoExcluir.className = "excluir";

        botaoExcluir.onclick = function() {
            excluirProduto(produto.id);
        };

        colunaAcoes.append(
            botaoEditar,
            botaoExcluir
        );

        // ADICIONAR NA LINHA
        linha.append(
            colunaImagem,
            colunaNome,
            colunaPreco,
            colunaAcoes
        );

        tabela.appendChild(linha);
    });
}

// CADASTRAR E ALTERAR PRODUTO
document.getElementById("formProduto")
    .addEventListener("submit", function(event) {

        event.preventDefault();

        const id = document.getElementById("produtoId").value;

        const nome = document.getElementById("nome")
            .value.trim();

        const preco = Number(
            document.getElementById("preco").value
        );

        const descricao = document.getElementById("descricao")
            .value.trim();

        const imagem = document.getElementById("imagem")
            .value.trim();

        if (
            !nome ||
            !imagem ||
            !Number.isFinite(preco) ||
            preco <= 0
        ) {
            alert("Preencha corretamente os dados do produto.");
            return;
        }

        // ALTERAR PRODUTO
        if (id) {

            const indice = produtos.findIndex(
                produto => String(produto.id) === id
            );

            if (indice === -1) {
                alert("Produto não encontrado.");
                return;
            }

            produtos[indice] = {
                ...produtos[indice],
                nome,
                preco,
                descricao,
                imagem
            };

            document.getElementById("mensagem").textContent =
                "Produto alterado com sucesso!";

        } else {

            // CADASTRAR PRODUTO
            const novo = {
                id: Date.now(),
                nome,
                preco,
                descricao,
                imagem
            };

            produtos.push(novo);

            document.getElementById("mensagem").textContent =
                "Produto cadastrado com sucesso!";
        }

        salvarProdutos();

        novoProduto();
    });

// CONSULTAR PRODUTO PARA ALTERAÇÃO
function editarProduto(id) {

    const produto = produtos.find(
        item => String(item.id) === String(id)
    );

    if (!produto) {
        alert("Produto não encontrado.");
        return;
    }

    document.getElementById("produtoId").value = produto.id;

    document.getElementById("nome").value = produto.nome;

    document.getElementById("preco").value = produto.preco;

    document.getElementById("descricao").value =
        produto.descricao || "";

    document.getElementById("imagem").value = produto.imagem;

    document.getElementById("tituloFormulario").textContent =
        "Alterar produto";

    document.getElementById("botaoSalvar").textContent =
        "Salvar alterações";

    document.getElementById("mensagem").textContent = "";

    window.scrollTo({
        top: 0,
        behavior: "smooth"
    });
}

// EXCLUIR PRODUTO
function excluirProduto(id) {

    const produto = produtos.find(
        item => String(item.id) === String(id)
    );

    if (!produto) {
        return;
    }

    const confirmar = confirm(
        `Deseja realmente excluir "${produto.nome}"?`
    );

    if (!confirmar) {
        return;
    }

    produtos = produtos.filter(
        item => String(item.id) !== String(id)
    );

    salvarProdutos();

    novoProduto();

    alert("Produto excluído com sucesso!");
}

// PESQUISAR PRODUTOS
document.getElementById("pesquisa")
    .addEventListener("input", function() {

        listarProdutos(this.value);

    });

// INICIALIZAÇÃO
listarProdutos();
