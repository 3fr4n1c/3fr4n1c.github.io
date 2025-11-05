// script.js - Cérebro do Dashboard Pessoal
// Versão para GitHub Pages (usa v9 Compat e suas credenciais)
// CORREÇÃO: DOMContentLoaded e Lógica de navegação (style.display)

// =========================================================================
// PASSO 1: CONFIGURAÇÃO ORIGINAL DO FIREBASE
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
// INICIAR A APLICAÇÃO APÓS O DOM CARREGAR
// =========================================================================
function iniciarAplicativo() {
    console.log("DOM pronto. Iniciando aplicativo...");

    // Elementos da Seção Financeira
    const formTransacao = document.getElementById('formTransacao');
    const descricaoInput = document.getElementById('descricao');
    const valorInput = document.getElementById('valor');
    const tipoInput = document.getElementById('tipo');
    const listaTransacoesUL = document.getElementById('listaTransacoes');
    const totalReceitaP = document.getElementById('totalReceita');
    const totalDespesaP = document.getElementById('totalDespesa');
    const saldoAtualP = document.getElementById('saldoAtual');

    // Elementos da Seção Leitura
    const formLivro = document.getElementById('formLivro');
    const tituloLivroInput = document.getElementById('tituloLivro');
    const autorLivroInput = document.getElementById('autorLivro');
    const paginasIniciaisInput = document.getElementById('paginasIniciais');
    const paginasTotaisInput = document.getElementById('paginasTotais');
    const listaLivrosUL = document.getElementById('listaLivros');

    // Elementos da Seção Fidelidade
    const formContainerFidelidade = document.getElementById('formContainerFidelidade');
    const formAbstinencia = document.getElementById('formAbstinencia');
    const dataInicioInput = document.getElementById('dataInicio');
    const diasFidelidadeP = document.getElementById('diasFidelidade');
    const incentivoMensagemP = document.getElementById('incentivoMensagem');
    const fidelidadeBarra = document.getElementById('fidelidadeBarra');
    const progressoLabel = document.getElementById('progressoLabel');
    const botaoRecaida = document.getElementById('botaoRecaida');
    const overlayRecaida = document.getElementById('overlayRecaida');
    const fecharOverlay = document.getElementById('fecharOverlay');

    // =========================================================================
    // NAVEGAÇÃO ENTRE ABAS (LÓGICA CORRIGIDA)
    // =========================================================================

    document.querySelectorAll('.aba-botao').forEach(button => {
        button.addEventListener('click', () => {
            const abaId = button.dataset.aba;

            // Ocultar todas as seções (Usando style.display para sobrepor o !important)
            document.querySelectorAll('.content-section').forEach(section => {
                section.style.display = 'none';
            });

            // Mostrar a seção clicada (Usando style.display)
            const secaoAtiva = document.getElementById(abaId);
            if (secaoAtiva) {
                secaoAtiva.style.display = 'block';
            }

            // Marcar o botão como ativo
            document.querySelectorAll('.aba-botao').forEach(btn => {
                btn.classList.remove('active');
            });
            button.classList.add('active');
        });
    });

    // =========================================================================
    // FUNCIONALIDADE FINANCEIRA
    // =========================================================================

    function formatarMoeda(valor) {
        return valor.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
    }

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
            data: firebase.firestore.FieldValue.serverTimestamp(),
            userId: userId 
        };
        try {
            await db.collection('users').doc(userId).collection('transacoes').add(novaTransacao);
            formTransacao.reset();
            tipoInput.value = 'receita';
        } catch (error) {
            console.error("Erro ao adicionar transação: ", error);
        }
    });

    function carregarTransacoesEmTempoReal() {
        if (!userId) return;
        const transacoesRef = db.collection('users').doc(userId).collection('transacoes');
        
        transacoesRef.orderBy('data', 'desc').onSnapshot(snapshot => {
            if (!listaTransacoesUL) return; // Verificação de segurança
            listaTransacoesUL.innerHTML = ''; 
            let totalReceita = 0;
            let totalDespesa = 0;
            
            snapshot.forEach(doc => {
                const transacao = doc.data();
                const id = doc.id; 
                if (transacao.tipo === 'receita') totalReceita += transacao.valor;
                else totalDespesa += transacao.valor;

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
        }, err => {
            console.error("Erro ao carregar transações:", err);
        });
    }

    function atualizarResumo(receita, despesa) {
        if (!totalReceitaP || !totalDespesaP || !saldoAtualP) return;
        const saldo = receita - despesa;
        totalReceitaP.textContent = formatarMoeda(receita);
        totalDespesaP.textContent = formatarMoeda(despesa);
        saldoAtualP.textContent = formatarMoeda(saldo);
        saldoAtualP.style.color = saldo >= 0 ? 'var(--cor-sucesso)' : 'var(--cor-perigo)'; 
    }

    async function excluirTransacao(id) {
        if (!userId) return; 
        try {
            await db.collection('users').doc(userId).collection('transacoes').doc(id).delete();
        } catch (error) {
            console.error("Erro ao excluir transação:", error);
        }
    }

    // =========================================================================
    // ACOMPANHAMENTO DE LEITURA
    // =========================================================================

    formLivro.addEventListener('submit', async (e) => {
        e.preventDefault(); 
        if (!userId) return;
        const titulo = tituloLivroInput.value;
        const autor = autorLivroInput.value;
        const totalPaginas = parseInt(paginasTotaisInput.value, 10); 
        const paginasLidasIniciais = parseInt(paginasIniciaisInput.value, 10) || 0; 
        
        if (!titulo || !autor || isNaN(totalPaginas) || totalPaginas <= 0) {
            console.warn("Dados do livro inválidos.");
            return;
        }

        const novoLivro = {
            titulo: titulo,
            autor: autor, 
            paginasTotais: totalPaginas,
            paginasLidas: Math.min(paginasLidasIniciais, totalPaginas), 
            dataAdicionado: firebase.firestore.FieldValue.serverTimestamp(),
            userId: userId 
        };
        try {
            await db.collection('users').doc(userId).collection('livros').add(novoLivro);
            console.log("Livro ADICIONADO com sucesso.");
            formLivro.reset();
        } catch (error) {
            console.error("Erro ao ADICIONAR livro: ", error);
        }
    });

    function carregarLivrosEmTempoReal() {
        if (!userId) return;
        const livrosRef = db.collection('users').doc(userId).collection('livros');
        
        livrosRef.orderBy('dataAdicionado', 'asc').onSnapshot(snapshot => {
            console.log("Recebido snapshot de Livros. Documentos:", snapshot.size);
            if (!listaLivrosUL) return; // Verificação de segurança
            listaLivrosUL.innerHTML = ''; 
            if (snapshot.empty) {
                console.log("Nenhum livro encontrado.");
            }
            
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
        }, err => {
            console.error("ERRO AO CARREGAR LIVROS! Se for um erro de 'índice' (index), clique no link no erro para criar o índice no Firebase.", err);
        });
    }

    async function atualizarProgressoLivro(id, novoTotalLido, totalPaginas) {
        if (!userId) return; 
        try {
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
        try {
            await db.collection('users').doc(userId).collection('livros').doc(id).delete();
        } catch (error) {
            console.error("Erro ao remover livro:", error);
        }
    }

    // =========================================================================
    // FUNCIONALIDADE FIDELIDADE
    // =========================================================================

    const INCENTIVOS = [
        "Parabéns! Cada dia é uma grande vitória!",
        "Lembre-se do seu objetivo! Você está indo muito bem.",
        "Sua saúde agradece a cada minuto. Mantenha o foco!",
        "Mais um dia fiel. Você é mais forte do que pensa!",
        "Continue firme na sua jornada!",
        "Você está escrevendo sua própria história de sucesso. Não pare agora!"
    ];
    const META_DIAS = 60;

    function calcularDiasFidelidade(dataInicioTimestamp) {
        if (!dataInicioTimestamp) {
            if (diasFidelidadeP) diasFidelidadeP.textContent = "Data não definida.";
            return;
        }
        
        const inicioMs = dataInicioTimestamp.toDate().getTime();
        const agoraMs = new Date().getTime();
        const diferencaMs = agoraMs - inicioMs;
        const umDiaMs = 1000 * 60 * 60 * 24;
        const dias = Math.floor(diferencaMs / umDiaMs);
        
        if (dias < 0) {
             if(diasFidelidadeP) diasFidelidadeP.textContent = "Data futura?";
             if(incentivoMensagemP) incentivoMensagemP.textContent = "Por favor, escolha uma data no passado.";
             if(fidelidadeBarra) fidelidadeBarra.style.width = '0%';
             if(progressoLabel) progressoLabel.textContent = "0 / 60 dias";
             return;
        }
        
        if(diasFidelidadeP) diasFidelidadeP.textContent = `${dias} ${dias === 1 ? 'dia' : 'dias'}`;
        const progressoPercentual = Math.min(100, (dias / META_DIAS) * 100);
        if(fidelidadeBarra) fidelidadeBarra.style.width = `${progressoPercentual}%`;
        if(progressoLabel) progressoLabel.textContent = `${dias} / ${META_DIAS} dias`;
        if(incentivoMensagemP) incentivoMensagemP.textContent = INCENTIVOS[dias % INCENTIVOS.length];
    }

    formAbstinencia.addEventListener('submit', async (e) => {
        e.preventDefault();
        if (!userId) return;
        const dataString = dataInicioInput.value;
        if (!dataString) {
            console.warn("Nenhuma data selecionada.");
            return;
        }
        try {
            console.log("Tentando salvar data:", dataString);
            const [ano, mes, dia] = dataString.split('-').map(Number);
            const dataInicio = new Date(ano, mes - 1, dia);
            const abstinenciaData = {
                dataInicio: firebase.firestore.Timestamp.fromDate(dataInicio),
                userId: userId
            };
            const docRef = db.collection('users').doc(userId).collection('abstinencia').doc('rastreador');
            await docRef.set(abstinenciaData);
            console.log("Data de fidelidade definida com SUCESSO!");
            formAbstinencia.reset();
        } catch (error) {
            console.error("Erro ao definir data de fidelidade:", error);
        }
    });

    botaoRecaida.addEventListener('click', async () => {
        if (!userId) return;
        console.log("Botão de recaída clicado.");
        if (overlayRecaida) overlayRecaida.classList.remove('hidden');
        try {
            const docRef = db.collection('users').doc(userId).collection('abstinencia').doc('rastreador');
            await docRef.delete();
            console.log("Contador zerado. Recaída registrada.");
        } catch (error) {
             console.error("Erro ao registrar recaída:", error);
        }
    });

    fecharOverlay.addEventListener('click', () => {
         if (overlayRecaida) overlayRecaida.classList.add('hidden');
    });

    function carregarAbstinencia() {
        if (!userId) return;
        console.log("Iniciando 'carregarAbstinencia'..."); 
        
        if (updateInterval) clearInterval(updateInterval);

        const rastreadorRef = db.collection('users').doc(userId).collection('abstinencia').doc('rastreador');
        let dataInicioGlobal = null;

        rastreadorRef.onSnapshot(doc => {
            console.log("Snapshot 'Fidelidade' recebido. Doc existe?", doc.exists);
            
            let dataValidaEncontrada = false;
            if (doc.exists && doc.data() && doc.data().dataInicio) {
                console.log("Documento de fidelidade ENCONTRADO e tem data.");
                dataValidaEncontrada = true;
                
                const data = doc.data();
                dataInicioGlobal = data.dataInicio;
                
                if (formContainerFidelidade) formContainerFidelidade.style.display = 'none';
                if (botaoRecaida) botaoRecaida.style.display = 'block';
                
                calcularDiasFidelidade(dataInicioGlobal); 
                
                const dataJS = dataInicioGlobal.toDate();
                if (dataInicioInput) dataInicioInput.value = dataJS.toISOString().split('T')[0];
                
            } 
            
            if (!dataValidaEncontrada) {
                console.log("Documento de fidelidade NÃO encontrado ou está sem data.");
                dataInicioGlobal = null;
                
                if (formContainerFidelidade) formContainerFidelidade.style.display = 'block';
                if (botaoRecaida) botaoRecaida.style.display = 'none';
                
                if (diasFidelidadeP) diasFidelidadeP.textContent = "0 dias";
                if (incentivoMensagemP) incentivoMensagemP.textContent = "Defina sua data de início para começar!";
                if (dataInicioInput) dataInicioInput.value = ''; 
                if (fidelidadeBarra) fidelidadeBarra.style.width = '0%';
                if (progressoLabel) progressoLabel.textContent = `0 / ${META_DIAS} dias`;
            }
        }, err => {
            console.error("Erro CRÍTICO ao carregar contador 'Fidelidade':", err);
        });

        updateInterval = setInterval(() => {
            if (dataInicioGlobal) {
                calcularDiasFidelidade(dataInicioGlobal);
            }
        }, 60000);
    }

    // =========================================================================
    // AUTENTICAÇÃO (AGORA DENTRO DO INICIAR)
    // =========================================================================
    
    function loginAnonimo() {
        auth.signInAnonymously()
            .then(() => {
                console.log("Utilizador autenticado anonimamente (ID temporário).");
            })
            .catch((error) => {
                console.error("Erro na autenticação:", error);
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

    // Inicia a primeira tentativa de login anônimo
    if (!auth.currentUser) {
        loginAnonimo();
    }

} // Fim da função iniciarAplicativo()


// =========================================================================
// OUVINTE PRINCIPAL
// =========================================================================
document.addEventListener('DOMContentLoaded', iniciarAplicativo);

