/*
 * Configuração do Firebase deste sistema (separado do ERP-CREDITO).
 * Preencha com os valores do SEU projeto Firebase (console.firebase.google.com):
 * Configurações do projeto > Geral > Seus apps > SDK setup and configuration.
 * Veja o passo a passo completo em CONFIGURAR-FIREBASE.md.
 */

const firebaseConfig = {
  apiKey: "AIzaSyDXuzlnHdNiLmt4Z2--rckSQLxMiy_wOgc",
  authDomain: "calc-trabalhista-51d78.firebaseapp.com",
  projectId: "calc-trabalhista-51d78",
  storageBucket: "calc-trabalhista-51d78.firebasestorage.app",
  messagingSenderId: "202774334453",
  appId: "1:202774334453:web:10b71183a5dd50d19faebc",
};

const firebaseConfigurado = firebaseConfig.apiKey !== "SUA_API_KEY_AQUI";

let firebaseAuth = null;
let firebaseDb = null;

if (firebaseConfigurado && window.firebase) {
  firebase.initializeApp(firebaseConfig);
  firebaseAuth = firebase.auth();
  firebaseDb = firebase.firestore();
} else if (!firebaseConfigurado) {
  console.warn("Firebase ainda não configurado — preencha js/firebase-init.js com as chaves do seu projeto (veja CONFIGURAR-FIREBASE.md).");
}
