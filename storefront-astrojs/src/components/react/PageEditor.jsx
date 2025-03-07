import React, { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';

/**
 * Editor visual de páginas com funcionalidade drag-and-drop
 * Este componente permite arrastar componentes de uma sidebar para zonas editáveis na página
 */
const PageEditor = ({ page, template, availableComponents, onSave }) => {
  // Estado para as regiões da página
  const [regions, setRegions] = useState(page.regions || {});
  
  // Estado para o componente sendo arrastado
  const [draggingComponent, setDraggingComponent] = useState(null);
  
  // Estado para o popup de edição de componente
  const [editingComponent, setEditingComponent] = useState(null);
  
  // Estado para indicar se houve mudanças não salvas
  const [hasChanges, setHasChanges] = useState(false);
  
  // Estado para exibir uma prévia da página
  const [previewMode, setPreviewMode] = useState(false);
  
  // Referência para o contêiner da prévia
  const previewIframeRef = useRef(null);
  
  // Estado para a região alvo durante o drag
  const [dragTarget, setDragTarget] = useState(null);
  
  // Estado para o modo responsivo
  const [responsiveMode, setResponsiveMode] = useState('desktop'); // 'desktop', 'tablet', 'mobile'
  
  // Efeito para avisar sobre mudanças não salvas ao sair da página
  useEffect(() => {
    const handleBeforeUnload = (e) => {
      if (hasChanges) {
        e.preventDefault();
        e.returnValue = '';
        return '';
      }
    };
    
    window.addEventListener('beforeunload', handleBeforeUnload);
    
    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, [hasChanges]);
  
  // Manipulador para início de drag de componente
  const handleDragStart = (component) => {
    setDraggingComponent(component);
  };
  
  // Manipulador para fim de drag
  const handleDragEnd = () => {
    setDraggingComponent(null);
    setDragTarget(null);
  };
  
  // Manipulador para quando um componente é solto em uma região
  const handleDrop = (regionName, index) => {
    if (!draggingComponent) return;
    
    setRegions(prevRegions => {
      // Cria uma cópia profunda das regiões atuais
      const newRegions = JSON.parse(JSON.stringify(prevRegions));
      
      // Inicializa a região se não existir
      if (!newRegions[regionName]) {
        newRegions[regionName] = { components: [] };
      }
      
      // Se o componente já existe na página (está sendo reordenado)
      if (draggingComponent.id) {
        // Encontrar e remover o componente da posição original
        let found = false;
        Object.keys(newRegions).forEach(region => {
          const compIndex = newRegions[region].components.findIndex(c => c.id === draggingComponent.id);
          if (compIndex !== -1) {
            const [removed] = newRegions[region].components.splice(compIndex, 1);
            found = true;
            
            // Se for na mesma região e o índice for após a posição original, ajustamos o índice
            if (region === regionName && index > compIndex) {
              index--;
            }
          }
        });
        
        // Adicionar na nova posição
        if (found) {
          newRegions[regionName].components.splice(index, 0, draggingComponent);
        }
      } else {
        // Novo componente sendo adicionado
        const newComponent = {
          id: `comp-${Date.now()}`,
          component: draggingComponent.name,
          props: { ...draggingComponent.defaultProps }
        };
        
        newRegions[regionName].components.splice(index, 0, newComponent);
      }
      
      return newRegions;
    });
    
    setHasChanges(true);
  };
  
  // Manipulador para remoção de componente
  const handleRemoveComponent = (regionName, index) => {
    setRegions(prevRegions => {
      const newRegions = JSON.parse(JSON.stringify(prevRegions));
      newRegions[regionName].components.splice(index, 1);
      return newRegions;
    });
    
    setHasChanges(true);
  };
  
  // Manipulador para edição de componente
  const handleEditComponent = (regionName, index) => {
    const component = regions[regionName].components[index];
    setEditingComponent({
      regionName,
      index,
      ...component
    });
  };
  
  // Manipulador para salvar a edição de um componente
  const handleSaveComponentEdit = (updatedProps) => {
    if (!editingComponent) return;
    
    setRegions(prevRegions => {
      const newRegions = JSON.parse(JSON.stringify(prevRegions));
      const { regionName, index } = editingComponent;
      
      newRegions[regionName].components[index].props = updatedProps;
      
      return newRegions;
    });
    
    setEditingComponent(null);
    setHasChanges(true);
  };
  
  // Manipulador para cancelar a edição de um componente
  const handleCancelComponentEdit = () => {
    setEditingComponent(null);
  };
  
  // Manipulador para salvar a página
  const handleSavePage = () => {
    const updatedPage = {
      ...page,
      regions
    };
    
    onSave(updatedPage);
    setHasChanges(false);
  };
  
  // Manipulador para entrada em uma região durante drag
  const handleDragEnter = (regionName) => {
    setDragTarget(regionName);
  };
  
  // Manipulador para saída de uma região durante drag
  const handleDragLeave = () => {
    setDragTarget(null);
  };
  
  // Gerar o HTML de prévia da página com os componentes
  const generatePreviewHtml = () => {
    // Aqui idealmente usaríamos a mesma lógica do renderizador do Astro
    // Por simplicidade, vamos gerar um HTML básico
    
    let regionHtml = '';
    
    // Processar o template
    let templateHtml = template.html;
    
    // Para cada região definida no template
    template.regions.forEach(region => {
      const regionName = region.name;
      const regionComponents = regions[regionName]?.components || [];
      
      let componentsHtml = '';
      
      // Gerar HTML para cada componente na região
      regionComponents.forEach(comp => {
        const componentDef = availableComponents.find(c => c.name === comp.component);
        if (!componentDef) return;
        
        // Simular o processamento do Mustache
        let processedHtml = componentDef.html;
        Object.entries(comp.props).forEach(([key, value]) => {
          processedHtml = processedHtml.replace(new RegExp(`{{\\s*${key}\\s*}}`, 'g'), value);
        });
        
        componentsHtml += `
          <div class="component component-${comp.component}" data-component-id="${comp.id}">
            <style>${componentDef.css}</style>
            ${processedHtml}
          </div>
        `;
      });
      
      // Substituir a região no template
      const regionPlaceholder = `#region name="${regionName}".*?#endregion`;
      const regionContent = `<div class="region region-${regionName}" data-region="${regionName}">${componentsHtml}</div>`;
      
      templateHtml = templateHtml.replace(new RegExp(regionPlaceholder, 'gs'), regionContent);
    });
    
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>${page.title}</title>
        <style>
          /* Estilos básicos para a prévia */
          body {
            font-family: system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Arial, sans-serif;
            line-height: 1.5;
            margin: 0;
            padding: 0;
          }
          .region {
            min-height: 50px;
          }
        </style>
      </head>
      <body>
        ${templateHtml}
      </body>
      </html>
    `;
  };
  
  // Manipulador para exibir prévia
  const handlePreview = () => {
    setPreviewMode(true);
    
    // Quando o iframe estiver pronto, escrever o HTML da prévia
    setTimeout(() => {
      if (previewIframeRef.current) {
        const iframe = previewIframeRef.current;
        const doc = iframe.contentDocument || iframe.contentWindow.document;
        doc.open();
        doc.write(generatePreviewHtml());
        doc.close();
      }
    }, 100);
  };
  
  // Manipulador para fechar a prévia
  const handleClosePreview = () => {
    setPreviewMode(false);
  };
  
  return (
    <div className="page-editor">
      {/* Barra de ferramentas */}
      <div className="editor-toolbar">
        <div className="editor-tools">
          <button className="toolbar-btn" onClick={handleSavePage} disabled={!hasChanges}>
            <span className="btn-icon">💾</span> Salvar
          </button>
          <button className="toolbar-btn" onClick={handlePreview}>
            <span className="btn-icon">👁️</span> Prévia
          </button>
        </div>
        
        <div className="responsive-tools">
          <button 
            className={`device-btn ${responsiveMode === 'desktop' ? 'active' : ''}`}
            onClick={() => setResponsiveMode('desktop')}
            title="Visualização Desktop"
          >
            💻
          </button>
          <button 
            className={`device-btn ${responsiveMode === 'tablet' ? 'active' : ''}`}
            onClick={() => setResponsiveMode('tablet')}
            title="Visualização Tablet"
          >
            📱
          </button>
          <button 
            className={`device-btn ${responsiveMode === 'mobile' ? 'active' : ''}`}
            onClick={() => setResponsiveMode('mobile')}
            title="Visualização Mobile"
          >
            📱
          </button>
        </div>
        
        {hasChanges && (
          <div className="editor-status">
            <span className="status-badge warning">Alterações não salvas</span>
          </div>
        )}
      </div>
      
      <div className="editor-layout">
        {/* Sidebar com componentes disponíveis */}
        <div className="editor-sidebar">
          <h3>Componentes Disponíveis</h3>
          <div className="components-list">
            {availableComponents.map((component) => (
              <div
                key={component.name}
                className="component-item"
                draggable
                onDragStart={() => handleDragStart(component)}
                onDragEnd={handleDragEnd}
              >
                <div className="component-icon">{component.icon || '🧩'}</div>
                <div className="component-info">
                  <div className="component-name">{component.displayName || component.name}</div>
                  <div className="component-desc">{component.description}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
        
        {/* Área de edição principal */}
        <div className={`editor-canvas ${responsiveMode}`}>
          <div className="page-container">
            {/* Exibir estrutura do template com regiões editáveis */}
            {template.regions.map((region) => (
              <div
                key={region.name}
                className={`region-container ${dragTarget === region.name ? 'drag-target' : ''}`}
                onDragEnter={() => handleDragEnter(region.name)}
                onDragOver={(e) => e.preventDefault()}
                onDragLeave={handleDragLeave}
              >
                <div className="region-header">
                  <span className="region-name">{region.name}</span>
                </div>
                
                <div className="region-content">
                  {/* Exibir componentes na região */}
                  {(regions[region.name]?.components || []).map((component, index) => {
                    const componentDef = availableComponents.find(c => c.name === component.component);
                    return (
                      <div 
                        key={component.id} 
                        className="component-wrapper"
                        draggable
                        onDragStart={() => handleDragStart(component)}
                        onDragEnd={handleDragEnd}
                      >
                        <div className="component-toolbar">
                          <span className="component-title">
                            {componentDef?.displayName || component.component}
                          </span>
                          <div className="component-actions">
                            <button 
                              className="component-action" 
                              onClick={() => handleEditComponent(region.name, index)}
                              title="Editar"
                            >
                              ✏️
                            </button>
                            <button 
                              className="component-action" 
                              onClick={() => handleRemoveComponent(region.name, index)}
                              title="Remover"
                            >
                              🗑️
                            </button>
                          </div>
                        </div>
                        
                        <div className="component-preview">
                          {/* Aqui renderizaríamos uma prévia do componente */}
                          <div className="component-placeholder">
                            {componentDef?.displayName || component.component}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                  
                  {/* Área para soltar no final da região */}
                  <div 
                    className="drop-area"
                    onDragOver={(e) => e.preventDefault()}
                    onDrop={() => handleDrop(region.name, (regions[region.name]?.components || []).length)}
                  >
                    Solte componentes aqui
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
      
      {/* Modal de edição de componente */}
      {editingComponent && createPortal(
        <div className="component-editor-modal">
          <div className="modal-content">
            <div className="modal-header">
              <h2>Editar Componente: {editingComponent.component}</h2>
              <button className="modal-close" onClick={handleCancelComponentEdit}>×</button>
            </div>
            
            <div className="modal-body">
              {/* Formulário dinâmico para editar propriedades */}
              <ComponentPropertiesForm 
                component={editingComponent} 
                availableComponents={availableComponents}
                onSave={handleSaveComponentEdit}
                onCancel={handleCancelComponentEdit}
              />
            </div>
          </div>
        </div>,
        document.body
      )}
      
      {/* Modal de prévia */}
      {previewMode && createPortal(
        <div className="preview-modal">
          <div className="modal-content">
            <div className="modal-header">
              <h2>Prévia da Página</h2>
              <button className="modal-close" onClick={handleClosePreview}>×</button>
            </div>
            
            <div className="modal-body">
              <div className={`preview-container ${responsiveMode}`}>
                <iframe ref={previewIframeRef} className="preview-iframe" title="Prévia da página"></iframe>
              </div>
            </div>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
};

// Componente para o formulário de edição de propriedades
const ComponentPropertiesForm = ({ component, availableComponents, onSave, onCancel }) => {
  // Buscar definição do componente
  const componentDef = availableComponents.find(c => c.name === component.component);
  
  // Estado para as propriedades sendo editadas
  const [properties, setProperties] = useState(component.props || {});
  
  // Manipulador para alteração de propriedade
  const handlePropertyChange = (name, value) => {
    setProperties(prev => ({
      ...prev,
      [name]: value
    }));
  };
  
  // Manipulador para salvar alterações
  const handleSubmit = (e) => {
    e.preventDefault();
    onSave(properties);
  };
  
  // Se não encontrar a definição do componente
  if (!componentDef) {
    return <div>Componente não encontrado</div>;
  }
  
  return (
    <form onSubmit={handleSubmit} className="properties-form">
      {componentDef.schema?.properties && Object.entries(componentDef.schema.properties).map(([propName, propSchema]) => (
        <div key={propName} className="form-group">
          <label className="form-label">
            {propSchema.title || propName}
            {propSchema.description && (
              <span className="property-hint" title={propSchema.description}>ℹ️</span>
            )}
          </label>
          
          {/* Renderizar o input apropriado baseado no tipo da propriedade */}
          {propSchema.type === 'string' && propSchema.enum ? (
            // Select para enums
            <select 
              className="form-select"
              value={properties[propName] || ''}
              onChange={(e) => handlePropertyChange(propName, e.target.value)}
            >
              {propSchema.enum.map(option => (
                <option key={option} value={option}>{option}</option>
              ))}
            </select>
          ) : propSchema.type === 'boolean' ? (
            // Checkbox para booleanos
            <div className="checkbox-wrapper">
              <input
                type="checkbox"
                id={`prop-${propName}`}
                checked={properties[propName] || false}
                onChange={(e) => handlePropertyChange(propName, e.target.checked)}
              />
              <label htmlFor={`prop-${propName}`}>Ativado</label>
            </div>
          ) : propSchema.type === 'number' || propSchema.type === 'integer' ? (
            // Input numérico
            <input
              type="number"
              className="form-input"
              value={properties[propName] || 0}
              onChange={(e) => handlePropertyChange(propName, Number(e.target.value))}
              min={propSchema.minimum}
              max={propSchema.maximum}
              step={propSchema.type === 'integer' ? 1 : 'any'}
            />
          ) : propSchema.format === 'color' ? (
            // Color picker
            <div className="color-picker">
              <input
                type="color"
                value={properties[propName] || '#ffffff'}
                onChange={(e) => handlePropertyChange(propName, e.target.value)}
              />
              <input
                type="text"
                className="form-input"
                value={properties[propName] || '#ffffff'}
                onChange={(e) => handlePropertyChange(propName, e.target.value)}
                placeholder="#RRGGBB"
              />
            </div>
          ) : propSchema.format === 'textarea' ? (
            // Textarea para textos longos
            <textarea
              className="form-textarea"
              value={properties[propName] || ''}
              onChange={(e) => handlePropertyChange(propName, e.target.value)}
              rows={5}
              placeholder={propSchema.placeholder || ''}
            />
          ) : propSchema.format === 'image' ? (
            // Seletor de imagem
            <div className="image-selector">
              <input
                type="text"
                className="form-input"
                value={properties[propName] || ''}
                onChange={(e) => handlePropertyChange(propName, e.target.value)}
                placeholder="URL da imagem"
              />
              <button 
                type="button" 
                className="btn-secondary"
                onClick={() => alert('Abrir biblioteca de mídia')}
              >
                Escolher Imagem
              </button>
            </div>
          ) : (
            // Input de texto padrão
            <input
              type="text"
              className="form-input"
              value={properties[propName] || ''}
              onChange={(e) => handlePropertyChange(propName, e.target.value)}
              placeholder={propSchema.placeholder || ''}
            />
          )}
          
          {propSchema.description && (
            <div className="form-help">{propSchema.description}</div>
          )}
        </div>
      ))}
      
      <div className="form-actions">
        <button type="button" className="btn-secondary" onClick={onCancel}>Cancelar</button>
        <button type="submit" className="btn-primary">Salvar Alterações</button>
      </div>
    </form>
  );
};

export default PageEditor;