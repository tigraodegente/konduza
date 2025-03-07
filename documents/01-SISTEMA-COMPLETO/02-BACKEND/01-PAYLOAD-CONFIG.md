# Configuração do PayloadCMS

Este documento detalha a configuração do PayloadCMS no sistema Konduza, explicando sua estrutura e como deve ser implementado.

## Estrutura do arquivo `payload.config.ts`

O arquivo de configuração principal do PayloadCMS define todas as coleções, rotas de admin, autenticação e outras configurações essenciais do sistema.

```typescript
// src/payload.config.ts
import { buildConfig } from 'payload/config';
import path from 'path';

// Importação de coleções
import Users from './collections/Users';
import Media from './collections/Media';
import Entities from './collections/Entities';
import Sites from './collections/Sites';
import Themes from './collections/Themes';

// Importação de endpoints
import themeValidationEndpoint from './endpoints/theme-validation';

// Importação de hooks globais
import payloadImportPlugin from '../payload-import-plugin';

export default buildConfig({
  serverURL: process.env.PAYLOAD_PUBLIC_SERVER_URL || '',
  admin: {
    user: Users.slug,
    meta: {
      titleSuffix: '- Konduza Admin',
      favicon: '/favicon.ico',
      ogImage: '/og-image.jpg',
    },
    css: path.resolve(__dirname, './styles/admin.css'),
    webpack: (config) => config,
  },
  collections: [
    Users,
    Media,
    Entities,
    Sites,
    Themes,
  ],
  typescript: {
    outputFile: path.resolve(__dirname, 'payload-types.ts'),
  },
  graphQL: {
    schemaOutputFile: path.resolve(__dirname, 'generated-schema.graphql'),
  },
  plugins: [
    payloadImportPlugin,
  ],
  endpoints: [
    themeValidationEndpoint,
    // Outros endpoints serão adicionados aqui
  ],
  cors: [
    process.env.ASTRO_URL || 'http://localhost:4321',
  ],
  csrf: [
    process.env.ASTRO_URL || 'http://localhost:4321',
  ],
  upload: {
    limits: {
      fileSize: 10000000, // 10MB em bytes
    },
  },
  db: process.env.NODE_ENV === 'production' 
    ? {
        postgresqlURL: process.env.DATABASE_URL,
      } 
    : {
        sqlite: {
          filename: path.resolve(__dirname, '../konduza.db'),
        },
      },
  rateLimit: {
    window: 15 * 60 * 1000, // 15 minutos
    max: 500, // máximo de requisições por janela
  },
});
```

## Plugins e Extensões

### Plugin de Importação de Temas

O plugin `payload-import-plugin.js` é responsável por sincronizar temas entre o PayloadCMS e o Astro, gerando arquivos CSS, JS e demais recursos necessários.

```javascript
// payload-import-plugin.js
const payloadImportPlugin = {
  init: (payload) => {
    console.log('🔄 Inicializando Payload Import Plugin');
    
    // Registrar hook para monitorar criação/atualização de temas
    payload.collections.themes.hooks.afterChange.push(async ({ doc, operation }) => {
      try {
        console.log(`🎨 Tema ${operation === 'create' ? 'criado' : 'atualizado'}: ${doc.name}`);
        await processTheme(doc);
        return doc;
      } catch (error) {
        console.error('❌ Erro ao processar tema:', error.message);
        return doc;
      }
    });
    
    // Sincronizar temas existentes na inicialização
    syncExistingThemes(payload);
  }
};

// Funções auxiliares do plugin
async function processTheme(theme) {
  // Implementação para criar arquivos do tema
  // Ver código completo no arquivo original
}

async function syncExistingThemes(payload) {
  // Implementação para sincronizar temas existentes
  // Ver código completo no arquivo original
}

export default payloadImportPlugin;
```

## Configuração de Endpoints Customizados

Endpoints personalizados são usados para funcionalidades específicas, como validação de temas:

```typescript
// src/endpoints/theme-validation.ts
import { Endpoint } from 'payload/config';
import { validateAPIKey } from '../utils/validateAPIKey';

const themeValidationEndpoint: Endpoint = {
  path: '/api/theme-validation',
  method: 'post',
  handler: async (req, res, next) => {
    try {
      // Validar chave de API
      if (!validateAPIKey(req)) {
        return res.status(401).json({
          success: false,
          error: 'Não autorizado - Chave de API inválida',
        });
      }

      const { themeId, validationStatus, validationData } = req.body;

      // Validar parâmetros obrigatórios
      if (!themeId || !validationStatus) {
        return res.status(400).json({
          success: false,
          error: 'Parâmetros inválidos - themeId e validationStatus são obrigatórios',
        });
      }

      // Verificar se o tema existe
      const theme = await req.payload.findByID({
        collection: 'themes',
        id: themeId,
      });

      if (!theme) {
        return res.status(404).json({
          success: false,
          error: `Tema com ID ${themeId} não encontrado`,
        });
      }

      // Atualizar o tema com os resultados da validação
      await req.payload.update({
        collection: 'themes',
        id: themeId,
        data: {
          validationStatus,
          validationResults: validationData || null,
        },
        user: req.user || null,
        overrideAccess: true,
      });

      // Responder com sucesso
      return res.status(200).json({
        success: true,
        message: `Tema ${themeId} atualizado com status: ${validationStatus}`,
      });
    } catch (error) {
      console.error('Erro ao processar validação:', error);
      return res.status(500).json({
        success: false,
        error: `Erro interno: ${error.message}`,
      });
    }
  },
};

export default themeValidationEndpoint;
```

## Configuração de Autenticação

O sistema utiliza autenticação baseada em JWT, configurada automaticamente pelo PayloadCMS:

```typescript
// Exemplo de uso em uma coleção (Users)
import { CollectionConfig } from 'payload/types';

const Users: CollectionConfig = {
  slug: 'users',
  auth: {
    tokenExpiration: 7 * 24 * 60 * 60, // 7 dias em segundos
    cookies: {
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      domain: process.env.COOKIE_DOMAIN || undefined,
    },
    verify: true, // Habilitar verificação por email
    maxLoginAttempts: 5, // Número máximo de tentativas de login
    lockTime: 10 * 60 * 1000, // 10 minutos de bloqueio após exceder max tentativas
  },
  // Restante da configuração
};

export default Users;
```

## Variáveis de Ambiente

O PayloadCMS requer as seguintes variáveis de ambiente:

```
# Configuração do Servidor
PORT=3000
PAYLOAD_PUBLIC_SERVER_URL=http://localhost:3000

# Configuração do Banco de Dados
DATABASE_URL=postgresql://user:password@localhost:5432/konduza

# Secrets
PAYLOAD_SECRET=seu_secret_para_jwt_aqui
INTERNAL_API_KEY=chave_para_comunicacao_interna

# Integração com Astro
ASTRO_URL=http://localhost:4321

# Configuração de Email (para verificação e recuperação de senha)
EMAIL_FROM=noreply@konduza.com
EMAIL_HOST=smtp.example.com
EMAIL_PORT=587
EMAIL_USER=seu_usuario
EMAIL_PASS=sua_senha
```

## Middleware Personalizado

Middleware para logging e personalização do comportamento padrão:

```typescript
// src/middleware/logRequests.ts
import { PayloadRequest } from 'payload/types';
import { Response, NextFunction } from 'express';

export const logRequests = (req: PayloadRequest, res: Response, next: NextFunction) => {
  const start = Date.now();
  const { method, url } = req;

  res.on('finish', () => {
    const duration = Date.now() - start;
    const status = res.statusCode;
    console.log(`${method} ${url} ${status} - ${duration}ms`);
  });

  next();
};

// Uso no payload.config.ts
export default buildConfig({
  // ...outras configurações
  express: {
    middleware: [
      logRequests,
      // outros middleware aqui
    ],
  },
});
```

## Considerações de Performance

1. **Índices**: Adicione índices para campos frequentemente consultados
2. **Depth de Populate**: Limite a profundidade de relacionamentos para evitar consultas pesadas
3. **Projeções**: Use projeções para selecionar apenas os campos necessários
4. **Paginação**: Implemente paginação em todas as listas para limitar o tamanho das respostas

```typescript
// Exemplo de query otimizada
const products = await payload.find({
  collection: 'entities',
  where: {
    type: { equals: 'product' },
    status: { equals: 'active' },
  },
  limit: 20,
  page: 1,
  depth: 1,
  sort: '-createdAt',
  // Selecionar apenas campos necessários
  fields: ['id', 'name', 'price', 'thumbnail'],
});
```

## Considerações de Segurança

1. **Sanitização**: Todos os inputs de usuário são sanitizados automaticamente pelo PayloadCMS
2. **Rate Limiting**: Configurado para evitar abuso da API
3. **Autenticação**: JWT com expiração e refresh tokens
4. **CSRF**: Proteção contra ataques CSRF habilitada
5. **Permissões**: Sistema granular de controle de acesso

## Próximos Passos

Após configurar o PayloadCMS, você deve:

1. Implementar as coleções fundamentais (Users, Media, Entities, Sites, Themes)
2. Configurar endpoints personalizados para validação e sincronização
3. Implementar hooks para integrações entre sistemas

Continue explorando a documentação em:
- `02-COLLECTIONS.md` para detalhes das coleções
- `03-ENDPOINTS.md` para API e endpoints
- `04-HOOKS.md` para hooks e integrações