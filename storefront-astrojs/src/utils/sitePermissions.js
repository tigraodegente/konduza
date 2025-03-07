/**
 * Verifica se o usuário tem permissão para um recurso em um site específico
 * @param {string} siteId - ID do site
 * @param {string} resource - Recurso (pages, posts, media, etc.)
 * @param {string} action - Ação (read, create, update, delete)
 * @returns {Promise<boolean>} - True se tem permissão, false caso contrário
 */
export async function checkSitePermission(siteId, resource, action) {
  try {
    const apiUrl = import.meta.env.PUBLIC_API_URL || '';
    const response = await fetch(`${apiUrl}/api/check-site-permission`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        siteId,
        resource,
        action
      }),
      credentials: 'include'
    });

    if (!response.ok) {
      console.error('Error checking permission:', response.statusText);
      return false;
    }

    const data = await response.json();
    return data.hasPermission;
  } catch (error) {
    console.error('Failed to check permission:', error);
    return false;
  }
}

/**
 * Obtém todas as permissões do usuário para um site específico
 * @param {string} siteId - ID do site
 * @returns {Promise<Object>} - Objeto com informações da role do usuário
 */
export async function getUserSiteRole(siteId) {
  try {
    const apiUrl = import.meta.env.PUBLIC_API_URL || '';
    const response = await fetch(`${apiUrl}/api/user-site-role?siteId=${siteId}`, {
      credentials: 'include'
    });

    if (!response.ok) {
      console.error('Error fetching user site role:', response.statusText);
      return null;
    }

    const data = await response.json();
    return data.success ? (data.role || null) : null;
  } catch (error) {
    console.error('Failed to fetch user site role:', error);
    return null;
  }
}

/**
 * Obtém todos os sites aos quais o usuário tem acesso
 * @returns {Promise<Array>} - Array de sites com suas permissões
 */
export async function getUserSites() {
  try {
    const apiUrl = import.meta.env.PUBLIC_API_URL || '';
    const response = await fetch(`${apiUrl}/api/user-sites`, {
      credentials: 'include'
    });

    if (!response.ok) {
      console.error('Error fetching user sites:', response.statusText);
      return [];
    }

    const data = await response.json();
    return data.success ? (data.sites || []) : [];
  } catch (error) {
    console.error('Failed to fetch user sites:', error);
    return [];
  }
}