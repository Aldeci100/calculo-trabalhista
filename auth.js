/*
 * Autenticação (Firebase Auth) — login por e-mail/senha para cada pessoa do escritório.
 * Contas são criadas manualmente no Console do Firebase (Authentication > Users > Add user).
 * Não há tela pública de cadastro — evita que qualquer um crie conta sozinho.
 */

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
    if (callback) callback(usuario);
  });
}
