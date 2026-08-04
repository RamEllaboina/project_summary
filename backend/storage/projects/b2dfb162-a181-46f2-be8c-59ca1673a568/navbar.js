// ============================================
// Navigation Component
// ============================================

class Navbar {
    constructor() {
        this.hamburger = document.getElementById('hamburger');
        this.navMenu = document.getElementById('navMenu');
        this.navLinks = document.querySelectorAll('.nav-link');
        
        this.init();
    }

    init() {
        this.setupHamburger();
        this.setupActiveLink();
        this.setupScrollEffects();
    }

    setupHamburger() {
        if (!this.hamburger || !this.navMenu) return;

        this.hamburger.addEventListener('click', () => {
            this.hamburger.classList.toggle('active');
            this.navMenu.classList.toggle('active');
        });

        // Close menu on link click (mobile)
        this.navLinks.forEach(link => {
            link.addEventListener('click', () => {
                if (window.innerWidth <= 768) {
                    this.hamburger.classList.remove('active');
                    this.navMenu.classList.remove('active');
                }
            });
        });

        // Close menu on outside click
        document.addEventListener('click', (e) => {
            if (window.innerWidth <= 768) {
                const isNavClick = this.navMenu.contains(e.target) || this.hamburger.contains(e.target);
                if (!isNavClick) {
                    this.hamburger.classList.remove('active');
                    this.navMenu.classList.remove('active');
                }
            }
        });
    }

    setupActiveLink() {
        const currentPath = window.location.pathname;
        
        this.navLinks.forEach(link => {
            const linkPath = link.getAttribute('href');
            if (linkPath && currentPath.includes(linkPath)) {
                link.classList.add('active');
            }
        });
    }

    setupScrollEffects() {
        const navbar = document.querySelector('.navbar');
        let lastScroll = 0;

        window.addEventListener('scroll', () => {
            const currentScroll = window.pageYOffset;
            
            if (currentScroll > 100) {
                navbar.style.boxShadow = '0 4px 20px rgba(0,0,0,0.08)';
            } else {
                navbar.style.boxShadow = 'none';
            }
            
            lastScroll = currentScroll;
        }, { passive: true });
    }
}

// Initialize navbar when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    if (document.querySelector('.navbar')) {
        new Navbar();
    }
});