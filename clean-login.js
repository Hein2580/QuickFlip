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

                // API call to authentication endpoint
                const controller = new AbortController();
                const timeoutId = setTimeout(() => controller.abort(), 30000);
                
                const apiUrl = 'https://api-dev-ateam.duckdns.org/scm/api/shweb/auth/user/login';
                
                const response = await fetch(apiUrl, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'authkey': 'fb13b7fb-943b-47b4-8202-ebfe523a2cc2'
                    },
                    body: JSON.stringify({
                        user_name: username.trim(),
                        pwd: password
                    }),
                    credentials: 'include', // Include cookies
                    signal: controller.signal
                });
                
                clearTimeout(timeoutId);

                if (!response.ok) {
                    return {
                        success: false,
                        message: 'Login failed. Please check your credentials.'
                    };
                }

                const data = await response.json();

                // Check if login was successful
                if (data && data.result === 'OK' && data.sessionkey) {
                    const user = {
                        username: username.trim(),
                        name: username.trim(),
                        role: data.userType || 'Buyer', // Include user type from API response
                        loginTime: new Date().toISOString(),
                        sessionkey: data.sessionkey,
                        loginTimestamp: data.cts,
                        email: username.includes('@') ? username.trim() : null,
                        sellerId: data.sellerId || null, // Include seller ID if applicable
                        sellerStatus: data.sellerStatus || null, // Include seller approval status
                        businessIntakeDone: false, // Always set to false initially
                        subscriptionActive: false // Always set to false initially
                    };

                    this.currentUser = user;
                    this.isLoggedIn = true;

                    localStorage.setItem('quickflip_loggedIn', 'true');
                    localStorage.setItem('quickflip_user', JSON.stringify(user));

                    // Redirect based on user role
                    if (user.role === 'Seller' && user.sellerStatus === 'pending') {
                        // Redirect to business intake pending page
                        window.location.href = 'business-intake-pending.html';
                    } else if (user.role === 'Seller' && user.sellerStatus === 'approved') {
                        // Redirect to seller dashboard
                        window.location.href = 'seller-dashboard.html';
                    }

                    return { success: true, user };
                } else {
                    return { 
                        success: false, 
                        message: data.message || 'Invalid username or password'
                    };
                }
            } catch (error) {
                return { 
                    success: false, 
                    message: 'Network error. Please try again.'
                };
            } finally {
                this.isLoading = false;
            }
        },
