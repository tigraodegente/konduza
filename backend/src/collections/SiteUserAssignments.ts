import { CollectionConfig } from 'payload/types';

export const SiteUserAssignments: CollectionConfig = {
  slug: 'site-user-assignments',
  admin: {
    useAsTitle: 'id',
    defaultColumns: ['user', 'site', 'role', 'createdAt'],
    group: 'Sistema'
  },
  access: {
    read: ({ req: { user } }) => {
      if (user?.roles?.includes('admin')) return true;
      return false;
    },
    create: ({ req: { user } }) => {
      if (user?.roles?.includes('admin')) return true;
      return false;
    },
    update: ({ req: { user } }) => {
      if (user?.roles?.includes('admin')) return true;
      return false;
    },
    delete: ({ req: { user } }) => {
      if (user?.roles?.includes('admin')) return true;
      return false;
    }
  },
  fields: [
    {
      name: 'user',
      type: 'relationship',
      relationTo: 'users',
      required: true
    },
    {
      name: 'site',
      type: 'relationship',
      relationTo: 'sites',
      required: true
    },
    {
      name: 'role',
      type: 'relationship',
      relationTo: 'site-user-roles',
      required: true
    },
    {
      name: 'customData',
      type: 'json',
      admin: {
        description: 'Dados personalizados deste usuário para o site',
      }
    },
    {
      name: 'isActive',
      type: 'checkbox',
      defaultValue: true,
      admin: {
        description: 'Indica se este acesso está ativo'
      }
    }
  ],
  indexes: [
    {
      fields: ['user', 'site'],
      unique: true
    }
  ]
};