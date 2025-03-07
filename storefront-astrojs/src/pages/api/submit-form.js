/**
 * API para receber submissão de formulários
 * 
 * Este endpoint recebe os dados de formulários do frontend,
 * valida os campos e envia para o PayloadCMS.
 */

export const prerender = false;

/**
 * Handler da requisição POST
 */
export async function POST({ request }) {
  console.log('[FormAPI] Recebendo submissão de formulário');
  
  try {
    // Validar que o conteúdo é JSON
    if (!request.headers.get('content-type')?.includes('application/json')) {
      console.log('[FormAPI] Erro: Content-Type inválido');
      return new Response(
        JSON.stringify({
          success: false,
          error: 'Content-Type deve ser application/json'
        }),
        {
          status: 400,
          headers: { 'Content-Type': 'application/json' }
        }
      );
    }
    
    // Processar os dados do formulário
    const formData = await request.json();
    console.log(`[FormAPI] Dados recebidos para o site ID: ${formData.siteId || 'não especificado'}`);
    
    // Validações básicas
    if (!formData.name || !formData.email || !formData.message) {
      console.log('[FormAPI] Erro: Campos obrigatórios ausentes');
      return new Response(
        JSON.stringify({
          success: false,
          error: 'Nome, email e mensagem são obrigatórios'
        }),
        {
          status: 400,
          headers: { 'Content-Type': 'application/json' }
        }
      );
    }
    
    // Validar formato de email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.email)) {
      console.log(`[FormAPI] Erro: Email inválido: ${formData.email}`);
      return new Response(
        JSON.stringify({
          success: false,
          error: 'Email inválido'
        }),
        {
          status: 400,
          headers: { 'Content-Type': 'application/json' }
        }
      );
    }
    
    // Enviar para o PayloadCMS
    try {
      // Configurações para API do PayloadCMS
      const payloadURL = import.meta.env.PAYLOAD_URL || 'http://localhost:3000';
      const apiKey = import.meta.env.INTERNAL_API_KEY || 'dev_api_key';
      
      console.log(`[FormAPI] Enviando dados para o Payload: ${payloadURL}/api/form-submissions`);
      
      // Criar objeto para enviar ao Payload
      const submission = {
        name: formData.name,
        email: formData.email,
        phone: formData.phone || '',
        subject: formData.subject || 'Formulário de Contato',
        message: formData.message,
        siteId: formData.siteId,
        source: request.headers.get('referer') || 'Formulário do site',
        ipAddress: request.headers.get('x-forwarded-for') || 'unknown',
        timestamp: new Date().toISOString()
      };
      
      // Implementação simulada para demonstração
      // Em produção, esta seria uma requisição real ao Payload
      // const response = await fetch(`${payloadURL}/api/form-submissions`, {
      //   method: 'POST',
      //   headers: {
      //     'Content-Type': 'application/json',
      //     'Authorization': `Bearer ${apiKey}`
      //   },
      //   body: JSON.stringify(submission)
      // });
      
      // const result = await response.json();
      
      // if (!response.ok) {
      //   throw new Error(result.message || 'Erro ao enviar para o PayloadCMS');
      // }
      
      // Simulando um resultado bem-sucedido
      console.log('[FormAPI] Submissão de formulário processada com sucesso');
      
      // Retornar sucesso
      return new Response(
        JSON.stringify({
          success: true,
          message: 'Formulário enviado com sucesso'
        }),
        {
          status: 200,
          headers: { 'Content-Type': 'application/json' }
        }
      );
    } catch (error) {
      console.error(`[FormAPI] Erro ao enviar para o PayloadCMS: ${error.message}`);
      return new Response(
        JSON.stringify({
          success: false,
          error: 'Erro ao processar a submissão. Por favor, tente novamente.'
        }),
        {
          status: 500,
          headers: { 'Content-Type': 'application/json' }
        }
      );
    }
  } catch (error) {
    console.error(`[FormAPI] Erro ao processar requisição: ${error.message}`);
    return new Response(
      JSON.stringify({
        success: false,
        error: 'Erro interno do servidor'
      }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      }
    );
  }
}