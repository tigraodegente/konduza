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
    const { type, id, siteId } = await request.json();
    
    if (!type) {
      return new Response(
        JSON.stringify({ success: false, error: 'Tipo não especificado' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }
    
    // Invalidar cache conforme o tipo
    switch (type) {
      case 'template':
        await invalidateCache(`template:${id}`, 'global');
        break;
      case 'component':
        await invalidateCache(`component:${id}`, 'global');
        break;
      case 'page':
        if (!siteId) {
          return new Response(
            JSON.stringify({ success: false, error: 'siteId é obrigatório para páginas' }),
            { status: 400, headers: { 'Content-Type': 'application/json' } }
          );
        }
        await invalidateCache('page:', siteId);
        break;
      case 'site':
        if (!siteId) {
          return new Response(
            JSON.stringify({ success: false, error: 'siteId é obrigatório para sites' }),
            { status: 400, headers: { 'Content-Type': 'application/json' } }
          );
        }
        await invalidateCache('site', siteId);
        break;
      default:
        return new Response(
          JSON.stringify({ success: false, error: `Tipo inválido: ${type}` }),
          { status: 400, headers: { 'Content-Type': 'application/json' } }
        );
    }
    
    return new Response(
      JSON.stringify({ success: true, message: `Cache invalidado para ${type}:${id}` }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Erro ao invalidar cache:', error);
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}