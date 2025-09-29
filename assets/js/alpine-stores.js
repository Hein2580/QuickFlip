/**
 * Alpine.js Stores for QuickFlip Buyer Dashboard
 * Centralized state management for all application data
 */

// Initialize Alpine.js stores
document.addEventListener('alpine:init', () => {

    // Authentication Store
    Alpine.store('auth', {
        isLoggedIn: false,
        currentUser: null,
        isLoading: false,

        init() {
            this.isLoggedIn = localStorage.getItem('quickflip_loggedIn') === 'true';
            this.currentUser = JSON.parse(localStorage.getItem('quickflip_user') || 'null');
        },

        async login(username, password) {
            this.isLoading = true;
            
            try {
                // Validate inputs
                if (!username || !password) {
                    return {
                        success: false,
                        message: 'Please enter both email/username and password'
                    };
                }

                // API call to real authentication endpoint with timeout
                const controller = new AbortController();
                const timeoutId = setTimeout(() => controller.abort(), 30000); // 30 second timeout
                
                // Direct API call - CORS needs to be handled on server side or with browser extensions
                const apiUrl = 'https://api-dev-ateam.duckdns.org/scm/api/shweb/auth/user/login';
                
                // Try direct API call first (will fail due to CORS but we'll catch it)
                let response;
                let data;
                
                try {
                    // Attempt direct API call
                    response = await fetch(apiUrl, {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                            'authkey': 'fb13b7fb-943b-47b4-8202-ebfe523a2cc2'
                        },
                        body: JSON.stringify({
                            user_name: username.trim(),
                            pwd: password
                        }),
                        signal: controller.signal
                    });
                    
                    data = await response.json();
                    
                } catch (corsError) {
                    // CORS error - use proxy service to make the actual API call
                    console.log('Direct API call failed due to CORS, trying proxy...');
                    
                    try {
                        // Use a public CORS proxy service
                        const proxyUrl = 'https://cors-anywhere.herokuapp.com/' + apiUrl;
                        
                        response = await fetch(proxyUrl, {
                            method: 'POST',
                            headers: {
                                'Content-Type': 'application/json',
                                'authkey': 'fb13b7fb-943b-47b4-8202-ebfe523a2cc2',
                                'X-Requested-With': 'XMLHttpRequest'
                            },
                            body: JSON.stringify({
                                user_name: username.trim(),
                                pwd: password
                            }),
                            signal: controller.signal
                        });
                        
                        data = await response.json();
                        
                    } catch (proxyError) {
                        // If proxy also fails, try JSONP approach
                        console.log('Proxy failed, trying JSONP approach...');
                        
                        try {
                            // Create script tag for JSONP
                            data = await new Promise((resolve, reject) => {
                                const callbackName = 'quickflip_' + Date.now();
                                const script = document.createElement('script');
                                
                                window[callbackName] = (result) => {
                                    resolve(result);
                                    document.head.removeChild(script);
                                    delete window[callbackName];
                                };
                                
                                script.onerror = () => {
                                    reject(new Error('JSONP failed'));
                                    document.head.removeChild(script);
                                    delete window[callbackName];
                                };
                                
                                const params = new URLSearchParams({
                                    user_name: username.trim(),
                                    pwd: password,
                                    authkey: 'fb13b7fb-943b-47b4-8202-ebfe523a2cc2',
                                    callback: callbackName
                                });
                                
                                script.src = `${apiUrl}?${params.toString()}`;
                                document.head.appendChild(script);
                                
                                setTimeout(() => {
                                    if (window[callbackName]) {
                                        reject(new Error('JSONP timeout'));
                                        document.head.removeChild(script);
                                        delete window[callbackName];
                                    }
                                }, 10000);
                            });
                            
                            response = { ok: true };
                            
                        } catch (jsonpError) {
                            throw new Error('All API access methods failed. Please ensure the API supports CORS or JSONP.');
                        }
                    }
                }
                
                clearTimeout(timeoutId);

                // Handle different HTTP status codes
                if (!response.ok) {
                    let errorMessage = 'Login failed';
                    
                    switch (response.status) {
                        case 400:
                            errorMessage = 'Invalid request. Please check your credentials.';
                            break;
                        case 401:
                            errorMessage = 'Invalid username or password';
                            break;
                        case 403:
                            errorMessage = 'Access denied. Please contact support.';
                            break;
                        case 404:
                            errorMessage = 'Login service not found';
                            break;
                        case 500:
                            errorMessage = 'Server error. Please try again later.';
                            break;
                        case 503:
                            errorMessage = 'Service temporarily unavailable. Please try again later.';
                            break;
                        default:
                            errorMessage = `Login failed (${response.status}). Please try again.`;
                    }
                    
                    return {
                        success: false,
                        message: errorMessage
                    };
                }

                // Data is already parsed from the try-catch blocks above
                if (!data) {
                    try {
                        data = await response.json();
                    } catch (parseError) {
                        console.error('Failed to parse API response:', parseError);
                        return {
                            success: false,
                            message: 'Invalid response from server. Please try again.'
                        };
                    }
                }

                // Check if login was successful based on API response
                // API returns: { "result": "OK", "cts": "timestamp", "sessionkey": "key" }
                if (data && data.result === 'OK' && data.sessionkey) {
                    // Successful login
                    const user = {
                        username: username.trim(),
                        name: username.trim(), // Use username as display name since API doesn't provide it
                        role: 'Buyer', // Default role
                        loginTime: new Date().toISOString(),
                        sessionkey: data.sessionkey,
                        loginTimestamp: data.cts,
                        email: username.includes('@') ? username.trim() : null,
                        ...data // Include any additional user data from API
                    };

                    this.currentUser = user;
                    this.isLoggedIn = true;

                    localStorage.setItem('quickflip_loggedIn', 'true');
                    localStorage.setItem('quickflip_user', JSON.stringify(user));

                    return { success: true, user };
                } else {
                    // Login failed - extract error message
                    const errorMessage = data.message || 
                                       data.error || 
                                       data.error_message || 
                                       data.msg ||
                                       data.result ||
                                       'Invalid username or password';
                    
                    return { 
                        success: false, 
                        message: errorMessage
                    };
                }
            } catch (error) {
                console.error('Login error:', error);
                
                // Handle different types of network errors
                let errorMessage = 'Network error. Please try again.';
                
                if (error.name === 'TypeError' && error.message.includes('fetch')) {
                    errorMessage = 'Unable to connect to server. Please check your internet connection.';
                } else if (error.name === 'AbortError') {
                    errorMessage = 'Request timed out. Please try again.';
                } else if (error.message) {
                    errorMessage = `Connection error: ${error.message}`;
                }
                
                return { 
                    success: false, 
                    message: errorMessage
                };
            } finally {
                this.isLoading = false;
            }
        },

        logout() {
            this.isLoggedIn = false;
            this.currentUser = null;
            localStorage.removeItem('quickflip_loggedIn');
            localStorage.removeItem('quickflip_user');
            window.location.href = 'index.html';
        },

        get isAdmin() {
            return this.currentUser?.role === 'Admin';
        },

        get isBuyer() {
            return this.currentUser?.role === 'Buyer';
        }
    });

    // UI Store for modal and notification management
    Alpine.store('ui', {
        modal: {
            show: false,
            title: '',
            message: '',
            type: 'alert', // 'alert' or 'confirm'
            resolve: null
        },

        darkMode: false,

        init() {
            this.darkMode = localStorage.getItem('quickflip_darkMode') === 'true';
            this.applyDarkMode();
        },

        toggleDarkMode() {
            this.darkMode = !this.darkMode;
            localStorage.setItem('quickflip_darkMode', this.darkMode.toString());
            this.applyDarkMode();
        },

        applyDarkMode() {
            if (this.darkMode) {
                document.body.classList.add('dark-mode');
            } else {
                document.body.classList.remove('dark-mode');
            }
        },

        showAlert(message, title = 'Alert') {
            return new Promise((resolve) => {
                this.modal = {
                    show: true,
                    title,
                    message,
                    type: 'alert',
                    resolve
                };
            });
        },

        showConfirm(message, title = 'Confirm') {
            return new Promise((resolve) => {
                this.modal = {
                    show: true,
                    title,
                    message,
                    type: 'confirm',
                    resolve
                };
            });
        },

        closeModal(result = false) {
            if (this.modal.resolve) {
                this.modal.resolve(result);
            }
            this.modal.show = false;
            this.modal.resolve = null;
        },

        confirmModal() {
            this.closeModal(true);
        },

        cancelModal() {
            this.closeModal(false);
        }
    });

    // Dashboard Store
    Alpine.store('dashboard', {
        stats: {
            invoicesReceived: 0,
            invoicesSettled: 0,
            amountPaid: 0,
            amountPending: 0
        },

        chartData: [],

        init() {
            this.loadStats();
            this.generateChartData();
        },

        loadStats() {
            // Load from localStorage or use defaults
            const savedStats = JSON.parse(localStorage.getItem('quickflip_stats') || '{}');
            this.stats = {
                invoicesReceived: 24,
                invoicesSettled: 18,
                amountPaid: 45750,
                amountPending: 12300,
                ...savedStats
            };
        },

        updateStats(newStats) {
            this.stats = { ...this.stats, ...newStats };
            localStorage.setItem('quickflip_stats', JSON.stringify(this.stats));
        },

        generateChartData() {
            // Generate sample chart data for payment trends
            this.chartData = [
                { month: 'Jan', amount: 1000 },
                { month: 'Feb', amount: 1500 },
                { month: 'Mar', amount: 1200 },
                { month: 'Apr', amount: 2000 },
                { month: 'May', amount: 2500 },
                { month: 'Jun', amount: 2200 },
                { month: 'Jul', amount: 3000 }
            ];
        },

        get recentActivity() {
            return JSON.parse(localStorage.getItem('quickflip_activity') || '[]').slice(0, 5);
        },

        addActivity(activity) {
            const activities = JSON.parse(localStorage.getItem('quickflip_activity') || '[]');
            activities.unshift({
                id: Date.now(),
                ...activity,
                timestamp: new Date().toISOString()
            });
            localStorage.setItem('quickflip_activity', JSON.stringify(activities.slice(0, 20)));
        }
    });

    // Subscription Store
    Alpine.store('subscription', {
        plans: [],
        currentPlan: null,
        selectedPlan: null,

        init() {
            this.loadPlans();
            this.loadCurrentPlan();
            // Ensure we have a current plan for demo
            if (!this.currentPlan && this.plans.length > 0) {
                this.currentPlan = this.plans[0];
                // Save to localStorage for persistence
                localStorage.setItem('quickflip_currentPlan', JSON.stringify(this.currentPlan));
            }
        },

        loadPlans() {
            // Only load plans if they're not already loaded
            if (this.plans.length === 0) {
                this.plans = [
                    {
                        id: 1,
                        name: 'Monthly Plan',
                        description: 'Perfect for small businesses with monthly invoice processing',
                        price: 49,
                        interval: 'month',
                        features: ['Up to 50 invoices/month', 'Basic analytics', 'Email support', '5% discount rate']
                    },
                    {
                        id: 2,
                        name: 'Yearly Plan',
                        description: 'Best value for growing businesses with annual commitment',
                        price: 490,
                        interval: 'year',
                        features: ['Unlimited invoices', 'Advanced analytics', 'Priority support', '8% discount rate', '2 months free']
                    }
                ];
            }
        },

        loadCurrentPlan() {
            this.currentPlan = JSON.parse(localStorage.getItem('quickflip_currentPlan') || 'null');
            // Set default plan if none exists
            if (!this.currentPlan) {
                this.currentPlan = this.plans[0]; // Set to Monthly Plan by default
                this.saveCurrentPlan(this.currentPlan);
            }
        },

        saveCurrentPlan(plan) {
            this.currentPlan = plan;
            localStorage.setItem('quickflip_currentPlan', JSON.stringify(plan));
        },

        selectPlan(plan) {
            this.selectedPlan = plan;
        },

        subscribeToPlan() {
            if (this.selectedPlan) {
                this.saveCurrentPlan(this.selectedPlan);
                this.selectedPlan = null;
                return { success: true, message: `Successfully subscribed to ${this.selectedPlan.name}!` };
            }
            return { success: false, message: 'No plan selected' };
        },

        upgradePlan(plan) {
            const action = plan.price > this.currentPlan.price ? 'upgraded' : 'downgraded';
            this.saveCurrentPlan(plan);
            return { success: true, message: `Successfully ${action} to ${plan.name}!` };
        },

        cancelSubscription() {
            this.currentPlan = null;
            localStorage.removeItem('quickflip_currentPlan');
            return { success: true, message: 'Subscription cancelled successfully' };
        }
    });

    // Invoice Store
    Alpine.store('invoices', {
        list: [],
        filters: {
            dateFrom: '',
            number: '',
            minAmount: ''
        },
        selectedInvoice: null,

        init() {
            this.loadInvoices();
        },

        loadInvoices() {
            this.list = JSON.parse(localStorage.getItem('quickflip_invoices') || '[]');
            if (this.list.length === 0) {
                this.initializeSampleData();
            }
        },

        initializeSampleData() {
            const sampleInvoices = [
                { id: 1, number: 'INV-2024-001', date: '2024-01-15', seller: 'ABC Corp', amount: 5000, status: 'Pending' },
                { id: 2, number: 'INV-2024-002', date: '2024-01-16', seller: 'XYZ Ltd', amount: 3200, status: 'Validated' },
                { id: 3, number: 'INV-2024-003', date: '2024-01-17', seller: 'DEF Inc', amount: 7500, status: 'Paid' }
            ];
            this.list = sampleInvoices;
            this.saveInvoices();
        },

        saveInvoices() {
            localStorage.setItem('quickflip_invoices', JSON.stringify(this.list));
        },

        get filteredList() {
            return this.list.filter(invoice => {
                if (this.filters.number && !invoice.number.toLowerCase().includes(this.filters.number.toLowerCase())) {
                    return false;
                }
                if (this.filters.minAmount && invoice.amount < parseFloat(this.filters.minAmount)) {
                    return false;
                }
                if (this.filters.dateFrom && invoice.date < this.filters.dateFrom) {
                    return false;
                }
                return true;
            });
        },

        validateInvoice(invoice, status, notes = '') {
            invoice.status = status === 'approved' ? 'Validated' : 'Changes Requested';
            invoice.validationNotes = notes;
            invoice.validatedAt = new Date().toISOString();
            this.saveInvoices();
            return { success: true, message: `Invoice ${invoice.number} ${status === 'approved' ? 'approved' : 'marked for changes'}` };
        },

        getDiscountOffers(invoice) {
            // Mock discount offers from institutes
            return [
                { id: 1, institute: 'FinanceFirst', discountPercent: 7, amount: invoice.amount * 0.93 },
                { id: 2, institute: 'QuickPay', discountPercent: 5, amount: invoice.amount * 0.95 }
            ];
        }
    });

    // Repayment Store
    Alpine.store('repayments', {
        list: [],

        init() {
            this.loadRepayments();
        },

        loadRepayments() {
            this.list = JSON.parse(localStorage.getItem('quickflip_repayments') || '[]');
            if (this.list.length === 0) {
                this.initializeSampleData();
            }
        },

        initializeSampleData() {
            const sampleRepayments = [
                {
                    id: 1,
                    invoiceNumber: 'INV-2024-001',
                    institute: 'FinanceFirst',
                    originalAmount: 5000,
                    payAmount: 4600,
                    dueDate: '2024-02-15',
                    status: 'Pending'
                },
                {
                    id: 2,
                    invoiceNumber: 'INV-2024-002',
                    institute: 'QuickPay',
                    originalAmount: 3200,
                    payAmount: 2944,
                    dueDate: '2024-02-16',
                    status: 'Pending'
                }
            ];
            this.list = sampleRepayments;
            this.saveRepayments();
        },

        saveRepayments() {
            localStorage.setItem('quickflip_repayments', JSON.stringify(this.list));
        },

        makePayment(repaymentId) {
            const repayment = this.list.find(r => r.id === repaymentId);
            if (repayment) {
                repayment.status = 'Paid';
                repayment.paidAt = new Date().toISOString();
                this.saveRepayments();
                return { success: true, message: `Payment of $${repayment.payAmount.toLocaleString()} completed` };
            }
            return { success: false, message: 'Repayment not found' };
        }
    });

    // Notification Store
    Alpine.store('notifications', {
        list: [],

        init() {
            this.loadNotifications();
        },

        loadNotifications() {
            this.list = JSON.parse(localStorage.getItem('quickflip_notifications') || '[]');
            if (this.list.length === 0) {
                this.initializeSampleData();
            }
        },

        initializeSampleData() {
            const sampleNotifications = [
                {
                    id: 1,
                    title: 'New Invoice Received',
                    message: 'ABC Corp sent invoice INV-2024-004 for $2,500',
                    time: '2 hours ago',
                    read: false,
                    type: 'invoice'
                },
                {
                    id: 2,
                    title: 'Discount Offer Available',
                    message: 'FinanceFirst offers 7% discount on invoice INV-2024-003',
                    time: '4 hours ago',
                    read: false,
                    type: 'discount'
                },
                {
                    id: 3,
                    title: 'Payment Processed',
                    message: 'Your payment of $1,200 has been successfully processed',
                    time: '1 day ago',
                    read: false,
                    type: 'payment'
                },
                {
                    id: 4,
                    title: 'Profile Updated',
                    message: 'Your business profile has been successfully updated',
                    time: '2 days ago',
                    read: true,
                    type: 'profile'
                },
                {
                    id: 5,
                    title: 'KYC Verification Complete',
                    message: 'Your KYC verification has been approved by Airwallex',
                    time: '3 days ago',
                    read: true,
                    type: 'kyc'
                }
            ];
            this.list = sampleNotifications;
            this.saveNotifications();
        },

        saveNotifications() {
            localStorage.setItem('quickflip_notifications', JSON.stringify(this.list));
        },

        markAsRead(notificationId) {
            const notification = this.list.find(n => n.id === notificationId);
            if (notification) {
                notification.read = true;
                this.saveNotifications();
            }
        },

        markAllAsRead() {
            this.list.forEach(n => n.read = true);
            this.saveNotifications();
            return { success: true, message: 'All notifications marked as read' };
        },

        addNotification(notification) {
            const newNotification = {
                id: Date.now(),
                time: 'Just now',
                read: false,
                ...notification
            };
            this.list.unshift(newNotification);
            this.saveNotifications();
            return newNotification;
        },

        get unreadCount() {
            return this.list.filter(n => !n.read).length;
        }
    });

    // Profile Store
    Alpine.store('profile', {
        data: {},

        init() {
            console.log('Profile store initializing...');
            this.loadProfile();
            console.log('Profile store initialized with data:', this.data);
        },

        loadProfile() {
            this.data = JSON.parse(localStorage.getItem('quickflip_profile') || '{}');
            console.log('Loaded profile data from localStorage:', this.data);
            if (Object.keys(this.data).length === 0) {
                console.log('No profile data found, initializing sample data...');
                this.initializeSampleData();
            }
        },

        initializeSampleData() {
            this.data = {
                companyName: 'Demo Company Ltd',
                registrationNumber: 'REG123456',
                approved: true,
                industry: 'retail',
                annualRevenue: '1m-10m',
                email: 'demo@company.com',
                phone: '+1234567890',
                address: '123 Business Ave, Commerce City, State 12345',
                approved: true
            };
            this.saveProfile();
        },

        saveProfile() {
            localStorage.setItem('quickflip_profile', JSON.stringify(this.data));
            return { success: true, message: 'Profile saved successfully!' };
        },

        updateProfile(updates) {
            this.data = { ...this.data, ...updates };
            return this.saveProfile();
        }
    });

    // Wallet Store
    Alpine.store('wallet', {
        balance: 0,
        kycCompleted: false,
        transactionHistory: [],

        init() {
            this.loadWalletData();
        },

        loadWalletData() {
            this.balance = parseFloat(localStorage.getItem('quickflip_walletBalance') || '5240');
            this.kycCompleted = localStorage.getItem('quickflip_kycCompleted') === 'true';
            this.transactionHistory = JSON.parse(localStorage.getItem('quickflip_transactions') || '[]');
        },

        saveWalletData() {
            localStorage.setItem('quickflip_walletBalance', this.balance.toString());
            localStorage.setItem('quickflip_kycCompleted', this.kycCompleted.toString());
            localStorage.setItem('quickflip_transactions', JSON.stringify(this.transactionHistory));
        },

        addMoney(amount, method) {
            this.balance += parseFloat(amount);
            const transaction = {
                id: Date.now(),
                type: 'Deposit',
                amount: parseFloat(amount),
                method: method,
                status: 'Completed',
                date: new Date().toISOString()
            };
            this.transactionHistory.unshift(transaction);
            this.saveWalletData();
            return { success: true, message: `Successfully added $${amount} to wallet!` };
        },

        withdraw(amount, method) {
            if (this.balance < parseFloat(amount)) {
                return { success: false, message: 'Insufficient balance' };
            }

            this.balance -= parseFloat(amount);
            const transaction = {
                id: Date.now(),
                type: 'Withdrawal',
                amount: parseFloat(amount),
                method: method,
                status: 'Completed',
                date: new Date().toISOString()
            };
            this.transactionHistory.unshift(transaction);
            this.saveWalletData();
            return { success: true, message: `Successfully withdrew $${amount} from wallet!` };
        },

        completeKYC() {
            this.kycCompleted = true;
            this.saveWalletData();
            return { success: true, message: 'KYC verification completed successfully!' };
        }
    });

    // PWA Store
    Alpine.store('pwa', {
        showInstallBanner: false,
        deferredPrompt: null,

        init() {
            this.setupPWAInstall();
        },

        setupPWAInstall() {
            window.addEventListener('beforeinstallprompt', (e) => {
                e.preventDefault();
                this.deferredPrompt = e;
                this.showInstallBanner = true;
            });
        },

        async installApp() {
            if (!this.deferredPrompt) return;

            this.deferredPrompt.prompt();
            const { outcome } = await this.deferredPrompt.userChoice;

            if (outcome === 'accepted') {
                this.showInstallBanner = false;
            }

            this.deferredPrompt = null;
        }
    });

    // Initialize all stores
    Alpine.store('auth').init();
    Alpine.store('ui').init();
    Alpine.store('dashboard').init();
    Alpine.store('subscription').init();
    Alpine.store('invoices').init();
    Alpine.store('repayments').init();
    Alpine.store('notifications').init();
    Alpine.store('profile').init();
    Alpine.store('wallet').init();
    Alpine.store('pwa').init();
});
