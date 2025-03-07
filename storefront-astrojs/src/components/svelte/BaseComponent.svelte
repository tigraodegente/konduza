<script>
  /**
   * BaseComponent.svelte
   * 
   * Componente base para usar como template para componentes gerados a partir de JSON.
   * Este componente pode ser estendido e modificado para diferentes tipos de componentes.
   */
  
  // Propriedades
  export let componentId;
  export let componentType;
  export let data = {};
  export let settings = {};
  export let styles = "";
  
  // Configurações opcionais
  export let hasSlot = false;
  export let interactive = false;
  export let enableTransitions = true;
  
  // Estado interno
  let isClient = false;
  let isVisible = false;
  let isHovered = false;
  let isActive = false;
  
  // Detectar se estamos no cliente (para hidratação)
  import { onMount } from 'svelte';
  
  onMount(() => {
    isClient = true;
    
    // Verificar se o componente está visível (opcional, usando IntersectionObserver)
    if ('IntersectionObserver' in window) {
      const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
          isVisible = entry.isIntersecting;
        });
      }, { threshold: 0.1 });
      
      const componentElement = document.getElementById(componentId);
      if (componentElement) {
        observer.observe(componentElement);
        
        return () => {
          observer.disconnect();
        };
      }
    } else {
      // Fallback para navegadores sem suporte a IntersectionObserver
      isVisible = true;
    }
  });
  
  // Manipuladores de eventos
  function handleMouseEnter() {
    isHovered = true;
  }
  
  function handleMouseLeave() {
    isHovered = false;
  }
  
  function handleMouseDown() {
    isActive = true;
  }
  
  function handleMouseUp() {
    isActive = false;
  }
  
  // Calcular classe de estado
  $: stateClass = [
    isHovered ? 'hovered' : '',
    isActive ? 'active' : '',
    isVisible ? 'visible' : 'hidden'
  ].filter(Boolean).join(' ');
</script>

<style>
  .component-wrapper {
    position: relative;
  }
  
  .component {
    transition: opacity 0.3s ease;
  }
  
  .component.hidden {
    opacity: 0;
  }
  
  .component.visible {
    opacity: 1;
  }
  
  /* Estilos personalizados podem ser injetados via props */
  :global(.debug-outline) .component-wrapper {
    outline: 1px dashed rgba(0, 0, 255, 0.3);
  }
  
  :global(.debug-outline) .component-wrapper::before {
    content: attr(data-component-type);
    position: absolute;
    top: -18px;
    left: 0;
    font-size: 10px;
    background: rgba(0, 0, 255, 0.1);
    padding: 2px 4px;
    border-radius: 2px;
    color: blue;
    z-index: 1;
  }
</style>

<div 
  class="component-wrapper"
  data-component-type={componentType}
  id={componentId}
  on:mouseenter={interactive ? handleMouseEnter : null}
  on:mouseleave={interactive ? handleMouseLeave : null}
  on:mousedown={interactive ? handleMouseDown : null}
  on:mouseup={interactive ? handleMouseUp : null}
>
  <style>{styles}</style>
  
  <div class="component {stateClass} {componentType}-component">
    <!-- Conteúdo do componente -->
    <slot>
      {#if !hasSlot}
        <div class="component-content">
          {#if data.title}
            <h2>{data.title}</h2>
          {/if}
          
          {#if data.content}
            <div class="content">
              {@html data.content}
            </div>
          {/if}
          
          {#if data.items && Array.isArray(data.items) && data.items.length > 0}
            <ul class="items">
              {#each data.items as item, i}
                <li class="item" key={i}>
                  {#if item.title}
                    <h3>{item.title}</h3>
                  {/if}
                  
                  {#if item.description}
                    <p>{item.description}</p>
                  {/if}
                </li>
              {/each}
            </ul>
          {/if}
          
          {#if data.buttonText && data.buttonUrl}
            <a href={data.buttonUrl} class="button">
              {data.buttonText}
            </a>
          {/if}
        </div>
      {/if}
    </slot>
  </div>
</div>