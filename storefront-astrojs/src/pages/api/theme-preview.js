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
    const data = await request.json();
    
    if (!data || !data.data) {
      return new Response(
        JSON.stringify({
          success: false,
          error: 'JSON inválido ou incompleto'
        }),
        {
          status: 400,
          headers: { 'Content-Type': 'application/json' }
        }
      );
    }
    
    // Extrair dados do tema
    const themeData = data.data;
    
    // Gerar preview do tema
    const previewResult = await generateThemePreview(themeData, previewMode);
    
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
        error: `Erro ao gerar preview: ${error.message}`
      }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      }
    );
  }
}