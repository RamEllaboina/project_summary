// ============================================
// Register Page - Leaf Lens
// ============================================

class RegisterPage {
    constructor() {
        this.form = document.getElementById('registerForm');
        this.fullname = document.getElementById('fullname');
        this.email = document.getElementById('email');
        this.password = document.getElementById('password');
        this.confirmPassword = document.getElementById('confirmPassword');
        this.termsCheck = document.getElementById('termsCheck');
        
        this.init();
    }

    init() {
        this.setupPasswordToggle();
        this.setupPasswordStrength();
        this.setupFormValidation();
        this.setupSocialSignup();
    }

    setupPasswordToggle() {
        const toggles = document.querySelectorAll('.toggle-password');
        toggles.forEach(toggle => {
            toggle.addEventListener('click', () => {
                const input = toggle.parentElement.querySelector('input');
                const type = input.type === 'password' ? 'text' : 'password';
                input.type = type;
                toggle.querySelector('i').classList.toggle('fa-eye');
                toggle.querySelector('i').classList.toggle('fa-eye-slash');
            });
        });
    }

    setupPasswordStrength() {
        if (!this.password) return;

        this.password.addEventListener('input', () => {
            const strength = this.checkPasswordStrength(this.password.value);
            this.updateStrengthUI(strength);
        });
    }

    checkPasswordStrength(password) {
        let strength = 0;
        
        if (password.length >= 8) strength++;
        if (password.match(/[a-z]/)) strength++;
        if (password.match(/[A-Z]/)) strength++;
        if (password.match(/[0-9]/)) strength++;
        if (password.match(/[^a-zA-Z0-9]/)) strength++;
        
        return strength;
    }

    updateStrengthUI(strength) {
        const bar = document.getElementById('strengthBar');
        const text = document.getElementById('strengthText');
        
        if (!bar || !text) return;
        
        const levels = ['Very Weak', 'Weak', 'Fair', 'Good', 'Strong'];
        const colors = ['#dc2626', '#f59e0b', '#fbbf24', '#22c55e', '#16a34a'];
        
        bar.className = 'strength-bar';
        if (strength > 0) {
            bar.style.width = `${(strength / 5) * 100}%`;
            bar.style.background = colors[strength - 1] || colors[0];
            text.textContent = `Password strength: ${levels[strength - 1]}`;
            text.style.color = colors[strength - 1] || colors[0];
        } else {
            bar.style.width = '0%';
            bar.style.background = 'var(--border)';
            text.textContent = 'Password strength';
            text.style.color = 'var(--text-light)';
        }
    }

    setupFormValidation() {
        if (!this.form) return;

        this.form.addEventListener('submit', async (e) => {
            e.preventDefault();
            
            if (this.validateForm()) {
                await this.handleRegister();
            }
        });

        // Real-time validation
        this.email.addEventListener('blur', () => this.validateEmail());
        this.password.addEventListener('blur', () => this.validatePassword());
        this.confirmPassword.addEventListener('input', () => this.validateConfirmPassword());
    }

    validateForm() {
        const isNameValid = this.validateName();
        const isEmailValid = this.validateEmail();
        const isPasswordValid = this.validatePassword();
        const isConfirmValid = this.validateConfirmPassword();
        const isTermsValid = this.validateTerms();
        
        return isNameValid && isEmailValid && isPasswordValid && isConfirmValid && isTermsValid;
    }

    validateName() {
        const name = this.fullname.value.trim();
        const errorElement = document.getElementById('nameError') || this.createErrorElement(this.fullname, 'nameError');
        
        if (!name) {
            Utils.showError(errorElement, 'Full name is required');
            this.fullname.classList.add('error');
            return false;
        }
        
        if (name.length < 2) {
            Utils.showError(errorElement, 'Name must be at least 2 characters');
            this.fullname.classList.add('error');
            return false;
        }
        
        Utils.showError(errorElement, '');
        this.fullname.classList.remove('error');
        return true;
    }

    validateEmail() {
        const email = this.email.value.trim();
        const errorElement = document.getElementById('emailError') || this.createErrorElement(this.email, 'emailError');
        
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
        const errorElement = document.getElementById('passwordError') || this.createErrorElement(this.password, 'passwordError');
        
        if (!password) {
            Utils.showError(errorElement, 'Password is required');
            this.password.classList.add('error');
            return false;
        }
        
        if (password.length < 8) {
            Utils.showError(errorElement, 'Password must be at least 8 characters');
            this.password.classList.add('error');
            return false;
        }
        
        Utils.showError(errorElement, '');
        this.password.classList.remove('error');
        return true;
    }

    validateConfirmPassword() {
        const password = this.password.value;
        const confirm = this.confirmPassword.value;
        const errorElement = document.getElementById('confirmError') || this.createErrorElement(this.confirmPassword, 'confirmError');
        
        if (!confirm) {
            Utils.showError(errorElement, 'Please confirm your password');
            this.confirmPassword.classList.add('error');
            return false;
        }
        
        if (password !== confirm) {
            Utils.showError(errorElement, 'Passwords do not match');
            this.confirmPassword.classList.add('error');
            return false;
        }
        
        Utils.showError(errorElement, '');
        this.confirmPassword.classList.remove('error');
        return true;
    }

    validateTerms() {
        const errorElement = document.getElementById('termsError') || this.createErrorElement(this.termsCheck, 'termsError');
        
        if (!this.termsCheck.checked) {
            Utils.showError(errorElement, 'You must agree to the Terms of Service');
            return false;
        }
        
        Utils.showError(errorElement, '');
        return true;
    }

    createErrorElement(input, id) {
        const parent = input.closest('.form-group');
        let errorEl = document.getElementById(id);
        
        if (!errorEl) {
            errorEl = document.createElement('span');
            errorEl.className = 'error-message';
            errorEl.id = id;
            parent.appendChild(errorEl);
        }
        
        return errorEl;
    }

async handleRegister() {
    const name = this.fullname.value.trim();
    const email = this.email.value.trim();
    const password = this.password.value;
    
    const submitBtn = this.form.querySelector('.btn-auth');
    const originalText = submitBtn.innerHTML;
    submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Creating account...';
    submitBtn.disabled = true;

    try {
        const response = await fetch('http://localhost:5000/api/auth/register', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ name, email, password })
        });

        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.message || 'Registration failed');
        }

        // Store tokens
        const { accessToken, refreshToken, user } = data.data;
        localStorage.setItem('leafLensToken', accessToken);
        localStorage.setItem('leafLensRefreshToken', refreshToken);
        localStorage.setItem('leafLensUser', JSON.stringify(user));

        // Show success and redirect
        const successMsg = document.createElement('div');
        successMsg.className = 'auth-success';
        successMsg.innerHTML = `
            <i class="fas fa-check-circle"></i>
            Account created successfully! Redirecting to dashboard...
        `;
        this.form.prepend(successMsg);
        
        setTimeout(() => {
            window.location.href = 'dashboard.html';
        }, 2000);
        
    } catch (error) {
        console.error('Registration error:', error);
        const errorMsg = document.createElement('div');
        errorMsg.className = 'auth-error';
        errorMsg.textContent = error.message || 'Registration failed. Please try again.';
        this.form.prepend(errorMsg);
        setTimeout(() => errorMsg.remove(), 3000);
    } finally {
        submitBtn.innerHTML = originalText;
        submitBtn.disabled = false;
    }
}

    simulateRegistration(name, email, password) {
        return new Promise((resolve, reject) => {
            setTimeout(() => {
                if (name && email && password.length >= 8) {
                    // Store for demo
                    localStorage.setItem('leafLensEmail', email);
                    resolve({ success: true });
                } else {
                    reject(new Error('Invalid registration data'));
                }
            }, 1500);
        });
    }

    setupSocialSignup() {
        const googleBtn = document.querySelector('.social-btn.google');
        if (googleBtn) {
            googleBtn.addEventListener('click', () => {
                alert('Google signup will be implemented in Part 2');
            });
        }
    }
}

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    if (document.getElementById('registerForm')) {
        new RegisterPage();
    }
});