import fs from 'fs/promises';
import path from 'path';

export async function POST({ request }) {
  try {
    // Verificar a chave de API
    const apiKey = request.headers.get('x-api-key');
    if (apiKey !== import.meta.env.INTERNAL_API_KEY) {
      return new Response(
        JSON.stringify({ success: false, error: 'Chave de API inválida' }),
        { status: 401, headers: { 'Content-Type': 'application/json' } }
      );
    }
    
    // Obter dados da requisição
    const { theme, operation } = await request.json();
    
    if (!theme || !theme.slug) {
      return new Response(
        JSON.stringify({ success: false, error: 'Dados do tema inválidos' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }
    
    // Processar o tema
    await processTheme(theme);
    
    return new Response(
      JSON.stringify({ 
        success: true, 
        message: `Tema ${theme.name} ${operation === 'create' ? 'criado' : 'atualizado'} com sucesso` 
      }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Erro ao processar tema:', error);
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}

/**
 * Processa um tema, gerando arquivos necessários
 * 
 * @param {Object} theme Tema a ser processado
 */
async function processTheme(theme) {
  // Caminho base para os temas
  const themeDir = path.join(process.cwd(), 'public', 'themes', theme.slug);
  
  try {
    // Criar diretório do tema se não existir
    await fs.mkdir(path.join(themeDir), { recursive: true });
    
    // Criar subdiretórios
    await fs.mkdir(path.join(themeDir, 'css'), { recursive: true });
    await fs.mkdir(path.join(themeDir, 'js'), { recursive: true });
    await fs.mkdir(path.join(themeDir, 'assets'), { recursive: true });
    
    // Gerar arquivos CSS
    if (theme.assets) {
      // CSS de variáveis
      if (theme.assets.variablesCSS) {
        await fs.writeFile(
          path.join(themeDir, 'css', 'variables.css'),
          theme.assets.variablesCSS
        );
      }
      
      // CSS base
      if (theme.assets.baseCSS) {
        await fs.writeFile(
          path.join(themeDir, 'css', 'base.css'),
          theme.assets.baseCSS
        );
      }
      
      // CSS de utilitários
      if (theme.assets.utilitiesCSS) {
        await fs.writeFile(
          path.join(themeDir, 'css', 'utilities.css'),
          theme.assets.utilitiesCSS
        );
      }
      
      // JavaScript global
      if (theme.assets.globalJS) {
        await fs.writeFile(
          path.join(themeDir, 'js', 'theme.js'),
          theme.assets.globalJS
        );
      }
    }
    
    // Gerar CSS dos componentes
    if (theme.components && theme.components.length > 0) {
      const componentsCSS = theme.components
        .map(component => component.css || '')
        .filter(css => css !== '')
        .join('\n\n');
      
      await fs.writeFile(
        path.join(themeDir, 'css', 'components.css'),
        componentsCSS
      );
    }
    
    // Criar manifesto do tema (para validação e carregamento dinâmico)
    const manifest = {
      name: theme.name,
      slug: theme.slug,
      version: theme.version,
      description: theme.description,
      author: theme.author,
      templates: (theme.templates || []).map(template => ({
        name: template.name,
        slug: template.slug,
        regions: (template.regions || []).map(region => region.name)
      })),
      components: (theme.components || []).map(component => ({
        name: component.name,
        slug: component.slug,
        category: component.category,
        hydration: component.hydration || 'none'
      })),
      createdAt: new Date().toISOString()
    };
    
    await fs.writeFile(
      path.join(themeDir, 'manifest.json'),
      JSON.stringify(manifest, null, 2)
    );
    
    console.log(`✅ Tema "${theme.name}" processado com sucesso`);
  } catch (error) {
    console.error(`❌ Erro ao processar tema "${theme.name}":`, error);
    throw error;
  }
}