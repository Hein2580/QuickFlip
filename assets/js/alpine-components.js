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

    // Always add mobile navigation functions to global scope
    window.addMobileNavigation = addMobileNavigation;
    window.removeMobileNavigation = removeMobileNavigation;
    
    // Force add mobile navigation for debugging (always show on mobile)
    setTimeout(() => {
        console.log('🔧 Checking screen width:', window.innerWidth);
        console.log('🔧 Current page:', window.location.pathname);
        
        // Only show mobile navigation on buyer.html, not on login page (index.html)
        const isLoginPage = window.location.pathname.includes('index.html') || 
                           window.location.pathname === '/' || 
                           window.location.pathname.endsWith('/');
        
        if (isLoginPage) {
            console.log('🚫 Login page detected, skipping mobile navigation');
            return;
        }
        
        if (window.innerWidth <= 768) {
            console.log('📱 Mobile detected, adding navigation...');
            addMobileNavigation();
        } else {
            console.log('💻 Desktop detected, no mobile nav needed');
        }
        
        // DEBUG: Force show on desktop for testing (remove this later)
        if (window.location.search.includes('debug=mobile')) {
            console.log('🐛 DEBUG MODE: Forcing mobile navigation on desktop');
            addMobileNavigation();
        }
    }, 500);

    // Handle window resize
    window.addEventListener('resize', () => {
        console.log('🔄 Window resized to:', window.innerWidth);
        
        // Only show mobile navigation on buyer.html, not on login page (index.html)
        const isLoginPage = window.location.pathname.includes('index.html') || 
                           window.location.pathname === '/' || 
                           window.location.pathname.endsWith('/');
        
        if (isLoginPage) {
            console.log('🚫 Login page detected, skipping mobile navigation on resize');
            return;
        }
        
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

    // Additional safety check - don't add on login page
    const isLoginPage = window.location.pathname.includes('index.html') || 
                       window.location.pathname === '/' || 
                       window.location.pathname.endsWith('/');
    
    if (isLoginPage) {
        console.log('🚫 Safety check: Login page detected, aborting mobile navigation');
        return;
    }

    console.log('🔧 Adding mobile navigation...');

    // Add hamburger button with simple click handler
    const hamburgerBtn = document.createElement('button');
    hamburgerBtn.className = 'hamburger-btn';
    hamburgerBtn.innerHTML = '☰';
    hamburgerBtn.style.cssText = `
        position: fixed;
        top: 1rem;
        right: 1rem;
        z-index: 1000;
        background: #3b82f6;
        color: white;
        border: none;
        border-radius: 50%;
        width: 50px;
        height: 50px;
        font-size: 1.2rem;
        cursor: pointer;
        box-shadow: 0 2px 10px rgba(0,0,0,0.2);
        display: flex !important;
        align-items: center;
        justify-content: center;
    `;
    
    // Simple click handler without Alpine.js complexity
    hamburgerBtn.onclick = function() {
        const menu = document.querySelector('.slide-menu');
        const overlay = document.querySelector('.slide-menu-overlay');
        if (menu && overlay) {
            menu.style.display = 'block';
            overlay.style.display = 'block';
            setTimeout(() => {
                menu.style.transform = 'translateX(0)';
                overlay.style.opacity = '1';
            }, 10);
        }
    };
    
    document.body.appendChild(hamburgerBtn);

    // Add slide menu overlay
    const slideMenuOverlay = document.createElement('div');
    slideMenuOverlay.className = 'slide-menu-overlay';
    slideMenuOverlay.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: rgba(0, 0, 0, 0.5);
        z-index: 1100;
        opacity: 0;
        visibility: hidden;
        transition: all 0.3s;
        display: none;
    `;
    
    slideMenuOverlay.onclick = function() {
        const menu = document.querySelector('.slide-menu');
        menu.style.transform = 'translateX(100%)';
        slideMenuOverlay.style.opacity = '0';
        setTimeout(() => {
            menu.style.display = 'none';
            slideMenuOverlay.style.display = 'none';
        }, 300);
    };
    
    document.body.appendChild(slideMenuOverlay);

    // Add slide menu
    const slideMenu = document.createElement('div');
    slideMenu.className = 'slide-menu';
    slideMenu.style.cssText = `
        position: fixed;
        top: 0;
        right: 0;
        width: 280px;
        height: 100%;
        background: white;
        z-index: 1200;
        transform: translateX(100%);
        transition: transform 0.3s;
        overflow-y: auto;
        padding: 1rem 0;
        display: none;
    `;
    slideMenu.innerHTML = `
        <!-- User Profile Section -->
        <div class="user-profile" style="padding: 1.5rem 1rem; border-bottom: 1px solid #e0e0e0; text-align: center;">
            <div class="user-avatar-menu" style="width: 60px; height: 60px; background: #3b82f6; border-radius: 50%; display: flex; align-items: center; justify-content: center; color: white; font-weight: bold; font-size: 1.5rem; margin: 0 auto 1rem auto;">U</div>
            <div class="user-name" style="font-weight: 600; color: #333; margin-bottom: 0.25rem;">Demo User</div>
            <div class="user-role" style="color: #666; font-size: 0.9rem;">Buyer</div>
        </div>

        <!-- Navigation Items -->
        <div class="menu-section" style="border-bottom: 1px solid #e0e0e0; padding: 0.5rem 0;">
            <a href="#" class="menu-item" onclick="navigateToTab('dashboard'); closeMobileMenu();" style="display: flex; align-items: center; padding: 1rem 1.5rem; text-decoration: none; color: #333; transition: background-color 0.2s;">
                <span class="menu-icon" style="font-size: 1.2rem; margin-right: 1rem; width: 20px; text-align: center;">📊</span>
                <span class="menu-label" style="flex: 1; font-weight: 500;">Dashboard</span>
            </a>
            <a href="#" class="menu-item" onclick="navigateToTab('subscription'); closeMobileMenu();" style="display: flex; align-items: center; padding: 1rem 1.5rem; text-decoration: none; color: #333; transition: background-color 0.2s;">
                <span class="menu-icon" style="font-size: 1.2rem; margin-right: 1rem; width: 20px; text-align: center;">📋</span>
                <span class="menu-label" style="flex: 1; font-weight: 500;">Subscription</span>
            </a>
            <a href="#" class="menu-item" onclick="navigateToTab('invoices'); closeMobileMenu();" style="display: flex; align-items: center; padding: 1rem 1.5rem; text-decoration: none; color: #333; transition: background-color 0.2s;">
                <span class="menu-icon" style="font-size: 1.2rem; margin-right: 1rem; width: 20px; text-align: center;">🧾</span>
                <span class="menu-label" style="flex: 1; font-weight: 500;">Invoices</span>
            </a>
            <a href="#" class="menu-item" onclick="navigateToTab('repayment'); closeMobileMenu();" style="display: flex; align-items: center; padding: 1rem 1.5rem; text-decoration: none; color: #333; transition: background-color 0.2s;">
                <span class="menu-icon" style="font-size: 1.2rem; margin-right: 1rem; width: 20px; text-align: center;">💰</span>
                <span class="menu-label" style="flex: 1; font-weight: 500;">Repayment</span>
            </a>
            <a href="#" class="menu-item" onclick="navigateToTab('notifications'); closeMobileMenu();" style="display: flex; align-items: center; padding: 1rem 1.5rem; text-decoration: none; color: #333; transition: background-color 0.2s;">
                <span class="menu-icon" style="font-size: 1.2rem; margin-right: 1rem; width: 20px; text-align: center;">🔔</span>
                <span class="menu-label" style="flex: 1; font-weight: 500;">Notifications</span>
            </a>
            <a href="#" class="menu-item" onclick="navigateToTab('profile'); closeMobileMenu();" style="display: flex; align-items: center; padding: 1rem 1.5rem; text-decoration: none; color: #333; transition: background-color 0.2s;">
                <span class="menu-icon" style="font-size: 1.2rem; margin-right: 1rem; width: 20px; text-align: center;">👤</span>
                <span class="menu-label" style="flex: 1; font-weight: 500;">Profile</span>
            </a>
            <a href="#" class="menu-item" onclick="navigateToTab('wallet'); closeMobileMenu();" style="display: flex; align-items: center; padding: 1rem 1.5rem; text-decoration: none; color: #333; transition: background-color 0.2s;">
                <span class="menu-icon" style="font-size: 1.2rem; margin-right: 1rem; width: 20px; text-align: center;">💳</span>
                <span class="menu-label" style="flex: 1; font-weight: 500;">Wallet</span>
            </a>
        </div>

        <!-- Account Actions -->
        <div class="menu-section" style="padding: 0.5rem 0;">
            <button onclick="logout(); closeMobileMenu();" style="display: flex; align-items: center; padding: 1rem 1.5rem; color: #dc2626; background: #fee2e2; margin: 0.5rem; border-radius: 8px; border: none; width: calc(100% - 1rem); cursor: pointer;">
                <span class="menu-icon" style="font-size: 1.2rem; margin-right: 1rem; width: 20px; text-align: center;">🚪</span>
                <span class="menu-label" style="flex: 1; font-weight: 500;">Logout</span>
            </button>
        </div>
    `;
    
    document.body.appendChild(slideMenu);

    // Add hover effects
    const menuItems = slideMenu.querySelectorAll('.menu-item');
    menuItems.forEach(item => {
        item.addEventListener('mouseenter', function() {
            this.style.backgroundColor = '#f5f5f5';
        });
        item.addEventListener('mouseleave', function() {
            this.style.backgroundColor = '';
        });
    });

    console.log('✅ Mobile navigation added successfully');
}

// Global function to close mobile menu
window.closeMobileMenu = function() {
    const menu = document.querySelector('.slide-menu');
    const overlay = document.querySelector('.slide-menu-overlay');
    if (menu && overlay) {
        menu.style.transform = 'translateX(100%)';
        overlay.style.opacity = '0';
        setTimeout(() => {
            menu.style.display = 'none';
            overlay.style.display = 'none';
        }, 300);
    }
};

// Global logout function
window.logout = function() {
    if (confirm('Are you sure you want to logout?')) {
        localStorage.removeItem('quickflip_loggedIn');
        localStorage.removeItem('quickflip_user');
        window.location.href = 'index.html';
    }
};

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

// Global navigation handler
window.navigateToTab = function(tab) {
    console.log('🔄 Navigating to tab:', tab);
    
    // Simple approach: just set the hash and let the existing hash handler deal with it
    window.location.hash = tab;
    
    // Also try to find and call the dashboard's setActiveTab directly
    try {
        const dashboardElement = document.querySelector('[x-data*="buyerDashboard"]');
        if (dashboardElement && dashboardElement._x_dataStack && dashboardElement._x_dataStack[0]) {
            const dashboardData = dashboardElement._x_dataStack[0];
            if (dashboardData.setActiveTab) {
                dashboardData.setActiveTab(tab);
                console.log('✅ Successfully called setActiveTab');
            }
        }
    } catch (error) {
        console.log('⚠️ Could not call setActiveTab directly, using hash fallback');
    }
};

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
