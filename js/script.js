let cepTemporario = null;
let etapaFinalizacao = "ocioso";
let cepCliente = "";
let pedidoAguardandoConfirmacao = false;
/* =====================================
   MINHA LOJA - SCRIPT PRINCIPAL
===================================== */

// =====================================
// BANCO DE RESPOSTAS DO CHAT
// =====================================
function iniciarFinalizacaoNoRobo() {

  if (!carrinho.length) {
      alert("Seu carrinho está vazio!");
      return;
  }

  etapaFinalizacao = "aguardando_cep";
  pedidoAguardandoConfirmacao = false;

  const chat = document.getElementById("chat-container");

  if (chat && chat.style.display !== "flex") {
      alternarChat();
  }

  let resumo = "🛒 SEU PEDIDO RECEBIDO!\n\n";

  carrinho.forEach(item => {
      resumo +=
          item.nome + " - " +
          item.quantidade + " unidade(s) - " +
          formatarPreco(item.preco * item.quantidade) +
          "\n";
  });

  adicionarMensagem(resumo, "bot");

  adicionarMensagem(
      "Olá! Vamos finalizar sua compra. 😊\n\n" +
      "Para calcular o frete, digite seu CEP com 8 números.",
      "bot"
  );
}
const respostasFAQ = {
  desconto: {
    palavras: [
      "desconto", "promocao", "cupom",
      "oferta", "promocoes", "mais barato"
    ],
    resposta:
      "💰 Temos ofertas especiais para nossos clientes!\n\n" +
      "Consulte os produtos disponíveis em nossa loja e fale com nosso vendedor para verificar descontos e promoções."
  },

  frete: {
    palavras: [
      "frete", "entrega", "prazo",
      "envio", "cep", "transportadora"
    ],
    resposta:
      "🚚 Fazemos entregas!\n\n" +
      "O valor do frete e o prazo dependem do seu CEP e do produto escolhido.\n\n" +
      "Informe seu CEP para consultar as condições de entrega."
  },

  comprar: {
    palavras: [
      "comprar", "compra", "pedido",
      "pagamento", "adquirir", "como faco"
    ],
    resposta:
      "🛍️ Comprar na Minha Loja é muito fácil!\n\n" +
      "1. Escolha o produto desejado.\n" +
      "2. Clique em Adicionar ao carrinho.\n" +
      "3. Confira seu carrinho.\n" +
      "4. Clique em Finalizar compra.\n\n" +
      "Pronto! 😊"
  }
};


// =====================================
// NORMALIZAR TEXTO
// =====================================

function normalizarTexto(texto) {
  return texto
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim();
}


// =====================================
// ABRIR E FECHAR CHAT
// =====================================

function alternarChat() {
  const chat = document.getElementById("chat-container");
  const botao = document.getElementById("btn-abrir-chat");

  if (!chat || !botao) return;

  const aberto = chat.style.display === "flex";

  chat.style.display = aberto ? "none" : "flex";
  botao.style.display = aberto ? "flex" : "none";
}


// =====================================
// ADICIONAR MENSAGEM
// =====================================

function adicionarMensagem(texto, tipo) {
  const mensagens = document.getElementById("chat-messages");

  if (!mensagens) return;

  const div = document.createElement("div");

  div.className =
    tipo === "usuario" ? "user-message" : "bot-message";

  div.textContent = texto;

  mensagens.appendChild(div);
  mensagens.scrollTop = mensagens.scrollHeight;
}


// =====================================
// RESPOSTAS RÁPIDAS
// =====================================

function responderFAQ(tipo) {
  const item = respostasFAQ[tipo];

  if (!item) return;

  const perguntas = {
    desconto: "💰 Quero saber sobre descontos.",
    frete: "🚚 Quero saber sobre o frete.",
    comprar: "🛍️ Como faço para comprar?"
  };

  adicionarMensagem(perguntas[tipo], "usuario");
  adicionarMensagem(item.resposta, "bot");
}


// =====================================
// IDENTIFICAR PERGUNTA
// =====================================

function identificarPergunta(mensagem) {
  const texto = normalizarTexto(mensagem);

  for (const tipo in respostasFAQ) {
    const palavras = respostasFAQ[tipo].palavras;

    const encontrou = palavras.some(palavra =>
      texto.includes(normalizarTexto(palavra))
    );

    if (encontrou) return tipo;
  }

  return null;
}


// =====================================
// ENVIAR MENSAGEM
// =====================================



function enviarMensagem() {

  const campo = document.getElementById("mensagemUsuario");

  if (!campo) return;

  const mensagem = campo.value.trim();

  if (!mensagem) return;

  adicionarMensagem(mensagem, "usuario");

  campo.value = "";
  // ETAPA 1 - RECEBER CEP
if (etapaFinalizacao === "aguardando_cep") {

  const cep = mensagem.replace(/\D/g, "");

  if (cep.length !== 8) {
      adicionarMensagem(
          "❌ CEP inválido. Digite os 8 números do seu CEP.",
          "bot"
      );
      return;
  }

  cepCliente = cep;
  cepTemporario = cep;

  etapaFinalizacao = "aguardando_numero";

  adicionarMensagem(
      "✅ CEP recebido!\n\n" +
      "Agora informe o número do imóvel.",
      "bot"
  );

  return;
}


// ETAPA 2 - RECEBER NÚMERO
if (etapaFinalizacao === "aguardando_numero") {

  if (!/^\d+[A-Za-z]?$/.test(mensagem)) {
      adicionarMensagem(
          "Informe somente o número do imóvel.",
          "bot"
      );
      return;
  }

  const endereco = document.getElementById("enderecoEntrega");

  endereco.value = cepCliente + ", " + mensagem;

  etapaFinalizacao = "calculando_frete";

  adicionarMensagem(
      "🚚 Estou calculando o frete para seu endereço...",
      "bot"
  );

  calcularFrete().then(() => {

      if (!freteAtual) {
          etapaFinalizacao = "aguardando_cep";

          adicionarMensagem(
              "Não consegui calcular o frete. Confira o CEP e tente novamente.",
              "bot"
          );

          return;
      }

      const subtotal = carrinho.reduce(
          (soma, item) => soma + item.preco * item.quantidade,
          0
      );

      const total = subtotal + freteAtual.valor;

      etapaFinalizacao = "aguardando_confirmacao";
      pedidoAguardandoConfirmacao = true;

      adicionarMensagem(
          "✅ FRETE CALCULADO!\n\n" +
          "Produtos: " + formatarPreco(subtotal) + "\n" +
          "Frete: " + formatarPreco(freteAtual.valor) + "\n" +
          "Distância: " + freteAtual.distancia.toFixed(2) + " km\n\n" +
          "💰 TOTAL DA COMPRA: " + formatarPreco(total) +
          "\n\nDeseja confirmar seu pedido? Digite SIM ou NÃO.",
          "bot"
      );

  });

  return;
}


// ETAPA 3 - CONFIRMAR PEDIDO
if (etapaFinalizacao === "aguardando_confirmacao") {

  const resposta = normalizarTexto(mensagem);

  if (resposta === "sim" || resposta === "s") {

      adicionarMensagem(
          "🎉 Pedido confirmado! Obrigado por comprar na Minha Loja!",
          "bot"
      );

      etapaFinalizacao = "ocioso";
      pedidoAguardandoConfirmacao = false;

      finalizarCompra();

  } else if (
      resposta === "nao" ||
      resposta === "n"
  ) {

      adicionarMensagem(
          "Tudo bem! Seu pedido não foi confirmado. Você pode continuar comprando.",
          "bot"
      );

      etapaFinalizacao = "ocioso";
      pedidoAguardandoConfirmacao = false;

  } else {

      adicionarMensagem(
          "Por favor, digite SIM para confirmar ou NÃO para cancelar.",
          "bot"
      );

  }

  return;
}

  // Caso o cliente envie CEP e número juntos
  const completo = mensagem.match(
    /^(\d{5}-?\d{3})\s*[,;-]\s*(\d+[A-Za-z]?)$/
  );

  if (completo) {

    cepTemporario = completo[1].replace(/\D/g, "");

    const endereco = document.getElementById("enderecoEntrega");

    if (endereco) {
      endereco.value = cepTemporario + ", " + completo[2];
    }

    adicionarMensagem(
      "🚚 CEP e número recebidos! Vou calcular seu frete.",
      "bot"
    );

    calcularFrete();
    cepTemporario = null;

    return;
  }

  // Caso o cliente envie somente o CEP
  const somenteCep = mensagem.match(/^\d{5}-?\d{3}$/);

  if (somenteCep) {

    cepTemporario = somenteCep[0].replace(/\D/g, "");

    const carrinho = document.getElementById("cartDetails");

    if (carrinho) {
      carrinho.style.display = "block";
    }

    adicionarMensagem(
      "🚚 CEP recebido com sucesso!\n\n" +
      "Agora informe o número do imóvel.",
      "bot"
    );

    return;
  }

  // Caso o cliente envie somente o número depois do CEP
  if (cepTemporario && /^\d+[A-Za-z]?$/.test(mensagem)) {

    const numero = mensagem;

    const endereco = document.getElementById("enderecoEntrega");

    if (endereco) {

      endereco.value = cepTemporario + ", " + numero;

      adicionarMensagem(
        "✅ Endereço recebido!\n\n" +
        "CEP: " + cepTemporario +
        "\nNúmero: " + numero +
        "\n\n🚚 Calculando seu frete...",
        "bot"
      );

      cepTemporario = null;

      calcularFrete();

    }

    return;
  }

  const tipo = identificarPergunta(mensagem);

  if (tipo) {

    adicionarMensagem(respostasFAQ[tipo].resposta, "bot");

  } else {

    adicionarMensagem(
      "😊 Não consegui identificar sua pergunta.\n\n" +
      "Posso ajudar com:\n\n" +
      "💰 Descontos\n" +
      "🚚 Frete e entrega\n" +
      "🛍️ Como comprar",
      "bot"
    );

  }

}



// =====================================
// CADASTRO DE PRODUTOS
// =====================================

const CHAVE_PRODUTOS = "minhaLoja_produtos";

const produtosIniciais = [
  {
    id: 1,
    nome: "Tênis Casual",
    preco: 149.90,
    imagem: "img/tenis.jpg",
    descricao: "Tênis confortável para o dia a dia."
  },
  {
    id: 2,
    nome: "Relógio Moderno",
    preco: 199.90,
    imagem: "img/relogio.jpg",
    descricao: "Relógio moderno e elegante."
  },
  {
    id: 3,
    nome: "Bolsa Feminina",
    preco: 129.90,
    imagem: "img/bolsa.jpg",
    descricao: "Bolsa para diversas ocasiões."
  },
  {
    id: 4,
    nome: "Óculos de Sol",
    preco: 89.90,
    imagem: "img/oculos.jpg",
    descricao: "Óculos de sol moderno."
  }
];

function carregarProdutos() {
  try {
    const salvos = localStorage.getItem(CHAVE_PRODUTOS);

    if (salvos !== null) {
      const dados = JSON.parse(salvos);
      if (Array.isArray(dados)) return dados;
    }
  } catch (erro) {
    console.error("Erro ao carregar produtos:", erro);
  }

  localStorage.setItem(
    CHAVE_PRODUTOS,
    JSON.stringify(produtosIniciais)
  );

  return produtosIniciais.map(p => ({...p}));
}

let produtos = carregarProdutos();

function salvarProdutos() {
  localStorage.setItem(
    CHAVE_PRODUTOS,
    JSON.stringify(produtos)
  );

  // Atualiza a vitrine quando estiver aberta
  mostrarProdutos();

  // Atualiza o catálogo usado pela busca por fotos
  caracteristicasCatalogo = null;
}


// =====================================
// FORMATAR PREÇO
// =====================================

function formatarPreco(valor) {
  return valor.toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL"
  });
}


/* =====================================
   SISTEMA DE CÁLCULO DE FRETE
===================================== */

const ORIGEM_LOJA = {
  latitude: -22.8075,
  longitude: -45.1938
};

const VALOR_POR_KM = 4.00;
const DISTANCIA_MAXIMA = 100;

let freteAtual = null;


// =====================================
// LOCALIZAR ENDEREÇO
// =====================================



async function localizarEndereco(endereco) {

  const correspondencia = endereco.match(/\d{5}-?\d{3}/);

  if (!correspondencia) {
      throw new Error("Informe um CEP válido com 8 números.");
  }

  const cep = correspondencia[0].replace(/\D/g, "");

  // Identificar número do imóvel
  const restante = endereco.replace(correspondencia[0], "");
  const numeroEncontrado = restante.match(/\d+/);

  if (!numeroEncontrado) {
      throw new Error("Informe também o número do imóvel.");
  }

  const numero = numeroEncontrado[0];

  // Consultar CEP
  const respostaCEP = await fetch(
      `https://viacep.com.br/ws/${cep}/json/`
  );

  if (!respostaCEP.ok) {
      throw new Error("Erro ao consultar o CEP.");
  }

  const dadosCEP = await respostaCEP.json();

  if (dadosCEP.erro) {
      throw new Error("CEP não encontrado.");
  }

  const logradouro = dadosCEP.logradouro || "";
  const bairro = dadosCEP.bairro || "";
  const cidade = dadosCEP.localidade || "";
  const estado = dadosCEP.uf || "";

  if (!cidade || !estado) {
      throw new Error("Não foi possível identificar a cidade do CEP.");
  }

  // Tentativas de localização
  const consultas = [];

  if (logradouro) {
      consultas.push({
          street: `${numero} ${logradouro}`,
          city: cidade,
          state: estado,
          country: "Brasil"
      });

      consultas.push({
          street: logradouro,
          city: cidade,
          state: estado,
          country: "Brasil"
      });
  }

  if (bairro) {
      consultas.push({
          suburb: bairro,
          city: cidade,
          state: estado,
          postalcode: cep,
          country: "Brasil"
      });
  }

  // Última tentativa: localização aproximada pelo CEP
  consultas.push({
      postalcode: cep,
      city: cidade,
      country: "Brasil"
  });

  for (let i = 0; i < consultas.length; i++) {

      const parametros = new URLSearchParams({
          ...consultas[i],
          format: "jsonv2",
          limit: "1",
          countrycodes: "br"
      });

      try {

          const respostaMapa = await fetch(
              "https://nominatim.openstreetmap.org/search?" +
              parametros.toString(),
              {
                  headers: {
                      "Accept-Language": "pt-BR"
                  }
              }
          );

          if (!respostaMapa.ok) {
              continue;
          }

          const dadosMapa = await respostaMapa.json();

          if (dadosMapa.length > 0) {

              return {
                  latitude: Number(dadosMapa[0].lat),
                  longitude: Number(dadosMapa[0].lon),
                  aproximado: i > 0
              };

          }

      } catch (erro) {
          console.error("Tentativa de localização:", erro);
      }

      // Respeitar intervalo entre consultas
      if (i < consultas.length - 1) {
          await new Promise(resolve => setTimeout(resolve, 1100));
      }
  }

  throw new Error(
      "Não foi possível localizar esse CEP no mapa. " +
      "Confira o endereço ou tente novamente."
  );

}




// =====================================
// CALCULAR DISTÂNCIA
// =====================================

async function calcularDistancia(origem, destino) {

  const coordenadas =
    `${origem.longitude},${origem.latitude};` +
    `${destino.longitude},${destino.latitude}`;

  const resposta = await fetch(
    "https://router.project-osrm.org/route/v1/driving/" +
    coordenadas +
    "?overview=false"
  );

  if (!resposta.ok) {
    throw new Error("Erro ao calcular a rota.");
  }

  const dados = await resposta.json();

  if (
    dados.code !== "Ok" ||
    !dados.routes ||
    !dados.routes.length
  ) {
    throw new Error("Não foi possível encontrar uma rota.");
  }

  return dados.routes[0].distance / 1000;

}

function atualizarCarrinho() {

  const lista = document.getElementById("cartItems");
  const totalElemento = document.getElementById("total");
  const totalCabecalho = document.getElementById("headerTotal");
  const contador = document.getElementById("count");

  const subtotalElemento =
    document.getElementById("subtotalCompra");

  const freteResumo =
    document.getElementById("freteResumo");

  const totalFinal =
    document.getElementById("totalFinal");

  const botaoFinalizar =
    document.getElementById("btnFinalizarCompra");

  let subtotal = 0;
  let quantidadeTotal = 0;

  if (lista) lista.innerHTML = "";

 // Substitua esta parte dentro de atualizarCarrinho()
carrinho.forEach(item => {
  const valor = item.preco * item.quantidade;

  subtotal += valor;
  quantidadeTotal += item.quantidade;

  if (lista) {
    const linha = document.createElement("p");
    // Correção da linha abaixo (removida a quebra de linha que quebrava o texto)
    linha.textContent = `${item.nome} (${item.quantidade}x) - ` + formatarPreco(valor);
    lista.appendChild(linha);
  }
});

  const freteValido =
    freteAtual !== null &&
    freteAtual.valor >= 0 &&
    freteAtual.distancia <= DISTANCIA_MAXIMA;

  const valorFrete = freteValido
    ? freteAtual.valor
    : 0;

  const total = subtotal + valorFrete;

  if (totalElemento) {
    totalElemento.textContent = formatarPreco(subtotal);
  }

  if (totalCabecalho) {
    totalCabecalho.textContent = formatarPreco(total);
  }

  if (contador) {
    contador.textContent = quantidadeTotal;
  }

  if (subtotalElemento) {
    subtotalElemento.textContent = formatarPreco(subtotal);
  }

  if (freteResumo) {
    freteResumo.textContent = freteValido
      ? formatarPreco(valorFrete)
      : "Aguardando cálculo";
  }

  if (totalFinal) {
    totalFinal.textContent = freteValido
      ? formatarPreco(total)
      : "Calcule o frete";
  }

  if (botaoFinalizar) {

    botaoFinalizar.disabled = carrinho.length === 0;

    botaoFinalizar.textContent =
        carrinho.length === 0
            ? "🔒 Finalizar venda"
            : "🛍️ Finalizar venda";

  }

}


// =====================================
// CALCULAR FRETE
// =====================================


async function calcularFrete() {

  const campo = document.getElementById("enderecoEntrega");
  const botao = document.getElementById("btnCalcularFrete");
  const mensagem = document.getElementById("mensagemFrete");
  const distanciaElemento = document.getElementById("freteDistancia");
  const freteElemento = document.getElementById("freteValor");

  if (!campo || !mensagem) return;

  const endereco = campo.value.trim();

  if (!endereco) {
    mensagem.textContent = "Informe seu CEP e número.";
    return;
  }

  freteAtual = null;
  atualizarCarrinho();

  if (botao) {
    botao.disabled = true;
    botao.textContent = "Calculando...";
  }

  try {

    mensagem.textContent = "🔎 Localizando seu endereço...";

    // Buscar endereço pelo CEP e número
    const destino = await localizarEndereco(endereco);

    mensagem.textContent = "🚚 Calculando distância da loja...";

    // Calcular distância real pela rota de carro
    const distancia = await calcularDistancia(
      ORIGEM_LOJA,
      destino
    );

    if (distancia > DISTANCIA_MAXIMA) {

      freteAtual = null;

      mensagem.textContent =
        "❌ Entrega indisponível. Distância superior a 100 km.";

      if (freteElemento) {
        freteElemento.textContent = "Indisponível";
      }

      if (distanciaElemento) {
        distanciaElemento.textContent =
          "Distância: " + distancia.toFixed(2) + " km";
      }

      atualizarCarrinho();
      return;
    }

    // COBRAR R$ 4,00 POR QUILÔMETRO
    const valorFrete = distancia * 4.00;

    freteAtual = {
      distancia: distancia,
      valor: valorFrete,
      endereco: endereco
    };

    if (distanciaElemento) {
      distanciaElemento.textContent =
        "Distância: " + distancia.toFixed(2) + " km";
    }

    if (freteElemento) {
      freteElemento.textContent =
        formatarPreco(valorFrete);
    }

    mensagem.textContent =
    "✅ Entrega disponível! Frete: " +
    formatarPreco(valorFrete) +
    (destino.aproximado
        ? " (localização aproximada pelo CEP ou bairro)"
        : "");

    mensagem.style.color = "#198754";

    atualizarCarrinho();

  } catch (erro) {

    console.error("Erro no cálculo do frete:", erro);

    freteAtual = null;

    mensagem.textContent = erro.message;
    mensagem.style.color = "#dc3545";

    if (freteElemento) {
      freteElemento.textContent = "Indisponível";
    }

    atualizarCarrinho();

  } finally {

    if (botao) {
      botao.disabled = false;
      botao.textContent = "Calcular frete";
    }

  }

}


// =====================================
// MOSTRAR PRODUTOS
// =====================================

function mostrarProdutos() {
  const vitrine = document.getElementById("products");

  if (!vitrine) return;

  vitrine.innerHTML = "";

  produtos.forEach(produto => {
    const card = document.createElement("div");

    card.className = "product";

    const imagem = document.createElement("img");
    imagem.src = produto.imagem;
    imagem.alt = produto.nome;

    const nome = document.createElement("h3");
    nome.textContent = produto.nome;

    const preco = document.createElement("p");
    preco.textContent = formatarPreco(produto.preco);

    const botao = document.createElement("button");
    botao.textContent = "Adicionar ao carrinho";
    botao.className = "buy";

    botao.addEventListener("click", () => {
      adicionarAoCarrinho(produto.id);
    });

    card.append(imagem, nome, preco, botao);
    vitrine.appendChild(card);
  });
}


// =====================================
// CARRINHO
// =====================================

let carrinho = [];

function adicionarAoCarrinho(id) {
  const produto = produtos.find(item => item.id === id);

  if (!produto) return;

  const item = carrinho.find(item => item.id === id);

  if (item) {
    item.quantidade++;
  } else {
    carrinho.push({
      ...produto,
      quantidade: 1
    });
  }

  atualizarCarrinho();
}




// =====================================
// ABRIR E FECHAR CARRINHO
// =====================================


function toggleCart() {
  const elemento = document.getElementById("cartDetails");

  if (!elemento) return;

  const aberto = window.getComputedStyle(elemento).display !== "none";

  elemento.style.display = aberto ? "none" : "block";
}


function finalizarCompra() {

  if (!carrinho.length) {
    alert("Seu carrinho está vazio!");
    return;
  }

  const campo = document.getElementById("enderecoEntrega");

  if (!campo || !campo.value.trim()) {
    alert("Informe seu endereço.");
    return;
  }

  if (
    !freteAtual ||
    freteAtual.distancia > DISTANCIA_MAXIMA
  ) {
    alert("Calcule um frete válido antes de finalizar.");
    return;
  }

  if (campo.value.trim() !== freteAtual.endereco) {
    alert("O endereço mudou. Calcule o frete novamente.");
    freteAtual = null;
    atualizarCarrinho();
    return;
  }

  let subtotal = 0;
  let itens = "";

  carrinho.forEach(item => {

    const valor = item.preco * item.quantidade;

    subtotal += valor;

    itens +=
      item.nome + " - " +
      item.quantidade + "x - " +
      formatarPreco(valor) + "\n";

  });

  const frete = freteAtual.valor;
  const total = subtotal + frete;

  const pedido =
    "CONFIRMAÇÃO DO PEDIDO\n\n" +
    itens +
    "\nEndereço: " + freteAtual.endereco +
    "\nDistância: " + freteAtual.distancia.toFixed(2) + " km" +
    "\nProdutos: " + formatarPreco(subtotal) +
    "\nFrete: " + formatarPreco(frete) +
    "\nTOTAL: " + formatarPreco(total);

  if (!confirm(pedido + "\n\nConfirmar pedido?")) {
    return;
  }

  alert(
    "Pedido confirmado na demonstração!\n\n" +
    "Total: " + formatarPreco(total) +
    "\nEntre em contato com o vendedor para combinar o pagamento."
  );

  carrinho = [];
  freteAtual = null;

  campo.value = "";

  const mensagem = document.getElementById("mensagemFrete");
  const distancia = document.getElementById("freteDistancia");
  const valorFrete = document.getElementById("freteValor");

  if (mensagem) {
    mensagem.textContent = "Informe seu endereço para calcular o frete.";
    mensagem.style.color = "";
  }

  if (distancia) {
    distancia.textContent = "Distância: --";
  }

  if (valorFrete) {
    valorFrete.textContent = "R$ 0,00";
  }

  atualizarCarrinho();

}


// =====================================
// TEACHABLE MACHINE
// =====================================

// Coloque aqui o caminho da pasta do seu modelo.
const URL_MODELO = "./my_model/";

let modelo = null;
let webcam = null;
let labelContainer = null;
let maxPredictions = 0;
let cameraIniciada = false;
let loopAtivo = false;


// =====================================
// INICIAR RECONHECIMENTO
// =====================================

async function init() {
  if (cameraIniciada) return;

  const webcamContainer =
    document.getElementById("webcam-container");

  labelContainer =
    document.getElementById("label-container");

  if (!webcamContainer || !labelContainer) {
    alert("Área da câmera ou resultados não encontrada!");
    return;
  }

  try {
    const botao = document.getElementById("btn-start-ai");

    if (botao) botao.disabled = true;

    modelo = await tmImage.load(
      URL_MODELO + "model.json",
      URL_MODELO + "metadata.json"
    );

    maxPredictions = modelo.getTotalClasses();

    webcam = new tmImage.Webcam(200, 200, true);

    await webcam.setup();
    await webcam.play();

    webcamContainer.innerHTML = "";
    webcamContainer.appendChild(webcam.canvas);

    labelContainer.innerHTML = "";

    for (let i = 0; i < maxPredictions; i++) {
      labelContainer.appendChild(
        document.createElement("div")
      );
    }

    cameraIniciada = true;
    loopAtivo = true;

    if (botao) {
      botao.textContent = "Câmera iniciada";
      botao.disabled = false;
    }

    window.requestAnimationFrame(loop);

  } catch (erro) {
    console.error("Erro ao iniciar câmera:", erro);

    alert(
      "Não foi possível iniciar o reconhecimento. " +
      "Verifique a câmera, as permissões e os arquivos do modelo."
    );

    const botao = document.getElementById("btn-start-ai");

    if (botao) botao.disabled = false;
  }
}


// =====================================
// LOOP DA CÂMERA
// =====================================

async function loop() {
  if (!loopAtivo || !webcam) return;

  webcam.update();

  await predict();

  if (loopAtivo) {
    window.requestAnimationFrame(loop);
  }
}


// =====================================
// RECONHECER IMAGEM
// =====================================

async function predict() {
  if (!modelo || !webcam || !labelContainer) return;

  const prediction = await modelo.predict(webcam.canvas);

  for (let i = 0; i < maxPredictions; i++) {
    const resultado =
      prediction[i].className +
      ": " +
      (prediction[i].probability * 100).toFixed(1) +
      "%";

    labelContainer.childNodes[i].textContent = resultado;
  }
}


// =====================================
// PARAR CÂMERA
// =====================================

function pararCamera() {
  loopAtivo = false;

  if (webcam) {
    webcam.stop();
    webcam = null;
  }

  cameraIniciada = false;

  const webcamContainer =
    document.getElementById("webcam-container");

  if (webcamContainer) {
    webcamContainer.innerHTML = "";
  }

  const botao = document.getElementById("btn-start-ai");

  if (botao) {
    botao.textContent = "Iniciar reconhecimento";
  }
}


// =====================================
// INICIALIZAR TUDO
// =====================================

function iniciarLoja() {
  const chat = document.getElementById("chat-container");
  const botaoChat = document.getElementById("btn-abrir-chat");
  const campo = document.getElementById("mensagemUsuario");

  if (chat) chat.style.display = "none";

  if (botaoChat) botaoChat.style.display = "flex";

  if (campo) {
    campo.addEventListener("keydown", function(event) {
      if (event.key === "Enter") {
        event.preventDefault();
        enviarMensagem();
      }
    });
  }
  const enderecoEntrega =
  document.getElementById("enderecoEntrega");

if (enderecoEntrega) {

  enderecoEntrega.addEventListener("input", function() {

    freteAtual = null;

    const mensagem =
      document.getElementById("mensagemFrete");

    const valorFrete =
      document.getElementById("freteValor");

    const distancia =
      document.getElementById("freteDistancia");

    if (mensagem) {
      mensagem.textContent =
        "Endereço alterado. Calcule novamente.";
      mensagem.style.color = "#dc3545";
    }

    if (valorFrete) {
      valorFrete.textContent = "R$ 0,00";
    }

    if (distancia) {
      distancia.textContent = "Distância: --";
    }

    atualizarCarrinho();

  });

}
  mostrarProdutos();
  atualizarCarrinho();
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", iniciarLoja);
} else {
  iniciarLoja();
}

/* =====================================
   BUSCA DE PRODUTOS POR FOTO NO CHAT
===================================== */

let modeloFoto = null;
let caracteristicasCatalogo = null;
let pesquisandoFoto = false;

// Carregar o modelo de inteligência artificial

async function carregarModeloFoto() {
  if (modeloFoto) return modeloFoto;

  if (!window.tf) {
    throw new Error("TensorFlow.js não foi carregado.");
  }

  if (!window.mobilenet) {
    throw new Error("MobileNet não foi carregado.");
  }

  await tf.ready();

  modeloFoto = await mobilenet.load({
    version: 2,
    alpha: 1.0,
    modelUrl:
      "https://storage.googleapis.com/tfjs-models/savedmodel/mobilenet_v2_1.0_224/model.json",
    inputRange: [0, 1]
  });

  console.log("Modelo MobileNet carregado com sucesso!");

  return modeloFoto;
}



// Carregar uma imagem e verificar se ela está disponível
function carregarImagem(src) {

  return new Promise((resolve, reject) => {

    const imagem = new Image();

    imagem.onload = () => resolve(imagem);

    imagem.onerror = () => {
      reject(new Error("Não foi possível carregar a imagem: " + src));
    };

    imagem.src = src;

  });

}


// Extrair características da imagem
async function extrairCaracteristicas(imagem) {

  const modelo = await carregarModeloFoto();

  let tensor;

  try {

    tensor = modelo.infer(imagem, true);

    return Array.from(await tensor.data());

  } finally {

    if (tensor) {
      tensor.dispose();
    }

  }

}


// Comparar características das imagens
function compararImagens(a, b) {

  if (!a || !b || a.length !== b.length) {
    return 0;
  }

  let soma = 0;
  let normaA = 0;
  let normaB = 0;

  for (let i = 0; i < a.length; i++) {

    soma += a[i] * b[i];

    normaA += a[i] ** 2;

    normaB += b[i] ** 2;

  }

  if (!normaA || !normaB) return 0;

  return soma / (
    Math.sqrt(normaA) * Math.sqrt(normaB)
  );

}


// Preparar imagens do catálogo da loja
async function prepararCatalogo() {

  if (caracteristicasCatalogo) {
    return caracteristicasCatalogo;
  }

  const catalogo = [];

  for (const produto of produtos) {

    try {

      console.log("Analisando produto:", produto.nome);

      const imagem = await carregarImagem(produto.imagem);

      const vetor = await extrairCaracteristicas(imagem);

      catalogo.push({
        produto: produto,
        vetor: vetor
      });

      console.log("Imagem analisada:", produto.nome);

    } catch (erro) {

      console.error(
        "Erro na imagem do produto:",
        produto.nome,
        erro
      );

    }

  }

  if (catalogo.length === 0) {
    throw new Error(
      "Nenhuma imagem do catálogo foi carregada. Verifique os caminhos das imagens."
    );
  }

  caracteristicasCatalogo = catalogo;

  return catalogo;

}


// Receber fotografia enviada pelo cliente
async function receberFotoNoChat(event) {

  const arquivo = event.target.files[0];

  if (!arquivo) return;

  if (!arquivo.type.startsWith("image/")) {

    adicionarMensagem(
      "Envie uma fotografia válida.",
      "bot"
    );

    return;

  }

  if (pesquisandoFoto) return;

  pesquisandoFoto = true;

  const url = URL.createObjectURL(arquivo);

  try {

    // Mostrar fotografia no chat
    const mensagens = document.getElementById("chat-messages");

    const imagemUsuario = document.createElement("div");

    imagemUsuario.className = "user-message";

    const imagem = document.createElement("img");

    imagem.src = url;

    imagem.alt = "Foto enviada";

    imagem.style.width = "150px";

    imagem.style.borderRadius = "10px";

    imagemUsuario.appendChild(imagem);

    mensagens.appendChild(imagemUsuario);

    mensagens.scrollTop = mensagens.scrollHeight;

    adicionarMensagem(
      "🔎 Estou procurando produtos semelhantes na nossa loja...",
      "bot"
    );

    // Carregar e analisar a foto
    const foto = await carregarImagem(url);

    const vetorFoto = await extrairCaracteristicas(foto);

    // Analisar catálogo
    const catalogo = await prepararCatalogo();

    // Comparar fotografia com produtos cadastrados
    const resultados = catalogo.map(item => ({

      produto: item.produto,

      semelhanca: compararImagens(
        vetorFoto,
        item.vetor
      )

    }));

    resultados.sort(
      (a, b) => b.semelhanca - a.semelhanca
    );

    mostrarProdutosNoChat(resultados);

 } catch (erro) {

    console.error("ERRO NA BUSCA POR FOTO:", erro);
  
    adicionarMensagem(
      "Não consegui analisar essa foto. " +
      "Verifique se o modelo de reconhecimento carregou " +
      "e se as imagens dos produtos estão disponíveis.",
      "bot"
    );

  } finally {

    pesquisandoFoto = false;

    event.target.value = "";

    URL.revokeObjectURL(url);

  }
}


// Mostrar produtos encontrados no chat
function mostrarProdutosNoChat(resultados) {

  const mensagens = document.getElementById("chat-messages");

  if (!resultados.length) {

    adicionarMensagem(
      "Não encontrei produtos disponíveis para comparação.",
      "bot"
    );

    return;

  }

  adicionarMensagem(
    "🛍️ Veja os produtos mais semelhantes encontrados na nossa loja:",
    "bot"
  );

  resultados.slice(0, 5).forEach(resultado => {

    const produto = resultado.produto;

    const card = document.createElement("div");

    card.className = "bot-message";

    const imagem = document.createElement("img");

    imagem.src = produto.imagem;

    imagem.alt = produto.nome;

    imagem.style.width = "100%";

    imagem.style.maxWidth = "180px";

    imagem.style.borderRadius = "10px";

    const nome = document.createElement("p");

    nome.textContent = produto.nome;

    const preco = document.createElement("p");

    preco.textContent = formatarPreco(produto.preco);

    const percentual = document.createElement("small");

    percentual.textContent =
    "Semelhança visual: " +
    Math.round(resultado.semelhanca * 100) + "%";

    const botao = document.createElement("button");

    botao.textContent = "Adicionar ao carrinho";

    botao.className = "buy";

    botao.addEventListener("click", () => {

      adicionarAoCarrinho(produto.id);

      adicionarMensagem(
        "✅ " + produto.nome + " adicionado ao carrinho!",
        "bot"
      );

    });

    card.append(
      imagem,
      nome,
      preco,
      percentual,
      botao
    );

    mensagens.appendChild(card);

  });

  mensagens.scrollTop = mensagens.scrollHeight;

}


// Ativar envio de fotografias
function ativarBuscaFotoChat() {

  const campoFoto = document.getElementById("fotoNoChat");

  if (!campoFoto) return;

  campoFoto.addEventListener(
    "change",
    receberFotoNoChat
  );

}


// Inicializar busca por fotografia
if (document.readyState === "loading") {

  document.addEventListener(
    "DOMContentLoaded",
    ativarBuscaFotoChat
  );

} else {

  ativarBuscaFotoChat();


}
// =====================================
// ALTERNAR DARK MODE
// =====================================

function toggleTheme() {

  const body = document.body;
  const botao = document.getElementById("theme");

  body.classList.toggle("dark-mode");

  const modoEscuro = body.classList.contains("dark-mode");

  if (modoEscuro) {
    botao.textContent = "☀️ Light Mode";
    localStorage.setItem("tema", "dark");
  } else {
    botao.textContent = "🌙 Dark Mode";
    localStorage.setItem("tema", "light");
  }

}


// =====================================
// CARREGAR TEMA SALVO
// =====================================

function carregarTema() {

  const tema = localStorage.getItem("tema");
  const botao = document.getElementById("theme");

  if (tema === "dark") {

    document.body.classList.add("dark-mode");

    if (botao) {
      botao.textContent = "☀️ Light Mode";
    }

  }

}

document.addEventListener("DOMContentLoaded", carregarTema);



