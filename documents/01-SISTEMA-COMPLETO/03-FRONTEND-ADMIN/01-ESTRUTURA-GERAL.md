# Estrutura Geral do Frontend Admin

Este documento descreve a estrutura geral da interface administrativa do Konduza, implementada com Astro.

## Visão Geral

O painel administrativo do Konduza é uma interface completa para gerenciamento de sites, temas, conteúdo e configurações. É projetado para ser intuitivo, responsivo e eficiente, permitindo que usuários administrem todos os aspectos da plataforma.

## Layout Principal

A interface administrativa segue um layout consistente em todas as páginas:

```
┌─────────────────────────────────────────────────────────────────┐
│ Header: Logo, Navegação Principal, Perfil, Notificações         │
├────────────┬────────────────────────────────────────────────────┤
│            │                                                    │
│            │                                                    │
│  Sidebar   │                 Área de Conteúdo                   │
│            │                                                    │
│            │                                                    │
│            │                                                    │
├────────────┴────────────────────────────────────────────────────┤
│ Footer: Copyright, Links, Versão                                │
└─────────────────────────────────────────────────────────────────┘
```

## Componentes Principais

### Header

O cabeçalho contém:

- **Logo Konduza**: Clicável, redireciona para o Dashboard
- **Navegação Principal**: Links para seções principais (Sites, Temas, Mídia, etc.)
- **Campo de Busca**: Pesquisa global por sites, temas e conteúdo
- **Notificações**: Indicador de notificações com dropdown
- **Menu de Perfil**: Avatar do usuário com acesso a configurações e logout

```html
<header class="admin-header">
  <div class="admin-header-left">
    <a href="/admin" class="admin-logo">
      <img src="/logo.svg" alt="Konduza" />
    </a>
    <nav class="admin-main-nav">
      <a href="/admin/sites">Sites</a>
      <a href="/admin/themes">Temas</a>
      <a href="/admin/media">Mídia</a>
      <a href="/admin/settings">Configurações</a>
    </nav>
  </div>
  <div class="admin-header-right">
    <div class="admin-search">
      <input type="text" placeholder="Buscar..." />
      <button type="submit">
        <span class="icon-search"></span>
      </button>
    </div>
    <div class="admin-notifications">
      <button class="notifications-toggle">
        <span class="icon-bell"></span>
        <span class="notification-badge">3</span>
      </button>
      <!-- Dropdown de notificações -->
    </div>
    <div class="admin-profile">
      <button class="profile-toggle">
        <img src="/avatar.jpg" alt="Perfil" />
      </button>
      <!-- Dropdown de perfil -->
    </div>
  </div>
</header>
```

### Sidebar

A barra lateral é contextual e muda conforme a seção atual:

- **Dashboard**: Estatísticas gerais e atividade recente
- **Sites**: Lista de sites e opções de criação
- **Temas**: Biblioteca de temas e ferramentas de customização
- **Mídia**: Biblioteca de mídia e uploads
- **Usuários**: Gerenciamento de usuários e permissões
- **Configurações**: Configuração global da plataforma

A sidebar pode ser recolhida para maximizar o espaço em telas menores.

```html
<aside class="admin-sidebar">
  <div class="sidebar-section">
    <h3>Sites</h3>
    <ul>
      <li><a href="/admin/sites">Todos os Sites</a></li>
      <li><a href="/admin/sites/criar">Criar Novo Site</a></li>
      <li><a href="/admin/sites/domínios">Gerenciar Domínios</a></li>
    </ul>
  </div>
  
  <div class="sidebar-section">
    <h3>Tema Atual</h3>
    <ul>
      <li><a href="/admin/themes/editor">Editor de Tema</a></li>
      <li><a href="/admin/themes/componentes">Componentes</a></li>
      <li><a href="/admin/themes/cores">Cores e Estilos</a></li>
    </ul>
  </div>
  
  <div class="sidebar-toggle">
    <button>
      <span class="icon-menu-fold"></span>
    </button>
  </div>
</aside>
```

### Área de Conteúdo

A área principal de conteúdo contém:

- **Cabeçalho da Página**: Título da página, breadcrumbs e ações principais
- **Conteúdo Principal**: Interface específica da seção atual
- **Rodapé da Página**: Paginação, contagem de itens e outras informações

```html
<main class="admin-content">
  <div class="page-header">
    <div class="page-title">
      <h1>Dashboard</h1>
      <nav class="breadcrumbs">
        <a href="/admin">Admin</a> / Dashboard
      </nav>
    </div>
    <div class="page-actions">
      <button class="btn-primary">Novo Site</button>
      <button class="btn-secondary">Exportar</button>
    </div>
  </div>
  
  <div class="content-container">
    <!-- Conteúdo específico da página -->
  </div>
  
  <div class="page-footer">
    <div class="pagination">
      <!-- Controles de paginação -->
    </div>
    <div class="item-count">
      Exibindo 1-10 de 42 itens
    </div>
  </div>
</main>
```

### Footer

O rodapé contém:

- **Copyright**: Informações de direitos autorais
- **Links Úteis**: Documentação, suporte, termos de uso
- **Versão**: Número da versão do sistema

```html
<footer class="admin-footer">
  <div class="footer-copyright">
    &copy; 2025 Konduza. Todos os direitos reservados.
  </div>
  <div class="footer-links">
    <a href="/docs">Documentação</a>
    <a href="/support">Suporte</a>
    <a href="/terms">Termos</a>
  </div>
  <div class="footer-version">
    Versão 1.0.0
  </div>
</footer>
```

## Navegação Principal

A estrutura de navegação do sistema administrativo inclui:

1. **Dashboard**
   - Visão geral do sistema
   - Estatísticas e métricas
   - Atividade recente

2. **Sites**
   - Lista de sites
   - Criação e edição de sites
   - Configurações de domínio
   - Publicação e status

3. **Temas**
   - Biblioteca de temas
   - Editor de temas
   - Marketplace
   - Validação de temas

4. **Mídia**
   - Biblioteca de mídia
   - Upload de arquivos
   - Gerenciamento de pastas

5. **Entidades**
   - Gerenciamento de entidades dinâmicas
   - Criação de esquemas
   - Visualização de dados

6. **Usuários**
   - Gerenciamento de usuários
   - Perfis e permissões
   - Convites

7. **Relatórios**
   - Analytics por site
   - Métricas de uso
   - Exportação de dados

8. **Configurações**
   - Configurações globais
   - Integrações
   - Segurança
   - Personalização

## Estados da Interface

A interface suporta múltiplos estados para cada componente:

1. **Estado de Carregamento**: 
   - Skeleton loaders para conteúdo
   - Indicadores de progresso
   - Feedback visual enquanto dados são carregados

2. **Estado Vazio**: 
   - Mensagens amigáveis quando não há dados
   - Sugestões de ação inicial
   - Ilustrações contextuais

3. **Estado de Erro**: 
   - Mensagens claras de erro
   - Sugestões para resolução
   - Opções para tentar novamente

4. **Estado de Sucesso**: 
   - Confirmações visuais de ações bem-sucedidas
   - Notificações temporárias não-intrusivas

## Responsividade

A interface administrativa é totalmente responsiva e se adapta a diferentes tamanhos de tela:

1. **Desktop (1200px+)**:
   - Layout completo com sidebar expandida
   - Visualização em grid para listas
   - Todas as ferramentas visíveis

2. **Tablet (768px-1199px)**:
   - Sidebar recolhível
   - Layout adaptado para espaço reduzido
   - Menus condensados

3. **Mobile (< 768px)**:
   - Interface otimizada para toque
   - Sidebar oculta por padrão (acessível via menu)
   - Design empilhado para formulários e listas

```css
/* Exemplo de abordagem responsiva */
.admin-layout {
  display: grid;
  grid-template-columns: 250px 1fr;
  grid-template-areas: "header header" "sidebar content" "footer footer";
}

@media (max-width: 1199px) {
  .admin-layout {
    grid-template-columns: 64px 1fr;
  }
  
  .admin-sidebar {
    width: 64px;
    overflow: hidden;
  }
  
  .sidebar-labels {
    display: none;
  }
}

@media (max-width: 767px) {
  .admin-layout {
    grid-template-columns: 1fr;
    grid-template-areas: "header" "content" "footer";
  }
  
  .admin-sidebar {
    position: fixed;
    left: -250px;
    transition: left 0.3s ease;
  }
  
  .admin-sidebar.open {
    left: 0;
  }
}
```

## Temas e Personalização

A interface administrativa suporta temas claros e escuros:

1. **Tema Claro**: Padrão, otimizado para uso diurno
2. **Tema Escuro**: Reduz fadiga visual em ambientes com pouca luz
3. **Sistema**: Segue a preferência do sistema operacional do usuário

```html
<div class="theme-selector">
  <button data-theme="light">
    <span class="icon-sun"></span> Claro
  </button>
  <button data-theme="dark">
    <span class="icon-moon"></span> Escuro
  </button>
  <button data-theme="system">
    <span class="icon-computer"></span> Sistema
  </button>
</div>
```

## Componentes UI Comuns

A interface utiliza um conjunto consistente de componentes:

1. **Botões**:
   - Primário (ações principais)
   - Secundário (ações alternativas)
   - Terciário (ações de menor prioridade)
   - Ícone (ações compactas)
   
2. **Formulários**:
   - Inputs de texto
   - Selects
   - Checkboxes e Radios
   - Uploads de arquivo
   - Editor rich text
   
3. **Tabelas e Listas**:
   - Ordenação por coluna
   - Filtragem
   - Paginação
   - Seleção múltipla
   
4. **Cards**:
   - Informacionais
   - Interativos
   - Estatísticas
   
5. **Modais e Drawers**:
   - Confirmações
   - Formulários
   - Visualizações detalhadas

6. **Notificações**:
   - Toasts (notificações temporárias)
   - Alertas permanentes
   - Badges

## Considerações de UX

1. **Feedback Imediato**: Toda ação deve ter feedback visual imediato
2. **Prevenção de Erros**: Confirmar ações destrutivas e oferecer desfazer
3. **Consistência**: Manter padrões visuais e comportamentais em toda a interface
4. **Eficiência**: Minimizar cliques para operações comuns
5. **Acessibilidade**: Suportar navegação por teclado e leitores de tela

## Considerações de Performance

1. **Lazy Loading**: Carregar componentes sob demanda
2. **Virtualização**: Para listas longas, renderizar apenas itens visíveis
3. **Client-Side Cache**: Armazenar dados frequentes em memória
4. **Debounce e Throttle**: Para inputs e eventos frequentes
5. **Code Splitting**: Carregar apenas o JavaScript necessário

## Implementação Técnica

A implementação utiliza Astro com ilhas de interatividade em React/Svelte:

```astro
---
// src/pages/admin/dashboard.astro
import AdminLayout from '../../layouts/AdminLayout.astro';
import StatisticsPanel from '../../components/admin/StatisticsPanel.svelte';
import RecentActivity from '../../components/admin/RecentActivity.jsx';
import { fetchDashboardData } from '../../api/admin';

// Dados carregados no servidor
const dashboardData = await fetchDashboardData();
---

<AdminLayout title="Dashboard | Konduza Admin">
  <div class="page-header">
    <h1>Dashboard</h1>
    <p>Bem-vindo ao painel administrativo do Konduza.</p>
  </div>
  
  <div class="dashboard-grid">
    <!-- Componente Svelte com hidratação no cliente -->
    <StatisticsPanel data={dashboardData.statistics} client:load />
    
    <!-- Widget estático renderizado no servidor -->
    <div class="quick-actions">
      <h2>Ações Rápidas</h2>
      <div class="actions-grid">
        <a href="/admin/sites/criar" class="action-card">
          <span class="icon-globe"></span>
          <span>Novo Site</span>
        </a>
        <!-- Mais ações... -->
      </div>
    </div>
    
    <!-- Componente React com hidratação no cliente -->
    <RecentActivity data={dashboardData.activity} client:visible />
  </div>
</AdminLayout>
```

## Próximos Passos

Após entender a estrutura geral da interface administrativa, você pode explorar:

1. **Dashboard**: Ver `02-DASHBOARD.md` para detalhes do painel principal
2. **Sites**: Explorar `03-GERENCIAMENTO-SITES.md` para implementação do CRUD de sites
3. **Temas**: Consultar `04-EDITOR-TEMAS.md` para detalhes do editor visual de temas

Esta documentação fornece uma visão geral da estrutura da interface administrativa. Cada seção específica tem seu próprio documento com detalhes de implementação.