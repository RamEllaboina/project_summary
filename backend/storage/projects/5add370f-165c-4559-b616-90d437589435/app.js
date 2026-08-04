// ============================================
// Leaf Lens - Main Application
// ============================================

class LeafLensApp {
    constructor() {
        this.initializeApp();
    }

    initializeApp() {
        console.log('🌿 Leaf Lens App Initialized');
        this.checkAuthStatus();
        this.setupEventListeners();
    }

    checkAuthStatus() {
        const token = localStorage.getItem('leafLensToken');
        if (token) {
            // User is logged in
            this.updateUIForLoggedInUser();
        }
    }

    updateUIForLoggedInUser() {
        const loginBtn = document.querySelector('.btn-nav-primary');
        const registerBtn = document.querySelector('.btn-nav-secondary');
        
        if (loginBtn) {
            loginBtn.innerHTML = '<i class="fas fa-user-circle"></i> Dashboard';
            loginBtn.href = 'pages/dashboard.html';
        }
        
        if (registerBtn) {
            registerBtn.innerHTML = '<i class="fas fa-sign-out-alt"></i> Logout';
            registerBtn.href = '#';
            registerBtn.addEventListener('click', (e) => {
                e.preventDefault();
                this.logout();
            });
        }
    }

    logout() {
        localStorage.removeItem('leafLensToken');
        window.location.href = 'index.html';
    }

    setupEventListeners() {
        // Handle any global events here
        document.addEventListener('click', (e) => {
            // Handle dynamic elements
        });
    }
}

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    window.app = new LeafLensApp();
});

// ============================================
// Utility Functions
// ============================================

const Utils = {
    // Validate email format
    validateEmail: (email) => {
        const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return re.test(email);
    },

    // Show error message
    showError: (element, message) => {
        element.textContent = message;
        element.style.display = message ? 'block' : 'none';
    },

    // Show success message
    showSuccess: (element, message) => {
        element.textContent = message;
        element.style.display = message ? 'block' : 'none';
        element.style.color = 'var(--success)';
    },

    // Debounce function for performance
    debounce: (func, wait) => {
        let timeout;
        return function executedFunction(...args) {
            const later = () => {
                clearTimeout(timeout);
                func(...args);
            };
            clearTimeout(timeout);
            timeout = setTimeout(later, wait);
        };
    }
};