/*
 * Fase 2 — correção monetária e juros de mora, conforme ADC 58/59 do STF:
 *   Fase pré-judicial (do vencimento até o ajuizamento): IPCA-E (correção) + juros
 *   simples de 1% ao mês, pro-rata die (art. 39 §1º da Lei 8.177/1991).
 *   Fase judicial (do ajuizamento até a liquidação): SELIC acumulada mês a mês —
 *   índice único, já embute juros e correção, vedada a cumulação com outro índice.
 * Simplificação assumida: todas as verbas têm a mesma data de vencimento (a da
 * rescisão) — na prática cada verba pode vencer em momento levemente distinto
 * (Súmula 381 TST). Reveja essa data caso o processo exija precisão maior aqui.
 */

const TAXA_JUROS_MENSAL_PRE_JUDICIAL = 0.01; // 1% a.m. simples, art. 39 Lei 8.177/1991

function calcularCorrecaoJuros(valorNominal, dataVencimento, dataAjuizamento, dataLiquidacao, mapaIPCAE, mapaSELIC) {
  const memoria = [];
  const mesInicioCorrecao = proximoMes(chaveMes(dataVencimento));

  if (dataAjuizamento && dataAjuizamento > dataVencimento) {
    const mesFimIPCAE = mesAnterior(chaveMes(dataAjuizamento));
    const { fator: fatorIPCAE, faltantes: faltantesIPCAE } = acumularFator(mapaIPCAE, mesInicioCorrecao, mesFimIPCAE);
    const diasPreJudicial = diffDias(dataVencimento, dataAjuizamento);
    const jurosPreJudicial = (diasPreJudicial / 30) * TAXA_JUROS_MENSAL_PRE_JUDICIAL;
    const valorAposPreJudicial = valorNominal * fatorIPCAE * (1 + jurosPreJudicial);

    const mesInicioSELIC = chaveMes(dataAjuizamento);
    const mesFimSELIC = chaveMes(dataLiquidacao);
    const { fator: fatorSELIC, faltantes: faltantesSELIC } = acumularFator(mapaSELIC, mesInicioSELIC, mesFimSELIC);
    const valorFinal = valorAposPreJudicial * fatorSELIC;

    memoria.push(`Fase pré-judicial (${formatarDataBR(dataVencimento)} a ${formatarDataBR(dataAjuizamento)}): IPCA-E acumulado x${fatorIPCAE.toFixed(6)} + juros 1% a.m. pro-rata (${diasPreJudicial} dias) = x${(1 + jurosPreJudicial).toFixed(6)}`);
    memoria.push(`Fase judicial (${formatarDataBR(dataAjuizamento)} a ${formatarDataBR(dataLiquidacao)}): SELIC acumulada x${fatorSELIC.toFixed(6)} (já inclui juros)`);
    memoria.push(`${formatarMoeda(valorNominal)} x ${fatorIPCAE.toFixed(6)} x ${(1 + jurosPreJudicial).toFixed(6)} x ${fatorSELIC.toFixed(6)} = ${formatarMoeda(valorFinal)}`);
    if (faltantesIPCAE.length) memoria.push(`Atenção: IPCA-E sem dado para ${faltantesIPCAE.join(", ")} — contado como 0 nesses meses.`);
    if (faltantesSELIC.length) memoria.push(`Atenção: SELIC sem dado para ${faltantesSELIC.join(", ")} — contado como 0 nesses meses.`);

    return { valorCorrigido: arredondar(valorFinal), memoria };
  }

  const mesFimIPCAE = chaveMes(dataLiquidacao);
  const { fator: fatorIPCAE, faltantes } = acumularFator(mapaIPCAE, mesInicioCorrecao, mesFimIPCAE);
  const diasPreJudicial = diffDias(dataVencimento, dataLiquidacao);
  const jurosPreJudicial = (diasPreJudicial / 30) * TAXA_JUROS_MENSAL_PRE_JUDICIAL;
  const valorFinal = valorNominal * fatorIPCAE * (1 + jurosPreJudicial);

  memoria.push(`Sem ajuizamento informado — tudo tratado como fase pré-judicial até a data de liquidação.`);
  memoria.push(`IPCA-E acumulado (${formatarDataBR(dataVencimento)} a ${formatarDataBR(dataLiquidacao)}): x${fatorIPCAE.toFixed(6)} + juros 1% a.m. pro-rata (${diasPreJudicial} dias) = x${(1 + jurosPreJudicial).toFixed(6)}`);
  memoria.push(`${formatarMoeda(valorNominal)} x ${fatorIPCAE.toFixed(6)} x ${(1 + jurosPreJudicial).toFixed(6)} = ${formatarMoeda(valorFinal)}`);
  if (faltantes.length) memoria.push(`Atenção: IPCA-E sem dado para ${faltantes.join(", ")} — contado como 0 nesses meses.`);

  return { valorCorrigido: arredondar(valorFinal), memoria };
}

/**
 * Busca os índices necessários uma única vez e aplica a correção/juros a todas as
 * verbas já calculadas (resultados da Fase 1), adicionando .valorCorrigido e
 * .memoriaCorrecao a cada uma. Não recalcula o valor nominal — só ajusta.
 */
async function aplicarCorrecaoATodasVerbas(resultados, dataVencimentoComum, dataAjuizamento, dataLiquidacao) {
  const inicioBusca = new Date(dataVencimentoComum.getFullYear(), dataVencimentoComum.getMonth(), 1);
  const fimBusca = new Date(dataLiquidacao.getFullYear(), dataLiquidacao.getMonth(), 1);

  const [ipcaE, selic] = await Promise.all([
    obterIndiceMensal("IPCA_E", inicioBusca, fimBusca),
    obterIndiceMensal("SELIC_MENSAL", inicioBusca, fimBusca),
  ]);

  resultados.forEach((r) => {
    const { valorCorrigido, memoria } = calcularCorrecaoJuros(r.devido, dataVencimentoComum, dataAjuizamento, dataLiquidacao, ipcaE.mapa, selic.mapa);
    r.valorCorrigido = valorCorrigido;
    r.memoriaCorrecao = memoria;
  });

  return {
    online: ipcaE.online && selic.online,
    avisoOffline: !ipcaE.online || !selic.online
      ? "Não foi possível consultar a API do Banco Central agora — os índices vieram da tabela de reserva local, que pode estar desatualizada. Confira antes de usar em processo."
      : null,
  };
}
