import { PayloadRequest } from 'payload/types';

// Estender o tipo PayloadRequest para incluir informações de role por site
declare module 'payload/types' {
  export interface PayloadRequest {
    siteRole?: any;
    siteAssignment?: any;
  }
}

// Interfaces para as novas coleções
export interface SiteUserRole {
  id: string;
  name: string;
  slug: string;
  site: string | { id: string; name: string };
  description?: string;
  permissions: {
    resource: string;
    actions: string[];
  }[];
  customFields?: {
    fieldName: string;
    fieldType: string;
    required: boolean;
    options?: {
      label: string;
      value: string;
    }[];
  }[];
}

export interface SiteUserAssignment {
  id: string;
  user: string | { id: string; email: string; name: string };
  site: string | { id: string; name: string };
  role: string | SiteUserRole;
  customData?: any;
  isActive: boolean;
}