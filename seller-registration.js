class SellerRegistration {
    constructor() {
        this.form = document.getElementById('sellerRegistrationForm');
        this.initializeForm();
    }

    initializeForm() {
        this.form.addEventListener('submit', this.handleSubmit.bind(this));
        this.setupValidation();
        this.setupFileUploadPreviews();
    }

    setupValidation() {
        // Real-time validation for required fields
        const requiredFields = this.form.querySelectorAll('[required]');
        requiredFields.forEach(field => {
            field.addEventListener('blur', this.validateField.bind(this));
        });

        // Business type dependent fields
        const businessType = document.getElementById('businessType');
        businessType.addEventListener('change', this.handleBusinessTypeChange.bind(this));
    }

    setupFileUploadPreviews() {
        const fileInputs = this.form.querySelectorAll('input[type="file"]');
        fileInputs.forEach(input => {
            input.addEventListener('change', this.handleFileUpload.bind(this));
        });
    }

    validateField(event) {
        const field = event.target;
        const value = field.value.trim();
        
        // Remove existing error messages
        this.clearFieldError(field);

        if (field.hasAttribute('required') && !value) {
            this.showFieldError(field, 'This field is required');
            return false;
        }

        // Specific field validations
        switch(field.type) {
            case 'email':
                if (value && !this.isValidEmail(value)) {
                    this.showFieldError(field, 'Please enter a valid email address');
                    return false;
                }
                break;
            case 'tel':
                if (value && !this.isValidPhone(value)) {
                    this.showFieldError(field, 'Please enter a valid phone number');
                    return false;
                }
                break;
            case 'url':
                if (value && !this.isValidUrl(value)) {
                    this.showFieldError(field, 'Please enter a valid URL');
                    return false;
                }
                break;
        }

        return true;
    }

    handleBusinessTypeChange(event) {
        const businessType = event.target.value;
        const companyRegField = document.getElementById('companyRegNumber');
        const companyRegCert = document.getElementById('companyRegCert');
        
        if (businessType === 'company' || businessType === 'close_corporation') {
            companyRegField.setAttribute('required', '');
            companyRegCert.setAttribute('required', '');
        } else {
            companyRegField.removeAttribute('required');
            companyRegCert.removeAttribute('required');
        }
    }

    handleFileUpload(event) {
        const file = event.target.files[0];
        const maxSize = 5 * 1024 * 1024; // 5MB
        
        if (file && file.size > maxSize) {
            this.showFieldError(event.target, 'File size must be less than 5MB');
            event.target.value = '';
            return;
        }

        // Show file preview for images
        if (file && file.type.startsWith('image/')) {
            this.showImagePreview(event.target, file);
        }
    }

    showImagePreview(input, file) {
        const reader = new FileReader();
        reader.onload = function(e) {
            // Remove existing preview
            const existingPreview = input.parentNode.querySelector('.file-preview');
            if (existingPreview) {
                existingPreview.remove();
            }

            // Create new preview
            const preview = document.createElement('div');
            preview.className = 'file-preview';
            preview.innerHTML = `
                <img src="${e.target.result}" alt="Preview" style="max-width: 100px; max-height: 100px; margin-top: 10px;">
                <p>${file.name}</p>
            `;
            input.parentNode.appendChild(preview);
        };
        reader.readAsDataURL(file);
    }

    async handleSubmit(event) {
        event.preventDefault();
        
        if (!this.validateForm()) {
            return;
        }

        const formData = new FormData(this.form);
        
        // Add product categories and shipping options as arrays
        const productCategories = Array.from(this.form.querySelectorAll('input[name="productCategories"]:checked'))
            .map(cb => cb.value);
        const shippingOptions = Array.from(this.form.querySelectorAll('input[name="shippingOptions"]:checked'))
            .map(cb => cb.value);
            
        formData.delete('productCategories');
        formData.delete('shippingOptions');
        formData.append('productCategories', JSON.stringify(productCategories));
        formData.append('shippingOptions', JSON.stringify(shippingOptions));

        try {
            this.showLoadingState();
            
            const response = await fetch('https://api-dev-ateam.duckdns.org/scm/api/shweb/seller/register', {
                method: 'POST',
                headers: {
                    'authkey': 'fb13b7fb-943b-47b4-8202-ebfe523a2cc2'
                },
                body: formData,
                credentials: 'include'
            });

            const result = await response.json();

            if (response.ok && result.success) {
                this.showSuccessMessage('Registration submitted successfully! We will review your application and contact you within 2-3 business days.');
                this.form.reset();
            } else {
                this.showErrorMessage(result.message || 'Registration failed. Please try again.');
            }
        } catch (error) {
            this.showErrorMessage('Network error. Please check your connection and try again.');
        } finally {
            this.hideLoadingState();
        }
    }

    validateForm() {
        let isValid = true;
        const requiredFields = this.form.querySelectorAll('[required]');
        
        requiredFields.forEach(field => {
            if (!this.validateField({ target: field })) {
                isValid = false;
            }
        });

        // Check if at least one product category is selected
        const productCategories = this.form.querySelectorAll('input[name="productCategories"]:checked');
        if (productCategories.length === 0) {
            this.showErrorMessage('Please select at least one product category');
            isValid = false;
        }

        // Check if at least one shipping option is selected
        const shippingOptions = this.form.querySelectorAll('input[name="shippingOptions"]:checked');
        if (shippingOptions.length === 0) {
            this.showErrorMessage('Please select at least one shipping/delivery option');
            isValid = false;
        }

        return isValid;
    }

    showFieldError(field, message) {
        field.classList.add('error');
        const errorDiv = document.createElement('div');
        errorDiv.className = 'field-error';
        errorDiv.textContent = message;
        field.parentNode.appendChild(errorDiv);
    }

    clearFieldError(field) {
        field.classList.remove('error');
        const errorDiv = field.parentNode.querySelector('.field-error');
        if (errorDiv) {
            errorDiv.remove();
        }
    }

    showLoadingState() {
        const submitBtn = this.form.querySelector('button[type="submit"]');
        submitBtn.disabled = true;
        submitBtn.textContent = 'Submitting...';
    }

    hideLoadingState() {
        const submitBtn = this.form.querySelector('button[type="submit"]');
        submitBtn.disabled = false;
        submitBtn.textContent = 'Submit Registration';
    }

    showSuccessMessage(message) {
        this.showMessage(message, 'success');
    }

    showErrorMessage(message) {
        this.showMessage(message, 'error');
    }

    showMessage(message, type) {
        // Remove existing messages
        const existingMessage = document.querySelector('.form-message');
        if (existingMessage) {
            existingMessage.remove();
        }

        const messageDiv = document.createElement('div');
        messageDiv.className = `form-message ${type}`;
        messageDiv.textContent = message;
        
        this.form.insertBefore(messageDiv, this.form.firstChild);
        
        // Scroll to top
        this.form.scrollIntoView({ behavior: 'smooth' });
        
        // Auto-hide success messages after 5 seconds
        if (type === 'success') {
            setTimeout(() => {
                if (messageDiv.parentNode) {
                    messageDiv.remove();
                }
            }, 5000);
        }
    }

    isValidEmail(email) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(email);
    }

    isValidPhone(phone) {
        const phoneRegex = /^[\+]?[\d\s\-\(\)]{10,}$/;
        return phoneRegex.test(phone);
    }

    isValidUrl(url) {
        try {
            new URL(url);
            return true;
        } catch {
            return false;
        }
    }
}

// Initialize the seller registration form
document.addEventListener('DOMContentLoaded', () => {
    new SellerRegistration();
});
