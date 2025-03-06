# Konduza

Plataforma SaaS avançada para criação de sites sem código. O Konduza utiliza um sistema totalmente orientado a dados, permitindo que mudanças em sites e temas sejam feitas sem necessidade de recompilação.

## Tecnologias

- **Backend**: PayloadCMS v3, Next.js, Node.js, TypeScript
- **Frontend**: Astro, React, Svelte, TailwindCSS
- **Banco de Dados**: SQLite
- **Deploy**: Vercel (backend), Cloudflare Pages (frontend)

## Princípios Fundamentais

1. **Zero Recompilação**: Todo o sistema é orientado a dados, com mudanças refletidas sem recompilar código.
2. **Separação Backend/Frontend**: PayloadCMS (backend) e Astro (frontend) operam de forma independente.
3. **Modelos Dinâmicos**: Todos os componentes, temas e layouts são definidos via banco de dados.
4. **Multitenant**: Isolamento completo entre sites de diferentes clientes.
5. **Performance Primeiro**: Estratégias de cache e otimização em todos os níveis.

## Estrutura do Projeto

```
/konduza/
├── backend/               # Backend com PayloadCMS
│   ├── src/               # Código fonte do backend
│   │   ├── collections/   # Definições de coleções
│   │   ├── globals/       # Definições de globais
│   │   └── payload.config.ts # Configuração do Payload
│   ├── assets/            # Arquivos estáticos para o CMS
│   └── package.json       # Dependências do backend
├── storefront-astrojs/    # Frontend com Astro.js
│   ├── src/               # Código fonte do frontend
│   ├── public/            # Arquivos estáticos
│   └── astro.config.mjs   # Configuração do Astro
├── documents/             # Documentação do projeto
├── package.json           # Dependências do projeto raiz
└── tsconfig.json          # Configuração TypeScript
```

## Instalação

### Requisitos

- Node.js v18+
- npm v8+
- Git
- Docker (opcional)

### Passos para Instalação

1. Clone o repositório:
   ```bash
   git clone https://github.com/seu-usuario/konduza.git
   cd konduza
   ```

2. Instale as dependências:
   ```bash
   cd backend
   npm install
   cd ../storefront-astrojs
   npm install
   cd ..
   ```

3. Configure o ambiente:
   - Crie um arquivo `.env` na raiz do projeto com as variáveis necessárias
   - Um exemplo está disponível em `.env.example`

4. Inicie o servidor de desenvolvimento:
   ```bash
   # Backend (PayloadCMS)
   cd backend
   npm run dev
   
   # Frontend (Astro) - em um novo terminal
   cd storefront-astrojs
   npm run dev
   ```

5. Crie o primeiro usuário administrador:
   ```bash
   cd backend
   # Criar usuário administrador via script (definir valores no .env ou usar padrões)
   npm run create:admin
   
   # Alternativa: Iniciar o servidor e criar usuário pela interface administrativa
   npm run dev
   # Acesse: http://localhost:3000/admin
   ```

6. Acesse o sistema:
   - Backend (Admin): http://localhost:3000/admin
   - Frontend: http://localhost:4321

## Scripts Disponíveis

### Backend (diretório `backend`)
- `npm run dev`: Inicia o servidor de desenvolvimento do PayloadCMS com Next.js
- `npm run build`: Compila o backend para produção
- `npm run payload`: Executa comandos do Payload CLI
- `npm run generate:types`: Gera tipos TypeScript para o Payload
- `npm run migrate`: Gerencia migrações do banco de dados
- `npm run create:admin`: Cria um usuário administrador via script

### Frontend (diretório `storefront-astrojs`)
- `npm run dev`: Inicia o servidor de desenvolvimento do Astro
- `npm run build`: Compila o frontend para produção

## Principais Funcionalidades

- **Sistema de Temas**: Marketplace de temas pré-construídos
- **Editor de Páginas**: Interface drag-and-drop
- **Multitenancy**: Suporte para múltiplos sites em uma única instalação
- **Integração com IA**: Geração de conteúdo, sugestões de design
- **Cache Multinível**: Estratégias avançadas de cache

## Fluxo de Trabalho

1. Administradores criam/modificam sites e temas no PayloadCMS
2. Hooks disparam eventos de sincronização
3. Astro atualiza seus caches e arquivos
4. Usuários finais acessam sites via domínios específicos
5. Astro identifica o domínio, carrega o site correto do PayloadCMS
6. Renderização dinâmica gera HTML baseado nas definições do tema
7. Componentes interativos são hidratados apenas onde necessário

## Contribuição

Contribuições são bem-vindas! Por favor, leia o arquivo [CONTRIBUTING.md](CONTRIBUTING.md) para detalhes sobre como contribuir.

## Licença

Este projeto está licenciado sob a licença [MIT](LICENSE).