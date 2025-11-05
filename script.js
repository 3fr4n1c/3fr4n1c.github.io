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
    
    // Verificar se já está logado
    checkAuthState();
    
    // Configurar formulário de login
    setupLoginSystem();
});

function checkAuthState() {
    auth.onAuthStateChanged(user => {
        if (user) {
            // Usuário já está logado
            userId = user.uid;
            console.log('🔐 COMMANDER ALREADY LOGGED IN:', userId);
            showWelcomeAndDashboard();
        } else {
            // Mostrar tela de login
            console.log('⚠️ AUTHENTICATION REQUIRED');
            showLoginScreen();
        }
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

function showLoginScreen() {
    document.getElementById('loginScreen').classList.remove('hidden');
    document.getElementById('mainDashboard').classList.add('hidden');
    document.getElementById('welcomeMessage').classList.add('hidden');
}

function showWelcomeAndDashboard() {
    // Mostrar mensagem de boas-vindas
    showWelcomeMessage();
    
    // Depois de 3 segundos, mostrar o dashboard
    setTimeout(() => {
        document.getElementById('loginScreen').classList.add('hidden');
        document.getElementById('welcomeMessage').classList.add('hidden');
        document.getElementById('mainDashboard').classList.remove('hidden');
        
        // Inicializar sistemas do dashboard
        initializeDashboardSystems();
    }, 3000);
}

function showWelcomeMessage() {
    document.getElementById('loginScreen').classList.add('hidden');
    document.getElementById('welcomeMessage').classList.remove('hidden');
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
// [Cole aqui todas as funções do dashboard anterior: 
//  initializeFinancialSystems(), initializeLibraryDatabase(), 
//  initializeDisciplineProtocol(), etc...]

// ==================== FUNÇÕES UTILITÁRIAS ====================
function atualizarStardate() {
    const now = new Date();
    const stardate = 96875.3 + (now.getTime() / 86400000 - 19307) * 0.1;
    document.querySelector('.star-date').textContent = `STARDATE ${stardate.toFixed(1)}`;
}

// ==================== LOGOUT ====================
// Adicione um botão de logout no dashboard se desejar
function addLogoutButton() {
    const logoutBtn = document.createElement('button');
    logoutBtn.textContent = '🚪 LOGOUT';
    logoutBtn.className = 'logout-button';
    logoutBtn.style.background = 'linear-gradient(135deg, #dc2626 0%, #7c2d12 100%)';
    logoutBtn.style.margin = '10px';
    logoutBtn.style.padding = '8px 15px';
    logoutBtn.style.border = '1px solid #dc2626';
    logoutBtn.style.borderRadius = '4px';
    logoutBtn.style.color = 'white';
    logoutBtn.style.cursor = 'pointer';
    logoutBtn.style.fontFamily = "'Orbitron', sans-serif";
    logoutBtn.style.fontSize = '12px';
    
    logoutBtn.addEventListener('click', function() {
        if (confirm('🚨 CONFIRM LOGOUT FROM STELLAR ARCHIVE?')) {
            auth.signOut().then(() => {
                console.log('👋 COMMANDER LOGGED OUT');
                showLoginScreen();
            });
        }
    });
    
    // Adicionar ao header ou onde preferir
    document.querySelector('.header').appendChild(logoutBtn);
}

// ==================== TRATAMENTO DE ERROS GLOBAIS ====================
window.addEventListener('error', function(e) {
    console.error('🚨 SYSTEM ERROR DETECTED:', e.error);
});

console.log('🌟 STELLAR ARCHIVE SECURITY SYSTEM READY');
