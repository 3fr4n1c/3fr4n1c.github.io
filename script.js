// script.js - Cérebro do Dashboard Pessoal

// =========================================================================
// PASSO 2: CONFIGURAÇÃO DO FIREBASE (COM SUAS CREDENCIAIS INSERIDAS)
// ATENÇÃO: Se as suas credenciais no Firebase mudaram, atualize-as aqui!
// =========================================================================
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

let userId = null; 

// =========================================================================
// AUTENTICAÇÃO
// =========================================================================

function loginAnonimo() {
    auth.signInAnonymously()
        .then(() => {
            console.log("Utilizador autenticado anonimamente (ID temporário).");
        })
        .catch((error) => {
            console.error("Erro na autenticação:", error);
            alert("Erro ao conectar à base de dados. Verifique as regras do Firebase.");
        });
}

auth.onAuthStateChanged((user) => {
    if (user) {
        userId = user.uid; 
        console.log("Utilizador ID:", userId);
        
        // ** INICIA A CARGA DOS DADOS APÓS O LOGIN **
        carregarTransacoesEmTempoReal(); 
        carregarLivrosEmTempoReal(); 
        carregarAbstinencia(); // Carrega a contagem de abstinência
        
    } else {
        loginAnonimo();
    }
});

// =========================================================================
// NAVEGAÇÃO ENTRE ABAS (Funcionalidade Anos 2000)
// =========================================================================

document.querySelectorAll('.aba-botao').forEach(button => {
    button.addEventListener('click', () => {
        const abaId = button.dataset.aba;

        // Ocultar todas as seções
        document.querySelectorAll('.content-section').forEach(section => {
            section.classList.add('hidden');
        });

        // Mostrar a seção clicada
        document.getElementById(abaId).classList.remove('hidden');

        // Remover 'active' de todos os botões e adicionar ao clicado
        document.querySelectorAll('.aba-botao').forEach(btn => {
            btn.classList.remove('active');
        });
        button.classList.add('active');
    });
});


// =========================================================================
// FUNCIONALIDADE FINANCEIRA
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
        userId: userId 
    };

    try {
        await db.collection('users').doc(userId).collection('transacoes').add(novaTransacao);
        
        descricaoInput.value = '';
        valorInput.value = '';
        tipoInput.value.value = 'receita'; 
        
        console.log("Transação adicionada com sucesso!");

    } catch (error) {
        console.error("Erro ao adicionar transação: ", error);
        alert("Erro ao adicionar transação. Verifique a consola para detalhes.");
    }
});

// Carregamento de Transações em Tempo Real
function carregarTransacoesEmTempoReal() {
    if (!userId) {
        return;
    }

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

            listItem.querySelector('.botao-excluir').addEventListener('click', () => {
                excluirTransacao(id);
            });
        });

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

    // Usa as cores do tema Anos 2000: Lime para positivo, Vermelho Principal para negativo
    saldoAtualP.style.color = saldo >= 0 ? 'lime' : 'var(--cor-principal)'; 
}

async function excluirTransacao(id) {
    if (!userId) return; 

    if (window.confirm("Tem certeza que deseja excluir esta transação?")) {
        try {
            await db.collection('users').doc(userId).collection('transacoes').doc(id).delete();
            console.log("Transação excluída com sucesso.");
        } catch (error) {
            console.error("Erro ao excluir transação:", error);
        }
    }
}


// =========================================================================
// ACOMPANHAMENTO DE LEITURA
// =========================================================================

const formLivro = document.getElementById('formLivro');
const tituloLivroInput = document.getElementById('tituloLivro');
const autorLivroInput = document.getElementById('autorLivro');
const paginasIniciaisInput = document.getElementById('paginasIniciais');

const paginasTotaisInput = document.getElementById('paginasTotais');
const listaLivrosUL = document.getElementById('listaLivros');

// 1. Lógica para ADICIONAR um Novo Livro (com Autor e Páginas Iniciais)
formLivro.addEventListener('submit', async (e) => {
    e.preventDefault(); 

    if (!userId) { 
        alert("Ainda não está autenticado. Aguarde ou tente recarregar.");
        return;
    }

    const titulo = tituloLivroInput.value;
    const autor = autorLivroInput.value;
    const totalPaginas = parseInt(paginasTotaisInput.value, 10); 
    const paginasLidasIniciais = parseInt(paginasIniciaisInput.value, 10) || 0; 
    
    const novoLivro = {
        titulo: titulo,
        autor: autor, 
        paginasTotais: totalPaginas,
        paginasLidas: paginasLidasIniciais, 
        dataAdicionado: firebase.firestore.FieldValue.serverTimestamp(),
        userId: userId 
    };

    try {
        await db.collection('users').doc(userId).collection('livros').add(novoLivro);
        
        // Limpar todos os campos
        tituloLivroInput.value = '';
        autorLivroInput.value = '';
        paginasTotaisInput.value = '';
        paginasIniciaisInput.value = '0';
        
        console.log("Livro adicionado com sucesso!");

    } catch (error) {
        console.error("Erro ao adicionar livro: ", error);
    }
});


// 2. Lógica para CARREGAR os Livros em Tempo Real (Controles +1/-1)
function carregarLivrosEmTempoReal() {
    if (!userId) return;

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
            
            // Adicionar ouvintes aos botões de progresso
            listItem.querySelectorAll('.botao-progresso').forEach(button => {
                button.addEventListener('click', () => {
                    const paginas = parseInt(button.dataset.acao, 10);
                    const novoProgresso = Math.max(0, lidas + paginas); 
                    atualizarProgressoLivro(id, novoProgresso);
                });
            });

            // Ouvinte para o botão de remover
            listItem.querySelector('.botao-remover').addEventListener('click', () => {
                removerLivro(id);
            });
        });

    }, err => {
        console.error("Erro ao carregar livros:", err);
    });
}


// 3. Lógica para ATUALIZAR o Progresso
async function atualizarProgressoLivro(id, novoTotalLido) {
    if (!userId) return; 

    try {
        const livroRef = db.collection('users').doc(userId).collection('livros').doc(id);
        
        const paginasLidas = Math.max(0, novoTotalLido);

        await livroRef.update({ 
            paginasLidas: paginasLidas 
        });

        console.log(`Progresso do livro ${id} atualizado para ${paginasLidas} páginas.`);

    } catch (error) {
        console.error("Erro ao atualizar progresso:", error);
    }
}


// 4. Lógica para REMOVER um Livro
async function removerLivro(id) {
    if (!userId) return; 

    if (window.confirm("Tem certeza que deseja remover este livro? Todo o progresso será perdido.")) {
        try {
            await db.collection('users').doc(userId).collection('livros').doc(id).delete();
            console.log("Livro removido com sucesso.");
        } catch (error) {
            console.error("Erro ao remover livro:", error);
        }
    }
}


// =========================================================================
// FUNCIONALIDADE ABSTINÊNCIA (NOVO)
// =========================================================================

const formAbstinencia = document.getElementById('formAbstinencia');
const dataInicioInput = document.getElementById('dataInicio');
const diasSemFumarP = document.getElementById('diasSemFumar');
const incentivoMensagemP = document.getElementById('incentivoMensagem');

const INCENTIVOS = [
    "Parabéns! Cada dia é uma grande vitória!",
    "Lembre-se do seu objetivo! Você está a ir muito bem.",
    "A saúde agradece a cada minuto. Mantenha o foco!",
    "Mais um dia limpo. Você é mais forte do que pensa!",
    "O cheiro e o sabor da liberdade valem a pena. Continue!",
    "Você está a escrever a sua própria história de sucesso. Não pare agora!"
];

// 1. Função para calcular e exibir os dias
function calcularDiasAbstinencia(dataInicio) {
    if (!dataInicio) {
        diasSemFumarP.textContent = "Data não definida.";
        return;
    }
    
    // Calcula a diferença em milissegundos
    const inicioMs = dataInicio.toDate().getTime();
    const agoraMs = new Date().getTime();
    const diferencaMs = agoraMs - inicioMs;
    
    // Converte milissegundos para dias
    const umDiaMs = 1000 * 60 * 60 * 24;
    const dias = Math.floor(diferencaMs / umDiaMs);
    
    if (dias < 0) {
         diasSemFumarP.textContent = "Data futura? Revise o valor.";
         return;
    }
    
    diasSemFumarP.textContent = `${dias} ${dias === 1 ? 'dia' : 'dias'}`;
    
    // Mensagem de incentivo (seleciona uma mensagem baseada no número de dias)
    incentivoMensagemP.textContent = INCENTIVOS[dias % INCENTIVOS.length];
}

// 2. Listener para Salvar a Data de Início
formAbstinencia.addEventListener('submit', async (e) => {
    e.preventDefault();

    if (!userId) {
        alert("Ainda não está autenticado. Aguarde ou tente recarregar.");
        return;
    }

    const dataString = dataInicioInput.value;
    if (!dataString) return;

    try {
        // Formato: YYYY-MM-DD.
        const dataInicio = new Date(dataString);

        const abstinenciaData = {
            dataInicio: firebase.firestore.Timestamp.fromDate(dataInicio),
            userId: userId
        };
        
        // setDoc para garantir que haja apenas UM documento de rastreamento por usuário
        await db.collection('users').doc(userId).collection('abstinencia').doc('rastreador').set(abstinenciaData);

        console.log("Data de abstinência definida com sucesso!");

    } catch (error) {
        console.error("Erro ao definir data de abstinência:", error);
    }
});

// 3. Carregar e Monitorar a Contagem
function carregarAbstinencia() {
    if (!userId) return;

    const rastreadorRef = db.collection('users').doc(userId).collection('abstinencia').doc('rastreador');
    
    // onSnapshot: Ouve a data de início
    rastreadorRef.onSnapshot(doc => {
        if (doc.exists) {
            const data = doc.data();
            calcularDiasAbstinencia(data.dataInicio);
        } else {
             diasSemFumarP.textContent = "0 dias";
             incentivoMensagemP.textContent = "Defina a sua data de início abaixo!";
        }
    }, err => {
        console.error("Erro ao carregar abstinência:", err);
    });

    // Atualiza a contagem a cada 60 segundos (para não depender apenas do recarregamento)
    setInterval(() => {
        if (rastreadorRef && userId) {
            rastreadorRef.get().then(doc => {
                if (doc.exists) {
                    calcularDiasAbstinencia(doc.data().dataInicio);
                }
            });
        }
    }, 60000); // 1 minuto
}
