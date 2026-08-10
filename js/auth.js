/*
 * Autenticação (Firebase Auth) — login por e-mail/senha para cada pessoa do escritório.
 * Multiusuário por grupos ("escritórios"): cada usuário pertence a um escritório
 * (coleção `usuarios/{uid}` no Firestore, campo escritorioId) e só enxerga os dados
 * daquele escritório.
 *
 * Dois níveis de permissão especial:
 *  - Super-admin (EMAIL_SUPERADMIN, fixo no código): cria escritórios, cria/vincula
 *    usuários em qualquer escritório, e pode apagar qualquer cálculo em qualquer lugar.
 *  - Admin de escritório (campo `admin: true` no doc usuarios/{uid}): só dentro do
 *    próprio escritório, pode apagar cálculos daquele grupo. Não cria escritórios
 *    nem usuários — isso continua exclusivo do super-admin.
 * Não há tela pública de cadastro — só o super-admin cria contas (veja admin.html).
 */

const EMAIL_SUPERADMIN = "aldecigarcia100@gmail.com";

function ehSuperAdmin(usuario) {
  return !!usuario && usuario.email === EMAIL_SUPERADMIN;
}

async function fazerLogin(email, senha) {
  if (!firebaseConfigurado) throw new Error("Firebase ainda não configurado. Veja CONFIGURAR-FIREBASE.md.");
  return firebaseAuth.signInWithEmailAndPassword(email, senha);
}

async function recuperarSenha(email) {
  if (!firebaseConfigurado) throw new Error("Firebase ainda não configurado. Veja CONFIGURAR-FIREBASE.md.");
  return firebaseAuth.sendPasswordResetEmail(email);
}

function sair() {
  firebaseAuth.signOut().then(() => {
    window.location.href = "login.html";
  });
}

/**
 * Chame no topo de qualquer página que exija login. Redireciona para login.html se
 * não autenticado; se autenticado, preenche o e-mail em qualquer elemento com
 * id="usuarioLogado" e chama o callback com o usuário.
 */
function exigirLogin(callback) {
  if (!firebaseConfigurado) {
    console.warn("Firebase não configurado — pulando checagem de login (modo de desenvolvimento).");
    if (callback) callback(null);
    return;
  }
  firebaseAuth.onAuthStateChanged((usuario) => {
    if (!usuario) {
      window.location.href = "login.html";
      return;
    }
    const elUsuario = document.getElementById("usuarioLogado");
    if (elUsuario) elUsuario.textContent = usuario.email;
    const elAdmin = document.getElementById("linkAdmin");
    if (elAdmin) elAdmin.style.display = ehSuperAdmin(usuario) ? "inline" : "none";
    if (callback) callback(usuario);
  });
}

/**
 * Busca o perfil (usuarios/{uid}) do usuário logado — contém o escritorioId e se é
 * admin daquele escritório. Devolve null se a conta ainda não foi vinculada a nenhum
 * escritório (mostre usuario.uid pra pessoa passar pro super-admin vincular).
 */
async function obterMeuPerfil(usuario) {
  const doc = await firebaseDb.collection("usuarios").doc(usuario.uid).get();
  return doc.exists ? doc.data() : null;
}

/** Pode apagar cálculos: super-admin (em qualquer escritório) ou admin do próprio escritório. */
function podeExcluir(usuario, perfil) {
  return ehSuperAdmin(usuario) || !!(perfil && perfil.admin === true);
}

/**
 * Cria um novo usuário (e-mail/senha) SEM deslogar o admin atual — usa uma instância
 * secundária e isolada do Firebase App só para essa criação, depois descarta.
 * É o jeito padrão de fazer isso só no cliente, sem precisar de servidor/Cloud Functions.
 */
async function criarUsuarioSemDeslogar(email, senha) {
  const nomeApp = "secundario-" + Date.now();
  const appSecundario = firebase.initializeApp(firebaseConfig, nomeApp);
  try {
    const credencial = await appSecundario.auth().createUserWithEmailAndPassword(email, senha);
    const uid = credencial.user.uid;
    await appSecundario.auth().signOut();
    return uid;
  } finally {
    await appSecundario.delete();
  }
}
