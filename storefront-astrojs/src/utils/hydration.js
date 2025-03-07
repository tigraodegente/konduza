/**
 * Utilitário de hidratação de componentes
 * 
 * Este módulo gerencia a hidratação de diferentes tipos de componentes
 * (React, Svelte, Web Components) a partir de definições JSON.
 * Suporta carregamento dinâmico, cache e fallbacks.
 */

// Cache de componentes
const componentCache = new Map();

// Registro de componentes
const components = {
  react: new Map(),
  svelte: new Map()
};

// Configuração 
const config = {
  debug: true,
  enableFallbacks: true,
  svelteFallbackComponent: 'BaseComponent'
};

/**
 * Função de log com suporte a níveis
 */
function log(level, message, ...args) {
  if (!config.debug && level === 'debug') return;
  
  const prefix = `[Hydration]`;
  switch (level) {
    case 'debug':
      console.debug(`${prefix} 🔍 ${message}`, ...args);
      break;
    case 'info':
      console.log(`${prefix} ℹ️ ${message}`, ...args);
      break;
    case 'warn':
      console.warn(`${prefix} ⚠️ ${message}`, ...args);
      break;
    case 'error':
      console.error(`${prefix} ❌ ${message}`, ...args);
      break;
  }
}

/**
 * Registra um componente React
 * @param {string} name Nome do componente
 * @param {Function} importFn Função para importar o componente
 */
export function registerReactComponent(name, importFn) {
  components.react.set(name, importFn);
  log('debug', `Componente React registrado: ${name}`);
}

/**
 * Registra um componente Svelte
 * @param {string} name Nome do componente
 * @param {Function} importFn Função para importar o componente
 */
export function registerSvelteComponent(name, importFn) {
  components.svelte.set(name, importFn);
  log('debug', `Componente Svelte registrado: ${name}`);
}

/**
 * Hidrata um componente React
 * @param {string} containerId ID do container
 * @returns {Promise<void>}
 */
export async function hydrateReactComponent(containerId) {
  const startTime = performance.now();
  log('info', `Hidratando componente React: ${containerId}`);
  
  // Obter elemento container
  const container = document.getElementById(containerId);
  if (!container) {
    log('error', `Container não encontrado: ${containerId}`);
    return;
  }
  
  // Extrair informações do componente
  const componentName = container.dataset.component;
  const props = JSON.parse(container.dataset.props || '{}');
  
  // Adicionar ID do componente aos props
  props.componentId = containerId;
  
  try {
    // Marcar o container
    container.dataset.hydrating = 'true';
    
    // Importar React
    const React = await import('react');
    
    // Tentar obter do cache
    const cacheKey = `react_${componentName}`;
    let Component;
    
    if (componentCache.has(cacheKey)) {
      log('debug', `Usando componente React em cache: ${componentName}`);
      Component = componentCache.get(cacheKey);
    } else {
      // Tentar carregar de diferentes fontes
      try {
        // 1. Tentar do registro
        if (components.react.has(componentName)) {
          const module = await components.react.get(componentName)();
          Component = module.default;
        } 
        // 2. Tentar carregamento por convenção
        else {
          const module = await import(`../components/react/${componentName}.jsx`);
          Component = module.default;
          
          // Registrar para uso futuro
          registerReactComponent(componentName, () => 
            import(`../components/react/${componentName}.jsx`)
          );
        }
        
        // Adicionar ao cache
        componentCache.set(cacheKey, Component);
      } catch (importError) {
        log('error', `Erro ao importar componente React: ${componentName}`, importError);
        
        if (!config.enableFallbacks) {
          throw importError;
        }
        
        // Tentar fallback para componente genérico
        log('warn', `Tentando fallback para GenericComponent`);
        try {
          const module = await import(`../components/react/GenericComponent.jsx`);
          Component = module.default;
          
          // Adicionar tipo ao props
          props.componentType = componentName;
        } catch (fallbackError) {
          log('error', `Fallback falhou para: ${componentName}`, fallbackError);
          throw fallbackError;
        }
      }
    }
    
    // Renderizar com React
    try {
      // Usar createRoot (React 18+) ou render legado
      try {
        const { createRoot } = await import('react-dom/client');
        const root = createRoot(container);
        root.render(React.createElement(Component, props));
      } catch (reactDomError) {
        // Fallback para renderização legada
        const ReactDOM = await import('react-dom');
        ReactDOM.render(React.createElement(Component, props), container);
      }
      
      // Marcar como hidratado
      container.dataset.hydrating = 'false';
      container.dataset.hydrated = 'true';
      
      const endTime = performance.now();
      log('info', `Componente React hidratado em ${(endTime - startTime).toFixed(2)}ms: ${componentName}`);
    } catch (renderError) {
      log('error', `Erro ao renderizar componente React: ${componentName}`, renderError);
      container.dataset.hydrating = 'false';
      container.dataset.error = 'true';
      throw renderError;
    }
  } catch (error) {
    // Adicionar mensagem de erro no DOM para depuração
    container.dataset.hydrating = 'false';
    container.dataset.error = 'true';
    
    if (config.debug) {
      showErrorInContainer(container, error);
    }
    
    log('error', `Falha ao hidratar componente React: ${componentName}`, error);
  }
}

/**
 * Hidrata um componente Svelte
 * @param {string} containerId ID do container
 * @returns {Promise<void>}
 */
export async function hydrateSvelteComponent(containerId) {
  const startTime = performance.now();
  log('info', `Hidratando componente Svelte: ${containerId}`);
  
  // Obter elemento container
  const container = document.getElementById(containerId);
  if (!container) {
    log('error', `Container não encontrado: ${containerId}`);
    return;
  }
  
  // Extrair informações do componente
  const componentName = container.dataset.component;
  const props = JSON.parse(container.dataset.props || '{}');
  
  // Adicionar ID do componente aos props
  props.componentId = containerId;
  
  try {
    // Marcar o container
    container.dataset.hydrating = 'true';
    
    // Tentar obter do cache
    const cacheKey = `svelte_${componentName}`;
    let Component;
    
    if (componentCache.has(cacheKey)) {
      log('debug', `Usando componente Svelte em cache: ${componentName}`);
      Component = componentCache.get(cacheKey);
    } else {
      // Tentar carregar de diferentes fontes
      try {
        // 1. Tentar do registro
        if (components.svelte.has(componentName)) {
          const module = await components.svelte.get(componentName)();
          Component = module.default;
        } 
        // 2. Tentar carregamento por convenção
        else {
          const module = await import(`../components/svelte/${componentName}.svelte`);
          Component = module.default;
          
          // Registrar para uso futuro
          registerSvelteComponent(componentName, () => 
            import(`../components/svelte/${componentName}.svelte`)
          );
        }
        
        // Adicionar ao cache
        componentCache.set(cacheKey, Component);
      } catch (importError) {
        log('warn', `Componente Svelte não encontrado: ${componentName}`, importError);
        
        if (!config.enableFallbacks) {
          throw importError;
        }
        
        // Tentar fallback para BaseComponent
        log('info', `Tentando fallback para ${config.svelteFallbackComponent}`);
        try {
          const module = await import(`../components/svelte/${config.svelteFallbackComponent}.svelte`);
          Component = module.default;
          
          // Adicionar tipo ao props
          props.componentType = componentName;
        } catch (fallbackError) {
          log('error', `Fallback falhou para: ${componentName}`, fallbackError);
          throw fallbackError;
        }
      }
    }
    
    // Renderizar com Svelte
    try {
      // Instanciar o componente
      const instance = new Component({
        target: container,
        props,
        hydrate: true
      });
      
      // Armazenar referência à instância
      container._svelteInstance = instance;
      
      // Marcar como hidratado
      container.dataset.hydrating = 'false';
      container.dataset.hydrated = 'true';
      
      const endTime = performance.now();
      log('info', `Componente Svelte hidratado em ${(endTime - startTime).toFixed(2)}ms: ${componentName}`);
    } catch (renderError) {
      log('error', `Erro ao renderizar componente Svelte: ${componentName}`, renderError);
      container.dataset.hydrating = 'false';
      container.dataset.error = 'true';
      throw renderError;
    }
  } catch (error) {
    // Adicionar mensagem de erro no DOM para depuração
    container.dataset.hydrating = 'false';
    container.dataset.error = 'true';
    
    if (config.debug) {
      showErrorInContainer(container, error);
    }
    
    log('error', `Falha ao hidratar componente Svelte: ${componentName}`, error);
  }
}

/**
 * Mostra um erro no container para depuração
 * @param {HTMLElement} container 
 * @param {Error} error 
 */
function showErrorInContainer(container, error) {
  const errorEl = document.createElement('div');
  errorEl.className = 'hydration-error';
  errorEl.innerHTML = `
    <div style="color: #721c24; background-color: #f8d7da; padding: 10px; margin: 10px 0; border: 1px solid #f5c6cb; border-radius: 4px; font-family: monospace; font-size: 12px;">
      <strong>Erro de hidratação:</strong> ${error.message}
      <pre style="background: rgba(0,0,0,0.05); padding: 10px; margin-top: 10px; overflow: auto; max-height: 200px;">${error.stack}</pre>
    </div>
  `;
  container.appendChild(errorEl);
}

/**
 * Hidrata todos os componentes na página
 * Use esta função para hidratar automaticamente todos os componentes marcados
 */
export function hydrateAllComponents() {
  log('info', 'Hidratando todos os componentes na página');
  
  // Hidratar componentes React
  document.querySelectorAll('[id^="react-component-"]').forEach(container => {
    if (!container.dataset.hydrated && !container.dataset.hydrating) {
      hydrateReactComponent(container.id);
    }
  });
  
  // Hidratar componentes Svelte
  document.querySelectorAll('[id^="svelte-component-"]').forEach(container => {
    if (!container.dataset.hydrated && !container.dataset.hydrating) {
      hydrateSvelteComponent(container.id);
    }
  });
  
  log('info', 'Hidratação inicial completa');
}

// Auto-hidratar componentes quando o DOM estiver pronto
if (typeof document !== 'undefined') {
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', hydrateAllComponents);
  } else {
    hydrateAllComponents();
  }
}