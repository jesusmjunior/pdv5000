/**
 * Interface para o Firestore
 */
const firebaseConfig = require('../config/firebase');

// Classe para interagir com o Firestore
class FirestoreDB {
  constructor() {
    this.db = null;
    this.initialize();
  }

  // Inicializa conexão com Firestore
  initialize() {
    this.db = firebaseConfig.getFirestore();
    if (!this.db) {
      console.warn('Firestore não está disponível');
    }
  }

  // Verificar se o Firestore está disponível
  isAvailable() {
    return !!this.db;
  }

  // CRUD genérico para coleções

  // Criar documento
  async create(collection, data, id = null) {
    try {
      if (!this.isAvailable()) {
        throw new Error('Firestore não está disponível');
      }

      const collectionRef = this.db.collection(collection);
      
      // Se ID for fornecido, usar setDoc
      if (id) {
        await collectionRef.doc(id).set({
          ...data,
          createdAt: new Date(),
          updatedAt: new Date()
        });
        return { id, ...data };
      } 
      
      // Caso contrário, deixar o Firestore gerar o ID
      const docRef = await collectionRef.add({
        ...data,
        createdAt: new Date(),
        updatedAt: new Date()
      });
      
      return { id: docRef.id, ...data };
    } catch (error) {
      console.error(`Erro ao criar documento em ${collection}:`, error);
      throw error;
    }
  }

  // Obter documento por ID
  async getById(collection, id) {
    try {
      if (!this.isAvailable()) {
        throw new Error('Firestore não está disponível');
      }

      const docRef = this.db.collection(collection).doc(id);
      const doc = await docRef.get();

      if (!doc.exists) {
        return null;
      }

      return { id: doc.id, ...doc.data() };
    } catch (error) {
      console.error(`Erro ao obter documento ${id} de ${collection}:`, error);
      throw error;
    }
  }

  // Obter todos os documentos de uma coleção
  async getAll(collection, options = {}) {
    try {
      if (!this.isAvailable()) {
        throw new Error('Firestore não está disponível');
      }

      let query = this.db.collection(collection);

      // Aplicar filtros, se houver
      if (options.where) {
        options.where.forEach(filter => {
          const [field, operator, value] = filter;
          query = query.where(field, operator, value);
        });
      }

      // Aplicar ordenação, se houver
      if (options.orderBy) {
        options.orderBy.forEach(order => {
          const [field, direction = 'asc'] = order;
          query = query.orderBy(field, direction);
        });
      }

      // Aplicar limite, se houver
      if (options.limit) {
        query = query.limit(options.limit);
      }

      const snapshot = await query.get();
      return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    } catch (error) {
      console.error(`Erro ao obter documentos de ${collection}:`, error);
      throw error;
    }
  }

  // Atualizar documento
  async update(collection, id, data) {
    try {
      if (!this.isAvailable()) {
        throw new Error('Firestore não está disponível');
      }

      const docRef = this.db.collection(collection).doc(id);
      
      // Verificar se o documento existe
      const doc = await docRef.get();
      if (!doc.exists) {
        throw new Error(`Documento ${id} não encontrado em ${collection}`);
      }
      
      // Atualizar documento
      await docRef.update({
        ...data,
        updatedAt: new Date()
      });
      
      return { id, ...data };
    } catch (error) {
      console.error(`Erro ao atualizar documento ${id} em ${collection}:`, error);
      throw error;
    }
  }

  // Excluir documento
  async delete(collection, id) {
    try {
      if (!this.isAvailable()) {
        throw new Error('Firestore não está disponível');
      }

      const docRef = this.db.collection(collection).doc(id);
      
      // Verificar se o documento existe
      const doc = await docRef.get();
      if (!doc.exists) {
        throw new Error(`Documento ${id} não encontrado em ${collection}`);
      }
      
      // Excluir documento
      await docRef.delete();
      
      return { id };
    } catch (error) {
      console.error(`Erro ao excluir documento ${id} de ${collection}:`, error);
      throw error;
    }
  }

  // Métodos específicos para entidades

  // Produtos
  async getProdutos(options = {}) {
    return this.getAll('produtos', options);
  }

  async getProdutoById(id) {
    return this.getById('produtos', id);
  }

  async createProduto(data) {
    return this.create('produtos', data);
  }

  async updateProduto(id, data) {
    return this.update('produtos', id, data);
  }

  async deleteProduto(id) {
    return this.delete('produtos', id);
  }

  // Clientes
  async getClientes(options = {}) {
    return this.getAll('clientes', options);
  }

  async getClienteById(id) {
    return this.getById('clientes', id);
  }

  async createCliente(data) {
    return this.create('clientes', data);
  }

  async updateCliente(id, data) {
    return this.update('clientes', id, data);
  }

  async deleteCliente(id) {
    return this.delete('clientes', id);
  }

  // Vendas
  async getVendas(options = {}) {
    return this.getAll('vendas', options);
  }

  async getVendaById(id) {
    return this.getById('vendas', id);
  }

  async createVenda(data) {
    return this.create('vendas', data);
  }

  async updateVenda(id, data) {
    return this.update('vendas', id, data);
  }

  async deleteVenda(id) {
    return this.delete('vendas', id);
  }

  // Usuários
  async getUsuarios(options = {}) {
    return this.getAll('usuarios', options);
  }

  async getUsuarioById(id) {
    return this.getById('usuarios', id);
  }

  async createUsuario(data) {
    return this.create('usuarios', data);
  }

  async updateUsuario(id, data) {
    return this.update('usuarios', id, data);
  }

  async deleteUsuario(id) {
    return this.delete('usuarios', id);
  }
}

// Exportar instância única
module.exports = new FirestoreDB();