/**
 * Alpine.js Components for QuickFlip Buyer Dashboard
 * Reusable components for the application
 */

// Modal Component HTML Template
window.modalTemplate = `
<div x-data="{ show: $store.ui.modal.show }"
     x-show="$store.ui.modal.show"
     x-transition.opacity.duration.300ms
     style="display: none;"
     class="modal-overlay">
    <div class="modal-container" @click.away="$store.ui.cancelModal()">
        <div class="modal-header">
            <h3 x-text="$store.ui.modal.title"></h3>
        </div>
        <div class="modal-body">
            <p x-text="$store.ui.modal.message" style="white-space: pre-line;"></p>
        </div>
        <div class="modal-footer">
            <button type="button"
                    x-show="$store.ui.modal.type === 'confirm'"
                    @click="$store.ui.cancelModal()"
                    style="background: #666; color: white;">
                Cancel
            </button>
            <button type="button"
                    @click="$store.ui.confirmModal()"
                    style="background: #3b82f6; color: white;">
                <span x-text="$store.ui.modal.type === 'confirm' ? 'OK' : 'OK'"></span>
            </button>
        </div>
    </div>
</div>
`;

// Navigation Component
window.navigationComponent = function() {
    return {
        showMenu: false,

        init() {
            this.setupKeyboardNavigation();
        },

        setupKeyboardNavigation() {
            document.addEventListener('keydown', (e) => {
                if (e.key === 'Escape' && this.showMenu) {
                    this.closeMenu();
                }
            });
        },

        openMenu() {
            this.showMenu = true;
            document.body.style.overflow = 'hidden';
        },

        closeMenu() {
            this.showMenu = false;
            document.body.style.overflow = '';
        },

        toggleDarkMode() {
            this.$store.ui.toggleDarkMode();
        },

        async logout() {
            const confirmed = await this.$store.ui.showConfirm('Are you sure you want to logout?', 'Logout');
            if (confirmed) {
                this.$store.auth.logout();
            }
        },

        get userInitials() {
            const user = this.$store.auth.currentUser;
            if (!user?.name) return 'U';
            return user.name.split(' ').map(n => n[0]).join('');
        },

        get darkModeIcon() {
            return this.$store.ui.darkMode ? '☀️' : '🌙';
        },

        get darkModeLabel() {
            return this.$store.ui.darkMode ? 'Light Mode' : 'Dark Mode';
        }
    }
};

// Dashboard Component
window.dashboardComponent = () => ({
    chartData: [],

    init() {
        this.loadChartData();
        this.drawChart();
        // Update chart every 30 seconds
        setInterval(() => {
            this.drawChart();
        }, 30000);
    },

    loadChartData() {
        this.chartData = this.$store.dashboard.chartData;
    },

    drawChart() {
        const canvas = document.querySelector('[x-ref="paymentChart"]');
        if (!canvas) return;

        const ctx = canvas.getContext('2d');
        const width = canvas.width;
        const height = canvas.height;

        // Clear canvas
        ctx.clearRect(0, 0, width, height);

        if (this.chartData.length === 0) return;

        // Set up drawing parameters
        const padding = 40;
        const chartWidth = width - (padding * 2);
        const chartHeight = height - (padding * 2);

        const maxAmount = Math.max(...this.chartData.map(d => d.amount));
        const minAmount = Math.min(...this.chartData.map(d => d.amount));

        // Draw axes
        ctx.strokeStyle = '#e2e8f0';
        ctx.lineWidth = 1;

        // Y-axis
        ctx.beginPath();
        ctx.moveTo(padding, padding);
        ctx.lineTo(padding, height - padding);
        ctx.stroke();

        // X-axis
        ctx.beginPath();
        ctx.moveTo(padding, height - padding);
        ctx.lineTo(width - padding, height - padding);
        ctx.stroke();

        // Draw chart line
        ctx.strokeStyle = '#3b82f6';
        ctx.lineWidth = 3;
        ctx.beginPath();

        this.chartData.forEach((data, index) => {
            const x = padding + (index / (this.chartData.length - 1)) * chartWidth;
            const y = height - padding - ((data.amount - minAmount) / (maxAmount - minAmount)) * chartHeight;

            if (index === 0) ctx.moveTo(x, y);
            else ctx.lineTo(x, y);

            // Draw points
            ctx.fillStyle = '#3b82f6';
            ctx.beginPath();
            ctx.arc(x, y, 4, 0, Math.PI * 2);
            ctx.fill();
        });

        ctx.stroke();

        // Draw labels
        ctx.fillStyle = '#64748b';
        ctx.font = '12px Inter, sans-serif';
        ctx.textAlign = 'center';

        // X-axis labels (months)
        this.chartData.forEach((data, index) => {
            const x = padding + (index / (this.chartData.length - 1)) * chartWidth;
            ctx.fillText(data.month, x, height - padding + 20);
        });

        // Y-axis labels (amounts)
        ctx.textAlign = 'right';
        const ySteps = 5;
        for (let i = 0; i <= ySteps; i++) {
            const amount = minAmount + (i / ySteps) * (maxAmount - minAmount);
            const y = height - padding - (i / ySteps) * chartHeight;
            ctx.fillText('$' + Math.round(amount), padding - 10, y + 4);
        }
    },

    get stats() {
        return this.$store.dashboard.stats;
    }
});

// Subscription Component
window.subscriptionComponent = () => ({
    showPlanOptions: false,

    init() {
        console.log('Subscription component initializing...');

        // Simple initialization
        this.showPlanOptions = true;

        // Ensure stores are initialized
        this.initializeData();
    },

    initializeData() {
        try {
            // Ensure subscription store is initialized
            if (!this.$store.subscription) {
                console.error('Subscription store not found!');
                return;
            }

            // Load plans if not loaded
            if (this.subscriptionPlans.length === 0) {
                this.$store.subscription.loadPlans();
            }
        } catch (error) {
            console.error('Error initializing subscription component:', error);
        }
    },

    get subscriptionPlans() {
        try {
            // Ensure subscription store exists and is initialized
            if (!this.$store.subscription || !this.$store.subscription.plans) {
                console.warn('Subscription store not ready yet');
                return [];
            }
            return this.$store.subscription.plans;
        } catch (e) {
            console.error('Error getting subscription plans:', e);
            return [];
        }
    },

    get currentSubscription() {
        try {
            // Ensure subscription store exists and is initialized
            if (!this.$store.subscription) {
                console.warn('Subscription store not ready yet');
                return null;
            }
            return this.$store.subscription.currentPlan || null;
        } catch (e) {
            console.error('Error getting current subscription:', e);
            return null;
        }
    },

    get selectedPlan() {
        try {
            // Ensure subscription store exists and is initialized
            if (!this.$store.subscription) {
                console.warn('Subscription store not ready yet');
                return null;
            }
            return this.$store.subscription.selectedPlan || null;
        } catch (e) {
            console.error('Error getting selected plan:', e);
            return null;
        }
    },

    checkProfileApproval() {
        try {
            // Ensure profile store exists and is initialized
            if (!this.$store.profile || !this.$store.profile.data) {
                console.warn('Profile store not ready yet');
                return false;
            }
            const profile = this.$store.profile.data;
            return Object.keys(profile).length > 0 && profile.approved !== false;
        } catch (e) {
            console.error('Error checking profile approval:', e);
            return false;
        }
    },

    get profileApproved() {
        return this.checkProfileApproval();
    },

    selectPlan(plan) {
        this.$store.subscription.selectPlan(plan);
    },

    subscribeToPlan() {
        const result = this.$store.subscription.subscribeToPlan();
        if (result.success) {
            this.showMessage(result.message);
            this.showPlanOptions = false;
        }
        return result;
    },

    upgradePlan(plan) {
        const result = this.$store.subscription.upgradePlan(plan);
        if (result.success) {
            this.showMessage(result.message);
            this.showPlanOptions = false;
        }
        return result;
    },

    cancelSubscription() {
        const result = this.$store.subscription.cancelSubscription();
        if (result.success) {
            this.showMessage(result.message);
        }
        return result;
    },

    showMessage(message) {
        // This will be handled by the main component
        if (window.showMessage) {
            window.showMessage(message);
        }
    },

    get currentSubscription() {
        return this.$store.subscription.currentPlan;
    },

    get subscriptionPlans() {
        return this.$store.subscription.plans;
    },

    get selectedPlan() {
        return this.$store.subscription.selectedPlan;
    },

    get profileApproved() {
        return this.checkProfileApproval();
    }
});

// Invoice Component
window.invoiceComponent = () => ({
    showValidation: false,
    validationStatus: 'approved',
    validationNotes: '',

    validateInvoice(invoice) {
        this.$store.invoices.selectedInvoice = invoice;
        this.showValidation = true;
    },

    submitValidation() {
        const result = this.$store.invoices.validateInvoice(
            this.$store.invoices.selectedInvoice,
            this.validationStatus,
            this.validationNotes
        );

        if (result.success) {
            this.showMessage(result.message);
            this.showValidation = false;
            this.validationNotes = '';
        }

        return result;
    },

    viewDiscountOffers(invoice) {
        this.showMessage(`Viewing discount offers for ${invoice.number}`);
        // In a real app, this would open a detailed view
    },

    showMessage(message) {
        if (window.showMessage) {
            window.showMessage(message);
        }
    },

    get invoices() {
        return this.$store.invoices.filteredList;
    },

    get selectedInvoice() {
        return this.$store.invoices.selectedInvoice;
    }
});

// Repayment Component
window.repaymentComponent = () => ({
    makeRepayment(repayment) {
        const result = this.$store.repayments.makePayment(repayment.id);
        if (result.success) {
            this.showMessage(result.message);
            this.addNotification(`Payment made to ${repayment.institute} for invoice ${repayment.invoiceNumber}`);
        }
        return result;
    },

    showMessage(message) {
        if (window.showMessage) {
            window.showMessage(message);
        }
    },

    addNotification(message) {
        this.$store.notifications.addNotification({
            title: 'Payment Processed',
            message: message,
            type: 'payment'
        });
    },

    get repayments() {
        return this.$store.repayments.list;
    }
});

// Notification Component
window.notificationComponent = () => ({
    markAsRead(notificationId) {
        this.$store.notifications.markAsRead(notificationId);
    },

    markAllAsRead() {
        const result = this.$store.notifications.markAllAsRead();
        if (result.success) {
            this.showMessage(result.message);
        }
        return result;
    },

    generateDemoNotification() {
        const messages = [
            'New invoice received from TechCorp',
            'Discount offer expired for invoice INV-2024-005',
            'Payment processed successfully',
            'Profile verification completed',
            'New discount offer available from QuickPay',
            'Invoice INV-2024-006 has been validated'
        ];

        const titles = [
            'New Invoice Received',
            'Discount Offer Expired',
            'Payment Processed',
            'Profile Updated',
            'New Discount Offer',
            'Invoice Validated'
        ];

        const randomIndex = Math.floor(Math.random() * messages.length);
        const notification = this.$store.notifications.addNotification({
            title: titles[randomIndex],
            message: messages[randomIndex],
            type: 'demo'
        });

        this.showMessage('Demo notification added');
        return notification;
    },

    showMessage(message) {
        if (window.showMessage) {
            window.showMessage(message);
        }
    },

    get notifications() {
        return this.$store.notifications.list;
    },

    get unreadCount() {
        return this.$store.notifications.unreadCount;
    }
});

// Profile Component
window.profileComponent = () => ({
    isEditing: false,
    editForm: {},

    init() {
        this.loadProfile();
    },

    loadProfile() {
        this.editForm = { ...this.$store.profile.data };
    },

    startEdit() {
        this.isEditing = true;
        this.loadProfile();
    },

    cancelEdit() {
        this.isEditing = false;
    },

    saveProfile() {
        const result = this.$store.profile.updateProfile(this.editForm);
        if (result.success) {
            this.showMessage(result.message);
            this.isEditing = false;
        }
        return result;
    },

    showMessage(message) {
        if (window.showMessage) {
            window.showMessage(message);
        }
    },

    get profile() {
        return this.$store.profile.data;
    }
});

// Wallet Component
window.walletComponent = () => ({
    showAddMoneyForm: false,
    showTransactionHistory: false,
    showWithdrawForm: false,
    addMoneyAmount: '',
    withdrawAmount: '',
    paymentMethod: '',

    init() {
        this.loadWalletData();
    },

    loadWalletData() {
        // Data is loaded by the store
    },

    startKYC() {
        this.showMessage('KYC verification initiated. You will be contacted by Airwallex.');
        setTimeout(() => {
            this.$store.wallet.completeKYC();
            this.showMessage('Demo: KYC verification completed!');
        }, 2000);
    },

    addMoney() {
        if (!this.addMoneyAmount || !this.paymentMethod) {
            this.showMessage('Please enter amount and select payment method');
            return;
        }

        const result = this.$store.wallet.addMoney(this.addMoneyAmount, this.paymentMethod);
        if (result.success) {
            this.showMessage(result.message);
            this.showAddMoneyForm = false;
            this.addMoneyAmount = '';
            this.paymentMethod = '';
        }
        return result;
    },

    withdrawMoney() {
        if (!this.withdrawAmount || !this.paymentMethod) {
            this.showMessage('Please enter amount and select payment method');
            return;
        }

        const result = this.$store.wallet.withdraw(this.withdrawAmount, this.paymentMethod);
        if (result.success) {
            this.showMessage(result.message);
            this.showWithdrawForm = false;
            this.withdrawAmount = '';
            this.paymentMethod = '';
        } else {
            this.showMessage(result.message);
        }
        return result;
    },

    showMessage(message) {
        if (window.showMessage) {
            window.showMessage(message);
        }
    },

    get balance() {
        return this.$store.wallet.balance;
    },

    get kycCompleted() {
        return this.$store.wallet.kycCompleted;
    },

    get transactionHistory() {
        return this.$store.wallet.transactionHistory;
    }
});

// Inject modal into DOM when Alpine is ready
document.addEventListener('alpine:init', () => {
    // Add modal to body
    const modalContainer = document.createElement('div');
    modalContainer.innerHTML = window.modalTemplate;
    document.body.appendChild(modalContainer.firstElementChild);

    // Add mobile navigation styles if not already present
    if (!document.querySelector('#mobile-nav-styles')) {
        const style = document.createElement('style');
        style.id = 'mobile-nav-styles';
        style.textContent = `
            .demo-accounts {
                background: #f8fafc;
                padding: 1.5rem;
                border-radius: 8px;
                margin: 1rem 0;
                border-left: 4px solid #3b82f6;
            }

            .demo-accounts h4 {
                margin: 0 0 0.5rem 0;
                color: #1e293b;
                font-size: 1rem;
            }

            .demo-accounts p {
                margin: 0.25rem 0;
                color: #64748b;
                font-size: 0.9rem;
            }
        `;
        document.head.appendChild(style);
    }

    // Add mobile navigation HTML if on mobile
    if (window.innerWidth <= 768) {
        addMobileNavigation();
    }

    // Handle window resize
    window.addEventListener('resize', () => {
        if (window.innerWidth <= 768) {
            addMobileNavigation();
        } else {
            removeMobileNavigation();
        }
    });
});

function addMobileNavigation() {
    // Don't add if already exists
    if (document.querySelector('.hamburger-btn')) return;

    const currentPage = getCurrentPage();

    // Add hamburger button
    const hamburgerBtn = document.createElement('button');
    hamburgerBtn.className = 'hamburger-btn';
    hamburgerBtn.innerHTML = '☰';
    hamburgerBtn.setAttribute('x-data', '{}');
    hamburgerBtn.setAttribute('@click', '$refs.navComponent.openMenu()');
    document.body.appendChild(hamburgerBtn);

    // Add FAB for quick actions
    const fab = document.createElement('a');
    fab.className = 'fab';
    fab.href = '#';
    fab.title = 'Quick Actions';
    fab.innerHTML = '⚡';
    fab.setAttribute('@click', 'showQuickActions = !showQuickActions');
    document.body.appendChild(fab);

    // Add slide menu overlay
    const slideMenuOverlay = document.createElement('div');
    slideMenuOverlay.setAttribute('x-data', '{}');
    slideMenuOverlay.setAttribute('x-show', '$refs.navComponent && $refs.navComponent.showMenu');
    slideMenuOverlay.setAttribute('x-transition.opacity.duration.300ms');
    slideMenuOverlay.setAttribute('@click', '$refs.navComponent.closeMenu()');
    slideMenuOverlay.className = 'slide-menu-overlay';
    slideMenuOverlay.style.display = 'none';
    document.body.appendChild(slideMenuOverlay);

    const slideMenu = document.createElement('div');
    slideMenu.setAttribute('x-data', 'navigationComponent()');
    slideMenu.setAttribute('x-ref', 'navComponent');
    slideMenu.setAttribute('x-init', 'init()');
    slideMenu.setAttribute('x-show', 'showMenu');
    slideMenu.setAttribute('x-transition:enter', 'transition ease-out duration-300');
    slideMenu.setAttribute('x-transition:enter-start', 'transform translate-x-full');
    slideMenu.setAttribute('x-transition:enter-end', 'transform translate-x-0');
    slideMenu.setAttribute('x-transition:leave', 'transition ease-in duration-300');
    slideMenu.setAttribute('x-transition:leave-start', 'transform translate-x-0');
    slideMenu.setAttribute('x-transition:leave-end', 'transform translate-x-full');
    slideMenu.className = 'slide-menu';
    slideMenu.style.display = 'none';
    slideMenu.innerHTML = `
        <!-- User Profile Section -->
        <div class="user-profile">
            <div class="user-avatar-menu" x-text="userInitials"></div>
            <div class="user-name" x-text="$store.auth.currentUser?.name || 'Unknown User'"></div>
            <div class="user-role" x-text="$store.auth.currentUser?.role || 'Unknown Role'"></div>
        </div>

        <!-- Navigation Items -->
        <div class="menu-section">
            <a href="#" class="menu-item" @click="closeMenu(); setActiveTab('dashboard')">
                <span class="menu-icon">📊</span>
                <span class="menu-label">Dashboard</span>
            </a>
            <a href="#" class="menu-item" @click="closeMenu(); setActiveTab('subscription')">
                <span class="menu-icon">📋</span>
                <span class="menu-label">Subscription</span>
            </a>
            <a href="#" class="menu-item" @click="closeMenu(); setActiveTab('invoices')">
                <span class="menu-icon">🧾</span>
                <span class="menu-label">Invoices</span>
            </a>
            <a href="#" class="menu-item" @click="closeMenu(); setActiveTab('repayment')">
                <span class="menu-icon">💰</span>
                <span class="menu-label">Repayment</span>
            </a>
            <a href="#" class="menu-item" @click="closeMenu(); setActiveTab('notifications')">
                <span class="menu-icon">🔔</span>
                <span class="menu-label">Notifications</span>
                <span x-show="$store.notifications.unreadCount > 0" class="badge" x-text="$store.notifications.unreadCount"></span>
            </a>
            <a href="#" class="menu-item" @click="closeMenu(); setActiveTab('profile')">
                <span class="menu-icon">👤</span>
                <span class="menu-label">Profile</span>
            </a>
            <a href="#" class="menu-item" @click="closeMenu(); setActiveTab('wallet')">
                <span class="menu-icon">💳</span>
                <span class="menu-label">Wallet</span>
            </a>
        </div>

        <!-- Settings & Options -->
        <div class="menu-section">
            <button class="menu-item" @click="toggleDarkMode(); closeMenu()">
                <span class="menu-icon" x-text="darkModeIcon"></span>
                <span class="menu-label" x-text="darkModeLabel"></span>
            </button>
        </div>

        <!-- Account Actions -->
        <div class="menu-section">
            <button class="menu-item" @click="logout(); closeMenu()" style="color: #dc2626; background: #fee2e2; margin: 0.5rem; border-radius: 8px; border: none;">
                <span class="menu-icon">🚪</span>
                <span class="menu-label">Logout</span>
            </button>
        </div>
    `;
    document.body.appendChild(slideMenu);
}

function removeMobileNavigation() {
    document.querySelector('.hamburger-btn')?.remove();
    document.querySelector('.fab')?.remove();
    document.querySelector('.bottom-nav')?.remove();
    document.querySelector('.slide-menu-overlay')?.remove();
    document.querySelector('.slide-menu')?.remove();
}

function getCurrentPage() {
    const path = window.location.hash || '#dashboard';
    return path.substring(1);
}

// Global message handler
window.showMessage = function(message) {
    // Create a simple toast notification
    const toast = document.createElement('div');
    toast.className = 'success-message';
    toast.textContent = message;
    toast.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        background: #ecfdf5;
        color: #065f46;
        padding: 1rem 1.5rem;
        border-radius: 8px;
        border-left: 4px solid #10b981;
        box-shadow: 0 4px 12px rgba(0,0,0,0.15);
        z-index: 10001;
        animation: slideIn 0.3s ease;
    `;

    document.body.appendChild(toast);

    setTimeout(() => {
        toast.style.animation = 'slideOut 0.3s ease';
        setTimeout(() => {
            document.body.removeChild(toast);
        }, 300);
    }, 3000);
};

// Add toast animations
const style = document.createElement('style');
style.textContent = `
    @keyframes slideIn {
        from { transform: translateX(100%); opacity: 0; }
        to { transform: translateX(0); opacity: 1; }
    }

    @keyframes slideOut {
        from { transform: translateX(0); opacity: 1; }
        to { transform: translateX(100%); opacity: 0; }
    }
`;
document.head.appendChild(style);
