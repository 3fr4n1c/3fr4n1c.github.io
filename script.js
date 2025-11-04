const firebaseConfig = {
  apiKey: "AIzaSyCVbVp_yB2c2DoP96u7e_28stu6b0GkycI",
  authDomain: "dashboard-pessoal-ed6d1.firebaseapp.com",
  projectId: "dashboard-pessoal-ed6d1",
  storageBucket: "dashboard-pessoal-ed6d1.firebasestorage.app",
  messagingSenderId: "298094497295",
  appId: "1:298094497295:web:21c80fbd60ec19c8bf9d7a"
};

// 2. Inicializar o Firebase
firebase.initializeApp(firebaseConfig);

// 3. Obter as referências para os serviços
const db = firebase.firestore();
const auth = firebase.auth();

// 4. Variável para guardar o ID do utilizador autenticado
let userId = null;

// =========================================================================
// 5. AUTENTICAÇÃO SIMPLES (Login Anónimo/Temporário)
//    IMPORTANTE: Para um projeto realmente privado, idealmente usaria Login com Email/Password.
//    Para começar e testar a funcionalidade, vamos usar um login simples.
// =========================================================================

// Função para fazer o login anónimo
function loginAnonimo() {
    // Tenta iniciar sessão anonimamente (sem pedir email/password)
    auth.signInAnonymously()
        .then(() => {
            console.log("Utilizador autenticado anonimamente.");
        })
        .catch((error) => {
            console.error("Erro na autenticação:", error);
            alert("Erro ao conectar à base de dados. Verifique as regras do Firebase.");
        });
}

// Ouvinte para saber se o utilizador está autenticado ou não
auth.onAuthStateChanged((user) => {
    if (user) {
        // Utilizador está logado
        userId = user.uid;
        console.log("Utilizador ID:", userId);
        // A partir daqui, podemos começar a carregar os dados
        // Vamos chamar a função de carregamento na próxima etapa
    } else {
        // Utilizador não está logado, tenta fazer login
        loginAnonimo();
    }
});
