# Visão Geral do Sistema Konduza

O Konduza é uma plataforma SaaS completa para criação e gerenciamento de sites sem necessidade de codificação. Este documento apresenta a arquitetura geral do sistema, seus principais componentes e como eles se relacionam.

## Conceito Fundamental

A inovação central do Konduza está na sua arquitetura completamente orientada a dados, onde todos os aspectos do sistema - desde temas visuais até comportamentos de componentes - são definidos no banco de dados e podem ser modificados sem necessidade de recompilação de código.

## Arquitetura de Alto Nível

```
┌─────────────────────────────────────┐      ┌─────────────────────────────────────┐
│                                     │      │                                     │
│          PayloadCMS (Backend)       │◄────►│          Astro (Frontend)           │
│                                     │      │                                     │
└───────────────────┬─────────────────┘      └─────────────────────┬───────────────┘
                    │                                              │
                    ▼                                              ▼
        ┌───────────────────────┐                      ┌───────────────────────┐
        │                       │                      │                       │
        │     Banco de Dados    │                      │  Renderização SSR     │
        │                       │                      │                       │
        └───────────────────────┘                      └───────────────────────┘
```

### Backend (PayloadCMS)

O backend é construído com PayloadCMS, uma plataforma headless CMS que oferece:

- **REST API**: Endpoints para gerenciar todos os dados
- **Admin UI**: Interface interna para gerenciamento
- **Autenticação**: Sistema de usuários e permissões
- **Upload de Mídia**: Gestão de arquivos e imagens
- **Hooks**: Sistema de eventos para integração com Astro
- **Validação**: Esquemas para garantir integridade dos dados

### Frontend (Astro)

O frontend utiliza Astro, uma moderna plataforma de framework para web que oferece:

- **SSR/SSG**: Renderização no servidor para SEO e performance
- **Ilha de Hidratação**: Componentes interativos apenas onde necessário
- **Motor de Renderização**: Sistema para processar templates dinâmicos
- **API Routes**: Endpoints para comunicação com PayloadCMS
- **Multi-framework**: Suporte a React, Svelte e outros frameworks
- **Detecção de Domínio**: Sistema multitenant para diferentes sites

## Coleções Fundamentais

### Users
- Gerenciamento de usuários e autenticação
- Níveis de permissão (admin, editor, client)
- Multitenancy para organizações

### Media
- Sistema de arquivos para imagens, vídeos e documentos
- Processamento automático de imagens
- CDN para entrega otimizada

### Entities
- Coleção flexível para definição dinâmica de dados
- JSON-first para máxima flexibilidade
- Suporte a schemas customizados

### Sites
- Configurações para sites de diferentes clientes
- Mapeamento de domínios
- Relações com temas e configurações

### Themes
- Definições visuais e comportamentais
- CSS, JS e HTML dinâmicos
- Sistema de validação e sincronização

## Fluxo de Dados

1. Administradores criam/modificam sites e temas no PayloadCMS
2. Hooks disparam eventos de sincronização
3. Astro atualiza seus caches e arquivos
4. Usuários finais acessam sites via domínios específicos
5. Astro identifica o domínio, carrega o site correto do PayloadCMS
6. Renderização dinâmica gera HTML baseado nas definições do tema
7. Componentes interativos são hidratados apenas onde necessário

## Principais Subsistemas

### Sistema de Temas
- Marketplace de temas pré-construídos
- Editor visual para personalização
- Preview em tempo real
- Validação automática

### Editor de Páginas
- Interface drag-and-drop
- Edição visual de propriedades
- Biblioteca de componentes
- Layout responsivo automático

### Cache Multinível
- Cache em memória para dados freqüentes
- Cache em disco para persistência
- CDN para assets estáticos
- Invalidação seletiva por webhook

### Integrações com IA
- Geração de conteúdo
- Sugestões de design
- Criação de imagens
- Otimização de SEO

## Interações entre Sistemas

```
┌─────────────────┐                              ┌─────────────────┐
│                 │                              │                 │
│   PayloadCMS    │                              │      Astro      │
│                 │                              │                 │
└────────┬────────┘                              └────────┬────────┘
         │                                                │
         │  1. Criar/Atualizar Tema                       │
         │◄─────────────────────────────────────────┐     │
         │                                          │     │
         │  2. Validar Tema (validateTheme hook)    │     │
         │────────────────────────────────────────►│     │
         │                                          │     │
         │  3. Requisição de Validação              │     │
         │─────────────────────────────────────────┼────►│
         │                                          │     │
         │  4. Resposta de Validação                │     │
         │◄────────────────────────────────────────┼─────│
         │                                          │     │
         │  5. Atualizar Status de Validação        │     │
         │◄─────────────────────────────────────────┘     │
         │                                                │
         │  6. Notificar Sobre Tema Atualizado            │
         │───────────────────────────────────────────────►│
         │                                                │
         │  7. Gerar Arquivos do Tema                     │
         │                                                │
```

## Tecnologias Principais

- **Backend**: PayloadCMS, Node.js, TypeScript
- **Banco de Dados**: SQLite (dev), PostgreSQL (prod)
- **Frontend**: Astro, React, Svelte, TailwindCSS
- **Cache**: Redis, disco local, CDN
- **Deploy**: Cloud flares pages, aws fargat

## Pilares de Performance

1. **Geração Estática Onde Possível**: Páginas que raramente mudam são pré-renderizadas
2. **Renderização no Servidor**: Para conteúdo dinâmico, mantendo boa performance de SEO
3. **Hidratação Parcial**: JavaScript apenas onde necessário
4. **Cache Multinível**: Desde memória até CDN
5. **Lazy Loading**: Carregar recursos apenas quando necessário

## Pilares de UX

1. **Feedback Imediato**: Resposta visual instantânea para ações
2. **Consistência**: Interfaces previsíveis em todo o sistema
3. **Eficiência**: Tarefas concluídas com mínimo de passos
4. **Acessibilidade**: Conformidade com WCAG 2.1
5. **Responsividade**: Experiência otimizada em todos os dispositivos

## Próximos Passos

Após compreender esta visão geral, você está pronto para explorar:

1. **Backend**: Veja `02-BACKEND/01-PAYLOAD-CONFIG.md` para detalhes da configuração do PayloadCMS
2. **Frontend**: Explore `03-FRONTEND-ADMIN/01-ESTRUTURA-GERAL.md` para entender a interface administrativa
3. **Fluxos**: Consulte `05-FLUXOS-COMPLETOS/01-CRIACAO-SITE.md` para ver como os componentes interagem em cenários reais