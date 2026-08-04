// ============================================
// Dashboard Page - Leaf Lens
// ============================================

class Dashboard {
    constructor() {
        this.user = null;
        this.scans = [];
        this.init();
    }

    init() {
        this.checkAuth();
        this.loadUserData();
        this.setupEventListeners();
        this.startRealTimeUpdates();
    }

    checkAuth() {
        const token = localStorage.getItem('leafLensToken') || sessionStorage.getItem('leafLensToken');
        
        if (!token) {
            // Redirect to login if not authenticated
            window.location.href = 'login.html';
            return;
        }
        
        // Get user data
        const userData = localStorage.getItem('leafLensUser') || sessionStorage.getItem('leafLensUser');
        if (userData) {
            this.user = JSON.parse(userData);
            this.updateWelcomeMessage();
        }
    }

    updateWelcomeMessage() {
        const title = document.querySelector('.dashboard-title');
        if (title && this.user) {
            const firstName = this.user.name.split(' ')[0];
            title.innerHTML = `Welcome back, ${firstName} 👋`;
        }
    }

    loadUserData() {
        // TODO: Fetch real data from API
        this.loadStats();
        this.loadRecentScans();
    }

    loadStats() {
        // Simulate loading stats
        const statValues = document.querySelectorAll('.stat-value');
        if (statValues.length >= 4) {
            // Animate numbers
            this.animateNumber(statValues[0], 0, 42, 1500);
            this.animateNumber(statValues[1], 0, 35, 1500);
            this.animateNumber(statValues[2], 0, 7, 1500);
            // statValues[3] is 98.4% - keep as is
        }
    }

    animateNumber(element, start, end, duration) {
        if (!element) return;
        
        const range = end - start;
        const startTime = performance.now();
        
        const updateNumber = (currentTime) => {
            const elapsed = currentTime - startTime;
            const progress = Math.min(elapsed / duration, 1);
            const eased = this.easeOutCubic(progress);
            const current = Math.round(start + (range * eased));
            
            element.textContent = current;
            
            if (progress < 1) {
                requestAnimationFrame(updateNumber);
            } else {
                element.textContent = end;
            }
        };
        
        requestAnimationFrame(updateNumber);
    }

    easeOutCubic(t) {
        return 1 - Math.pow(1 - t, 3);
    }

    loadRecentScans() {
        // TODO: Fetch real scans from API
        const scanData = [
            {
                id: 1,
                plant: 'Tomato Plant',
                status: 'healthy',
                date: '2 hours ago',
                image: 'https://via.placeholder.com/300x200/4ade80/166534?text=Tomato+Leaf'
            },
            {
                id: 2,
                plant: 'Apple Tree',
                status: 'diseased',
                disease: 'Scab',
                date: '5 hours ago',
                image: 'https://via.placeholder.com/300x200/fca5a5/7f1d1d?text=Diseased+Leaf'
            },
            {
                id: 3,
                plant: 'Rose Bush',
                status: 'healthy',
                date: '1 day ago',
                image: 'https://via.placeholder.com/300x200/93c5fd/1e3a8a?text=Healthy+Leaf'
            }
        ];
        
        this.renderScans(scanData);
    }

    renderScans(scans) {
        const grid = document.querySelector('.scans-grid');
        if (!grid) return;
        
        grid.innerHTML = scans.map(scan => `
            <div class="scan-card" data-id="${scan.id}">
                <img src="${scan.image}" alt="${scan.plant}" loading="lazy">
                <div class="scan-info">
                    <h4>${scan.plant}</h4>
                    <span class="scan-status ${scan.status === 'healthy' ? 'healthy' : 'diseased'}">
                        ${scan.status === 'healthy' ? '✅ Healthy' : `⚠️ ${scan.disease || 'Diseased'}`}
                    </span>
                    <span class="scan-date"><i class="far fa-clock"></i> ${scan.date}</span>
                </div>
            </div>
        `).join('');
    }

    setupEventListeners() {
        // New scan button
        const scanBtn = document.querySelector('.btn-scan');
        if (scanBtn) {
            scanBtn.addEventListener('click', () => {
                // TODO: Open scan modal or navigate to scan page
                alert('Scan feature coming in Part 4!');
            });
        }

        // Quick action buttons
        const actionCards = document.querySelectorAll('.action-card');
        actionCards.forEach(card => {
            card.addEventListener('click', () => {
                const action = card.querySelector('span')?.textContent;
                alert(`${action} feature coming soon!`);
            });
        });

        // View all scans
        const viewAll = document.querySelector('.view-all');
        if (viewAll) {
            viewAll.addEventListener('click', (e) => {
                e.preventDefault();
                // TODO: Navigate to full history page
                alert('Full history coming in Part 8!');
            });
        }

        // Logout
        const logoutBtn = document.querySelector('.btn-nav-logout');
        if (logoutBtn) {
            logoutBtn.addEventListener('click', (e) => {
                e.preventDefault();
                if (confirm('Are you sure you want to logout?')) {
                    localStorage.removeItem('leafLensToken');
                    localStorage.removeItem('leafLensUser');
                    sessionStorage.removeItem('leafLensToken');
                    sessionStorage.removeItem('leafLensUser');
                    window.location.href = '../index.html';
                }
            });
        }
    }

    startRealTimeUpdates() {
        // Simulate real-time updates
        setInterval(() => {
            // In production, this would check for new scans
            console.log('Checking for updates...');
        }, 30000); // Check every 30 seconds
    }
}

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    if (document.querySelector('.dashboard-main')) {
        new Dashboard();
    }
});