/**
 * Configuração do Firebase Admin SDK
 */
const admin = require('firebase-admin');
const path = require('path');
const fs = require('fs');

// Variável para armazenar instância do Firebase Admin
let firebaseAdmin = null;

/**
 * Inicializa o Firebase Admin SDK
 */
const initializeFirebaseAdmin = () => {
  try {
    // Verificar se já está inicializado
    if (firebaseAdmin) {
      return firebaseAdmin;
    }

    // Caminhos possíveis para o arquivo de credenciais
    const possiblePaths = [
      path.resolve(__dirname, '../../serviceAccountKey.json'),
      path.resolve(process.env.FIREBASE_SERVICE_ACCOUNT_PATH || '')
    ];

    // Encontrar o primeiro caminho válido
    let serviceAccountPath = null;
    for (const p of possiblePaths) {
      if (p && fs.existsSync(p)) {
        serviceAccountPath = p;
        break;
      }
    }

    // Verificar se encontrou um caminho válido
    if (!serviceAccountPath) {
      console.warn('Arquivo de credenciais do Firebase não encontrado');
      return null;
    }

    // Carregar configuração do arquivo de credenciais
    const serviceAccount = require(serviceAccountPath);

    // Inicializar o Firebase Admin
    firebaseAdmin = admin.initializeApp({
      credential: admin.credential.cert(serviceAccount)
    });

    console.log('Firebase Admin SDK inicializado com sucesso');
    return firebaseAdmin;
  } catch (error) {
    console.error('Erro ao inicializar Firebase Admin SDK:', error);
    return null;
  }
};

// Exportar módulo
module.exports = {
  initializeFirebaseAdmin,
  getAdmin: () => firebaseAdmin || initializeFirebaseAdmin(),
  getAuth: () => {
    const app = firebaseAdmin || initializeFirebaseAdmin();
    return app ? app.auth() : null;
  },
  getFirestore: () => {
    const app = firebaseAdmin || initializeFirebaseAdmin();
    return app ? app.firestore() : null;
  }
};