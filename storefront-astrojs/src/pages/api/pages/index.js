import { invalidateCache } from '../../../utils/cache';

export async function post({ request }) {
  try {
    // Verificar API Key
    const apiKey = request.headers.get('X-API-Key');
    
    // Obter dados da página
    const data = await request.json();
    const { title, path, template, status, type, siteId, seo } = data;
    
    // Validar campos obrigatórios
    if (!title || !path || !template || !status || !siteId) {
      return new Response(JSON.stringify({ 
        error: 'Campos obrigatórios: title, path, template, status, siteId' 
      }), {
        status: 400,
        headers: {
          'Content-Type': 'application/json'
        }
      });
    }
    
    // Validar formato do path
    const pathRegex = /^[a-z0-9-]+$/;
    if (!pathRegex.test(path) && path !== 'home') {
      return new Response(JSON.stringify({ 
        error: 'O caminho deve conter apenas letras minúsculas, números e hífens' 
      }), {
        status: 400,
        headers: {
          'Content-Type': 'application/json'
        }
      });
    }
    
    // Preparar dados para envio ao PayloadCMS
    const pageData = {
      title,
      path,
      template,
      status,
      type: 'page',
      siteId,
      seo: seo || {}
    };
    
    // Fazer requisição para criar a página no PayloadCMS
    const API_URL = import.meta.env.PAYLOAD_URL || 'http://localhost:3000';
    const API_KEY = import.meta.env.INTERNAL_API_KEY;
    
    const res = await fetch(`${API_URL}/api/entities`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-API-Key': API_KEY
      },
      body: JSON.stringify(pageData)
    });
    
    if (!res.ok) {
      const errorData = await res.json();
      return new Response(JSON.stringify({ 
        error: 'Falha ao criar página', 
        details: errorData 
      }), {
        status: res.status,
        headers: {
          'Content-Type': 'application/json'
        }
      });
    }
    
    const newPage = await res.json();
    
    // Invalidar cache para lista de páginas do site
    await invalidateCache(`site-pages:${siteId}`, siteId);
    
    return new Response(JSON.stringify({
      success: true,
      message: 'Página criada com sucesso',
      id: newPage.id
    }), {
      status: 201,
      headers: {
        'Content-Type': 'application/json'
      }
    });
  } catch (error) {
    console.error('Error creating page:', error);
    
    return new Response(JSON.stringify({ 
      error: 'Internal server error', 
      message: error.message 
    }), {
      status: 500,
      headers: {
        'Content-Type': 'application/json'
      }
    });
  }
}