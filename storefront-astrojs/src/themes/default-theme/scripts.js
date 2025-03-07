/**
 * Scripts globais do tema Default
 * 
 * Este arquivo contém scripts comuns usados em todo o site.
 */

// Configuração do console para debugging
const DEBUG = true;

/**
 * Função para log com prefixo do tema
 */
function log(message, ...args) {
  if (DEBUG) {
    console.log(`[Default Theme] ${message}`, ...args);
  }
}

// Log inicial para confirmar carregamento
log('Scripts carregados');

/**
 * Toggle para menu mobile
 */
document.addEventListener('DOMContentLoaded', function() {
  // Mobile nav toggle
  const mobileNavToggle = document.querySelector('.mobile-nav-toggle');
  if (mobileNavToggle) {
    log('Mobile nav toggle encontrado');
    
    mobileNavToggle.addEventListener('click', function() {
      const navMenu = document.querySelector('.nav-menu');
      if (navMenu) {
        navMenu.classList.toggle('active');
        mobileNavToggle.classList.toggle('active');
        log('Toggle de menu mobile acionado');
      }
    });
  }
  
  // Scroll suave para links de âncora
  document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function(e) {
      const href = this.getAttribute('href');
      
      // Ignorar se for apenas "#"
      if (href === '#') return;
      
      e.preventDefault();
      
      const target = document.querySelector(href);
      if (target) {
        log(`Scroll suave para: ${href}`);
        
        // Scroll suave
        target.scrollIntoView({
          behavior: 'smooth',
          block: 'start'
        });
        
        // Fechar menu mobile se estiver aberto
        const navMenu = document.querySelector('.nav-menu');
        const mobileNavToggle = document.querySelector('.mobile-nav-toggle');
        
        if (navMenu && navMenu.classList.contains('active')) {
          navMenu.classList.remove('active');
          if (mobileNavToggle) {
            mobileNavToggle.classList.remove('active');
          }
        }
      }
    });
  });
  
  // Detecção de scroll para efeitos
  const header = document.querySelector('header.navbar');
  if (header) {
    log('Header encontrado para efeito de scroll');
    
    window.addEventListener('scroll', function() {
      if (window.scrollY > 100) {
        header.classList.add('scrolled');
      } else {
        header.classList.remove('scrolled');
      }
    });
  }
});

/**
 * Lazy loading para imagens
 */
function setupLazyLoading() {
  if ('IntersectionObserver' in window) {
    log('Configurando lazy loading de imagens');
    
    const lazyImages = [].slice.call(document.querySelectorAll('img.lazy'));
    
    let lazyImageObserver = new IntersectionObserver(function(entries, observer) {
      entries.forEach(function(entry) {
        if (entry.isIntersecting) {
          let lazyImage = entry.target;
          lazyImage.src = lazyImage.dataset.src;
          if (lazyImage.dataset.srcset) {
            lazyImage.srcset = lazyImage.dataset.srcset;
          }
          lazyImage.classList.remove('lazy');
          lazyImageObserver.unobserve(lazyImage);
          log('Imagem carregada via lazy loading');
        }
      });
    });
    
    lazyImages.forEach(function(lazyImage) {
      lazyImageObserver.observe(lazyImage);
    });
  } else {
    log('IntersectionObserver não suportado, carregando imagens normalmente');
  }
}

// Iniciar lazy loading após carregamento da página
if (document.readyState === 'complete') {
  setupLazyLoading();
} else {
  window.addEventListener('load', setupLazyLoading);
}

/**
 * Modo escuro/claro
 */
function setupDarkMode() {
  const darkModeToggle = document.querySelector('.dark-mode-toggle');
  if (darkModeToggle) {
    log('Toggle de modo escuro encontrado');
    
    // Verificar preferência salva
    const savedMode = localStorage.getItem('darkMode');
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    
    // Aplicar modo escuro se estiver salvo ou preferido pelo sistema
    if (savedMode === 'dark' || (savedMode === null && prefersDark)) {
      document.documentElement.classList.add('dark-mode');
      darkModeToggle.classList.add('active');
      log('Modo escuro ativado');
    }
    
    // Toggle de modo escuro ao clicar
    darkModeToggle.addEventListener('click', function() {
      document.documentElement.classList.toggle('dark-mode');
      const isDark = document.documentElement.classList.contains('dark-mode');
      
      // Salvar preferência
      localStorage.setItem('darkMode', isDark ? 'dark' : 'light');
      
      darkModeToggle.classList.toggle('active', isDark);
      log(`Modo escuro ${isDark ? 'ativado' : 'desativado'}`);
    });
  }
}

// Iniciar configuração de modo escuro
document.addEventListener('DOMContentLoaded', setupDarkMode);

/**
 * Animações ao scroll
 */
function setupScrollAnimations() {
  const animatedElements = document.querySelectorAll('.animate-on-scroll');
  
  if (animatedElements.length > 0) {
    log(`Configurando animações para ${animatedElements.length} elementos`);
    
    if ('IntersectionObserver' in window) {
      const animationObserver = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            entry.target.classList.add('animated');
            animationObserver.unobserve(entry.target);
            log('Elemento animado ao scroll');
          }
        });
      }, { threshold: 0.1 });
      
      animatedElements.forEach(element => {
        animationObserver.observe(element);
      });
    } else {
      // Fallback para navegadores que não suportam IntersectionObserver
      animatedElements.forEach(element => {
        element.classList.add('animated');
      });
      log('Animações aplicadas diretamente (sem IntersectionObserver)');
    }
  }
}

// Iniciar animações ao scroll
document.addEventListener('DOMContentLoaded', setupScrollAnimations);