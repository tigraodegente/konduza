import { CollectionConfig } from 'payload/types';

export const SiteUserRoles: CollectionConfig = {
  slug: 'site-user-roles',
  admin: {
    useAsTitle: 'name',
    defaultColumns: ['name', 'site', 'createdAt'],
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
      name: 'name',
      type: 'text',
      required: true,
      admin: {
        description: 'Nome do papel de usuário (ex: Cliente, Membro, Professor)'
      }
    },
    {
      name: 'slug',
      type: 'text',
      required: true,
      unique: true,
      admin: {
        description: 'Identificador único (ex: cliente, membro, professor)'
      }
    },
    {
      name: 'site',
      type: 'relationship',
      relationTo: 'sites',
      required: true,
      admin: {
        description: 'Site ao qual este papel pertence'
      }
    },
    {
      name: 'description',
      type: 'textarea',
      admin: {
        description: 'Descrição detalhada deste papel de usuário'
      }
    },
    {
      name: 'permissions',
      type: 'array',
      admin: {
        description: 'Permissões específicas para este papel'
      },
      fields: [
        {
          name: 'resource',
          type: 'select',
          required: true,
          options: [
            { label: 'Páginas', value: 'pages' },
            { label: 'Posts', value: 'posts' },
            { label: 'Produtos', value: 'products' },
            { label: 'Mídia', value: 'media' },
            { label: 'Configurações', value: 'settings' },
            { label: 'Usuários', value: 'users' },
            { label: 'Formulários', value: 'forms' }
          ]
        },
        {
          name: 'actions',
          type: 'select',
          hasMany: true,
          required: true,
          options: [
            { label: 'Visualizar', value: 'read' },
            { label: 'Criar', value: 'create' },
            { label: 'Editar', value: 'update' },
            { label: 'Excluir', value: 'delete' }
          ]
        }
      ]
    },
    {
      name: 'customFields',
      type: 'array',
      admin: {
        description: 'Campos personalizados para usuários com este papel'
      },
      fields: [
        {
          name: 'fieldName',
          type: 'text',
          required: true
        },
        {
          name: 'fieldType',
          type: 'select',
          required: true,
          options: [
            { label: 'Texto', value: 'text' },
            { label: 'Número', value: 'number' },
            { label: 'Email', value: 'email' },
            { label: 'Data', value: 'date' },
            { label: 'Seleção', value: 'select' },
            { label: 'Checkbox', value: 'checkbox' }
          ]
        },
        {
          name: 'required',
          type: 'checkbox',
          label: 'Obrigatório'
        },
        {
          name: 'options',
          type: 'array',
          admin: {
            condition: (data, siblingData) => siblingData.fieldType === 'select'
          },
          fields: [
            {
              name: 'label',
              type: 'text',
              required: true
            },
            {
              name: 'value',
              type: 'text',
              required: true
            }
          ]
        }
      ]
    }
  ]
};