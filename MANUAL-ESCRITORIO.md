# Manual do Escritório

Este manual é para quem usa o sistema no dia a dia (advogados, estagiários, equipe do
escritório) — calcular, salvar e consultar cálculos trabalhistas.

Site: `https://aldeci100.github.io/calculo-trabalhista/`

## Para que serve — um exemplo do dia a dia

Imagine que chega um caso novo no escritório: um cliente (vamos chamar de Carlos) foi
demitido sem justa causa depois de 2 anos e 3 meses de empresa, ganhando R$ 2.200,00 por
mês. Ele conta que fazia horas extras quase toda semana sem receber, e que a empresa não
pagou o aviso prévio nem depositou o FGTS certinho nos últimos meses.

É aí que o sistema entra:

1. **A pessoa responsável loga** no sistema com o e-mail e senha do escritório.
2. **Preenche os dados do processo**: nome do cliente, nome da empresa, salário, data de
   admissão e de demissão.
3. **Marca as verbas que se aplicam** ao caso do Carlos: saldo de salário, aviso prévio
   indenizado, 13º proporcional, férias, horas extras (com a média que ele relatou),
   FGTS 8% e a multa de 40%.
4. **Clica em "Calcular"** — o sistema mostra, verba por verba, o valor e o caminho até
   aquele número: a base legal, a fórmula, o passo a passo. É esse material que embasa a
   petição inicial, sem precisar montar conta na mão ou em planilha separada.
5. Se o processo **já foi ajuizado**, marca a correção monetária e informa a data do
   ajuizamento — o sistema busca os índices oficiais (IPCA-E e SELIC) sozinho, sem
   precisar procurar tabela nenhuma.
6. **Salva o cálculo**. A partir daí, qualquer outra pessoa autorizada do escritório
   consegue abrir esse mesmo cálculo depois — seja pra revisar, seja pra levar numa
   audiência.
7. Na hora de montar a petição ou negociar um acordo, **abre o cálculo salvo e clica em
   "Imprimir / Salvar em PDF"** — gera um documento organizado, no estilo da planilha de
   cálculo usada pela Justiça do Trabalho (PJe-Calc), pronto pra juntar aos autos.

Multiplique isso por dezenas de casos: em vez de cada pessoa calcular do seu jeito, sem
padrão e sem mostrar como chegou no número, todo mundo do escritório usa o mesmo motor de
cálculo, com a legislação certa — e qualquer cálculo salvo fica disponível pra quem
precisar consultar depois, sem se misturar com dados de outro escritório que também use
o sistema.

## Como entrar

1. Acesse `https://aldeci100.github.io/calculo-trabalhista/login.html`.
2. Digite o e-mail e a senha que o administrador te passou.
3. Clique em **"Entrar"**.

**Esqueci minha senha**: na própria tela de login, clique em **"Esqueci minha senha"**,
digite seu e-mail e clique de novo no link — chega um e-mail com um link pra você
escolher uma senha nova. Não precisa pedir pro administrador.

**"Sua conta ainda não foi associada a um escritório"**: se aparecer essa mensagem com um
código, copie o código e envie pro administrador do sistema — ele precisa vincular sua
conta a um escritório antes de você conseguir usar.

## Fazendo um cálculo

Na tela principal (calculadora), preencha:

1. **Dados do processo**: reclamante, reclamado, nº do processo (opcionais, mas ajudam a
   identificar depois), salário base, data de admissão, data de demissão, tipo de aviso
   prévio.
2. **Verbas**: marque só o que se aplica a esse caso (saldo de salário, aviso prévio,
   13º, férias, horas extras, insalubridade, etc.) — cada uma tem seus próprios campos
   quando marcada.
3. **FGTS** (opcional): marque se quiser calcular o FGTS 8% e a multa de 40%.
4. **Contribuição social e IRPF** (opcional): descontos sobre as verbas de natureza
   salarial.
5. **Correção monetária e juros** (opcional): atualiza os valores pela tabela do Banco
   Central (IPCA-E até o ajuizamento, SELIC depois).
6. **Honorários e custas** (opcional): calcula separado, não entra no valor do
   trabalhador.

Clique em **"Calcular"**. O resultado mostra o resumo e, embaixo, o **"Histórico de
Cálculo"** — o passo a passo detalhado de cada verba, com a base legal.

## Salvando um cálculo

Depois de calcular, clique em **"Salvar cálculo (visível para todo o escritório)"**. A
partir daí, qualquer pessoa do seu escritório consegue ver esse cálculo no histórico.

## Vendo o histórico

Clique em **"Histórico"** no topo. Aparece a lista de todos os cálculos salvos pelo seu
escritório (não de outros escritórios — cada um só vê o próprio). Clique em qualquer
linha pra abrir os detalhes completos.

## Imprimir / gerar PDF de um cálculo salvo

1. Abra o cálculo pelo histórico.
2. Clique em **"Imprimir / Salvar em PDF"**.
3. Na janela de impressão do navegador, escolha **"Salvar como PDF"** como destino (em
   vez de uma impressora física) se quiser o arquivo, ou imprima direto se tiver
   impressora.

## Apagando um cálculo

Só quem é **admin do seu escritório** consegue apagar (o botão de lixeira 🗑️ só aparece
pra essa pessoa). Se você precisar apagar algo e não tiver esse botão, peça pro admin do
seu escritório ou pro administrador geral do sistema.

## Dúvidas comuns

- **Não vejo o botão de apagar**: normal, só o admin do escritório e o administrador
  geral têm essa opção.
- **Salvei um cálculo errado**: se você não for admin, não dá pra apagar sozinho — peça
  pro admin do escritório remover.
- **Esqueci a senha**: use o "Esqueci minha senha" na tela de login, é automático.
- **Preciso de acesso pra outra pessoa do escritório**: peça pro administrador geral do
  sistema criar o acesso dela.
