/**
 * Gerador de preview para temas
 * 
 * Este módulo gera previews HTML, CSS e Astro para temas
 * a partir dos dados JSON, sem necessidade de importar o tema.
 */

/**
 * Gera um preview para um tema
 * @param {Object} themeData - Dados do tema
 * @param {string} mode - Modo de preview ('preview', 'html', 'css', 'astro')
 * @returns {Object} - Resultado do preview
 */
export async function generateThemePreview(themeData, mode = 'preview') {
  console.log(`[ThemePreviewGenerator] Gerando preview em modo: ${mode}`);
  
  try {
    // Inicializar resultado
    const result = {
      success: true,
      mode
    };
    
    // Gerar preview de acordo com o modo
    switch (mode) {
      case 'preview':
        result.html = generateHtmlPreview(themeData);
        break;
      case 'html':
        result.html = generateHtmlCode(themeData);
        break;
      case 'css':
        result.css = generateCssCode(themeData);
        break;
      case 'astro':
        result.astro = generateAstroCode(themeData);
        break;
      default:
        throw new Error(`Modo de preview inválido: ${mode}`);
    }
    
    return result;
  } catch (error) {
    console.error('[ThemePreviewGenerator] Erro:', error);
    throw error;
  }
}

/**
 * Gera um preview HTML completo do tema
 * @param {Object} themeData - Dados do tema
 * @returns {string} - HTML do preview
 */
function generateHtmlPreview(themeData) {
  // Obter CSS principal
  const css = generateCssCode(themeData);
  
  // Obter layout padrão
  const defaultLayout = getDefaultLayout(themeData);
  if (!defaultLayout) {
    throw new Error('Nenhum layout padrão encontrado no tema');
  }
  
  // Processar o layout
  let html = processLayoutTemplate(defaultLayout.template, themeData);
  
  // Injetar CSS diretamente no preview
  html = html.replace('</head>', `<style>${css}</style></head>`);
  
  // Injetar componentes de amostra
  html = injectSampleComponents(html, themeData);
  
  return html;
}

/**
 * Gera o código HTML do tema
 * @param {Object} themeData - Dados do tema
 * @returns {string} - Código HTML
 */
function generateHtmlCode(themeData) {
  // Obter layout padrão
  const defaultLayout = getDefaultLayout(themeData);
  if (!defaultLayout) {
    return '<!-- Nenhum layout padrão encontrado -->';
  }
  
  // Extrair HTML do template Astro
  let html = defaultLayout.template;
  
  // Remover frontmatter se existir
  html = html.replace(/^---\n[\s\S]*?\n---\n/, '');
  
  // Remover código JavaScript
  html = html.replace(/<script[\s\S]*?<\/script>/g, '<!-- [Script removido para visualização] -->');
  
  // Substituir variáveis por valores de exemplo
  html = html
    .replace(/{title}/g, 'Título da Página')
    .replace(/{siteName}/g, 'Nome do Site')
    .replace(/{themeCSS}/g, '/* CSS do tema */')
    .replace(/{themeJS}/g, '/* JS do tema */');
  
  return html;
}

/**
 * Gera o código CSS do tema
 * @param {Object} themeData - Dados do tema
 * @returns {string} - Código CSS
 */
function generateCssCode(themeData) {
  // Iniciar com o CSS principal
  let css = themeData.mainStyles || '';
  
  // Adicionar CSS de cada componente
  if (themeData.components && Array.isArray(themeData.components)) {
    themeData.components.forEach(component => {
      if (component.styles) {
        css += `\n\n/* ${component.name} */\n${component.styles}`;
      }
    });
  }
  
  return css;
}

/**
 * Gera código Astro para componentes do tema
 * @param {Object} themeData - Dados do tema
 * @returns {string} - Código Astro
 */
function generateAstroCode(themeData) {
  let astroCode = '';
  
  // Adicionar layouts
  if (themeData.layouts && Array.isArray(themeData.layouts)) {
    themeData.layouts.forEach(layout => {
      astroCode += `\n/* Layout: ${layout.name} (${layout.key}) */\n`;
      astroCode += layout.template;
      astroCode += '\n\n';
    });
  }
  
  // Adicionar componentes
  if (themeData.components && Array.isArray(themeData.components)) {
    themeData.components.forEach(component => {
      astroCode += `\n/* Componente: ${component.name} (${component.key}) */\n`;
      astroCode += component.template;
      astroCode += '\n\n';
    });
  }
  
  return astroCode;
}

/**
 * Obtém o layout padrão do tema
 * @param {Object} themeData - Dados do tema
 * @returns {Object|null} - Layout padrão ou null se não existir
 */
function getDefaultLayout(themeData) {
  if (!themeData.layouts || !Array.isArray(themeData.layouts)) {
    return null;
  }
  
  // Procurar layout padrão
  const defaultLayout = themeData.layouts.find(layout => layout.isDefault === true);
  
  // Se não encontrou, retornar o primeiro
  return defaultLayout || themeData.layouts[0];
}

/**
 * Processa o template de layout, substituindo variáveis
 * @param {string} template - Template do layout
 * @param {Object} themeData - Dados do tema
 * @returns {string} - HTML processado
 */
function processLayoutTemplate(template, themeData) {
  // Remover frontmatter
  let processed = template.replace(/^---\n[\s\S]*?\n---\n/, '');
  
  // Substituir variáveis comuns
  processed = processed
    .replace(/{title}/g, `Preview: ${themeData.name || 'Tema'}`)
    .replace(/{siteName}/g, themeData.name || 'Tema de Exemplo')
    .replace(/{themeCSS}/g, themeData.mainStyles || '')
    .replace(/{themeJS}/g, themeData.globalScripts || '');
  
  // Substituir a navegação
  processed = processed.replace(/{#each navigation as item}[\s\S]*?{\/each}/g, `
    <li><a href="#">Início</a></li>
    <li><a href="#">Sobre</a></li>
    <li><a href="#">Contato</a></li>
  `);
  
  // Substituir slot por um placeholder
  processed = processed.replace(/<slot\s*\/>/g, '<!-- CONTENT_PLACEHOLDER -->');
  
  return processed;
}

/**
 * Injeta componentes de amostra no HTML
 * @param {string} html - HTML base
 * @param {Object} themeData - Dados do tema
 * @returns {string} - HTML com componentes injetados
 */
function injectSampleComponents(html, themeData) {
  // Verificar se há componentes
  if (!themeData.components || !Array.isArray(themeData.components) || themeData.components.length === 0) {
    return html.replace('<!-- CONTENT_PLACEHOLDER -->', '<div class="preview-message">Sem componentes para exibir</div>');
  }
  
  let componentsHtml = '<div class="theme-preview-container">';
  
  // Título do preview
  componentsHtml += `
    <div class="theme-preview-header">
      <h1>Preview: ${themeData.name || 'Tema'}</h1>
      <p>Esta é uma visualização dos componentes disponíveis neste tema.</p>
    </div>
  `;
  
  // Adicionar cada componente
  themeData.components.forEach(component => {
    componentsHtml += `
      <div class="theme-preview-component">
        <div class="theme-preview-component-header">
          <h2>${component.name}</h2>
          ${component.description ? `<p>${component.description}</p>` : ''}
        </div>
        <div class="theme-preview-component-content">
          ${renderComponentPreview(component)}
        </div>
      </div>
    `;
  });
  
  componentsHtml += '</div>';
  
  // Adicionar estilo para o preview
  const previewCss = `
    <style>
      .theme-preview-container {
        max-width: 1200px;
        margin: 0 auto;
        padding: 20px;
      }
      .theme-preview-header {
        margin-bottom: 40px;
        text-align: center;
      }
      .theme-preview-component {
        margin-bottom: 60px;
        border: 1px solid #e0e0e0;
        border-radius: 6px;
        overflow: hidden;
      }
      .theme-preview-component-header {
        background: #f5f5f5;
        padding: 15px 20px;
        border-bottom: 1px solid #e0e0e0;
      }
      .theme-preview-component-header h2 {
        margin: 0;
        font-size: 1.25rem;
      }
      .theme-preview-component-header p {
        margin: 5px 0 0 0;
        font-size: 0.875rem;
        opacity: 0.8;
      }
      .theme-preview-component-content {
        padding: 20px;
      }
      .preview-message {
        padding: 40px;
        text-align: center;
        font-size: 1.25rem;
        color: #666;
      }
      .theme-preview-message {
        padding: 15px;
        background: #f8f9fa;
        border-radius: 4px;
        margin-bottom: 10px;
        font-size: 0.875rem;
        color: #666;
      }
    </style>
  `;
  
  // Substituir placeholder e injetar CSS
  return html
    .replace('<!-- CONTENT_PLACEHOLDER -->', componentsHtml)
    .replace('</head>', `${previewCss}</head>`);
}

/**
 * Renderiza um preview de um componente individual
 * @param {Object} component - Componente a renderizar
 * @returns {string} - HTML do componente
 */
function renderComponentPreview(component) {
  try {
    // Extrair template e remover frontmatter
    let template = component.template;
    template = template.replace(/^---\n[\s\S]*?\n---\n/, '');
    
    // Extrair propriedades do schema
    const props = extractDefaultProps(component.schema);
    
    // Substituir referências às propriedades
    Object.keys(props).forEach(key => {
      const value = props[key];
      template = template.replace(new RegExp(`{${key}}`, 'g'), value);
      
      // Substituir condicionais simples
      template = template.replace(
        new RegExp(`{${key} && ([\\s\\S]*?)}`, 'g'), 
        value ? '$1' : ''
      );
    });
    
    // Remover condicionais restantes
    template = template.replace(/{[^{}]+?&&[\s\S]*?}/g, '');
    
    // Remover diretivas Astro
    template = template.replace(/\s+client:.*?(?=\s|>)/g, '');
    
    // Adicionar mensagem para propriedades não identificadas
    const unusedProps = template.match(/{[a-zA-Z0-9_]+}/g);
    if (unusedProps && unusedProps.length > 0) {
      const uniqueUnusedProps = [...new Set(unusedProps)];
      template += `
        <div class="theme-preview-message">
          Este componente possui propriedades não definidas: ${uniqueUnusedProps.join(', ')}
        </div>
      `;
    }
    
    return template;
  } catch (error) {
    console.error('Erro ao renderizar componente:', error);
    return `<div class="theme-preview-message">Erro ao renderizar o componente: ${error.message}</div>`;
  }
}

/**
 * Extrai valores padrão das propriedades do schema
 * @param {Object} schema - Schema do componente
 * @returns {Object} - Objeto com valores padrão
 */
function extractDefaultProps(schema) {
  if (!schema || !schema.properties) {
    return {
      title: 'Título de Exemplo',
      subtitle: 'Subtítulo de exemplo para este componente',
      content: '<p>Conteúdo de exemplo para este componente. Este texto demonstra como o componente renderiza conteúdo.</p>',
      buttonText: 'Botão',
      buttonUrl: '#'
    };
  }
  
  const result = {};
  
  // Extrair valores padrão ou gerar exemplos
  Object.keys(schema.properties).forEach(propName => {
    const prop = schema.properties[propName];
    
    if (prop.default !== undefined) {
      result[propName] = prop.default;
    } else {
      // Gerar valores exemplo baseados no tipo
      switch (prop.type) {
        case 'string':
          if (prop.title.toLowerCase().includes('título')) {
            result[propName] = `Título de exemplo para ${propName}`;
          } else if (prop.title.toLowerCase().includes('subtítulo')) {
            result[propName] = `Subtítulo de exemplo para demonstração`;
          } else if (prop.title.toLowerCase().includes('texto do botão')) {
            result[propName] = 'Botão';
          } else if (prop.title.toLowerCase().includes('url')) {
            result[propName] = '#';
          } else if (prop.format === 'html') {
            result[propName] = '<p>Conteúdo HTML de exemplo para demonstração do componente.</p>';
          } else {
            result[propName] = `Texto de exemplo para ${propName}`;
          }
          break;
        case 'number':
          result[propName] = 42;
          break;
        case 'boolean':
          result[propName] = true;
          break;
        case 'array':
          result[propName] = [
            { title: 'Item 1', description: 'Descrição do item 1' },
            { title: 'Item 2', description: 'Descrição do item 2' }
          ];
          break;
        default:
          result[propName] = `Exemplo de ${propName}`;
      }
    }
  });
  
  return result;
}