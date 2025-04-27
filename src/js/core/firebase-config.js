// firebase-config.js - Configuração centralizada do Firebase
(function() {
    // Carregar Firebase de forma modular
    const loadFirebase = async () => {
        try {
            // Importar os módulos do Firebase
            const { initializeApp } = await import("firebase/app");
            const { getAnalytics } = await import("firebase/analytics");
            const { getAuth, onAuthStateChanged } = await import("firebase/auth");
            const { getFirestore } = await import("firebase/firestore");
            
            // Configuração do Firebase
            const firebaseConfig = {
                apiKey: "AIzaSyAnU9Yo3R3G17f8uXWExczIcJ83PsR0ckw",
                authDomain: "pdv1-49dc8.firebaseapp.com",
                projectId: "pdv1-49dc8",
                storageBucket: "pdv1-49dc8.firebasestorage.app",
                messagingSenderId: "765042226958",
                appId: "1:765042226958:web:211035b74ce82e54ba895f",
                measurementId: "G-CX58J861VR"
            };
            
            // Inicializar Firebase
            const app = initializeApp(firebaseConfig);
            const analytics = getAnalytics(app);
            const auth = getAuth(app);
            const db = getFirestore(app);
            
            // Expor para escopo global
            window.firebase = {
                app,
                analytics,
                auth,
                firestore: db
            };
            
            // Configurar listener de estado da autenticação
            onAuthStateChanged(auth, (user) => {
                if (user) {
                    // Usuário está logado - disparar evento
                    document.dispatchEvent(new CustomEvent('firebase-auth-state-changed', { 
                        detail: { user, state: 'signed-in' } 
                    }));
                } else {
                    // Usuário está deslogado - disparar evento
                    document.dispatchEvent(new CustomEvent('firebase-auth-state-changed', { 
                        detail: { user: null, state: 'signed-out' } 
                    }));
                }
            });
            
            // Informar disponibilidade do Firebase
            document.dispatchEvent(new CustomEvent('firebase-loaded'));
            console.log('Firebase inicializado com sucesso');
            
            return window.firebase;
        } catch (error) {
            console.error('Erro ao carregar Firebase:', error);
            return null;
        }
    };
    
    // Carregar Firebase automaticamente ao carregar a página
    document.addEventListener('DOMContentLoaded', () => {
        loadFirebase();
    });
    
    // Expor função de carregamento para uso externo
    window.loadFirebase = loadFirebase;
})();