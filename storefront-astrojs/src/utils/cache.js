/**
 * Sistema de cache para o Konduza
 * 
 * Este módulo fornece funções para armazenar e recuperar dados em cache,
 * melhorando a performance ao evitar requisições repetidas à API.
 */

// Cache em memória
const memoryCache = new Map();

// Configuração do log
const DEBUG = true;

/**
 * Função para exibir logs de depuração
 */
function log(message, ...args) {
  if (DEBUG) {
    console.log(`[Cache] ${message}`, ...args);
  }
}

/**
 * Obtém um item do cache
 * 
 * @param {string} key Chave do item
 * @param {string} domain Domínio para isolar caches entre sites
 * @returns {Promise<any>} Valor do cache ou null se não existir
 */
export async function getFromCache(key, domain) {
  const fullKey = `${domain}:${key}`;
  
  // Tentar cache em memória primeiro
  if (memoryCache.has(fullKey)) {
    const item = memoryCache.get(fullKey);
    
    // Verificar expiração se disponível
    if (item.expiration && item.expiration < Date.now()) {
      log(`Expirado: ${fullKey}`);
      memoryCache.delete(fullKey);
      return null;
    }
    
    log(`Encontrado: ${fullKey}`);
    return item.value || item; // Compatibilidade com formato antigo
  }
  
  log(`Não encontrado: ${fullKey}`);
  return null;
}

/**
 * Define um item no cache
 * 
 * @param {string} key Chave do item
 * @param {any} value Valor a ser armazenado
 * @param {string} domain Domínio para isolar caches entre sites
 * @param {number} ttl Tempo de vida em segundos (padrão: 3600)
 * @returns {Promise<void>}
 */
export async function setInCache(key, value, domain, ttl = 3600) {
  const fullKey = `${domain}:${key}`;
  
  // Armazenar com formato padronizado
  const cacheItem = {
    value,
    expiration: Date.now() + (ttl * 1000)
  };
  
  // Armazenar em memória
  memoryCache.set(fullKey, cacheItem);
  log(`Armazenado: ${fullKey} (expira em ${ttl}s)`);
}

/**
 * Invalida itens do cache que correspondam ao padrão
 * 
 * @param {string} pattern Padrão para invalidar (parte da chave)
 * @param {string} domain Domínio para isolar caches entre sites
 * @returns {Promise<void>}
 */
export async function invalidateCache(pattern, domain) {
  const prefix = domain ? `${domain}:` : '';
  const fullPattern = `${prefix}${pattern}`;
  
  let count = 0;
  
  // Invalidar cache em memória
  for (const key of memoryCache.keys()) {
    if (key.startsWith(prefix) && key.includes(pattern)) {
      memoryCache.delete(key);
      count++;
    }
  }
  
  log(`Invalidados ${count} itens com padrão: ${fullPattern}`);
}

/**
 * Remove um item específico do cache
 * 
 * @param {string} key Chave do item
 * @param {string} domain Domínio para isolar caches entre sites
 * @returns {Promise<boolean>} Verdadeiro se o item foi removido
 */
export async function removeFromCache(key, domain) {
  const fullKey = `${domain}:${key}`;
  
  // Remover do cache em memória
  const removed = memoryCache.delete(fullKey);
  
  if (removed) {
    log(`Removido: ${fullKey}`);
  }
  
  return removed;
}

/**
 * Limpa todo o cache para um domínio específico
 * 
 * @param {string} domain Domínio para limpar
 * @returns {Promise<number>} Número de itens removidos
 */
export async function clearDomainCache(domain) {
  const prefix = `${domain}:`;
  let count = 0;
  
  // Remover itens de memória
  for (const key of memoryCache.keys()) {
    if (key.startsWith(prefix)) {
      memoryCache.delete(key);
      count++;
    }
  }
  
  log(`Limpo cache do domínio ${domain}: ${count} itens removidos`);
  return count;
}

/**
 * Limpa todo o cache
 * 
 * @returns {Promise<number>} Número de itens removidos
 */
export async function clearAllCache() {
  const count = memoryCache.size;
  
  // Limpar cache em memória
  memoryCache.clear();
  
  log(`Limpo todo o cache: ${count} itens removidos`);
  return count;
}