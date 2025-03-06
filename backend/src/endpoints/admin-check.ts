import { Endpoint } from 'payload/config';

/**
 * Endpoint para verificar se um usuário está autenticado e tem permissões de administrador
 */
const adminCheckEndpoint: Endpoint = {
  path: '/admin-check', // Sem prefixo /api que é adicionado automaticamente pelo Payload
  method: 'get',
  handler: (req) => {
    try {
      // Primeiro verifica se o usuário está autenticado
      if (!req.user) {
        return {
          status: 200,
          body: JSON.stringify({
            authenticated: false,
            message: 'Não autenticado'
          })
        }
      }

      // Verifica se o usuário tem a role de admin
      const hasAdminRole = req.user.roles?.includes('admin');
      
      if (!hasAdminRole) {
        return {
          status: 200,
          body: JSON.stringify({
            authenticated: true,
            authorized: false,
            message: 'Acesso negado. Você não tem permissões de administrador.'
          })
        }
      }

      // Retorna informações do usuário logado (sem dados sensíveis)
      return {
        status: 200,
        body: JSON.stringify({
          authenticated: true,
          authorized: true,
          message: 'Autenticado como administrador',
          user: {
            id: req.user.id,
            email: req.user.email,
            name: req.user.name,
            roles: req.user.roles
          }
        })
      }
    } catch (error) {
      console.error('[AdminCheck] Erro ao verificar sessão admin:', error);
      return {
        status: 500,
        body: JSON.stringify({
          authenticated: false,
          message: 'Erro ao verificar autenticação',
          error: error.message
        })
      }
    }
  }
};

export default adminCheckEndpoint;