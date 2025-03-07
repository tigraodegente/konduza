// storage-adapter-import-placeholder
import { sqliteAdapter } from '@payloadcms/db-sqlite'
import { payloadCloudPlugin } from '@payloadcms/payload-cloud'
import { lexicalEditor } from '@payloadcms/richtext-lexical'
import path from 'path'
import { buildConfig } from 'payload'
import { fileURLToPath } from 'url'
import sharp from 'sharp'

import { Users } from './collections/Users'
import { Media } from './collections/Media'
import { Sites } from './collections/Sites'
import { Themes } from './collections/Themes'
import { Entities } from './collections/Entities'

// Plugin para sincronização de temas
import payloadImportPlugin from '../plugins/payload-import-plugin'

// Logger middleware
import { logRequests } from './middleware/logRequests'

// Endpoints personalizados
import themeValidationEndpoint from './endpoints/theme-validation'
import importDataEndpoint from './endpoints/import-data'
import adminCheckEndpoint from './endpoints/admin-check'

const filename = fileURLToPath(import.meta.url)
const dirname = path.dirname(filename)

// Configurando logger global
console.log('[Payload] Inicializando Konduza Payload CMS...')

export default buildConfig({
  admin: {
    user: Users.slug,
    importMap: {
      baseDir: path.resolve(dirname),
    },
    meta: {
      titleSuffix: '- Konduza Admin',
      favicon: '/favicon.ico',
      ogImage: '/og-image.jpg',
    },
    css: path.resolve(dirname, './styles/admin.css'),
  },
  collections: [
    Users, 
    Media, 
    Sites, 
    Themes, 
    Entities
  ],
  editor: lexicalEditor(),
  secret: process.env.PAYLOAD_SECRET || '',
  typescript: {
    outputFile: path.resolve(dirname, 'payload-types.ts'),
  },
  graphQL: {
    schemaOutputFile: path.resolve(dirname, 'generated-schema.graphql'),
  },
  db: sqliteAdapter({
    client: {
      url: process.env.DATABASE_URI || '',
    },
  }),
  sharp,
  // Removemos o middleware express para evitar problemas de serialização no Next.js 15
  cors: [
    process.env.ASTRO_URL || 'http://localhost:4321',
  ],
  csrf: [
    process.env.ASTRO_URL || 'http://localhost:4321',
  ],
  plugins: [
    payloadCloudPlugin(),
    // Chame o plugin como uma função para evitar erros de serialização
    (config) => payloadImportPlugin(config),
    // storage-adapter-placeholder
  ],
  upload: {
    limits: {
      fileSize: 10000000, // 10MB em bytes
    },
  },
  rateLimit: {
    window: 15 * 60 * 1000, // 15 minutos
    max: 500, // máximo de requisições por janela
  },
  endpoints: [
    themeValidationEndpoint,
    importDataEndpoint,
    adminCheckEndpoint
  ],
  onInit: async (payload) => {
    console.log('[Payload] Konduza Payload CMS inicializado com sucesso!')
  }
})
