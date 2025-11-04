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

let userId = null; // ID único do utilizador, usado para garantir a privacidade dos dados

// =========================================================================
// AUTENTICAÇÃO ANÓNIMA (Para cumprir a regra de segurança)
// =========================================================================

function loginAnonimo() {
    // Tenta iniciar sessão anonimamente para obter um ID único (userId)
    auth.signInAnonymously()
        .then(() => {
            console.log("Utilizador autenticado anonimamente (ID temporário).");
        })
        .catch((error) => {
            console.error("Erro na autenticação:", error);
            alert("Erro ao conectar à base de dados. Verifique as regras do Firebase.");
        });
}

// Ouvinte do estado de autenticação
auth.onAuthStateChanged((user) => {
    if (user) {
        // Se o login for bem-sucedido, guarda o ID e inicia o carregamento dos dados
        userId = user.uid; 
        console.log("Utilizador ID:", userId);
        
        // ** INICIA A CARGA DOS DADOS EM TEMPO REAL APÓS O LOGIN **
        carregarTransacoesEmTempoReal(); 
        
        // (Será adicionado carregarLivrosEmTempoReal() na próxima fase)
        
    } else {
        // Se ainda não está logado, inicia o processo de login anónimo
        loginAnonimo();
    }
});

// =========================================================================
// FUNCIONALIDADE FINANCEIRA: ADICIONAR E GERENCIAR TRANSAÇÕES
// =========================================================================

const formTransacao = document.getElementById('formTransacao');
const descricaoInput = document.getElementById('descricao');
const valorInput = document.getElementById('valor');
const tipoInput = document.getElementById('tipo');

// Listener para submissão do formulário de transação (Passo 3)
formTransacao.addEventListener('submit', async (e) => {
    e.preventDefault(); 

    if (!userId) { 
        alert("Ainda não está autenticado. Aguarde ou tente recarregar.");
        return;
    }

    const descricao = descricaoInput.value;
    const valor = parseFloat(valorInput.value); 
    const tipo = tipoInput.value; 
    
    const novaTransacao = {
        descricao: descricao,
        valor: valor,
        tipo: tipo,
        data: firebase.firestore.FieldValue.serverTimestamp(),
        userId: userId // Chave de segurança para guardar na sua coleção privada
    };

    try {
        // Guarda na coleção privada: users/{userId}/transacoes
        await db.collection('users').doc(userId).collection('transacoes').add(novaTransacao);
        
        // Limpeza do formulário
        descricaoInput.value = '';
        valorInput.value = '';
        tipoInput.value.value = 'receita'; 
        
        console.log("Transação adicionada com sucesso!");

    } catch (error) {
        console.error("Erro ao adicionar transação: ", error);
        alert("Erro ao adicionar transação. Verifique a consola para detalhes.");
    }
});

// =========================================================================
// FUNCIONALIDADE FINANCEIRA: CARREGAR E EXIBIR EM TEMPO REAL (Passo 4)
// =========================================================================

const listaTransacoesUL = document.getElementById('listaTransacoes');
const totalReceitaP = document.getElementById('totalReceita');
const totalDespesaP = document.getElementById('totalDespesa');
const saldoAtualP = document.getElementById('saldoAtual');

function formatarMoeda(valor) {
    return valor.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

// Função principal de Carregamento em Tempo Real
function carregarTransacoesEmTempoReal() {
    if (!userId) {
        return;
    }

    const transacoesRef = db.collection('users').doc(userId).collection('transacoes');
    
    // onSnapshot: Ouve a base de dados. Qualquer alteração dispara esta função.
    transacoesRef.orderBy('data', 'desc').onSnapshot(snapshot => {
        
        listaTransacoesUL.innerHTML = ''; // Limpa a lista antes de reconstruir

        let totalReceita = 0;
        let totalDespesa = 0;
        
        snapshot.forEach(doc => {
            const transacao = doc.data();
            const id = doc.id; 

            // Cálculo dos totais
            if (transacao.tipo === 'receita') {
                totalReceita += transacao.valor;
            } else {
                totalDespesa += transacao.valor;
            }

            // Geração do item na lista HTML
            const listItem = document.createElement('li');
            listItem.classList.add(transacao.tipo === 'receita' ? 'receita-item' : 'despesa-item');
            
            const valorFormatado = formatarMoeda(transacao.valor);
            const tipoSinal = transacao.tipo === 'receita' ? '+' : '-';
            
            listItem.innerHTML = `
                <div>${transacao.descricao}</div>
                <div class="valor-container">
                    <span class="valor-display">${tipoSinal} ${valorFormatado}</span>
                    <button class="botao-excluir" data-id="${id}">🗑️</button>
                </div>
            `;
            
            listaTransacoesUL.appendChild(listItem);

            // Adiciona o ouvinte para o botão de exclusão
            listItem.querySelector('.botao-excluir').addEventListener('click', () => {
                excluirTransacao(id);
            });
        });

        // Atualiza os cards de resumo
        atualizarResumo(totalReceita, totalDespesa);

    }, err => {
        console.error("Erro ao carregar transações:", err);
    });
}

function atualizarResumo(receita, despesa) {
    const saldo = receita - despesa;

    totalReceitaP.textContent = formatarMoeda(receita);
    totalDespesaP.textContent = formatarMoeda(despesa);
    saldoAtualP.textContent = formatarMoeda(saldo);

    // Mudar a cor do saldo com base no valor
    saldoAtualP.style.color = saldo >= 0 ? '#28a745' : '#dc3545'; 
}

async function excluirTransacao(id) {
    if (!userId) return; 

    if (window.confirm("Tem certeza que deseja excluir esta transação?")) {
        try {
            // Remove o documento do Firestore
            await db.collection('users').doc(userId).collection('transacoes').doc(id).delete();
            console.log("Transação excluída com sucesso.");
            // O onSnapshot acima garantirá que a lista se atualize sozinha.
        } catch (error) {
            console.error("Erro ao excluir transação:", error);
        }
    }
}
