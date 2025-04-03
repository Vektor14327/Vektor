class VektorApp {
    constructor() {
        this.token = localStorage.getItem('token');
        this.userData = null;
        this.initDOM();
        this.initEventListeners();
        this.checkAuthStatus();
        // this.apiBaseUrl = 'https://f602-135-181-12-180.ngrok-free.app/api';   //replace with your frontend URL
        this.apiBaseUrl = 'https://vektor-wjh4.onrender.com/api';   //replace with your frontend URL
        this.freeLimitReached = false;
    }

    initDOM() {
        // Auth elements
        this.authSection = document.getElementById('auth-section');
        this.appSection = document.getElementById('app-section');
        this.loginForm = document.getElementById('login-form');
        this.registerForm = document.getElementById('register-form');
        this.showRegister = document.getElementById('show-register');
        this.showLogin = document.getElementById('show-login');

        // App elements
        this.chatLog = document.getElementById('chat-log');
        this.chatInput = document.getElementById('chat-input');
        this.sendBtn = document.getElementById('send-btn');
        this.winsCounter = document.getElementById('wins-counter');
        this.challengeDisplay = document.getElementById('challenge-display');
        this.paywallNotice = document.getElementById('paywall-notice');
        this.upgradeBtn = document.getElementById('upgrade-btn');
        this.userEmail = document.getElementById('user-email');
        this.logoutBtn = document.getElementById('logout-btn');
    }

    initEventListeners() {
        // Auth events
        this.loginForm?.addEventListener('submit', (e) => this.handleLogin(e));
        this.registerForm?.addEventListener('submit', (e) => this.handleRegister(e));
        this.showRegister?.addEventListener('click', (e) => {
            e.preventDefault();
            this.toggleAuthForms('register');
        });
        this.showLogin?.addEventListener('click', (e) => {
            e.preventDefault();
            this.toggleAuthForms('login');
        });

        // Chat events
        this.sendBtn?.addEventListener('click', () => this.sendMessage(this.chatInput.value));
        this.chatInput?.addEventListener('keydown', (e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                this.sendMessage(this.chatInput.value);
            }
        });

        // Paywall event
        this.upgradeBtn?.addEventListener('click', async (e) => {
            e.preventDefault();
            await this.handleUpgrade();
        });

        // Logout event
        this.logoutBtn?.addEventListener('click', () => this.handleLogout());
    }

    async handleUpgrade() {
        const token = localStorage.getItem('token') || this.token;

        if (!token) {
            alert('Not authenticated. Please login first.');
            return;
        }

        try {
            const response = await fetch(`${this.apiBaseUrl}/stripe/create-subscription`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                }
            });

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                throw new Error(errorData.error || 'Payment failed');
            }

            const { url } = await response.json();

            if (url) {
                window.location.href = url; // Redirect to Stripe Checkout
            } else {
                throw new Error('No checkout URL received');
            }
        } catch (err) {
            alert(`Payment failed: ${err.message}`);
        }
    }

    async checkAuthStatus() {
        if (!this.token) {
            this.showAuth();
            return;
        }

        try {
            const response = await this.fetchWithAuth(`${this.apiBaseUrl}/users/me`);
            if (response.ok) {
                const { data } = await response.json();
                this.userData = data;
                this.showApp();
                this.loadInitialChat();

                // Check free limit status on load
                if (this.userData.user.chatCount >= 3 && !this.userData.user.isPaid) {
                    this.showFreeLimitReached();
                }
            } else {
                this.clearAuth();
                this.showAuth();
            }
        } catch (err) {
            this.clearAuth();
            this.showAuth();
        }
    }

    toggleAuthForms(formType) {
        if (formType === 'register') {
            this.loginForm.classList.remove('active');
            this.registerForm.classList.add('active');
        } else {
            this.registerForm.classList.remove('active');
            this.loginForm.classList.add('active');
        }
    }

    async handleLogin(e) {
        e.preventDefault();
        const email = document.getElementById('login-email').value;
        const password = document.getElementById('login-password').value;

        try {
            const response = await fetch(`${this.apiBaseUrl}/auth/login`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, password })
            });

            if (!response.ok) {
                alert('Login failed. Please try again.');
                // const error = await response.json();
                // throw new Error(error.message || 'Login failed');
            }

            const { token } = await response.json();
            this.token = token;
            localStorage.setItem('token', this.token);
            await this.checkAuthStatus();
        } catch (err) {
            alert(err.message || 'Login failed. Please try again.');
        }
    }

    async handleRegister(e) {
        e.preventDefault();
        const email = document.getElementById('register-email')?.value;
        const password = document.getElementById('register-password')?.value;
        const passwordConfirm = document.getElementById('register-confirm')?.value;

        if (!email || !password || !passwordConfirm) {
            alert('Please fill in all fields');
            return;
        }

        if (password !== passwordConfirm) {
            alert('Passwords do not match');
            return;
        }

        if (password.length < 8) {
            alert('Password must be at least 8 characters');
            return;
        }

        try {
            const response = await fetch(`${this.apiBaseUrl}/auth/register`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, password })
            });

            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.message || 'Registration failed');
            }

            const { token } = await response.json();
            this.token = token;
            localStorage.setItem('token', this.token);
            alert('Registration successful!');
            await this.checkAuthStatus();

        } catch (err) {
            alert(err.message || 'Registration failed. Please try again.');
        }
    }

    async sendMessage(message) {
        if (!message.trim()) return;

        // Check if free limit is reached before sending
        if (this.freeLimitReached) {
            this.showFreeLimitReached();
            return;
        }

        try {
            const token = localStorage.getItem('token') || this.token;
            if (!token) throw new Error('Not authenticated. Please login first.');

            // Add user message to chat immediately
            this.addMessage('user', message);
            this.chatInput.value = '';

            const response = await fetch(`${this.apiBaseUrl}/chat`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ message })
            });

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));

                if (response.status === 402) {
                    this.freeLimitReached = true;
                    this.showFreeLimitReached();
                    throw new Error(errorData.message || 'Free limit reached. Please upgrade.');
                }

                throw new Error(errorData.message || `Request failed(${response.status})`);
            }

            const responseData = await response.json();
            this.addMessage('vektor', responseData.data.response);
            this.updateUserData(responseData);

            return responseData;

        } catch (err) {

            // Don't show alert if it's the free limit message (we show the paywall instead)
            if (!err.message.includes('Free limit reached')) {
                alert(err.message || 'Failed to send message. Please try again.');
            }

            throw err;
        }
    }

    updateUserData(data) {
        this.userData = {
            user: {
                ...this.userData?.user || {}, // Handle case where userData might be null
                wins: data.wins || 0, // Default to 0 if wins is undefined
                chatCount: data.chatCount || 0,
                isPaid: data.isPaid || false,
                email: data.email || this.userData?.user?.email || '',
                challengeDay: data.challenge?.day || this.userData?.user?.challengeDay || 1
            },
            challenge: data.challenge || this.userData?.challenge || {
                day: 1,
                title: 'Initial Challenge'
            }
        };

        this.updateUI();
    }

    updateUI() {
        // Safely display wins with a default of 0 if undefined
        this.winsCounter.textContent = `WINS: ${this.userData?.user?.wins ?? 0}`;

        // Safely display challenge info with defaults
        const challengeDay = this.userData?.challenge?.day ?? 1;
        const challengeTitle = this.userData?.challenge?.title ?? 'Initial Challenge';
        this.challengeDisplay.textContent = `DAY ${challengeDay}: ${challengeTitle}`;

        // Safely display email
        this.userEmail.textContent = this.userData?.user?.email || '';

        // Show/hide paywall based on user status
        const chatCount = this.userData?.user?.chatCount ?? 0;
        const isPaid = this.userData?.user?.isPaid ?? false;

        if (chatCount >= 3 && !isPaid) {
            this.showFreeLimitReached();
        } else {
            this.hideFreeLimitReached();
        }
    }

    showFreeLimitReached() {
        this.freeLimitReached = true;
        this.chatInput.disabled = true;
        this.sendBtn.disabled = true;
        this.paywallNotice.style.display = 'flex';

        // Add a message to chat explaining the limit
        const existingMessages = Array.from(this.chatLog.children);
        const lastMessage = existingMessages[existingMessages.length - 1];

        if (!lastMessage || !lastMessage.textContent.includes('free limit')) {
            this.addMessage('vektor', 'You\'ve reached your free limit. Upgrade to continue chatting.');
        }
    }

    hideFreeLimitReached() {
        this.freeLimitReached = false;
        this.chatInput.disabled = false;
        this.sendBtn.disabled = false;
        this.paywallNotice.style.display = 'none';
    }

    addMessage(role, content) {
        const messageDiv = document.createElement('div');
        messageDiv.className = `message ${role}-message`;

        if (role === 'vektor') {
            // For Vektor responses, add "Vektor" header above the message
            const vektorHeader = document.createElement('div');
            vektorHeader.className = 'vektor-message-header';
            vektorHeader.textContent = 'VEKTOR';
            vektorHeader.style.fontWeight = 'bold';
            vektorHeader.style.marginBottom = '4px';
            messageDiv.appendChild(vektorHeader);

            const messageContent = document.createElement('div');
            messageContent.textContent = content;
            messageDiv.appendChild(messageContent);
        } else {
            // For user messages, keep the existing format
            messageDiv.textContent = `${content}`;
        }

        this.chatLog.appendChild(messageDiv);
        this.chatLog.scrollTop = this.chatLog.scrollHeight;
    }

    loadInitialChat() {
        this.addMessage('vektor', 'Vektor online. Report your status.');
    }

    async fetchWithAuth(url, options = {}) {
        const headers = {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${this.token}`,
            ...options.headers
        };

        return fetch(url, {
            ...options,
            headers,
            body: options.body ? JSON.stringify(options.body) : undefined
        });
    }

    showAuth() {
        if (this.authSection) this.authSection.style.display = 'flex';
        if (this.appSection) this.appSection.style.display = 'none';
    }

    showApp() {
        if (this.authSection) this.authSection.style.display = 'none';
        if (this.appSection) this.appSection.style.display = 'block';
        this.updateUI();
    }

    handleLogout() {
        this.clearAuth();
        this.showAuth();
    }

    clearAuth() {
        localStorage.removeItem('token');
        this.token = null;
        this.userData = null;
        this.freeLimitReached = false;
    }

    showAlert(message, type = 'success') {
        const alert = document.createElement('div');
        alert.className = `alert alert-${type}`;
        alert.textContent = message;
        document.body.appendChild(alert);

        setTimeout(() => {
            alert.remove();
        }, 1500);
    }
}

// Initialize app when DOM is fully loaded
document.addEventListener('DOMContentLoaded', () => {
    new VektorApp();
});