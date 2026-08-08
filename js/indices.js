/*
 * Índices de correção monetária e juros (ADC 58/59 STF): IPCA-E na fase pré-judicial,
 * SELIC (índice único, já com juros embutidos) a partir do ajuizamento.
 * Busca ao vivo na API pública do Banco Central (SGS) e cai para uma tabela local
 * de reserva se a rede falhar — nunca trava o cálculo, mas sempre avisa qual dos dois usou.
 */

const BACEN_SERIES = {
  IPCA_E: 10764, // IPCA-E, variação % mensal
  SELIC_MENSAL: 4390, // Selic acumulada no mês, % mensal
};

// Tabela de reserva — usada só se a API do Bacen estiver inacessível no momento do cálculo.
// Atualizar periodicamente (ou deixar por conta da busca ao vivo, que é a fonte preferida).
const INDICES_RESERVA = {
  IPCA_E: {},
  SELIC_MENSAL: {},
};

function chaveMes(data) {
  return `${data.getFullYear()}-${String(data.getMonth() + 1).padStart(2, "0")}`;
}

function proximoMes(chave) {
  const [ano, mes] = chave.split("-").map(Number);
  const d = new Date(ano, mes, 1); // mes já é 1-based aqui vira o mês seguinte
  return chaveMes(d);
}

function mesAnterior(chave) {
  const [ano, mes] = chave.split("-").map(Number);
  const d = new Date(ano, mes - 2, 1);
  return chaveMes(d);
}

function formatarDataBacen(data) {
  return `${String(data.getDate()).padStart(2, "0")}/${String(data.getMonth() + 1).padStart(2, "0")}/${data.getFullYear()}`;
}

async function buscarSerieBacen(codigoSerie, dataInicial, dataFinal) {
  const url = `https://api.bcb.gov.br/dados/serie/bcdata.sgs.${codigoSerie}/dados?formato=json&dataInicial=${formatarDataBacen(dataInicial)}&dataFinal=${formatarDataBacen(dataFinal)}`;
  const resposta = await fetch(url);
  if (!resposta.ok) throw new Error(`Bacen respondeu ${resposta.status}`);
  const dados = await resposta.json();
  const mapa = {};
  dados.forEach((item) => {
    const [dia, mes, ano] = item.data.split("/");
    mapa[`${ano}-${mes}`] = parseFloat(String(item.valor).replace(",", "."));
  });
  return mapa;
}

/**
 * Devolve { mapa, online } com o índice mensal (%) de dataInicial a dataFinal.
 * online=false quando caiu para a tabela de reserva por falha de rede/API.
 */
async function obterIndiceMensal(tipo, dataInicial, dataFinal) {
  const codigo = BACEN_SERIES[tipo];
  try {
    const mapa = await buscarSerieBacen(codigo, dataInicial, dataFinal);
    return { mapa, online: true };
  } catch (erro) {
    return { mapa: INDICES_RESERVA[tipo], online: false, erro: erro.message };
  }
}

/**
 * Acumula o índice mês a mês (juros compostos mensais) de mesInicialChave (inclusive)
 * até mesFinalChave (inclusive). Meses sem dado no mapa contam como 0 e são reportados
 * em `faltantes` para o usuário conferir manualmente.
 */
function acumularFator(mapa, mesInicialChave, mesFinalChave) {
  let fator = 1;
  const faltantes = [];
  let cursor = mesInicialChave;
  let protecaoLoop = 0;
  while (cursor <= mesFinalChave && protecaoLoop < 1200) {
    const valor = mapa[cursor];
    if (valor === undefined) {
      faltantes.push(cursor);
    } else {
      fator *= 1 + valor / 100;
    }
    cursor = proximoMes(cursor);
    protecaoLoop += 1;
  }
  return { fator, faltantes };
}
