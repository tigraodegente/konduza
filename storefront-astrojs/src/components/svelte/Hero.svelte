<script>
  /**
   * Hero.svelte
   * 
   * Componente Hero implementado em Svelte para geração a partir de JSON.
   * Este componente implementa uma seção de destaque (hero) com título, subtítulo,
   * botão e imagem de fundo.
   */
  
  // Propriedades
  export let componentId;
  export let title = "";
  export let subtitle = "";
  export let buttonText = "";
  export let buttonUrl = "#";
  export let backgroundImage = "";
  export let align = "center"; // center, left, right
  export let textColor = "white";
  export let overlayColor = "rgba(0, 0, 0, 0.4)";
  export let overlayOpacity = 0.4;
  export let height = "500px";
  export let buttonStyle = "primary"; // primary, secondary, outline
  
  // Configurações adicionais
  export let enableParallax = false;
  export let fullWidth = false;
  
  // Estado
  import { onMount } from 'svelte';
  
  let isVisible = false;
  let containerRef;
  let parallaxOffset = 0;
  
  onMount(() => {
    // Detecção de visibilidade para animações
    if ('IntersectionObserver' in window) {
      const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
          isVisible = entry.isIntersecting;
        });
      }, { threshold: 0.1 });
      
      if (containerRef) {
        observer.observe(containerRef);
      }
      
      // Efeito parallax
      if (enableParallax && backgroundImage) {
        const handleScroll = () => {
          if (!containerRef || !isVisible) return;
          
          const rect = containerRef.getBoundingClientRect();
          const viewportHeight = window.innerHeight;
          
          if (rect.top < viewportHeight && rect.bottom > 0) {
            // Calcular deslocamento de parallax (30% da posição de scroll)
            parallaxOffset = (rect.top / viewportHeight) * 30;
          }
        };
        
        window.addEventListener('scroll', handleScroll, { passive: true });
        return () => {
          observer.disconnect();
          window.removeEventListener('scroll', handleScroll);
        };
      }
      
      return () => {
        observer.disconnect();
      };
    } else {
      // Fallback para navegadores sem suporte a IntersectionObserver
      isVisible = true;
    }
  });
  
  // Estilos computados
  $: containerStyle = `
    height: ${height};
    color: ${textColor};
    text-align: ${align};
  `;
  
  $: backgroundStyle = backgroundImage 
    ? `
      background-image: url(${backgroundImage});
      background-size: cover;
      background-position: center ${enableParallax ? `calc(50% + ${parallaxOffset}px)` : '50%'};
      ${enableParallax ? 'transition: background-position 0.1s ease-out;' : ''}
    ` 
    : '';
    
  $: overlayStyle = `
    background-color: ${overlayColor};
    opacity: ${overlayOpacity};
  `;
  
  $: buttonClasses = {
    primary: 'btn-primary',
    secondary: 'btn-secondary',
    outline: 'btn-outline'
  }[buttonStyle] || 'btn-primary';
  
  $: animationClass = isVisible ? 'is-visible' : '';
</script>

<style>
  .hero {
    position: relative;
    display: flex;
    align-items: center;
    justify-content: center;
    overflow: hidden;
    padding: 2rem;
  }
  
  .hero-background {
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    z-index: -2;
  }
  
  .hero-overlay {
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    z-index: -1;
  }
  
  .hero-content {
    position: relative;
    max-width: 800px;
    width: 100%;
    padding: 2rem;
    z-index: 1;
  }
  
  .hero-content.align-left {
    margin-right: auto;
    text-align: left;
  }
  
  .hero-content.align-right {
    margin-left: auto;
    text-align: right;
  }
  
  .hero-content.align-center {
    margin: 0 auto;
    text-align: center;
  }
  
  .hero-title {
    font-size: 3rem;
    font-weight: 700;
    line-height: 1.2;
    margin-bottom: 1rem;
    opacity: 0;
    transform: translateY(20px);
    transition: opacity 0.8s ease, transform 0.8s ease;
  }
  
  .hero-subtitle {
    font-size: 1.5rem;
    opacity: 0.9;
    margin-bottom: 2rem;
    opacity: 0;
    transform: translateY(20px);
    transition: opacity 0.8s ease 0.2s, transform 0.8s ease 0.2s;
  }
  
  .hero-button {
    display: inline-block;
    padding: 0.8rem 2rem;
    font-size: 1.1rem;
    font-weight: 600;
    border-radius: 4px;
    cursor: pointer;
    transition: all 0.3s ease;
    opacity: 0;
    transform: translateY(20px);
    transition: opacity 0.8s ease 0.4s, transform 0.8s ease 0.4s, background-color 0.3s ease;
    text-decoration: none;
  }
  
  .hero-button.btn-primary {
    background-color: var(--color-primary, #3498db);
    color: white;
    border: none;
  }
  
  .hero-button.btn-primary:hover {
    background-color: var(--color-primary-dark, #2980b9);
  }
  
  .hero-button.btn-secondary {
    background-color: var(--color-secondary, #2ecc71);
    color: white;
    border: none;
  }
  
  .hero-button.btn-secondary:hover {
    background-color: var(--color-secondary-dark, #27ae60);
  }
  
  .hero-button.btn-outline {
    background-color: transparent;
    color: var(--color-primary, #3498db);
    border: 2px solid var(--color-primary, #3498db);
  }
  
  .hero-button.btn-outline:hover {
    background-color: var(--color-primary, #3498db);
    color: white;
  }
  
  /* Animações */
  .is-visible .hero-title,
  .is-visible .hero-subtitle,
  .is-visible .hero-button {
    opacity: 1;
    transform: translateY(0);
  }
  
  /* Responsividade */
  @media (max-width: 768px) {
    .hero-title {
      font-size: 2.5rem;
    }
    
    .hero-subtitle {
      font-size: 1.2rem;
    }
  }
  
  @media (max-width: 480px) {
    .hero-title {
      font-size: 2rem;
    }
    
    .hero-content {
      padding: 1rem;
    }
  }
</style>

<div 
  id={componentId}
  class="hero"
  style={containerStyle}
  bind:this={containerRef}
>
  {#if backgroundImage}
    <div class="hero-background" style={backgroundStyle}></div>
    <div class="hero-overlay" style={overlayStyle}></div>
  {/if}
  
  <div class="hero-content align-{align} {animationClass}">
    {#if title}
      <h1 class="hero-title">{title}</h1>
    {/if}
    
    {#if subtitle}
      <p class="hero-subtitle">{subtitle}</p>
    {/if}
    
    {#if buttonText && buttonUrl}
      <a href={buttonUrl} class="hero-button {buttonClasses}">
        {buttonText}
      </a>
    {/if}
  </div>
</div>