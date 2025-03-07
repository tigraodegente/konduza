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
    const { themeId } = await request.json();
    
    if (!themeId) {
      return new Response(
        JSON.stringify({ success: false, error: 'ID do tema não especificado' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }
    
    // Buscar tema do PayloadCMS
    const theme = await fetchTheme(themeId);
    if (!theme) {
      return new Response(
        JSON.stringify({ success: false, error: 'Tema não encontrado' }),
        { status: 404, headers: { 'Content-Type': 'application/json' } }
      );
    }
    
    // Validar o tema
    const validationResult = await validateTheme(theme);
    
    // Enviar resultados de volta para o PayloadCMS
    await updateThemeValidation(themeId, validationResult);
    
    return new Response(
      JSON.stringify({ 
        success: true, 
        message: `Tema ${theme.name} validado com status: ${validationResult.status}`,
        validationResult
      }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Erro ao validar tema:', error);
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}

/**
 * Busca o tema do PayloadCMS
 * 
 * @param {string} themeId ID do tema
 * @returns {Promise<Object|null>} Dados do tema ou null se não existir
 */
async function fetchTheme(themeId) {
  try {
    const API_URL = import.meta.env.PAYLOAD_URL || 'http://localhost:3000';
    const API_KEY = import.meta.env.INTERNAL_API_KEY;
    
    const response = await fetch(`${API_URL}/api/themes/${themeId}`, {
      headers: {
        'X-API-Key': API_KEY,
      },
    });
    
    if (!response.ok) {
      console.error(`Erro ao buscar tema: ${response.status} ${response.statusText}`);
      return null;
    }
    
    return await response.json();
  } catch (error) {
    console.error('Erro ao buscar tema:', error);
    return null;
  }
}

/**
 * Valida um tema
 * 
 * @param {Object} theme Tema a ser validado
 * @returns {Promise<Object>} Resultados da validação
 */
async function validateTheme(theme) {
  const errors = [];
  const warnings = [];
  
  // Validar campos obrigatórios
  if (!theme.name) {
    errors.push('Nome do tema é obrigatório');
  }
  
  if (!theme.slug) {
    errors.push('Slug do tema é obrigatório');
  }
  
  // Validar templates
  if (!theme.templates || theme.templates.length === 0) {
    errors.push('O tema deve ter pelo menos um template');
  } else {
    for (let i = 0; i < theme.templates.length; i++) {
      const template = theme.templates[i];
      
      if (!template.name) {
        errors.push(`Template #${i + 1}: Nome é obrigatório`);
      }
      
      if (!template.slug) {
        errors.push(`Template #${i + 1}: Slug é obrigatório`);
      }
      
      if (!template.html) {
        errors.push(`Template #${i + 1}: HTML é obrigatório`);
      }
      
      if (!template.regions || template.regions.length === 0) {
        warnings.push(`Template #${i + 1}: Não tem regiões definidas`);
      }
    }
  }
  
  // Validar componentes
  if (!theme.components || theme.components.length === 0) {
    warnings.push('O tema não tem componentes definidos');
  } else {
    for (let i = 0; i < theme.components.length; i++) {
      const component = theme.components[i];
      
      if (!component.name) {
        errors.push(`Componente #${i + 1}: Nome é obrigatório`);
      }
      
      if (!component.slug) {
        errors.push(`Componente #${i + 1}: Slug é obrigatório`);
      }
      
      if (!component.html) {
        errors.push(`Componente #${i + 1}: HTML é obrigatório`);
      }
    }
  }
  
  // Validar assets
  if (!theme.assets) {
    warnings.push('O tema não tem assets definidos');
  } else {
    if (!theme.assets.baseCSS) {
      warnings.push('O tema não tem CSS base definido');
    }
    
    if (!theme.assets.variablesCSS) {
      warnings.push('O tema não tem variáveis CSS definidas');
    }
  }
  
  // Verificar diretórios do tema
  const themeDir = path.join(process.cwd(), 'public', 'themes', theme.slug);
  try {
    await fs.access(themeDir);
  } catch (error) {
    errors.push(`Diretório do tema não existe: ${themeDir}`);
  }
  
  // Determinar status da validação
  const status = errors.length > 0 ? 'error' : 'success';
  
  // Retornar resultados da validação
  return {
    status,
    errors,
    warnings,
    timestamp: new Date().toISOString(),
  };
}

/**
 * Atualiza o status de validação do tema no PayloadCMS
 * 
 * @param {string} themeId ID do tema
 * @param {Object} validationResult Resultados da validação
 * @returns {Promise<void>}
 */
async function updateThemeValidation(themeId, validationResult) {
  try {
    const API_URL = import.meta.env.PAYLOAD_URL || 'http://localhost:3000';
    const API_KEY = import.meta.env.INTERNAL_API_KEY;
    
    const response = await fetch(`${API_URL}/api/theme-validation`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-API-Key': API_KEY,
      },
      body: JSON.stringify({
        themeId,
        validationStatus: validationResult.status,
        validationData: validationResult,
      }),
    });
    
    if (!response.ok) {
      console.error(`Erro ao atualizar validação: ${response.status} ${response.statusText}`);
      throw new Error('Erro ao atualizar validação do tema');
    }
    
    return await response.json();
  } catch (error) {
    console.error('Erro ao atualizar validação:', error);
    throw error;
  }
}