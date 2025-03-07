import type { CollectionConfig } from 'payload'

export const Users: CollectionConfig = {
  slug: 'users',
  admin: {
    useAsTitle: 'name',
    defaultColumns: ['name', 'email', 'roles'],
    group: 'System',
  },
  auth: {
    tokenExpiration: 7 * 24 * 60 * 60, // 7 dias em segundos
    depth: 0,
  },
  hooks: {
    beforeValidate: [
      ({ data, operation }) => {
        console.log(`[Users] beforeValidate: Operation=${operation}, UserName=${data.name}`)
        return data
      }
    ],
    afterChange: [
      ({ doc, operation }) => {
        console.log(`[Users] afterChange: Operation=${operation}, UserID=${doc.id}, UserName=${doc.name}, Roles=${doc.roles}`)
        return doc
      }
    ],
    afterRead: [
      ({ doc }) => {
        console.log(`[Users] afterRead: UserID=${doc.id}, UserName=${doc.name}`)
        return doc
      }
    ],
    afterLogin: [
      ({ user, token }) => {
        console.log(`[Users] afterLogin: UserID=${user.id}, UserName=${user.name}, Email=${user.email}`)
      }
    ],
    afterLogout: [
      ({ user }) => {
        if (user) {
          console.log(`[Users] afterLogout: UserID=${user.id}, UserName=${user.name}, Email=${user.email}`)
        } else {
          console.log(`[Users] afterLogout: No user to logout`)
        }
      }
    ],
    afterMe: [
      ({ user }) => {
        if (user) {
          console.log(`[Users] afterMe: UserID=${user.id}, UserName=${user.name}, Email=${user.email}`)
        } else {
          console.log(`[Users] afterMe: No user logged in`)
        }
        return user
      }
    ],
  },
  fields: [
    {
      name: 'name',
      type: 'text',
      required: true,
      admin: {
        description: 'Nome completo do usuário'
      }
    },
    {
      name: 'roles',
      type: 'select',
      hasMany: true,
      options: [
        { label: 'Admin', value: 'admin' },
        { label: 'Editor', value: 'editor' },
        { label: 'User', value: 'user' },
      ],
      defaultValue: ['user'],
      required: true,
      admin: {
        description: 'Nível de acesso do usuário'
      }
    },
    {
      name: 'avatar',
      type: 'upload',
      relationTo: 'media',
      admin: {
        description: 'Foto de perfil do usuário'
      }
    },
    {
      name: 'bio',
      type: 'textarea',
      admin: {
        description: 'Breve biografia do usuário'
      }
    },
    {
      name: 'preferences',
      type: 'group',
      admin: {
        description: 'Preferências do usuário'
      },
      fields: [
        {
          name: 'darkMode',
          type: 'checkbox',
          defaultValue: false,
          admin: {
            description: 'Habilitar modo escuro na interface'
          }
        },
        {
          name: 'emailNotifications',
          type: 'checkbox',
          defaultValue: true,
          admin: {
            description: 'Receber notificações por email'
          }
        },
        {
          name: 'language',
          type: 'select',
          defaultValue: 'pt',
          options: [
            { label: 'Português', value: 'pt' },
            { label: 'English', value: 'en' },
            { label: 'Español', value: 'es' }
          ],
          admin: {
            description: 'Idioma preferido'
          }
        }
      ]
    },
    {
      name: 'siteRoles',
      type: 'relationship',
      relationTo: 'site-user-assignments',
      hasMany: true,
      admin: {
        description: 'Associações deste usuário com sites específicos'
      }
    },
    // Email added by default by the auth system
  ],
  access: {
    // Permissões de acesso à coleção
    read: ({ req: { user } }) => {
      console.log(`[Users] access.read: UserID=${user?.id || 'anonymous'}`)
      return true // Todos podem ver a lista de usuários
    },
    create: ({ req: { user } }) => {
      console.log(`[Users] access.create: UserID=${user?.id || 'anonymous'}`)
      // Apenas admin pode criar usuários
      return Boolean(user?.roles?.includes('admin'))
    },
    update: ({ req: { user }, id }) => {
      console.log(`[Users] access.update: UserID=${user?.id || 'anonymous'}, TargetID=${id}`)
      // Usuários podem atualizar seus próprios perfis, admins podem atualizar qualquer um
      return (
        user?.roles?.includes('admin') || 
        user?.id === id
      )
    },
    delete: ({ req: { user } }) => {
      console.log(`[Users] access.delete: UserID=${user?.id || 'anonymous'}`)
      // Apenas admin pode excluir usuários
      return Boolean(user?.roles?.includes('admin'))
    },
  },
}
