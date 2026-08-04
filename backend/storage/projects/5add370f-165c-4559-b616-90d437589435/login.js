// ============================================
// Login Page - Leaf Lens
// ============================================

class LoginPage {
    constructor() {
        this.form = document.getElementById('loginForm');
        this.email = document.getElementById('email');
        this.password = document.getElementById('password');
        this.togglePassword = document.getElementById('togglePassword');
        this.rememberMe = document.getElementById('rememberMe');
        
        this.init();
    }

    init() {
        this.setupPasswordToggle();
        this.setupFormValidation();
        this.setupSocialLogin();
        this.checkRememberMe();
    }

    setupPasswordToggle() {
        if (this.togglePassword) {
            this.togglePassword.addEventListener('click', () => {
                const type = this.password.type === 'password' ? 'text' : 'password';
                this.password.type = type;
                this.togglePassword.querySelector('i').classList.toggle('fa-eye');
                this.togglePassword.querySelector('i').classList.toggle('fa-eye-slash');
            });
        }
    }

    setupFormValidation() {
        if (!this.form) return;

        this.form.addEventListener('submit', async (e) => {
            e.preventDefault();
            
            if (this.validateForm()) {
                await this.handleLogin();
            }
        });

        // Real-time validation
        this.email.addEventListener('blur', () => this.validateEmail());
        this.password.addEventListener('blur', () => this.validatePassword());
    }

    validateForm() {
        const isEmailValid = this.validateEmail();
        const isPasswordValid = this.validatePassword();
        
        return isEmailValid && isPasswordValid;
    }

    validateEmail() {
        const email = this.email.value.trim();
        const errorElement = document.getElementById('emailError');
        
        if (!email) {
            Utils.showError(errorElement, 'Email is required');
            this.email.classList.add('error');
            return false;
        }
        
        if (!Utils.validateEmail(email)) {
            Utils.showError(errorElement, 'Please enter a valid email address');
            this.email.classList.add('error');
            return false;
        }
        
        Utils.showError(errorElement, '');
        this.email.classList.remove('error');
        return true;
    }

    validatePassword() {
        const password = this.password.value;
        const errorElement = document.getElementById('passwordError');
        
        if (!password) {
            Utils.showError(errorElement, 'Password is required');
            this.password.classList.add('error');
            return false;
        }
        
        if (password.length < 6) {
            Utils.showError(errorElement, 'Password must be at least 6 characters');
            this.password.classList.add('error');
            return false;
        }
        
        Utils.showError(errorElement, '');
        this.password.classList.remove('error');
        return true;
    }

// Add this to the handleLogin method
async handleLogin() {
    const email = this.email.value.trim();
    const password = this.password.value;
    
    // Show loading state
    const submitBtn = this.form.querySelector('.btn-auth');
    const originalText = submitBtn.innerHTML;
    submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Signing in...';
    submitBtn.disabled = true;

    try {
        const response = await fetch('http://localhost:5000/api/auth/login', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ email, password })
        });

        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.message || 'Login failed');
        }

        // Store tokens
        const { accessToken, refreshToken, user } = data.data;
        
        if (this.rememberMe.checked) {
            localStorage.setItem('leafLensToken', accessToken);
            localStorage.setItem('leafLensRefreshToken', refreshToken);
            localStorage.setItem('leafLensUser', JSON.stringify(user));
        } else {
            sessionStorage.setItem('leafLensToken', accessToken);
            sessionStorage.setItem('leafLensRefreshToken', refreshToken);
            sessionStorage.setItem('leafLensUser', JSON.stringify(user));
        }

        // Redirect to dashboard
        window.location.href = 'dashboard.html';
        
    } catch (error) {
        console.error('Login error:', error);
        const errorMsg = document.createElement('div');
        errorMsg.className = 'auth-error';
        errorMsg.textContent = error.message || 'Login failed. Please try again.';
        this.form.prepend(errorMsg);
        setTimeout(() => errorMsg.remove(), 3000);
    } finally {
        submitBtn.innerHTML = originalText;
        submitBtn.disabled = false;
    }
}

    simulateLogin(email, password) {
        return new Promise((resolve, reject) => {
            setTimeout(() => {
                if (email && password.length >= 6) {
                    resolve({ success: true });
                } else {
                    reject(new Error('Invalid credentials'));
                }
            }, 1500);
        });
    }

    setupSocialLogin() {
        const googleBtn = document.querySelector('.social-btn.google');
        if (googleBtn) {
            googleBtn.addEventListener('click', () => {
                // TODO: Implement Google OAuth
                alert('Google login will be implemented in Part 2');
            });
        }
    }

    checkRememberMe() {
        const savedEmail = localStorage.getItem('leafLensEmail');
        if (savedEmail && this.email) {
            this.email.value = savedEmail;
            if (this.rememberMe) {
                this.rememberMe.checked = true;
            }
        }
    }
}

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    if (document.getElementById('loginForm')) {
        new LoginPage();
    }
});