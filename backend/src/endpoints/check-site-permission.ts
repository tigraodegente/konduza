import { PayloadRequest } from 'payload/types';
import { Response } from 'express';
import payload from 'payload';

export const checkSitePermission = async (req: PayloadRequest, res: Response) => {
  try {
    const { siteId, resource, action } = req.body;
    const user = req.user;

    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Unauthorized: User not authenticated'
      });
    }

    if (!siteId || !resource || !action) {
      return res.status(400).json({
        success: false,
        message: 'Bad request: Missing required parameters'
      });
    }

    // Verificar se o usuário é admin global
    if (user.roles && user.roles.includes('admin')) {
      return res.status(200).json({
        success: true,
        hasPermission: true,
        message: 'User has global admin permission'
      });
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
      return res.status(200).json({
        success: true,
        hasPermission: false,
        message: 'User has no assignment for this site'
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
      return res.status(200).json({
        success: true,
        hasPermission: false,
        message: 'Role not found'
      });
    }

    // Verificar permissões
    const permissions = role.permissions || [];
    const hasPermission = permissions.some(perm => 
      perm.resource === resource && perm.actions.includes(action)
    );

    return res.status(200).json({
      success: true,
      hasPermission,
      message: hasPermission ? 'Permission granted' : 'Permission denied'
    });
  } catch (error) {
    console.error('Error checking site permission:', error);
    return res.status(500).json({
      success: false,
      message: 'Server error checking permission'
    });
  }
};

export default checkSitePermission;