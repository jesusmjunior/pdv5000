/**
 * storage-manager.js - Gerenciador de armazenamento para o sistema
 * Permite escolher entre diferentes opções de armazenamento:
 * - Firebase Firestore
 * - PostgreSQL (via API)
 * - LocalStorage (modo offline)
 */
const storageManager = (function() {
  // Configuração
  let config = {
    preferredStorage: 'local', // 'firebase', 'api' ou 'local'
    useOfflineCache: true, // Usar cache offline para dados
    syncInterval: 5 * 60 * 1000 // 5 minutos em milissegundos
  };
  
  // Cache interno
  const cache = {};
  let syncTimeout = null;
  
  // Status dos serviços
  const serviceStatus = {
    firebase: false,
    api: false,
    local: true // LocalStorage está sempre disponível
  };
  
  // Inicialização
  const init = async (userConfig = {}) => {
    // Mesclar configuração
    config = { ...config, ...userConfig };
    
    // Carregar configuração salva
    try {
      const savedConfig = localStorage.getItem('storage_config');
      if (savedConfig) {
        const parsedConfig = JSON.parse(savedConfig);
        config = { ...config, ...parsedConfig };
      }
    } catch (error) {
      console.error('Erro ao carregar configuração de armazenamento:', error);
    }
    
    // Verificar status dos serviços
    await checkServices();
    
    // Escolher armazenamento com base na disponibilidade
    chooseStorage();
    
    // Configurar sincronização periódica se usar cache offline
    if (config.useOfflineCache) {
      scheduleSyncTimeout();
    }
    
    console.log(`Gerenciador de armazenamento inicializado (usando: ${config.preferredStorage})`);
    return true;
  };
  
  // Verificar disponibilidade dos serviços
  const checkServices = async () => {
    // Verificar Firebase
    serviceStatus.firebase = typeof firebase !== 'undefined' && 
                            firebase.firestore !== undefined;
    
    // Verificar API
    try {
      const response = await fetch('/api/system/status', { 
        method: 'GET',
        timeout: 3000
      });
      serviceStatus.api = response.ok;
    } catch (error) {
      console.warn('API não está disponível:', error);
      serviceStatus.api = false;
    }
    
    return serviceStatus;
  };
  
  // Escolher armazenamento com base na disponibilidade
  const chooseStorage = () => {
    // Se o armazenamento preferido estiver disponível, usá-lo
    if (serviceStatus[config.preferredStorage]) {
      return config.preferredStorage;
    }
    
    // Caso contrário, escolher o melhor disponível na seguinte ordem:
    if (serviceStatus.api) {
      config.preferredStorage = 'api';
    } else if (serviceStatus.firebase) {
      config.preferredStorage = 'firebase';
    } else {
      config.preferredStorage = 'local';
    }
    
    // Salvar configuração
    saveConfig();
    
    return config.preferredStorage;
  };
  
  // Salvar configuração
  const saveConfig = () => {
    try {
      localStorage.setItem('storage_config', JSON.stringify({
        preferredStorage: config.preferredStorage
      }));
    } catch (error) {
      console.error('Erro ao salvar configuração de armazenamento:', error);
    }
  };
  
  // Agendar próxima sincronização
  const scheduleSyncTimeout = () => {
    // Limpar timeout existente
    if (syncTimeout) {
      clearTimeout(syncTimeout);
    }
    
    // Agendar próxima sincronização
    syncTimeout = setTimeout(async () => {
      await syncData();
      scheduleSyncTimeout();
    }, config.syncInterval);
  };
  
  // Sincronizar dados entre armazenamentos
  const syncData = async () => {
    if (!config.useOfflineCache || config.preferredStorage === 'local') {
      return;
    }
    
    console.log('Sincronizando dados...');
    
    try {
      // Implementar lógica de sincronização
      // Por exemplo, enviar dados locais para a nuvem
      
      // Exemplo: sincronizar produtos
      await syncCollection('produtos');
      
      // Exemplo: sincronizar clientes
      await syncCollection('clientes');
      
      console.log('Sincronização concluída com sucesso');
    } catch (error) {
      console.error('Erro durante sincronização:', error);
    }
  };
  
  // Sincronizar uma coleção específica
  const syncCollection = async (collection) => {
    // Implementar lógica específica de sincronização para coleção
    console.log(`Sincronizando coleção ${collection}...`);
    
    // Exemplo básico: pegar dados locais
    const localData = getFromLocalStorage(collection);
    
    if (!localData || !localData.length) {
      return;
    }
    
    // Aqui implementaríamos a lógica de envio para API ou Firebase
    // Depende da implementação específica
  };
  
  // Pegar dados do localStorage
  const getFromLocalStorage = (collection) => {
    try {
      const data = localStorage.getItem(`orion_${collection}`);
      return data ? JSON.parse(data) : null;
    } catch (error) {
      console.error(`Erro ao ler ${collection} do localStorage:`, error);
      return null;
    }
  };
  
  // Salvar dados no localStorage
  const saveToLocalStorage = (collection, data) => {
    try {
      localStorage.setItem(`orion_${collection}`, JSON.stringify(data));
      return true;
    } catch (error) {
      console.error(`Erro ao salvar ${collection} no localStorage:`, error);
      return false;
    }
  };
  
  // CRUD genérico
  
  // Criar item
  const create = async (collection, data) => {
    // Cache local primeiro se configurado
    if (config.useOfflineCache) {
      cacheCreate(collection, data);
    }
    
    // Escolher armazenamento
    switch (config.preferredStorage) {
      case 'firebase':
        return createFirebase(collection, data);
      case 'api':
        return createAPI(collection, data);
      case 'local':
      default:
        return createLocal(collection, data);
    }
  };
  
  // Operações específicas para cada armazenamento
  
  // Firebase
  const createFirebase = async (collection, data) => {
    if (!serviceStatus.firebase) {
      return createLocal(collection, data);
    }
    
    try {
      // Adicionar ao Firestore
      const docRef = await firebase.firestore.collection(collection).add({
        ...data,
        createdAt: new Date(),
        updatedAt: new Date()
      });
      
      // Retornar dados com ID
      return { id: docRef.id, ...data };
    } catch (error) {
      console.error(`Erro ao criar ${collection} no Firebase:`, error);
      
      // Fallback para armazenamento local
      return createLocal(collection, data);
    }
  };
  
  // API
  const createAPI = async (collection, data) => {
    if (!serviceStatus.api) {
      return createLocal(collection, data);
    }
    
    try {
      // Enviar para API
      const response = await fetch(`/api/${collection}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${window.auth.getToken()}`
        },
        body: JSON.stringify(data)
      });
      
      if (!response.ok) {
        throw new Error(`Erro ${response.status} ao criar item via API`);
      }
      
      // Retornar dados da API
      return await response.json();
    } catch (error) {
      console.error(`Erro ao criar ${collection} via API:`, error);
      
      // Fallback para armazenamento local
      return createLocal(collection, data);
    }
  };
  
  // Local
  const createLocal = async (collection, data) => {
    // Se o db existe, usar sua API
    if (window.db && typeof window.db.create === 'function') {
      return window.db.create(collection, data);
    }
    
    // Caso contrário, implementação própria
    try {
      // Carregar dados existentes
      let items = getFromLocalStorage(collection) || [];
      
      // Gerar ID
      const newId = items.length > 0 
        ? Math.max(...items.map(item => item.id)) + 1 
        : 1;
      
      // Adicionar item com data
      const newItem = { 
        ...data, 
        id: newId,
        createdAt: new Date(),
        updatedAt: new Date()
      };
      
      // Adicionar ao array
      items.push(newItem);
      
      // Salvar
      saveToLocalStorage(collection, items);
      
      // Retornar novo item
      return newItem;
    } catch (error) {
      console.error(`Erro ao criar ${collection} localmente:`, error);
      throw error;
    }
  };
  
  // Cache
  const cacheCreate = (collection, data) => {
    try {
      // Inicializar coleção se necessário
      if (!cache[collection]) {
        cache[collection] = [];
      }
      
      // Gerar ID temporário
      const tempId = Date.now();
      
      // Adicionar ao cache com ID temporário
      cache[collection].push({ ...data, id: tempId });
      
      return { ...data, id: tempId };
    } catch (error) {
      console.error(`Erro ao cachear ${collection}:`, error);
    }
  };
  
  // Outros métodos CRUD seriam implementados de maneira similar
  // getAll, getById, update, delete
  
  // Métodos de configuração
  
  // Definir armazenamento preferido
  const setPreferredStorage = (storage) => {
    if (['firebase', 'api', 'local'].includes(storage)) {
      config.preferredStorage = storage;
      saveConfig();
      return true;
    }
    return false;
  };
  
  // Forçar sincronização manual
  const forceSyncData = async () => {
    return await syncData();
  };
  
  // API pública
  return {
    init,
    create,
    // Adicionar outros métodos CRUD
    
    // Configuração
    setPreferredStorage,
    getPreferredStorage: () => config.preferredStorage,
    getServiceStatus: () => ({ ...serviceStatus }),
    forceSyncData
  };
})();

// Exportar para escopo global
window.storageManager = storageManager;

// Inicializar ao carregar a página
document.addEventListener('DOMContentLoaded', () => {
  storageManager.init();
});