// ==================== CONFIGURAÇÃO FIREBASE ====================
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
let fidelidadeInterval = null;

// ==================== SISTEMA DE AUTENTICAÇÃO ====================
document.addEventListener('DOMContentLoaded', function() {
    console.log('🖥️ STELLAR ARCHIVE SECURITY SYSTEM INITIALIZED');
    
    // Configurar estado inicial
    showLoginScreen();
    
    // Configurar formulário de login
    setupLoginSystem();
    
    // Verificar se já está logado
    checkExistingAuth();
});

function checkExistingAuth() {
    auth.onAuthStateChanged(user => {
        if (user) {
            // Usuário já está logado (sessão anterior)
            userId = user.uid;
            console.log('🔐 COMMANDER ALREADY LOGGED IN:', userId);
            showWelcomeAndDashboard();
        }
        // Se não estiver logado, mantém na tela de login
    });
}

function setupLoginSystem() {
    const loginForm = document.getElementById('loginForm');
    const loginEmail = document.getElementById('loginEmail');
    const loginPassword = document.getElementById('loginPassword');
    const accessButton = loginForm.querySelector('.access-button');
    const panelStatus = document.querySelector('.panel-status');

    // Criar mensagem de erro
    const errorDiv = document.createElement('div');
    errorDiv.className = 'error-message';
    loginForm.appendChild(errorDiv);

    loginForm.addEventListener('submit', async function(e) {
        e.preventDefault();
        
        const email = loginEmail.value;
        const password = loginPassword.value;
        
        if (!email || !password) {
            showError('PLEASE PROVIDE COMPLETE CREDENTIALS');
            return;
        }

        // Mostrar loading
        accessButton.innerHTML = '<span class="loading-spinner"></span> ACCESSING SYSTEM...';
        accessButton.disabled = true;
        panelStatus.textContent = 'VERIFYING CREDENTIALS...';
        panelStatus.style.color = '#00ffff';
        
        errorDiv.classList.remove('show');

        try {
            const userCredential = await auth.signInWithEmailAndPassword(email, password);
            console.log('✅ SECURITY CLEARANCE GRANTED');
            
            // Sucesso no login
            userId = userCredential.user.uid;
            showWelcomeAndDashboard();
            
        } catch (error) {
            console.error('❌ ACCESS DENIED:', error);
            
            // Tratar diferentes tipos de erro
            let errorMessage = 'ACCESS DENIED: ';
            switch (error.code) {
                case 'auth/invalid-email':
                    errorMessage += 'INVALID COMMANDER IDENTIFICATION';
                    break;
                case 'auth/user-disabled':
                    errorMessage += 'COMMANDER ACCOUNT SUSPENDED';
                    break;
                case 'auth/user-not-found':
                    errorMessage += 'COMMANDER NOT FOUND IN DATABASE';
                    break;
                case 'auth/wrong-password':
                    errorMessage += 'INCORRECT SECURITY CLEARANCE CODE';
                    break;
                case 'auth/too-many-requests':
                    errorMessage += 'TOO MANY FAILED ATTEMPTS - TRY LATER';
                    break;
                default:
                    errorMessage += 'SECURITY SYSTEM ERROR';
            }
            
            showError(errorMessage);
            panelStatus.textContent = 'ACCESS DENIED';
            panelStatus.style.color = '#dc2626';
        } finally {
            // Restaurar botão
            accessButton.innerHTML = '<span class="button-icon">🚀</span> INITIATE ACCESS SEQUENCE';
            accessButton.disabled = false;
        }
    });

    function showError(message) {
        errorDiv.textContent = message;
        errorDiv.classList.add('show');
        
        // Efeito de shake no formulário
        loginForm.style.animation = 'errorShake 0.5s ease-in-out';
        setTimeout(() => {
            loginForm.style.animation = '';
        }, 500);
    }
}

// ==================== CONTROLE DE TELAS ====================
function showLoginScreen() {
    console.log('🔐 SHOWING LOGIN SCREEN');
    document.getElementById('loginScreen').classList.remove('hidden');
    document.getElementById('welcomeMessage').classList.add('hidden');
    document.getElementById('mainDashboard').classList.add('hidden');
}

function showWelcomeMessage() {
    console.log('👋 SHOWING WELCOME MESSAGE');
    document.getElementById('loginScreen').classList.add('hidden');
    document.getElementById('welcomeMessage').classList.remove('hidden');
    document.getElementById('mainDashboard').classList.add('hidden');
}

function showDashboard() {
    console.log('📊 SHOWING DASHBOARD');
    document.getElementById('loginScreen').classList.add('hidden');
    document.getElementById('welcomeMessage').classList.add('hidden');
    document.getElementById('mainDashboard').classList.remove('hidden');
}

function showWelcomeAndDashboard() {
    console.log('🚀 STARTING WELCOME SEQUENCE');
    showWelcomeMessage();
    
    // Mostrar dashboard após 3 segundos
    setTimeout(() => {
        showDashboard();
        initializeDashboardSystems();
    }, 3000);
}

// ==================== SISTEMAS DO DASHBOARD ====================
function initializeDashboardSystems() {
    console.log('🎯 INITIALIZING STELLAR ARCHIVE SYSTEMS...');
    
    // Atualizar data no rodapé
    document.getElementById('dataAtual').textContent = new Date().toLocaleDateString('pt-BR');
    
    // Atualizar stardate
    atualizarStardate();
    setInterval(atualizarStardate, 60000);

    // Inicializar navegação
    initializeNavigation();
    
    // Inicializar módulos
    initializeFinancialSystems();
    initializeLibraryDatabase();
    initializeDisciplineProtocol();
    
    // Adicionar botão de logout
    addLogoutButton();
}

function initializeNavigation() {
    document.querySelectorAll('.nav-item').forEach(item => {
        item.addEventListener('click', function() {
            const targetSection = this.getAttribute('data-aba');
            
            // Atualizar navegação ativa
            document.querySelectorAll('.nav-item').forEach(nav => {
                nav.classList.remove('active');
            });
            this.classList.add('active');
            
            // Mostrar/ocultar seções
            document.querySelectorAll('.content-section').forEach(section => {
                section.classList.remove('active');
            });
            document.getElementById(targetSection).classList.add('active');
            
            console.log(`🔀 NAVIGATING TO: ${targetSection.toUpperCase()}`);
        });
    });
}

// ==================== MÓDULOS DO DASHBOARD ====================
function initializeFinancialSystems() {
    const form = document.getElementById('formTransacao');
    const transactionList = document.getElementById('listaTransacoes');
    
    if (!form || !transactionList) {
        console.error('❌ FINANCIAL SYSTEM ELEMENTS NOT FOUND');
        return;
    }
    
    // Carregar transações em tempo real
    db.collection('transacoes')
        .where('userId', '==', userId)
        .orderBy('data', 'desc')
        .onSnapshot(snapshot => {
            console.log(`💰 FINANCIAL DATA STREAM: ${snapshot.size} RECORDS`);
            transactionList.innerHTML = '';
            let totalIncome = 0;
            let totalExpenses = 0;

            snapshot.forEach(doc => {
                const transaction = doc.data();
                const listItem = document.createElement('li');
                
                if (transaction.tipo === 'receita') {
                    listItem.className = 'receita-item';
                    totalIncome += transaction.valor;
                } else {
                    listItem.className = 'despesa-item';
                    totalExpenses += transaction.valor;
                }

                listItem.innerHTML = `
                    <div>${transaction.descricao}</div>
                    <div class="valor-container">
                        <span class="valor-display">${transaction.tipo === 'receita' ? '+' : '-'} CREDITS ${transaction.valor.toFixed(2)}</span>
                        <button class="botao-excluir" data-id="${doc.id}">🗑️ DELETE</button>
                    </div>
                `;
                transactionList.appendChild(listItem);

                // Evento para excluir transação
                listItem.querySelector('.botao-excluir').addEventListener('click', function() {
                    if (confirm('🚨 CONFIRM TRANSACTION DELETION?')) {
                        db.collection('transacoes').doc(this.getAttribute('data-id')).delete();
                    }
                });
            });

            // Atualizar resumo financeiro
            updateFinancialSummary(totalIncome, totalExpenses);
        });

    // Adicionar nova transação
    form.addEventListener('submit', function(e) {
        e.preventDefault();
        
        const description = document.getElementById('descricao').value;
        const amount = parseFloat(document.getElementById('valor').value);
        const type = document.getElementById('tipo').value;

        if (description && amount > 0) {
            db.collection('transacoes').add({
                descricao: description,
                valor: amount,
                tipo: type,
                data: new Date(),
                userId: userId
            }).then(() => {
                form.reset();
                console.log('✅ TRANSACTION RECORDED IN DATABASE');
            });
        }
    });
}

function updateFinancialSummary(income, expenses) {
    const balance = income - expenses;
    document.getElementById('totalReceita').textContent = `CREDITS ${income.toFixed(2)}`;
    document.getElementById('totalDespesa').textContent = `CREDITS ${expenses.toFixed(2)}`;
    document.getElementById('saldoAtual').textContent = `CREDITS ${balance.toFixed(2)}`;
}

function initializeLibraryDatabase() {
    const form = document.getElementById('formLivro');
    const bookList = document.getElementById('listaLivros');
    
    if (!form || !bookList) {
        console.error('❌ LIBRARY SYSTEM ELEMENTS NOT FOUND');
        return;
    }
    
    // Carregar livros em tempo real
    db.collection('livros')
        .where('userId', '==', userId)
        .orderBy('dataAdicionado', 'desc')
        .onSnapshot(snapshot => {
            console.log(`📚 LIBRARY DATABASE: ${snapshot.size} ENTRIES LOADED`);
            bookList.innerHTML = '';

            snapshot.forEach(doc => {
                const book = doc.data();
                const pagesRead = book.paginasLidas || 0;
                const totalPages = book.paginasTotais;
                const progressPercentage = Math.min(100, (pagesRead / totalPages) * 100);

                const listItem = document.createElement('li');
                listItem.className = 'livro-item';
                listItem.innerHTML = `
                    <div class="livro-header">
                        <h4>${book.titulo} <small>by ${book.autor}</small></h4>
                        <button class="botao-remover" data-id="${doc.id}">🗑️ DELETE</button>
                    </div>
                    <p>📖 PROGRESS: ${pagesRead} / ${totalPages} PAGES (${Math.round(progressPercentage)}%)</p>
                    <div class="progresso-bar">
                        <div class="progresso-fill" style="width: ${progressPercentage}%"></div>
                    </div>
                    <div class="controles-livro">
                        <button class="botao-progresso" data-id="${doc.id}" data-action="1">+1 PAGE</button>
                        <button class="botao-progresso" data-id="${doc.id}" data-action="5">+5 PAGES</button>
                        <button class="botao-progresso" data-id="${doc.id}" data-action="10">+10 PAGES</button>
                        <button class="botao-progresso botao-remover-pagina" data-id="${doc.id}" data-action="-1">-1 PAGE</button>
                    </div>
                `;
                bookList.appendChild(listItem);

                // Eventos dos botões de progresso
                listItem.querySelectorAll('.botao-progresso').forEach(button => {
                    button.addEventListener('click', function() {
                        const action = parseInt(this.getAttribute('data-action'));
                        const newPages = Math.max(0, pagesRead + action);
                        updateBookProgress(doc.id, Math.min(newPages, totalPages), totalPages);
                    });
                });

                // Evento para remover livro
                listItem.querySelector('.botao-remover').addEventListener('click', function() {
                    if (confirm('🚨 CONFIRM DATABASE ENTRY DELETION?')) {
                        db.collection('livros').doc(doc.id).delete();
                    }
                });
            });
        });

    // Adicionar novo livro
    form.addEventListener('submit', function(e) {
        e.preventDefault();
        
        const title = document.getElementById('tituloLivro').value;
        const author = document.getElementById('autorLivro').value;
        const totalPages = parseInt(document.getElementById('paginasTotais').value);
        const pagesRead = parseInt(document.getElementById('paginasIniciais').value) || 0;

        if (title && author && totalPages > 0) {
            db.collection('livros').add({
                titulo: title,
                autor: author,
                paginasTotais: totalPages,
                paginasLidas: Math.min(pagesRead, totalPages),
                dataAdicionado: new Date(),
                userId: userId
            }).then(() => {
                form.reset();
                console.log('✅ NEW ENTRY ADDED TO LIBRARY DATABASE');
            });
        }
    });
}

async function updateBookProgress(bookId, newPagesRead, totalPages) {
    if (!userId) return;
    try {
        await db.collection('livros').doc(bookId).update({
            paginasLidas: Math.max(0, Math.min(newPagesRead, totalPages))
        });
        console.log('📖 LIBRARY ENTRY UPDATED');
    } catch (error) {
        console.error('❌ DATABASE UPDATE ERROR:', error);
    }
}

function initializeDisciplineProtocol() {
    const form = document.getElementById('formAbstinencia');
    const breachButton = document.getElementById('botaoRecaida');
    const overlay = document.getElementById('overlayRecaida');
    
    if (!form || !breachButton || !overlay) {
        console.error('❌ DISCIPLINE SYSTEM ELEMENTS NOT FOUND');
        return;
    }
    
    // Mensagens de incentivo
    const encouragementMessages = [
        "🎯 YOU ARE STRONGER THAN YOU THINK!",
        "💪 EACH DAY IS A VICTORY!",
        "🚀 CONTINUE FIRMLY ON YOUR MISSION!",
        "🌟 YOUR HEALTH THANKS YOU EVERY MINUTE!",
        "🔥 YOU ARE WRITING YOUR SUCCESS STORY!",
        "🎯 REMEMBER YOUR FINAL OBJECTIVE!"
    ];

    // Monitorar protocolo de disciplina
    db.collection('fidelidade').doc(userId).onSnapshot(doc => {
        if (doc.exists && doc.data().dataInicio) {
            const data = doc.data();
            const startDate = data.dataInicio.toDate();
            
            // Calcular e atualizar automaticamente
            calculateAndUpdateDiscipline(startDate);
            
            // Esconder formulário, mostrar botão de violação
            document.getElementById('formContainerFidelidade').style.display = 'none';
            breachButton.classList.remove('hidden');
            
            console.log('✅ DISCIPLINE PROTOCOL ACTIVE - START DATE:', startDate);
            
        } else {
            // Mostrar formulário, esconder botão de violação
            document.getElementById('formContainerFidelidade').style.display = 'block';
            breachButton.classList.add('hidden');
            
            // Resetar display
            resetDisciplineDisplay();
            console.log('⚠️ NO ACTIVE DISCIPLINE PROTOCOL');
        }
    });

    // Função para calcular e atualizar disciplina
    function calculateAndUpdateDiscipline(startDate) {
        const today = new Date();
        const differenceMs = today - startDate;
        const days = Math.floor(differenceMs / (1000 * 60 * 60 * 24));
        
        // Atualizar contador
        document.getElementById('diasFidelidade').textContent = `${days} SOLAR DAYS`;
        
        // Atualizar barra de progresso (máximo 60 dias)
        const progress = Math.min(100, (days / 60) * 100);
        document.getElementById('fidelidadeBarra').style.width = `${progress}%`;
        document.getElementById('progressoLabel').textContent = `🚀 ${days} / 60 SOLAR DAYS`;
        
        // Atualizar mensagem de incentivo
        const messageIndex = days % encouragementMessages.length;
        document.getElementById('incentivoMensagem').textContent = encouragementMessages[messageIndex];
        
        console.log(`📅 DISCIPLINE PROTOCOL: ${days} days - ${progress.toFixed(1)}% complete`);
    }

    function resetDisciplineDisplay() {
        document.getElementById('diasFidelidade').textContent = '0 SOLAR DAYS';
        document.getElementById('incentivoMensagem').textContent = '🎯 INITIATE PROTOCOL TO BEGIN MISSION';
        document.getElementById('fidelidadeBarra').style.width = '0%';
        document.getElementById('progressoLabel').textContent = '🚀 0 / 60 SOLAR DAYS';
    }

    // Iniciar protocolo
    form.addEventListener('submit', function(e) {
        e.preventDefault();
        
        const dateInput = document.getElementById('dataInicio').value;
        if (dateInput) {
            const startDate = new Date(dateInput);
            
            // Verificar se a data não é futura
            if (startDate > new Date()) {
                alert('⚠️ PLEASE SELECT A DATE IN THE PAST!');
                return;
            }
            
            db.collection('fidelidade').doc(userId).set({
                dataInicio: startDate,
                userId: userId
            }).then(() => {
                form.reset();
                console.log('✅ DISCIPLINE PROTOCOL INITIATED');
            });
        }
    });

    // Botão de violação de protocolo
    breachButton.addEventListener('click', function() {
        console.log('💔 PROTOCOL BREACH DETECTED');
        
        // Mostrar alerta de violação
        overlay.classList.remove('hidden');
        
        // Deletar dados do protocolo
        db.collection('fidelidade').doc(userId).delete()
            .then(() => {
                console.log('🔄 PROTOCOL RESET - BREACH RECORDED');
            })
            .catch(error => {
                console.error('❌ PROTOCOL RESET ERROR:', error);
            });
    });

    // Fechar overlay
    document.getElementById('fecharOverlay').addEventListener('click', function() {
        overlay.classList.add('hidden');
        console.log('👌 BREACH ACKNOWLEDGED');
    });

    // Atualizar contador a cada minuto
    if (fidelidadeInterval) {
        clearInterval(fidelidadeInterval);
    }
    
    fidelidadeInterval = setInterval(() => {
        // Recarregar dados para atualizar em tempo real
        db.collection('fidelidade').doc(userId).get().then(doc => {
            if (doc.exists && doc.data().dataInicio) {
                const startDate = doc.data().dataInicio.toDate();
                calculateAndUpdateDiscipline(startDate);
            }
        });
    }, 60000);
}

// ==================== FUNÇÕES UTILITÁRIAS ====================
function atualizarStardate() {
    const now = new Date();
    const stardate = 96875.3 + (now.getTime() / 86400000 - 19307) * 0.1;
    const stardateElement = document.querySelector('.star-date');
    if (stardateElement) {
        stardateElement.textContent = `STARDATE ${stardate.toFixed(1)}`;
    }
}

function addLogoutButton() {
    const logoutBtn = document.createElement('button');
    logoutBtn.textContent = '🚪 LOGOUT';
    logoutBtn.className = 'logout-button';
    logoutBtn.addEventListener('click', function() {
        if (confirm('🚨 CONFIRM LOGOUT FROM STELLAR ARCHIVE?')) {
            auth.signOut().then(() => {
                console.log('👋 COMMANDER LOGGED OUT');
                showLoginScreen();
            });
        }
    });
    
    // Adicionar ao header
    const header = document.querySelector('.header');
    if (header) {
        header.appendChild(logoutBtn);
    }
}

// ==================== TRATAMENTO DE ERROS GLOBAIS ====================
window.addEventListener('error', function(e) {
    console.error('🚨 SYSTEM ERROR DETECTED:', e.error);
});

console.log('🌟 STELLAR ARCHIVE SECURITY SYSTEM READY');
