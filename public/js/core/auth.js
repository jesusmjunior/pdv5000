// auth.js - Sistema de autenticação para PostgreSQL e Firebase
const auth = (function() {
  // URL da API
  const API_URL = 'https://api.orionpdv.com/api';
  
  // Token e usuário atual
  let currentToken = null;
  let currentUser = null;
  
  // Firebase Auth
  let firebaseAuth = null;
  let firebaseUser = null;
  
  // Opções de configuração
  const config = {
    useFirebase: false
  };
  
  // Carregar dados salvos
  const init = (configOptions = {}) => {
    // Mesclar configurações
    Object.assign(config, configOptions);
    
    // Inicializar Firebase Auth se disponível
    if (config.useFirebase && typeof firebase !== 'undefined' && firebase.auth) {
      firebaseAuth = firebase.auth();
      
      // Configurar callback para mudanças de estado de autenticação
      firebaseAuth.onAuthStateChanged((user) => {
        if (user) {
          // Usuário está logado
          firebaseUser = user;
          // Obter token do Firebase
          user.getIdToken().then((token) => {
            // Verificar token com nosso backend
            verificarTokenFirebase(token);
          });
        } else {
          // Usuário está deslogado
          firebaseUser = null;
          // Se estávamos usando Firebase, fazer logout também no sistema
          if (currentUser && currentUser.provider === 'firebase') {
            logout();
          }
        }
      });
    }
    
    // Carregar dados do localStorage
    currentToken = localStorage.getItem('token');
    
    try {
      const userStr = localStorage.getItem('user');
      if (userStr) {
        currentUser = JSON.parse(userStr);
      }
    } catch (error) {
      console.error('Erro ao carregar dados do usuário:', error);
      // Limpar dados corrompidos
      localStorage.removeItem('user');
      currentUser = null;
    }
    
    return !!currentToken;
  };
  
  // Verificar token do Firebase com o backend
  const verificarTokenFirebase = async (idToken) => {
    try {
      const response = await fetch(`${API_URL}/auth/firebase/verify-token`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ idToken })
      });
      
      const resultado = await response.json();
      
      if (resultado.sucesso && resultado.token && resultado.usuario) {
        // Salvar dados de autenticação
        currentToken = resultado.token;
        currentUser = resultado.usuario;
        
        // Salvar no localStorage
        localStorage.setItem('token', currentToken);
        localStorage.setItem('user', JSON.stringify(currentUser));
        
        // Disparar evento de login
        document.dispatchEvent(new CustomEvent('orion-login', { 
          detail: { provider: 'firebase' } 
        }));
      }
    } catch (error) {
      console.error('Erro ao verificar token do Firebase:', error);
    }
  };
  
  // Login
  const login = async (username, password, useFirebase = config.useFirebase) => {
    try {
      // Se solicitado Firebase e ele estiver disponível
      if (useFirebase && firebaseAuth) {
        try {
          // Tentativa de login com Firebase
          const userCredential = await firebaseAuth.signInWithEmailAndPassword(username, password);
          
          // O restante será tratado pelo callback onAuthStateChanged
          return {
            sucesso: true,
            mensagem: 'Login com Firebase em processamento...',
            // Não retornamos usuário nem token ainda, isso será feito pelo callback
          };
        } catch (fbError) {
          console.error('Erro ao fazer login com Firebase:', fbError);
          return {
            sucesso: false,
            mensagem: fbError.message || 'Erro ao fazer login com Firebase'
          };
        }
      }
      
      // Login tradicional via banco
      const resultado = await window.db.login(username, password);
      
      if (resultado.sucesso && resultado.usuario) {
        // Salvar dados de autenticação
        currentToken = resultado.token;
        currentUser = resultado.usuario;
        
        // Salvar no localStorage
        localStorage.setItem('token', currentToken);
        localStorage.setItem('user', JSON.stringify(currentUser));
        
        // Disparar evento de login
        document.dispatchEvent(new CustomEvent('orion-login', { 
          detail: { provider: 'postgres' } 
        }));
      }
      
      return resultado;
    } catch (error) {
      console.error('Erro no login:', error);
      return {
        sucesso: false,
        mensagem: error.message || 'Erro ao fazer login'
      };
    }
  };
  
  // Registrar com Firebase
  const registrarComFirebase = async (email, password, displayName) => {
    try {
      // Verificar se Firebase está disponível
      if (!config.useFirebase || !firebaseAuth) {
        throw new Error('Firebase não está habilitado ou disponível');
      }
      
      // Criar usuário no Firebase Auth
      const userCredential = await firebaseAuth.createUserWithEmailAndPassword(email, password);
      
      // Atualizar perfil do usuário
      await userCredential.user.updateProfile({
        displayName: displayName
      });
      
      // Notificar backend sobre o novo usuário
      const response = await fetch(`${API_URL}/auth/firebase/register`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ email, displayName })
      });
      
      const resultado = await response.json();
      
      // Login automático será tratado pelo callback onAuthStateChanged
      return {
        sucesso: true,
        mensagem: 'Usuário registrado com sucesso!'
      };
    } catch (error) {
      console.error('Erro ao registrar com Firebase:', error);
      return {
        sucesso: false,
        mensagem: error.message || 'Erro ao registrar usuário'
      };
    }
  };
  
  // Logout
  const logout = async () => {
    // Verificar se é um logout do Firebase
    if (config.useFirebase && firebaseAuth && currentUser && currentUser.provider === 'firebase') {
      try {
        // Logout do Firebase Auth
        await firebaseAuth.signOut();
      } catch (error) {
        console.error('Erro ao fazer logout do Firebase:', error);
      }
    }
    
    // Logout do sistema local
    if (window.db && typeof window.db.logout === 'function') {
      await window.db.logout();
    }
    
    // Limpar dados locais
    currentToken = null;
    currentUser = null;
    
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    
    // Disparar evento de logout
    document.dispatchEvent(new CustomEvent('orion-logout'));
    
    return true;
  };
  
  // Verificar autenticação
  const isAuthenticated = () => {
    return !!currentToken && !!currentUser;
  };
  
  // Verificar permissão
  const hasRole = (role) => {
    if (!currentUser) return false;
    
    // Suportar ambos os formatos de campo para papel do usuário
    const userRole = currentUser.role || currentUser.perfil;
    return userRole === role;
  };
  
  // Obter usuário logado
  const getUsuarioLogado = () => {
    return currentUser;
  };
  
  // Obter usuário do Firebase
  const getFirebaseUser = () => {
    return firebaseUser;
  };
  
  // Obter token
  const getToken = () => {
    return currentToken;
  };
  
  // Verificar se Firebase Auth está disponível
  const isFirebaseAvailable = () => {
    return config.useFirebase && !!firebaseAuth;
  };
  
  // API pública
  return {
    init,
    login,
    logout,
    registrarComFirebase,
    isAuthenticated,
    hasRole,
    getUsuarioLogado,
    getFirebaseUser,
    getToken,
    isFirebaseAvailable
  };
})();

// Inicializar ao carregar
document.addEventListener('DOMContentLoaded', () => {
  // Detectar se Firebase está disponível
  const useFirebase = typeof firebase !== 'undefined' && !!firebase.auth;
  
  // Inicializar com configuração
  auth.init({
    useFirebase: useFirebase
  });
});

// Exportar para uso global
window.auth = auth;