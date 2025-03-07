import { getFromCache, setInCache } from './cache';

const API_URL = import.meta.env.PAYLOAD_URL || 'http://localhost:3000';
const API_KEY = import.meta.env.INTERNAL_API_KEY || 'dev_api_key';

/**
 * Verifica se o usuário é um administrador
 * 
 * @param {Request} request Objeto de requisição Astro
 * @returns {Promise<object|null>} Dados da sessão ou null se não autenticado
 */
export async function getAdminSession(request) {
  try {
    // No ambiente do servidor, precisamos usar a abordagem direta
    // Em vez de tentar usar nosso próprio endpoint, vamos diretamente ao Payload
    
    // Verificar se existe um cookie de autenticação
    const cookie = request.headers.get('cookie');
    if (!cookie) return null;
    
    // Fazer chamada direta ao endpoint /api/users/me do Payload
    const res = await fetch(`${API_URL}/api/users/me`, {
      headers: {
        'Cookie': cookie,
        'X-API-Key': API_KEY
      }
    });
    
    if (!res.ok) return null;
    
    const data = await res.json();
    
    // Verificar se o usuário tem a role de admin
    if (!data.user?.roles?.includes('admin')) {
      return null;
    }
    
    return data.user || null;
  } catch (error) {
    console.error('Erro ao verificar sessão admin:', error);
    return null;
  }
}

/**
 * Controla logs para depuração
 */
const DEBUG = true;

/**
 * Função para exibir logs de depuração
 */
function log(message, ...args) {
  if (DEBUG) {
    console.log(`[Konduza API] ${message}`, ...args);
  }
}

/**
 * Busca o site pelo domínio
 * 
 * @param {string} domain Domínio do site
 * @returns {Promise<object|null>} Dados do site ou null se não existir
 */
export async function getCurrentSite(domain) {
  log(`Buscando site para domínio: ${domain}`);
  
  // Tentar cache primeiro
  const cachedSite = await getFromCache('site', domain);
  if (cachedSite) {
    log(`Site encontrado em cache para domínio: ${domain}`);
    return cachedSite;
  }
  
  // Buscar do PayloadCMS
  try {
    log(`Consultando API para domínio: ${domain}`);
    
    // Nos domínios podemos ter um array, então precisamos buscar de forma diferente
    const res = await fetch(`${API_URL}/api/sites`, {
      headers: {
        'X-API-Key': API_KEY
      }
    });
    
    if (!res.ok) {
      log(`Erro na API ao buscar sites: ${res.status} ${res.statusText}`);
      return null;
    }
    
    // Processar todos os sites e encontrar um com o domínio que precisamos
    const data = await res.json();
    log(`Encontrados ${data.docs.length} sites no sistema`);
    
    // Procurar pelo site que tenha o domínio procurado
    const site = data.docs.find(site => {
      // Verificar se o site tem o array domains
      if (!site.domains || !Array.isArray(site.domains)) return false;
      
      // Procurar no array de domínios
      return site.domains.some(d => d.domain === domain || d.domain === domain.replace('www.', ''));
    });
    
    if (site) {
      log(`Site encontrado: ${site.name} (ID: ${site.id})`);
      
      // Buscar tema associado ao site
      if (site.theme) {
        log(`Buscando dados do tema: ${site.theme}`);
        const theme = await getTheme(site.theme);
        site.themeData = theme;
      }
      
      // Armazenar em cache por 5 minutos
      await setInCache('site', site, domain, 300);
      return site;
    } else {
      log(`Nenhum site encontrado para o domínio: ${domain}`);
      
      // Em ambiente de desenvolvimento, podemos retornar o primeiro site para facilitar testes
      if (import.meta.env.DEV && data.docs.length > 0) {
        log(`Modo DEV: retornando o primeiro site disponível para testes`);
        const devSite = data.docs[0];
        
        // Buscar tema associado ao site
        if (devSite.theme) {
          log(`Buscando dados do tema: ${devSite.theme}`);
          const theme = await getTheme(devSite.theme);
          devSite.themeData = theme;
        }
        
        return devSite;
      }
      
      return null;
    }
  } catch (error) {
    console.error(`Erro ao buscar site para o domínio ${domain}:`, error);
    return null;
  }
}

/**
 * Busca uma página por site e caminho
 * 
 * @param {string} siteId ID do site
 * @param {string} path Caminho da URL ou ID da página
 * @returns {Promise<object|null>} Dados da página ou null se não existir
 */
export async function getPage(siteId, path) {
  // Se for um ID de página, buscamos diretamente
  if (path && path.length === 24 && /^[0-9a-f]{24}$/i.test(path)) {
    // Tentar cache primeiro
    const cachedPage = await getFromCache(`page:${path}`, siteId);
    if (cachedPage) return cachedPage;
    
    // Buscar por ID
    try {
      const res = await fetch(`${API_URL}/api/entities/${path}`, {
        headers: {
          'X-API-Key': API_KEY
        }
      });
      
      if (!res.ok) return null;
      
      const page = await res.json();
      
      // Verificar se pertence ao site correto
      if (page.siteId === siteId) {
        // Armazenar em cache por 1 minuto
        await setInCache(`page:${path}`, page, siteId, 60);
        return page;
      }
      
      return null;
    } catch (error) {
      console.error(`Erro ao buscar página com ID ${path}:`, error);
      return null;
    }
  }
  
  // Caso contrário, buscamos por caminho
  const normalizedPath = path === '/' ? 'home' : path.replace(/^\//, '');
  
  // Tentar cache primeiro
  const cachedPage = await getFromCache(`page:${normalizedPath}`, siteId);
  if (cachedPage) return cachedPage;
  
  // Buscar do PayloadCMS
  try {
    const res = await fetch(`${API_URL}/api/entities?where[type][equals]=page&where[path][equals]=${normalizedPath}&where[siteId][equals]=${siteId}`, {
      headers: {
        'X-API-Key': API_KEY
      }
    });
    
    if (!res.ok) return null;
    
    const data = await res.json();
    const page = data.docs[0] || null;
    
    if (page) {
      // Armazenar em cache por 1 minuto
      await setInCache(`page:${normalizedPath}`, page, siteId, 60);
    }
    
    return page;
  } catch (error) {
    console.error(`Erro ao buscar página ${normalizedPath} para o site ${siteId}:`, error);
    return null;
  }
}

/**
 * Busca um template por ID
 * 
 * @param {string} templateId ID do template
 * @returns {Promise<object|null>} Dados do template ou null se não existir
 */
export async function getTemplate(templateId) {
  // Tentar cache primeiro
  const cachedTemplate = await getFromCache(`template:${templateId}`, 'global');
  if (cachedTemplate) return cachedTemplate;
  
  // Buscar do PayloadCMS
  try {
    const res = await fetch(`${API_URL}/api/entities/${templateId}`, {
      headers: {
        'X-API-Key': API_KEY
      }
    });
    
    if (!res.ok) return null;
    
    const template = await res.json();
    
    if (template) {
      // Armazenar em cache por 10 minutos
      await setInCache(`template:${templateId}`, template, 'global', 600);
    }
    
    return template;
  } catch (error) {
    console.error(`Erro ao buscar template ${templateId}:`, error);
    return null;
  }
}

/**
 * Busca a definição de um componente pelo nome
 * 
 * @param {string} componentName Nome do componente
 * @returns {Promise<object|null>} Dados do componente ou null se não existir
 */
export async function getComponentDefinition(componentName) {
  // Tentar cache primeiro
  const cachedComponent = await getFromCache(`component:${componentName}`, 'global');
  if (cachedComponent) return cachedComponent;
  
  // Buscar do PayloadCMS
  try {
    const res = await fetch(`${API_URL}/api/entities?where[type][equals]=component&where[name][equals]=${componentName}`, {
      headers: {
        'X-API-Key': API_KEY
      }
    });
    
    if (!res.ok) return null;
    
    const data = await res.json();
    const component = data.docs[0] || null;
    
    if (component) {
      // Armazenar em cache por 10 minutos
      await setInCache(`component:${componentName}`, component, 'global', 600);
    }
    
    return component;
  } catch (error) {
    console.error(`Erro ao buscar componente ${componentName}:`, error);
    return null;
  }
}

/**
 * Busca todos os componentes disponíveis para um tema
 * 
 * @param {string} themeId ID do tema
 * @returns {Promise<Array>} Lista de componentes do tema
 */
export async function getComponentsForTheme(themeId) {
  // Se o themeId não foi fornecido, retornar uma lista vazia
  if (!themeId) return [];
  
  // Tentar cache primeiro
  const cachedComponents = await getFromCache(`theme-components:${themeId}`, 'global');
  if (cachedComponents) return cachedComponents;
  
  // Buscar do PayloadCMS
  try {
    // Primeiro buscamos o tema para obter a lista de componentes
    const themeRes = await fetch(`${API_URL}/api/themes/${themeId}`, {
      headers: {
        'X-API-Key': API_KEY
      }
    });
    
    if (!themeRes.ok) return [];
    
    const theme = await themeRes.json();
    
    // Processar os componentes do tema para o formato esperado pelo editor
    const components = theme.components.map(comp => ({
      name: comp.name,
      displayName: comp.name,
      description: comp.description || '',
      icon: getIconForCategory(comp.category),
      html: comp.html,
      css: comp.css,
      js: comp.js,
      schema: comp.schema,
      hydration: comp.hydration,
      defaultProps: getDefaultPropsFromSchema(comp.schema)
    }));
    
    // Armazenar em cache por 10 minutos
    await setInCache(`theme-components:${themeId}`, components, 'global', 600);
    
    return components;
  } catch (error) {
    console.error(`Erro ao buscar componentes para o tema ${themeId}:`, error);
    return [];
  }
}

/**
 * Busca todas as páginas de um site
 * 
 * @param {string} siteId ID do site
 * @returns {Promise<Array>} Lista de páginas do site
 */
export async function getPagesForSite(siteId) {
  // Tentar cache primeiro
  const cachedPages = await getFromCache(`site-pages:${siteId}`, siteId);
  if (cachedPages) return cachedPages;
  
  // Buscar do PayloadCMS
  try {
    const res = await fetch(`${API_URL}/api/entities?where[type][equals]=page&where[siteId][equals]=${siteId}&limit=100`, {
      headers: {
        'X-API-Key': API_KEY
      }
    });
    
    if (!res.ok) return [];
    
    const data = await res.json();
    const pages = data.docs || [];
    
    // Processar para um formato mais amigável para a UI
    const processedPages = await Promise.all(pages.map(async (page) => {
      // Buscar informações do template para cada página
      let templateName = 'Template Padrão';
      let templateType = 'default';
      
      if (page.template) {
        try {
          const templateInfo = await getTemplate(page.template);
          if (templateInfo) {
            templateName = templateInfo.name || 'Template Padrão';
            templateType = templateInfo.type || 'default';
          }
        } catch (error) {
          console.error(`Erro ao buscar informações do template ${page.template}:`, error);
        }
      }
      
      return {
        id: page.id,
        title: page.title || 'Sem título',
        path: page.path || '',
        status: page.status || 'draft',
        templateId: page.template,
        templateName,
        templateType,
        isHomePage: page.path === 'home' || page.path === '',
        createdAt: page.createdAt,
        updatedAt: page.updatedAt
      };
    }));
    
    // Ordenar as páginas por data de atualização (mais recentes primeiro)
    processedPages.sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt));
    
    // Armazenar em cache por 1 minuto
    await setInCache(`site-pages:${siteId}`, processedPages, siteId, 60);
    
    return processedPages;
  } catch (error) {
    console.error(`Erro ao buscar páginas para o site ${siteId}:`, error);
    return [];
  }
}

/**
 * Busca um site pelo ID
 * 
 * @param {string} siteId ID do site
 * @returns {Promise<object|null>} Dados do site ou null se não existir
 */
export async function getSite(siteId) {
  // Tentar cache primeiro
  const cachedSite = await getFromCache(`site:${siteId}`, 'global');
  if (cachedSite) return cachedSite;
  
  // Buscar do PayloadCMS
  try {
    const res = await fetch(`${API_URL}/api/sites/${siteId}`, {
      headers: {
        'X-API-Key': API_KEY
      }
    });
    
    if (!res.ok) return null;
    
    const site = await res.json();
    
    // Armazenar em cache por 5 minutos
    await setInCache(`site:${siteId}`, site, 'global', 300);
    
    return site;
  } catch (error) {
    console.error(`Erro ao buscar site com ID ${siteId}:`, error);
    return null;
  }
}

/**
 * Busca todos os templates disponíveis para um tema
 * 
 * @param {string} themeId ID do tema
 * @returns {Promise<Array>} Lista de templates do tema
 */
export async function getTemplatesForSite(themeId) {
  // Se não houver tema, retornar lista vazia
  if (!themeId) return [];
  
  // Tentar cache primeiro
  const cachedTemplates = await getFromCache(`theme-templates:${themeId}`, 'global');
  if (cachedTemplates) return cachedTemplates;
  
  // Buscar do PayloadCMS
  try {
    // Primeiro buscar o tema
    const themeRes = await fetch(`${API_URL}/api/themes/${themeId}`, {
      headers: {
        'X-API-Key': API_KEY
      }
    });
    
    if (!themeRes.ok) return [];
    
    const theme = await themeRes.json();
    
    // Extrair e processar templates do tema
    const templates = (theme.templates || []).map(template => ({
      id: template.id || template.slug,
      name: template.name,
      description: template.description || '',
      regions: template.regions || []
    }));
    
    // Armazenar em cache por 10 minutos
    await setInCache(`theme-templates:${themeId}`, templates, 'global', 600);
    
    return templates;
  } catch (error) {
    console.error(`Erro ao buscar templates para o tema ${themeId}:`, error);
    return [];
  }
}

/**
 * Retorna um ícone baseado na categoria do componente
 * 
 * @param {string} category Categoria do componente
 * @returns {string} Ícone
 */
function getIconForCategory(category) {
  switch (category) {
    case 'header': return '🔝';
    case 'navigation': return '🧭';
    case 'hero': return '🏙️';
    case 'content': return '📝';
    case 'form': return '📋';
    case 'media': return '🖼️';
    case 'footer': return '👣';
    default: return '🧩';
  }
}

/**
 * Extrai valores padrão do schema de um componente
 * 
 * @param {object} schema Schema JSON do componente
 * @returns {object} Objeto com valores padrão
 */
function getDefaultPropsFromSchema(schema) {
  if (!schema || !schema.properties) return {};
  
  const defaultProps = {};
  
  Object.entries(schema.properties).forEach(([propName, propDef]) => {
    if (propDef.default !== undefined) {
      defaultProps[propName] = propDef.default;
    } else {
      // Valores padrão baseados no tipo
      switch (propDef.type) {
        case 'string':
          defaultProps[propName] = '';
          break;
        case 'number':
        case 'integer':
          defaultProps[propName] = 0;
          break;
        case 'boolean':
          defaultProps[propName] = false;
          break;
        case 'array':
          defaultProps[propName] = [];
          break;
        case 'object':
          defaultProps[propName] = {};
          break;
      }
    }
  });
  
  return defaultProps;
}