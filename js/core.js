/* Utilitários gerais e tabelas legais vigentes. */

/**
 * Escapa texto vindo do usuário (reclamante, nome do escritório, etc.) antes de
 * inserir via innerHTML — sem isso, alguém poderia salvar HTML/script num campo de
 * texto e ele rodaria na tela de quem visse aquele cálculo depois (XSS armazenado).
 */
function escapeHtml(texto) {
  const div = document.createElement("div");
  div.textContent = texto === null || texto === undefined ? "" : String(texto);
  return div.innerHTML;
}

function formatarMoeda(valor) {
  return Number(valor || 0).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

function arredondar(valor, casas = 2) {
  const fator = Math.pow(10, casas);
  return Math.round((valor + Number.EPSILON) * fator) / fator;
}

function parseDataBR(str) {
  if (!str) return null;
  const [ano, mes, dia] = str.split("-").map(Number);
  return new Date(ano, mes - 1, dia);
}

function formatarDataBR(data) {
  if (!data) return "-";
  return data.toLocaleDateString("pt-BR");
}

function somarDias(data, dias) {
  const d = new Date(data);
  d.setDate(d.getDate() + dias);
  return d;
}

function diffDias(dataInicio, dataFim) {
  const MS_DIA = 1000 * 60 * 60 * 24;
  return Math.round((dataFim - dataInicio) / MS_DIA);
}

/** Quantidade real de dias do mês de uma data (28-31), usada como divisor do saldo de salário. */
function diasNoMes(data) {
  return new Date(data.getFullYear(), data.getMonth() + 1, 0).getDate();
}

/**
 * Conta anos completos de serviço entre duas datas (aniversários de contrato).
 */
function anosCompletos(dataInicio, dataFim) {
  let anos = dataFim.getFullYear() - dataInicio.getFullYear();
  const aniversarioEsteAno = new Date(dataFim.getFullYear(), dataInicio.getMonth(), dataInicio.getDate());
  if (dataFim < aniversarioEsteAno) anos -= 1;
  return Math.max(anos, 0);
}

/**
 * Avos (0-12): cada mês com 15 dias ou mais trabalhados conta como um avo completo,
 * regra usada tanto para 13º quanto para férias proporcionais (art. 477 §1º CLT / Súmula 149-171 TST).
 */
function contarAvos(dataInicio, dataFim) {
  let avos = 0;
  let cursor = new Date(dataInicio);
  while (true) {
    const proximoMes = new Date(cursor);
    proximoMes.setMonth(proximoMes.getMonth() + 1);
    if (proximoMes > dataFim) {
      const diasNoMesParcial = diffDias(cursor, dataFim);
      if (diasNoMesParcial >= 15) avos += 1;
      break;
    }
    avos += 1;
    cursor = proximoMes;
  }
  return Math.min(avos, 12);
}

/**
 * Avos de 13º no ano-calendário (jan-dez), considerando a data final já projetada
 * pelo aviso prévio indenizado quando aplicável (Súmula 371 TST).
 */
function contarAvos13(dataFimProjetada) {
  const inicioAno = new Date(dataFimProjetada.getFullYear(), 0, 1);
  return contarAvos(inicioAno, dataFimProjetada);
}

/**
 * Aviso prévio proporcional — Lei 12.506/2011: 30 dias + 3 dias por ano completo de
 * serviço no mesmo empregador, limitado a 90 dias no total.
 */
function calcularDiasAvisoPrevio(dataAdmissao, dataDemissao) {
  const anos = anosCompletos(dataAdmissao, dataDemissao);
  return Math.min(30 + 3 * anos, 90);
}

/**
 * Início do período aquisitivo de férias em andamento na data da rescisão real
 * (não a projetada), e os avos proporcionais desse período até uma data final dada
 * (normalmente já projetada pelo aviso prévio indenizado). Extraído para reuso pelos
 * reflexos de horas extras/insalubridade/periculosidade sobre férias.
 */
function periodoAquisitivoAtualDeFerias(admissao, demissaoReal) {
  const anos = anosCompletos(admissao, demissaoReal);
  const inicio = new Date(admissao);
  inicio.setFullYear(inicio.getFullYear() + anos);
  return inicio;
}

function avosFeriasProporcionais(dados, dataFimConsiderada) {
  const inicio = periodoAquisitivoAtualDeFerias(dados.admissao, dados.demissao);
  return dataFimConsiderada > inicio ? contarAvos(inicio, dataFimConsiderada) : 0;
}

/* ----- Tabelas legais vigentes (revisar a cada mudança de legislação) ----- */

const SALARIO_MINIMO_2026 = 1621.0; // mesmo piso usado na tabela do INSS/seguro-desemprego 2026

const TABELA_INSS_2026 = {
  vigenciaDesde: "2026-01-01",
  fonte: "Portaria Interministerial MPS/MF nº 13, de 09/01/2026 — gov.br/inss",
  faixas: [
    { ate: 1621.00, aliquota: 0.075 },
    { ate: 2902.84, aliquota: 0.09 },
    { ate: 4354.27, aliquota: 0.12 },
    { ate: 8475.55, aliquota: 0.14 },
  ],
  teto: 8475.55,
};

const TABELA_IRRF_2026 = {
  vigenciaDesde: "2026-01-01",
  fonte: "Receita Federal — gov.br/receitafederal/tabelas/2026 (Lei 15.270/2025)",
  faixas: [
    { ate: 2428.80, aliquota: 0, deducao: 0 },
    { ate: 2826.65, aliquota: 0.075, deducao: 182.16 },
    { ate: 3751.05, aliquota: 0.15, deducao: 394.16 },
    { ate: 4664.68, aliquota: 0.225, deducao: 675.49 },
    { ate: Infinity, aliquota: 0.275, deducao: 908.73 },
  ],
  deducaoPorDependente: 189.59,
  deducaoSimplificadaMensal: 607.20, // limite mensal do desconto simplificado (alternativa às deduções itemizadas)
};

const TABELA_SEGURO_DESEMPREGO_2026 = {
  vigenciaDesde: "2026-01-11",
  fonte: "MTE — gov.br/trabalho-e-emprego, Resolução CODEFAT 957/2022 (valores reajustados jan/2026)",
  piso: 1621.00,
  teto: 2518.65,
  faixas: [
    { ate: 2222.17, multiplicador: 0.8, soma: 0 },
    { ate: 3703.99, multiplicador: 0.5, soma: 1777.74 },
    { ate: Infinity, valorFixo: 2518.65 },
  ],
};

function calcularINSS(base) {
  let total = 0;
  let restante = base;
  let faixaAnterior = 0;
  const memoria = [];
  for (const faixa of TABELA_INSS_2026.faixas) {
    if (base <= faixaAnterior) break;
    const limiteFaixa = Math.min(base, faixa.ate) - faixaAnterior;
    if (limiteFaixa > 0) {
      const valorFaixa = limiteFaixa * faixa.aliquota;
      total += valorFaixa;
      memoria.push(`${formatarMoeda(limiteFaixa)} x ${(faixa.aliquota * 100).toFixed(1)}% = ${formatarMoeda(valorFaixa)}`);
    }
    faixaAnterior = faixa.ate;
  }
  return { valor: arredondar(total), memoria };
}

function calcularIRRF(baseAposINSS, dependentes = 0) {
  const base = baseAposINSS - dependentes * TABELA_IRRF_2026.deducaoPorDependente;
  const faixa = TABELA_IRRF_2026.faixas.find((f) => base <= f.ate);
  const valor = Math.max(0, base * faixa.aliquota - faixa.deducao);
  return {
    valor: arredondar(valor),
    memoria: `Base ${formatarMoeda(base)} x ${(faixa.aliquota * 100).toFixed(1)}% - ${formatarMoeda(faixa.deducao)} = ${formatarMoeda(valor)}`,
  };
}

/**
 * IRPF sobre Rendimentos Recebidos Acumuladamente — Lei 7.713/1988 art. 12-A.
 * Evita o erro de jogar vários meses de verba atrasada de uma vez na tabela mensal
 * (o que empurraria tudo pra faixa de 27,5%): em vez disso, acha a alíquota pela
 * média mensal e aplica essa alíquota sobre o total, com a dedução também
 * multiplicada pelo número de meses. Usa o maior valor entre a dedução simplificada
 * (limite mensal x meses) e a itemizada (contribuição social + dependentes) informada,
 * conforme a própria lei permite escolher a mais vantajosa.
 */
function calcularIRRF_RRA(baseTotal, numMeses, dependentes, deducaoItemizadaTotal) {
  const deducaoSimplificada = TABELA_IRRF_2026.deducaoSimplificadaMensal * numMeses;
  const deducaoEscolhida = Math.max(deducaoSimplificada, deducaoItemizadaTotal);
  const usouSimplificada = deducaoSimplificada >= deducaoItemizadaTotal;
  const baseAposDeducoes = Math.max(0, baseTotal - deducaoEscolhida);
  const mediaMensal = baseAposDeducoes / numMeses;
  const faixa = TABELA_IRRF_2026.faixas.find((f) => mediaMensal <= f.ate);
  const valor = Math.max(0, baseAposDeducoes * faixa.aliquota - faixa.deducao * numMeses);
  return {
    valor: arredondar(valor),
    memoria: [
      `Dedução simplificada (${formatarMoeda(TABELA_IRRF_2026.deducaoSimplificadaMensal)}/mês x ${numMeses} meses): ${formatarMoeda(deducaoSimplificada)}`,
      `Dedução itemizada (contribuição social + dependentes): ${formatarMoeda(deducaoItemizadaTotal)}`,
      `Usa a maior: ${usouSimplificada ? "simplificada" : "itemizada"} = ${formatarMoeda(deducaoEscolhida)}`,
      `Base após dedução: ${formatarMoeda(baseTotal)} - ${formatarMoeda(deducaoEscolhida)} = ${formatarMoeda(baseAposDeducoes)}`,
      `Média mensal (base ÷ ${numMeses} meses): ${formatarMoeda(mediaMensal)} → faixa de ${(faixa.aliquota * 100).toFixed(1)}%`,
      `${formatarMoeda(baseAposDeducoes)} x ${(faixa.aliquota * 100).toFixed(1)}% - (${formatarMoeda(faixa.deducao)} x ${numMeses}) = ${formatarMoeda(valor)}`,
    ],
  };
}

function calcularParcelaSeguroDesemprego(salarioMedio) {
  let parcela;
  const [f1, f2, f3] = TABELA_SEGURO_DESEMPREGO_2026.faixas;
  if (salarioMedio <= f1.ate) {
    parcela = salarioMedio * f1.multiplicador;
  } else if (salarioMedio <= f2.ate) {
    parcela = (salarioMedio - f1.ate) * f2.multiplicador + f2.soma;
  } else {
    parcela = f3.valorFixo;
  }
  parcela = Math.max(parcela, TABELA_SEGURO_DESEMPREGO_2026.piso);
  parcela = Math.min(parcela, TABELA_SEGURO_DESEMPREGO_2026.teto);
  return arredondar(parcela);
}

/**
 * Número de parcelas do seguro-desemprego — regra geral da Resolução CODEFAT 957/2022.
 * Simplificação: assume período aquisitivo integral dentro do próprio vínculo informado.
 * Sempre exibir esse número para conferência humana, pois depende do histórico de
 * solicitações anteriores do trabalhador, que o sistema não tem como saber sozinho.
 */
function calcularParcelasSeguroDesemprego(mesesVinculo, numeroSolicitacao = 1) {
  if (numeroSolicitacao <= 1) {
    if (mesesVinculo >= 24) return 5;
    if (mesesVinculo >= 12) return 4;
    return 0;
  }
  if (numeroSolicitacao === 2) {
    if (mesesVinculo >= 24) return 5;
    if (mesesVinculo >= 12) return 4;
    if (mesesVinculo >= 9) return 3;
    return 0;
  }
  if (mesesVinculo >= 24) return 5;
  if (mesesVinculo >= 12) return 4;
  if (mesesVinculo >= 6) return 3;
  return 0;
}
