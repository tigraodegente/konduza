/**
 * Utilitário para validação de temas
 * 
 * Este módulo verifica se um tema está correto e pode ser utilizado,
 * checando estrutura, arquivos e propriedades necessárias.
 */

import fs from 'fs';
import path from 'path';

const DEBUG = true;

/**
 * Função para exibir logs de depuração
 */
function log(message, ...args) {
  if (DEBUG) {
    console.log(`[ThemeValidator] ${message}`, ...args);
  }
}

/**
 * Verifica a estrutura e conteúdo de um tema
 * @param {string} themeId - ID do tema a validar
 * @returns {Promise<object>} - Resultado da validação
 */
export async function validateTheme(themeId) {
  log(`Iniciando validação do tema: ${themeId}`);
  
  try {
    // Caminho para o diretório de temas
    const themesDir = path.resolve(process.cwd(), 'src/themes');
    const themeDir = path.join(themesDir, themeId);
    
    // Verificar se o diretório do tema existe
    if (!fs.existsSync(themeDir)) {
      log(`❌ Diretório do tema não encontrado: ${themeDir}`);
      return {
        success: false,
        timestamp: new Date().toISOString(),
        validations: [
          { name: 'Existência do tema', result: 'failed', message: 'Diretório do tema não encontrado' }
        ],
        message: 'Falha na validação: diretório do tema não encontrado'
      };
    }
    
    log(`✅ Diretório do tema encontrado: ${themeDir}`);
    
    // Array para armazenar resultados de validações individuais
    const validations = [];
    
    // 1. Verificar existência do manifesto (theme.json)
    const manifestPath = path.join(themeDir, 'theme.json');
    let manifest = null;
    
    if (fs.existsSync(manifestPath)) {
      log(`✅ Manifesto do tema encontrado: ${manifestPath}`);
      validations.push({ name: 'Manifesto (theme.json)', result: 'passed' });
      
      try {
        // Carregar e validar o manifesto
        const manifestContent = fs.readFileSync(manifestPath, 'utf8');
        manifest = JSON.parse(manifestContent);
        
        // Verificar propriedades essenciais
        const requiredProps = ['name', 'version'];
        const missingProps = requiredProps.filter(prop => !manifest[prop]);
        
        if (missingProps.length > 0) {
          const message = `Propriedades obrigatórias ausentes no manifesto: ${missingProps.join(', ')}`;
          log(`❌ ${message}`);
          validations.push({ name: 'Propriedades do manifesto', result: 'failed', message });
        } else {
          log(`✅ Propriedades do manifesto validadas`);
          validations.push({ name: 'Propriedades do manifesto', result: 'passed' });
        }
      } catch (error) {
        const message = `Erro ao analisar o manifesto: ${error.message}`;
        log(`❌ ${message}`);
        validations.push({ name: 'Formato do manifesto', result: 'failed', message });
      }
    } else {
      const message = 'Manifesto do tema (theme.json) não encontrado';
      log(`❌ ${message}`);
      validations.push({ name: 'Manifesto (theme.json)', result: 'failed', message });
    }
    
    // 2. Verificar folha de estilos principal
    const cssPath = path.join(themeDir, 'main.css');
    if (fs.existsSync(cssPath)) {
      log(`✅ Folha de estilos principal encontrada: ${cssPath}`);
      validations.push({ name: 'Estilos principais (main.css)', result: 'passed' });
    } else {
      const message = 'Folha de estilos principal (main.css) não encontrada';
      log(`❌ ${message}`);
      validations.push({ name: 'Estilos principais (main.css)', result: 'failed', message });
    }
    
    // 3. Verificar layouts
    const layoutsDir = path.join(themeDir, 'layouts');
    if (fs.existsSync(layoutsDir)) {
      log(`✅ Diretório de layouts encontrado: ${layoutsDir}`);
      
      // Verificar se o diretório contém layouts (.astro)
      const layoutFiles = fs.readdirSync(layoutsDir)
        .filter(file => file.endsWith('.astro'));
      
      if (layoutFiles.length > 0) {
        log(`✅ Encontrados ${layoutFiles.length} layouts: ${layoutFiles.join(', ')}`);
        validations.push({ 
          name: 'Layouts', 
          result: 'passed',
          details: `${layoutFiles.length} layouts encontrados` 
        });
      } else {
        const message = 'Nenhum arquivo de layout (.astro) encontrado no diretório de layouts';
        log(`❌ ${message}`);
        validations.push({ name: 'Layouts', result: 'failed', message });
      }
    } else {
      const message = 'Diretório de layouts não encontrado';
      log(`⚠️ ${message}`);
      validations.push({ name: 'Diretório de layouts', result: 'warning', message });
    }
    
    // 4. Verificar componentes
    const componentsDir = path.join(themeDir, 'components');
    if (fs.existsSync(componentsDir)) {
      log(`✅ Diretório de componentes encontrado: ${componentsDir}`);
      
      // Contar arquivos de componente de forma recursiva
      const componentFiles = [];
      scanDirectory(componentsDir, file => {
        if (file.endsWith('.astro')) {
          componentFiles.push(file);
        }
      });
      
      if (componentFiles.length > 0) {
        log(`✅ Encontrados ${componentFiles.length} componentes`);
        validations.push({ 
          name: 'Componentes', 
          result: 'passed',
          details: `${componentFiles.length} componentes encontrados` 
        });
      } else {
        const message = 'Nenhum arquivo de componente (.astro) encontrado no diretório de componentes';
        log(`⚠️ ${message}`);
        validations.push({ name: 'Componentes', result: 'warning', message });
      }
    } else {
      const message = 'Diretório de componentes não encontrado';
      log(`⚠️ ${message}`);
      validations.push({ name: 'Diretório de componentes', result: 'warning', message });
    }
    
    // Calcular resultado final
    const failedValidations = validations.filter(v => v.result === 'failed');
    const warnings = validations.filter(v => v.result === 'warning');
    
    const success = failedValidations.length === 0;
    let message = '';
    
    if (success) {
      message = warnings.length > 0 
        ? `Tema validado com ${warnings.length} avisos` 
        : 'Tema validado com sucesso';
      log(`✅ ${message}`);
    } else {
      message = `Tema inválido com ${failedValidations.length} erros e ${warnings.length} avisos`;
      log(`❌ ${message}`);
    }
    
    // Retornar resultado completo
    return {
      success,
      timestamp: new Date().toISOString(),
      validations,
      message
    };
  } catch (error) {
    log(`❌ Erro durante validação: ${error.message}`);
    console.error(error);
    
    return {
      success: false,
      timestamp: new Date().toISOString(),
      validations: [
        { name: 'Processamento', result: 'failed', message: `Erro interno: ${error.message}` }
      ],
      message: `Falha na validação: ${error.message}`
    };
  }
}

/**
 * Escaneia um diretório recursivamente e executa um callback para cada arquivo
 * @param {string} dir - Diretório para escanear
 * @param {Function} callback - Função de callback para cada arquivo
 */
function scanDirectory(dir, callback) {
  if (!fs.existsSync(dir)) return;
  
  const files = fs.readdirSync(dir);
  
  for (const file of files) {
    const filePath = path.join(dir, file);
    const stats = fs.statSync(filePath);
    
    if (stats.isDirectory()) {
      scanDirectory(filePath, callback);
    } else {
      callback(filePath);
    }
  }
}