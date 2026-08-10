# Manual do Administrador (super-admin)

Este manual é para quem faz login com **aldecigarcia100@gmail.com** — a única conta que
cria escritórios, cria/vincula usuários, e pode apagar cálculos de qualquer escritório.

Site: `https://aldeci100.github.io/calculo-trabalhista/`

## Para que serve

O sistema existe pra que **vários escritórios de advocacia** consigam calcular verbas
trabalhistas (rescisão, férias, 13º, horas extras, correção monetária, etc.) de um jeito
padronizado, sem misturar os dados de um escritório com os de outro — e sem cada
escritório precisar montar sua própria conta de calculadora do zero.

Exemplo: o escritório **DARAFS** usa o sistema pra calcular os casos trabalhistas dos
clientes dele. Se amanhã outro escritório (digamos, **Silva Advogados**) também quiser
usar, você cria um escritório novo pra eles em `admin.html`, cria/vincula os usuários
deles — e a partir daí, ninguém do DARAFS vê os cálculos do Silva Advogados, e
vice-versa. Cada escritório só administra a própria equipe (quem pode ver e apagar), mas
só você cria escritórios novos e o acesso inicial de cada um.

## Visão geral do sistema

O sistema tem três papéis:

| Papel | Quem | O que pode fazer |
|---|---|---|
| **Super-admin** | só `aldecigarcia100@gmail.com` | Criar escritórios, criar/vincular usuários, promover admin de escritório, apagar qualquer cálculo |
| **Admin de escritório** | quem o super-admin marcar como admin (ex: Dara Freitas) | Usar a calculadora, ver e **apagar** cálculos só do próprio escritório |
| **Usuário comum** | os demais usuários de um escritório | Usar a calculadora, ver o histórico do próprio escritório — **sem apagar** |

Cada escritório só vê os próprios dados — isso é garantido pelas regras do Firestore, não
só escondido na tela.

## Como entrar

1. Acesse `https://aldeci100.github.io/calculo-trabalhista/login.html`.
2. Entre com `aldecigarcia100@gmail.com` e sua senha.
3. Vá em **"Administração"** (link no topo) ou direto em `admin.html`.

## Criar um novo escritório

1. Em `admin.html`, seção **"Criar novo escritório"**.
2. Digite o nome (ex: `Silva Advogados`) e clique em **"Criar escritório"**.
3. Ele aparece na lista de "Escritórios cadastrados" logo abaixo.

## Adicionar uma pessoa nova (que nunca usou o sistema)

1. No card do escritório certo, preencha **"E-mail do novo usuário"** e uma **senha
   provisória** (mínimo 6 caracteres — combine com a pessoa que ela deve trocar depois).
2. Se essa pessoa for a admin daquele escritório (pode apagar cálculos do grupo), marque
   **"Admin deste escritório"**.
3. Clique em **"Adicionar usuário novo"**.
4. Avise a pessoa o e-mail e a senha provisória — ela pode trocar a senha a qualquer
   momento pelo "Esqueci minha senha" na tela de login.

## Vincular uma conta que já existia (criada direto no Firebase, antes do admin.html)

Usado quando alguém já tinha conta de login, mas ainda não está em nenhum escritório.

1. Peça pra pessoa logar normalmente em `login.html` e depois abrir **"Histórico"**.
2. Vai aparecer uma mensagem amarela com um código (UID) — ela te passa esse código.
3. Em `admin.html`, no card do escritório certo, preencha **"E-mail da pessoa"** e cole o
   código em **"Vincular conta já existente"**.
4. Marque **"Admin deste escritório"** se for o caso.
5. Clique em **"Vincular"**.

## Promover ou tirar alguém de admin do escritório

Na lista de usuários dentro de cada card de escritório, clique na estrela (⭐/☆) ao lado
do nome da pessoa — alterna entre admin e usuário comum daquele escritório.

## Remover o acesso de alguém

Clique na lixeira (🗑️) ao lado do nome da pessoa, na lista de usuários do escritório.
Isso tira o acesso aos dados — a conta de login em si continua existindo (não some do
Firebase Auth), só perde a vinculação ao escritório.

## Apagar um cálculo (de qualquer escritório)

Vá em **"Histórico"** — como super-admin, você vê os cálculos de todos os escritórios.
Clique na lixeira (🗑️) na linha do cálculo que quer apagar. Não tem como desfazer.

## Sua própria conta

Sua conta de super-admin **não precisa** estar vinculada a nenhum escritório pra você
administrar o sistema. Só vincule (seção "Minha conta de administrador" em `admin.html`)
se você também for usar a calculadora como parte de algum escritório específico.

## Se algo quebrar ou precisar mudar

Qualquer alteração no sistema (nova regra de cálculo, campo novo, ajuste de segurança)
é feita direto no código e publicada — é só pedir. As instruções de configuração inicial
do Firebase (chaves, regras de segurança) estão em `CONFIGURAR-FIREBASE.md`.
