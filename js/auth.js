/*
 * Autenticação (Firebase Auth) — login por e-mail/senha para cada pessoa do escritório.
 * Multiusuário por grupos ("escritórios"): cada usuário pertence a um escritório
 * (coleção `usuarios/{uid}` no Firestore, campo escritorioId) e só enxerga os dados
 * daquele escritório. Um único e-mail (EMAIL_ADMIN) é o administrador geral do
 * sistema — cria escritórios, cria usuários, e é o único que pode apagar cálculos.
 * Não há tela pública de cadastro — só o admin cria contas (veja admin.html).
 */

const EMAIL_ADMIN = "darafs.adv@gmail.com";

function ehAdmin(usuario) {
  return !!usuario && usuario.email === EMAIL_ADMIN;
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
    if (elAdmin) elAdmin.style.display = ehAdmin(usuario) ? "inline" : "none";
    if (callback) callback(usuario);
  });
}

/**
 * Busca o perfil (usuarios/{uid}) do usuário logado — contém o escritorioId.
 * Devolve null se a conta ainda não foi associada a nenhum escritório
 * (acontece se o admin esqueceu de vincular, ou é o próprio admin sem escritório próprio).
 */
async function obterMeuPerfil(usuario) {
  const doc = await firebaseDb.collection("usuarios").doc(usuario.uid).get();
  return doc.exists ? doc.data() : null;
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
