import type { CollectionConfig } from 'payload'

export const Media: CollectionConfig = {
  slug: 'media',
  admin: {
    useAsTitle: 'filename',
    defaultColumns: ['filename', 'alt', 'filesize', 'updatedAt'],
    group: 'Content',
  },
  access: {
    read: () => true,
  },
  hooks: {
    beforeValidate: [
      ({ data, operation }) => {
        console.log(`[Media] beforeValidate: Operation=${operation}, Filename=${data.filename}`)
        return data
      }
    ],
    afterChange: [
      ({ doc, operation }) => {
        console.log(`[Media] afterChange: Operation=${operation}, MediaID=${doc.id}, Filename=${doc.filename}`)
        return doc
      }
    ],
    afterRead: [
      ({ doc }) => {
        console.log(`[Media] afterRead: MediaID=${doc.id}, Filename=${doc.filename}`)
        return doc
      }
    ],
  },
  fields: [
    {
      name: 'alt',
      type: 'text',
      required: true,
      admin: {
        description: 'Texto alternativo para acessibilidade'
      }
    },
    {
      name: 'caption',
      type: 'text',
      admin: {
        description: 'Legenda opcional para exibição'
      }
    },
    {
      name: 'credits',
      type: 'text',
      admin: {
        description: 'Créditos ou atribuição da mídia'
      }
    },
    {
      name: 'category',
      type: 'select',
      options: [
        { label: 'Imagem', value: 'image' },
        { label: 'Documento', value: 'document' },
        { label: 'Vídeo', value: 'video' },
        { label: 'Áudio', value: 'audio' },
        { label: 'Outro', value: 'other' }
      ],
      admin: {
        description: 'Categoria da mídia para organização'
      }
    },
    {
      name: 'tags',
      type: 'array',
      fields: [
        {
          name: 'tag',
          type: 'text',
          required: true
        }
      ],
      admin: {
        description: 'Tags para facilitar a busca'
      }
    }
  ],
  upload: {
    staticURL: '/media',
    staticDir: '../media',
    imageSizes: [
      {
        name: 'thumbnail',
        width: 400,
        height: 300,
        position: 'centre',
      },
      {
        name: 'medium',
        width: 800,
        height: 600,
        position: 'centre',
      },
      {
        name: 'large',
        width: 1600,
        height: 1200,
        position: 'centre',
      }
    ],
    adminThumbnail: 'thumbnail',
    mimeTypes: ['image/*', 'application/pdf', 'video/*', 'audio/*'],
  },
}
