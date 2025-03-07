/**
 * Utilitário para validação de temas via JSON Schema
 * 
 * Este módulo verifica se um tema está correto e pode ser utilizado,
 * utilizando JSON Schema e validações adicionais específicas.
 */

// Ajudantes para validação
const VALID_VERSION_REGEX = /^\d+\.\d+\.\d+$/;
const VALID_COLOR_REGEX = /^(#[0-9A-Fa-f]{3,8}|rgba?\(.+\)|hsla?\(.+\)|var\(.+\))$/;

/**
 * Valida um tema a partir do JSON
 * @param {Object} themeData - Dados do tema a validar
 * @returns {Object} - Resultado da validação
 */
export async function validateThemeJSON(themeData) {
  console.log('[ThemeSchemaValidator] Iniciando validação de tema via JSON');
  
  try {
    // Array para armazenar erros e avisos
    const errors = [];
    const warnings = [];
    const details = [];
    
    // Validações estruturais básicas
    if (!themeData) {
      errors.push('Dados do tema não fornecidos');
      return { valid: false, errors };
    }
    
    // Verificar campos obrigatórios de nível superior
    if (!themeData.name) {
      errors.push('Nome do tema não especificado');
    } else {
      details.push(`Nome: ${themeData.name}`);
    }
    
    if (!themeData.version) {
      errors.push('Versão do tema não especificada');
    } else if (!VALID_VERSION_REGEX.test(themeData.version)) {
      errors.push(`Versão "${themeData.version}" não segue o formato semântico (x.y.z)`);
    } else {
      details.push(`Versão: ${themeData.version}`);
    }
    
    // Validar layouts
    if (!themeData.layouts || !Array.isArray(themeData.layouts) || themeData.layouts.length === 0) {
      errors.push('O tema deve ter pelo menos um layout');
    } else {
      const layoutValidation = validateLayouts(themeData.layouts);
      errors.push(...layoutValidation.errors);
      warnings.push(...layoutValidation.warnings);
      
      details.push(`Layouts: ${themeData.layouts.length}`);
    }
    
    // Validar componentes
    if (!themeData.components || !Array.isArray(themeData.components)) {
      warnings.push('O tema não possui componentes definidos');
    } else {
      const componentValidation = validateComponents(themeData.components);
      errors.push(...componentValidation.errors);
      warnings.push(...componentValidation.warnings);
      
      details.push(`Componentes: ${themeData.components.length}`);
    }
    
    // Validar templates
    if (!themeData.templates || !Array.isArray(themeData.templates) || themeData.templates.length === 0) {
      warnings.push('O tema não possui templates definidos');
    } else {
      const templateValidation = validateTemplates(themeData.templates);
      errors.push(...templateValidation.errors);
      warnings.push(...templateValidation.warnings);
      
      details.push(`Templates: ${themeData.templates.length}`);
    }
    
    // Validar settings
    if (themeData.settings) {
      const settingsValidation = validateSettings(themeData.settings);
      errors.push(...settingsValidation.errors);
      warnings.push(...settingsValidation.warnings);
    } else {
      warnings.push('O tema não possui configurações definidas');
    }
    
    // Validar dependências
    if (themeData.dependencies && Array.isArray(themeData.dependencies)) {
      details.push(`Dependências: ${themeData.dependencies.length}`);
    }
    
    // Verificar mainStyles
    if (!themeData.mainStyles || themeData.mainStyles.trim() === '') {
      warnings.push('O tema não possui estilos principais definidos');
    }
    
    // Verificar globalScripts
    if (themeData.globalScripts && themeData.globalScripts.trim() !== '') {
      details.push('Scripts globais: Presentes');
    }
    
    // Resultado da validação
    const valid = errors.length === 0;
    
    console.log(`[ThemeSchemaValidator] Validação concluída: ${valid ? 'Válido ✅' : 'Inválido ❌'}`);
    console.log(`[ThemeSchemaValidator] Erros: ${errors.length}, Avisos: ${warnings.length}`);
    
    return {
      valid,
      errors,
      warnings,
      details,
      timestamp: new Date().toISOString()
    };
  } catch (error) {
    console.error('[ThemeSchemaValidator] Erro na validação:', error);
    return {
      valid: false,
      errors: [`Erro interno na validação: ${error.message}`],
      warnings: [],
      details: [],
      timestamp: new Date().toISOString()
    };
  }
}

/**
 * Valida layouts de um tema
 * @param {Array} layouts - Array de layouts do tema
 * @returns {Object} - Erros e avisos encontrados
 */
function validateLayouts(layouts) {
  const errors = [];
  const warnings = [];
  
  // Verificar se existe um layout padrão
  const hasDefaultLayout = layouts.some(layout => layout.isDefault === true);
  if (!hasDefaultLayout) {
    errors.push('Nenhum layout foi definido como padrão (isDefault: true)');
  }
  
  // Validar cada layout individualmente
  layouts.forEach((layout, index) => {
    const prefix = `Layout "${layout.name || `#${index + 1}`}"`;
    
    if (!layout.name) {
      errors.push(`${prefix}: Nome não especificado`);
    }
    
    if (!layout.key) {
      errors.push(`${prefix}: Chave não especificada`);
    }
    
    if (!layout.template) {
      errors.push(`${prefix}: Template não especificado`);
    } else if (layout.template.trim() === '') {
      errors.push(`${prefix}: Template vazio`);
    } else if (!layout.template.includes('<html') && !layout.template.includes('layout:')) {
      warnings.push(`${prefix}: Template pode não ser válido para um layout`);
    }
  });
  
  // Verificar duplicatas de chaves
  const keys = layouts.map(layout => layout.key);
  const uniqueKeys = new Set(keys);
  if (keys.length !== uniqueKeys.size) {
    errors.push('Existem layouts com chaves duplicadas');
  }
  
  return { errors, warnings };
}

/**
 * Valida componentes de um tema
 * @param {Array} components - Array de componentes do tema
 * @returns {Object} - Erros e avisos encontrados
 */
function validateComponents(components) {
  const errors = [];
  const warnings = [];
  
  // Validar cada componente individualmente
  components.forEach((component, index) => {
    const prefix = `Componente "${component.name || `#${index + 1}`}"`;
    
    if (!component.name) {
      errors.push(`${prefix}: Nome não especificado`);
    }
    
    if (!component.key) {
      errors.push(`${prefix}: Chave não especificada`);
    }
    
    if (!component.template) {
      errors.push(`${prefix}: Template não especificado`);
    } else if (component.template.trim() === '') {
      errors.push(`${prefix}: Template vazio`);
    }
    
    // Validar schema do componente, se existir
    if (component.schema) {
      try {
        // Verificar se possui type e properties
        if (!component.schema.type) {
          warnings.push(`${prefix}: Schema não possui tipo definido`);
        }
        
        if (!component.schema.properties || Object.keys(component.schema.properties).length === 0) {
          warnings.push(`${prefix}: Schema não possui propriedades definidas`);
        }
        
        // Verificar campos obrigatórios
        if (component.schema.required && !Array.isArray(component.schema.required)) {
          warnings.push(`${prefix}: Campo 'required' do schema deve ser um array`);
        }
        
      } catch (error) {
        warnings.push(`${prefix}: Erro ao validar schema - ${error.message}`);
      }
    } else {
      warnings.push(`${prefix}: Não possui schema definido`);
    }
  });
  
  // Verificar duplicatas de chaves
  const keys = components.map(component => component.key);
  const uniqueKeys = new Set(keys);
  if (keys.length !== uniqueKeys.size) {
    errors.push('Existem componentes com chaves duplicadas');
  }
  
  return { errors, warnings };
}

/**
 * Valida templates de um tema
 * @param {Array} templates - Array de templates do tema
 * @returns {Object} - Erros e avisos encontrados
 */
function validateTemplates(templates) {
  const errors = [];
  const warnings = [];
  
  // Verificar se existe um template padrão
  const hasDefaultTemplate = templates.some(template => template.defaultTemplate === true);
  if (!hasDefaultTemplate) {
    warnings.push('Nenhum template foi definido como padrão (defaultTemplate: true)');
  }
  
  // Validar cada template individualmente
  templates.forEach((template, index) => {
    const prefix = `Template "${template.name || `#${index + 1}`}"`;
    
    if (!template.name) {
      errors.push(`${prefix}: Nome não especificado`);
    }
    
    if (!template.key) {
      errors.push(`${prefix}: Chave não especificada`);
    }
  });
  
  // Verificar duplicatas de chaves
  const keys = templates.map(template => template.key);
  const uniqueKeys = new Set(keys);
  if (keys.length !== uniqueKeys.size) {
    errors.push('Existem templates com chaves duplicadas');
  }
  
  return { errors, warnings };
}

/**
 * Valida configurações de um tema
 * @param {Object} settings - Configurações do tema
 * @returns {Object} - Erros e avisos encontrados
 */
function validateSettings(settings) {
  const errors = [];
  const warnings = [];
  
  // Validar cores
  if (settings.colors) {
    if (!Array.isArray(settings.colors)) {
      errors.push('Configuração de cores deve ser um array');
    } else {
      settings.colors.forEach((color, index) => {
        const prefix = `Cor "${color.name || `#${index + 1}`}"`;
        
        if (!color.name) {
          warnings.push(`${prefix}: Nome não especificado`);
        }
        
        if (!color.key) {
          warnings.push(`${prefix}: Chave não especificada`);
        }
        
        if (!color.value) {
          warnings.push(`${prefix}: Valor não especificado`);
        } else if (!VALID_COLOR_REGEX.test(color.value)) {
          warnings.push(`${prefix}: Valor "${color.value}" pode não ser uma cor válida`);
        }
      });
    }
  }
  
  // Validar fontes
  if (settings.fonts) {
    if (!Array.isArray(settings.fonts)) {
      errors.push('Configuração de fontes deve ser um array');
    } else {
      settings.fonts.forEach((font, index) => {
        const prefix = `Fonte "${font.name || `#${index + 1}`}"`;
        
        if (!font.name) {
          warnings.push(`${prefix}: Nome não especificado`);
        }
        
        if (!font.key) {
          warnings.push(`${prefix}: Chave não especificada`);
        }
        
        if (!font.family) {
          warnings.push(`${prefix}: Família não especificada`);
        }
      });
    }
  }
  
  // Validar espaçamentos
  if (settings.spacing) {
    if (!Array.isArray(settings.spacing)) {
      errors.push('Configuração de espaçamentos deve ser um array');
    } else {
      settings.spacing.forEach((space, index) => {
        const prefix = `Espaçamento "${space.name || `#${index + 1}`}"`;
        
        if (!space.name) {
          warnings.push(`${prefix}: Nome não especificado`);
        }
        
        if (!space.key) {
          warnings.push(`${prefix}: Chave não especificada`);
        }
        
        if (!space.value) {
          warnings.push(`${prefix}: Valor não especificado`);
        }
      });
    }
  }
  
  return { errors, warnings };
}