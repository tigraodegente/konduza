import type { CollectionConfig } from 'payload'

export const Sites: CollectionConfig = {
  slug: 'sites',
  admin: {
    useAsTitle: 'name',
    defaultColumns: ['name', 'domains', 'status', 'createdAt'],
    group: 'System',
  },
  access: {
    // Permitir leitura pública
    read: () => true,
    // Outras operações requerem autenticação como admin
    create: ({ req: { user } }) => Boolean(user?.roles?.includes('admin')),
    update: ({ req: { user } }) => Boolean(user?.roles?.includes('admin')),
    delete: ({ req: { user } }) => Boolean(user?.roles?.includes('admin')),
  },
  hooks: {
    beforeValidate: [
      ({ data, operation }) => {
        console.log(`[Sites] beforeValidate: Operation=${operation}, SiteName=${data.name}`)
        return data
      }
    ],
    afterChange: [
      ({ doc, operation }) => {
        console.log(`[Sites] afterChange: Operation=${operation}, SiteID=${doc.id}, SiteName=${doc.name}`)
        // Aqui futuramente vamos adicionar lógica para sincronizar com o Astro
        return doc
      }
    ],
    afterRead: [
      ({ doc }) => {
        console.log(`[Sites] afterRead: SiteID=${doc.id}, SiteName=${doc.name}`)
        return doc
      }
    ],
  },
  fields: [
    {
      name: 'name',
      type: 'text',
      required: true,
      admin: {
        description: 'Nome do site'
      }
    },
    {
      name: 'description',
      type: 'textarea',
      admin: {
        description: 'Descrição breve do site'
      }
    },
    {
      name: 'domains',
      type: 'array',
      required: true,
      minRows: 1,
      admin: {
        description: 'Domínios associados a este site'
      },
      fields: [
        {
          name: 'domain',
          type: 'text',
          required: true,
          admin: {
            description: 'Formato: exemplo.com (sem http/https)'
          },
          validate: (value) => {
            console.log(`[Sites] validating domain: ${value}`)
            if (!value) return 'Domínio é obrigatório'
            
            // Validação básica de formato de domínio
            const domainRegex = /^(?:[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?\.)+[a-z0-9][a-z0-9-]{0,61}[a-z0-9]$|^localhost$/i
            if (!domainRegex.test(value)) return 'Formato de domínio inválido'
            
            return true
          }
        },
        {
          name: 'isPrimary',
          type: 'checkbox',
          defaultValue: false,
          admin: {
            description: 'Marcar como domínio principal'
          }
        }
      ]
    },
    {
      name: 'theme',
      type: 'relationship',
      relationTo: 'themes',
      required: true,
      admin: {
        description: 'Tema aplicado a este site'
      }
    },
    {
      name: 'owner',
      type: 'relationship',
      relationTo: 'users',
      required: true,
      admin: {
        description: 'Usuário proprietário deste site'
      }
    },
    {
      name: 'siteRoles',
      type: 'relationship',
      relationTo: 'site-user-roles',
      hasMany: true,
      admin: {
        description: 'Papéis de usuário disponíveis neste site'
      }
    },
    {
      name: 'status',
      type: 'select',
      required: true,
      defaultValue: 'draft',
      options: [
        { label: 'Rascunho', value: 'draft' },
        { label: 'Publicado', value: 'published' },
        { label: 'Arquivado', value: 'archived' },
        { label: 'Em manutenção', value: 'maintenance' }
      ],
      admin: {
        position: 'sidebar',
        description: 'Status atual do site'
      }
    },
    {
      name: 'settings',
      type: 'group',
      admin: {
        description: 'Configurações gerais do site'
      },
      fields: [
        {
          name: 'favicon',
          type: 'upload',
          relationTo: 'media',
          admin: {
            description: 'Favicon do site'
          }
        },
        {
          name: 'logo',
          type: 'upload',
          relationTo: 'media',
          admin: {
            description: 'Logo principal do site'
          }
        },
        {
          name: 'analytics',
          type: 'group',
          admin: {
            description: 'Configurações de analytics'
          },
          fields: [
            {
              name: 'googleAnalyticsId',
              type: 'text',
              admin: {
                description: 'ID do Google Analytics (formato: G-XXXXXXXX ou UA-XXXXXXXX-X)'
              }
            },
            {
              name: 'enableBasicAnalytics',
              type: 'checkbox',
              defaultValue: true,
              admin: {
                description: 'Habilitar sistema básico de analytics interno'
              }
            }
          ]
        },
        {
          name: 'social',
          type: 'group',
          admin: {
            description: 'Redes sociais'
          },
          fields: [
            {
              name: 'facebook',
              type: 'text',
              admin: {
                description: 'URL da página do Facebook'
              }
            },
            {
              name: 'instagram',
              type: 'text',
              admin: {
                description: 'URL da página do Instagram'
              }
            },
            {
              name: 'twitter',
              type: 'text',
              admin: {
                description: 'URL da página do Twitter'
              }
            },
            {
              name: 'linkedin',
              type: 'text',
              admin: {
                description: 'URL da página do LinkedIn'
              }
            }
          ]
        },
        {
          name: 'advanced',
          type: 'group',
          admin: {
            description: 'Configurações avançadas'
          },
          fields: [
            {
              name: 'customCSS',
              type: 'code',
              admin: {
                language: 'css',
                description: 'CSS personalizado para o site inteiro'
              }
            },
            {
              name: 'customJS',
              type: 'code',
              admin: {
                language: 'javascript',
                description: 'JavaScript personalizado para o site inteiro'
              }
            },
            {
              name: 'headerCode',
              type: 'textarea',
              admin: {
                description: 'Código adicional para o <head> do site (meta tags, scripts, etc)'
              }
            },
            {
              name: 'footerCode',
              type: 'textarea',
              admin: {
                description: 'Código adicional para antes do </body> do site'
              }
            }
          ]
        }
      ]
    },
    {
      name: 'seo',
      type: 'group',
      admin: {
        description: 'Configurações de SEO globais'
      },
      fields: [
        {
          name: 'defaultTitle',
          type: 'text',
          admin: {
            description: 'Título padrão do site'
          }
        },
        {
          name: 'titleSeparator',
          type: 'text',
          defaultValue: '|',
          admin: {
            description: 'Separador usado no título (ex: "Página | Site")'
          }
        },
        {
          name: 'defaultDescription',
          type: 'textarea',
          admin: {
            description: 'Meta descrição padrão'
          }
        },
        {
          name: 'defaultOgImage',
          type: 'upload',
          relationTo: 'media',
          admin: {
            description: 'Imagem padrão para compartilhamento em redes sociais'
          }
        }
      ]
    }
  ]
}