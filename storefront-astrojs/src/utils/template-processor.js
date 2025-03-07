import Mustache from 'mustache';

/**
 * Processa um template HTML dividindo-o em regiões e renderizando variáveis
 * 
 * @param {string} templateHtml HTML do template
 * @param {object} data Dados para renderização
 * @returns {object} Objeto com partes do template processadas
 */
export function processTemplate(templateHtml, data) {
  // Dividir o template para identificar regiões
  const regionPattern = /#region\s+name="([^"]+)".*?#endregion/gs;
  const parts = templateHtml.split(regionPattern);
  
  // Processar partes antes e depois das regiões
  const beforeRegions = Mustache.render(parts[0], data);
  const afterRegions = parts[parts.length - 1] 
    ? Mustache.render(parts[parts.length - 1], data)
    : '';
  
  return {
    beforeRegions,
    afterRegions
  };
}

/**
 * Processa um componente HTML com suas propriedades
 * 
 * @param {string} componentHtml HTML do componente
 * @param {object} props Propriedades para o componente
 * @returns {string} HTML processado
 */
export function processComponent(componentHtml, props) {
  return Mustache.render(componentHtml, props || {});
}