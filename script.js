// ==================== CONFIGURAÇÃO FIREBASE ====================
const firebaseConfig = {
    apiKey: "AIzaSyCVbVp_yB2c2DoP96u7e_28stu6b0GkycI",
    authDomain: "dashboard-pessoal-ed6d1.firebaseapp.com",
    projectId: "dashboard-pessoal-ed6d1", 
    storageBucket: "dashboard-pessoal-ed6d1.firebasestorage.app",
    messagingSenderId: "298094497295",
    appId: "1:298094497295:web:21c80fbd60ec19c8bf9d7a"
};

firebase.initializeApp(firebaseConfig);
const db = firebase.firestore();
const auth = firebase.auth();

let userId = null;
let fidelidadeInterval = null;

// ==================== QUANDO A PÁGINA CARREGAR ====================
document.addEventListener('DOMContentLoaded', function() {
    console.log('🖥️ DASHBOARD ANOS 2000 INICIANDO...');
    
    // Data atual no rodapé
    document.getElementById('dataAtual').textContent = new Date().toLocaleDateString('pt-BR');

    // ==================== NAVEGAÇÃO ENTRE ABAS ====================
    document.querySelectorAll('.aba-botao').forEach(botao => {
        botao.addEventListener('click', function() {
            const abaAlvo = this.getAttribute('data-aba');
            
            // Atualizar botões ativos
            document.querySelectorAll('.aba-botao').forEach(b => {
                b.classList.remove('active');
            });
            this.classList.add('active');
            
            // Mostrar/ocultar seções
            document.querySelectorAll('.content-section').forEach(secao => {
                secao.style.display = 'none';
            });
            document.getElementById(abaAlvo).style.display = 'block';
        });
    });

    // ==================== INICIAR AUTENTICAÇÃO ====================
    auth.signInAnonymously()
        .then(() => {
            console.log('🔐 LOGIN ANÔNIMO REALIZADO COM SUCESSO');
        })
        .catch(erro => {
            console.error('❌ ERRO NO LOGIN:', erro);
        });

    // Observar mudanças de autenticação
    auth.onAuthStateChanged(usuario => {
        if (usuario) {
            userId = usuario.uid;
            console.log('👤 USUÁRIO ID:', userId);
            iniciarAplicacao();
        } else {
            console.log('⚠️ NENHUM USUÁRIO LOGADO');
        }
    });

    function iniciarAplicacao() {
        iniciarFinancas();
        iniciarLeituras();
        iniciarFidelidade();
    }

    // ==================== SISTEMA DE FINANÇAS ====================
    function iniciarFinancas() {
        const formulario = document.getElementById('formTransacao');
        const lista = document.getElementById('listaTransacoes');
        
        // CARREGAR TRANSAÇÕES EM TEMPO REAL
        db.collection('transacoes')
            .where('userId', '==', userId)
            .orderBy('data', 'desc')
            .onSnapshot(snapshot => {
                console.log(`💰 ${snapshot.size} TRANSAÇÕES CARREGADAS`);
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
                            <button class="botao-excluir" data-id="${doc.id}">🗑️ EXCLUIR</button>
                        </div>
                    `;
                    lista.appendChild(item);

                    // Evento para excluir transação
                    item.querySelector('.botao-excluir').addEventListener('click', function() {
                        if (confirm('🗑️ TEM CERTEZA QUE QUER EXCLUIR ESTA TRANSAÇÃO?')) {
                            db.collection('transacoes').doc(this.getAttribute('data-id')).delete();
                        }
                    });
                });

                // ATUALIZAR RESUMO FINANCEIRO
                document.getElementById('totalReceita').textContent = `R$ ${totalReceita.toFixed(2)}`;
                document.getElementById('totalDespesa').textContent = `R$ ${totalDespesa.toFixed(2)}`;
                document.getElementById('saldoAtual').textContent = `R$ ${(totalReceita - totalDespesa).toFixed(2)}`;
            });

        // ADICIONAR NOVA TRANSAÇÃO
        formulario.addEventListener('submit', function(e) {
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
                    formulario.reset();
                    console.log('✅ TRANSAÇÃO ADICIONADA COM SUCESSO!');
                });
            }
        });
    }

    // ==================== SISTEMA DE LEITURAS ====================
    function iniciarLeituras() {
        const formulario = document.getElementById('formLivro');
        const lista = document.getElementById('listaLivros');
        
        // CARREGAR LIVROS EM TEMPO REAL
        db.collection('livros')
            .where('userId', '==', userId)
            .orderBy('dataAdicionado', 'desc')
            .onSnapshot(snapshot => {
                console.log(`📚 ${snapshot.size} LIVROS CARREGADOS`);
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
                            <h4>${livro.titulo} <small>por ${livro.autor}</small></h4>
                            <button class="botao-remover" data-id="${doc.id}">🗑️ REMOVER</button>
                        </div>
                        <p>📖 PROGRESSO: ${lidas} / ${total} PÁGINAS (${Math.round(percentual)}%)</p>
                        <div class="progresso-bar">
                            <div class="progresso-fill" style="width: ${percentual}%"></div>
                        </div>
                        <div class="controles-livro">
                            <button class="botao-progresso" data-id="${doc.id}" data-acao="1">+1 PÁG</button>
                            <button class="botao-progresso" data-id="${doc.id}" data-acao="5">+5 PÁG</button>
                            <button class="botao-progresso" data-id="${doc.id}" data-acao="10">+10 PÁG</button>
                            <button class="botao-progresso botao-remover-pagina" data-id="${doc.id}" data-acao="-1">-1 PÁG</button>
                        </div>
                    `;
                    lista.appendChild(item);

                    // EVENTOS DOS BOTÕES DE PROGRESSO
                    item.querySelectorAll('.botao-progresso').forEach(botao => {
                        botao.addEventListener('click', function() {
                            const acao = parseInt(this.getAttribute('data-acao'));
                            const novasPaginas = Math.max(0, lidas + acao);
                            db.collection('livros').doc(doc.id).update({
                                paginasLidas: Math.min(novasPaginas, total)
                            });
                        });
                    });

                    // EVENTO REMOVER LIVRO
                    item.querySelector('.botao-remover').addEventListener('click', function() {
                        if (confirm('🗑️ TEM CERTEZA QUE QUER REMOVER ESTE LIVRO?')) {
                            db.collection('livros').doc(doc.id).delete();
                        }
                    });
                });
            });

        // ADICIONAR NOVO LIVRO
        formulario.addEventListener('submit', function(e) {
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
                    paginasLidas: Math.min(lidas, total),
                    dataAdicionado: new Date(),
                    userId: userId
                }).then(() => {
                    formulario.reset();
                    console.log('✅ LIVRO ADICIONADO COM SUCESSO!');
                });
            }
        });
    }

    // ==================== SISTEMA DE FIDELIDADE ====================
    function iniciarFidelidade() {
        const formulario = document.getElementById('formAbstinencia');
        const botaoRecaida = document.getElementById('botaoRecaida');
        const overlay = document.getElementById('overlayRecaida');
        
        // MENSAGENS DE INCENTIVO
        const mensagens = [
            "🎯 VOCÊ É MAIS FORTE DO QUE PENSA!",
            "💪 CADA DIA É UMA VITÓRIA!",
            "🚀 CONTINUE FIRME NA SUA JORNADA!",
            "🌟 SUA SAÚDE AGRADECE A CADA MINUTO!",
            "🔥 VOCÊ ESTÁ ESCREVENDO SUA HISTÓRIA DE SUCESSO!",
            "🎯 LEMBRE-SE DO SEU OBJETIVO FINAL!"
        ];

        // VERIFICAR SE JÁ TEM DATA SALVA
        db.collection('fidelidade').doc(userId).onSnapshot(doc => {
            if (doc.exists && doc.data().dataInicio) {
                const data = doc.data();
                const dataInicio = data.dataInicio.toDate();
                
                // Calcular dias automaticamente
                calcularEAtualizarFidelidade(dataInicio);
                
                // Esconder formulário, mostrar botão recaída
                document.getElementById('formContainerFidelidade').style.display = 'none';
                botaoRecaida.classList.remove('hidden');
                
                console.log('✅ FIDELIDADE CARREGADA - DATA INICIO:', dataInicio);
                
            } else {
                // Mostrar formulário, esconder botão recaída
                document.getElementById('formContainerFidelidade').style.display = 'block';
                botaoRecaida.classList.add('hidden');
                
                // Resetar display
                document.getElementById('diasFidelidade').textContent = '0 DIAS';
                document.getElementById('incentivoMensagem').textContent = '🎯 DEFINA SUA DATA DE INÍCIO PARA COMEÇAR SUA JORNADA!';
                document.getElementById('fidelidadeBarra').style.width = '0%';
                document.getElementById('progressoLabel').textContent = '🚀 0 / 60 DIAS';
                
                console.log('⚠️ NENHUMA DATA DE FIDELIDADE ENCONTRADA');
            }
        });

        // FUNÇÃO PARA CALCULAR E ATUALIZAR FIDELIDADE
        function calcularEAtualizarFidelidade(dataInicio) {
            const hoje = new Date();
            const diferencaMs = hoje - dataInicio;
            const dias = Math.floor(diferencaMs / (1000 * 60 * 60 * 24));
            
            // Atualizar contador
            document.getElementById('diasFidelidade').textContent = `${dias} DIAS`;
            
            // Atualizar barra de progresso (máximo 60 dias)
            const progresso = Math.min(100, (dias / 60) * 100);
            document.getElementById('fidelidadeBarra').style.width = `${progresso}%`;
            document.getElementById('progressoLabel').textContent = `🚀 ${dias} / 60 DIAS`;
            
            // Atualizar mensagem de incentivo
            const mensagemIndex = dias % mensagens.length;
            document.getElementById('incentivoMensagem').textContent = mensagens[mensagemIndex];
            
            console.log(`📅 FIDELIDADE: ${dias} dias - ${progresso.toFixed(1)}%`);
        }

        // DEFINIR DATA DE INÍCIO
        formulario.addEventListener('submit', function(e) {
            e.preventDefault();
            
            const dataInput = document.getElementById('dataInicio').value;
            if (dataInput) {
                const dataInicio = new Date(dataInput);
                
                // Verificar se a data não é futura
                if (dataInicio > new Date()) {
                    alert('⚠️ POR FAVOR, SELECIONE UMA DATA NO PASSADO!');
                    return;
                }
                
                db.collection('fidelidade').doc(userId).set({
                    dataInicio: dataInicio,
                    userId: userId
                }).then(() => {
                    formulario.reset();
                    console.log('✅ DATA DE FIDELIDADE DEFINIDA COM SUCESSO!');
                });
            }
        });

        // BOTÃO DE RECAÍDA - AGORA FUNCIONANDO!
        botaoRecaida.addEventListener('click', function() {
            console.log('💔 BOTÃO DE RECAÍDA CLICADO');
            
            // Mostrar overlay
            overlay.classList.remove('hidden');
            
            // Deletar dados de fidelidade
            db.collection('fidelidade').doc(userId).delete()
                .then(() => {
                    console.log('🔄 CONTADOR ZERADO - RECAÍDA REGISTRADA');
                })
                .catch(erro => {
                    console.error('❌ ERRO AO REGISTRAR RECAÍDA:', erro);
                });
        });

        // FECHAR OVERLAY
        document.getElementById('fecharOverlay').addEventListener('click', function() {
            overlay.classList.add('hidden');
            console.log('👌 OVERLAY FECHADO');
        });

        // ATUALIZAR CONTADOR A CADA MINUTO
        if (fidelidadeInterval) {
            clearInterval(fidelidadeInterval);
        }
        
        fidelidadeInterval = setInterval(() => {
            // Recarregar dados para atualizar contador em tempo real
            db.collection('fidelidade').doc(userId).get().then(doc => {
                if (doc.exists && doc.data().dataInicio) {
                    const dataInicio = doc.data().dataInicio.toDate();
                    calcularEAtualizarFidelidade(dataInicio);
                }
            });
        }, 60000); // Atualiza a cada minuto
    }
});
