import { useState, useEffect } from 'react';
import { checkSitePermission } from '../../utils/sitePermissions';

/**
 * Componente para renderização condicional baseada em permissões de site
 * @param {Object} props - Propriedades do componente
 * @param {string} props.siteId - ID do site
 * @param {string} props.resource - Recurso a verificar permissão (pages, posts, media, etc.)
 * @param {string} props.action - Ação a verificar permissão (read, create, update, delete)
 * @param {React.ReactNode} props.children - Conteúdo a renderizar se tiver permissão
 * @param {React.ReactNode} props.fallback - Conteúdo a renderizar se não tiver permissão
 */
export default function ConditionalAccess({ 
  siteId, 
  resource, 
  action, 
  children, 
  fallback = null 
}) {
  const [hasPermission, setHasPermission] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function checkAccess() {
      if (!siteId || !resource || !action) {
        setHasPermission(false);
        setLoading(false);
        return;
      }
      
      try {
        const permitted = await checkSitePermission(siteId, resource, action);
        setHasPermission(permitted);
      } catch (error) {
        console.error('Error checking permissions:', error);
        setHasPermission(false);
      } finally {
        setLoading(false);
      }
    }
    
    checkAccess();
  }, [siteId, resource, action]);

  if (loading) {
    // Render loading state
    return <div className="loading-indicator">Verificando permissões...</div>;
  }

  return hasPermission ? children : fallback;
}