class BusinessIntake {
    constructor() {
        this.form = document.getElementById('businessIntakeForm');
        this.initializeForm();
    }

    initializeForm() {
        // Add any necessary initialization code for the form
    }

    validateForm() {
        // Implement form validation logic
        return true; // Return true if valid, false otherwise
    }

    async handleSubmit(event) {
        event.preventDefault();
        
        if (!this.validateForm()) {
            return;
        }

        const formData = new FormData(this.form);
        
        try {
            this.showLoadingState();
            
            const response = await fetch('https://api-dev-ateam.duckdns.org/scm/api/shweb/business/intake', {
                method: 'POST',
                headers: {
                    'authkey': 'fb13b7fb-943b-47b4-8202-ebfe523a2cc2'
                },
                body: formData,
                credentials: 'include'
            });

            const result = await response.json();

            if (response.ok && result.success) {
                // Update user's business intake status
                const user = JSON.parse(localStorage.getItem('quickflip_user') || '{}');
                user.businessIntakeDone = true;
                localStorage.setItem('quickflip_user', JSON.stringify(user));
                
                this.showSuccessMessage('Business intake completed successfully! Redirecting to subscription selection...');
                
                // Redirect to subscription selection instead of dashboard
                setTimeout(() => {
                    window.location.href = 'subscription-selection.html';
                }, 2000);
            } else {
                this.showErrorMessage(result.message || 'Business intake submission failed. Please try again.');
            }
        } catch (error) {
            this.showErrorMessage('Network error. Please check your connection and try again.');
        } finally {
            this.hideLoadingState();
        }
    }

    showLoadingState() {
        const submitBtn = this.form.querySelector('button[type="submit"]');
        submitBtn.disabled = true;
        submitBtn.textContent = 'Submitting Intake...';
    }

    hideLoadingState() {
        const submitBtn = this.form.querySelector('button[type="submit"]');
        submitBtn.disabled = false;
        submitBtn.textContent = 'Submit Business Intake';
    }

    showSuccessMessage(message) {
        // Implement success message display logic
    }

    showErrorMessage(message) {
        // Implement error message display logic
    }
}

// Initialize the business intake form
document.addEventListener('DOMContentLoaded', () => {
    new BusinessIntake();
});