import { invalidateCache } from '../../utils/cache';

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
    const { site, operation } = await request.json();
    
    if (!site || !site.id) {
      return new Response(
        JSON.stringify({ success: false, error: 'Dados do site inválidos' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }
    
    // Invalidar cache do site
    await invalidateCache('site', site.domain);
    
    // Invalidar cache de todas as páginas do site
    await invalidateCache('page:', site.id);
    
    return new Response(
      JSON.stringify({ 
        success: true, 
        message: `Site ${site.name} ${operation === 'create' ? 'criado' : 'atualizado'} e caches invalidados com sucesso` 
      }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Erro ao processar atualização de site:', error);
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}