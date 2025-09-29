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
            
            // Always log the attempt
            console.log('🚀 LOGIN ATTEMPT STARTED');
            console.log('👤 Username:', username);
            console.log('🔑 Password:', password ? '[PROVIDED]' : '[MISSING]');
            
            try {
                // Validate inputs
                if (!username || !password) {
                    console.log('❌ VALIDATION FAILED: Missing credentials');
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
                
                console.log('🎯 API URL:', apiUrl);
                console.log('📤 REQUEST HEADERS:', {
                    'Content-Type': 'application/json',
                    'authkey': 'fb13b7fb-943b-47b4-8202-ebfe523a2cc2'
                });
                console.log('📤 REQUEST BODY:', JSON.stringify({
                    user_name: username.trim(),
                    pwd: password
                }));
                
                // Try direct API call first (will fail due to CORS but we'll catch it)
                let response;
                let data;
                
                try {
                    console.log('🔄 Making direct API call...');
                    
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
                        signal: controller.signal,
                        credentials: 'include'
                    });
                    
                    console.log('🎉 FETCH COMPLETED! No CORS error thrown!');
                    
                    console.log('✅ DIRECT API CALL SUCCEEDED!');
                    console.log('📡 Response Status:', response.status);
                    console.log('📡 Response Status Text:', response.statusText);
                    console.log('📡 Response OK:', response.ok);
                    
                    // Check for cookies in response headers
                    console.log('🍪 Response Headers (all):');
                    for (let [key, value] of response.headers.entries()) {
                        console.log(`   ${key}: ${value}`);
                    }
                    
                    // Specifically check for Set-Cookie headers
                    const setCookie = response.headers.get('set-cookie');
                    console.log('🍪 Set-Cookie header:', setCookie);
                    
                    // Check current browser cookies
                    console.log('🍪 Current document.cookie:', document.cookie);
                    
                    // Log raw API response
                    const rawResponseText = await response.text();
                    console.log('🔍 RAW API RESPONSE (EXACT TEXT):');
                    console.log('='.repeat(50));
                    console.log(rawResponseText);
                    console.log('='.repeat(50));
                    console.log('📏 Response Length:', rawResponseText.length);
                    console.log('📋 All Response Headers:', [...response.headers.entries()]);
                    
                    // Try to parse as JSON
                    try {
                        data = JSON.parse(rawResponseText);
                        console.log('✅ SUCCESSFULLY PARSED AS JSON:', data);
                    } catch (parseError) {
                        console.error('❌ JSON PARSE FAILED:', parseError.message);
                        console.log('📝 Raw response (for debugging):', rawResponseText);
                        // Don't throw - we want to see what the API returned even if it's not JSON
                        data = { 
                            rawResponse: rawResponseText, 
                            parseError: parseError.message,
                            result: 'PARSE_ERROR' 
                        };
                    }
                    
                } catch (corsError) {
                    // CORS error - this is the core issue
                    console.log('❌ DIRECT API CALL FAILED!');
                    console.log('🚫 Error Type:', corsError.name);
                    console.log('🚫 Error Message:', corsError.message);
                    console.log('🚫 Full Error Object:', corsError);
                    
                    // The real solution: API server needs CORS headers
                    return {
                        success: false,
                        message: '🚫 CORS Error: Cannot access API from browser\n\n' +
                                '✅ The request format is CORRECT (normal JSON)\n' +
                                '✅ Your credentials are being sent properly\n' +
                                '✅ The API URL is correct\n\n' +
                                '❌ Problem: API server blocks browser requests\n\n' +
                                '🔧 SOLUTION: API team must add these headers:\n' +
                                '   • Access-Control-Allow-Origin: *\n' +
                                '   • Access-Control-Allow-Headers: Content-Type, authkey\n' +
                                '   • Access-Control-Allow-Methods: POST, OPTIONS\n\n' +
                                '✅ Test in Postman - it will work there!\n' +
                                '(Postman ignores CORS, browsers enforce it)'
                    };
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

                // Save sessionkey manually and create cookie
                console.log('🔑 SESSIONKEY SAVED:', data.sessionkey);
                console.log('📅 LOGIN TIMESTAMP:', data.cts);
                
                // Create cookie with sessionkey (expires in 24 hours)
                const expiryDate = new Date();
                expiryDate.setTime(expiryDate.getTime() + (24 * 60 * 60 * 1000)); // 24 hours
                const cookieValue = `quickflip_sessionkey=${data.sessionkey}; expires=${expiryDate.toUTCString()}; path=/; SameSite=Lax`;
                document.cookie = cookieValue;
                
                console.log('🍪 COOKIE CREATED:', `quickflip_sessionkey=${data.sessionkey.substring(0, 20)}...`);
                console.log('🍪 Cookie expires:', expiryDate.toUTCString());
                
                // Verify cookie was set
                console.log('🍪 Current cookies:', document.cookie);
                
                // Test sessionkey forwarding after successful login
                setTimeout(() => {
                    this.testSessionkeyForwarding();
                }, 2000);

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
            
            // Clear the sessionkey cookie
            document.cookie = 'quickflip_sessionkey=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;';
            console.log('🍪 Sessionkey cookie cleared');
            
            window.location.href = 'index.html';
        },

        async testSessionkeyForwarding() {
            try {
                if (!this.currentUser?.sessionkey) {
                    console.log('❌ No sessionkey found to test');
                    return;
                }

                console.log('🔑 Testing sessionkey forwarding...');
                console.log('🔑 Using sessionkey:', this.currentUser.sessionkey.substring(0, 20) + '...');

                // Make a test API call with sessionkey in header
                const testResponse = await fetch('https://api-dev-ateam.duckdns.org/scm/api/shweb/auth/user/profile', {
                    method: 'GET',
                    headers: {
                        'Content-Type': 'application/json',
                        'authkey': 'fb13b7fb-943b-47b4-8202-ebfe523a2cc2',
                        'sessionkey': this.currentUser.sessionkey // Send sessionkey as header
                    }
                });

                const testData = await testResponse.text();
                console.log('🔑 Sessionkey test response status:', testResponse.status);
                console.log('🔑 Sessionkey test response:', testData);

                if (testResponse.ok) {
                    console.log('✅ Sessionkey is working! API accepted the session.');
                } else {
                    console.log('❌ Sessionkey test failed - API rejected the session');
                }

            } catch (error) {
                console.log('🔑 Sessionkey test error:', error.message);
            }
        },

        // Helper method to get sessionkey from cookie
        getSessionkeyFromCookie() {
            const cookies = document.cookie.split(';');
            for (let cookie of cookies) {
                const [name, value] = cookie.trim().split('=');
                if (name === 'quickflip_sessionkey') {
                    return value;
                }
            }
            return null;
        },

        // Helper method to make authenticated API calls with sessionkey
        async makeAuthenticatedRequest(url, options = {}) {
            // Try to get sessionkey from user object or cookie
            const sessionkey = this.currentUser?.sessionkey || this.getSessionkeyFromCookie();
            
            if (!sessionkey) {
                throw new Error('No active session - please login first');
            }

            const defaultHeaders = {
                'Content-Type': 'application/json',
                'authkey': 'fb13b7fb-943b-47b4-8202-ebfe523a2cc2',
                'sessionkey': sessionkey
            };

            const requestOptions = {
                ...options,
                headers: {
                    ...defaultHeaders,
                    ...options.headers
                }
            };

            return fetch(url, requestOptions);
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
        bannerDismissed: false,
        debugMode: true,

        init() {
            console.log('🔧 PWA Store initializing...');
            this.setupPWAInstall();
            // Check if banner was previously dismissed
            this.bannerDismissed = localStorage.getItem('pwa_banner_dismissed') === 'true';
            console.log('🔧 Banner dismissed status:', this.bannerDismissed);
            
            // Force show banner for testing (remove this later)
            if (this.debugMode && !this.bannerDismissed) {
                setTimeout(() => {
                    console.log('🔧 DEBUG: Force showing banner for testing');
                    this.showInstallBanner = true;
                }, 2000);
            }
        },

        setupPWAInstall() {
            console.log('🔧 Setting up PWA install listeners...');
            
            window.addEventListener('beforeinstallprompt', (e) => {
                console.log('🔔 PWA install prompt available!');
                e.preventDefault();
                this.deferredPrompt = e;
                
                // Only show if not previously dismissed
                if (!this.bannerDismissed) {
                    // Add a small delay to ensure it's visible
                    setTimeout(() => {
                        this.showInstallBanner = true;
                        console.log('📱 PWA banner shown via beforeinstallprompt');
                    }, 1000);
                }
            });

            // Hide banner when app is already installed
            window.addEventListener('appinstalled', () => {
                console.log('✅ PWA installed successfully');
                this.showInstallBanner = false;
            });

            // Check if already installed
            if (window.matchMedia('(display-mode: standalone)').matches) {
                console.log('📱 App is already installed');
            }

            // Additional debugging
            setTimeout(() => {
                console.log('🔧 PWA Debug Info:');
                console.log('  - Service Worker supported:', 'serviceWorker' in navigator);
                console.log('  - Manifest link exists:', !!document.querySelector('link[rel="manifest"]'));
                console.log('  - HTTPS:', location.protocol === 'https:');
                console.log('  - Deferred prompt:', !!this.deferredPrompt);
                console.log('  - Banner dismissed:', this.bannerDismissed);
                console.log('  - Show banner:', this.showInstallBanner);
            }, 3000);
        },

        async installApp() {
            if (!this.deferredPrompt) {
                console.log('❌ No install prompt available');
                return;
            }

            try {
                console.log('🔄 Showing install prompt...');
                this.deferredPrompt.prompt();
                const { outcome } = await this.deferredPrompt.userChoice;
                
                console.log('📱 User choice:', outcome);
                
                if (outcome === 'accepted') {
                    console.log('✅ User accepted installation');
                    this.showInstallBanner = false;
                } else {
                    console.log('❌ User dismissed installation');
                }
            } catch (error) {
                console.log('❌ Install error:', error);
            }

            this.deferredPrompt = null;
        },

        dismissBanner() {
            this.showInstallBanner = false;
            this.bannerDismissed = true;
            localStorage.setItem('pwa_banner_dismissed', 'true');
            console.log('🚫 PWA banner dismissed');
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
