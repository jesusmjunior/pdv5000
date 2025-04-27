const { Pool } = require('pg');
const firebaseConfig = require('../config/firebase');

// Inicializar Firebase Admin
const firebase = firebaseConfig.getAdmin();

// Configuração do banco de dados PostgreSQL
const pool = new Pool({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  port: process.env.DB_PORT,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
});

// Testar conexão ao inicializar
pool.connect((err, client, release) => {
  if (err) {
    console.error('Erro ao conectar ao banco de dados PostgreSQL:', err);
  } else {
    console.log('Conexão com PostgreSQL estabelecida com sucesso!');
    release();
  }
});

// Exporta tanto o pool do PostgreSQL quanto o Firebase admin
module.exports = {
  pool,
  firebase: admin
};