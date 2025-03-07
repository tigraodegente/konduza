import { PayloadRequest } from 'payload/types';
import { Response } from 'express';
import payload from 'payload';

export const getUserSites = async (req: PayloadRequest, res: Response) => {
  try {
    const user = req.user;

    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Unauthorized: User not authenticated'
      });
    }

    // Se o usuário for admin global, retornar todos os sites
    if (user.roles && user.roles.includes('admin')) {
      const sites = await payload.find({
        collection: 'sites',
        limit: 100
      });

      return res.status(200).json({
        success: true,
        sites: sites.docs.map(site => ({
          ...site,
          isGlobalAdmin: true
        }))
      });
    }

    // Buscar atribuições do usuário para sites
    const siteUserAssignments = await payload.find({
      collection: 'site-user-assignments',
      where: {
        and: [
          { user: { equals: user.id } },
          { isActive: { equals: true } }
        ]
      },
      limit: 100,
      depth: 2 // Para incluir informações do site e da role
    });

    if (!siteUserAssignments.docs || siteUserAssignments.docs.length === 0) {
      return res.status(200).json({
        success: true,
        sites: []
      });
    }

    // Extrair informações de site para cada atribuição
    const sites = siteUserAssignments.docs.map(assignment => {
      if (typeof assignment.site === 'object') {
        return {
          ...assignment.site,
          role: assignment.role,
          assignmentId: assignment.id
        };
      }
      return null;
    }).filter(Boolean);

    return res.status(200).json({
      success: true,
      sites
    });
  } catch (error) {
    console.error('Error getting user sites:', error);
    return res.status(500).json({
      success: false,
      message: 'Server error getting user sites'
    });
  }
};

export default getUserSites;