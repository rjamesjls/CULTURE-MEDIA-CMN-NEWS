// =================================================================
// THEME SWITCHER - Compare Design Versions
// =================================================================

document.addEventListener('DOMContentLoaded', function () {

    // Create theme switcher UI
    createThemeSwitcher();

    // Load saved theme preference
    const savedTheme = localStorage.getItem('cmn-theme') || 'original';
    applyTheme(savedTheme);

    // =================================================================
    // CREATE THEME SWITCHER UI
    // =================================================================
    function createThemeSwitcher() {
        const switcher = document.createElement('div');
        switcher.className = 'theme-switcher';
        switcher.innerHTML = `
      <div class="theme-switcher-container">
        <div class="theme-switcher-label">
          <i class="fas fa-palette"></i>
          <span>Comparer les designs</span>
        </div>
        <div class="theme-options">
          <button class="theme-option active" data-theme="original">
            <div class="theme-preview theme-preview-original"></div>
            <span class="theme-name">Version Énergique</span>
            <span class="theme-description">Jaune & Rouge</span>
          </button>
          <button class="theme-option" data-theme="alternate">
            <div class="theme-preview theme-preview-alternate"></div>
            <span class="theme-name">Version Premium</span>
            <span class="theme-description">Or & Bleu Nuit</span>
          </button>
        </div>
        <button class="theme-switcher-close" aria-label="Fermer">
          <i class="fas fa-times"></i>
        </button>
      </div>
      <button class="theme-switcher-toggle" aria-label="Changer de thème">
        <i class="fas fa-palette"></i>
        <span class="toggle-text">Thèmes</span>
      </button>
    `;

        document.body.appendChild(switcher);

        // Add styles
        const style = document.createElement('style');
        style.textContent = `
      .theme-switcher {
        position: fixed;
        bottom: 30px;
        left: 30px;
        z-index: 1000;
      }
      
      .theme-switcher-toggle {
        width: 60px;
        height: 60px;
        border-radius: 50%;
        background: linear-gradient(135deg, #FFD700 0%, #E6C200 100%);
        color: #1a1a1a;
        border: none;
        cursor: pointer;
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        gap: 4px;
        box-shadow: 0 4px 20px rgba(0, 0, 0, 0.3);
        transition: all 0.3s ease;
        font-size: 20px;
      }
      
      .toggle-text {
        font-size: 9px;
        font-weight: 600;
        text-transform: uppercase;
        letter-spacing: 0.5px;
      }
      
      .theme-switcher-toggle:hover {
        transform: translateY(-3px) scale(1.05);
        box-shadow: 0 6px 25px rgba(255, 215, 0, 0.4);
      }
      
      body.theme-alternate .theme-switcher-toggle {
        background: linear-gradient(135deg, #D4AF37 0%, #B8941F 100%);
        color: #0A1929;
      }
      
      .theme-switcher-container {
        position: absolute;
        bottom: 80px;
        left: 0;
        background: white;
        border-radius: 16px;
        padding: 24px;
        box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
        min-width: 320px;
        opacity: 0;
        visibility: hidden;
        transform: translateY(20px);
        transition: all 0.3s ease;
      }
      
      body.theme-alternate .theme-switcher-container {
        background: linear-gradient(135deg, #0F1F2E 0%, #132F4C 100%);
        border: 1px solid rgba(212, 175, 55, 0.3);
      }
      
      .theme-switcher-container.active {
        opacity: 1;
        visibility: visible;
        transform: translateY(0);
      }
      
      .theme-switcher-label {
        display: flex;
        align-items: center;
        gap: 12px;
        margin-bottom: 20px;
        font-family: 'Montserrat', sans-serif;
        font-weight: 700;
        font-size: 16px;
        color: #1a1a1a;
      }
      
      body.theme-alternate .theme-switcher-label {
        color: #E7EBF0;
      }
      
      .theme-switcher-label i {
        font-size: 24px;
        color: #FFD700;
      }
      
      body.theme-alternate .theme-switcher-label i {
        color: #D4AF37;
      }
      
      .theme-options {
        display: flex;
        flex-direction: column;
        gap: 12px;
      }
      
      .theme-option {
        display: flex;
        align-items: center;
        gap: 16px;
        padding: 16px;
        background: #f5f5f5;
        border: 2px solid transparent;
        border-radius: 12px;
        cursor: pointer;
        transition: all 0.3s ease;
        text-align: left;
      }
      
      body.theme-alternate .theme-option {
        background: rgba(212, 175, 55, 0.05);
        border-color: rgba(212, 175, 55, 0.1);
      }
      
      .theme-option:hover {
        border-color: #FFD700;
        transform: translateX(4px);
      }
      
      body.theme-alternate .theme-option:hover {
        border-color: #D4AF37;
      }
      
      .theme-option.active {
        background: #FFF4CC;
        border-color: #FFD700;
        box-shadow: 0 4px 12px rgba(255, 215, 0, 0.2);
      }
      
      body.theme-alternate .theme-option.active {
        background: rgba(212, 175, 55, 0.15);
        border-color: #D4AF37;
        box-shadow: 0 4px 12px rgba(212, 175, 55, 0.3);
      }
      
      .theme-preview {
        width: 50px;
        height: 50px;
        border-radius: 8px;
        flex-shrink: 0;
        box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
      }
      
      .theme-preview-original {
        background: linear-gradient(135deg, #FFD700 0%, #DC143C 50%, #1a1a1a 100%);
      }
      
      .theme-preview-alternate {
        background: linear-gradient(135deg, #D4AF37 0%, #0A1929 50%, #000814 100%);
      }
      
      .theme-name {
        font-family: 'Montserrat', sans-serif;
        font-weight: 700;
        font-size: 14px;
        color: #1a1a1a;
        display: block;
        margin-bottom: 4px;
      }
      
      body.theme-alternate .theme-name {
        color: #E7EBF0;
      }
      
      .theme-description {
        font-size: 12px;
        color: #666;
      }
      
      body.theme-alternate .theme-description {
        color: #9199A6;
      }
      
      .theme-switcher-close {
        position: absolute;
        top: 16px;
        right: 16px;
        width: 32px;
        height: 32px;
        border-radius: 50%;
        background: #e6e6e6;
        border: none;
        cursor: pointer;
        display: flex;
        align-items: center;
        justify-content: center;
        color: #666;
        transition: all 0.2s ease;
      }
      
      body.theme-alternate .theme-switcher-close {
        background: rgba(212, 175, 55, 0.1);
        color: #D4AF37;
      }
      
      .theme-switcher-close:hover {
        background: #DC143C;
        color: white;
        transform: rotate(90deg);
      }
      
      body.theme-alternate .theme-switcher-close:hover {
        background: #D4AF37;
        color: #0A1929;
      }
      
      @media (max-width: 768px) {
        .theme-switcher {
          bottom: 20px;
          left: 20px;
        }
        
        .theme-switcher-toggle {
          width: 50px;
          height: 50px;
          font-size: 18px;
        }
        
        .toggle-text {
          font-size: 8px;
        }
        
        .theme-switcher-container {
          min-width: 280px;
          padding: 20px;
        }
      }
    `;
        document.head.appendChild(style);

        // Add event listeners
        const toggle = document.querySelector('.theme-switcher-toggle');
        const container = document.querySelector('.theme-switcher-container');
        const closeBtn = document.querySelector('.theme-switcher-close');
        const themeOptions = document.querySelectorAll('.theme-option');

        toggle.addEventListener('click', function () {
            container.classList.toggle('active');
        });

        closeBtn.addEventListener('click', function () {
            container.classList.remove('active');
        });

        themeOptions.forEach(function (option) {
            option.addEventListener('click', function () {
                const theme = this.dataset.theme;

                // Update active state
                themeOptions.forEach(opt => opt.classList.remove('active'));
                this.classList.add('active');

                // Apply theme
                applyTheme(theme);

                // Save preference
                localStorage.setItem('cmn-theme', theme);

                // Show notification
                showThemeNotification(theme);

                // Close panel after a delay
                setTimeout(function () {
                    container.classList.remove('active');
                }, 800);
            });
        });

        // Close when clicking outside
        document.addEventListener('click', function (e) {
            if (!switcher.contains(e.target) && container.classList.contains('active')) {
                container.classList.remove('active');
            }
        });
    }

    // =================================================================
    // APPLY THEME
    // =================================================================
    function applyTheme(theme) {
        if (theme === 'alternate') {
            document.body.classList.add('theme-alternate');
        } else {
            document.body.classList.remove('theme-alternate');
        }

        // Update active button
        const themeOptions = document.querySelectorAll('.theme-option');
        themeOptions.forEach(function (option) {
            if (option.dataset.theme === theme) {
                option.classList.add('active');
            } else {
                option.classList.remove('active');
            }
        });
    }

    // =================================================================
    // SHOW NOTIFICATION
    // =================================================================
    function showThemeNotification(theme) {
        const messages = {
            original: '🎨 Version Énergique activée !',
            alternate: '✨ Version Premium activée !'
        };

        const notification = document.createElement('div');
        notification.className = 'theme-notification';
        notification.textContent = messages[theme] || 'Thème changé !';
        notification.style.cssText = `
      position: fixed;
      top: 100px;
      right: 30px;
      padding: 16px 24px;
      background: linear-gradient(135deg, ${theme === 'original' ? '#FFD700' : '#D4AF37'} 0%, ${theme === 'original' ? '#E6C200' : '#B8941F'} 100%);
      color: ${theme === 'original' ? '#1a1a1a' : '#0A1929'};
      border-radius: 12px;
      box-shadow: 0 8px 24px rgba(0, 0, 0, 0.3);
      z-index: 2000;
      font-family: 'Montserrat', sans-serif;
      font-weight: 600;
      font-size: 14px;
      animation: slideInRight 0.3s ease-out;
    `;

        document.body.appendChild(notification);

        setTimeout(function () {
            notification.style.animation = 'slideOutRight 0.3s ease-out';
            setTimeout(function () {
                if (document.body.contains(notification)) {
                    document.body.removeChild(notification);
                }
            }, 300);
        }, 2000);
    }

    // Add animations
    const animStyle = document.createElement('style');
    animStyle.textContent = `
    @keyframes slideInRight {
      from {
        opacity: 0;
        transform: translateX(100px);
      }
      to {
        opacity: 1;
        transform: translateX(0);
      }
    }
    
    @keyframes slideOutRight {
      from {
        opacity: 1;
        transform: translateX(0);
      }
      to {
        opacity: 0;
        transform: translateX(100px);
      }
    }
  `;
    document.head.appendChild(animStyle);

});
