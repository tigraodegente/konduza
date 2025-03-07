import type { CollectionConfig } from 'payload'

export const Themes: CollectionConfig = {
  slug: 'themes',
  admin: {
    useAsTitle: 'name',
    defaultColumns: ['name', 'status', 'version', 'createdAt'],
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
        console.log(`[Themes] beforeValidate: Operation=${operation}, ThemeName=${data.name}`)
        return data
      }
    ],
    afterChange: [
      ({ doc, operation }) => {
        console.log(`[Themes] afterChange: Operation=${operation}, ThemeID=${doc.id}, ThemeName=${doc.name}`)
        console.log(`[Themes] Iniciando sincronização de tema no afterChange`)
        // Aqui será implementada a lógica para gerar os arquivos do tema no Astro
        return doc
      }
    ],
    afterRead: [
      ({ doc }) => {
        console.log(`[Themes] afterRead: ThemeID=${doc.id}, ThemeName=${doc.name}`)
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
        description: 'Nome do tema'
      }
    },
    {
      name: 'description',
      type: 'textarea',
      admin: {
        description: 'Descrição do tema'
      }
    },
    {
      name: 'version',
      type: 'text',
      defaultValue: '1.0.0',
      admin: {
        description: 'Versão do tema (semver: x.y.z)'
      },
      validate: (value) => {
        console.log(`[Themes] validating version: ${value}`)
        if (!value) return 'Versão é obrigatória'
        
        // Validação de formato semver básico
        const semverRegex = /^(\d+)\.(\d+)\.(\d+)$/
        if (!semverRegex.test(value)) return 'Formato de versão inválido. Use o formato x.y.z'
        
        return true
      }
    },
    {
      name: 'author',
      type: 'relationship',
      relationTo: 'users',
      required: true,
      admin: {
        description: 'Autor/criador do tema'
      }
    },
    {
      name: 'thumbnail',
      type: 'upload',
      relationTo: 'media',
      admin: {
        description: 'Imagem de visualização do tema'
      }
    },
    {
      name: 'status',
      type: 'select',
      required: true,
      defaultValue: 'draft',
      options: [
        { label: 'Rascunho', value: 'draft' },
        { label: 'Em Revisão', value: 'review' },
        { label: 'Publicado', value: 'published' },
        { label: 'Desativado', value: 'disabled' }
      ],
      admin: {
        position: 'sidebar',
        description: 'Status atual do tema'
      }
    },
    {
      name: 'validationStatus',
      type: 'select',
      defaultValue: 'pending',
      options: [
        { label: 'Pendente', value: 'pending' },
        { label: 'Válido', value: 'valid' },
        { label: 'Inválido', value: 'invalid' }
      ],
      admin: {
        position: 'sidebar',
        description: 'Status de validação do tema'
      }
    },
    {
      name: 'validationResults',
      type: 'json',
      admin: {
        description: 'Resultados da validação do tema',
        readOnly: true
      }
    },
    {
      name: 'isSystem',
      type: 'checkbox',
      defaultValue: false,
      admin: {
        position: 'sidebar',
        description: 'Este é um tema do sistema (não pode ser excluído)'
      },
      access: {
        update: () => false // Apenas leitura após a criação
      }
    },
    {
      name: 'templates',
      type: 'array',
      admin: {
        description: 'Templates disponíveis neste tema'
      },
      fields: [
        {
          name: 'name',
          type: 'text',
          required: true,
          admin: {
            description: 'Nome do template'
          }
        },
        {
          name: 'key',
          type: 'text',
          required: true,
          admin: {
            description: 'Chave única do template (ex: home, page, post)'
          },
          validate: (value) => {
            console.log(`[Themes] validating template key: ${value}`)
            if (!value) return 'Chave é obrigatória'
            if (!/^[a-z0-9-_]+$/.test(value)) return 'Chave deve conter apenas letras minúsculas, números, hífens e underscores'
            return true
          }
        },
        {
          name: 'description',
          type: 'textarea'
        },
        {
          name: 'thumbnail',
          type: 'upload',
          relationTo: 'media'
        },
        {
          name: 'defaultTemplate',
          type: 'checkbox',
          defaultValue: false,
          admin: {
            description: 'Usar como template padrão'
          }
        }
      ]
    },
    {
      name: 'mainStyles',
      type: 'code',
      required: true,
      admin: {
        language: 'css',
        description: 'Estilos CSS principais do tema'
      }
    },
    {
      name: 'componentStyles',
      type: 'code',
      admin: {
        language: 'css',
        description: 'Estilos CSS específicos para componentes'
      }
    },
    {
      name: 'layouts',
      type: 'array',
      admin: {
        description: 'Layouts disponíveis no tema'
      },
      fields: [
        {
          name: 'name',
          type: 'text',
          required: true
        },
        {
          name: 'key',
          type: 'text',
          required: true,
          validate: (value) => {
            console.log(`[Themes] validating layout key: ${value}`)
            if (!value) return 'Chave é obrigatória'
            if (!/^[a-z0-9-_]+$/.test(value)) return 'Chave deve conter apenas letras minúsculas, números, hífens e underscores'
            return true
          }
        },
        {
          name: 'template',
          type: 'code',
          required: true,
          admin: {
            language: 'html',
            description: 'Template HTML do layout (usando tags Astro)'
          }
        },
        {
          name: 'isDefault',
          type: 'checkbox',
          defaultValue: false
        }
      ]
    },
    {
      name: 'components',
      type: 'array',
      admin: {
        description: 'Componentes disponíveis neste tema'
      },
      fields: [
        {
          name: 'name',
          type: 'text',
          required: true
        },
        {
          name: 'key',
          type: 'text',
          required: true,
          validate: (value) => {
            console.log(`[Themes] validating component key: ${value}`)
            if (!value) return 'Chave é obrigatória'
            if (!/^[a-z0-9-_]+$/.test(value)) return 'Chave deve conter apenas letras minúsculas, números, hífens e underscores'
            return true
          }
        },
        {
          name: 'description',
          type: 'textarea'
        },
        {
          name: 'category',
          type: 'select',
          options: [
            { label: 'Layout', value: 'layout' },
            { label: 'Navegação', value: 'navigation' },
            { label: 'Conteúdo', value: 'content' },
            { label: 'Mídia', value: 'media' },
            { label: 'Formulário', value: 'form' },
            { label: 'E-commerce', value: 'ecommerce' },
            { label: 'Outro', value: 'other' }
          ]
        },
        {
          name: 'template',
          type: 'code',
          required: true,
          admin: {
            language: 'html',
            description: 'Template HTML do componente (usando tags Astro)'
          }
        },
        {
          name: 'styles',
          type: 'code',
          admin: {
            language: 'css',
            description: 'Estilos CSS específicos deste componente'
          }
        },
        {
          name: 'script',
          type: 'code',
          admin: {
            language: 'javascript',
            description: 'JavaScript associado ao componente (se necessário)'
          }
        },
        {
          name: 'schema',
          type: 'json',
          admin: {
            description: 'Esquema dos dados aceitos pelo componente'
          }
        }
      ]
    },
    {
      name: 'globalScripts',
      type: 'code',
      admin: {
        language: 'javascript',
        description: 'Scripts globais do tema'
      }
    },
    {
      name: 'dependencies',
      type: 'array',
      admin: {
        description: 'Dependências externas necessárias para este tema'
      },
      fields: [
        {
          name: 'name',
          type: 'text',
          required: true,
          admin: {
            description: 'Nome da dependência'
          }
        },
        {
          name: 'version',
          type: 'text',
          admin: {
            description: 'Versão da dependência'
          }
        },
        {
          name: 'type',
          type: 'select',
          options: [
            { label: 'CSS', value: 'css' },
            { label: 'JavaScript', value: 'js' },
            { label: 'Fonte', value: 'font' },
            { label: 'Outro', value: 'other' }
          ]
        },
        {
          name: 'url',
          type: 'text',
          admin: {
            description: 'URL da dependência (CDN ou similar)'
          }
        }
      ]
    },
    {
      name: 'settings',
      type: 'group',
      admin: {
        description: 'Configurações do tema'
      },
      fields: [
        {
          name: 'colors',
          type: 'array',
          admin: {
            description: 'Paleta de cores do tema'
          },
          fields: [
            {
              name: 'name',
              type: 'text',
              required: true,
              admin: {
                description: 'Nome da cor (ex: primária, secundária)'
              }
            },
            {
              name: 'key',
              type: 'text',
              required: true,
              admin: {
                description: 'Chave da cor (para uso na CSS var)'
              }
            },
            {
              name: 'value',
              type: 'text',
              required: true,
              admin: {
                description: 'Valor da cor (ex: #FF5500)'
              }
            }
          ]
        },
        {
          name: 'fonts',
          type: 'array',
          admin: {
            description: 'Fontes utilizadas no tema'
          },
          fields: [
            {
              name: 'name',
              type: 'text',
              required: true,
              admin: {
                description: 'Nome da fonte'
              }
            },
            {
              name: 'key',
              type: 'text',
              required: true,
              admin: {
                description: 'Chave da fonte (para uso na CSS var)'
              }
            },
            {
              name: 'family',
              type: 'text',
              required: true,
              admin: {
                description: 'Font-family (ex: "Roboto, sans-serif")'
              }
            },
            {
              name: 'url',
              type: 'text',
              admin: {
                description: 'URL para importação da fonte (se aplicável)'
              }
            }
          ]
        },
        {
          name: 'spacing',
          type: 'array',
          admin: {
            description: 'Sistema de espaçamento do tema'
          },
          fields: [
            {
              name: 'name',
              type: 'text',
              required: true,
              admin: {
                description: 'Nome do espaçamento (ex: pequeno, médio)'
              }
            },
            {
              name: 'key',
              type: 'text',
              required: true,
              admin: {
                description: 'Chave do espaçamento (para uso na CSS var)'
              }
            },
            {
              name: 'value',
              type: 'text',
              required: true,
              admin: {
                description: 'Valor do espaçamento (ex: 0.5rem, 16px)'
              }
            }
          ]
        }
      ]
    }
  ]
}