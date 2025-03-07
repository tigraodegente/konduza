/**
 * Motor de renderização dinâmica do Konduza
 * 
 * Este módulo é responsável por renderizar componentes dinâmicos
 * baseados nos temas e dados das páginas.
 * 
 * Recursos suportados:
 * - Resolução dinâmica de componentes de tema
 * - Componentes interativos com hidratação (React e Svelte)
 * - Sistema de slots para composição de componentes
 * - Fallbacks para componentes não encontrados
 * - Sistema de cache para melhor performance
 */

// Configuração do motor
export const engineConfig = {
  debug: true,          // Modo debug com logs detalhados
  enableCache: true,    // Ativar cache de componentes
  defaultTheme: 'default-theme',  // Tema padrão usado em fallbacks
  fallbackComponents: {
    enable: true,       // Permitir uso de componentes de fallback
    react: 'GenericReactComponent',
    svelte: 'BaseComponent'
  },
  hydrationType: {
    // Modo de hidratação padrão por tipo de componente
    default: 'partial', // 'none', 'partial', 'full'
    contentBlock: 'none',
    form: 'full', 
    slider: 'full',
    interactive: 'full'
  }
};

// Cache de componentes
const componentCache = new Map();

/**
 * Função para log com prefixo do motor
 */
function log(level, message, ...args) {
  if (!engineConfig.debug && level === 'debug') return;
  
  const prefix = `[RenderEngine]`;
  const timestamp = new Date().toISOString().split('T')[1].split('.')[0];
  
  switch (level) {
    case 'debug':
      console.debug(`${prefix} 🔍 ${timestamp} ${message}`, ...args);
      break;
    case 'info':
      console.log(`${prefix} ℹ️ ${timestamp} ${message}`, ...args);
      break;
    case 'warn':
      console.warn(`${prefix} ⚠️ ${timestamp} ${message}`, ...args);
      break;
    case 'error':
      console.error(`${prefix} ❌ ${timestamp} ${message}`, ...args);
      break;
  }
}

/**
 * Determina qual componente usar com base em tag e props
 * 
 * @param {string} tagName - Nome da tag/componente
 * @param {object} props - Propriedades do componente
 * @param {string} themeId - ID do tema
 * @param {object} options - Opções adicionais
 * @param {object} options.siteData - Dados do site
 * @param {string} options.hydrationMode - Modo de hidratação (none, partial, full)
 * @param {boolean} options.useCache - Usar cache (padrão: true)
 * @returns {Promise<Object>} - Informações do componente
 */
export async function resolveComponent(tagName, props, themeId, options = {}) {
  const startTime = performance.now();
  log('info', `Resolvendo componente: ${tagName}`);
  
  // Opções padrão
  const {
    siteData = {},
    hydrationMode = null,
    useCache = engineConfig.enableCache
  } = options;
  
  // Gerar uma chave de cache única
  const cacheKey = `${themeId}_${tagName}`;
  
  // Verificar cache
  if (useCache && componentCache.has(cacheKey)) {
    log('debug', `Componente ${tagName} encontrado no cache`);
    return componentCache.get(cacheKey);
  }
  
  try {
    // Normalizar tagName para padrão kebab-case para camelCase
    const normalizedTagName = tagName.replace(/-([a-z])/g, (_, letter) => letter.toUpperCase());
    
    // Determinar tipo de hidratação baseado em configuração ou props
    let componentHydration = hydrationMode || 
                             props.hydration || 
                             engineConfig.hydrationType[tagName] || 
                             engineConfig.hydrationType.default;
                             
    // Forçar componentes marcados como interativos para hidratação completa
    if (props.interactive === true) {
      componentHydration = 'full';
    }
    
    // Resultado com metadados
    const result = {
      tagName,
      normalizedTagName,
      hydration: componentHydration,
      isInteractive: componentHydration !== 'none',
      framework: null, // 'astro', 'react', 'svelte', 'webcomponent'
      Component: null,
      error: null
    };
    
    // Caminho base para os componentes do tema
    const themePath = `/themes/${themeId}/components`;
    
    // Tentar importar o componente seguindo uma ordem de prioridades
    try {
      // 1. Tentar no diretório do tema atual (Astro)
      try {
        const astroPath = `${themePath}/${tagName}.astro`;
        log('debug', `Tentando importar componente Astro do tema: ${astroPath}`);
        const AstroComponent = await import(/* @vite-ignore */ astroPath);
        
        result.Component = AstroComponent.default;
        result.framework = 'astro';
        log('info', `Componente Astro ${tagName} encontrado no tema ${themeId}`);
      } 
      // 2. Se for interativo, tentar React ou Svelte do tema
      catch (astroError) {
        if (result.isInteractive) {
          // 2a. Tentar React
          try {
            const reactPath = `${themePath}/react/${tagName}.jsx`;
            log('debug', `Tentando importar componente React do tema: ${reactPath}`);
            const ReactComponent = await import(/* @vite-ignore */ reactPath);
            
            result.Component = ReactComponent.default;
            result.framework = 'react';
            log('info', `Componente React ${tagName} encontrado no tema ${themeId}`);
          } 
          // 2b. Tentar Svelte
          catch (reactError) {
            try {
              const sveltePath = `${themePath}/svelte/${tagName}.svelte`;
              log('debug', `Tentando importar componente Svelte do tema: ${sveltePath}`);
              const SvelteComponent = await import(/* @vite-ignore */ sveltePath);
              
              result.Component = SvelteComponent.default;
              result.framework = 'svelte';
              log('info', `Componente Svelte ${tagName} encontrado no tema ${themeId}`);
            } catch (svelteError) {
              throw new Error(
                `Componente interativo ${tagName} não encontrado no tema. ` +
                `Erros: Astro: ${astroError.message}, React: ${reactError.message}, Svelte: ${svelteError.message}`
              );
            }
          }
        } else {
          throw astroError; // Re-throw para seguir para próxima tentativa
        }
      }
    } 
    // 3. Se não encontrou no tema, tentar componentes nativos do sistema
    catch (themeError) {
      log('debug', `Componente não encontrado no tema ${themeId}, tentando sistema: ${themeError.message}`);
      
      try {
        // 3a. Verificar no registro de componentes nativos
        log('debug', `Tentando importar componente nativo: ${normalizedTagName}`);
        const systemComponents = {
          // Componentes Astro nativos
          'Hero': () => import('../components/Hero.astro'),
          'FeatureGrid': () => import('../components/FeatureGrid.astro'),
          'ContentBlock': () => import('../components/ContentBlock.astro'),
          'ContactForm': () => import('../components/ContactForm.astro'),
          
          // Componentes interativos
          'PageEditor': { 
            import: () => import('../components/react/PageEditor.jsx'),
            framework: 'react'
          },
          'Slider': { 
            import: () => import('../components/svelte/Slider.svelte'),
            framework: 'svelte'
          }
        };
        
        if (normalizedTagName in systemComponents) {
          // Informações do componente do sistema
          const systemComponent = systemComponents[normalizedTagName];
          
          // Se for apenas uma função, é um componente Astro
          if (typeof systemComponent === 'function') {
            const Component = await systemComponent();
            result.Component = Component.default;
            result.framework = 'astro';
          } 
          // Se for um objeto com metadados, pode ser React ou Svelte
          else {
            const Component = await systemComponent.import();
            result.Component = Component.default;
            result.framework = systemComponent.framework;
          }
          
          log('info', `Componente nativo ${normalizedTagName} encontrado (${result.framework})`);
        } 
        // 4. Fallback para componentes genéricos
        else if (engineConfig.fallbackComponents.enable) {
          if (result.isInteractive) {
            // 4a. Fallback para componente React genérico
            try {
              const reactFallback = '../components/react/' + engineConfig.fallbackComponents.react;
              log('warn', `Tentando fallback React: ${reactFallback}`);
              const ReactFallback = await import(reactFallback);
              
              result.Component = ReactFallback.default;
              result.framework = 'react';
              result.isFallback = true;
              log('warn', `Usando componente React de fallback para ${tagName}`);
            } 
            // 4b. Fallback para componente Svelte genérico
            catch (reactFallbackError) {
              try {
                const svelteFallback = '../components/svelte/' + engineConfig.fallbackComponents.svelte;
                log('warn', `Tentando fallback Svelte: ${svelteFallback}`);
                const SvelteFallback = await import(svelteFallback);
                
                result.Component = SvelteFallback.default;
                result.framework = 'svelte';
                result.isFallback = true;
                log('warn', `Usando componente Svelte de fallback para ${tagName}`);
              } catch (svelteFallbackError) {
                throw new Error(
                  `Não foi possível encontrar componente ${tagName} nem fallbacks. ` +
                  `Erros: React: ${reactFallbackError.message}, Svelte: ${svelteFallbackError.message}`
                );
              }
            }
          } else {
            // 4c. Fallback para mensagem de erro estática
            result.Component = {
              render: () => `<div class="component-error">Componente não encontrado: ${tagName}</div>`
            };
            result.framework = 'static';
            result.isFallback = true;
            result.error = `Componente ${tagName} não encontrado`;
          }
        } else {
          // 5. Não há fallback configurado
          throw new Error(`Componente ${tagName} não encontrado no sistema e fallbacks desativados`);
        }
      } catch (systemError) {
        result.Component = null;
        result.error = systemError.message;
        log('error', `Erro final ao resolver componente: ${systemError.message}`);
      }
    }
    
    // Salvar no cache para uso futuro
    if (useCache && result.Component) {
      componentCache.set(cacheKey, result);
    }
    
    const endTime = performance.now();
    log('debug', `Componente ${tagName} resolvido em ${(endTime - startTime).toFixed(2)}ms [${result.framework}]`);
    
    return result;
  } catch (error) {
    log('error', `Erro crítico ao resolver componente ${tagName}: ${error.message}`);
    console.error(error);
    
    return {
      tagName,
      normalizedTagName: tagName,
      hydration: 'none',
      isInteractive: false,
      framework: 'static',
      Component: {
        render: () => `<div class="component-error">Erro ao resolver componente: ${error.message}</div>`
      },
      error: error.message,
      isFallback: true
    };
  }
}

/**
 * Renderiza uma página com base em seus componentes
 * 
 * @param {object} pageData - Dados da página a renderizar
 * @param {object} siteData - Dados do site
 * @param {object} options - Opções de renderização
 * @param {boolean} options.enableHydration - Ativar hidratação de componentes interativos
 * @param {boolean} options.useCache - Usar cache de componentes
 * @param {string} options.defaultHydrationMode - Modo de hidratação padrão
 * @returns {Promise<Array>} - Array de componentes renderizados
 */
export async function renderPage(pageData, siteData, options = {}) {
  const startTime = performance.now();
  log('info', `Renderizando página: ${pageData.title || 'Sem título'}`);
  
  // Opções padrão
  const {
    enableHydration = true,
    useCache = engineConfig.enableCache,
    defaultHydrationMode = engineConfig.hydrationType.default
  } = options;
  
  // Obter ID do tema
  const themeId = siteData?.theme?.id || siteData?.themeData?.id || engineConfig.defaultTheme;
  
  // Componentes da página
  const components = pageData.components || [];
  
  // Resultado de renderização
  const renderedComponents = [];
  
  // Estatísticas para logging
  const stats = {
    total: components.length,
    rendered: 0,
    frameworks: {
      astro: 0,
      react: 0,
      svelte: 0,
      webcomponent: 0,
      static: 0
    },
    hydrated: 0,
    errors: 0,
    fallbacks: 0
  };
  
  // Renderizar cada componente
  for (const component of components) {
    try {
      const { type, props = {}, children = [], id: componentId = null } = component;
      
      // ID único para o componente
      const uniqueId = componentId || `component-${renderedComponents.length}-${Date.now()}`;
      
      // Determinar modo de hidratação para este componente
      const hydrationMode = enableHydration 
                           ? (props.hydration || defaultHydrationMode)
                           : 'none';
      
      // Resolver o componente com opções
      const resolvedComponent = await resolveComponent(type, props, themeId, {
        siteData,
        hydrationMode,
        useCache
      });
      
      // Se o componente foi resolvido com sucesso
      if (resolvedComponent && resolvedComponent.Component) {
        // Preparar propriedades básicas
        const baseProps = {
          ...props,
          componentId: uniqueId,
          key: uniqueId,
          site: siteData,
          page: pageData
        };
        
        // Adicionar slots para child components, se houver
        if (children && children.length > 0) {
          baseProps.slots = await processSlots(children, themeId, siteData, options);
        }
        
        // Propriedades específicas para fallbacks
        if (resolvedComponent.isFallback) {
          baseProps.componentType = type;
          baseProps.isPlaceholder = true;
          
          if (resolvedComponent.error) {
            baseProps.error = resolvedComponent.error;
          }
          
          stats.fallbacks++;
        }
        
        // Preparar objeto final do componente renderizado
        const renderedComponent = {
          ...resolvedComponent,
          id: uniqueId,
          props: baseProps,
          children
        };
        
        // Adicionar componente ao resultado
        renderedComponents.push(renderedComponent);
        
        // Atualizar estatísticas
        stats.rendered++;
        stats.frameworks[resolvedComponent.framework]++;
        
        if (resolvedComponent.isInteractive) {
          stats.hydrated++;
        }
        
        log('debug', `Componente ${type} resolvido e adicionado [${resolvedComponent.framework}]`);
      } else {
        log('warn', `⚠️ Não foi possível resolver o componente: ${type}`);
        stats.errors++;
        
        // Adicionar um fallback como mensagem de erro (sempre)
        renderedComponents.push({
          id: uniqueId,
          tagName: type,
          framework: 'static',
          isInteractive: false,
          hydration: 'none',
          Component: {
            render: () => `<div class="error-component">
              Componente não encontrado: ${type}
              ${resolvedComponent?.error ? `<small>${resolvedComponent.error}</small>` : ''}
            </div>`
          },
          props: {
            componentId: uniqueId,
            error: resolvedComponent?.error || 'Componente não encontrado'
          },
          children: [],
          isFallback: true,
          error: resolvedComponent?.error || 'Componente não encontrado'
        });
        
        stats.fallbacks++;
      }
    } catch (error) {
      log('error', `❌ Erro ao renderizar componente: ${error.message}`);
      console.error(error);
      stats.errors++;
      
      // Adicionar um fallback como mensagem de erro (sempre)
      renderedComponents.push({
        id: `error-component-${renderedComponents.length}-${Date.now()}`,
        tagName: component.type || 'unknown',
        framework: 'static',
        isInteractive: false,
        hydration: 'none',
        Component: {
          render: () => `<div class="error-component">
            Erro ao renderizar componente: ${error.message}
          </div>`
        },
        props: {
          error: error.message
        },
        children: [],
        isFallback: true,
        error: error.message
      });
      
      stats.fallbacks++;
    }
  }
  
  const endTime = performance.now();
  log('info', `Página "${pageData.title || 'Sem título'}" renderizada em ${(endTime - startTime).toFixed(2)}ms`);
  log('info', `Estatísticas: ${stats.rendered}/${stats.total} componentes, ${stats.hydrated} hidratados, ${stats.fallbacks} fallbacks, ${stats.errors} erros`);
  log('debug', `Componentes por framework: ${JSON.stringify(stats.frameworks)}`);
  
  return renderedComponents;
}

/**
 * Processa slots de componentes (componentes filhos)
 * 
 * @param {Array} children - Definições de componentes filhos
 * @param {string} themeId - ID do tema
 * @param {object} siteData - Dados do site
 * @param {object} options - Opções de renderização
 * @returns {Promise<Object>} - Mapa de slots com componentes renderizados
 */
async function processSlots(children, themeId, siteData, options = {}) {
  // Se não houver filhos, retornar objeto vazio
  if (!children || !children.length) {
    return {};
  }
  
  log('debug', `Processando ${children.length} slots de componente`);
  
  // Resultado: mapa de slots com componentes renderizados
  const slots = {
    default: [] // Slot padrão
  };
  
  // Processar cada componente filho
  for (const child of children) {
    try {
      // Slot especificado ou default
      const slotName = child.slot || 'default';
      
      // Garantir que o slot existe
      if (!slots[slotName]) {
        slots[slotName] = [];
      }
      
      // Renderizar o componente filho com as mesmas opções do pai
      const renderedChild = await renderPage(
        { components: [child] }, // Simular uma página com um componente
        siteData,
        options
      );
      
      // Adicionar o componente renderizado ao slot correspondente
      if (renderedChild && renderedChild.length > 0) {
        slots[slotName].push(...renderedChild);
      }
    } catch (error) {
      log('error', `Erro ao processar slot: ${error.message}`);
    }
  }
  
  return slots;
}

/**
 * Determina qual layout usar para uma página
 * 
 * @param {object} pageData - Dados da página
 * @param {object} siteData - Dados do site
 * @param {object} options - Opções adicionais
 * @param {boolean} options.useCache - Usar cache de layouts
 * @returns {Promise<Object>} - Informações do layout
 */
export async function resolveLayout(pageData, siteData, options = {}) {
  const startTime = performance.now();
  const themeId = siteData?.theme?.id || siteData?.themeData?.id || engineConfig.defaultTheme;
  const layoutName = pageData.layout || 'base';
  
  // Opções padrão
  const { useCache = engineConfig.enableCache } = options;
  
  log('info', `Resolvendo layout: ${layoutName} para o tema ${themeId}`);
  
  // Gerar uma chave de cache única
  const cacheKey = `layout_${themeId}_${layoutName}`;
  
  // Verificar cache
  if (useCache && componentCache.has(cacheKey)) {
    log('debug', `Layout ${layoutName} encontrado no cache`);
    return componentCache.get(cacheKey);
  }
  
  // Resultado com metadados
  const result = {
    name: layoutName,
    themeId,
    framework: 'astro',
    Layout: null,
    error: null,
    isFallback: false
  };
  
  try {
    // Tentativa em cascata para encontrar o layout
    try {
      // 1. Tentar importar o layout específico do tema
      const layoutPath = `/themes/${themeId}/layouts/${layoutName}.astro`;
      log('debug', `Tentando importar layout específico: ${layoutPath}`);
      
      const Layout = await import(/* @vite-ignore */ layoutPath);
      result.Layout = Layout.default;
      log('info', `Layout ${layoutName} encontrado no tema ${themeId}`);
    } catch (themeError) {
      log('debug', `Layout ${layoutName} não encontrado no tema: ${themeError.message}`);
      
      // 2. Se falhar, tentar o layout base padrão do tema
      try {
        const defaultPath = `/themes/${themeId}/layouts/base.astro`;
        log('debug', `Tentando importar layout base: ${defaultPath}`);
        
        const DefaultLayout = await import(/* @vite-ignore */ defaultPath);
        result.Layout = DefaultLayout.default;
        result.isFallback = true;
        result.name = 'base'; // Atualizar para o nome real
        log('info', `Layout base encontrado como fallback no tema ${themeId}`);
      } catch (defaultError) {
        log('debug', `Layout base não encontrado no tema: ${defaultError.message}`);
        
        // 3. Tentar layout do mesmo nome no tema padrão (se não estivermos já no tema padrão)
        if (themeId !== engineConfig.defaultTheme) {
          try {
            const defaultThemePath = `/themes/${engineConfig.defaultTheme}/layouts/${layoutName}.astro`;
            log('debug', `Tentando layout no tema padrão: ${defaultThemePath}`);
            
            const DefaultThemeLayout = await import(/* @vite-ignore */ defaultThemePath);
            result.Layout = DefaultThemeLayout.default;
            result.isFallback = true;
            result.themeId = engineConfig.defaultTheme; // Atualizar para o tema real
            log('info', `Layout ${layoutName} encontrado no tema padrão`);
          } catch (defaultThemeError) {
            log('debug', `Layout ${layoutName} não encontrado no tema padrão: ${defaultThemeError.message}`);
            
            // 4. Tentar base do tema padrão
            try {
              const defaultThemeBasePath = `/themes/${engineConfig.defaultTheme}/layouts/base.astro`;
              log('debug', `Tentando layout base no tema padrão: ${defaultThemeBasePath}`);
              
              const DefaultThemeBaseLayout = await import(/* @vite-ignore */ defaultThemeBasePath);
              result.Layout = DefaultThemeBaseLayout.default;
              result.isFallback = true;
              result.name = 'base';
              result.themeId = engineConfig.defaultTheme;
              log('info', `Layout base encontrado no tema padrão como fallback`);
            } catch (defaultThemeBaseError) {
              // 5. Último recurso: layout do sistema
              try {
                const systemPath = '../layouts/DefaultLayout.astro';
                log('warn', `Tentando importar layout do sistema: ${systemPath}`);
                
                const SystemLayout = await import(/* @vite-ignore */ systemPath);
                result.Layout = SystemLayout.default;
                result.isFallback = true;
                result.name = 'DefaultLayout';
                result.themeId = 'system';
                log('warn', `Layout do sistema encontrado como último recurso`);
              } catch (systemError) {
                throw new Error(
                  `Nenhum layout encontrado: específico (${themeError.message}), ` +
                  `base (${defaultError.message}), tema padrão (${defaultThemeError.message}), ` +
                  `base padrão (${defaultThemeBaseError.message}), sistema (${systemError.message})`
                );
              }
            }
          }
        } else {
          // Já estamos no tema padrão, vá direto para o layout do sistema
          try {
            const systemPath = '../layouts/DefaultLayout.astro';
            log('warn', `Tentando importar layout do sistema: ${systemPath}`);
            
            const SystemLayout = await import(/* @vite-ignore */ systemPath);
            result.Layout = SystemLayout.default;
            result.isFallback = true;
            result.name = 'DefaultLayout';
            result.themeId = 'system';
            log('warn', `Layout do sistema encontrado como último recurso`);
          } catch (systemError) {
            throw new Error(
              `Nenhum layout encontrado: específico (${themeError.message}), ` +
              `base (${defaultError.message}), sistema (${systemError.message})`
            );
          }
        }
      }
    }
    
    // Salvar no cache para uso futuro
    if (useCache && result.Layout) {
      componentCache.set(cacheKey, result);
    }
    
    const endTime = performance.now();
    log('debug', `Layout ${result.name} resolvido em ${(endTime - startTime).toFixed(2)}ms (tema: ${result.themeId})`);
    
    return result;
  } catch (error) {
    log('error', `❌ Erro fatal ao resolver layout: ${error.message}`);
    console.error(error);
    
    // Retornar resultado com erro
    result.error = error.message;
    return result;
  }
}

/**
 * Processa variáveis de template em uma string
 * 
 * @param {string} template - String de template
 * @param {object} data - Dados para substituir
 * @param {object} options - Opções de processamento
 * @param {boolean} options.sanitizeOutput - Sanitizar saída HTML (evita XSS)
 * @param {boolean} options.fallbackToEmpty - Usar string vazia como fallback
 * @param {boolean} options.debugMissingValues - Logar valores ausentes
 * @returns {string} - String processada
 */
export function processTemplate(template, data, options = {}) {
  if (!template || typeof template !== 'string') {
    return '';
  }
  
  // Opções padrão
  const {
    sanitizeOutput = true,
    fallbackToEmpty = true,
    debugMissingValues = engineConfig.debug
  } = options;
  
  // Sanitizador básico para prevenir XSS
  const sanitize = (html) => {
    if (!sanitizeOutput) return html;
    
    if (typeof html === 'string') {
      return html
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#039;');
    }
    
    return html;
  };
  
  try {
    return template.replace(/{{(.*?)}}/g, (match, key) => {
      // Remover espaços em branco
      const trimmedKey = key.trim();
      
      // Suporte a expressões condicionais simples
      if (trimmedKey.startsWith('if ')) {
        // Expressão condicional: {{if condition}}content{{/if}}
        const condition = trimmedKey.substring(3).trim();
        const conditionResult = evaluateCondition(condition, data);
        
        // Extrai o bloco condicional
        const ifRegex = new RegExp(`{{if ${condition}}}([\\s\\S]*?){{/if}}`, 'g');
        const contentMatch = ifRegex.exec(template);
        
        if (contentMatch && contentMatch[1]) {
          // Se a condição for verdadeira, retorna o conteúdo, senão retorna vazio
          return conditionResult ? contentMatch[1] : '';
        }
        
        return '';
      }
      
      // Para slots especiais onde queremos inserir componentes
      if (trimmedKey.startsWith('slot:')) {
        const slotName = trimmedKey.substring(5).trim();
        
        // Verificar se existe um slot com esse nome
        if (data.slots && data.slots[slotName]) {
          // Aqui retornamos uma string especial que será processada pelo renderizador
          // Para substituir pelo componente real
          return `<konduza-slot name="${slotName}"></konduza-slot>`;
        }
        
        if (debugMissingValues) {
          log('debug', `Slot não encontrado: ${slotName}`);
        }
        
        return '';
      }
      
      // Suporte a expressões aninhadas com .
      if (trimmedKey.includes('.')) {
        // Caminho aninhado (ex: "site.name")
        const parts = trimmedKey.split('.');
        let value = data;
        
        for (const part of parts) {
          if (value === undefined || value === null) {
            if (debugMissingValues) {
              log('debug', `Valor ausente para caminho aninhado: ${trimmedKey} (parou em ${part})`);
            }
            return fallbackToEmpty ? '' : match;
          }
          value = value[part];
        }
        
        if (value !== undefined && value !== null) {
          return sanitize(value.toString());
        } else {
          if (debugMissingValues) {
            log('debug', `Valor final ausente para ${trimmedKey}`);
          }
          return fallbackToEmpty ? '' : match;
        }
      } else {
        // Chave simples
        if (data[trimmedKey] !== undefined && data[trimmedKey] !== null) {
          return sanitize(data[trimmedKey].toString());
        } else {
          if (debugMissingValues) {
            log('debug', `Valor ausente para chave simples: ${trimmedKey}`);
          }
          return fallbackToEmpty ? '' : match;
        }
      }
    });
  } catch (error) {
    log('error', `❌ Erro ao processar template: ${error.message}`);
    console.error(error);
    return template;
  }
}

/**
 * Avalia uma condição simples para uso no processador de template
 * 
 * @param {string} condition - Condição a ser avaliada (ex: "user.isAdmin")
 * @param {object} data - Dados para a avaliação
 * @returns {boolean} - Resultado da avaliação
 */
function evaluateCondition(condition, data) {
  try {
    // Suporte para condições de igualdade (value == "something")
    if (condition.includes('==')) {
      const [left, right] = condition.split('==').map(s => s.trim());
      const leftValue = getValueFromPath(left, data);
      
      // Se o valor da direita está entre aspas, é uma string literal
      let rightValue;
      if ((right.startsWith('"') && right.endsWith('"')) || 
          (right.startsWith("'") && right.endsWith("'"))) {
        rightValue = right.substring(1, right.length - 1);
      } else {
        // Senão, é outra referência aos dados
        rightValue = getValueFromPath(right, data);
      }
      
      return leftValue == rightValue; // Comparação não-estrita
    }
    
    // Suporte para condições de não igualdade (value != "something")
    if (condition.includes('!=')) {
      const [left, right] = condition.split('!=').map(s => s.trim());
      const leftValue = getValueFromPath(left, data);
      
      // Se o valor da direita está entre aspas, é uma string literal
      let rightValue;
      if ((right.startsWith('"') && right.endsWith('"')) || 
          (right.startsWith("'") && right.endsWith("'"))) {
        rightValue = right.substring(1, right.length - 1);
      } else {
        // Senão, é outra referência aos dados
        rightValue = getValueFromPath(right, data);
      }
      
      return leftValue != rightValue; // Comparação não-estrita
    }
    
    // Verificação de existência (ex: user.name)
    return !!getValueFromPath(condition, data);
  } catch (error) {
    log('error', `Erro ao avaliar condição [${condition}]: ${error.message}`);
    return false;
  }
}

/**
 * Obtém um valor de um caminho aninhado nos dados
 * 
 * @param {string} path - Caminho para o valor (ex: "user.profile.name")
 * @param {object} data - Dados
 * @returns {any} - Valor encontrado ou undefined
 */
function getValueFromPath(path, data) {
  if (!path) return undefined;
  
  // Se for uma referência direta
  if (!path.includes('.')) {
    return data[path];
  }
  
  // Para caminhos aninhados
  const parts = path.split('.');
  let value = data;
  
  for (const part of parts) {
    if (value === undefined || value === null) {
      return undefined;
    }
    value = value[part];
  }
  
  return value;
}

/**
 * Funções para processamento de conteúdo dinâmico
 */
export const contentProcessors = {
  /**
   * Processa conteúdo markdown em HTML
   * 
   * @param {string} markdown - Texto markdown
   * @param {object} options - Opções de processamento
   * @returns {Promise<string>} - HTML gerado
   */
  async markdown(markdown, options = {}) {
    if (!markdown) return '';
    
    try {
      // Opções padrão
      const {
        sanitize = true,
        gfm = true, // GitHub Flavored Markdown
        breaks = true, // Quebras de linha são convertidas em <br>
        smartLists = true,
        smartypants = true, // Tipografia inteligente para aspas e hífens
        highlight = null // Função para destacar código
      } = options;
      
      // Importar marked de forma dinâmica
      const marked = (await import('marked')).marked;
      
      // Configurar marked
      marked.setOptions({
        gfm,
        breaks,
        smartLists,
        smartypants,
        highlight
      });
      
      // Processar markdown
      let html = marked(markdown);
      
      // Sanitizar se necessário
      if (sanitize) {
        html = this.sanitizeHtml(html);
      }
      
      return html;
    } catch (error) {
      log('error', `❌ Erro ao processar markdown: ${error.message}`);
      console.error(error);
      return markdown;
    }
  },
  
  /**
   * Sanitiza HTML para evitar XSS
   * 
   * @param {string} html - HTML a sanitizar
   * @param {object} options - Opções de sanitização
   * @returns {string} - HTML sanitizado
   */
  sanitizeHtml(html, options = {}) {
    if (!html) return '';
    
    // Se for em produção e DOMPurify estiver disponível, use-o
    if (typeof window !== 'undefined' && window.DOMPurify) {
      return window.DOMPurify.sanitize(html, options);
    }
    
    // Implementação básica como fallback
    // Em produção é sempre recomendado usar DOMPurify ou similar
    try {
      // Opções padrão
      const {
        allowedTags = ['a', 'b', 'br', 'code', 'div', 'em', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 
                      'i', 'img', 'li', 'ol', 'p', 'pre', 'span', 'strong', 'table', 'td', 
                      'th', 'tr', 'ul', 'blockquote', 'hr'],
        allowedAttributes = {
          a: ['href', 'target', 'rel', 'title'],
          img: ['src', 'alt', 'title', 'width', 'height']
        }
      } = options;
      
      // Sanitização simplificada - para produção usar DOMPurify
      return html
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#039;');
    } catch (error) {
      log('error', `❌ Erro ao sanitizar HTML: ${error.message}`);
      return html.replace(/</g, '&lt;').replace(/>/g, '&gt;');
    }
  },
  
  /**
   * Processa JSON para objetos JavaScript
   * 
   * @param {string} json - String JSON
   * @returns {object|null} - Objeto JavaScript ou null em caso de erro
   */
  parseJson(json) {
    if (!json) return null;
    
    try {
      return JSON.parse(json);
    } catch (error) {
      log('error', `❌ Erro ao fazer parse de JSON: ${error.message}`);
      return null;
    }
  },
  
  /**
   * Processa conteúdo Rich Text (lexical, contentful, etc.)
   * 
   * @param {object} richText - Objeto de rich text
   * @param {object} options - Opções de processamento
   * @returns {string} - HTML gerado
   */
  processRichText(richText, options = {}) {
    if (!richText) return '';
    
    try {
      // Detecção automática do formato de rich text
      if (richText.root && richText.root.children) {
        // Lexical format (PayloadCMS)
        return this.processLexicalContent(richText, options);
      } else if (richText.nodeType === 'document' && richText.content) {
        // Contentful format
        return this.processContentfulRichText(richText, options);
      } else if (typeof richText === 'string') {
        // Tentar como markdown ou HTML
        if (richText.trim().startsWith('<')) {
          return this.sanitizeHtml(richText, options);
        } else {
          return this.markdown(richText, options);
        }
      }
      
      // Formato desconhecido
      log('warn', `Formato de rich text desconhecido:`, richText);
      return '';
    } catch (error) {
      log('error', `❌ Erro ao processar rich text: ${error.message}`);
      return '';
    }
  },
  
  /**
   * Processa Rich Text do formato Lexical (PayloadCMS)
   * 
   * @param {object} lexicalContent - Conteúdo no formato Lexical
   * @param {object} options - Opções de processamento
   * @returns {string} - HTML gerado
   */
  processLexicalContent(lexicalContent, options = {}) {
    if (!lexicalContent || !lexicalContent.root) return '';
    
    // Implementação básica para nós do Lexical
    // Em produção, deve-se usar o renderer oficial do Lexical
    try {
      const root = lexicalContent.root;
      let html = '';
      
      if (root.children && Array.isArray(root.children)) {
        for (const child of root.children) {
          html += this.renderLexicalNode(child, options);
        }
      }
      
      return html;
    } catch (error) {
      log('error', `❌ Erro ao processar Lexical: ${error.message}`);
      return '';
    }
  },
  
  /**
   * Renderiza nó do formato Lexical
   * 
   * @private
   * @param {object} node - Nó Lexical
   * @param {object} options - Opções de renderização
   * @returns {string} - HTML gerado
   */
  renderLexicalNode(node, options = {}) {
    if (!node || !node.type) return '';
    
    try {
      switch (node.type) {
        case 'paragraph':
          return `<p>${node.children?.map(child => this.renderLexicalNode(child, options)).join('') || ''}</p>`;
        
        case 'text':
          let text = node.text || '';
          if (node.format & 1) text = `<strong>${text}</strong>`;
          if (node.format & 2) text = `<em>${text}</em>`;
          if (node.format & 4) text = `<u>${text}</u>`;
          if (node.format & 8) text = `<s>${text}</s>`;
          if (node.format & 16) text = `<code>${text}</code>`;
          return text;
        
        case 'heading':
          const level = node.tag.substring(1);
          return `<h${level}>${node.children?.map(child => this.renderLexicalNode(child, options)).join('') || ''}</h${level}>`;
        
        case 'list':
          const listTag = node.listType === 'number' ? 'ol' : 'ul';
          return `<${listTag}>${node.children?.map(child => this.renderLexicalNode(child, options)).join('') || ''}</${listTag}>`;
        
        case 'listitem':
          return `<li>${node.children?.map(child => this.renderLexicalNode(child, options)).join('') || ''}</li>`;
        
        case 'link':
          const url = this.sanitizeHtml(node.url);
          return `<a href="${url}" target="${node.target || '_self'}" rel="noopener noreferrer">${node.children?.map(child => this.renderLexicalNode(child, options)).join('') || ''}</a>`;
        
        case 'image':
          const altText = this.sanitizeHtml(node.altText || '');
          return `<img src="${node.src}" alt="${altText}" title="${altText}" />`;
          
        default:
          log('debug', `Tipo de nó Lexical desconhecido: ${node.type}`);
          return '';
      }
    } catch (error) {
      log('error', `❌ Erro ao renderizar nó Lexical: ${error.message}`);
      return '';
    }
  }
};