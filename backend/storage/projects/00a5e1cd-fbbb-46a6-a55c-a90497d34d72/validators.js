// ============================================
// Custom Validators
// ============================================

class Validators {
    // Validate MongoDB ObjectId
    isMongoId(id) {
        const objectIdRegex = /^[0-9a-fA-F]{24}$/;
        return objectIdRegex.test(id);
    }

    // Validate URL
    isValidUrl(string) {
        try {
            new URL(string);
            return true;
        } catch (_) {
            return false;
        }
    }

    // Validate phone number
    isValidPhone(phone) {
        const phoneRegex = /^\+?[\d\s-]{10,15}$/;
        return phoneRegex.test(phone);
    }

    // Validate date format
    isValidDate(date) {
        const d = new Date(date);
        return d instanceof Date && !isNaN(d);
    }

    // Validate enum values
    isInEnum(value, enumArray) {
        return enumArray.includes(value);
    }

    // Sanitize HTML input
    sanitizeHtml(input) {
        // Remove potentially dangerous tags
        const sanitized = input
            .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
            .replace(/<[^>]*>/g, '');
        return sanitized.trim();
    }

    // Validate password strength
    getPasswordStrength(password) {
        let score = 0;
        const checks = {
            length: password.length >= 8,
            uppercase: /[A-Z]/.test(password),
            lowercase: /[a-z]/.test(password),
            number: /[0-9]/.test(password),
            special: /[^A-Za-z0-9]/.test(password)
        };

        score = Object.values(checks).filter(Boolean).length;

        const levels = ['Very Weak', 'Weak', 'Fair', 'Good', 'Strong'];
        return {
            score,
            level: levels[score - 1] || 'Very Weak',
            checks
        };
    }

    // Sanitize object recursively
    sanitizeObject(obj) {
        if (typeof obj !== 'object' || obj === null) return obj;
        
        if (Array.isArray(obj)) {
            return obj.map(item => this.sanitizeObject(item));
        }

        const sanitized = {};
        for (const [key, value] of Object.entries(obj)) {
            if (typeof value === 'string') {
                sanitized[key] = this.sanitizeHtml(value);
            } else if (typeof value === 'object' && value !== null) {
                sanitized[key] = this.sanitizeObject(value);
            } else {
                sanitized[key] = value;
            }
        }
        return sanitized;
    }
}

module.exports = new Validators();