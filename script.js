// script.js - Cérebro do Dashboard Pessoal
// Versão para GitHub Pages (usa v9 Compat e suas credenciais)

// =========================================================================
// PASSO 1: CONFIGURAÇÃO ORIGINAL DO FIREBASE
// (Use as credenciais do seu projeto)
// =========================================================================
const firebaseConfig = {
    apiKey: "AIzaSyCVbVp_yB2c2DoP96u7e_28stu6b0GkycI", 
    authDomain: "dashboard-pessoal-ed6d1.firebaseapp.com",
    projectId: "dashboard-pessoal-ed6d1", 
    storageBucket: "dashboard-pessoal-ed6d1.firebasestorage.app",
    messagingSenderId: "298094497295",
    appId: "1:298094497295:web:21c80fbd60ec19c8bf9d7a"
};

// 2. Inicializar o Firebase (sintaxe v9 Compat)
firebase.initializeApp(firebaseConfig);

// 3. Obter as referências para os serviços
const db = firebase.firestore();
const auth = firebase.auth();

let userId = null; 
let updateInterval = null; // Para o contador de fidelidade

// =========================================================================
// AUTENTICAÇÃO (Sua lógica original)
// =========================================================================

function loginAnonimo() {
    auth.signInAnonymously()
        .then(() => {
            console.log("Utilizador autenticado anonimamente (ID temporário).");
        })
        .catch((error) => {
            console.error("Erro na autenticação:", error);
            // alert("Erro ao conectar à base de dados. Verifique as regras do Firebase.");
        });
}

auth.onAuthStateChanged((user) => {
    if (user && userId !== user.uid) {
        userId = user.uid; 
        console.log("Utilizador ID:", userId);
        
        // ** INICIA A CARGA DOS DADOS APÓS O LOGIN **
        carregarTransacoesEmTempoReal(); 
        carregarLivrosEmTempoReal(); 
        carregarAbstinencia(); // Carrega o contador de fidelidade
        
    } else if (!user) {
        userId = null;
        loginAnonimo(); // Tenta logar anonimamente se não houver usuário
    }
});

// =========================================================================
// NAVEGAÇÃO ENTRE ABAS
// =========================================================================

document.querySelectorAll('.aba-botao').forEach(button => {
    button.addEventListener('click', () => {
        const abaId = button.dataset.aba;
        // Ocultar todas as seções
        document.querySelectorAll('.content-section').forEach(section => {
            section.classList.add('hidden');
        });
        // Mostrar a seção clicada
        const secaoAtiva = document.getElementById(abaId);
        if (secaoAtiva) secaoAtiva.classList.remove('hidden');
        // Remover 'active' de todos os botões e adicionar ao clicado
        document.querySelectorAll('.aba-botao').forEach(btn => {
            btn.classList.remove('active');
        });
        button.classList.add('active');
    });
});


// =========================================================================
// FUNCIONALIDADE FINANCEIRA (Sintaxe v9 Compat)
// =========================================================================

const formTransacao = document.getElementById('formTransacao');
const descricaoInput = document.getElementById('descricao');
const valorInput = document.getElementById('valor');
const tipoInput = document.getElementById('tipo');
const listaTransacoesUL = document.getElementById('listaTransacoes');
const totalReceitaP = document.getElementById('totalReceita');
const totalDespesaP = document.getElementById('totalDespesa');
const saldoAtualP = document.getElementById('saldoAtual');

function formatarMoeda(valor) {
    return valor.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

// Listener para submissão do formulário de transação
formTransacao.addEventListener('submit', async (e) => {
    e.preventDefault(); 
    if (!userId) return;

    const descricao = descricaoInput.value;
    const valor = parseFloat(valorInput.value); 
    const tipo = tipoInput.value; 
    
    if (!descricao || isNaN(valor) || valor <= 0) return;

    const novaTransacao = {
        descricao: descricao,
        valor: valor,
        tipo: tipo,
        data: firebase.firestore.FieldValue.serverTimestamp(), // v9 Compat
        userId: userId 
    };

    try {
        // Caminho original do seu DB
        await db.collection('users').doc(userId).collection('transacoes').add(novaTransacao);
        formTransacao.reset();
        tipoInput.value = 'receita';
    } catch (error) {
        console.error("Erro ao adicionar transação: ", error);
    }
});

// Carregamento de Transações em Tempo Real
function carregarTransacoesEmTempoReal() {
    if (!userId) return;

    // Caminho original do seu DB
    const transacoesRef = db.collection('users').doc(userId).collection('transacoes');
    
    transacoesRef.orderBy('data', 'desc').onSnapshot(snapshot => {
        listaTransacoesUL.innerHTML = ''; 
        let totalReceita = 0;
        let totalDespesa = 0;
        
        snapshot.forEach(doc => {
            const transacao = doc.data();
            const id = doc.id; 

            if (transacao.tipo === 'receita') {
                totalReceita += transacao.valor;
            } else {
                totalDespesa += transacao.valor;
            }

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
            listItem.querySelector('.botao-excluir').addEventListener('click', () => excluirTransacao(id));
        });
        atualizarResumo(totalReceita, totalDespesa);
    }, err => console.error("Erro ao carregar transações:", err));
}

function atualizarResumo(receita, despesa) {
    const saldo = receita - despesa;
    totalReceitaP.textContent = formatarMoeda(receita);
    totalDespesaP.textContent = formatarMoeda(despesa);
    saldoAtualP.textContent = formatarMoeda(saldo);
    saldoAtualP.style.color = saldo >= 0 ? 'var(--cor-sucesso)' : 'var(--cor-perigo)'; 
}

async function excluirTransacao(id) {
    if (!userId) return; 
    // Removido window.confirm
    try {
        // Caminho original do seu DB
        await db.collection('users').doc(userId).collection('transacoes').doc(id).delete();
    } catch (error) {
        console.error("Erro ao excluir transação:", error);
    }
}


// =========================================================================
// ACOMPANHAMENTO DE LEITURA (Sintaxe v9 Compat)
// =========================================================================

const formLivro = document.getElementById('formLivro');
const tituloLivroInput = document.getElementById('tituloLivro');
const autorLivroInput = document.getElementById('autorLivro');
const paginasIniciaisInput = document.getElementById('paginasIniciais');
const paginasTotaisInput = document.getElementById('paginasTotais');
const listaLivrosUL = document.getElementById('listaLivros');

formLivro.addEventListener('submit', async (e) => {
    e.preventDefault(); 
    if (!userId) return;

    const titulo = tituloLivroInput.value;
    const autor = autorLivroInput.value;
    const totalPaginas = parseInt(paginasTotaisInput.value, 10); 
    const paginasLidasIniciais = parseInt(paginasIniciaisInput.value, 10) || 0; 
    
    if (!titulo || !autor || isNaN(totalPaginas) || totalPaginas <= 0) return;

    const novoLivro = {
        titulo: titulo,
        autor: autor, 
        paginasTotais: totalPaginas,
        paginasLidas: Math.min(paginasLidasIniciais, totalPaginas), 
        dataAdicionado: firebase.firestore.FieldValue.serverTimestamp(), // v9 Compat
        userId: userId 
    };

    try {
        // Caminho original do seu DB
        await db.collection('users').doc(userId).collection('livros').add(novoLivro);
        formLivro.reset();
    } catch (error) {
        console.error("Erro ao adicionar livro: ", error);
    }
});


function carregarLivrosEmTempoReal() {
    if (!userId) return;

    // Caminho original do seu DB
    const livrosRef = db.collection('users').doc(userId).collection('livros');
    
    livrosRef.orderBy('dataAdicionado', 'asc').onSnapshot(snapshot => {
        listaLivrosUL.innerHTML = ''; 
        snapshot.forEach(doc => {
            const livro = doc.data();
            const id = doc.id; 
            const lidas = livro.paginasLidas || 0;
            const total = livro.paginasTotais || 1; 
            const progressoPercentual = Math.min(100, Math.round((lidas / total) * 100));
            
            const listItem = document.createElement('li');
            listItem.classList.add('livro-item');
            listItem.innerHTML = `
                <div class="livro-header">
                    <h4>${livro.titulo} <small>(${livro.autor})</small></h4>
                    <button class="botao-remover" data-id="${id}">Remover</button>
                </div>
                <p>Progresso: ${lidas} / ${total} páginas (${progressoPercentual}%)</p>
                <div class="progresso-bar">
                    <div class="progresso-fill" style="width: ${progressoPercentual}%"></div>
                </div>
                <div class="controles-livro">
                    <button class="botao-progresso" data-id="${id}" data-acao="1">Li +1 Pág.</button>
                    <button class="botao-progresso" data-id="${id}" data-acao="10">Li +10 Pág.</button>
                    <button class="botao-progresso" data-id="${id}" data-acao="50">Li +50 Pág.</button>
                    <button class="botao-progresso botao-remover-pagina" data-id="${id}" data-acao="-1">Erro -1 Pág.</button>
                </div>
            `;
            listaLivrosUL.appendChild(listItem);
            
            listItem.querySelectorAll('.botao-progresso').forEach(button => {
                button.addEventListener('click', () => {
                    const paginas = parseInt(button.dataset.acao, 10);
                    const novoProgresso = Math.max(0, lidas + paginas); 
                    atualizarProgressoLivro(id, Math.min(novoProgresso, total), total);
                });
            });
            listItem.querySelector('.botao-remover').addEventListener('click', () => removerLivro(id));
        });
    }, err => console.error("Erro ao carregar livros:", err));
}


async function atualizarProgressoLivro(id, novoTotalLido, totalPaginas) {
    if (!userId) return; 
    try {
        // Caminho original do seu DB
        const livroRef = db.collection('users').doc(userId).collection('livros').doc(id);
        const paginasLidas = Math.max(0, Math.min(novoTotalLido, totalPaginas));
        await livroRef.update({ 
            paginasLidas: paginasLidas 
        });
    } catch (error) {
        console.error("Erro ao atualizar progresso:", error);
    }
}


async function removerLivro(id) {
    if (!userId) return; 
    // Removido window.confirm
    try {
        // Caminho original do seu DB
        await db.collection('users').doc(userId).collection('livros').doc(id).delete();
    } catch (error) {
        console.error("Erro ao remover livro:", error);
    }
}


// =========================================================================
// FUNCIONALIDADE FIDELIDADE (LÓGICA ATUALIZADA - v9 Compat)
// =========================================================================

// DOM Elements
const formContainerFidelidade = document.getElementById('formContainerFidelidade');
const formAbstinencia = document.getElementById('formAbstinencia');
const dataInicioInput = document.getElementById('dataInicio');
const diasFidelidadeP = document.getElementById('diasFidelidade'); // ID Atualizado
const incentivoMensagemP = document.getElementById('incentivoMensagem');
// Novos elements
const fidelidadeBarra = document.getElementById('fidelidadeBarra');
const progressoLabel = document.getElementById('progressoLabel');
const botaoRecaida = document.getElementById('botaoRecaida');
const overlayRecaida = document.getElementById('overlayRecaida');
const fecharOverlay = document.getElementById('fecharOverlay');


const INCENTIVOS = [
    "Parabéns! Cada dia é uma grande vitória!",
    "Lembre-se do seu objetivo! Você está indo muito bem.",
    "Sua saúde agradece a cada minuto. Mantenha o foco!",
    "Mais um dia fiel. Você é mais forte do que pensa!",
    "Continue firme na sua jornada!",
    "Você está escrevendo sua própria história de sucesso. Não pare agora!"
];

const META_DIAS = 60; // Meta de 60 dias

// 1. Função para calcular e exibir os dias e a barra de progresso
function calcularDiasFidelidade(dataInicioTimestamp) {
    if (!dataInicioTimestamp) {
        diasFidelidadeP.textContent = "Data não definida.";
        return;
    }
    
    // dataInicioTimestamp é um objeto Timestamp do Firebase
    const inicioMs = dataInicioTimestamp.toDate().getTime();
    const agoraMs = new Date().getTime();
    const diferencaMs = agoraMs - inicioMs;
    const umDiaMs = 1000 * 60 * 60 * 24;
    const dias = Math.floor(diferencaMs / umDiaMs);
    
    if (dias < 0) {
         diasFidelidadeP.textContent = "Data futura?";
         incentivoMensagemP.textContent = "Por favor, escolha uma data no passado.";
         fidelidadeBarra.style.width = '0%';
         progressoLabel.textContent = "0 / 60 dias";
         return;
    }
    
    // Atualiza o contador
    diasFidelidadeP.textContent = `${dias} ${dias === 1 ? 'dia' : 'dias'}`;
    
    // Atualiza a barra de progresso
    const progressoPercentual = Math.min(100, (dias / META_DIAS) * 100);
    fidelidadeBarra.style.width = `${progressoPercentual}%`;
    progressoLabel.textContent = `${dias} / ${META_DIAS} dias`;
    
    // Mensagem de incentivo
    incentivoMensagemP.textContent = INCENTIVOS[dias % INCENTIVOS.length];
}

// 2. Listener para Salvar a Data de Início
formAbstinencia.addEventListener('submit', async (e) => {
    e.preventDefault();
    if (!userId) return;
    const dataString = dataInicioInput.value;
    if (!dataString) return;

    try {
        const [ano, mes, dia] = dataString.split('-').map(Number);
        const dataInicio = new Date(ano, mes - 1, dia); // Garante data local

        const abstinenciaData = {
            dataInicio: firebase.firestore.Timestamp.fromDate(dataInicio), // v9 Compat
            userId: userId
        };
        
        // Salva a data (v9 Compat)
        const docRef = db.collection('users').doc(userId).collection('abstinencia').doc('rastreador');
        await docRef.set(abstinenciaData); // .set() em vez de setDoc()
        console.log("Data de fidelidade definida!");

    } catch (error) {
        console.error("Erro ao definir data de fidelidade:", error);
    }
});

// 3. (NOVO) Listener do Botão de Recaída
botaoRecaida.addEventListener('click', async () => {
    if (!userId) return;
    
    // Mostra o overlay
    overlayRecaida.classList.remove('hidden');
    
    try {
        // Deleta o documento de rastreamento (v9 Compat)
        const docRef = db.collection('users').doc(userId).collection('abstinencia').doc('rastreador');
        await docRef.delete(); // .delete() em vez de deleteDoc()
        console.log("Contador zerado. Recaída registrada.");
    } catch (error) {
         console.error("Erro ao registrar recaída:", error);
    }
});

// 4. (NOVO) Listener para Fechar o Overlay
fecharOverlay.addEventListener('click', () => {
     overlayRecaida.classList.add('hidden');
});


// 5. Carregar e Monitorar a Contagem (Lógica de UI atualizada)
function carregarAbstinencia() {
    if (!userId) return;
    
    if (updateInterval) clearInterval(updateInterval);

    // Caminho original do seu DB
    const rastreadorRef = db.collection('users').doc(userId).collection('abstinencia').doc('rastreador');
    let dataInicioGlobal = null;

    rastreadorRef.onSnapshot(doc => { // 'doc' é o objeto do snapshot v9 Compat
        if (doc.exists && doc.data().dataInicio) {
            // **MODO CONTADOR ATIVO**
            const data = doc.data();
            dataInicioGlobal = data.dataInicio;
            
            formContainerFidelidade.classList.add('hidden');
            botaoRecaida.classList.remove('hidden');
            
            calcularDiasFidelidade(dataInicioGlobal);
            const dataJS = dataInicioGlobal.toDate();
            dataInicioInput.value = dataJS.toISOString().split('T')[0];
            
        } else {
            // **MODO FORMULÁRIO (SEM DATA)**
            dataInicioGlobal = null;
            
            formContainerFidelidade.classList.remove('hidden');
            botaoRecaida.classList.add('hidden');
            
            diasFidelidadeP.textContent = "0 dias";
            incentivoMensagemP.textContent = "Defina sua data de início para começar!";
            dataInicioInput.value = ''; 
            fidelidadeBarra.style.width = '0%';
            progressoLabel.textContent = `0 / ${META_DIAS} dias`;
        }
    }, err => {
        console.error("Erro ao carregar contador:", err);
    });

    // Atualiza o contador a cada minuto
    updateInterval = setInterval(() => {
        if (dataInicioGlobal) {
            calcularDiasFidelidade(dataInicioGlobal);
        }
    }, 60000); // 1 minuto
}
