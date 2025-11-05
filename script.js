// script.js - VERSÃO CORRIGIDA - Dashboard Pessoal
// CORREÇÕES: Estrutura Firestore, Autenticação e Carregamento de Dados

// =========================================================================
// CONFIGURAÇÃO FIREBASE
// =========================================================================
const firebaseConfig = {
    apiKey: "AIzaSyCVbVp_yB2c2DoP96u7e_28stu6b0GkycI",
    authDomain: "dashboard-pessoal-ed6d1.firebaseapp.com",
    projectId: "dashboard-pessoal-ed6d1",
    storageBucket: "dashboard-pessoal-ed6d1.firebasestorage.app",
    messagingSenderId: "298094497295",
    appId: "1:298094497295:web:21c80fbd60ec19c8bf9d7a"
};

// Inicializar Firebase
firebase.initializeApp(firebaseConfig);
const db = firebase.firestore();
const auth = firebase.auth();

let userId = null;
let updateInterval = null;

// =========================================================================
// INICIAR APLICATIVO
// =========================================================================
function iniciarAplicativo() {
    console.log("🚀 DOM pronto. Iniciando aplicativo...");

    // Elementos DOM
    const elementos = {
        // Finanças
        formTransacao: document.getElementById('formTransacao'),
        descricaoInput: document.getElementById('descricao'),
        valorInput: document.getElementById('valor'),
        tipoInput: document.getElementById('tipo'),
        listaTransacoesUL: document.getElementById('listaTransacoes'),
        totalReceitaP: document.getElementById('totalReceita'),
        totalDespesaP: document.getElementById('totalDespesa'),
        saldoAtualP: document.getElementById('saldoAtual'),

        // Leitura
        formLivro: document.getElementById('formLivro'),
        tituloLivroInput: document.getElementById('tituloLivro'),
        autorLivroInput: document.getElementById('autorLivro'),
        paginasIniciaisInput: document.getElementById('paginasIniciais'),
        paginasTotaisInput: document.getElementById('paginasTotais'),
        listaLivrosUL: document.getElementById('listaLivros'),

        // Fidelidade
        formContainerFidelidade: document.getElementById('formContainerFidelidade'),
        formAbstinencia: document.getElementById('formAbstinencia'),
        dataInicioInput: document.getElementById('dataInicio'),
        diasFidelidadeP: document.getElementById('diasFidelidade'),
        incentivoMensagemP: document.getElementById('incentivoMensagem'),
        fidelidadeBarra: document.getElementById('fidelidadeBarra'),
        progressoLabel: document.getElementById('progressoLabel'),
        botaoRecaida: document.getElementById('botaoRecaida'),
        overlayRecaida: document.getElementById('overlayRecaida'),
        fecharOverlay: document.getElementById('fecharOverlay')
    };

    // =========================================================================
    // NAVEGAÇÃO ENTRE ABAS
    // =========================================================================
    document.querySelectorAll('.aba-botao').forEach(button => {
        button.addEventListener('click', () => {
            const abaId = button.dataset.aba;

            // Remover active de todos
            document.querySelectorAll('.aba-botao').forEach(btn => {
                btn.classList.remove('active');
            });

            // Esconder todas as seções
            document.querySelectorAll('.content-section').forEach(section => {
                section.style.display = 'none';
            });

            // Mostrar seção ativa
            const secaoAtiva = document.getElementById(abaId);
            if (secaoAtiva) {
                secaoAtiva.style.display = 'block';
            }

            // Adicionar active ao botão clicado
            button.classList.add('active');
        });
    });

    // =========================================================================
    // FUNCIONALIDADE FINANCEIRA
    // =========================================================================
    function formatarMoeda(valor) {
        return valor.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
    }

    elementos.formTransacao?.addEventListener('submit', async (e) => {
        e.preventDefault();
        if (!userId) {
            console.error("❌ UserID não disponível");
            return;
        }

        const descricao = elementos.descricaoInput.value;
        const valor = parseFloat(elementos.valorInput.value);
        const tipo = elementos.tipoInput.value;

        if (!descricao || isNaN(valor) || valor <= 0) {
            console.warn("⚠️ Dados da transação inválidos");
            return;
        }

        const novaTransacao = {
            descricao: descricao,
            valor: valor,
            tipo: tipo,
            data: firebase.firestore.FieldValue.serverTimestamp(),
            userId: userId
        };

        try {
            await db.collection('transacoes').add(novaTransacao);
            console.log("✅ Transação adicionada com sucesso");
            elementos.formTransacao.reset();
        } catch (error) {
            console.error("❌ Erro ao adicionar transação:", error);
        }
    });

    function carregarTransacoes() {
        if (!userId) {
            console.log("⏳ Aguardando userID para carregar transações...");
            return;
        }

        console.log("📊 Carregando transações para user:", userId);
        
        db.collection('transacoes')
            .where('userId', '==', userId)
            .orderBy('data', 'desc')
            .onSnapshot(snapshot => {
                console.log(`📈 ${snapshot.size} transações carregadas`);
                
                if (!elementos.listaTransacoesUL) return;
                
                elementos.listaTransacoesUL.innerHTML = '';
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
                    elementos.listaTransacoesUL.appendChild(listItem);

                    // Event listener para excluir
                    listItem.querySelector('.botao-excluir').addEventListener('click', () => excluirTransacao(id));
                });

                atualizarResumoFinancas(totalReceita, totalDespesa);
            }, error => {
                console.error("❌ Erro ao carregar transações:", error);
            });
    }

    function atualizarResumoFinancas(receita, despesa) {
        if (!elementos.totalReceitaP || !elementos.totalDespesaP || !elementos.saldoAtualP) return;
        
        const saldo = receita - despesa;
        elementos.totalReceitaP.textContent = formatarMoeda(receita);
        elementos.totalDespesaP.textContent = formatarMoeda(despesa);
        elementos.saldoAtualP.textContent = formatarMoeda(saldo);
        elementos.saldoAtualP.style.color = saldo >= 0 ? 'var(--cor-sucesso)' : 'var(--cor-perigo)';
    }

    async function excluirTransacao(id) {
        if (!userId) return;
        try {
            await db.collection('transacoes').doc(id).delete();
            console.log("🗑️ Transação excluída");
        } catch (error) {
            console.error("❌ Erro ao excluir transação:", error);
        }
    }

    // =========================================================================
    // ACOMPANHAMENTO DE LEITURA
    // =========================================================================
    elementos.formLivro?.addEventListener('submit', async (e) => {
        e.preventDefault();
        if (!userId) {
            console.error("❌ UserID não disponível");
            return;
        }

        const titulo = elementos.tituloLivroInput.value;
        const autor = elementos.autorLivroInput.value;
        const totalPaginas = parseInt(elementos.paginasTotaisInput.value, 10);
        const paginasLidasIniciais = parseInt(elementos.paginasIniciaisInput.value, 10) || 0;

        if (!titulo || !autor || isNaN(totalPaginas) || totalPaginas <= 0) {
            console.warn("⚠️ Dados do livro inválidos");
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
            await db.collection('livros').add(novoLivro);
            console.log("📚 Livro adicionado com sucesso");
            elementos.formLivro.reset();
        } catch (error) {
            console.error("❌ Erro ao adicionar livro:", error);
        }
    });

    function carregarLivros() {
        if (!userId) {
            console.log("⏳ Aguardando userID para carregar livros...");
            return;
        }

        console.log("📖 Carregando livros para user:", userId);

        db.collection('livros')
            .where('userId', '==', userId)
            .orderBy('dataAdicionado', 'desc')
            .onSnapshot(snapshot => {
                console.log(`📚 ${snapshot.size} livros carregados`);
                
                if (!elementos.listaLivrosUL) return;
                
                elementos.listaLivrosUL.innerHTML = '';

                if (snapshot.empty) {
                    elementos.listaLivrosUL.innerHTML = '<li>Nenhum livro encontrado. Adicione seu primeiro livro!</li>';
                    return;
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
                    elementos.listaLivrosUL.appendChild(listItem);

                    // Event listeners para controles do livro
                    listItem.querySelectorAll('.botao-progresso').forEach(button => {
                        button.addEventListener('click', () => {
                            const paginas = parseInt(button.dataset.acao, 10);
                            const novoProgresso = Math.max(0, lidas + paginas);
                            atualizarProgressoLivro(id, Math.min(novoProgresso, total), total);
                        });
                    });

                    listItem.querySelector('.botao-remover').addEventListener('click', () => removerLivro(id));
                });
            }, error => {
                console.error("❌ ERRO AO CARREGAR LIVROS:", error);
            });
    }

    async function atualizarProgressoLivro(id, novoTotalLido, totalPaginas) {
        if (!userId) return;
        try {
            const paginasLidas = Math.max(0, Math.min(novoTotalLido, totalPaginas));
            await db.collection('livros').doc(id).update({
                paginasLidas: paginasLidas
            });
            console.log("📖 Progresso do livro atualizado");
        } catch (error) {
            console.error("❌ Erro ao atualizar progresso:", error);
        }
    }

    async function removerLivro(id) {
        if (!userId) return;
        try {
            await db.collection('livros').doc(id).delete();
            console.log("🗑️ Livro removido");
        } catch (error) {
            console.error("❌ Erro ao remover livro:", error);
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
            if (elementos.diasFidelidadeP) elementos.diasFidelidadeP.textContent = "Data não definida";
            return;
        }

        const inicioMs = dataInicioTimestamp.toDate().getTime();
        const agoraMs = new Date().getTime();
        const diferencaMs = agoraMs - inicioMs;
        const umDiaMs = 1000 * 60 * 60 * 24;
        const dias = Math.floor(diferencaMs / umDiaMs);

        if (dias < 0) {
            if (elementos.diasFidelidadeP) elementos.diasFidelidadeP.textContent = "Data futura?";
            if (elementos.incentivoMensagemP) elementos.incentivoMensagemP.textContent = "Por favor, escolha uma data no passado.";
            if (elementos.fidelidadeBarra) elementos.fidelidadeBarra.style.width = '0%';
            if (elementos.progressoLabel) elementos.progressoLabel.textContent = "0 / 60 dias";
            return;
        }

        if (elementos.diasFidelidadeP) elementos.diasFidelidadeP.textContent = `${dias} ${dias === 1 ? 'dia' : 'dias'}`;
        const progressoPercentual = Math.min(100, (dias / META_DIAS) * 100);
        if (elementos.fidelidadeBarra) elementos.fidelidadeBarra.style.width = `${progressoPercentual}%`;
        if (elementos.progressoLabel) elementos.progressoLabel.textContent = `${dias} / ${META_DIAS} dias`;
        if (elementos.incentivoMensagemP) elementos.incentivoMensagemP.textContent = INCENTIVOS[dias % INCENTIVOS.length];
    }

    elementos.formAbstinencia?.addEventListener('submit', async (e) => {
        e.preventDefault();
        if (!userId) {
            console.error("❌ UserID não disponível");
            return;
        }

        const dataString = elementos.dataInicioInput.value;
        if (!dataString) {
            console.warn("⚠️ Nenhuma data selecionada");
            return;
        }

        try {
            const [ano, mes, dia] = dataString.split('-').map(Number);
            const dataInicio = new Date(ano, mes - 1, dia);
            
            const fidelidadeData = {
                dataInicio: firebase.firestore.Timestamp.fromDate(dataInicio),
                userId: userId
            };

            await db.collection('fidelidade').doc(userId).set(fidelidadeData);
            console.log("✅ Data de fidelidade definida com SUCESSO!");
            elementos.formAbstinencia.reset();
        } catch (error) {
            console.error("❌ Erro ao definir data de fidelidade:", error);
        }
    });

    elementos.botaoRecaida?.addEventListener('click', async () => {
        if (!userId) return;
        
        console.log("💔 Botão de recaída clicado");
        if (elementos.overlayRecaida) elementos.overlayRecaida.classList.remove('hidden');
        
        try {
            await db.collection('fidelidade').doc(userId).delete();
            console.log("🔄 Contador zerado. Recaída registrada");
        } catch (error) {
            console.error("❌ Erro ao registrar recaída:", error);
        }
    });

    elementos.fecharOverlay?.addEventListener('click', () => {
        if (elementos.overlayRecaida) elementos.overlayRecaida.classList.add('hidden');
    });

    function carregarFidelidade() {
        if (!userId) {
            console.log("⏳ Aguardando userID para carregar fidelidade...");
            return;
        }

        console.log("🎯 Carregando dados de fidelidade para user:", userId);

        if (updateInterval) clearInterval(updateInterval);

        const fidelidadeRef = db.collection('fidelidade').doc(userId);
        let dataInicioGlobal = null;

        fidelidadeRef.onSnapshot(doc => {
            console.log("📅 Snapshot 'Fidelidade' recebido. Doc existe?", doc.exists);
            
            if (doc.exists && doc.data() && doc.data().dataInicio) {
                console.log("✅ Documento de fidelidade ENCONTRADO com data válida");
                const data = doc.data();
                dataInicioGlobal = data.dataInicio;

                // Esconder formulário, mostrar botão de recaída
                if (elementos.formContainerFidelidade) elementos.formContainerFidelidade.style.display = 'none';
                if (elementos.botaoRecaida) elementos.botaoRecaida.style.display = 'block';

                calcularDiasFidelidade(dataInicioGlobal);

                // Preencher input com a data salva
                const dataJS = dataInicioGlobal.toDate();
                if (elementos.dataInicioInput) elementos.dataInicioInput.value = dataJS.toISOString().split('T')[0];
                
            } else {
                console.log("❌ Documento de fidelidade NÃO encontrado ou sem data");
                dataInicioGlobal = null;

                // Mostrar formulário, esconder botão de recaída
                if (elementos.formContainerFidelidade) elementos.formContainerFidelidade.style.display = 'block';
                if (elementos.botaoRecaida) elementos.botaoRecaida.style.display = 'none';

                // Resetar display
                if (elementos.diasFidelidadeP) elementos.diasFidelidadeP.textContent = "0 dias";
                if (elementos.incentivoMensagemP) elementos.incentivoMensagemP.textContent = "Defina sua data de início para começar!";
                if (elementos.dataInicioInput) elementos.dataInicioInput.value = '';
                if (elementos.fidelidadeBarra) elementos.fidelidadeBarra.style.width = '0%';
                if (elementos.progressoLabel) elementos.progressoLabel.textContent = `0 / ${META_DIAS} dias`;
            }
        }, error => {
            console.error("❌ Erro CRÍTICO ao carregar fidelidade:", error);
        });

        // Atualizar contador a cada minuto
        updateInterval = setInterval(() => {
            if (dataInicioGlobal) {
                calcularDiasFidelidade(dataInicioGlobal);
            }
        }, 60000);
    }

    // =========================================================================
    // AUTENTICAÇÃO E INICIALIZAÇÃO
    // =========================================================================
    function loginAnonimo() {
        auth.signInAnonymously()
            .then(() => {
                console.log("✅ Utilizador autenticado anonimamente");
            })
            .catch((error) => {
                console.error("❌ Erro na autenticação:", error);
            });
    }

    auth.onAuthStateChanged((user) => {
        if (user) {
            userId = user.uid;
            console.log("👤 UserID definido:", userId);
            
            // INICIAR CARGA DOS DADOS
            carregarTransacoes();
            carregarLivros();
            carregarFidelidade();
            
        } else {
            userId = null;
            console.log("👤 Nenhum usuário logado. Fazendo login anônimo...");
            loginAnonimo();
        }
    });

    // Login inicial
    if (!auth.currentUser) {
        loginAnonimo();
    }
}

// =========================================================================
// INICIAR APLICAÇÃO
// =========================================================================
document.addEventListener('DOMContentLoaded', iniciarAplicativo);
