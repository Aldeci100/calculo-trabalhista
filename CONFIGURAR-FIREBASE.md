# Como configurar o login (Firebase)

Este sistema usa o Firebase (Google) como backend gratuito para login e para salvar os cálculos na nuvem, visíveis para todo o escritório. Este projeto Firebase é **independente** do que o ERP-CREDITO usa — dados separados.

Se o menu do Firebase aparecer em inglês no seu navegador, os nomes equivalentes estão indicados entre parênteses.

## Fase 1 — Criar o projeto ✅ (você já fez essa parte)

1. [console.firebase.google.com](https://console.firebase.google.com) > **Adicionar projeto** (*Add project*).
2. Nome sugerido: `calculo-trabalhista-escritorio`.
3. Pode desativar o Google Analytics (não precisa dele).
4. Clique em **Criar projeto** e aguarde a barra de progresso terminar.

## Fase 2 — Ativar o login por e-mail/senha

1. Com o projeto aberto, olhe o **menu lateral esquerdo**. Vai ter um ícone de escudo ou a palavra **Compilação** (*Build*) — clique nele pra expandir.
2. Dentro de "Compilação", clique em **Authentication**.
3. Vai aparecer um botão azul grande no meio da tela: **Vamos começar** (*Get started*). Clique nele.
4. Isso abre uma lista de "provedores de login" (Google, Facebook, E-mail/senha, etc.). Procure a linha **E-mail/senha** (*Email/Password*) e clique nela.
5. Vai abrir um painel na lateral direita com dois interruptores (toggle). Ative o **primeiro** ("E-mail/senha" / "Email/Password"). O segundo ("link sem senha") pode deixar desativado.
6. Clique em **Salvar** (*Save*).

Pronto — o método de login já está ligado.

## Fase 3 — Criar as contas de cada pessoa do escritório

1. Ainda dentro de **Authentication**, olhe as abas no topo: "Users" (ou "Usuários"), "Sign-in method", etc. Clique na aba **Users**.
2. Clique no botão **Add user** (*Adicionar usuário*), geralmente no canto superior direito.
3. Preencha:
   - **Email**: o e-mail da pessoa (ex: `advogado1@seuescritorio.com` ou até um Gmail pessoal, não precisa ser corporativo).
   - **Password**: uma senha provisória (mínimo 6 caracteres). A pessoa pode trocar depois.
4. Clique em **Add user**.
5. Repita para cada pessoa do escritório que vai usar o sistema.

Não existe tela pública de cadastro nesse sistema — só quem você cadastrar aqui consegue entrar. Se alguém esquecer a senha, tem um link "Esqueci minha senha" na tela de login que manda um e-mail de redefinição sozinho (não precisa de você pra isso).

## Fase 4 — Ativar o Firestore (onde os cálculos salvos ficam guardados)

1. No menu lateral esquerdo, dentro de **Compilação**, clique em **Firestore Database**.
2. Clique no botão **Criar banco de dados** (*Create database*).
3. Vai perguntar o modo: escolha **Modo de produção** (*Production mode*) — **não** escolha "modo de teste", porque o modo de teste deixa qualquer pessoa da internet ler/gravar os dados por 30 dias.
4. Escolha a localização do servidor: procure algo como `southamerica-east1 (São Paulo)`. Depois de escolhida, **não dá pra mudar depois**, mas não tem problema escolher a mais próxima do Brasil.
5. Clique em **Ativar** (*Enable*) e aguarde.
6. Depois que o banco for criado, clique na aba **Regras** (*Rules*) no topo da tela do Firestore.
7. Vai aparecer uma caixa de texto com um código. **Apague tudo** e cole exatamente isto no lugar:

```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /{document=**} {
      allow read, write: if request.auth != null;
    }
  }
}
```

8. Clique em **Publicar** (*Publish*).

Isso garante que só quem está logado (com uma das contas que você criou na Fase 3) consegue ler ou gravar os cálculos — ninguém de fora do escritório acessa, mesmo sabendo o link.

## Fase 5 — Pegar as chaves de configuração

1. No canto superior esquerdo, ao lado do nome do projeto, clique no ícone de **engrenagem ⚙️**.
2. Clique em **Configurações do projeto** (*Project settings*).
3. Role a página até a seção **Seus apps** (*Your apps*), lá embaixo.
4. Se ainda não tiver nenhum app cadastrado, vai aparecer um grupinho de ícones (Android, Apple/iOS, Web `</>`, Unity). Clique no ícone **`</>`** (Web).
5. Dê um apelido pro app, ex: `calculo-trabalhista-web`. **Não** marque a caixinha de "Configurar também o Firebase Hosting" — não precisamos disso.
6. Clique em **Registrar app** (*Register app*).
7. A tela seguinte mostra um bloco de código JavaScript parecido com isto:

```js
const firebaseConfig = {
  apiKey: "AIzaSy...",
  authDomain: "calculo-trabalhista-escritorio.firebaseapp.com",
  projectId: "calculo-trabalhista-escritorio",
  storageBucket: "calculo-trabalhista-escritorio.appspot.com",
  messagingSenderId: "123456789012",
  appId: "1:123456789012:web:abcdef1234567890",
};
```

8. **Copie esse bloco inteiro** (ou cada valor individualmente) e me manda aqui no chat — eu colo certinho no arquivo `js/firebase-init.js` do sistema e confirmo que ficou tudo funcionando.
9. Depois pode clicar em **Continuar no console** (*Continue to console*) pra fechar essa tela.

## O que falta depois disso

Assim que você me passar as chaves da Fase 5, eu:
1. Coloco elas no `js/firebase-init.js`.
2. Testo o login com uma das contas que você criou na Fase 3.
3. Testo se o botão "Salvar cálculo" está gravando certinho no Firestore e aparecendo no histórico.

## Multiescritório (grupos) — dois níveis de permissão

O sistema suporta vários escritórios isolados entre si, cada um com seus próprios
usuários. Existem dois níveis especiais:

- **Super-admin** (`aldecigarcia100@gmail.com`, constante `EMAIL_SUPERADMIN` em
  `js/auth.js`): o único que cria escritórios, cria/vincula usuários (tela `admin.html`),
  promove alguém a admin de um escritório, e pode apagar qualquer cálculo em qualquer
  escritório.
- **Admin de escritório** (marcado pelo super-admin ao criar/vincular o usuário): só
  dentro do próprio escritório, pode apagar os cálculos daquele grupo. Não cria
  escritórios nem usuários — isso continua exclusivo do super-admin.
- **Usuário comum**: só usa a calculadora e vê/salva no histórico do próprio escritório,
  sem poder apagar nada.

Contas já existentes (criadas antes de existir o `admin.html`) precisam ser vinculadas a
um escritório manualmente: a pessoa loga normalmente, e se a conta ainda não estiver
vinculada, o sistema mostra um código (UID) na tela — ela repassa esse código pra você,
e você cola em "Vincular conta já existente" dentro do escritório certo, em `admin.html`.

Para isso tudo funcionar, cole estas regras no Firestore (console do Firebase > Firestore
Database > aba Regras > apagar tudo > colar isto > Publicar):

```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {

    function souSuperAdmin() {
      return request.auth != null && request.auth.token.email == 'aldecigarcia100@gmail.com';
    }
    function meuPerfil() {
      return get(/databases/$(database)/documents/usuarios/$(request.auth.uid)).data;
    }
    function souAdminDoEscritorio(escritorioId) {
      return request.auth != null && meuPerfil().escritorioId == escritorioId && meuPerfil().admin == true;
    }

    match /escritorios/{id} {
      allow read: if request.auth != null;
      allow write: if souSuperAdmin();
    }

    match /usuarios/{uid} {
      allow read: if request.auth != null && (request.auth.uid == uid || souSuperAdmin());
      allow write: if souSuperAdmin();
    }

    match /calculos/{id} {
      allow read: if souSuperAdmin() || (request.auth != null && resource.data.escritorioId == meuPerfil().escritorioId);
      allow create: if souSuperAdmin() || (request.auth != null && request.resource.data.escritorioId == meuPerfil().escritorioId);
      allow update, delete: if souSuperAdmin() || souAdminDoEscritorio(resource.data.escritorioId);
    }
  }
}
```

**Sobre um possível aviso de índice**: na primeira vez que um usuário (não super-admin)
abrir o histórico, o Firestore pode mostrar um erro no console do navegador pedindo pra
criar um "índice composto" (necessário porque a busca filtra por escritório e ordena por
data ao mesmo tempo). Se isso acontecer, o próprio erro traz um link — é só clicar nele,
abre o console do Firebase já com os campos preenchidos, e clicar em "Criar índice". Leva
1-2 minutos para ficar pronto, e só precisa fazer isso uma vez.

## Onde os dados ficam hospedados

Como é tudo HTML/JS estático, você pode hospedar do jeito que preferir (GitHub Pages, Netlify, ou simplesmente abrir os arquivos localmente em cada computador do escritório) — o login e os dados salvos continuam funcionando normalmente, porque dependem do Firebase, não de onde os arquivos HTML estão guardados.
