import { PayloadRequest } from 'payload/types';
import { Response } from 'express';
import payload from 'payload';

export const getUserSiteRole = async (req: PayloadRequest, res: Response) => {
  try {
    const { siteId } = req.query;
    const user = req.user;

    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Unauthorized: User not authenticated'
      });
    }

    if (!siteId) {
      return res.status(400).json({
        success: false,
        message: 'Bad request: Site ID is required'
      });
    }

    // Verificar se o usuário é admin global
    if (user.roles && user.roles.includes('admin')) {
      return res.status(200).json({
        success: true,
        isGlobalAdmin: true,
        role: {
          name: 'Admin Global',
          permissions: [
            { resource: '*', actions: ['*'] }
          ]
        }
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
        hasRole: false,
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
        hasRole: false,
        message: 'Role not found'
      });
    }

    return res.status(200).json({
      success: true,
      hasRole: true,
      role,
      assignment
    });
  } catch (error) {
    console.error('Error getting user site role:', error);
    return res.status(500).json({
      success: false,
      message: 'Server error getting user site role'
    });
  }
};

export default getUserSiteRole;