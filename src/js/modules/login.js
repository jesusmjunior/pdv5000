// login.js - Formulário de login adaptado para PostgreSQL
document.addEventListener('DOMContentLoaded', () => {
    const form = document.getElementById('loginForm');
    const messageDiv = document.getElementById('loginMessage');
    const loadingElement = document.querySelector('.login-loading');

    // Verificar se já está autenticado
    if (window.auth && window.auth.isAuthenticated()) {
        window.location.href = 'dashboard.html';
    }

    // Processar formulário de login
    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        // Mostrar indicador de carregamento
        if (loadingElement) {
            loadingElement.style.display = 'flex';
        }
        
        const username = document.getElementById('username').value;
        const password = document.getElementById('password').value;

        // Verificar se o auth.js está carregado
        if (!window.auth) {
            showMessage('Sistema não inicializado corretamente', 'error');
            if (loadingElement) loadingElement.style.display = 'none';
            return;
        }

        // Executar login com o novo sistema de autenticação
        const resultado = await auth.login(username, password);
        
        // Ocultar indicador de carregamento
        if (loadingElement) {
            loadingElement.style.display = 'none';
        }
        
        if (resultado.sucesso) {
            showMessage('Login realizado! Redirecionando...', 'success');
            
            // Redirecionamento após login bem-sucedido
            setTimeout(() => {
                window.location.href = 'dashboard.html';
            }, 1000);
        } else {
            showMessage(resultado.mensagem || 'Usuário ou senha incorretos', 'error');
        }
    });

    function showMessage(text, type) {
        messageDiv.textContent = text;
        messageDiv.className = `login-message ${type}`;
        messageDiv.style.display = 'block';
    }
});