// CONFIGURAÇÃO FIREBASE - SIMPLES E DIRETO
const firebaseConfig = {
    apiKey: "AIzaSyCVbVp_yB2c2DoP96u7e_28stu6b0GkycI",
    authDomain: "dashboard-pessoal-ed6d1.firebaseapp.com",
    projectId: "dashboard-pessoal-ed6d1",
    storageBucket: "dashboard-pessoal-ed6d1.firebasestorage.app",
    messagingSenderId: "298094497295",
    appId: "1:298094497295:web:21c80fbd60ec19c8bf9d7a"
};

// INICIALIZAR FIREBASE
firebase.initializeApp(firebaseConfig);
const db = firebase.firestore();
const auth = firebase.auth();

let userId = null;

// QUANDO A PÁGINA CARREGAR
document.addEventListener('DOMContentLoaded', function() {
    console.log('🔥 INICIANDO DASHBOARD...');
    
    // NAVEGAÇÃO ENTRE ABAS
    document.querySelectorAll('.aba-botao').forEach(botao => {
        botao.addEventListener('click', function() {
            const aba = this.getAttribute('data-aba');
            
            // Atualizar botões
            document.querySelectorAll('.aba-botao').forEach(b => b.classList.remove('active'));
            this.classList.add('active');
            
            // Mostrar/ocultar seções
            document.querySelectorAll('.content-section').forEach(sec => {
                sec.style.display = 'none';
            });
            document.getElementById(aba).style.display = 'block';
        });
    });

    // INICIAR AUTENTICAÇÃO
    auth.signInAnonymously()
        .then(() => {
            console.log('✅ Login anônimo feito');
        })
        .catch(error => {
            console.error('❌ Erro no login:', error);
        });

    // OBSERVAR MUDANÇAS DE AUTENTICAÇÃO
    auth.onAuthStateChanged(user => {
        if (user) {
            userId = user.uid;
            console.log('👤 User ID:', userId);
            iniciarTudo();
        } else {
            console.log('❌ Nenhum usuário logado');
        }
    });

    function iniciarTudo() {
        iniciarFinancas();
        iniciarLeituras();
        iniciarFidelidade();
    }

    // ==================== FINANÇAS ====================
    function iniciarFinancas() {
        const form = document.getElementById('formTransacao');
        const lista = document.getElementById('listaTransacoes');
        
        // CARREGAR TRANSAÇÕES
        db.collection('transacoes')
            .where('userId', '==', userId)
            .orderBy('data', 'desc')
            .onSnapshot(snapshot => {
                console.log(`💰 ${snapshot.size} transações carregadas`);
                lista.innerHTML = '';
                let totalReceita = 0;
                let totalDespesa = 0;

                snapshot.forEach(doc => {
                    const transacao = doc.data();
                    const item = document.createElement('li');
                    
                    if (transacao.tipo === 'receita') {
                        item.className = 'receita-item';
                        totalReceita += transacao.valor;
                    } else {
                        item.className = 'despesa-item';
                        totalDespesa += transacao.valor;
                    }

                    item.innerHTML = `
                        <div>${transacao.descricao}</div>
                        <div class="valor-container">
                            <span class="valor-display">${transacao.tipo === 'receita' ? '+' : '-'} R$ ${transacao.valor.toFixed(2)}</span>
                            <button class="botao-excluir" data-id="${doc.id}">🗑️</button>
                        </div>
                    `;
                    lista.appendChild(item);

                    // Botão excluir
                    item.querySelector('.botao-excluir').addEventListener('click', function() {
                        db.collection('transacoes').doc(this.getAttribute('data-id')).delete();
                    });
                });

                // ATUALIZAR TOTAIS
                document.getElementById('totalReceita').textContent = `R$ ${totalReceita.toFixed(2)}`;
                document.getElementById('totalDespesa').textContent = `R$ ${totalDespesa.toFixed(2)}`;
                document.getElementById('saldoAtual').textContent = `R$ ${(totalReceita - totalDespesa).toFixed(2)}`;
            });

        // ADICIONAR TRANSAÇÃO
        form.addEventListener('submit', function(e) {
            e.preventDefault();
            
            const descricao = document.getElementById('descricao').value;
            const valor = parseFloat(document.getElementById('valor').value);
            const tipo = document.getElementById('tipo').value;

            if (descricao && valor > 0) {
                db.collection('transacoes').add({
                    descricao: descricao,
                    valor: valor,
                    tipo: tipo,
                    data: new Date(),
                    userId: userId
                }).then(() => {
                    form.reset();
                    console.log('✅ Transação adicionada');
                });
            }
        });
    }

    // ==================== LEITURAS ====================
    function iniciarLeituras() {
        const form = document.getElementById('formLivro');
        const lista = document.getElementById('listaLivros');
        
        // CARREGAR LIVROS
        db.collection('livros')
            .where('userId', '==', userId)
            .orderBy('dataAdicionado', 'desc')
            .onSnapshot(snapshot => {
                console.log(`📚 ${snapshot.size} livros carregados`);
                lista.innerHTML = '';

                snapshot.forEach(doc => {
                    const livro = doc.data();
                    const lidas = livro.paginasLidas || 0;
                    const total = livro.paginasTotais;
                    const percentual = Math.min(100, (lidas / total) * 100);

                    const item = document.createElement('li');
                    item.className = 'livro-item';
                    item.innerHTML = `
                        <div class="livro-header">
                            <h4>${livro.titulo} <small>(${livro.autor})</small></h4>
                            <button class="botao-remover" data-id="${doc.id}">Remover</button>
                        </div>
                        <p>Progresso: ${lidas} / ${total} páginas (${Math.round(percentual)}%)</p>
                        <div class="progresso-bar">
                            <div class="progresso-fill" style="width: ${percentual}%"></div>
                        </div>
                        <div class="controles-livro">
                            <button class="botao-progresso" data-id="${doc.id}" data-acao="1">+1 Pág</button>
                            <button class="botao-progresso" data-id="${doc.id}" data-acao="5">+5 Pág</button>
                            <button class="botao-progresso" data-id="${doc.id}" data-acao="10">+10 Pág</button>
                            <button class="botao-progresso botao-remover-pagina" data-id="${doc.id}" data-acao="-1">-1 Pág</button>
                        </div>
                    `;
                    lista.appendChild(item);

                    // BOTÕES DE PROGRESSO
                    item.querySelectorAll('.botao-progresso').forEach(botao => {
                        botao.addEventListener('click', function() {
                            const acao = parseInt(this.getAttribute('data-acao'));
                            const novasPaginas = Math.max(0, lidas + acao);
                            db.collection('livros').doc(doc.id).update({
                                paginasLidas: Math.min(novasPaginas, total)
                            });
                        });
                    });

                    // BOTÃO REMOVER
                    item.querySelector('.botao-remover').addEventListener('click', function() {
                        db.collection('livros').doc(doc.id).delete();
                    });
                });
            });

        // ADICIONAR LIVRO
        form.addEventListener('submit', function(e) {
            e.preventDefault();
            
            const titulo = document.getElementById('tituloLivro').value;
            const autor = document.getElementById('autorLivro').value;
            const total = parseInt(document.getElementById('paginasTotais').value);
            const lidas = parseInt(document.getElementById('paginasIniciais').value) || 0;

            if (titulo && autor && total > 0) {
                db.collection('livros').add({
                    titulo: titulo,
                    autor: autor,
                    paginasTotais: total,
                    paginasLidas: lidas,
                    dataAdicionado: new Date(),
                    userId: userId
                }).then(() => {
                    form.reset();
                    console.log('✅ Livro adicionado');
                });
            }
        });
    }

    // ==================== FIDELIDADE ====================
    function iniciarFidelidade() {
        const form = document.getElementById('formAbstinencia');
        const botaoRecaida = document.getElementById('botaoRecaida');
        const overlay = document.getElementById('overlayRecaida');
        
        // VERIFICAR SE JÁ TEM DATA SALVA
        db.collection('fidelidade').doc(userId).onSnapshot(doc => {
            if (doc.exists) {
                const data = doc.data();
                const dataInicio = data.dataInicio.toDate();
                const hoje = new Date();
                const dias = Math.floor((hoje - dataInicio) / (1000 * 60 * 60 * 24));
                
                document.getElementById('diasFidelidade').textContent = `${dias} dias`;
                document.getElementById('fidelidadeBarra').style.width = `${Math.min(100, (dias / 60) * 100)}%`;
                document.getElementById('progressoLabel').textContent = `${dias} / 60 dias`;
                
                // Esconder formulário, mostrar botão recaída
                document.getElementById('formContainerFidelidade').style.display = 'none';
                botaoRecaida.style.display = 'block';
                
            } else {
                // Mostrar formulário, esconder botão recaída
                document.getElementById('formContainerFidelidade').style.display = 'block';
                botaoRecaida.style.display = 'none';
                document.getElementById('diasFidelidade').textContent = '0 dias';
                document.getElementById('fidelidadeBarra').style.width = '0%';
            }
        });

        // DEFINIR DATA DE INÍCIO
        form.addEventListener('submit', function(e) {
            e.preventDefault();
            
            const dataInput = document.getElementById('dataInicio').value;
            if (dataInput) {
                const data = new Date(dataInput);
                db.collection('fidelidade').doc(userId).set({
                    dataInicio: data,
                    userId: userId
                }).then(() => {
                    console.log('✅ Data de início definida');
                });
            }
        });

        // BOTÃO RECAÍDA
        botaoRecaida.addEventListener('click', function() {
            db.collection('fidelidade').doc(userId).delete();
            overlay.classList.remove('hidden');
        });

        // FECHAR OVERLAY
        document.getElementById('fecharOverlay').addEventListener('click', function() {
            overlay.classList.add('hidden');
        });
    }
});
