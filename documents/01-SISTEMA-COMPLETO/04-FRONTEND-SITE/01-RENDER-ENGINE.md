# Motor de Renderização Dinâmica

Este documento detalha o motor de renderização dinâmica do Konduza, responsável por transformar definições de temas e páginas do banco de dados em HTML interativo.

## Visão Geral

O motor de renderização é o coração do frontend do Konduza, permitindo que sites sejam renderizados dinamicamente a partir de definições armazenadas no banco de dados, sem necessidade de recompilação de código.

```
┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐
│                 │     │                 │     │                 │
│  PayloadCMS DB  │────►│ Render Engine   │────►│  HTML Output    │
│                 │     │                 │     │                 │
└─────────────────┘     └─────────────────┘     └─────────────────┘
        ▲                       │
        │                       │
        │                       ▼
┌─────────────────┐     ┌─────────────────┐
│                 │     │                 │
│  Theme Files    │◄────┤    Cache        │
│  (CSS, JS)      │     │                 │
└─────────────────┘     └─────────────────┘
```

## Arquitetura

O motor de renderização é construído com Astro e segue uma arquitetura em camadas:

1. **Camada de Roteamento**: Captura URLs e determina qual página renderizar
2. **Camada de Resolução**: Busca dados do site, página e template
3. **Camada de Renderização**: Processa templates e componentes
4. **Camada de Hidratação**: Adiciona interatividade onde necessário

## Fluxo de Renderização

1. Usuário acessa uma URL (ex: `https://exemplo.com/produtos`)
2. O middleware de detecção de domínio identifica o site pelo domínio
3. A rota universal `[...path].astro` captura a solicitação
4. O sistema busca a página correspondente ao caminho (`/produtos`)
5. O template associado à página é carregado
6. Componentes referenciados na página são carregados
7. O motor renderiza o HTML completo
8. JavaScript de hidratação é injetado para componentes interativos

## Implementação

### Rota Universal

```astro
---
// src/pages/[...path].astro
import { getCurrentSite, getPage, getTemplate } from '../utils/api';
import RenderEngine from '../components/RenderEngine.astro';

// Obter informações da URL
const { pathname } = Astro.url;
const { site } = Astro.locals; // Definido pelo middleware de domínio

// Buscar página para este caminho
const page = await getPage(site.id, pathname);

// Se página não existe, mostrar 404
if (!page) {
  return Astro.redirect('/404');
}

// Buscar template associado à página
const template = await getTemplate(page.template);

// Preparar dados para renderização
const renderData = {
  site,
  page,
  template
};
---

<RenderEngine data={renderData} />
```

### Motor de Renderização

```astro
---
// src/components/RenderEngine.astro
import { processTemplate } from '../utils/template-processor';
import ComponentRenderer from './ComponentRenderer.astro';

const { data } = Astro.props;
const { site, page, template } = data;

// Processar o template HTML
const processedHtml = processTemplate(template.html, {
  page,
  site
});

// Extrair regiões do template
const regions = template.regions || [];
---

<html lang={site.locale || 'pt-BR'}>
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>{page.seo?.title || page.title}</title>
    
    <!-- Metatags SEO -->
    <meta name="description" content={page.seo?.description} />
    {page.seo?.keywords && (
      <meta name="keywords" content={page.seo.keywords.join(', ')} />
    )}
    
    <!-- Open Graph -->
    <meta property="og:title" content={page.seo?.ogTitle || page.title} />
    <meta property="og:description" content={page.seo?.ogDescription || page.seo?.description} />
    {page.seo?.ogImage && (
      <meta property="og:image" content={page.seo.ogImage} />
    )}
    
    <!-- CSS do tema -->
    <link rel="stylesheet" href={`/themes/${site.theme.slug}/css/variables.css`} />
    <link rel="stylesheet" href={`/themes/${site.theme.slug}/css/base.css`} />
    <link rel="stylesheet" href={`/themes/${site.theme.slug}/css/components.css`} />
    <link rel="stylesheet" href={`/themes/${site.theme.slug}/css/utilities.css`} />
    
    <!-- JS do tema -->
    <script src={`/themes/${site.theme.slug}/js/theme.js`} defer></script>
    
    <!-- Estilos personalizados do site -->
    {site.theme.config?.customCSS && (
      <style set:html={site.theme.config.customCSS}></style>
    )}
  </head>
  <body>
    <!-- Renderizar o template com as regiões -->
    <Fragment set:html={processedHtml.beforeRegions} />
    
    {regions.map(region => (
      <div class={`region region-${region.name}`} data-region={region.name}>
        {page.regions && page.regions[region.name]?.components.map(component => (
          <ComponentRenderer 
            component={component.component}
            props={component.props}
            id={component.id}
          />
        ))}
      </div>
    ))}
    
    <Fragment set:html={processedHtml.afterRegions} />
  </body>
</html>
```

### Renderizador de Componentes

```astro
---
// src/components/ComponentRenderer.astro
import { getComponentDefinition } from '../utils/components';

const { component: componentName, props, id } = Astro.props;

// Buscar definição do componente
const componentDef = await getComponentDefinition(componentName);

// Se componente não existe, mostrar placeholder
if (!componentDef) {
  return `<div class="component-error">Componente não encontrado: ${componentName}</div>`;
}

// Processar o HTML do componente com as props
const processedHtml = processComponent(componentDef.html, props);

// Determinar tipo de hidratação
const hydrationType = componentDef.hydration || 'none';
---

{hydrationType === 'none' && (
  <div class={`component component-${componentName}`} data-component-id={id}>
    <style set:html={componentDef.css}></style>
    <Fragment set:html={processedHtml} />
  </div>
)}

{hydrationType === 'web-component' && (
  <konduza-component 
    class={`component component-${componentName}`}
    data-component-id={id}
    data-component-name={componentName}
    data-props={JSON.stringify(props)}
  >
    <style set:html={componentDef.css}></style>
    <Fragment set:html={processedHtml} />
    <script type="module" set:html={`
      class KonduzaComponent extends HTMLElement {
        connectedCallback() {
          ${componentDef.js}
        }
      }
      if (!customElements.get('konduza-component-${id}')) {
        customElements.define('konduza-component-${id}', KonduzaComponent);
      }
    `}></script>
  </konduza-component>
)}

{hydrationType === 'react' && (
  <div 
    id={`react-component-${id}`}
    data-component={componentName}
    data-props={JSON.stringify(props)}
    class={`component component-${componentName}`}
  >
    <Fragment set:html={processedHtml} />
    <script>
      import { hydrateReactComponent } from '../utils/hydration.js';
      hydrateReactComponent(`react-component-${id}`);
    </script>
  </div>
)}

{hydrationType === 'svelte' && (
  <div 
    id={`svelte-component-${id}`}
    data-component={componentName}
    data-props={JSON.stringify(props)}
    class={`component component-${componentName}`}
  >
    <Fragment set:html={processedHtml} />
    <script>
      import { hydrateSvelteComponent } from '../utils/hydration.js';
      hydrateSvelteComponent(`svelte-component-${id}`);
    </script>
  </div>
)}
```

## Processamento de Template

O processador de template é responsável por substituir variáveis e expressões no HTML:

```javascript
// src/utils/template-processor.js
import Mustache from 'mustache';

export function processTemplate(templateHtml, data) {
  // Dividir o template para identificar regiões
  const regionPattern = /#region\s+name="([^"]+)".*?#endregion/gs;
  const parts = templateHtml.split(regionPattern);
  
  // Processar partes antes e depois das regiões
  const beforeRegions = Mustache.render(parts[0], data);
  const afterRegions = parts[parts.length - 1] 
    ? Mustache.render(parts[parts.length - 1], data)
    : '';
  
  return {
    beforeRegions,
    afterRegions
  };
}

export function processComponent(componentHtml, props) {
  return Mustache.render(componentHtml, props);
}
```

## Hidratação de Componentes

Para componentes interativos, o sistema suporta hidratação em diferentes frameworks:

```javascript
// src/utils/hydration.js
// Mapa de componentes React registrados
const reactComponents = {
  'carousel': () => import('../components/react/Carousel.jsx'),
  'form': () => import('../components/react/Form.jsx'),
  // Outros componentes React...
};

// Mapa de componentes Svelte registrados
const svelteComponents = {
  'tabs': () => import('../components/svelte/Tabs.svelte'),
  'accordion': () => import('../components/svelte/Accordion.svelte'),
  // Outros componentes Svelte...
};

// Hidratar componente React
export async function hydrateReactComponent(containerId) {
  const container = document.getElementById(containerId);
  if (!container) return;
  
  const componentName = container.dataset.component;
  const props = JSON.parse(container.dataset.props || '{}');
  
  // Importar dinamicamente o componente
  if (reactComponents[componentName]) {
    const { default: Component } = await reactComponents[componentName]();
    const { createRoot } = await import('react-dom/client');
    
    // Renderizar com React 18
    const root = createRoot(container);
    root.render(React.createElement(Component, props));
  }
}

// Hidratar componente Svelte
export async function hydrateSvelteComponent(containerId) {
  const container = document.getElementById(containerId);
  if (!container) return;
  
  const componentName = container.dataset.component;
  const props = JSON.parse(container.dataset.props || '{}');
  
  // Importar dinamicamente o componente
  if (svelteComponents[componentName]) {
    const { default: Component } = await svelteComponents[componentName]();
    
    // Renderizar com Svelte
    new Component({
      target: container,
      props,
      hydrate: true
    });
  }
}
```

## Estratégias de Cache

O sistema implementa um cache multinível para otimizar performance:

```javascript
// src/utils/cache.js
import { createClient } from 'redis'; // Opcional, para cache distribuído

// Cache em memória
const memoryCache = new Map();

// Cliente Redis (opcional)
const redisClient = process.env.REDIS_URL 
  ? createClient({ url: process.env.REDIS_URL })
  : null;

if (redisClient) {
  await redisClient.connect();
}

export async function getFromCache(key, domain) {
  const fullKey = `${domain}:${key}`;
  
  // Tentar cache em memória primeiro
  if (memoryCache.has(fullKey)) {
    return memoryCache.get(fullKey);
  }
  
  // Tentar Redis se disponível
  if (redisClient) {
    const value = await redisClient.get(fullKey);
    if (value) {
      // Atualizar cache em memória
      const parsed = JSON.parse(value);
      memoryCache.set(fullKey, parsed);
      return parsed;
    }
  }
  
  return null;
}

export async function setInCache(key, value, domain, ttl = 3600) {
  const fullKey = `${domain}:${key}`;
  
  // Armazenar em memória
  memoryCache.set(fullKey, value);
  
  // Armazenar em Redis se disponível
  if (redisClient) {
    await redisClient.set(fullKey, JSON.stringify(value), {
      EX: ttl // Tempo de expiração em segundos
    });
  }
}

export async function invalidateCache(pattern, domain) {
  const prefix = domain ? `${domain}:` : '';
  const fullPattern = `${prefix}${pattern}`;
  
  // Invalidar cache em memória
  for (const key of memoryCache.keys()) {
    if (key.startsWith(prefix) && key.includes(pattern)) {
      memoryCache.delete(key);
    }
  }
  
  // Invalidar cache no Redis
  if (redisClient) {
    const keys = await redisClient.keys(fullPattern);
    if (keys.length > 0) {
      await redisClient.del(keys);
    }
  }
}
```

## API para Dados

Interfaces para buscar dados do PayloadCMS:

```javascript
// src/utils/api.js
import { getFromCache, setInCache } from './cache';

const API_URL = process.env.PAYLOAD_URL || 'http://localhost:3000';
const API_KEY = process.env.INTERNAL_API_KEY;

// Buscar site pelo domínio
export async function getCurrentSite(domain) {
  // Tentar cache primeiro
  const cachedSite = await getFromCache('site', domain);
  if (cachedSite) return cachedSite;
  
  // Buscar do PayloadCMS
  const res = await fetch(`${API_URL}/api/sites?domain=${domain}`, {
    headers: {
      'X-API-Key': API_KEY
    }
  });
  
  if (!res.ok) return null;
  
  const data = await res.json();
  const site = data.docs[0] || null;
  
  if (site) {
    // Armazenar em cache por 5 minutos
    await setInCache('site', site, domain, 300);
  }
  
  return site;
}

// Buscar página por site e caminho
export async function getPage(siteId, path) {
  const normalizedPath = path === '/' ? 'home' : path.replace(/^\//, '');
  
  // Tentar cache primeiro
  const cachedPage = await getFromCache(`page:${normalizedPath}`, siteId);
  if (cachedPage) return cachedPage;
  
  // Buscar do PayloadCMS
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
}

// Buscar template por ID
export async function getTemplate(templateId) {
  // Tentar cache primeiro
  const cachedTemplate = await getFromCache(`template:${templateId}`, 'global');
  if (cachedTemplate) return cachedTemplate;
  
  // Buscar do PayloadCMS
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
}

// Buscar definição de componente
export async function getComponentDefinition(componentName) {
  // Tentar cache primeiro
  const cachedComponent = await getFromCache(`component:${componentName}`, 'global');
  if (cachedComponent) return cachedComponent;
  
  // Buscar do PayloadCMS
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
}
```

## Middleware para Detecção de Domínio

Middleware Astro para identificar o site pelo domínio:

```javascript
// No astro.config.mjs
export default defineConfig({
  // ...outras configurações
  middleware: [
    {
      name: 'domain-detection',
      order: 'pre',
      callback: async ({ request, locals }) => {
        // Obter domínio da requisição
        const host = request.headers.get('host') || 'localhost:3000';
        const domain = host.split(':')[0]; // Remover porta, se houver
        
        try {
          // Importar funções para detecção de domínio
          const { getCurrentSite } = await import('./src/utils/api');
          
          // Obter configurações do site para este domínio
          const site = await getCurrentSite(domain);
          
          // Guardar informações do site para uso nas páginas
          locals.site = site;
          locals.domain = domain;
          
          // Se não encontrou o site e não é localhost, redirecionar para fallback
          if (!site && domain !== 'localhost') {
            console.warn(`Site não encontrado para o domínio: ${domain}`);
            // Poderia redirecionar para um domínio padrão ou exibir página de 404
            // return Response.redirect('https://konduza.com', 302);
          }
        } catch (error) {
          console.error(`Erro no middleware de detecção de domínio: ${error}`);
        }
      }
    }
  ]
});
```

## Considerações de Performance

1. **Renderização no Servidor**: Páginas são renderizadas no servidor para melhor SEO e performance.
2. **Hidratação Seletiva**: Apenas componentes interativos são hidratados no cliente.
3. **Cache Multinível**: Memória, Redis e CDN para diferentes tipos de conteúdo.
4. **Lazy Loading**: Carregar JavaScript/CSS apenas quando necessário.
5. **Preloading**: Precarregar recursos com alta probabilidade de uso.

## Considerações de Segurança

1. **Sanitização**: Todo conteúdo é sanitizado antes da renderização para prevenir XSS.
2. **Validação de Origem**: Verificação de origem para recursos de domínios cruzados.
3. **API Keys**: Autenticação via chaves para comunicação entre serviços.
4. **CSP**: Content Security Policy para controlar origens de recursos carregados.

## Próximos Passos

Após entender o motor de renderização, você pode explorar:

1. **Rota Universal**: Ver `02-UNIVERSAL-ROUTE.md` para detalhes da implementação.
2. **Componentes Padrão**: Explorar `03-STANDARD-COMPONENTS.md` para componentes incluídos.
3. **Renderização Dinâmica**: Consultar `04-DYNAMIC-RENDERING.md` para aprofundar no sistema.

Esta documentação fornece uma visão detalhada do motor de renderização do Konduza. Implementar este sistema permitirá que sites sejam criados, modificados e publicados completamente via interface administrativa, sem necessidade de recompilação de código.