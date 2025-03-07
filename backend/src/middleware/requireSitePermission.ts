import { PayloadRequest } from 'payload/types';
import { Response, NextFunction } from 'express';
import payload from 'payload';

export const requireSitePermission = (resource: string, action: string) => {
  return async (req: PayloadRequest, res: Response, next: NextFunction) => {
    try {
      // Obter ID do site da rota ou query param
      const siteId = req.params.siteId || req.query.siteId;
      
      if (!siteId) {
        return res.status(400).json({
          success: false,
          message: 'Site ID is required'
        });
      }

      const user = req.user;
      
      if (!user) {
        return res.status(401).json({
          success: false,
          message: 'Unauthorized: User not authenticated'
        });
      }

      // Verificar se o usuário é admin global
      if (user.roles && user.roles.includes('admin')) {
        return next();
      }

      // Buscar atribuição do usuário para o site
      const siteUserAssignment = await payload.find({
        collection: 'site-user-assignments',
        where: {
          and: [
            { user: { equals: user.id } },
            { site: { equals: siteId } },
            { isActive: { equals: true } }
          ]
        },
        limit: 1
      });

      if (!siteUserAssignment.docs || siteUserAssignment.docs.length === 0) {
        return res.status(403).json({
          success: false,
          message: 'Forbidden: User has no assignment for this site'
        });
      }

      const assignment = siteUserAssignment.docs[0];

      // Buscar role do usuário
      const roleId = assignment.role;
      const role = await payload.findByID({
        collection: 'site-user-roles',
        id: roleId
      });

      if (!role) {
        return res.status(403).json({
          success: false,
          message: 'Forbidden: Role not found'
        });
      }

      // Verificar permissões
      const permissions = role.permissions || [];
      const hasPermission = permissions.some(perm => 
        perm.resource === resource && perm.actions.includes(action)
      );

      if (!hasPermission) {
        return res.status(403).json({
          success: false,
          message: `Forbidden: Insufficient permissions for ${resource}:${action}`
        });
      }

      // Adicionar informações de role ao request para uso posterior
      req.siteRole = role;
      req.siteAssignment = assignment;
      
      return next();
    } catch (error) {
      console.error('Error in requireSitePermission middleware:', error);
      return res.status(500).json({
        success: false,
        message: 'Server error checking site permission'
      });
    }
  };
};

export default requireSitePermission;