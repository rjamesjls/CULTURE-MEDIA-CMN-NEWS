// =================================================================
// MAIN JAVASCRIPT - Core Functionality
// =================================================================

// Wait for DOM to be ready
document.addEventListener('DOMContentLoaded', function() {
  
  // =================================================================
  // MOBILE MENU TOGGLE
  // =================================================================
  const menuToggle = document.getElementById('menuToggle');
  const navMenu = document.getElementById('navMenu');
  const header = document.getElementById('header');
  
  if (menuToggle && navMenu) {
    menuToggle.addEventListener('click', function() {
      navMenu.classList.toggle('active');
      menuToggle.classList.toggle('active');
      
      // Animate hamburger
      const spans = menuToggle.querySelectorAll('span');
      if (navMenu.classList.contains('active')) {
        spans[0].style.transform = 'rotate(45deg) translateY(10px)';
        spans[1].style.opacity = '0';
        spans[2].style.transform = 'rotate(-45deg) translateY(-10px)';
      } else {
        spans[0].style.transform = '';
        spans[1].style.opacity = '';
        spans[2].style.transform = '';
      }
    });
    
    // Close menu when clicking outside
    document.addEventListener('click', function(e) {
      if (!navMenu.contains(e.target) && !menuToggle.contains(e.target)) {
        navMenu.classList.remove('active');
        menuToggle.classList.remove('active');
        const spans = menuToggle.querySelectorAll('span');
        spans[0].style.transform = '';
        spans[1].style.opacity = '';
        spans[2].style.transform = '';
      }
    });
  }
  
  // =================================================================
  // HEADER SCROLL BEHAVIOR
  // =================================================================
  let lastScroll = 0;
  
  window.addEventListener('scroll', function() {
    const currentScroll = window.pageYOffset;
    
    // Hide header on scroll down, show on scroll up
    if (header) {
      if (currentScroll > lastScroll && currentScroll > 100) {
        header.style.transform = 'translateY(-100%)';
      } else {
        header.style.transform = 'translateY(0)';
      }
    }
    
    lastScroll = currentScroll;
  });
  
  // =================================================================
  // SEARCH FUNCTIONALITY
  // =================================================================
  const searchInput = document.getElementById('searchInput');
  
  if (searchInput) {
    searchInput.addEventListener('keypress', function(e) {
      if (e.key === 'Enter') {
        e.preventDefault();
        const query = searchInput.value.trim();
        if (query) {
          window.location.href = `/all-articles?search=${encodeURIComponent(query)}`;
        }
      }
    });
  }
  
  // =================================================================
  // NEWSLETTER FORM
  // =================================================================
  const newsletterForm = document.getElementById('newsletterForm');
  const newsletterEmail = document.getElementById('newsletterEmail');
  
  if (newsletterForm && newsletterEmail) {
    newsletterForm.addEventListener('submit', function(e) {
      e.preventDefault();
      
      const email = newsletterEmail.value.trim();
      
      if (email && validateEmail(email)) {
        // Show success message
        showMessage('Merci ! Vous êtes inscrit(e) à notre newsletter.', 'success');
        newsletterEmail.value = '';
        
        // In production, send to your newsletter service
        // Example: sendToNewsletter(email);
      } else {
        showMessage('Veuillez entrer une adresse email valide.', 'error');
      }
    });
  }
  
  // Legacy Lazy Loading block removed to prevent React Hydration errors
  
  // =================================================================
  // SMOOTH SCROLL TO ANCHORS
  // =================================================================
  document.querySelectorAll('a[href^="#"]').forEach(function(anchor) {
    anchor.addEventListener('click', function(e) {
      const href = this.getAttribute('href');
      if (href !== '#' && href !== '#!') {
        e.preventDefault();
        const target = document.querySelector(href);
        if (target) {
          const offsetTop = target.offsetTop - 80; // Account for fixed header
          window.scrollTo({
            top: offsetTop,
            behavior: 'smooth'
          });
        }
      }
    });
  });
  
  // =================================================================
  // HELPER FUNCTIONS
  // =================================================================
  
  function validateEmail(email) {
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return re.test(email);
  }
  
  function showMessage(message, type) {
    // Create message element
    const messageEl = document.createElement('div');
    messageEl.className = `message message-${type}`;
    messageEl.textContent = message;
    messageEl.style.cssText = `
      position: fixed;
      top: 100px;
      right: 20px;
      padding: 1rem 1.5rem;
      background: ${type === 'success' ? 'var(--color-success)' : 'var(--color-error)'};
      color: white;
      border-radius: var(--radius-md);
      box-shadow: var(--shadow-xl);
      z-index: 1000;
      animation: slideIn 0.3s ease-out;
      max-width: 400px;
    `;
    
    document.body.appendChild(messageEl);
    
    // Remove after 4 seconds
    setTimeout(function() {
      messageEl.style.animation = 'fadeOut 0.3s ease-out';
      setTimeout(function() {
        document.body.removeChild(messageEl);
      }, 300);
    }, 4000);
  }
  
  // =================================================================
  // SCROLL TO TOP BUTTON (optional)
  // =================================================================
  const scrollTopBtn = document.createElement('button');
  scrollTopBtn.className = 'scroll-to-top';
  scrollTopBtn.innerHTML = '<i class="fas fa-arrow-up"></i>';
  scrollTopBtn.style.cssText = `
    position: fixed;
    bottom: 30px;
    right: 30px;
    width: 50px;
    height: 50px;
    border-radius: 50%;
    background: var(--color-primary);
    color: var(--color-dark);
    border: none;
    cursor: pointer;
    display: none;
    align-items: center;
    justify-content: center;
    box-shadow: var(--shadow-lg);
    transition: all var(--transition-base);
    z-index: 100;
  `;
  
  document.body.appendChild(scrollTopBtn);
  
  window.addEventListener('scroll', function() {
    if (window.pageYOffset > 300) {
      scrollTopBtn.style.display = 'flex';
    } else {
      scrollTopBtn.style.display = 'none';
    }
  });
  
  scrollTopBtn.addEventListener('click', function() {
    window.scrollTo({
      top: 0,
      behavior: 'smooth'
    });
  });
  
  scrollTopBtn.addEventListener('mouseenter', function() {
    this.style.transform = 'translateY(-5px) scale(1.1)';
  });
  
  scrollTopBtn.addEventListener('mouseleave', function() {
    this.style.transform = 'translateY(0) scale(1)';
  });
  
});

// Add fadeOut animation
const style = document.createElement('style');
style.textContent = `
  @keyframes fadeOut {
    from {
      opacity: 1;
      transform: translateX(0);
    }
    to {
      opacity: 0;
      transform: translateX(20px);
    }
  }
`;
document.head.appendChild(style);
