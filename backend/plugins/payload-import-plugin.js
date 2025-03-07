/**
 * Plugin para sincronizar temas entre PayloadCMS e Astro
 * 
 * Este plugin é responsável por:
 * 1. Monitorar alterações em temas (criação, atualização, exclusão)
 * 2. Gerar arquivos CSS, JS, HTML e outros recursos no diretório de temas do Astro
 * 3. Validar temas antes de publicá-los
 * 4. Manter a sincronia entre os dois sistemas
 * 
 * Enhancements:
 * - Logs detalhados com níveis de verbosidade
 * - Tratamento robusto de erros
 * - Cache para operações de I/O
 * - Suporte para temas com vários tipos de componentes
 * - Validação local e remota de temas
 */

import fs from 'fs';
import path from 'path';
import axios from 'axios';
import { performance } from 'perf_hooks';

// Configuração
const ASTRO_THEMES_DIR = process.env.ASTRO_THEMES_DIR || '../storefront-astrojs/src/themes';
const ASTRO_URL = process.env.ASTRO_URL || 'http://localhost:4321';
const INTERNAL_API_KEY = process.env.INTERNAL_API_KEY || 'dev_api_key';
const LOG_LEVEL = process.env.PLUGIN_LOG_LEVEL || 'info'; // 'debug', 'info', 'warn', 'error'

// Cache para evitar operações desnecessárias
const operationCache = new Map();

// Log levels
const LOG_LEVELS = {
  debug: 0,
  info: 1,
  warn: 2,
  error: 3
};

/**
 * Função de log com suporte a níveis
 * @param {string} level - Nível do log (debug, info, warn, error)
 * @param {string} message - Mensagem a ser logada
 * @param {any} data - Dados adicionais (opcional)
 */
function log(level, message, data = null) {
  if (LOG_LEVELS[level] >= LOG_LEVELS[LOG_LEVEL]) {
    const prefix = `[PayloadImportPlugin] [${level.toUpperCase()}]`;
    
    // Formatar mensagem de acordo com o nível
    switch (level) {
      case 'debug':
        console.debug(`${prefix} 🔍 ${message}`);
        break;
      case 'info':
        console.log(`${prefix} ℹ️ ${message}`);
        break;
      case 'warn':
        console.warn(`${prefix} ⚠️ ${message}`);
        break;
      case 'error':
        console.error(`${prefix} ❌ ${message}`);
        break;
      default:
        console.log(`${prefix} ${message}`);
    }
    
    // Logar dados adicionais em modo debug
    if (data && LOG_LEVEL === 'debug') {
      console.debug('Data:', data);
    }
  }
}

/**
 * Plugin principal do PayloadCMS
 */
const payloadImportPlugin = {
  /**
   * Inicialização do plugin
   * @param {Object} payload - Instância do PayloadCMS
   */
  init: (payload) => {
    console.log('[PayloadImportPlugin] 🔄 Inicializando plugin de sincronização de temas');
    
    // Garantir que o diretório de temas existe
    ensureThemeDirectory();
    
    // Registrar hooks para monitorar criação/atualização de temas
    registerThemeHooks(payload);
    
    // Sincronizar temas existentes na inicialização
    syncExistingThemes(payload);
  }
};

/**
 * Garante que o diretório de temas existe
 */
function ensureThemeDirectory() {
  const themesDir = path.resolve(process.cwd(), ASTRO_THEMES_DIR);
  console.log(`[PayloadImportPlugin] Verificando diretório de temas: ${themesDir}`);
  
  try {
    // Verifica se o diretório existe e tenta criá-lo
    if (!fs.existsSync(themesDir)) {
      console.log(`[PayloadImportPlugin] Criando diretório de temas: ${themesDir}`);
      
      // Cria todos os diretórios necessários no caminho
      const parts = ASTRO_THEMES_DIR.split('/');
      let currentPath = process.cwd();
      
      for (const part of parts) {
        if (part === '..') {
          // Subir um nível no diretório
          currentPath = path.dirname(currentPath);
        } else if (part && part !== '.') {
          // Adicionar subdiretório e verificar/criar
          currentPath = path.join(currentPath, part);
          if (!fs.existsSync(currentPath)) {
            fs.mkdirSync(currentPath);
            console.log(`[PayloadImportPlugin] Criado diretório: ${currentPath}`);
          }
        }
      }
      
      console.log(`[PayloadImportPlugin] Diretórios de temas criados com sucesso`);
    } else {
      console.log(`[PayloadImportPlugin] Diretório de temas já existe`);
    }
  } catch (error) {
    console.error(`[PayloadImportPlugin] ❌ Erro ao verificar/criar diretório de temas: ${error.message}`);
    console.error(error.stack);
  }
}

/**
 * Registra hooks para monitorar alterações em temas
 * @param {Object} payload - Instância do PayloadCMS
 */
function registerThemeHooks(payload) {
  if (!payload.collections.themes) {
    console.error('[PayloadImportPlugin] ❌ Coleção de temas não encontrada! Verifique se a coleção "themes" está registrada.');
    return;
  }
  
  console.log('[PayloadImportPlugin] Registrando hooks para a coleção de temas');
  
  // Inicializar hooks se não existirem
  if (!payload.collections.themes.hooks) {
    payload.collections.themes.hooks = {};
  }
  
  // Inicializar afterChange se não existir
  if (!payload.collections.themes.hooks.afterChange) {
    payload.collections.themes.hooks.afterChange = [];
  }
  
  // Inicializar beforeDelete se não existir
  if (!payload.collections.themes.hooks.beforeDelete) {
    payload.collections.themes.hooks.beforeDelete = [];
  }
  
  // Hook para após uma alteração em um tema
  payload.collections.themes.hooks.afterChange.push(async ({ doc, operation, req }) => {
    try {
      const userEmail = req?.user?.email || 'sistema';
      console.log(`[PayloadImportPlugin] 🎨 Tema ${operation === 'create' ? 'criado' : 'atualizado'}: ${doc.name} por ${userEmail}`);
      
      // Não processar temas em rascunho, a menos que seja uma criação
      if (doc.status === 'draft' && operation !== 'create') {
        console.log(`[PayloadImportPlugin] ℹ️ Tema ${doc.name} em rascunho, não será sincronizado`);
        return doc;
      }
      
      // Processar tema (gerar arquivos)
      await processTheme(doc, payload);
      
      // Validar tema
      if (doc.status === 'review' || doc.status === 'published') {
        await validateTheme(doc, payload);
      }
      
      return doc;
    } catch (error) {
      console.error(`[PayloadImportPlugin] ❌ Erro ao processar tema: ${error.message}`);
      console.error(error.stack);
      return doc;
    }
  });
  
  // Hook para antes de deletar um tema
  payload.collections.themes.hooks.beforeDelete.push(async ({ id, req }) => {
    try {
      console.log(`[PayloadImportPlugin] 🗑️ Removendo tema: ID ${id}`);
      
      // Buscar documento do tema antes de ser excluído
      const theme = await payload.findByID({ collection: 'themes', id });
      
      if (!theme) {
        console.log(`[PayloadImportPlugin] ⚠️ Tema ID ${id} não encontrado para remoção`);
        return;
      }
      
      // Verificar se é um tema do sistema
      if (theme.isSystem) {
        console.log(`[PayloadImportPlugin] ⛔ Tentativa de excluir tema do sistema: ${theme.name}`);
        throw new Error('Temas do sistema não podem ser excluídos');
      }
      
      // Remover arquivos do tema
      await removeTheme(theme);
      
      console.log(`[PayloadImportPlugin] ✅ Tema removido: ${theme.name}`);
    } catch (error) {
      console.error(`[PayloadImportPlugin] ❌ Erro ao excluir tema: ${error.message}`);
      throw error;
    }
  });
}

/**
 * Sincroniza todos os temas existentes
 * @param {Object} payload - Instância do PayloadCMS
 */
async function syncExistingThemes(payload) {
  try {
    console.log('[PayloadImportPlugin] 🔄 Iniciando sincronização de temas existentes');
    
    // Verificar se a coleção de temas existe
    if (!payload.collections.themes) {
      console.log('[PayloadImportPlugin] Coleção de temas não encontrada. Pulando sincronização inicial.');
      return;
    }
    
    try {
      // Buscar todos os temas publicados
      const { docs: themes } = await payload.find({
        collection: 'themes',
        where: {
          status: { in: ['published', 'review'] }
        }
      });
      
      console.log(`[PayloadImportPlugin] Encontrados ${themes.length} temas para sincronizar`);
      
      // Processar cada tema
      for (const theme of themes) {
        console.log(`[PayloadImportPlugin] Sincronizando tema: ${theme.name}`);
        await processTheme(theme, payload);
      }
      
      console.log(`[PayloadImportPlugin] ✅ Sincronização inicial concluída`);
    } catch (findError) {
      // Se ocorrer um erro ao buscar os temas (por exemplo, se a tabela ainda não existir),
      // apenas registre o erro e continue
      console.log(`[PayloadImportPlugin] ℹ️ Não foi possível buscar temas existentes: ${findError.message}`);
      console.log('[PayloadImportPlugin] Isso é normal durante a primeira inicialização.');
    }
  } catch (error) {
    console.error(`[PayloadImportPlugin] ❌ Erro ao sincronizar temas existentes: ${error.message}`);
  }
}

/**
 * Processa um tema, gerando todos os arquivos necessários
 * @param {Object} theme - Documento do tema
 * @param {Object} payload - Instância do PayloadCMS
 */
async function processTheme(theme, payload) {
  const startTime = performance.now();
  log('info', `Processando tema: ${theme.name} (ID: ${theme.id})`);
  
  // Verificar cache para evitar reprocessamento desnecessário
  const cacheKey = `theme_${theme.id}_${theme.updatedAt}`;
  if (operationCache.has(cacheKey)) {
    log('debug', `Usando cache para tema: ${theme.name}`);
    return operationCache.get(cacheKey);
  }
  
  const themeDir = path.resolve(process.cwd(), ASTRO_THEMES_DIR, theme.id);
  
  try {
    // Garantir que o diretório do tema existe
    if (!fs.existsSync(themeDir)) {
      log('debug', `Criando diretório do tema: ${themeDir}`);
      fs.mkdirSync(themeDir, { recursive: true });
    }
    
    // Registrar início do processamento detalhado
    log('debug', `Iniciando geração de arquivos para tema: ${theme.name}`, {
      id: theme.id,
      version: theme.version,
      status: theme.status
    });
    
    // Criar arquivos do tema com tratamento de erros detalhado
    const results = await Promise.allSettled([
      createThemeManifest(theme, themeDir),
      createThemeStyles(theme, themeDir),
      createThemeLayouts(theme, themeDir),
      createThemeComponents(theme, themeDir),
      createThemeScripts(theme, themeDir)
    ]);
    
    // Verificar resultados individuais
    const errors = [];
    results.forEach((result, index) => {
      const operations = ['manifesto', 'estilos', 'layouts', 'componentes', 'scripts'];
      if (result.status === 'rejected') {
        log('error', `Falha ao criar ${operations[index]}: ${result.reason.message}`);
        errors.push(`${operations[index]}: ${result.reason.message}`);
      }
    });
    
    // Se houver erros, lançar exceção agrupada
    if (errors.length > 0) {
      throw new Error(`Erros ao processar tema: ${errors.join('; ')}`);
    }
    
    const endTime = performance.now();
    const processingTime = (endTime - startTime).toFixed(2);
    log('info', `Tema processado com sucesso em ${processingTime}ms: ${theme.name}`);
    
    // Adicionar ao cache
    operationCache.set(cacheKey, { success: true, processingTime });
    
    // Limitar tamanho do cache
    if (operationCache.size > 100) {
      const firstKey = operationCache.keys().next().value;
      operationCache.delete(firstKey);
    }
    
    return { success: true, processingTime };
  } catch (error) {
    log('error', `Erro ao processar tema ${theme.name}: ${error.message}`);
    log('debug', error.stack);
    
    // Atualizar o tema com o erro de processamento
    try {
      await payload.update({
        collection: 'themes',
        id: theme.id,
        data: {
          validationStatus: 'invalid',
          validationResults: {
            success: false,
            errors: [error.message],
            timestamp: new Date().toISOString(),
            processingDetails: {
              duration: (performance.now() - startTime).toFixed(2),
              failedStep: error.step || 'processing'
            }
          }
        }
      });
      
      log('debug', `Status de validação atualizado para 'invalid' devido a erro no processamento`);
    } catch (updateError) {
      log('error', `Erro ao atualizar status de validação do tema: ${updateError.message}`);
    }
    
    // Lançar erro novamente para tratamento no nível superior
    throw error;
  }
}

/**
 * Cria o manifesto do tema (theme.json)
 * @param {Object} theme - Documento do tema
 * @param {string} themeDir - Diretório do tema
 */
async function createThemeManifest(theme, themeDir) {
  const manifestData = {
    id: theme.id,
    name: theme.name,
    version: theme.version,
    description: theme.description,
    created: theme.createdAt,
    updated: theme.updatedAt,
    status: theme.status,
    author: theme.author,
    templates: theme.templates || [],
    settings: theme.settings || {},
    dependencies: theme.dependencies || []
  };
  
  const manifestPath = path.join(themeDir, 'theme.json');
  fs.writeFileSync(manifestPath, JSON.stringify(manifestData, null, 2));
  console.log(`[PayloadImportPlugin] Manifesto criado: ${manifestPath}`);
}

/**
 * Cria arquivos de estilos do tema
 * @param {Object} theme - Documento do tema
 * @param {string} themeDir - Diretório do tema
 */
async function createThemeStyles(theme, themeDir) {
  // Criar CSS principal
  if (theme.mainStyles) {
    const mainStylesPath = path.join(themeDir, 'main.css');
    fs.writeFileSync(mainStylesPath, theme.mainStyles);
    console.log(`[PayloadImportPlugin] CSS principal criado: ${mainStylesPath}`);
  }
  
  // Criar CSS de componentes
  if (theme.componentStyles) {
    const componentStylesPath = path.join(themeDir, 'components.css');
    fs.writeFileSync(componentStylesPath, theme.componentStyles);
    console.log(`[PayloadImportPlugin] CSS de componentes criado: ${componentStylesPath}`);
  }
}

/**
 * Cria arquivos de layouts do tema
 * @param {Object} theme - Documento do tema
 * @param {string} themeDir - Diretório do tema
 */
async function createThemeLayouts(theme, themeDir) {
  if (!theme.layouts || theme.layouts.length === 0) {
    console.log(`[PayloadImportPlugin] Nenhum layout encontrado para o tema: ${theme.name}`);
    return;
  }
  
  // Criar diretório de layouts
  const layoutsDir = path.join(themeDir, 'layouts');
  if (!fs.existsSync(layoutsDir)) {
    fs.mkdirSync(layoutsDir, { recursive: true });
  }
  
  // Criar cada layout
  for (const layout of theme.layouts) {
    const layoutPath = path.join(layoutsDir, `${layout.key}.astro`);
    fs.writeFileSync(layoutPath, layout.template);
    console.log(`[PayloadImportPlugin] Layout criado: ${layoutPath}`);
  }
}

/**
 * Cria arquivos de componentes do tema
 * @param {Object} theme - Documento do tema
 * @param {string} themeDir - Diretório do tema
 */
async function createThemeComponents(theme, themeDir) {
  if (!theme.components || theme.components.length === 0) {
    console.log(`[PayloadImportPlugin] Nenhum componente encontrado para o tema: ${theme.name}`);
    return;
  }
  
  // Criar diretório de componentes
  const componentsDir = path.join(themeDir, 'components');
  if (!fs.existsSync(componentsDir)) {
    fs.mkdirSync(componentsDir, { recursive: true });
  }
  
  // Criar cada componente
  for (const component of theme.components) {
    // Criar diretório de categoria (se aplicável)
    let componentDir = componentsDir;
    if (component.category) {
      componentDir = path.join(componentsDir, component.category);
      if (!fs.existsSync(componentDir)) {
        fs.mkdirSync(componentDir, { recursive: true });
      }
    }
    
    // Criar arquivo do componente
    const componentPath = path.join(componentDir, `${component.key}.astro`);
    fs.writeFileSync(componentPath, component.template);
    console.log(`[PayloadImportPlugin] Componente criado: ${componentPath}`);
    
    // Criar schema do componente (se disponível)
    if (component.schema) {
      const schemaPath = path.join(componentDir, `${component.key}.schema.json`);
      fs.writeFileSync(schemaPath, JSON.stringify(component.schema, null, 2));
      console.log(`[PayloadImportPlugin] Schema de componente criado: ${schemaPath}`);
    }
  }
}

/**
 * Cria arquivos de scripts do tema
 * @param {Object} theme - Documento do tema
 * @param {string} themeDir - Diretório do tema
 */
async function createThemeScripts(theme, themeDir) {
  if (theme.globalScripts) {
    const scriptsPath = path.join(themeDir, 'scripts.js');
    fs.writeFileSync(scriptsPath, theme.globalScripts);
    console.log(`[PayloadImportPlugin] Scripts globais criados: ${scriptsPath}`);
  }
}

/**
 * Remove os arquivos de um tema
 * @param {Object} theme - Documento do tema
 */
async function removeTheme(theme) {
  const themeDir = path.resolve(process.cwd(), ASTRO_THEMES_DIR, theme.id);
  
  try {
    if (fs.existsSync(themeDir)) {
      console.log(`[PayloadImportPlugin] Removendo diretório do tema: ${themeDir}`);
      fs.rmSync(themeDir, { recursive: true, force: true });
      console.log(`[PayloadImportPlugin] Diretório removido: ${themeDir}`);
    } else {
      console.log(`[PayloadImportPlugin] Diretório de tema não encontrado para remoção: ${themeDir}`);
    }
  } catch (error) {
    console.error(`[PayloadImportPlugin] ❌ Erro ao remover diretório do tema: ${error.message}`);
    throw error;
  }
}

/**
 * Valida um tema usando validação local e remota
 * @param {Object} theme - Documento do tema
 * @param {Object} payload - Instância do PayloadCMS
 */
async function validateTheme(theme, payload) {
  const startTime = performance.now();
  log('info', `Validando tema: ${theme.name} (ID: ${theme.id})`);
  
  try {
    // Primeiro, fazer validação local para verificações básicas
    const localValidation = validateThemeLocally(theme);
    
    // Se a validação local encontrar erros graves, não prosseguir com validação remota
    if (localValidation.errors.length > 0) {
      log('warn', `Validação local falhou para tema: ${theme.name}`, localValidation.errors);
      
      // Atualizar o tema com os resultados da validação local
      await updateValidationStatus(payload, theme.id, 'invalid', {
        success: false,
        errors: localValidation.errors,
        warnings: localValidation.warnings,
        source: 'local',
        timestamp: new Date().toISOString()
      });
      
      return;
    }
    
    // Endpoint de validação no Astro
    const validationUrl = `${ASTRO_URL}/api/theme-validation`;
    log('debug', `Enviando requisição de validação para: ${validationUrl}`);
    
    // Fazer requisição para o Astro validar o tema, com retry
    let success = false;
    let validationData = null;
    let attempts = 0;
    const maxAttempts = 3;
    
    while (!success && attempts < maxAttempts) {
      attempts++;
      try {
        const response = await axios.post(
          validationUrl, 
          { themeId: theme.id },
          { 
            headers: { 
              'Content-Type': 'application/json',
              'x-api-key': INTERNAL_API_KEY
            },
            timeout: 15000 // 15 segundos
          }
        );
        
        const responseData = response.data;
        success = responseData.success;
        validationData = responseData.validationData;
        break;
      } catch (requestError) {
        log('warn', `Tentativa ${attempts}/${maxAttempts} falhou: ${requestError.message}`);
        
        // Se for a última tentativa, lançar erro
        if (attempts >= maxAttempts) {
          throw new Error(`Falha após ${maxAttempts} tentativas: ${requestError.message}`);
        }
        
        // Esperar antes de tentar novamente (exponential backoff)
        await new Promise(resolve => setTimeout(resolve, 1000 * attempts));
      }
    }
    
    const endTime = performance.now();
    const validationTime = (endTime - startTime).toFixed(2);
    log('info', `Resultado da validação (${validationTime}ms): ${success ? '✅ Válido' : '❌ Inválido'}`);
    
    if (validationData?.validations) {
      // Logar detalhes da validação
      const failed = validationData.validations.filter(v => v.result === 'failed');
      const warnings = validationData.validations.filter(v => v.result === 'warning');
      
      if (failed.length > 0) {
        log('debug', `Falhas na validação (${failed.length}):`, 
          failed.map(f => `${f.name}: ${f.message}`));
      }
      
      if (warnings.length > 0) {
        log('debug', `Avisos na validação (${warnings.length}):`, 
          warnings.map(w => `${w.name}: ${w.message}`));
      }
    }
    
    // Adicionar informações de performance
    if (validationData) {
      validationData.processingTime = validationTime;
    } else {
      validationData = { processingTime: validationTime };
    }
    
    // Atualizar o tema com os resultados da validação
    await updateValidationStatus(payload, theme.id, success ? 'valid' : 'invalid', 
      validationData || { 
        success, 
        timestamp: new Date().toISOString(),
        processingTime: validationTime
      }
    );
    
    log('debug', `Status de validação atualizado: ${theme.name}`);
  } catch (error) {
    const validationTime = (performance.now() - startTime).toFixed(2);
    log('error', `Erro ao validar tema (${validationTime}ms): ${error.message}`);
    
    // Registrar o erro na validação
    try {
      await updateValidationStatus(payload, theme.id, 'invalid', {
        success: false,
        errors: [`Erro na validação: ${error.message}`],
        timestamp: new Date().toISOString(),
        processingTime: validationTime
      });
    } catch (updateError) {
      log('error', `Erro ao atualizar status de validação: ${updateError.message}`);
    }
  }
}

/**
 * Atualiza o status de validação de um tema
 * @param {Object} payload - Instância do PayloadCMS
 * @param {string} themeId - ID do tema
 * @param {string} status - Status de validação ('valid', 'invalid', 'pending')
 * @param {Object} results - Resultados da validação
 */
async function updateValidationStatus(payload, themeId, status, results) {
  try {
    await payload.update({
      collection: 'themes',
      id: themeId,
      data: {
        validationStatus: status,
        validationResults: results
      }
    });
    log('debug', `Status de validação atualizado para '${status}'`);
    return true;
  } catch (error) {
    log('error', `Falha ao atualizar status de validação: ${error.message}`);
    throw error;
  }
}

/**
 * Realiza validação local básica do tema
 * @param {Object} theme - Tema a ser validado
 * @returns {Object} - Resultados da validação local
 */
function validateThemeLocally(theme) {
  log('debug', `Realizando validação local para tema: ${theme.name}`);
  
  const errors = [];
  const warnings = [];
  
  // Validar campos obrigatórios
  if (!theme.name) {
    errors.push('Nome do tema é obrigatório');
  }
  
  if (!theme.version) {
    errors.push('Versão do tema é obrigatória');
  } else if (!/^\d+\.\d+\.\d+$/.test(theme.version)) {
    warnings.push(`Versão (${theme.version}) não segue o formato semântico (x.y.z)`);
  }
  
  // Validação básica de layouts
  if (!theme.layouts || !Array.isArray(theme.layouts) || theme.layouts.length === 0) {
    errors.push('Tema deve ter pelo menos um layout definido');
  } else {
    // Verificar se há um layout padrão
    const hasDefaultLayout = theme.layouts.some(layout => layout.isDefault === true);
    if (!hasDefaultLayout) {
      warnings.push('Nenhum layout foi definido como padrão (isDefault: true)');
    }
    
    // Verificar layouts individuais
    let duplicateKeys = new Set();
    let usedKeys = new Set();
    
    theme.layouts.forEach((layout, index) => {
      if (!layout.name) {
        warnings.push(`Layout #${index + 1} não tem nome definido`);
      }
      
      if (!layout.key) {
        errors.push(`Layout #${index + 1} não tem chave definida`);
      } else if (usedKeys.has(layout.key)) {
        duplicateKeys.add(layout.key);
      } else {
        usedKeys.add(layout.key);
      }
      
      if (!layout.template) {
        errors.push(`Layout #${index + 1} não tem template definido`);
      }
    });
    
    if (duplicateKeys.size > 0) {
      errors.push(`Chaves de layout duplicadas: ${Array.from(duplicateKeys).join(', ')}`);
    }
  }
  
  // Validação básica de componentes
  if (!theme.components || !Array.isArray(theme.components)) {
    warnings.push('Tema não possui componentes definidos');
  } else if (theme.components.length === 0) {
    warnings.push('Tema tem array de componentes vazio');
  } else {
    // Verificar componentes individuais
    let duplicateKeys = new Set();
    let usedKeys = new Set();
    
    theme.components.forEach((component, index) => {
      if (!component.name) {
        warnings.push(`Componente #${index + 1} não tem nome definido`);
      }
      
      if (!component.key) {
        errors.push(`Componente #${index + 1} não tem chave definida`);
      } else if (usedKeys.has(component.key)) {
        duplicateKeys.add(component.key);
      } else {
        usedKeys.add(component.key);
      }
      
      if (!component.template) {
        errors.push(`Componente #${index + 1} não tem template definido`);
      }
      
      // Verificar schema, se existir
      if (component.schema) {
        if (typeof component.schema !== 'object') {
          warnings.push(`Componente ${component.name || `#${index + 1}`} tem schema inválido (deve ser um objeto)`);
        } else if (!component.schema.properties) {
          warnings.push(`Componente ${component.name || `#${index + 1}`} tem schema sem propriedades definidas`);
        }
      }
    });
    
    if (duplicateKeys.size > 0) {
      errors.push(`Chaves de componente duplicadas: ${Array.from(duplicateKeys).join(', ')}`);
    }
  }
  
  log('debug', `Validação local concluída. Erros: ${errors.length}, Avisos: ${warnings.length}`);
  
  return {
    valid: errors.length === 0,
    errors,
    warnings
  };
}

/**
 * Função do plugin para o Payload CMS
 * @param {Object} config - Configuração do Payload
 * @returns {Object} - Configuração modificada
 */
const payloadImportPluginFunc = (config) => {
  // Registrar a inicialização do plugin quando o Payload inicializar
  const existingOnInit = config.onInit;
  
  config.onInit = async (payload) => {
    // Executar a função onInit original, se existir
    if (existingOnInit) {
      await existingOnInit(payload);
    }
    
    // Inicializar o plugin
    payloadImportPlugin.init(payload);
  };
  
  return config;
};

export default payloadImportPluginFunc;