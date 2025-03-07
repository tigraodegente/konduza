import type { CollectionConfig } from 'payload'

export const Entities: CollectionConfig = {
  slug: 'entities',
  admin: {
    useAsTitle: 'title',
    defaultColumns: ['title', 'type', 'createdAt'],
    group: 'Content',
  },
  access: {
    read: () => true,
  },
  hooks: {
    beforeValidate: [
      ({ data, operation }) => {
        console.log(`[Entities] beforeValidate: Operation=${operation}, EntityType=${data.type}`)
        return data
      }
    ],
    afterChange: [
      ({ doc, operation }) => {
        console.log(`[Entities] afterChange: Operation=${operation}, EntityID=${doc.id}, EntityType=${doc.type}`)
        return doc
      }
    ],
    afterRead: [
      ({ doc }) => {
        console.log(`[Entities] afterRead: EntityID=${doc.id}, EntityType=${doc.type}`)
        return doc
      }
    ],
  },
  fields: [
    {
      name: 'title',
      type: 'text',
      required: true,
      admin: {
        description: 'O título da entidade'
      }
    },
    {
      name: 'type',
      type: 'select',
      required: true,
      options: [
        { label: 'Post', value: 'post' },
        { label: 'Page', value: 'page' },
        { label: 'Product', value: 'product' },
        { label: 'Category', value: 'category' },
        { label: 'Navigation', value: 'navigation' },
        { label: 'Form', value: 'form' },
        { label: 'Settings', value: 'settings' },
      ],
      admin: {
        description: 'O tipo de entidade determina seu comportamento e campos disponíveis'
      },
    },
    {
      name: 'slug',
      type: 'text',
      required: true,
      admin: {
        description: 'URL amigável para a entidade (deve ser única)',
      },
      validate: (value, { operation }) => {
        console.log(`[Entities] validating slug: ${value}, operation: ${operation}`)
        if (!value) return 'Slug é obrigatório'
        if (!/^[a-z0-9-]+$/.test(value)) return 'Slug deve conter apenas letras minúsculas, números e hífens'
        return true
      },
    },
    {
      name: 'content',
      type: 'richText',
      required: false,
      admin: {
        description: 'Conteúdo principal da entidade'
      }
    },
    {
      name: 'jsonContent',
      type: 'json',
      required: false,
      admin: {
        description: 'Dados estruturados para armazenar campos dinâmicos'
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
        { label: 'Arquivado', value: 'archived' }
      ],
      admin: {
        position: 'sidebar',
        description: 'Status de publicação da entidade'
      }
    },
    {
      name: 'site',
      type: 'relationship',
      relationTo: 'sites',
      required: true,
      admin: {
        position: 'sidebar',
        description: 'Site ao qual esta entidade pertence'
      }
    },
    {
      name: 'featuredImage',
      type: 'upload',
      relationTo: 'media',
      admin: {
        description: 'Imagem principal da entidade'
      }
    },
    {
      name: 'seo',
      type: 'group',
      admin: {
        description: 'Configurações de SEO'
      },
      fields: [
        {
          name: 'title',
          type: 'text',
          admin: {
            description: 'Título específico para SEO (deixe em branco para usar o título da entidade)'
          }
        },
        {
          name: 'description',
          type: 'textarea',
          admin: {
            description: 'Meta descrição para SEO'
          }
        },
        {
          name: 'keywords',
          type: 'text',
          admin: {
            description: 'Palavras-chave separadas por vírgula'
          }
        },
        {
          name: 'ogImage',
          type: 'upload',
          relationTo: 'media',
          admin: {
            description: 'Imagem para compartilhamento em redes sociais'
          }
        }
      ]
    }
  ]
}