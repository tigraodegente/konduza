# Implementação do Sistema de Roles por Site

Este documento detalha os passos técnicos específicos para implementar o sistema de roles (papéis) por site, a primeira e mais importante fase do desenvolvimento do Konduza.

## 1. Modelo de Dados

### 1.1 Nova Coleção: SiteUserRoles

```typescript
// backend/src/collections/SiteUserRoles.ts

import { CollectionConfig } from 'payload/types';

export const SiteUserRoles: CollectionConfig = {
  slug: 'site-user-roles',
  admin: {
    useAsTitle: 'name',
    defaultColumns: ['name', 'site', 'createdAt'],
    group: 'Sistema'
  },
  access: {
    read: ({ req: { user } }) => {
      if (user?.roles?.includes('admin')) return true;
      return false;
    },
    create: ({ req: { user } }) => {
      if (user?.roles?.includes('admin')) return true;
      return false;
    },
    update: ({ req: { user } }) => {
      if (user?.roles?.includes('admin')) return true;
      return false;
    },
    delete: ({ req: { user } }) => {
      if (user?.roles?.includes('admin')) return true;
      return false;
    }
  },
  fields: [
    {
      name: 'name',
      type: 'text',
      required: true,
      admin: {
        description: 'Nome do papel de usuário (ex: Cliente, Membro, Professor)'
      }
    },
    {
      name: 'slug',
      type: 'text',
      required: true,
      unique: true,
      admin: {
        description: 'Identificador único (ex: cliente, membro, professor)'
      }
    },
    {
      name: 'site',
      type: 'relationship',
      relationTo: 'sites',
      required: true,
      admin: {
        description: 'Site ao qual este papel pertence'
      }
    },
    {
      name: 'description',
      type: 'textarea',
      admin: {
        description: 'Descrição detalhada deste papel de usuário'
      }
    },
    {
      name: 'permissions',
      type: 'array',
      admin: {
        description: 'Permissões específicas para este papel'
      },
      fields: [
        {
          name: 'resource',
          type: 'select',
          required: true,
          options: [
            { label: 'Páginas', value: 'pages' },
            { label: 'Posts', value: 'posts' },
            { label: 'Produtos', value: 'products' },
            { label: 'Mídia', value: 'media' },
            { label: 'Configurações', value: 'settings' },
            { label: 'Usuários', value: 'users' },
            { label: 'Formulários', value: 'forms' }
          ]
        },
        {
          name: 'actions',
          type: 'select',
          hasMany: true,
          required: true,
          options: [
            { label: 'Visualizar', value: 'read' },
            { label: 'Criar', value: 'create' },
            { label: 'Editar', value: 'update' },
            { label: 'Excluir', value: 'delete' }
          ]
        }
      ]
    },
    {
      name: 'customFields',
      type: 'array',
      admin: {
        description: 'Campos personalizados para usuários com este papel'
      },
      fields: [
        {
          name: 'fieldName',
          type: 'text',
          required: true
        },
        {
          name: 'fieldType',
          type: 'select',
          required: true,
          options: [
            { label: 'Texto', value: 'text' },
            { label: 'Número', value: 'number' },
            { label: 'Email', value: 'email' },
            { label: 'Data', value: 'date' },
            { label: 'Seleção', value: 'select' },
            { label: 'Checkbox', value: 'checkbox' }
          ]
        },
        {
          name: 'required',
          type: 'checkbox',
          label: 'Obrigatório'
        },
        {
          name: 'options',
          type: 'array',
          admin: {
            condition: (data, siblingData) => siblingData.fieldType === 'select'
          },
          fields: [
            {
              name: 'label',
              type: 'text',
              required: true
            },
            {
              name: 'value',
              type: 'text',
              required: true
            }
          ]
        }
      ]
    }
  ]
};
```

### 1.2 Nova Coleção: SiteUserAssignments

```typescript
// backend/src/collections/SiteUserAssignments.ts

import { CollectionConfig } from 'payload/types';

export const SiteUserAssignments: CollectionConfig = {
  slug: 'site-user-assignments',
  admin: {
    useAsTitle: 'id',
    defaultColumns: ['user', 'site', 'role', 'createdAt'],
    group: 'Sistema'
  },
  access: {
    read: ({ req: { user } }) => {
      if (user?.roles?.includes('admin')) return true;
      return false;
    },
    create: ({ req: { user } }) => {
      if (user?.roles?.includes('admin')) return true;
      return false;
    },
    update: ({ req: { user } }) => {
      if (user?.roles?.includes('admin')) return true;
      return false;
    },
    delete: ({ req: { user } }) => {
      if (user?.roles?.includes('admin')) return true;
      return false;
    }
  },
  fields: [
    {
      name: 'user',
      type: 'relationship',
      relationTo: 'users',
      required: true
    },
    {
      name: 'site',
      type: 'relationship',
      relationTo: 'sites',
      required: true
    },
    {
      name: 'role',
      type: 'relationship',
      relationTo: 'site-user-roles',
      required: true
    },
    {
      name: 'customData',
      type: 'json',
      admin: {
        description: 'Dados personalizados deste usuário para o site',
      }
    },
    {
      name: 'isActive',
      type: 'checkbox',
      defaultValue: true,
      admin: {
        description: 'Indica se este acesso está ativo'
      }
    }
  ],
  indexes: [
    {
      fields: ['user', 'site'],
      unique: true
    }
  ]
};
```

### 1.3 Modificações na Coleção Users

```typescript
// Adição ao backend/src/collections/Users.ts

// Adicionar estes campos na configuração de fields:
{
  name: 'siteRoles',
  type: 'relationship',
  relationTo: 'site-user-assignments',
  hasMany: true,
  admin: {
    description: 'Associações deste usuário com sites específicos'
  }
}
```

### 1.4 Modificações na Coleção Sites

```typescript
// Adição ao backend/src/collections/Sites.ts

// Adicionar estes campos na configuração de fields:
{
  name: 'siteRoles',
  type: 'relationship',
  relationTo: 'site-user-roles',
  hasMany: true,
  admin: {
    description: 'Papéis de usuário disponíveis neste site'
  }
}
```

## 2. APIs e Middleware

### 2.1 API de Verificação de Permissões

```typescript
// backend/src/endpoints/check-site-permission.ts

import { PayloadRequest } from 'payload/types';
import { Response, NextFunction } from 'express';
import payload from 'payload';

export const checkSitePermission = async (req: PayloadRequest, res: Response) => {
  try {
    const { siteId, resource, action } = req.body;
    const user = req.user;

    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Unauthorized: User not authenticated'
      });
    }

    if (!siteId || !resource || !action) {
      return res.status(400).json({
        success: false,
        message: 'Bad request: Missing required parameters'
      });
    }

    // Verificar se o usuário é admin global
    if (user.roles && user.roles.includes('admin')) {
      return res.status(200).json({
        success: true,
        hasPermission: true,
        message: 'User has global admin permission'
      });
    }

    // Buscar atribuição do usuário para o site
    const siteUserAssignment = await payload.find({
      collection: 'site-user-assignments',
      where: {
        and: [
          { user: { equals: user.id } },
          { site: { equals: siteId } },
          { isActive: { equals: true } }
        ]
      },
      limit: 1
    });

    if (!siteUserAssignment.docs || siteUserAssignment.docs.length === 0) {
      return res.status(200).json({
        success: true,
        hasPermission: false,
        message: 'User has no assignment for this site'
      });
    }

    const assignment = siteUserAssignment.docs[0];

    // Buscar role do usuário
    const roleId = assignment.role;
    const role = await payload.findByID({
      collection: 'site-user-roles',
      id: roleId
    });

    if (!role) {
      return res.status(200).json({
        success: true,
        hasPermission: false,
        message: 'Role not found'
      });
    }

    // Verificar permissões
    const permissions = role.permissions || [];
    const hasPermission = permissions.some(perm => 
      perm.resource === resource && perm.actions.includes(action)
    );

    return res.status(200).json({
      success: true,
      hasPermission,
      message: hasPermission ? 'Permission granted' : 'Permission denied'
    });
  } catch (error) {
    console.error('Error checking site permission:', error);
    return res.status(500).json({
      success: false,
      message: 'Server error checking permission'
    });
  }
};

export default checkSitePermission;
```

### 2.2 Middleware de Autorização por Site

```typescript
// backend/src/middleware/requireSitePermission.ts

import { PayloadRequest } from 'payload/types';
import { Response, NextFunction } from 'express';
import payload from 'payload';

export const requireSitePermission = (resource: string, action: string) => {
  return async (req: PayloadRequest, res: Response, next: NextFunction) => {
    try {
      // Obter ID do site da rota ou query param
      const siteId = req.params.siteId || req.query.siteId;
      
      if (!siteId) {
        return res.status(400).json({
          success: false,
          message: 'Site ID is required'
        });
      }

      const user = req.user;
      
      if (!user) {
        return res.status(401).json({
          success: false,
          message: 'Unauthorized: User not authenticated'
        });
      }

      // Verificar se o usuário é admin global
      if (user.roles && user.roles.includes('admin')) {
        return next();
      }

      // Buscar atribuição do usuário para o site
      const siteUserAssignment = await payload.find({
        collection: 'site-user-assignments',
        where: {
          and: [
            { user: { equals: user.id } },
            { site: { equals: siteId } },
            { isActive: { equals: true } }
          ]
        },
        limit: 1
      });

      if (!siteUserAssignment.docs || siteUserAssignment.docs.length === 0) {
        return res.status(403).json({
          success: false,
          message: 'Forbidden: User has no assignment for this site'
        });
      }

      const assignment = siteUserAssignment.docs[0];

      // Buscar role do usuário
      const roleId = assignment.role;
      const role = await payload.findByID({
        collection: 'site-user-roles',
        id: roleId
      });

      if (!role) {
        return res.status(403).json({
          success: false,
          message: 'Forbidden: Role not found'
        });
      }

      // Verificar permissões
      const permissions = role.permissions || [];
      const hasPermission = permissions.some(perm => 
        perm.resource === resource && perm.actions.includes(action)
      );

      if (!hasPermission) {
        return res.status(403).json({
          success: false,
          message: `Forbidden: Insufficient permissions for ${resource}:${action}`
        });
      }

      // Adicionar informações de role ao request para uso posterior
      req.siteRole = role;
      req.siteAssignment = assignment;
      
      return next();
    } catch (error) {
      console.error('Error in requireSitePermission middleware:', error);
      return res.status(500).json({
        success: false,
        message: 'Server error checking site permission'
      });
    }
  };
};

export default requireSitePermission;
```

## 3. Modificações no Frontend

### 3.1 Utilitário de API para Site Roles

```javascript
// src/utils/sitePermissions.js

/**
 * Verifica se o usuário tem permissão para um recurso em um site específico
 * @param {string} siteId - ID do site
 * @param {string} resource - Recurso (pages, posts, media, etc.)
 * @param {string} action - Ação (read, create, update, delete)
 * @returns {Promise<boolean>} - True se tem permissão, false caso contrário
 */
export async function checkSitePermission(siteId, resource, action) {
  try {
    const response = await fetch('/api/check-site-permission', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        siteId,
        resource,
        action
      }),
      credentials: 'include'
    });

    if (!response.ok) {
      console.error('Error checking permission:', response.statusText);
      return false;
    }

    const data = await response.json();
    return data.hasPermission;
  } catch (error) {
    console.error('Failed to check permission:', error);
    return false;
  }
}

/**
 * Obtém todas as permissões do usuário para um site específico
 * @param {string} siteId - ID do site
 * @returns {Promise<Array>} - Array de permissões do usuário
 */
export async function getUserSiteRole(siteId) {
  try {
    const response = await fetch(`/api/user-site-role?siteId=${siteId}`, {
      credentials: 'include'
    });

    if (!response.ok) {
      console.error('Error fetching user site role:', response.statusText);
      return null;
    }

    const data = await response.json();
    return data.role;
  } catch (error) {
    console.error('Failed to fetch user site role:', error);
    return null;
  }
}

/**
 * Obtém todos os sites aos quais o usuário tem acesso
 * @returns {Promise<Array>} - Array de sites com suas permissões
 */
export async function getUserSites() {
  try {
    const response = await fetch('/api/user-sites', {
      credentials: 'include'
    });

    if (!response.ok) {
      console.error('Error fetching user sites:', response.statusText);
      return [];
    }

    const data = await response.json();
    return data.sites;
  } catch (error) {
    console.error('Failed to fetch user sites:', error);
    return [];
  }
}
```

### 3.2 API Routes para Site Roles

```javascript
// src/pages/api/check-site-permission.js

export async function post({ request }) {
  try {
    const body = await request.json();
    const { siteId, resource, action } = body;
    
    if (!siteId || !resource || !action) {
      return new Response(JSON.stringify({
        success: false,
        message: 'Missing required parameters'
      }), { status: 400 });
    }
    
    const apiUrl = import.meta.env.PUBLIC_API_URL;
    const response = await fetch(`${apiUrl}/api/check-site-permission`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Cookie': request.headers.get('cookie') || ''
      },
      body: JSON.stringify({
        siteId,
        resource,
        action
      })
    });
    
    const data = await response.json();
    return new Response(JSON.stringify(data), { status: response.status });
  } catch (error) {
    console.error('Error in check-site-permission endpoint:', error);
    return new Response(JSON.stringify({
      success: false,
      message: 'Server error'
    }), { status: 500 });
  }
}
```

```javascript
// src/pages/api/user-site-role.js

export async function get({ request }) {
  try {
    const url = new URL(request.url);
    const siteId = url.searchParams.get('siteId');
    
    if (!siteId) {
      return new Response(JSON.stringify({
        success: false,
        message: 'Site ID is required'
      }), { status: 400 });
    }
    
    const apiUrl = import.meta.env.PUBLIC_API_URL;
    const response = await fetch(`${apiUrl}/api/user-site-role?siteId=${siteId}`, {
      headers: {
        'Cookie': request.headers.get('cookie') || ''
      }
    });
    
    const data = await response.json();
    return new Response(JSON.stringify(data), { status: response.status });
  } catch (error) {
    console.error('Error in user-site-role endpoint:', error);
    return new Response(JSON.stringify({
      success: false,
      message: 'Server error'
    }), { status: 500 });
  }
}
```

```javascript
// src/pages/api/user-sites.js

export async function get({ request }) {
  try {
    const apiUrl = import.meta.env.PUBLIC_API_URL;
    const response = await fetch(`${apiUrl}/api/user-sites`, {
      headers: {
        'Cookie': request.headers.get('cookie') || ''
      }
    });
    
    const data = await response.json();
    return new Response(JSON.stringify(data), { status: response.status });
  } catch (error) {
    console.error('Error in user-sites endpoint:', error);
    return new Response(JSON.stringify({
      success: false,
      message: 'Server error'
    }), { status: 500 });
  }
}
```

### 3.3 Componente de Permissão Condicional

```jsx
// src/components/ConditionalAccess.jsx

import { useState, useEffect } from 'react';
import { checkSitePermission } from '../utils/sitePermissions';

export default function ConditionalAccess({ 
  siteId, 
  resource, 
  action, 
  children, 
  fallback = null 
}) {
  const [hasPermission, setHasPermission] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function checkAccess() {
      if (!siteId || !resource || !action) {
        setHasPermission(false);
        setLoading(false);
        return;
      }
      
      try {
        const permitted = await checkSitePermission(siteId, resource, action);
        setHasPermission(permitted);
      } catch (error) {
        console.error('Error checking permissions:', error);
        setHasPermission(false);
      } finally {
        setLoading(false);
      }
    }
    
    checkAccess();
  }, [siteId, resource, action]);

  if (loading) {
    // Render loading state
    return <div className="loading-indicator">Verificando permissões...</div>;
  }

  return hasPermission ? children : fallback;
}
```

### 3.4 Modificação do Layout Administrativo

```astro
<!-- src/layouts/AdminLayout.astro (parcial) -->

---
// Imports existentes...
import ConditionalAccess from '../components/ConditionalAccess.jsx';
import { getUserSites } from '../utils/sitePermissions';

// Código existente...

// Obter sites do usuário
const userSites = await getUserSites();

// Obter site atual (se estiver na navegação por site)
const currentUrl = Astro.url.pathname;
const siteIdMatch = currentUrl.match(/\/admin\/sites\/([^\/]+)/);
const currentSiteId = siteIdMatch ? siteIdMatch[1] : null;

// Determinar se a navegação deve ser global ou específica de site
const isInSiteContext = !!currentSiteId;
---

<div class="admin-layout">
  <aside class="sidebar">
    <!-- Menu Global (sempre visível) -->
    <nav class="global-nav">
      <a href="/admin" class={currentUrl === '/admin' ? 'active' : ''}>
        <span class="icon">🏠</span> Dashboard
      </a>
      
      <a href="/admin/sites" class={currentUrl.startsWith('/admin/sites') ? 'active' : ''}>
        <span class="icon">🌐</span> Sites
      </a>
      
      <a href="/admin/themes" class={currentUrl.startsWith('/admin/themes') ? 'active' : ''}>
        <span class="icon">🎨</span> Temas
      </a>
      
      <a href="/admin/users" class={currentUrl.startsWith('/admin/users') ? 'active' : ''}>
        <span class="icon">👥</span> Usuários
      </a>
      
      <a href="/admin/settings" class={currentUrl.startsWith('/admin/settings') ? 'active' : ''}>
        <span class="icon">⚙️</span> Configurações
      </a>
    </nav>
    
    <!-- Menu de Site (visível apenas em contexto de site) -->
    {isInSiteContext && (
      <nav class="site-nav">
        <div class="site-header">
          <h3>Site: {currentSite?.name || 'Carregando...'}</h3>
        </div>
        
        <ConditionalAccess siteId={currentSiteId} resource="pages" action="read">
          <a href={`/admin/sites/${currentSiteId}/paginas`} 
             class={currentUrl.includes(`/admin/sites/${currentSiteId}/paginas`) ? 'active' : ''}>
            <span class="icon">📄</span> Páginas
          </a>
        </ConditionalAccess>
        
        <ConditionalAccess siteId={currentSiteId} resource="posts" action="read">
          <a href={`/admin/sites/${currentSiteId}/posts`} 
             class={currentUrl.includes(`/admin/sites/${currentSiteId}/posts`) ? 'active' : ''}>
            <span class="icon">📰</span> Posts
          </a>
        </ConditionalAccess>
        
        <ConditionalAccess siteId={currentSiteId} resource="media" action="read">
          <a href={`/admin/sites/${currentSiteId}/media`} 
             class={currentUrl.includes(`/admin/sites/${currentSiteId}/media`) ? 'active' : ''}>
            <span class="icon">🖼️</span> Mídia
          </a>
        </ConditionalAccess>
        
        <ConditionalAccess siteId={currentSiteId} resource="users" action="read">
          <a href={`/admin/sites/${currentSiteId}/usuarios`} 
             class={currentUrl.includes(`/admin/sites/${currentSiteId}/usuarios`) ? 'active' : ''}>
            <span class="icon">👤</span> Usuários do Site
          </a>
        </ConditionalAccess>
        
        <ConditionalAccess siteId={currentSiteId} resource="settings" action="read">
          <a href={`/admin/sites/${currentSiteId}/configuracoes`} 
             class={currentUrl.includes(`/admin/sites/${currentSiteId}/configuracoes`) ? 'active' : ''}>
            <span class="icon">⚙️</span> Configurações do Site
          </a>
        </ConditionalAccess>
      </nav>
    )}
    
    <!-- Lista de Sites do Usuário -->
    {!isInSiteContext && userSites.length > 0 && (
      <div class="user-sites">
        <h4>Seus Sites</h4>
        <ul>
          {userSites.map(site => (
            <li>
              <a href={`/admin/sites/${site.id}`}>{site.name}</a>
            </li>
          ))}
        </ul>
      </div>
    )}
  </aside>
  
  <!-- Conteúdo da página -->
  <main class="content">
    <slot />
  </main>
</div>
```

## 4. Telas de Administração de Roles

### 4.1 Interface para Gerenciamento de Tipos de Usuário

```astro
<!-- src/pages/admin/sites/[id]/usuarios/tipos.astro -->

---
import AdminLayout from '../../../../../layouts/AdminLayout.astro';
import ConditionalAccess from '../../../../../components/ConditionalAccess.jsx';
import { getSiteById } from '../../../../../utils/api.js';
import { getUserSiteRole } from '../../../../../utils/sitePermissions.js';

// Obter ID do site da URL
const { id: siteId } = Astro.params;

// Verificar permissões - redirecionar se não tiver acesso
const role = await getUserSiteRole(siteId);
const hasAccess = 
  role?.permissions?.some(p => p.resource === 'users' && p.actions.includes('update')) || 
  false;

if (!hasAccess) {
  return Astro.redirect('/admin/sites');
}

// Obter dados do site
const site = await getSiteById(siteId);

// Obter tipos de usuário deste site
const userRoles = site?.siteRoles || [];
---

<AdminLayout title={`Tipos de Usuário - ${site?.name || 'Site'}`} currentSection="sites">
  <ConditionalAccess siteId={siteId} resource="users" action="update" client:load>
    <div class="page-header">
      <div class="page-title">
        <h1>Tipos de Usuário</h1>
        <nav class="breadcrumbs">
          <a href="/admin">Admin</a> / 
          <a href="/admin/sites">Sites</a> / 
          <a href={`/admin/sites/${siteId}`}>{site?.name}</a> / 
          <a href={`/admin/sites/${siteId}/usuarios`}>Usuários</a> / 
          Tipos
        </nav>
      </div>
      <div class="page-actions">
        <a href={`/admin/sites/${siteId}/usuarios/tipos/criar`} class="btn-primary">
          Novo Tipo de Usuário
        </a>
      </div>
    </div>
    
    <!-- Lista de Tipos de Usuário -->
    <div class="content-container">
      <table class="data-table">
        <thead>
          <tr>
            <th>Nome</th>
            <th>Slug</th>
            <th>Descrição</th>
            <th>Permissões</th>
            <th>Campos</th>
            <th>Ações</th>
          </tr>
        </thead>
        <tbody>
          {userRoles.map(role => (
            <tr>
              <td>{role.name}</td>
              <td>{role.slug}</td>
              <td>{role.description}</td>
              <td>{role.permissions?.length || 0} permissões</td>
              <td>{role.customFields?.length || 0} campos</td>
              <td class="actions">
                <a href={`/admin/sites/${siteId}/usuarios/tipos/${role.id}`} class="action-btn">
                  Ver
                </a>
                <a href={`/admin/sites/${siteId}/usuarios/tipos/${role.id}/editar`} class="action-btn">
                  Editar
                </a>
                <button class="action-btn delete-btn" data-id={role.id}>
                  Excluir
                </button>
              </td>
            </tr>
          ))}
          
          {userRoles.length === 0 && (
            <tr>
              <td colspan="6" class="empty-state">
                Nenhum tipo de usuário definido para este site.
                <br />
                <a href={`/admin/sites/${siteId}/usuarios/tipos/criar`}>
                  Criar o primeiro tipo de usuário
                </a>
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
    
    <!-- Exemplos de Tipos Comuns -->
    {userRoles.length === 0 && (
      <div class="content-container">
        <h3>Exemplos de Tipos de Usuário</h3>
        <p class="help-text">
          Estes são exemplos comuns de tipos de usuário que você pode criar:
        </p>
        
        <div class="role-examples">
          <div class="role-card">
            <h4>Cliente</h4>
            <p>Para sites de e-commerce, com permissões para gerenciar pedidos e perfil.</p>
            <button class="btn-secondary create-example" data-template="cliente">
              Criar Modelo
            </button>
          </div>
          
          <div class="role-card">
            <h4>Membro</h4>
            <p>Para sites de associação, com acesso a conteúdo exclusivo.</p>
            <button class="btn-secondary create-example" data-template="membro">
              Criar Modelo
            </button>
          </div>
          
          <div class="role-card">
            <h4>Autor</h4>
            <p>Para blogs, com permissões para criar e editar posts.</p>
            <button class="btn-secondary create-example" data-template="autor">
              Criar Modelo
            </button>
          </div>
          
          <div class="role-card">
            <h4>Estudante</h4>
            <p>Para sites educacionais, com acesso a cursos e materiais.</p>
            <button class="btn-secondary create-example" data-template="estudante">
              Criar Modelo
            </button>
          </div>
        </div>
      </div>
    )}
  </ConditionalAccess>
</AdminLayout>

<style>
  .role-examples {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(250px, 1fr));
    gap: var(--spacing-md);
    margin-top: var(--spacing-md);
  }
  
  .role-card {
    padding: var(--spacing-md);
    border: 1px solid var(--border-light);
    border-radius: var(--border-radius-md);
    background-color: var(--bg-light);
  }
  
  .role-card h4 {
    margin-top: 0;
    margin-bottom: var(--spacing-sm);
  }
  
  .role-card p {
    margin-bottom: var(--spacing-md);
    color: var(--text-secondary);
  }
  
  .empty-state {
    text-align: center;
    padding: var(--spacing-lg);
    color: var(--text-secondary);
  }
</style>

<script>
  // Manipuladores para botões de exclusão
  document.querySelectorAll('.delete-btn').forEach(button => {
    button.addEventListener('click', async () => {
      const roleId = button.dataset.id;
      if (!roleId) return;
      
      if (confirm('Tem certeza que deseja excluir este tipo de usuário? Esta ação não pode ser desfeita.')) {
        try {
          const siteId = window.location.pathname.split('/')[3];
          const response = await fetch(`/api/site-user-roles/${roleId}`, {
            method: 'DELETE',
            headers: {
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({ siteId })
          });
          
          if (response.ok) {
            window.location.reload();
          } else {
            const data = await response.json();
            alert(`Erro ao excluir: ${data.message || 'Tente novamente'}`);
          }
        } catch (error) {
          console.error('Error deleting role:', error);
          alert('Erro ao excluir tipo de usuário. Tente novamente.');
        }
      }
    });
  });
  
  // Manipuladores para botões de criar modelo
  document.querySelectorAll('.create-example').forEach(button => {
    button.addEventListener('click', async () => {
      const template = button.dataset.template;
      if (!template) return;
      
      try {
        const siteId = window.location.pathname.split('/')[3];
        const response = await fetch(`/api/create-role-template`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ 
            siteId,
            template
          })
        });
        
        if (response.ok) {
          window.location.reload();
        } else {
          const data = await response.json();
          alert(`Erro ao criar modelo: ${data.message || 'Tente novamente'}`);
        }
      } catch (error) {
        console.error('Error creating template:', error);
        alert('Erro ao criar modelo. Tente novamente.');
      }
    });
  });
</script>
```

## 5. Testes e Implantação

1. Criar dados de teste para validar o modelo
2. Testar fluxos de permissão com diferentes tipos de usuário
3. Verificar se o menu de navegação adapta-se corretamente ao contexto
4. Validar redirecionamentos para usuários sem permissão

## 6. Próximos Passos

Após a implementação do sistema de roles por site, os próximos passos serão:

1. Implementar a nova estrutura de navegação global/contextual
2. Migrar rotas existentes para o novo padrão dentro de contexto de site
3. Desenvolver formulários personalizados de registro por tipo de usuário
4. Implementar áreas de usuário customizadas no frontend público

Este documento fornece uma abordagem estruturada para a implementação da primeira fase do desenvolvimento, focando no sistema de permissões por site, que é o alicerce para todas as melhorias futuras.