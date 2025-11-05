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

// ==================== INICIALIZAÇÃO PRINCIPAL ====================
document.addEventListener('DOMContentLoaded', function() {
    console.log('🖥️ STELLAR ARCHIVE - SYSTEM BOOTING...');
    
    // SEMPRE começar com a tela de login visível
    showLoginScreen();
    
    // Configurar o formulário de login
    setupLoginSystem();
    
    // Verificar se já existe uma sessão ativa
    checkExistingSession();
});

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

// ==================== VERIFICAÇÃO DE SESSÃO ====================
function checkExistingSession() {
    auth.onAuthStateChanged(function(user) {
        if (user) {
            // Usuário JÁ ESTAVA logado (sessão anterior)
            console.log('🔐 EXISTING SESSION FOUND:', user.uid);
            userId = user.uid;
            proceedToWelcome();
        } else {
            // Nenhum usuário logado - manter na tela de login
            console.log('⚠️ NO ACTIVE SESSION - AWAITING LOGIN');
            // Já estamos na tela de login, não precisa fazer nada
        }
    });
}

// ==================== SISTEMA DE LOGIN ====================
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
            console.log('✅ LOGIN SUCCESSFUL:', userCredential.user.uid);
            
            // Login bem-sucedido
            userId = userCredential.user.uid;
            proceedToWelcome();
            
        } catch (error) {
            console.error('❌ LOGIN FAILED:', error);
            
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
        
        loginForm.style.animation = 'errorShake 0.5s ease-in-out';
        setTimeout(() => {
            loginForm.style.animation = '';
        }, 500);
    }
}

// ==================== FLUXO APÓS LOGIN ====================
function proceedToWelcome() {
    console.log('🚀 PROCEEDING TO WELCOME MESSAGE');
    showWelcomeMessage();
    
    // Após 3 segundos, ir para o dashboard
    setTimeout(() => {
        showDashboard();
        initializeDashboard();
    }, 3000);
}

// ==================== INICIALIZAÇÃO DO DASHBOARD ====================
function initializeDashboard() {
    console.log('🎯 INITIALIZING DASHBOARD SYSTEMS...');
    
    // Atualizar data no rodapé
    document.getElementById('dataAtual').textContent = new Date().toLocaleDateString('pt-BR');
    
    // Atualizar stardate
    updateStardate();
    setInterval(updateStardate, 60000);

    // Inicializar navegação
    initializeNavigation();
    
    // Inicializar sistemas
    initializeFinancialSystems();
    initializeLibraryDatabase();
    initializeDisciplineProtocol();
    
    // Adicionar botão de logout
    addLogoutButton();
}

function updateStardate() {
    const now = new Date();
    const stardate = 96875.3 + (now.getTime() / 86400000 - 19307) * 0.1;
    const stardateElement = document.querySelector('.star-date');
    if (stardateElement) {
        stardateElement.textContent = `STARDATE ${stardate.toFixed(1)}`;
    }
}

function initializeNavigation() {
    document.querySelectorAll('.nav-item').forEach(item => {
        item.addEventListener('click', function() {
            const targetSection = this.getAttribute('data-aba');
            
            document.querySelectorAll('.nav-item').forEach(nav => {
                nav.classList.remove('active');
            });
            this.classList.add('active');
            
            document.querySelectorAll('.content-section').forEach(section => {
                section.classList.remove('active');
            });
            document.getElementById(targetSection).classList.add('active');
            
            console.log(`🔀 NAVIGATING TO: ${targetSection.toUpperCase()}`);
        });
    });
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
    
    const header = document.querySelector('.header');
    if (header) {
        header.appendChild(logoutBtn);
    }
}

// ==================== SISTEMA FINANCEIRO ====================
function initializeFinancialSystems() {
    const form = document.getElementById('formTransacao');
    const transactionList = document.getElementById('listaTransacoes');
    
    if (!form || !transactionList) return;
    
    db.collection('transacoes')
        .where('userId', '==', userId)
        .orderBy('data', 'desc')
        .onSnapshot(snapshot => {
            console.log(`💰 LOADED ${snapshot.size} TRANSACTIONS`);
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

                listItem.querySelector('.botao-excluir').addEventListener('click', function() {
                    if (confirm('🚨 CONFIRM TRANSACTION DELETION?')) {
                        db.collection('transacoes').doc(this.getAttribute('data-id')).delete();
                    }
                });
            });

            updateFinancialSummary(totalIncome, totalExpenses);
        });

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
                console.log('✅ TRANSACTION ADDED');
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

// ==================== SISTEMA DE BIBLIOTECA ====================
function initializeLibraryDatabase() {
    const form = document.getElementById('formLivro');
    const bookList = document.getElementById('listaLivros');
    
    if (!form || !bookList) return;
    
    db.collection('livros')
        .where('userId', '==', userId)
        .orderBy('dataAdicionado', 'desc')
        .onSnapshot(snapshot => {
            console.log(`📚 LOADED ${snapshot.size} BOOKS`);
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

                listItem.querySelectorAll('.botao-progresso').forEach(button => {
                    button.addEventListener('click', function() {
                        const action = parseInt(this.getAttribute('data-action'));
                        const newPages = Math.max(0, pagesRead + action);
                        updateBookProgress(doc.id, Math.min(newPages, totalPages), totalPages);
                    });
                });

                listItem.querySelector('.botao-remover').addEventListener('click', function() {
                    if (confirm('🚨 CONFIRM BOOK DELETION?')) {
                        db.collection('livros').doc(doc.id).delete();
                    }
                });
            });
        });

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
                console.log('✅ BOOK ADDED');
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
    } catch (error) {
        console.error('❌ UPDATE ERROR:', error);
    }
}

// ==================== SISTEMA DE DISCIPLINA ====================
function initializeDisciplineProtocol() {
    const form = document.getElementById('formAbstinencia');
    const breachButton = document.getElementById('botaoRecaida');
    const overlay = document.getElementById('overlayRecaida');
    
    if (!form || !breachButton || !overlay) return;
    
    const encouragementMessages = [
        "🎯 YOU ARE STRONGER THAN YOU THINK!",
        "💪 EACH DAY IS A VICTORY!",
        "🚀 CONTINUE FIRMLY ON YOUR MISSION!",
        "🌟 YOUR HEALTH THANKS YOU EVERY MINUTE!",
        "🔥 YOU ARE WRITING YOUR SUCCESS STORY!",
        "🎯 REMEMBER YOUR FINAL OBJECTIVE!"
    ];

    db.collection('fidelidade').doc(userId).onSnapshot(doc => {
        if (doc.exists && doc.data().dataInicio) {
            const data = doc.data();
            const startDate = data.dataInicio.toDate();
            
            calculateAndUpdateDiscipline(startDate);
            
            document.getElementById('formContainerFidelidade').style.display = 'none';
            breachButton.classList.remove('hidden');
            
        } else {
            document.getElementById('formContainerFidelidade').style.display = 'block';
            breachButton.classList.add('hidden');
            resetDisciplineDisplay();
        }
    });

    function calculateAndUpdateDiscipline(startDate) {
        const today = new Date();
        const differenceMs = today - startDate;
        const days = Math.floor(differenceMs / (1000 * 60 * 60 * 24));
        
        document.getElementById('diasFidelidade').textContent = `${days} SOLAR DAYS`;
        
        const progress = Math.min(100, (days / 60) * 100);
        document.getElementById('fidelidadeBarra').style.width = `${progress}%`;
        document.getElementById('progressoLabel').textContent = `🚀 ${days} / 60 SOLAR DAYS`;
        
        const messageIndex = days % encouragementMessages.length;
        document.getElementById('incentivoMensagem').textContent = encouragementMessages[messageIndex];
    }

    function resetDisciplineDisplay() {
        document.getElementById('diasFidelidade').textContent = '0 SOLAR DAYS';
        document.getElementById('incentivoMensagem').textContent = '🎯 INITIATE PROTOCOL TO BEGIN MISSION';
        document.getElementById('fidelidadeBarra').style.width = '0%';
        document.getElementById('progressoLabel').textContent = '🚀 0 / 60 SOLAR DAYS';
    }

    form.addEventListener('submit', function(e) {
        e.preventDefault();
        
        const dateInput = document.getElementById('dataInicio').value;
        if (dateInput) {
            const startDate = new Date(dateInput);
            
            if (startDate > new Date()) {
                alert('⚠️ PLEASE SELECT A DATE IN THE PAST!');
                return;
            }
            
            db.collection('fidelidade').doc(userId).set({
                dataInicio: startDate,
                userId: userId
            }).then(() => {
                form.reset();
            });
        }
    });

    breachButton.addEventListener('click', function() {
        overlay.classList.remove('hidden');
        db.collection('fidelidade').doc(userId).delete();
    });

    document.getElementById('fecharOverlay').addEventListener('click', function() {
        overlay.classList.add('hidden');
    });

    if (fidelidadeInterval) {
        clearInterval(fidelidadeInterval);
    }
    
    fidelidadeInterval = setInterval(() => {
        db.collection('fidelidade').doc(userId).get().then(doc => {
            if (doc.exists && doc.data().dataInicio) {
                const startDate = doc.data().dataInicio.toDate();
                calculateAndUpdateDiscipline(startDate);
            }
        });
    }, 60000);
}

console.log('🌟 STELLAR ARCHIVE SYSTEM READY - AWAITING COMMANDER');
