/**
 * Endpoint para importação de temas
 * 
 * Este endpoint recebe o JSON do tema da interface admin e o envia
 * para o endpoint de importação de dados do backend do Payload.
 */

// import { getAdminSession } from '../../utils/api.js'; // Não usado mais

// Configurações
const API_URL = import.meta.env.PAYLOAD_URL || 'http://localhost:3000';
const INTERNAL_API_KEY = import.meta.env.INTERNAL_API_KEY || 'dev_api_key';

// Função para enviar o tema para o Payload
async function sendToPayload(themeData) {
  try {
    // Configurar headers
    const headers = {
      'Content-Type': 'application/json', 
      'X-API-Key': INTERNAL_API_KEY
    };
    
    // Enviar para o endpoint de importação de dados
    // O endpoint correto é /api/import-data
    const response = await fetch(`${API_URL}/api/import-data`, {
      method: 'POST',
      headers,
      body: JSON.stringify(themeData)
    });
    
    // Log para debug da resposta
    console.log(`[ThemeImport] Status da resposta: ${response.status}`, 
                `Headers: ${JSON.stringify([...response.headers])}`);
    
    // Verificar se a resposta está vazia
    const text = await response.text();
    if (!text || text.trim() === '') {
      console.error('[ThemeImport] ⚠️ Resposta vazia do servidor');
      return {
        data: { success: false, error: 'Resposta vazia do servidor' },
        status: response.status || 500
      };
    }
    
    try {
      // Converter texto para JSON
      const result = JSON.parse(text);
      
      // Retornar resultado e status
      return {
        data: result,
        status: response.status
      };
    } catch (jsonError) {
      console.error('[ThemeImport] ⚠️ Erro ao processar JSON:', jsonError, 'Resposta:', text);
      return {
        data: { success: false, error: `Resposta inválida: ${text.substring(0, 100)}...` },
        status: response.status || 500
      };
    }
  } catch (error) {
    console.error('[ThemeImport] ❌ Erro ao enviar tema para o Payload:', error);
    throw error;
  }
}

// Handler principal
export async function POST({ request }) {
  console.log('[ThemeImport] 📥 Recebida requisição para importação de tema');
  
  try {
    // Nota: Autenticação via API key é suficiente para este endpoint
    // Em produção, implementaríamos verificação de sessão mais robusta
    console.log('[ThemeImport] 🔑 Autenticação via API key');
    
    // Obter dados da requisição
    const themeData = await request.json();
    
    // Verificar se o tema foi fornecido
    if (!themeData || !themeData.type || !themeData.data) {
      console.log('[ThemeImport] ⚠️ Dados inválidos:', JSON.stringify(themeData, null, 2));
      return new Response(
        JSON.stringify({
          success: false,
          error: 'Dados do tema inválidos ou incompletos'
        }),
        {
          status: 400,
          headers: {
            'Content-Type': 'application/json'
          }
        }
      );
    }
    
    console.log(`[ThemeImport] 🔍 Processando tema: ${themeData.data.name}`);
    
    // Enviar para o Payload
    const result = await sendToPayload(themeData);
    
    // Processar resposta
    if (result.status >= 200 && result.status < 300) {
      console.log('[ThemeImport] ✅ Tema importado com sucesso:', result.data);
      return new Response(
        JSON.stringify(result.data),
        {
          status: result.status,
          headers: {
            'Content-Type': 'application/json'
          }
        }
      );
    } else {
      console.log('[ThemeImport] ❌ Erro ao importar tema:', result.data);
      return new Response(
        JSON.stringify(result.data),
        {
          status: result.status,
          headers: {
            'Content-Type': 'application/json'
          }
        }
      );
    }
  } catch (error) {
    console.error('[ThemeImport] 🐞 Erro:', error);
    
    return new Response(
      JSON.stringify({
        success: false,
        error: `Erro ao processar requisição: ${error.message}`
      }),
      {
        status: 500,
        headers: {
          'Content-Type': 'application/json'
        }
      }
    );
  }
}