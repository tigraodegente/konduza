/**
 * Motor de renderização dinâmica do Konduza
 * 
 * Este módulo é responsável por renderizar componentes dinâmicos
 * baseados nos temas e dados das páginas.
 */

// Configuração de debug
const DEBUG = true;

/**
 * Função para log com prefixo do motor
 */
function log(message, ...args) {
  if (DEBUG) {
    console.log(`[RenderEngine] ${message}`, ...args);
  }
}

/**
 * Determina qual componente usar com base em tag e props
 * 
 * @param {string} tagName - Nome da tag/componente
 * @param {object} props - Propriedades do componente
 * @param {string} themeId - ID do tema
 * @param {object} siteData - Dados do site
 * @returns {Promise<Object|null>} - Componente Astro ou null
 */
export async function resolveComponent(tagName, props, themeId, siteData) {
  log(`Resolvendo componente: ${tagName}`);
  
  try {
    // Normalizar tagName para padrão kebab-case para camelCase
    const normalizedTagName = tagName.replace(/-([a-z])/g, (_, letter) => letter.toUpperCase());
    
    // Caminho base para os componentes do tema
    const themePath = `/themes/${themeId}/components`;
    
    // Tentar importar o componente usando import dinâmico
    try {
      // Verificar primeiro no diretório do tema atual
      log(`Tentando importar componente do tema: ${themePath}/${tagName}.astro`);
      const Component = await import(/* @vite-ignore */ `${themePath}/${tagName}.astro`);
      log(`Componente ${tagName} encontrado no tema ${themeId}`);
      return Component.default;
    } catch (themeError) {
      log(`Componente não encontrado no tema ${themeId}: ${themeError.message}`);
      
      // Se não encontrar no tema, tentar componentes nativos do Astro
      try {
        log(`Tentando importar componente nativo: ${normalizedTagName}`);
        const systemComponents = {
          'Hero': () => import('../components/Hero.astro'),
          'FeatureGrid': () => import('../components/FeatureGrid.astro'),
          'ContentBlock': () => import('../components/ContentBlock.astro'),
          'ContactForm': () => import('../components/ContactForm.astro'),
          'ImageGallery': () => import('../components/ImageGallery.astro'),
        };
        
        if (normalizedTagName in systemComponents) {
          const Component = await systemComponents[normalizedTagName]();
          log(`Componente nativo ${normalizedTagName} encontrado`);
          return Component.default;
        }
        
        // Se não for um componente conhecido, retorna null
        log(`Componente ${tagName} não encontrado no sistema`);
        return null;
      } catch (nativeError) {
        log(`Erro ao importar componente nativo: ${nativeError.message}`);
        return null;
      }
    }
  } catch (error) {
    log(`Erro ao resolver componente ${tagName}: ${error.message}`);
    console.error(error);
    return null;
  }
}

/**
 * Renderiza uma página com base em seus componentes
 * 
 * @param {object} pageData - Dados da página a renderizar
 * @param {object} siteData - Dados do site
 * @returns {Promise<Array>} - Array de componentes renderizados
 */
export async function renderPage(pageData, siteData) {
  log(`Renderizando página: ${pageData.title}`);
  
  // Obter ID do tema
  const themeId = siteData?.themeData?.id || 'default-theme';
  
  // Componentes da página
  const components = pageData.components || [];
  
  // Resultado de renderização
  const renderedComponents = [];
  
  // Renderizar cada componente
  for (const component of components) {
    try {
      const { type, props = {}, children = [] } = component;
      
      // Resolver o componente
      const Component = await resolveComponent(type, props, themeId, siteData);
      
      if (Component) {
        // Preparar propriedades
        const componentProps = {
          ...props,
          key: props.id || `component-${renderedComponents.length}`,
          site: siteData,
          page: pageData
        };
        
        // Adicionar componente ao resultado
        renderedComponents.push({
          Component,
          props: componentProps,
          children
        });
        
        log(`Componente ${type} resolvido e adicionado`);
      } else {
        log(`⚠️ Não foi possível resolver o componente: ${type}`);
        
        // Adicionar um fallback como mensagem de erro (apenas em desenvolvimento)
        if (import.meta.env.DEV) {
          renderedComponents.push({
            Component: {
              render: () => `<div class="error-component">Componente não encontrado: ${type}</div>`
            },
            props: {},
            children: []
          });
        }
      }
    } catch (error) {
      log(`❌ Erro ao renderizar componente: ${error.message}`);
      console.error(error);
      
      // Adicionar um fallback como mensagem de erro (apenas em desenvolvimento)
      if (import.meta.env.DEV) {
        renderedComponents.push({
          Component: {
            render: () => `<div class="error-component">Erro ao renderizar: ${error.message}</div>`
          },
          props: {},
          children: []
        });
      }
    }
  }
  
  return renderedComponents;
}

/**
 * Determina qual layout usar para uma página
 * 
 * @param {object} pageData - Dados da página
 * @param {object} siteData - Dados do site
 * @returns {Promise<Object|null>} - Layout Astro ou null
 */
export async function resolveLayout(pageData, siteData) {
  const themeId = siteData?.themeData?.id || 'default-theme';
  const layoutName = pageData.layout || 'base';
  
  log(`Resolvendo layout: ${layoutName} para o tema ${themeId}`);
  
  try {
    // Tentar importar o layout do tema
    try {
      const layoutPath = `/themes/${themeId}/layouts/${layoutName}.astro`;
      log(`Tentando importar layout: ${layoutPath}`);
      
      const Layout = await import(/* @vite-ignore */ layoutPath);
      log(`Layout ${layoutName} encontrado no tema ${themeId}`);
      return Layout.default;
    } catch (themeError) {
      log(`Layout não encontrado no tema: ${themeError.message}`);
      
      // Se falhar, tentar o layout base padrão do tema
      try {
        const defaultPath = `/themes/${themeId}/layouts/base.astro`;
        log(`Tentando importar layout padrão: ${defaultPath}`);
        
        const DefaultLayout = await import(/* @vite-ignore */ defaultPath);
        log(`Layout base encontrado como fallback`);
        return DefaultLayout.default;
      } catch (defaultError) {
        log(`Layout base não encontrado: ${defaultError.message}`);
        
        // Último recurso: layout do sistema
        try {
          const systemPath = '../layouts/DefaultLayout.astro';
          log(`Tentando importar layout do sistema: ${systemPath}`);
          
          const SystemLayout = await import(/* @vite-ignore */ systemPath);
          log(`Layout do sistema encontrado como último recurso`);
          return SystemLayout.default;
        } catch (systemError) {
          log(`❌ Nenhum layout encontrado: ${systemError.message}`);
          return null;
        }
      }
    }
  } catch (error) {
    log(`❌ Erro ao resolver layout: ${error.message}`);
    console.error(error);
    return null;
  }
}

/**
 * Processa variáveis de template em uma string
 * 
 * @param {string} template - String de template
 * @param {object} data - Dados para substituir
 * @returns {string} - String processada
 */
export function processTemplate(template, data) {
  if (!template || typeof template !== 'string') {
    return '';
  }
  
  try {
    return template.replace(/{{(.*?)}}/g, (match, key) => {
      // Remover espaços em branco
      const trimmedKey = key.trim();
      
      // Suporte a expressões simples
      if (trimmedKey.includes('.')) {
        // Caminho aninhado (ex: "site.name")
        const parts = trimmedKey.split('.');
        let value = data;
        
        for (const part of parts) {
          if (value === undefined || value === null) {
            return '';
          }
          value = value[part];
        }
        
        return value !== undefined && value !== null ? value : '';
      } else {
        // Chave simples
        return data[trimmedKey] !== undefined && data[trimmedKey] !== null
          ? data[trimmedKey]
          : '';
      }
    });
  } catch (error) {
    log(`❌ Erro ao processar template: ${error.message}`);
    return template;
  }
}

/**
 * Funções para processamento de conteúdo dinâmico
 */
export const contentProcessors = {
  /**
   * Processa conteúdo markdown em HTML
   * 
   * @param {string} markdown - Texto markdown
   * @returns {Promise<string>} - HTML gerado
   */
  async markdown(markdown) {
    try {
      // Importar marked de forma dinâmica
      const marked = (await import('marked')).marked;
      return marked(markdown);
    } catch (error) {
      log(`❌ Erro ao processar markdown: ${error.message}`);
      return markdown;
    }
  },
  
  /**
   * Sanitiza HTML para evitar XSS
   * 
   * @param {string} html - HTML a sanitizar
   * @returns {string} - HTML sanitizado
   */
  sanitizeHtml(html) {
    // Implementação básica - em produção deve usar uma biblioteca como DOMPurify
    return html
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }
};