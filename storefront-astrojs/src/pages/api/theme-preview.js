/**
 * Endpoint para geração de preview de temas
 * 
 * Gera um HTML de preview para um tema a partir do JSON,
 * sem necessidade de importar o tema para o sistema.
 */

import { generateThemePreview } from '../../utils/themePreviewGenerator.js';

export const prerender = false;

export async function POST({ request }) {
  console.log('[ThemePreview API] Recebendo requisição de preview');
  
  try {
    // Verificar o modo de preview solicitado
    const previewMode = request.headers.get('X-Preview-Mode') || 'preview';
    
    // Processar requisição
    let data;
    try {
      data = await request.json();
    } catch (error) {
      console.error('[ThemePreview API] Erro ao processar JSON:', error);
      return new Response(
        JSON.stringify({
          success: false,
          error: 'JSON inválido no corpo da requisição'
        }),
        {
          status: 400,
          headers: { 'Content-Type': 'application/json' }
        }
      );
    }
    
    // Verificar se o JSON está vazio
    if (!data) {
      console.warn('[ThemePreview API] Dados vazios recebidos');
      return new Response(
        JSON.stringify({
          success: false,
          error: 'Dados vazios recebidos'
        }),
        {
          status: 400,
          headers: { 'Content-Type': 'application/json' }
        }
      );
    }
    
    // Extrair dados do tema - lidar com diferentes formatos
    let themeData;
    if (data.type === 'themes' && data.data) {
      themeData = data.data;
    } else if (data.data) {
      themeData = data.data;
    } else {
      themeData = data;
    }
    
    // Gerar preview do tema
    const previewResult = await generateThemePreview(themeData, previewMode);
    
    // Verificar se o preview foi gerado com sucesso
    if (!previewResult.success) {
      console.warn(`[ThemePreview API] Falha ao gerar preview: ${previewResult.error}`);
      return new Response(
        JSON.stringify(previewResult),
        {
          status: 400,
          headers: { 'Content-Type': 'application/json' }
        }
      );
    }
    
    console.log(`[ThemePreview API] Preview gerado com sucesso (modo: ${previewMode})`);
    
    // Retornar resultado do preview
    return new Response(
      JSON.stringify(previewResult),
      {
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      }
    );
  } catch (error) {
    console.error('[ThemePreview API] Erro:', error);
    
    return new Response(
      JSON.stringify({
        success: false,
        error: `Erro ao gerar preview: ${error.message || 'Erro desconhecido'}`
      }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      }
    );
  }
}