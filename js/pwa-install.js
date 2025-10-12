// Texas Resource Hub - PWA Install & Offline Status
// Handles app installation prompts and offline status indicators

class PWAInstaller {
  constructor() {
    this.deferredPrompt = null;
    this.isInstalled = false;
    this.isOnline = navigator.onLine;
    this.init();
  }

  async init() {
    this.setupInstallPrompt();
    this.setupOfflineIndicator();
    this.setupServiceWorker();
    this.addInstallButton();
    this.addOfflineBadge();
  }

  setupInstallPrompt() {
    // Listen for the beforeinstallprompt event
    window.addEventListener('beforeinstallprompt', (e) => {
      console.log('[PWA] Install prompt available');
      e.preventDefault();
      this.deferredPrompt = e;
      this.showInstallButton();
    });

    // Listen for the appinstalled event
    window.addEventListener('appinstalled', () => {
      console.log('[PWA] App installed successfully');
      this.isInstalled = true;
      this.hideInstallButton();
      this.showInstallSuccess();
    });

    // Check if app is already installed
    if (window.matchMedia('(display-mode: standalone)').matches || 
        window.navigator.standalone === true) {
      this.isInstalled = true;
      this.hideInstallButton();
    }
  }

  setupOfflineIndicator() {
    // Listen for online/offline events
    window.addEventListener('online', () => {
      this.isOnline = true;
      this.updateOfflineBadge();
      this.showOnlineMessage();
    });

    window.addEventListener('offline', () => {
      this.isOnline = false;
      this.updateOfflineBadge();
      this.showOfflineMessage();
    });

    // Initial status
    this.updateOfflineBadge();
  }

  async setupServiceWorker() {
    if ('serviceWorker' in navigator) {
      try {
        const registration = await navigator.serviceWorker.register('./service-worker.js');
        console.log('[PWA] Service worker registered:', registration);
        
        // Listen for service worker updates
        registration.addEventListener('updatefound', () => {
          const newWorker = registration.installing;
          newWorker.addEventListener('statechange', () => {
            if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
              this.showUpdateAvailable();
            }
          });
        });
        
      } catch (error) {
        console.error('[PWA] Service worker registration failed:', error);
      }
    }
  }

  addInstallButton() {
    const header = document.querySelector('.site-header .container');
    if (header) {
      const installBtn = document.createElement('button');
      installBtn.id = 'pwa-install-btn';
      installBtn.className = 'pwa-install-btn';
      installBtn.innerHTML = '📱 Install App';
      installBtn.style.cssText = `
        display: none;
        background: linear-gradient(180deg, var(--brand), var(--brand-600));
        color: #061b1f;
        border: 1px solid var(--brand-700);
        border-radius: 12px;
        padding: 10px 16px;
        font-weight: 700;
        font-size: 0.9rem;
        cursor: pointer;
        box-shadow: 0 4px 12px rgba(8,145,178,.25);
        transition: all 0.2s ease;
      `;
      
      installBtn.addEventListener('click', () => this.installApp());
      installBtn.addEventListener('mouseenter', () => {
        installBtn.style.filter = 'brightness(1.1)';
      });
      installBtn.addEventListener('mouseleave', () => {
        installBtn.style.filter = 'none';
      });
      
      header.appendChild(installBtn);
    }
  }

  addOfflineBadge() {
    const header = document.querySelector('.site-header .container');
    if (header) {
      const offlineBadge = document.createElement('div');
      offlineBadge.id = 'offline-badge';
      offlineBadge.className = 'offline-badge';
      offlineBadge.innerHTML = '📡 Offline';
      offlineBadge.style.cssText = `
        display: none;
        background: #ef4444;
        color: white;
        padding: 6px 12px;
        border-radius: 20px;
        font-size: 0.8rem;
        font-weight: 600;
        margin-left: 12px;
        animation: pulse 2s infinite;
      `;
      
      // Add pulse animation
      const style = document.createElement('style');
      style.textContent = `
        @keyframes pulse {
          0% { opacity: 1; }
          50% { opacity: 0.7; }
          100% { opacity: 1; }
        }
      `;
      document.head.appendChild(style);
      
      header.appendChild(offlineBadge);
    }
  }

  showInstallButton() {
    const installBtn = document.getElementById('pwa-install-btn');
    if (installBtn && !this.isInstalled) {
      installBtn.style.display = 'inline-flex';
      installBtn.style.alignItems = 'center';
      installBtn.style.gap = '8px';
    }
  }

  hideInstallButton() {
    const installBtn = document.getElementById('pwa-install-btn');
    if (installBtn) {
      installBtn.style.display = 'none';
    }
  }

  updateOfflineBadge() {
    const offlineBadge = document.getElementById('offline-badge');
    if (offlineBadge) {
      if (!this.isOnline) {
        offlineBadge.style.display = 'inline-flex';
        offlineBadge.style.alignItems = 'center';
        offlineBadge.style.gap = '6px';
        offlineBadge.innerHTML = '📡 Offline';
      } else {
        offlineBadge.style.display = 'none';
      }
    }
  }

  async installApp() {
    if (!this.deferredPrompt) {
      alert('App installation is not available on this device.');
      return;
    }

    const installBtn = document.getElementById('pwa-install-btn');
    if (installBtn) {
      installBtn.textContent = '⏳ Installing...';
      installBtn.disabled = true;
    }

    try {
      // Show the install prompt
      this.deferredPrompt.prompt();
      
      // Wait for the user to respond to the prompt
      const { outcome } = await this.deferredPrompt.userChoice;
      
      console.log('[PWA] Install prompt outcome:', outcome);
      
      if (outcome === 'accepted') {
        console.log('[PWA] User accepted the install prompt');
      } else {
        console.log('[PWA] User dismissed the install prompt');
      }
      
      // Clear the deferred prompt
      this.deferredPrompt = null;
      
    } catch (error) {
      console.error('[PWA] Install prompt failed:', error);
      alert('Failed to install app. Please try again.');
    } finally {
      if (installBtn) {
        installBtn.textContent = '📱 Install App';
        installBtn.disabled = false;
      }
    }
  }

  showInstallSuccess() {
    this.showToast('🎉 App installed successfully! You can now access Texas Resource Hub from your home screen.', 'success');
  }

  showUpdateAvailable() {
    this.showToast('🔄 App update available! Refresh to get the latest features.', 'info');
  }

  showOnlineMessage() {
    this.showToast('🌐 Back online! All features are now available.', 'success');
  }

  showOfflineMessage() {
    this.showToast('📡 You\'re offline, but cached resources are still available.', 'warning');
  }

  showToast(message, type = 'info') {
    // Remove existing toast
    const existingToast = document.getElementById('pwa-toast');
    if (existingToast) {
      existingToast.remove();
    }

    const toast = document.createElement('div');
    toast.id = 'pwa-toast';
    toast.textContent = message;
    
    const colors = {
      success: '#10b981',
      warning: '#f59e0b',
      error: '#ef4444',
      info: '#3b82f6'
    };
    
    toast.style.cssText = `
      position: fixed;
      top: 20px;
      right: 20px;
      background: ${colors[type] || colors.info};
      color: white;
      padding: 16px 20px;
      border-radius: 12px;
      font-weight: 600;
      font-size: 0.9rem;
      z-index: 1000;
      box-shadow: 0 8px 24px rgba(0,0,0,.2);
      transform: translateX(100%);
      transition: transform 0.3s ease;
      max-width: 300px;
    `;
    
    document.body.appendChild(toast);
    
    // Animate in
    setTimeout(() => {
      toast.style.transform = 'translateX(0)';
    }, 100);
    
    // Auto remove after 4 seconds
    setTimeout(() => {
      toast.style.transform = 'translateX(100%)';
      setTimeout(() => {
        if (toast.parentNode) {
          toast.remove();
        }
      }, 300);
    }, 4000);
  }

  // Public method to check installation status
  isAppInstalled() {
    return this.isInstalled;
  }

  // Public method to check online status
  isAppOnline() {
    return this.isOnline;
  }
}

// Initialize PWA installer when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
  window.pwaInstaller = new PWAInstaller();
});

// Export for use in other scripts
window.PWAInstaller = PWAInstaller;
