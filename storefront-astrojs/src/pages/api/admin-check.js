/**
 * Endpoint para verificar se um usuário está autenticado e tem permissões de administrador
 * 
 * Este endpoint funciona como uma ponte para o endpoint /api/users/me do Payload
 * e verifica se o usuário tem a role de admin.
 */

// Configurações
const API_URL = import.meta.env.PAYLOAD_URL || 'http://localhost:3000';
const API_KEY = import.meta.env.INTERNAL_API_KEY || 'dev_api_key';

export async function GET({ request }) {
  try {
    // Verificar se existe um cookie de autenticação
    const cookie = request.headers.get('cookie');
    if (!cookie) {
      return new Response(
        JSON.stringify({
          authenticated: false,
          message: 'Não autenticado'
        }),
        {
          status: 401,
          headers: {
            'Content-Type': 'application/json'
          }
        }
      );
    }

    // Chamar a API /api/users/me do Payload para obter o usuário atual
    const response = await fetch(`${API_URL}/api/users/me`, {
      method: 'GET',
      credentials: 'include', // Importante para incluir cookies
      headers: {
        'X-API-Key': API_KEY
      }
    });

    if (!response.ok) {
      return new Response(
        JSON.stringify({
          authenticated: false,
          message: 'Sessão inválida'
        }),
        {
          status: 401,
          headers: {
            'Content-Type': 'application/json'
          }
        }
      );
    }

    // Processar resposta
    const userData = await response.json();

    // Verificar se o usuário tem a role de admin
    const hasAdminRole = userData.user && userData.user.roles?.includes('admin');

    if (!hasAdminRole) {
      return new Response(
        JSON.stringify({
          authenticated: true,
          authorized: false,
          message: 'Acesso negado. Você não tem permissões de administrador.'
        }),
        {
          status: 403,
          headers: {
            'Content-Type': 'application/json'
          }
        }
      );
    }

    // Retornar informações do usuário logado (sem dados sensíveis)
    return new Response(
      JSON.stringify({
        authenticated: true,
        authorized: true,
        message: 'Autenticado como administrador',
        user: {
          id: userData.user.id,
          email: userData.user.email,
          name: userData.user.name,
          roles: userData.user.roles
        }
      }),
      {
        status: 200,
        headers: {
          'Content-Type': 'application/json'
        }
      }
    );
  } catch (error) {
    console.error('[AdminCheck] Erro ao verificar sessão admin:', error);
    
    return new Response(
      JSON.stringify({
        authenticated: false,
        message: 'Erro ao verificar autenticação',
        error: error.message
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