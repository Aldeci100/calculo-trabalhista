/*
 * Motor de cálculo — Fase 1.
 * Cada verba é uma definição independente: { id, nome, baseLegal, incideFGTS, calcular(dados, opcoes) }.
 * calcular() sempre devolve { devido, memoria: [linhas do passo a passo] } para alimentar
 * o Histórico de Cálculo exibido ao usuário — nunca só o número final.
 */

function dataFimProjetada(dados) {
  if (dados.avisoPrevio === "indenizado") {
    const dias = calcularDiasAvisoPrevio(dados.admissao, dados.demissao);
    return somarDias(dados.demissao, dias);
  }
  return dados.demissao;
}

/**
 * Reflexos de uma parcela paga habitualmente (horas extras, insalubridade,
 * periculosidade) sobre 13º, férias proporcionais e aviso prévio indenizado —
 * mesma proporção (avos/dias) já usada para calcular essas verbas sobre o salário
 * base, só que aplicada ao valor médio mensal do adicional em vez do salário todo.
 */
function calcularReflexosSobreAdicional(dados, valorMensalAdicional) {
  const fim = dataFimProjetada(dados);
  const avos13 = contarAvos13(fim);
  const avosFerias = avosFeriasProporcionais(dados, fim);

  const reflexoDecimoTerceiro = arredondar((valorMensalAdicional / 12) * avos13);
  const reflexoFerias = arredondar((valorMensalAdicional / 12) * avosFerias * (4 / 3));

  let reflexoAvisoPrevio = 0;
  if (dados.avisoPrevio === "indenizado") {
    const dias = calcularDiasAvisoPrevio(dados.admissao, dados.demissao);
    reflexoAvisoPrevio = arredondar((valorMensalAdicional / 30) * dias);
  }

  const memoria = [
    `Reflexo no 13º: (${formatarMoeda(valorMensalAdicional)} ÷ 12) x ${avos13} avos = ${formatarMoeda(reflexoDecimoTerceiro)}`,
    `Reflexo nas férias proporcionais: (${formatarMoeda(valorMensalAdicional)} ÷ 12) x ${avosFerias} avos x 4/3 = ${formatarMoeda(reflexoFerias)}`,
  ];
  if (dados.avisoPrevio === "indenizado") {
    memoria.push(`Reflexo no aviso prévio indenizado: (${formatarMoeda(valorMensalAdicional)} ÷ 30) x dias do aviso = ${formatarMoeda(reflexoAvisoPrevio)}`);
  }

  return {
    total: arredondar(reflexoDecimoTerceiro + reflexoFerias + reflexoAvisoPrevio),
    memoria,
  };
}

const VERBA_SALDO_SALARIO = {
  id: "saldoSalario",
  nome: "Saldo de salário",
  baseLegal: "CLT art. 459 — dias efetivamente trabalhados no mês da rescisão, divisor fixo de 30 dias (mês comercial)",
  incideFGTS: true,
  incideContribSocialIRPF: true,
  calcular(dados) {
    const dias = dados.demissao.getDate();
    const valorDia = dados.salario / 30;
    const devido = arredondar(valorDia * dias);
    return {
      devido,
      memoria: [
        `Dias trabalhados no mês da rescisão: ${dias}`,
        `(${formatarMoeda(dados.salario)} ÷ 30) x ${dias} = ${formatarMoeda(devido)}`,
      ],
    };
  },
};

const VERBA_SALARIO_RETIDO = {
  id: "salarioRetido",
  nome: "Salário retido (mês(es) integral(is) não pago(s))",
  baseLegal: "CLT art. 459 — salário de meses anteriores à rescisão que não foram pagos, diferente do saldo do mês de saída",
  incideFGTS: true,
  incideContribSocialIRPF: true,
  calcular(dados, opcoes) {
    const valorMensal = Number(opcoes.valorMensal || dados.salario || 0);
    const meses = Number(opcoes.meses || 0);
    const devido = arredondar(valorMensal * meses);
    return { devido, memoria: [`${formatarMoeda(valorMensal)} x ${meses} mês(es) não pago(s) = ${formatarMoeda(devido)}`] };
  },
};

const VERBA_AVISO_PREVIO = {
  id: "avisoPrevio",
  nome: "Aviso prévio indenizado",
  baseLegal: "Lei 12.506/2011 (30 dias + 3 dias por ano completo, máx. 90) — Súmula 371 TST (projeção)",
  incideFGTS: true,
  incideContribSocialIRPF: false,
  calcular(dados) {
    if (dados.avisoPrevio !== "indenizado") {
      return { devido: 0, memoria: [`Aviso prévio não indenizado (tipo: ${dados.avisoPrevio}) — sem verba a pagar aqui.`] };
    }
    const anos = anosCompletos(dados.admissao, dados.demissao);
    const dias = calcularDiasAvisoPrevio(dados.admissao, dados.demissao);
    const valorDia = dados.salario / 30;
    const devido = arredondar(valorDia * dias);
    return {
      devido,
      memoria: [
        `Anos completos de serviço: ${anos} → 30 + 3x${anos} = ${dias} dias (limitado a 90)`,
        `(${formatarMoeda(dados.salario)} ÷ 30) x ${dias} = ${formatarMoeda(devido)}`,
        `Projeta o fim do contrato para ${formatarDataBR(somarDias(dados.demissao, dias))} (Súmula 371 TST) — usado no 13º e nas férias proporcionais.`,
      ],
    };
  },
};

const VERBA_DECIMO_TERCEIRO = {
  id: "decimoTerceiro",
  nome: "13º salário proporcional",
  baseLegal: "Lei 4.090/1962 — 1/12 do salário por mês com 15 dias ou mais trabalhados no ano",
  incideFGTS: true,
  incideContribSocialIRPF: true,
  calcular(dados) {
    const fim = dataFimProjetada(dados);
    const avos = contarAvos13(fim);
    const devido = arredondar((dados.salario / 12) * avos);
    return {
      devido,
      memoria: [
        `Data final considerada (com projeção do aviso, se houver): ${formatarDataBR(fim)}`,
        `Avos no ano-calendário: ${avos}/12`,
        `(${formatarMoeda(dados.salario)} ÷ 12) x ${avos} = ${formatarMoeda(devido)}`,
      ],
    };
  },
};

const VERBA_FERIAS = {
  id: "ferias",
  nome: "Férias + 1/3",
  baseLegal: "CLT arts. 146 e 147, art. 7º XVII CF/88 (1/3 constitucional)",
  incideFGTS: false,
  incideContribSocialIRPF: false,
  calcular(dados, opcoes) {
    const periodosVencidos = Number(opcoes.periodosVencidos || 0);
    const valorVencidas = arredondar(periodosVencidos * dados.salario * (4 / 3));

    const anos = anosCompletos(dados.admissao, dados.demissao);
    const inicioPeriodoAtual = new Date(dados.admissao);
    inicioPeriodoAtual.setFullYear(inicioPeriodoAtual.getFullYear() + anos);
    const fim = dataFimProjetada(dados);
    const avosProporcionais = fim > inicioPeriodoAtual ? contarAvos(inicioPeriodoAtual, fim) : 0;
    const valorProporcionais = arredondar((dados.salario / 12) * avosProporcionais * (4 / 3));

    const devido = arredondar(valorVencidas + valorProporcionais);
    return {
      devido,
      memoria: [
        `Períodos vencidos e não gozados informados: ${periodosVencidos} x (${formatarMoeda(dados.salario)} + 1/3) = ${formatarMoeda(valorVencidas)}`,
        `Período aquisitivo atual: ${formatarDataBR(inicioPeriodoAtual)} até ${formatarDataBR(fim)} (projeção incluída) = ${avosProporcionais}/12 avos`,
        `(${formatarMoeda(dados.salario)} ÷ 12) x ${avosProporcionais} x 4/3 = ${formatarMoeda(valorProporcionais)}`,
        `Total férias + 1/3 = ${formatarMoeda(valorVencidas)} + ${formatarMoeda(valorProporcionais)} = ${formatarMoeda(devido)}`,
      ],
    };
  },
};

const VERBA_VALE_TRANSPORTE = {
  id: "valeTransporte",
  nome: "Vale-transporte não pago",
  baseLegal: "Lei 7.418/1985 — valor informado pelo escritório conforme os autos",
  incideFGTS: false,
  incideContribSocialIRPF: false,
  calcular(dados, opcoes) {
    const valorMensal = Number(opcoes.valorMensal || 0);
    const meses = Number(opcoes.meses || 0);
    const devido = arredondar(valorMensal * meses);
    return { devido, memoria: [`${formatarMoeda(valorMensal)} x ${meses} meses = ${formatarMoeda(devido)}`] };
  },
};

const VERBA_TIQUETE_ALIMENTACAO = {
  id: "tiqueteAlimentacao",
  nome: "Tíquete-alimentação não pago",
  baseLegal: "Norma coletiva/contratual — valor informado pelo escritório conforme os autos",
  incideFGTS: false,
  incideContribSocialIRPF: false,
  calcular(dados, opcoes) {
    const valorMensal = Number(opcoes.valorMensal || 0);
    const meses = Number(opcoes.meses || 0);
    const devido = arredondar(valorMensal * meses);
    return { devido, memoria: [`${formatarMoeda(valorMensal)} x ${meses} meses = ${formatarMoeda(devido)}`] };
  },
};

const VERBA_DIFERENCA_SALARIAL = {
  id: "diferencaSalarial",
  nome: "Diferença salarial",
  baseLegal: "CLT art. 461 (equiparação) ou diferença contratual reconhecida — valor informado pelo escritório",
  incideFGTS: true,
  incideContribSocialIRPF: true,
  calcular(dados, opcoes) {
    const valorMensal = Number(opcoes.valorMensal || 0);
    const meses = Number(opcoes.meses || 0);
    const devido = arredondar(valorMensal * meses);
    return { devido, memoria: [`${formatarMoeda(valorMensal)} x ${meses} meses = ${formatarMoeda(devido)}`] };
  },
};

const VERBA_MULTA_477 = {
  id: "multa477",
  nome: "Multa do art. 477 da CLT",
  baseLegal: "CLT art. 477 §8º — 1 salário do trabalhador se as verbas rescisórias não forem pagas em até 10 dias corridos da rescisão",
  incideFGTS: false,
  incideContribSocialIRPF: false,
  calcular(dados, opcoes) {
    if (opcoes.pagoNoPrazo) {
      return { devido: 0, memoria: ["Verbas pagas dentro do prazo legal de 10 dias — multa não incide."] };
    }
    const devido = arredondar(dados.salario);
    return {
      devido,
      memoria: [
        "Verbas rescisórias não pagas em até 10 dias corridos — multa de 1 salário incide (art. 477 §8º CLT).",
        `1 x ${formatarMoeda(dados.salario)} = ${formatarMoeda(devido)}`,
      ],
    };
  },
};

// A base da multa do art. 467 é somada automaticamente pelo motor (calcularRescisao),
// a partir do resultado já calculado destas verbas — por isso não tem opcoes próprias.
const VERBAS_BASE_MULTA_467 = [
  { id: "saldoSalario", label: "Saldo de salário" },
  { id: "avisoPrevio", label: "Aviso prévio indenizado" },
  { id: "decimoTerceiro", label: "13º salário proporcional" },
  { id: "ferias", label: "Férias + 1/3" },
  { id: "multa40FGTS", label: "Multa de 40% sobre o FGTS" },
];

const VERBA_MULTA_467 = {
  id: "multa467",
  nome: "Multa do art. 467 da CLT",
  baseLegal: "CLT art. 467 — 50% sobre a soma de saldo de salário, aviso prévio indenizado, 13º, férias e multa de 40% do FGTS, quando incontroversas e não pagas na primeira audiência",
  incideFGTS: false,
  incideContribSocialIRPF: false,
  calcularComBase(resultadosJaCalculados) {
    const partes = VERBAS_BASE_MULTA_467.map(({ id, label }) => {
      const r = resultadosJaCalculados.find((x) => x.id === id);
      return { label, valor: r ? r.devido : 0 };
    });
    const baseIncontroversa = arredondar(partes.reduce((soma, p) => soma + p.valor, 0));
    const devido = arredondar(baseIncontroversa * 0.5);
    return {
      devido,
      memoria: [
        ...partes.map((p) => `${p.label}: ${formatarMoeda(p.valor)}`),
        `Base incontroversa (soma): ${formatarMoeda(baseIncontroversa)}`,
        `${formatarMoeda(baseIncontroversa)} x 50% = ${formatarMoeda(devido)}`,
      ],
    };
  },
};

const VERBA_MULTA_CONVENCIONAL = {
  id: "multaConvencional",
  nome: "Multa convencional",
  baseLegal: "Norma coletiva (CCT/ACT) — valor apurado conforme a cláusula aplicável, informado pelo escritório",
  incideFGTS: false,
  incideContribSocialIRPF: false,
  calcular(dados, opcoes) {
    const devido = arredondar(Number(opcoes.valor || 0));
    return { devido, memoria: [`Valor informado pelo escritório: ${formatarMoeda(devido)}`] };
  },
};

const VERBA_DANO_MORAL = {
  id: "danoMoral",
  nome: "Indenização por dano moral",
  baseLegal: "CF/88 art. 5º V e X, CLT arts. 223-A a 223-G — valor arbitrado pelo juízo/pleiteado pelo escritório",
  incideFGTS: false,
  incideContribSocialIRPF: false,
  calcular(dados, opcoes) {
    const devido = arredondar(Number(opcoes.valor || 0));
    return { devido, memoria: [`Valor informado pelo escritório: ${formatarMoeda(devido)}`] };
  },
};

const VERBA_INDENIZACAO_SEGURO_DESEMPREGO = {
  id: "indenizacaoSeguroDesemprego",
  nome: "Indenização substitutiva do seguro-desemprego",
  baseLegal: "Súmula 389 TST + Lei 7.998/1990 + Resolução CODEFAT 957/2022 — devida quando o empregador não entrega as guias",
  incideFGTS: false,
  incideContribSocialIRPF: false,
  calcular(dados, opcoes) {
    const mesesVinculo = Math.max(1, Math.round(diffDias(dados.admissao, dados.demissao) / 30));
    const numeroSolicitacao = Number(opcoes.numeroSolicitacao || 1);
    const salarioMedio = dados.salario;
    const parcela = calcularParcelaSeguroDesemprego(salarioMedio);
    const numParcelas = calcularParcelasSeguroDesemprego(mesesVinculo, numeroSolicitacao);
    const devido = arredondar(parcela * numParcelas);
    return {
      devido,
      memoria: [
        `Tempo de vínculo: ~${mesesVinculo} meses · Solicitação de número: ${numeroSolicitacao}`,
        `Valor da parcela pela tabela vigente (${TABELA_SEGURO_DESEMPREGO_2026.fonte}): ${formatarMoeda(parcela)}`,
        `Número de parcelas pela regra geral do CODEFAT: ${numParcelas}`,
        `${formatarMoeda(parcela)} x ${numParcelas} = ${formatarMoeda(devido)}`,
        "Observação: confirme o número da solicitação (1ª/2ª/3ª+) com o histórico do trabalhador — o sistema não tem como saber isso sozinho.",
      ],
    };
  },
};

const CARGA_HORARIA_MENSAL_PADRAO = 220; // divisor legal padrão (súmula 366 TST usa 220h para mensalistas)

const VERBA_HORAS_EXTRAS = {
  id: "horasExtras",
  nome: "Horas extras (com DSR e reflexos)",
  baseLegal: "CLT art. 59 §1º, Súmula 172 TST (DSR sobre HE habituais), Súmula 264 TST (reflexos)",
  incideFGTS: true,
  incideContribSocialIRPF: true,
  calcular(dados, opcoes) {
    const horasPorMes = Number(opcoes.horasPorMes || 0);
    const percentual = Number(opcoes.percentualAdicional || 0.5);
    const meses = Number(opcoes.meses || 0);
    const diasUteisMes = Number(opcoes.diasUteisMes || 25);
    const diasRepousoMes = Number(opcoes.diasRepousoMes || 5);

    const valorHora = dados.salario / CARGA_HORARIA_MENSAL_PADRAO;
    const valorHoraExtra = valorHora * (1 + percentual);
    const heMensal = valorHoraExtra * horasPorMes;
    const heTotal = heMensal * meses;

    const dsrMensal = heMensal * (diasRepousoMes / diasUteisMes);
    const dsrTotal = dsrMensal * meses;

    const baseReflexoMensal = heMensal + dsrMensal;
    const reflexos = calcularReflexosSobreAdicional(dados, baseReflexoMensal);

    const devido = arredondar(heTotal + dsrTotal + reflexos.total);

    return {
      devido,
      memoria: [
        `Valor da hora normal: ${formatarMoeda(dados.salario)} ÷ ${CARGA_HORARIA_MENSAL_PADRAO}h = ${formatarMoeda(valorHora)}`,
        `Valor da hora extra (+${(percentual * 100).toFixed(0)}%): ${formatarMoeda(valorHoraExtra)}`,
        `HE por mês: ${formatarMoeda(valorHoraExtra)} x ${horasPorMes}h = ${formatarMoeda(heMensal)} · x ${meses} meses = ${formatarMoeda(heTotal)}`,
        `DSR sobre HE (Súmula 172 TST): ${formatarMoeda(heMensal)} x (${diasRepousoMes}/${diasUteisMes}) = ${formatarMoeda(dsrMensal)}/mês · x ${meses} meses = ${formatarMoeda(dsrTotal)}`,
        `Base mensal para reflexos (HE + DSR): ${formatarMoeda(baseReflexoMensal)}`,
        ...reflexos.memoria,
        `Total: ${formatarMoeda(heTotal)} + ${formatarMoeda(dsrTotal)} + ${formatarMoeda(reflexos.total)} (reflexos) = ${formatarMoeda(devido)}`,
      ],
    };
  },
};

const VERBA_INSALUBRIDADE = {
  id: "insalubridade",
  nome: "Adicional de insalubridade",
  baseLegal: "CLT art. 192 — 10/20/40% sobre o salário mínimo (grau mínimo/médio/máximo), Súmula 228 TST",
  incideFGTS: true,
  incideContribSocialIRPF: true,
  calcular(dados, opcoes) {
    const grau = Number(opcoes.grau || 0.2);
    const meses = Number(opcoes.meses || 0);
    const adicionalMensal = SALARIO_MINIMO_2026 * grau;
    const total = adicionalMensal * meses;
    const reflexos = calcularReflexosSobreAdicional(dados, adicionalMensal);
    const devido = arredondar(total + reflexos.total);
    return {
      devido,
      memoria: [
        `Grau: ${(grau * 100).toFixed(0)}% sobre o salário mínimo (${formatarMoeda(SALARIO_MINIMO_2026)}) = ${formatarMoeda(adicionalMensal)}/mês`,
        `${formatarMoeda(adicionalMensal)} x ${meses} meses = ${formatarMoeda(total)}`,
        ...reflexos.memoria,
        `Total: ${formatarMoeda(total)} + ${formatarMoeda(reflexos.total)} (reflexos) = ${formatarMoeda(devido)}`,
      ],
    };
  },
};

const VERBA_PERICULOSIDADE = {
  id: "periculosidade",
  nome: "Adicional de periculosidade",
  baseLegal: "CLT art. 193 §1º — 30% fixo sobre o salário base (não é sobre o salário mínimo, diferente da insalubridade)",
  incideFGTS: true,
  incideContribSocialIRPF: true,
  calcular(dados, opcoes) {
    const meses = Number(opcoes.meses || 0);
    const adicionalMensal = dados.salario * 0.3;
    const total = adicionalMensal * meses;
    const reflexos = calcularReflexosSobreAdicional(dados, adicionalMensal);
    const devido = arredondar(total + reflexos.total);
    return {
      devido,
      memoria: [
        `30% sobre o salário base (${formatarMoeda(dados.salario)}) = ${formatarMoeda(adicionalMensal)}/mês`,
        `${formatarMoeda(adicionalMensal)} x ${meses} meses = ${formatarMoeda(total)}`,
        ...reflexos.memoria,
        `Total: ${formatarMoeda(total)} + ${formatarMoeda(reflexos.total)} (reflexos) = ${formatarMoeda(devido)}`,
      ],
    };
  },
};

const VERBA_INTRAJORNADA = {
  id: "intrajornada",
  nome: "Intervalo intrajornada suprimido",
  baseLegal: "CLT art. 71 §4º (redação Lei 13.467/2017) — natureza indenizatória, só o período suprimido, sem reflexos",
  incideFGTS: false,
  incideContribSocialIRPF: false,
  calcular(dados, opcoes) {
    const minutosPorDia = Number(opcoes.minutosPorDia || 0);
    const diasPorMes = Number(opcoes.diasPorMes || 0);
    const meses = Number(opcoes.meses || 0);
    const valorHora = dados.salario / CARGA_HORARIA_MENSAL_PADRAO;
    const valorMinutoComAdicional = (valorHora / 60) * 1.5;
    const devido = arredondar(valorMinutoComAdicional * minutosPorDia * diasPorMes * meses);
    return {
      devido,
      memoria: [
        `Valor do minuto com adicional de 50%: (${formatarMoeda(dados.salario)} ÷ ${CARGA_HORARIA_MENSAL_PADRAO}h ÷ 60) x 1,5 = ${formatarMoeda(valorMinutoComAdicional)}`,
        `${formatarMoeda(valorMinutoComAdicional)} x ${minutosPorDia} min x ${diasPorMes} dias x ${meses} meses = ${formatarMoeda(devido)}`,
        "Natureza indenizatória desde a Reforma Trabalhista — sem reflexos em férias/13º/FGTS.",
      ],
    };
  },
};

const VERBA_INTERJORNADA = {
  id: "interjornada",
  nome: "Intervalo interjornada suprimido",
  baseLegal: "CLT art. 66 (mín. 11h entre jornadas) — Súmula 110 TST, tratado como extra com reflexos",
  incideFGTS: true,
  incideContribSocialIRPF: true,
  calcular(dados, opcoes) {
    const horasSuprimidas = Number(opcoes.horasSuprimidasPorOcorrencia || 0);
    const ocorrencias = Number(opcoes.ocorrencias || 0);
    const valorHora = dados.salario / CARGA_HORARIA_MENSAL_PADRAO;
    const valorHoraComAdicional = valorHora * 1.5;
    const total = arredondar(valorHoraComAdicional * horasSuprimidas * ocorrencias);

    const mesesVinculo = Math.max(1, Math.round(diffDias(dados.admissao, dados.demissao) / 30));
    const baseReflexoMensal = total / mesesVinculo;
    const reflexos = calcularReflexosSobreAdicional(dados, baseReflexoMensal);
    const devido = arredondar(total + reflexos.total);

    return {
      devido,
      memoria: [
        `Valor da hora com adicional de 50% (Súmula 110 TST): ${formatarMoeda(valorHoraComAdicional)}`,
        `${formatarMoeda(valorHoraComAdicional)} x ${horasSuprimidas}h x ${ocorrencias} ocorrências = ${formatarMoeda(total)}`,
        `Diluído ao longo do vínculo (~${mesesVinculo} meses) para calcular reflexos: ${formatarMoeda(baseReflexoMensal)}/mês`,
        ...reflexos.memoria,
        `Total: ${formatarMoeda(total)} + ${formatarMoeda(reflexos.total)} (reflexos) = ${formatarMoeda(devido)}`,
      ],
    };
  },
};

const VERBAS_FASE1 = [
  VERBA_SALDO_SALARIO,
  VERBA_SALARIO_RETIDO,
  VERBA_AVISO_PREVIO,
  VERBA_DECIMO_TERCEIRO,
  VERBA_FERIAS,
  VERBA_VALE_TRANSPORTE,
  VERBA_TIQUETE_ALIMENTACAO,
  VERBA_DIFERENCA_SALARIAL,
  VERBA_MULTA_477,
  VERBA_MULTA_467,
  VERBA_MULTA_CONVENCIONAL,
  VERBA_DANO_MORAL,
  VERBA_INDENIZACAO_SEGURO_DESEMPREGO,
  VERBA_HORAS_EXTRAS,
  VERBA_INSALUBRIDADE,
  VERBA_PERICULOSIDADE,
  VERBA_INTRAJORNADA,
  VERBA_INTERJORNADA,
];

/**
 * Roda todas as verbas ativas, depois soma FGTS 8% (sobre as verbas com incidência)
 * e a multa de 40% sobre esse FGTS + o saldo/extrato informado pelo escritório.
 */
function calcularRescisao(dados, verbasAtivas, opcoesFGTS, opcoesTributos) {
  const resultados = [];

  for (const verba of VERBAS_FASE1) {
    if (verba.id === "multa467") continue; // calculada depois, com base no resultado das outras verbas
    const ativa = verbasAtivas[verba.id];
    if (!ativa || !ativa.selecionada) continue;
    const { devido, memoria } = verba.calcular(dados, ativa.opcoes || {});
    resultados.push({
      id: verba.id,
      nome: verba.nome,
      baseLegal: verba.baseLegal,
      devido,
      memoria,
      incideFGTS: verba.incideFGTS,
      incideContribSocialIRPF: !!verba.incideContribSocialIRPF,
    });
  }

  let fgts = null;
  let multa40 = null;
  if (opcoesFGTS && opcoesFGTS.calcular) {
    const baseFGTS = resultados.filter((r) => r.incideFGTS).reduce((soma, r) => soma + r.devido, 0);
    const devidoFGTS = arredondar(baseFGTS * 0.08);
    const memoriaFGTS = [
      `Verbas com incidência de FGTS: ${resultados.filter((r) => r.incideFGTS).map((r) => r.nome).join(", ") || "nenhuma selecionada"}`,
      `Base: ${formatarMoeda(baseFGTS)} x 8% = ${formatarMoeda(devidoFGTS)}`,
    ];
    fgts = { id: "fgts8", nome: "FGTS 8% sobre as verbas rescisórias", baseLegal: "Lei 8.036/1990 art. 15", devido: devidoFGTS, memoria: memoriaFGTS, incideFGTS: false };
    resultados.push(fgts);

    const saldoInformado = Number(opcoesFGTS.saldoInformado || 0);
    const baseMulta = devidoFGTS + saldoInformado;
    const devidoMulta40 = arredondar(baseMulta * 0.4);
    multa40 = {
      id: "multa40FGTS",
      nome: "Multa de 40% sobre o FGTS",
      baseLegal: "Lei 8.036/1990 art. 18 §1º",
      devido: devidoMulta40,
      memoria: [
        `FGTS devido nesta rescisão (${formatarMoeda(devidoFGTS)}) + saldo/extrato informado da conta vinculada (${formatarMoeda(saldoInformado)}) = ${formatarMoeda(baseMulta)}`,
        `${formatarMoeda(baseMulta)} x 40% = ${formatarMoeda(devidoMulta40)}`,
        saldoInformado === 0 ? "Atenção: nenhum saldo/extrato de FGTS foi informado — se o vínculo tiver depósitos anteriores não reconstruídos aqui, a multa está subestimada." : "",
      ].filter(Boolean),
    };
    resultados.push(multa40);
  }

  if (verbasAtivas.multa467 && verbasAtivas.multa467.selecionada) {
    const { devido, memoria } = VERBA_MULTA_467.calcularComBase(resultados);
    resultados.push({
      id: "multa467",
      nome: VERBA_MULTA_467.nome,
      baseLegal: VERBA_MULTA_467.baseLegal,
      devido,
      memoria,
      incideFGTS: false,
      incideContribSocialIRPF: false,
    });
  }

  if (opcoesTributos && (opcoesTributos.calcularContribSocial || opcoesTributos.calcularIRPF)) {
    const baseTributavel = resultados.filter((r) => r.incideContribSocialIRPF).reduce((soma, r) => soma + r.devido, 0);
    const numMeses = Math.max(1, Number(opcoesTributos.numMeses || 1));
    let valorINSSTotal = 0;

    if (opcoesTributos.calcularContribSocial) {
      const baseMensalMedia = baseTributavel / numMeses;
      const { valor: inssMensal, memoria: memoriaINSS } = calcularINSS(baseMensalMedia);
      valorINSSTotal = arredondar(inssMensal * numMeses);
      resultados.push({
        id: "contribSocialSegurado",
        nome: "Contribuição social do segurado (desconto)",
        baseLegal: "Lei 8.212/1991, Súmula 368 itens IV e V do TST — apurada por competência, não sobre o total acumulado de uma vez",
        devido: arredondar(-valorINSSTotal),
        memoria: [
          `Verbas de natureza salarial (entram na base): ${resultados.filter((r) => r.incideContribSocialIRPF).map((r) => r.nome).join(", ") || "nenhuma"}`,
          `Base total: ${formatarMoeda(baseTributavel)} ÷ ${numMeses} meses de referência = ${formatarMoeda(baseMensalMedia)}/mês`,
          `INSS de um mês nessa base média:`,
          ...memoriaINSS,
          `${formatarMoeda(inssMensal)}/mês x ${numMeses} meses = ${formatarMoeda(valorINSSTotal)}`,
          "Simplificação: assume distribuição uniforme da base entre os meses informados — se os valores mensais reais variarem muito, o resultado pode diferir de um cálculo competência a competência.",
        ],
        incideFGTS: false,
        incideContribSocialIRPF: false,
      });
    }

    if (opcoesTributos.calcularIRPF) {
      const dependentes = Number(opcoesTributos.dependentes || 0);
      const deducaoItemizadaTotal = valorINSSTotal + dependentes * TABELA_IRRF_2026.deducaoPorDependente * numMeses;
      const { valor: valorIRPF, memoria: memoriaIRPF } = calcularIRRF_RRA(baseTributavel, numMeses, dependentes, deducaoItemizadaTotal);
      resultados.push({
        id: "irpf",
        nome: "IRPF sobre as verbas (desconto)",
        baseLegal: "Lei 7.713/1988 art. 12-A — Rendimentos Recebidos Acumuladamente (RRA)",
        devido: arredondar(-valorIRPF),
        memoria: [
          `Base tributável total: ${formatarMoeda(baseTributavel)} · Meses de referência: ${numMeses} · Dependentes: ${dependentes}`,
          ...memoriaIRPF,
        ],
        incideFGTS: false,
        incideContribSocialIRPF: false,
      });
    }
  }

  const total = arredondar(resultados.reduce((soma, r) => soma + r.devido, 0));
  return { resultados, total };
}

const TETO_CUSTAS_JUDICIAIS = 4 * TABELA_INSS_2026.teto; // CLT art. 789, I — 4x o teto do RGPS
const PISO_CUSTAS_JUDICIAIS = 10.64; // CLT art. 789, valor fixo em lei

/**
 * Honorários de sucumbência (CLT art. 791-A) e custas judiciais (CLT art. 789) —
 * encargos do reclamado, não entram no valor líquido que o trabalhador recebe.
 * baseBruta = soma das verbas positivas devidas ao reclamante (sem descontos de
 * INSS/IRPF, que são do trabalhador, não do valor da condenação).
 */
function calcularHonorariosECustas(baseBruta, opcoes) {
  const resultado = {};

  if (opcoes.calcularHonorarios) {
    const percentual = Number(opcoes.percentualHonorarios || 0.1);
    const devido = arredondar(baseBruta * percentual);
    resultado.honorarios = {
      nome: "Honorários de sucumbência (a favor do patrono do reclamante)",
      baseLegal: "CLT art. 791-A — entre 5% e 15% sobre o valor da condenação",
      devido,
      memoria: [
        `Base (valor bruto da condenação): ${formatarMoeda(baseBruta)}`,
        `${formatarMoeda(baseBruta)} x ${(percentual * 100).toFixed(0)}% = ${formatarMoeda(devido)}`,
      ],
    };
  }

  if (opcoes.calcularCustas) {
    let devido = arredondar(baseBruta * 0.02);
    const memoria = [`Base: ${formatarMoeda(baseBruta)} x 2% = ${formatarMoeda(devido)}`];
    if (devido < PISO_CUSTAS_JUDICIAIS) {
      memoria.push(`Abaixo do piso legal (${formatarMoeda(PISO_CUSTAS_JUDICIAIS)}) — aplica o piso.`);
      devido = PISO_CUSTAS_JUDICIAIS;
    } else if (devido > TETO_CUSTAS_JUDICIAIS) {
      memoria.push(`Acima do teto legal (4x o teto do INSS/RGPS = ${formatarMoeda(TETO_CUSTAS_JUDICIAIS)}) — aplica o teto.`);
      devido = TETO_CUSTAS_JUDICIAIS;
    }
    resultado.custas = {
      nome: "Custas judiciais (devidas pelo reclamado)",
      baseLegal: `CLT art. 789 — 2%, piso ${formatarMoeda(PISO_CUSTAS_JUDICIAIS)}, teto 4x o teto do INSS/RGPS`,
      devido: arredondar(devido),
      memoria,
    };
  }

  return resultado;
}
