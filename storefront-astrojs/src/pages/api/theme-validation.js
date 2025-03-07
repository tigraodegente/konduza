/**
 * Endpoint para validação de temas
 * 
 * Este endpoint é chamado pelo PayloadCMS para validar um tema.
 * Ele verifica a estrutura do tema e retorna o status de validação.
 */

import { validateTheme } from '../../utils/themeValidator';

export const prerender = false;

export async function POST({ request }) {
  console.log('[ThemeValidation API] Recebendo requisição de validação de tema');
  
  try {
    // Verificar autenticação
    const apiKey = request.headers.get('x-api-key');
    const internalApiKey = import.meta.env.INTERNAL_API_KEY || 'dev_api_key';
    
    if (apiKey !== internalApiKey) {
      console.log('[ThemeValidation API] ⛔ Erro de autenticação: Chave de API inválida');
      return new Response(
        JSON.stringify({
          success: false,
          error: 'Não autorizado - Chave de API inválida'
        }),
        {
          status: 401,
          headers: { 'Content-Type': 'application/json' }
        }
      );
    }
    
    // Processar requisição
    const data = await request.json();
    const { themeId } = data;
    
    if (!themeId) {
      console.log('[ThemeValidation API] ⚠️ Parâmetros inválidos: themeId não fornecido');
      return new Response(
        JSON.stringify({
          success: false,
          error: 'Parâmetros inválidos - themeId é obrigatório'
        }),
        {
          status: 400,
          headers: { 'Content-Type': 'application/json' }
        }
      );
    }
    
    console.log(`[ThemeValidation API] Validando tema ID=${themeId}`);
    
    // Realizar validação do tema
    const validationResult = await validateTheme(themeId);
    
    console.log(`[ThemeValidation API] Resultado da validação: ${validationResult.success ? 'Válido ✅' : 'Inválido ❌'}`);
    
    // Retornar resultado da validação
    return new Response(
      JSON.stringify({
        success: validationResult.success,
        validationData: validationResult
      }),
      {
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      }
    );
  } catch (error) {
    console.error('[ThemeValidation API] ❌ Erro durante validação:', error);
    
    return new Response(
      JSON.stringify({
        success: false,
        error: `Erro interno: ${error.message}`
      }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      }
    );
  }
}