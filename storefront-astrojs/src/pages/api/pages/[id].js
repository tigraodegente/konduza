import { invalidateCache } from '../../../utils/cache';

export function get({ params }) {
  // API endpoint para obter uma página por ID
  return new Response(JSON.stringify({
    error: 'Not implemented'
  }), {
    status: 501,
    headers: {
      'Content-Type': 'application/json'
    }
  });
}

export async function del({ params, request }) {
  try {
    const { id } = params;
    
    // Verificar API Key
    const apiKey = request.headers.get('X-API-Key');
    if (apiKey !== import.meta.env.INTERNAL_API_KEY) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: {
          'Content-Type': 'application/json'
        }
      });
    }
    
    if (!id) {
      return new Response(JSON.stringify({ error: 'Missing page ID' }), {
        status: 400,
        headers: {
          'Content-Type': 'application/json'
        }
      });
    }
    
    // Fazer requisição para excluir a página no PayloadCMS
    const API_URL = import.meta.env.PAYLOAD_URL || 'http://localhost:3000';
    const API_KEY = import.meta.env.INTERNAL_API_KEY;
    
    // Primeiro, buscar a página para obter o siteId (necessário para invalidar o cache)
    const getRes = await fetch(`${API_URL}/api/entities/${id}`, {
      headers: {
        'X-API-Key': API_KEY
      }
    });
    
    if (!getRes.ok) {
      return new Response(JSON.stringify({ error: 'Failed to find page' }), {
        status: getRes.status,
        headers: {
          'Content-Type': 'application/json'
        }
      });
    }
    
    const page = await getRes.json();
    const siteId = page.siteId;
    
    // Agora, excluir a página
    const deleteRes = await fetch(`${API_URL}/api/entities/${id}`, {
      method: 'DELETE',
      headers: {
        'X-API-Key': API_KEY
      }
    });
    
    if (!deleteRes.ok) {
      return new Response(JSON.stringify({ error: 'Failed to delete page' }), {
        status: deleteRes.status,
        headers: {
          'Content-Type': 'application/json'
        }
      });
    }
    
    // Invalidar cache para esta página e para a lista de páginas do site
    await invalidateCache(`page:${id}`, siteId);
    await invalidateCache(`page:${page.path}`, siteId);
    await invalidateCache(`site-pages:${siteId}`, siteId);
    
    return new Response(JSON.stringify({ success: true, message: 'Page deleted successfully' }), {
      status: 200,
      headers: {
        'Content-Type': 'application/json'
      }
    });
  } catch (error) {
    console.error('Error deleting page:', error);
    
    return new Response(JSON.stringify({ error: 'Internal server error', message: error.message }), {
      status: 500,
      headers: {
        'Content-Type': 'application/json'
      }
    });
  }
}