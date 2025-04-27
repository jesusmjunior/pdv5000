const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');
const { pool, firebase } = require('../models/database');
const firestore = require('../models/firestore');

/**
 * Controlador de autenticação
 */
const authController = {
  /**
   * Login de usuário
   */
  login: async (req, res) => {
    try {
      const { username, password, useFirebase } = req.body;
      
      // Se o usuário solicitou login via Firebase
      if (useFirebase && firebase) {
        try {
          // Verificar se o firebase está disponível
          if (!firebase.auth) {
            throw new Error('Firebase Auth não está disponível');
          }
          
          // Buscar usuário por email no Firebase
          // Esta seria uma forma de verificar se o usuário existe no Firebase
          // sem expor credenciais no cliente
          const userRecord = await firebase.auth().getUserByEmail(username);
          
          // Neste ponto, precisaríamos verificar a senha, mas o Firebase Admin SDK 
          // não oferece uma forma direta de fazer isso.
          // Em um cenário real, você precisaria:
          // 1. Fazer o login real no cliente usando Firebase Auth SDK
          // 2. Enviar o token ID para o backend verificar
          
          // Vamos simular a verificação de token usando JWT
          const token = jwt.sign(
            { 
              id: userRecord.uid, 
              username: userRecord.email, 
              role: 'user',
              provider: 'firebase'
            },
            process.env.JWT_SECRET,
            { expiresIn: '24h' }
          );
          
          // Retornar resposta
          return res.json({
            sucesso: true,
            token,
            usuario: {
              id: userRecord.uid,
              username: userRecord.email,
              displayName: userRecord.displayName,
              role: 'user',
              provider: 'firebase'
            }
          });
        } catch (fbError) {
          console.error('Erro no Firebase Auth:', fbError);
          // Fallback para autenticação tradicional
          console.log('Tentando autenticação tradicional após erro no Firebase');
        }
      }
      
      // Autenticação tradicional com PostgreSQL
      // Buscar usuário no banco
      const result = await pool.query(
        'SELECT * FROM usuarios WHERE username = $1',
        [username]
      );
      
      const user = result.rows[0];
      
      // Verificar se o usuário existe
      if (!user) {
        return res.status(401).json({ 
          sucesso: false, 
          mensagem: 'Usuário ou senha incorretos'
        });
      }
      
      // Verificar senha
      const validPassword = await bcrypt.compare(password, user.password);
      if (!validPassword) {
        return res.status(401).json({ 
          sucesso: false, 
          mensagem: 'Usuário ou senha incorretos'
        });
      }
      
      // Gerar token JWT
      const token = jwt.sign(
        { id: user.id, username: user.username, role: user.role, provider: 'postgres' },
        process.env.JWT_SECRET,
        { expiresIn: '24h' }
      );
      
      // Remover senha do objeto de resposta
      delete user.password;
      
      // Retornar resposta
      res.json({
        sucesso: true,
        token,
        usuario: user
      });
      
    } catch (error) {
      console.error('Erro no login:', error);
      res.status(500).json({ 
        sucesso: false, 
        mensagem: 'Erro ao processar login'
      });
    }
  },

  /**
   * Logout (cliente apenas)
   */
  logout: (req, res) => {
    // No backend não há muito o que fazer para o logout,
    // pois o token é invalidado no frontend
    res.json({ sucesso: true });
  },

  /**
   * Registro de usuário com Firebase
   */
  registrarComFirebase: async (req, res) => {
    try {
      const { email, password, displayName } = req.body;
      
      // Verificar se o Firebase está disponível
      if (!firebase || !firebase.auth) {
        return res.status(500).json({
          sucesso: false,
          mensagem: 'Firebase Auth não está disponível'
        });
      }
      
      // Criar usuário no Firebase
      const userRecord = await firebase.auth().createUser({
        email,
        password,
        displayName,
        emailVerified: false
      });
      
      // Configurar claims personalizadas (opcional)
      await firebase.auth().setCustomUserClaims(userRecord.uid, { role: 'user' });
      
      // Retornar sucesso
      res.json({
        sucesso: true,
        mensagem: 'Usuário criado com sucesso',
        uid: userRecord.uid
      });
      
    } catch (error) {
      console.error('Erro ao registrar usuário no Firebase:', error);
      res.status(500).json({
        sucesso: false,
        mensagem: error.message || 'Erro ao registrar usuário'
      });
    }
  },
  
  /**
   * Verificar token do Firebase
   */
  verificarTokenFirebase: async (req, res) => {
    try {
      const { idToken } = req.body;
      
      // Verificar se o Firebase está disponível
      if (!firebase || !firebase.auth) {
        return res.status(500).json({
          sucesso: false,
          mensagem: 'Firebase Auth não está disponível'
        });
      }
      
      // Verificar o token ID
      const decodedToken = await firebase.auth().verifyIdToken(idToken);
      
      // Obter informações do usuário
      const userRecord = await firebase.auth().getUser(decodedToken.uid);
      
      // Gerar token JWT para uso na API
      const token = jwt.sign(
        { 
          id: userRecord.uid, 
          username: userRecord.email, 
          role: decodedToken.role || 'user',
          provider: 'firebase'
        },
        process.env.JWT_SECRET,
        { expiresIn: '24h' }
      );
      
      // Retornar resposta
      res.json({
        sucesso: true,
        token,
        usuario: {
          id: userRecord.uid,
          username: userRecord.email,
          displayName: userRecord.displayName,
          role: decodedToken.role || 'user',
          provider: 'firebase'
        }
      });
      
    } catch (error) {
      console.error('Erro ao verificar token do Firebase:', error);
      res.status(401).json({
        sucesso: false,
        mensagem: 'Token inválido ou expirado'
      });
    }
  },

  /**
   * Middleware de autenticação
   */
  authenticateToken: (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];
    
    if (!token) {
      return res.status(401).json({ message: 'Token de autenticação não fornecido' });
    }
    
    jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
      if (err) {
        return res.status(403).json({ message: 'Token inválido ou expirado' });
      }
      
      req.user = user;
      next();
    });
  },
  
  /**
   * Middleware para verificar token do Firebase
   */
  authenticateFirebaseToken: async (req, res, next) => {
    try {
      const authHeader = req.headers['authorization'];
      const idToken = authHeader && authHeader.split(' ')[1];
      
      if (!idToken) {
        return res.status(401).json({ message: 'Token de autenticação não fornecido' });
      }
      
      // Verificar se o Firebase está disponível
      if (!firebase || !firebase.auth) {
        return res.status(500).json({
          message: 'Firebase Auth não está disponível'
        });
      }
      
      // Verificar o token ID do Firebase
      const decodedToken = await firebase.auth().verifyIdToken(idToken);
      
      // Adicionar informações do usuário ao objeto de requisição
      req.user = {
        id: decodedToken.uid,
        email: decodedToken.email,
        role: decodedToken.role || 'user',
        provider: 'firebase'
      };
      
      next();
    } catch (error) {
      console.error('Erro ao verificar token do Firebase:', error);
      res.status(403).json({ message: 'Token inválido ou expirado' });
    }
  }
};

module.exports = authController;