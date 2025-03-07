import { invalidateCache } from '../../utils/cache';

export async function post({ request }) {
  try {
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

    // Obter dados da página
    const data = await request.json();
    const { pageId, siteId, regions } = data;

    if (!pageId || !siteId || !regions) {
      return new Response(JSON.stringify({ error: 'Missing required fields' }), {
        status: 400,
        headers: {
          'Content-Type': 'application/json'
        }
      });
    }

    // Salvar dados no PayloadCMS
    const API_URL = import.meta.env.PAYLOAD_URL || 'http://localhost:3000';
    const API_KEY = import.meta.env.INTERNAL_API_KEY;

    const res = await fetch(`${API_URL}/api/entities/${pageId}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        'X-API-Key': API_KEY
      },
      body: JSON.stringify({
        regions
      })
    });

    if (!res.ok) {
      const errorData = await res.json();
      return new Response(JSON.stringify({ error: 'Failed to save page', details: errorData }), {
        status: res.status,
        headers: {
          'Content-Type': 'application/json'
        }
      });
    }

    // Invalidar cache para esta página
    await invalidateCache(`page:${pageId}`, siteId);

    return new Response(JSON.stringify({ success: true, message: 'Page saved successfully' }), {
      status: 200,
      headers: {
        'Content-Type': 'application/json'
      }
    });
  } catch (error) {
    console.error('Error saving page:', error);

    return new Response(JSON.stringify({ error: 'Internal server error', message: error.message }), {
      status: 500,
      headers: {
        'Content-Type': 'application/json'
      }
    });
  }
}