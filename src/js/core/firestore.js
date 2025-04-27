/**
 * firestore.js - Módulo para interação com o Firebase Firestore
 */
const firestoreDB = (function() {
  // Referência ao Firestore
  let db = null;
  
  // Status de inicialização
  let isInitialized = false;
  
  // Configuração
  const config = {
    enableOfflineSupport: true
  };
  
  // Inicialização
  const init = async (options = {}) => {
    // Mesclar opções
    Object.assign(config, options);
    
    try {
      // Verificar se o Firebase está disponível
      if (typeof firebase === 'undefined' || !firebase.firestore) {
        console.warn('Firestore não está disponível');
        return false;
      }
      
      // Inicializar Firestore
      db = firebase.firestore;
      
      // Habilitar persistência offline se solicitado
      if (config.enableOfflineSupport) {
        try {
          await db.enablePersistence({
            synchronizeTabs: true
          });
          console.log('Persistência offline do Firestore habilitada');
        } catch (err) {
          if (err.code === 'failed-precondition') {
            console.warn('Persistência offline falhou: múltiplas abas abertas');
          } else if (err.code === 'unimplemented') {
            console.warn('Persistência offline não está disponível neste navegador');
          } else {
            console.error('Erro ao habilitar persistência offline:', err);
          }
        }
      }
      
      // Marcar como inicializado
      isInitialized = true;
      console.log('Módulo Firestore inicializado com sucesso');
      
      return true;
    } catch (error) {
      console.error('Erro ao inicializar Firestore:', error);
      return false;
    }
  };
  
  // Verificar disponibilidade
  const isAvailable = () => {
    return isInitialized && db !== null;
  };
  
  // CRUD genérico
  
  // Adicionar documento a uma coleção
  const add = async (collection, data) => {
    if (!isAvailable()) {
      throw new Error('Firestore não está disponível');
    }
    
    try {
      // Adicionar timestamp
      const docData = {
        ...data,
        createdAt: firebase.firestore.FieldValue.serverTimestamp(),
        updatedAt: firebase.firestore.FieldValue.serverTimestamp()
      };
      
      // Adicionar documento
      const docRef = await db.collection(collection).add(docData);
      
      // Retornar dados com ID
      return {
        id: docRef.id,
        ...data
      };
    } catch (error) {
      console.error(`Erro ao adicionar documento a ${collection}:`, error);
      throw error;
    }
  };
  
  // Buscar documento por ID
  const get = async (collection, id) => {
    if (!isAvailable()) {
      throw new Error('Firestore não está disponível');
    }
    
    try {
      // Buscar documento
      const docRef = db.collection(collection).doc(id);
      const doc = await docRef.get();
      
      // Verificar se documento existe
      if (!doc.exists) {
        return null;
      }
      
      // Retornar dados com ID
      return {
        id: doc.id,
        ...doc.data()
      };
    } catch (error) {
      console.error(`Erro ao buscar documento em ${collection}:`, error);
      throw error;
    }
  };
  
  // Buscar todos os documentos de uma coleção
  const getAll = async (collection, options = {}) => {
    if (!isAvailable()) {
      throw new Error('Firestore não está disponível');
    }
    
    try {
      // Iniciar referência da coleção
      let query = db.collection(collection);
      
      // Aplicar filtros, se houver
      if (options.where) {
        options.where.forEach(condition => {
          const [field, operator, value] = condition;
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
      
      // Executar consulta
      const snapshot = await query.get();
      
      // Mapear resultados
      return snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
    } catch (error) {
      console.error(`Erro ao buscar documentos em ${collection}:`, error);
      throw error;
    }
  };
  
  // Atualizar documento
  const update = async (collection, id, data) => {
    if (!isAvailable()) {
      throw new Error('Firestore não está disponível');
    }
    
    try {
      // Adicionar timestamp de atualização
      const updateData = {
        ...data,
        updatedAt: firebase.firestore.FieldValue.serverTimestamp()
      };
      
      // Atualizar documento
      await db.collection(collection).doc(id).update(updateData);
      
      // Retornar dados atualizados
      return {
        id,
        ...data
      };
    } catch (error) {
      console.error(`Erro ao atualizar documento em ${collection}:`, error);
      throw error;
    }
  };
  
  // Excluir documento
  const remove = async (collection, id) => {
    if (!isAvailable()) {
      throw new Error('Firestore não está disponível');
    }
    
    try {
      // Excluir documento
      await db.collection(collection).doc(id).delete();
      
      // Retornar ID do documento excluído
      return { id };
    } catch (error) {
      console.error(`Erro ao excluir documento em ${collection}:`, error);
      throw error;
    }
  };
  
  // Ouvir alterações em um documento específico
  const listen = (collection, id, callback) => {
    if (!isAvailable()) {
      throw new Error('Firestore não está disponível');
    }
    
    try {
      // Configurar listener
      const unsubscribe = db.collection(collection).doc(id)
        .onSnapshot((doc) => {
          if (doc.exists) {
            callback({
              id: doc.id,
              ...doc.data()
            });
          } else {
            callback(null);
          }
        }, (error) => {
          console.error(`Erro ao ouvir alterações em ${collection}/${id}:`, error);
        });
      
      // Retornar função para cancelar a inscrição
      return unsubscribe;
    } catch (error) {
      console.error(`Erro ao configurar listener em ${collection}/${id}:`, error);
      throw error;
    }
  };
  
  // Ouvir alterações em uma coleção
  const listenCollection = (collection, options = {}, callback) => {
    if (!isAvailable()) {
      throw new Error('Firestore não está disponível');
    }
    
    try {
      // Iniciar referência da coleção
      let query = db.collection(collection);
      
      // Aplicar filtros, se houver
      if (options.where) {
        options.where.forEach(condition => {
          const [field, operator, value] = condition;
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
      
      // Configurar listener
      const unsubscribe = query.onSnapshot((snapshot) => {
        const docs = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
        
        callback(docs);
      }, (error) => {
        console.error(`Erro ao ouvir alterações em ${collection}:`, error);
      });
      
      // Retornar função para cancelar a inscrição
      return unsubscribe;
    } catch (error) {
      console.error(`Erro ao configurar listener em ${collection}:`, error);
      throw error;
    }
  };
  
  // Funções auxiliares por coleção
  
  // Produtos
  const produtos = {
    getAll: (options) => getAll('produtos', options),
    get: (id) => get('produtos', id),
    add: (data) => add('produtos', data),
    update: (id, data) => update('produtos', id, data),
    remove: (id) => remove('produtos', id),
    listen: (id, callback) => listen('produtos', id, callback),
    listenAll: (options, callback) => listenCollection('produtos', options, callback)
  };
  
  // Clientes
  const clientes = {
    getAll: (options) => getAll('clientes', options),
    get: (id) => get('clientes', id),
    add: (data) => add('clientes', data),
    update: (id, data) => update('clientes', id, data),
    remove: (id) => remove('clientes', id),
    listen: (id, callback) => listen('clientes', id, callback),
    listenAll: (options, callback) => listenCollection('clientes', options, callback)
  };
  
  // Vendas
  const vendas = {
    getAll: (options) => getAll('vendas', options),
    get: (id) => get('vendas', id),
    add: (data) => add('vendas', data),
    update: (id, data) => update('vendas', id, data),
    remove: (id) => remove('vendas', id),
    listen: (id, callback) => listen('vendas', id, callback),
    listenAll: (options, callback) => listenCollection('vendas', options, callback)
  };
  
  // API pública
  return {
    init,
    isAvailable,
    
    // CRUD genérico
    add,
    get,
    getAll,
    update,
    remove,
    listen,
    listenCollection,
    
    // Coleções específicas
    produtos,
    clientes,
    vendas
  };
})();

// Exportar para escopo global
window.firestoreDB = firestoreDB;

// Inicializar quando Firebase estiver disponível
document.addEventListener('firebase-loaded', () => {
  firestoreDB.init();
});