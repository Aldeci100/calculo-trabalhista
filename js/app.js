document.addEventListener("DOMContentLoaded", () => {
  document.querySelectorAll(".verba-item[data-verba]").forEach((item) => {
    const checkbox = item.querySelector(".chk-verba") || item.querySelector('input[type="checkbox"]');
    checkbox.addEventListener("change", () => {
      item.classList.toggle("ativa", checkbox.checked);
    });
  });

  document.getElementById("chkFGTS").addEventListener("change", (e) => {
    document.querySelector('[data-verba="fgts"]').classList.toggle("ativa", e.target.checked);
  });

  document.getElementById("chkCorrecao").addEventListener("change", (e) => {
    document.querySelector('[data-verba="correcao"]').classList.toggle("ativa", e.target.checked);
  });

  const campoLiquidacao = document.getElementById("dataLiquidacao");
  if (!campoLiquidacao.value) {
    const hoje = new Date();
    campoLiquidacao.value = `${hoje.getFullYear()}-${String(hoje.getMonth() + 1).padStart(2, "0")}-${String(hoje.getDate()).padStart(2, "0")}`;
  }

  document.getElementById("btnCalcular").addEventListener("click", rodarCalculo);
  document.getElementById("btnSalvarCalculo").addEventListener("click", salvarCalculoAtual);
});

let ultimoCalculo = null;

function lerOpcoesVerba(item) {
  const opcoes = {};
  item.querySelectorAll("[data-opcao]").forEach((campo) => {
    const chave = campo.dataset.opcao;
    let valor = campo.value;
    if (campo.dataset.tipo === "bool") valor = valor === "true";
    opcoes[chave] = valor;
  });
  return opcoes;
}

async function rodarCalculo() {
  const salario = Number(document.getElementById("salario").value || 0);
  const admissao = parseDataBR(document.getElementById("admissao").value);
  const demissao = parseDataBR(document.getElementById("demissao").value);
  const tipoAvisoPrevio = document.getElementById("tipoAvisoPrevio").value;
  const dependentes = Number(document.getElementById("dependentes").value || 0);

  if (!salario || !admissao || !demissao) {
    alert("Preencha salário, data de admissão e data de demissão antes de calcular.");
    return;
  }
  if (demissao <= admissao) {
    alert("A data de demissão precisa ser depois da data de admissão.");
    return;
  }

  const dados = { salario, admissao, demissao, avisoPrevio: tipoAvisoPrevio, dependentes };

  const verbasAtivas = {};
  const idsForaDoChecklist = ["fgts", "correcao", "tributos", "tributosIRPF", "honorarios", "custas"];
  document.querySelectorAll(".verba-item[data-verba]").forEach((item) => {
    const verbaId = item.dataset.verba;
    if (idsForaDoChecklist.includes(verbaId)) return;
    const checkbox = item.querySelector(".chk-verba");
    verbasAtivas[verbaId] = { selecionada: checkbox.checked, opcoes: lerOpcoesVerba(item) };
  });

  const calcularFGTS = document.getElementById("chkFGTS").checked;
  const saldoInformado = Number(document.getElementById("saldoFGTS").value || 0);

  const opcoesTributos = {
    calcularContribSocial: document.getElementById("chkContribSocial").checked,
    calcularIRPF: document.getElementById("chkIRPF").checked,
    dependentes: Number(document.getElementById("dependentesIRPF").value || 0),
    numMeses: Number(document.getElementById("numMesesTributos").value || 1),
  };

  const { resultados, total } = calcularRescisao(dados, verbasAtivas, { calcular: calcularFGTS, saldoInformado }, opcoesTributos);

  if (resultados.length === 0) {
    alert("Nenhuma verba foi selecionada. Marque ao menos uma verba para calcular.");
    return;
  }

  let infoCorrecao = null;
  const aplicarCorrecao = document.getElementById("chkCorrecao").checked;
  if (aplicarCorrecao) {
    const btn = document.getElementById("btnCalcular");
    btn.disabled = true;
    btn.textContent = "Buscando índices no Banco Central...";
    const dataAjuizamento = parseDataBR(document.getElementById("dataAjuizamento").value);
    const dataLiquidacao = parseDataBR(document.getElementById("dataLiquidacao").value) || new Date();
    infoCorrecao = await aplicarCorrecaoATodasVerbas(resultados, demissao, dataAjuizamento, dataLiquidacao);
    btn.disabled = false;
    btn.textContent = "Calcular";
  }

  renderizarResultado(resultados, total, aplicarCorrecao, infoCorrecao);

  const opcoesHonorarios = {
    calcularHonorarios: document.getElementById("chkHonorarios").checked,
    percentualHonorarios: Number(document.getElementById("percentualHonorarios").value || 0.1),
    calcularCustas: document.getElementById("chkCustas").checked,
  };
  let encargos = {};
  if (opcoesHonorarios.calcularHonorarios || opcoesHonorarios.calcularCustas) {
    const baseBruta = resultados.filter((r) => r.devido > 0).reduce((soma, r) => soma + r.devido, 0);
    encargos = calcularHonorariosECustas(baseBruta, opcoesHonorarios);
    renderizarEncargos(encargos, baseBruta);
  } else {
    document.getElementById("painelEncargos").style.display = "none";
  }

  ultimoCalculo = {
    reclamante: document.getElementById("reclamante").value,
    reclamado: document.getElementById("reclamado").value,
    numeroProcesso: document.getElementById("numeroProcesso").value,
    salario,
    admissao: document.getElementById("admissao").value,
    demissao: document.getElementById("demissao").value,
    tipoAvisoPrevio,
    comCorrecao: aplicarCorrecao,
    dataAjuizamento: aplicarCorrecao ? document.getElementById("dataAjuizamento").value : null,
    dataLiquidacao: aplicarCorrecao ? document.getElementById("dataLiquidacao").value : null,
    resultados: resultados.map((r) => ({
      nome: r.nome,
      baseLegal: r.baseLegal,
      memoria: r.memoria,
      devido: r.devido,
      valorCorrigido: r.valorCorrigido ?? null,
      memoriaCorrecao: r.memoriaCorrecao || null,
    })),
    total,
    encargos: Object.values(encargos).map((e) => ({ nome: e.nome, baseLegal: e.baseLegal, memoria: e.memoria, devido: e.devido })),
  };
}

function renderizarResultado(resultados, total, comCorrecao, infoCorrecao) {
  const painelResultado = document.getElementById("painelResultado");
  const painelHistorico = document.getElementById("painelHistorico");
  const cabecalhoTabela = document.querySelector("#tabelaResultado thead tr");
  const corpoTabela = document.querySelector("#tabelaResultado tbody");
  const historicoDiv = document.getElementById("historicoDetalhado");

  corpoTabela.innerHTML = "";
  historicoDiv.innerHTML = "";
  cabecalhoTabela.innerHTML = comCorrecao
    ? "<th>Verba</th><th style='text-align:right;'>Valor nominal</th><th style='text-align:right;'>Valor corrigido</th>"
    : "<th>Verba</th><th style='text-align:right;'>Valor</th>";

  if (comCorrecao && infoCorrecao && infoCorrecao.avisoOffline) {
    const aviso = document.createElement("div");
    aviso.className = "aviso";
    aviso.textContent = infoCorrecao.avisoOffline;
    painelResultado.insertBefore(aviso, painelResultado.firstChild.nextSibling);
  }

  let totalCorrigido = 0;

  resultados.forEach((r) => {
    const linha = document.createElement("tr");
    linha.innerHTML = comCorrecao
      ? `<td>${r.nome}</td><td class="valor">${formatarMoeda(r.devido)}</td><td class="valor">${formatarMoeda(r.valorCorrigido)}</td>`
      : `<td>${r.nome}</td><td class="valor">${formatarMoeda(r.devido)}</td>`;
    corpoTabela.appendChild(linha);
    if (comCorrecao) totalCorrigido += r.valorCorrigido;

    const bloco = document.createElement("div");
    bloco.className = "historico-verba";
    const memoriaCorrecaoHtml = comCorrecao && r.memoriaCorrecao ? `<ul>${r.memoriaCorrecao.map((l) => `<li>${l}</li>`).join("")}</ul>` : "";
    bloco.innerHTML = `
      <h3>${r.nome}</h3>
      <div class="base-legal">${r.baseLegal}</div>
      <ul>${r.memoria.map((linhaTexto) => `<li>${linhaTexto}</li>`).join("")}</ul>
      <div class="valor-final">Resultado nominal: ${formatarMoeda(r.devido)}</div>
      ${memoriaCorrecaoHtml}
      ${comCorrecao ? `<div class="valor-final">Resultado corrigido: ${formatarMoeda(r.valorCorrigido)}</div>` : ""}
    `;
    historicoDiv.appendChild(bloco);
  });

  const linhaTotal = document.createElement("tr");
  linhaTotal.className = "total";
  linhaTotal.innerHTML = comCorrecao
    ? `<td>Total</td><td class="valor">${formatarMoeda(total)}</td><td class="valor">${formatarMoeda(arredondar(totalCorrigido))}</td>`
    : `<td>Total (Fase 1 — sem correção monetária/juros)</td><td class="valor">${formatarMoeda(total)}</td>`;
  corpoTabela.appendChild(linhaTotal);

  painelResultado.style.display = "block";
  painelHistorico.style.display = "block";
  painelResultado.scrollIntoView({ behavior: "smooth" });
}

async function salvarCalculoAtual() {
  const mensagem = document.getElementById("mensagemSalvar");
  if (!ultimoCalculo) {
    mensagem.innerHTML = '<div class="erro">Calcule antes de salvar.</div>';
    return;
  }
  if (!firebaseConfigurado || !firebaseDb) {
    mensagem.innerHTML = '<div class="erro">Firebase não configurado — não é possível salvar na nuvem ainda. Veja CONFIGURAR-FIREBASE.md.</div>';
    return;
  }
  const usuario = firebaseAuth.currentUser;
  try {
    const perfil = usuario ? await obterMeuPerfil(usuario) : null;
    if (usuario && !ehSuperAdmin(usuario) && (!perfil || !perfil.escritorioId)) {
      mensagem.innerHTML = `<div class="aviso">Sua conta ainda não foi associada a um escritório. Informe este código para o administrador vincular: <b>${usuario.uid}</b></div>`;
      return;
    }
    await firebaseDb.collection("calculos").add({
      ...ultimoCalculo,
      escritorioId: perfil ? perfil.escritorioId : null,
      criadoPor: usuario ? usuario.email : "desconhecido",
      criadoEm: firebase.firestore.FieldValue.serverTimestamp(),
    });
    mensagem.innerHTML = '<div class="sucesso">Cálculo salvo — já aparece no histórico para todo o escritório.</div>';
  } catch (erro) {
    mensagem.innerHTML = `<div class="erro">Não foi possível salvar: ${erro.message}</div>`;
  }
}

function renderizarEncargos(encargos, baseBruta) {
  const painel = document.getElementById("painelEncargos");
  const corpoTabela = document.querySelector("#tabelaEncargos tbody");
  const historicoDiv = document.getElementById("historicoEncargos");
  corpoTabela.innerHTML = "";
  historicoDiv.innerHTML = "";

  const itens = Object.values(encargos);
  if (itens.length === 0) {
    painel.style.display = "none";
    return;
  }

  itens.forEach((item) => {
    const linha = document.createElement("tr");
    linha.innerHTML = `<td>${item.nome}</td><td class="valor">${formatarMoeda(item.devido)}</td>`;
    corpoTabela.appendChild(linha);

    const bloco = document.createElement("div");
    bloco.className = "historico-verba";
    bloco.innerHTML = `
      <h3>${item.nome}</h3>
      <div class="base-legal">${item.baseLegal}</div>
      <ul>${item.memoria.map((l) => `<li>${l}</li>`).join("")}</ul>
      <div class="valor-final">Resultado: ${formatarMoeda(item.devido)}</div>
    `;
    historicoDiv.appendChild(bloco);
  });

  const totalEncargos = arredondar(itens.reduce((soma, i) => soma + i.devido, 0));
  const linhaTotal = document.createElement("tr");
  linhaTotal.className = "total";
  linhaTotal.innerHTML = `<td>Total de encargos</td><td class="valor">${formatarMoeda(totalEncargos)}</td>`;
  corpoTabela.appendChild(linhaTotal);

  painel.style.display = "block";
}
