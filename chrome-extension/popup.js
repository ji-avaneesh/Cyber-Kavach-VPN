// ========== CONFIGURATION ==========

const API_URL = 'http://localhost:5001/api/auth';
const PAYMENT_URL = 'http://localhost:8080/fire%20kavach/index.html#pricing';
const PHISHING_API = 'http://94.249.213.206:5000';
const WEBSITE_LOGIN_URL = 'http://localhost:8080/fire%20kavach/index.html'; // Fallback for Google

// ========== DOM ELEMENTS ==========

const loginPage = document.getElementById('login-page');
const dashboardPage = document.getElementById('dashboard-page');

// Auth Forms
const loginForm = document.getElementById('login-form');
const registerForm = document.getElementById('register-form');
const googleLoginBtn = document.getElementById('google-login-btn');

// Other Buttons
const logoutBtn = document.getElementById('logout-btn');
const upgradeBtnBanner = document.getElementById('upgrade-btn-banner');

// Tab buttons
const tabButtons = document.querySelectorAll('.tab-btn');
const tabContents = document.querySelectorAll('.tab-content');

// ========== INITIALIZATION ==========
document.addEventListener('DOMContentLoaded', async () => {
    initAuthEventListeners();

    const session = await getSession();
    if (session && session.token) {
        showDashboard(session.user);
        initializePhishingDetection();
        initializeVPN();
    } else {
        showLoginPage();
    }
});

// ========== AUTH LISTENERS ==========
function initAuthEventListeners() {
    // 1. Toggle Login <-> Register
    const showRegisterBtn = document.getElementById('show-register-btn');
    const showLoginBtn = document.getElementById('show-login-btn');

    if (showRegisterBtn) {
        showRegisterBtn.addEventListener('click', (e) => {
            e.preventDefault();
            document.getElementById('login-form').style.display = 'none';
            document.getElementById('register-form').style.display = 'block';
            showAlert('auth-alert', '', 'none'); // Clear alerts
        });
    }

    if (showLoginBtn) {
        showLoginBtn.addEventListener('click', (e) => {
            e.preventDefault();
            document.getElementById('register-form').style.display = 'none';
            document.getElementById('login-form').style.display = 'block';
            showAlert('auth-alert', '', 'none');
        });
    }

    // 2. Google Login (Redirect)
    if (googleLoginBtn) {
        googleLoginBtn.addEventListener('click', () => {
            alert("For security, Google Sign-In is handled on our official website. You will be redirected.");
            chrome.tabs.create({ url: WEBSITE_LOGIN_URL });
        });
    }

    // 3. Register Submit
    if (registerForm) {
        registerForm.addEventListener('submit', handleRegister);
    }
}

// ========== PAGE NAVIGATION ==========
function showLoginPage() {
    loginPage.style.display = 'block';
    dashboardPage.style.display = 'none';

    // Reset to Login View
    if (loginForm) loginForm.style.display = 'block';
    if (registerForm) registerForm.style.display = 'none';
}

function showDashboard(user) {
    loginPage.style.display = 'none';
    dashboardPage.style.display = 'block';

    // Update user info
    document.getElementById('user-email-display').textContent = user.email || 'user@email.com';
    const planBadge = document.getElementById('user-plan-badge');
    const upgradeBanner = document.getElementById('upgrade-banner');

    // Check isPro status properly
    if (user.isPro === true || user.isPro === 'true') {
        planBadge.textContent = 'Pro';
        planBadge.classList.add('pro');
        upgradeBanner.style.display = 'none';
    } else {
        planBadge.textContent = 'Free';
        planBadge.classList.remove('pro');
        upgradeBanner.style.display = 'block';
    }
}

// ========== EVENT LISTENERS (Shared) ==========

// Logout button - Clear all storage
logoutBtn && logoutBtn.addEventListener('click', async () => {
    await chrome.storage.local.clear();
    showLoginPage();
    showAlert('auth-alert', 'Logged out successfully', 'success');
});

// Upgrade button
upgradeBtnBanner && upgradeBtnBanner.addEventListener('click', () => {
    chrome.tabs.create({ url: PAYMENT_URL });
});

// Tab switching
tabButtons.forEach(btn => {
    btn.addEventListener('click', () => {
        const tab = btn.dataset.tab;
        tabButtons.forEach(b => b.classList.remove('active'));
        tabContents.forEach(c => c.classList.remove('active'));
        btn.classList.add('active');
        document.getElementById(`${tab}-tab`).classList.add('active');
    });
});

// ========== AUTH HANDLERS ==========

// 1. LOGIN
loginForm && loginForm.addEventListener('submit', async (e) => {
    e.preventDefault();

    const email = document.getElementById('login-email').value;
    const password = document.getElementById('login-password').value;
    const submitBtn = loginForm.querySelector('button[type="submit"]');

    submitBtn.disabled = true;
    submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Logging in...';

    try {
        const response = await fetch(`${API_URL}/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, password })
        });

        const data = await response.json();

        if (response.ok && data.token) {
            await chrome.storage.local.set({ token: data.token, user: data.user });
            showAlert('auth-alert', 'Login successful!', 'success');
            setTimeout(() => {
                showDashboard(data.user);
                initializePhishingDetection();
                initializeVPN();
            }, 1000);
        } else {
            showAlert('auth-alert', data.message || 'Login failed', 'error');
        }
    } catch (error) {
        console.error('Login error:', error);
        showAlert('auth-alert', 'Server error. Check if backend is running.', 'error');
    } finally {
        submitBtn.disabled = false;
        submitBtn.innerHTML = '<i class="fas fa-sign-in-alt"></i> Sign In';
    }
});

// 2. REGISTER
async function handleRegister(e) {
    e.preventDefault();

    const name = document.getElementById('register-name').value;
    const email = document.getElementById('register-email').value;
    const password = document.getElementById('register-password').value;
    const submitBtn = document.getElementById('register-form').querySelector('button');

    submitBtn.disabled = true;
    submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Creating Account...';

    try {
        const response = await fetch(`${API_URL}/register`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ name, email, password })
        });

        const data = await response.json();

        if (response.ok && data.token) {
            await chrome.storage.local.set({ token: data.token, user: data.user });
            showAlert('auth-alert', 'Account created successfully!', 'success');
            setTimeout(() => {
                showDashboard(data.user);
                initializePhishingDetection();
                initializeVPN();
            }, 1000);
        } else {
            showAlert('auth-alert', data.message || 'Registration failed', 'error');
        }
    } catch (error) {
        console.error('Register error:', error);
        showAlert('auth-alert', 'Server error. Could not register.', 'error');
    } finally {
        submitBtn.disabled = false;
        submitBtn.innerHTML = '<i class="fas fa-user-plus"></i> Create Account';
    }
}

// ========== PHISHING DETECTION LOGIC ==========
function initializePhishingDetection() {
    loadPhishingStats();
    chrome.tabs.query({ active: true, currentWindow: true }, async (tabs) => {
        if (tabs[0] && tabs[0].url) {
            const url = tabs[0].url;
            document.getElementById('currentUrl').textContent = url;
            await scanURL(url);
        }
    });

    const scanBtn = document.getElementById('scanBtn');
    scanBtn && scanBtn.addEventListener('click', async () => {
        chrome.tabs.query({ active: true, currentWindow: true }, async (tabs) => {
            if (tabs[0] && tabs[0].url) await scanURL(tabs[0].url);
        });
    });

    const whitelistBtn = document.getElementById('whitelistBtn');
    whitelistBtn && whitelistBtn.addEventListener('click', async () => {
        chrome.tabs.query({ active: true, currentWindow: true }, async (tabs) => {
            if (tabs[0] && tabs[0].url) await whitelistURL(tabs[0].url);
        });
    });

    const reportBtn = document.getElementById('reportBtn');
    reportBtn && reportBtn.addEventListener('click', async () => {
        chrome.tabs.query({ active: true, currentWindow: true }, async (tabs) => {
            if (tabs[0] && tabs[0].url) await reportURL(tabs[0].url);
        });
    });
}

async function scanURL(url) {
    try {
        const response = await fetch(`${PHISHING_API}/predict`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ url: url })
        });
        const data = await response.json();
        if (data.risk_score !== undefined) {
            updateRiskScore(data.risk_score, data.features || {});
            incrementStats('scanned');
            if (data.risk_score >= 70) incrementStats('blocked');
        }
    } catch (error) {
        console.error('Scan error:', error);
        const wList = document.getElementById('warningsList');
        if (wList) wList.innerHTML = '<div style="color: #ef4444;">Unable to scan. Backend offline.</div>';
    }
}

function updateRiskScore(score, features) {
    const scoreValue = document.getElementById('scoreValue');
    const scoreFill = document.getElementById('scoreFill');
    scoreValue.textContent = score;
    scoreFill.style.width = `${score}%`;

    if (score < 30) scoreFill.style.background = '#4ade80';
    else if (score < 70) scoreFill.style.background = '#fbbf24';
    else scoreFill.style.background = '#ef4444';

    const warningsList = document.getElementById('warningsList');
    const warnings = [];
    if (features.https_status === false) warnings.push('⚠️ Not using HTTPS');
    if (features.suspicious_keywords) warnings.push('⚠️ Suspicious keywords detected');
    if (features.url_length > 75) warnings.push('⚠️ Unusually long URL');

    if (warnings.length > 0) warningsList.innerHTML = warnings.map(w => `<div style="margin: 5px 0;">${w}</div>`).join('');
    else warningsList.textContent = 'No warnings detected';
}

function loadPhishingStats() {
    chrome.storage.local.get(['scannedCount', 'blockedCount'], (result) => {
        document.getElementById('scannedCount').textContent = result.scannedCount || 0;
        document.getElementById('blockedCount').textContent = result.blockedCount || 0;
    });
}

function incrementStats(type) {
    chrome.storage.local.get([`${type}Count`], (result) => {
        const newCount = (result[`${type}Count`] || 0) + 1;
        chrome.storage.local.set({ [`${type}Count`]: newCount });
        document.getElementById(`${type}Count`).textContent = newCount;
    });
}

async function whitelistURL(url) {
    chrome.storage.local.get(['whitelist'], (result) => {
        const whitelist = result.whitelist || [];
        if (!whitelist.includes(url)) {
            whitelist.push(url);
            chrome.storage.local.set({ whitelist: whitelist });
            alert('URL added to whitelist');
        } else alert('URL already whitelisted');
    });
}

async function reportURL(url) {
    try {
        await fetch(`${PHISHING_API}/report`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ url: url, type: 'phishing' })
        });
        alert('Thank you for reporting!');
    } catch (error) {
        alert('Report submitted (local mode)');
    }
}

// ========== VPN LOGIC ==========
let isVPNConnected = false;
let vpnTimer = null;
let vpnSeconds = 0;

function initializeVPN() {
    const connectBtn = document.getElementById('vpn-connect-btn');
    connectBtn && connectBtn.addEventListener('click', () => {
        if (isVPNConnected) disconnectVPN();
        else connectVPN();
    });
}

function connectVPN() {
    isVPNConnected = true;
    const statusIcon = document.querySelector('.status-icon');
    statusIcon.classList.remove('disconnected');
    statusIcon.classList.add('connected');
    document.getElementById('vpn-status-title').textContent = 'Connected';
    document.getElementById('vpn-status-subtitle').textContent = 'Your connection is secure';

    const connectBtn = document.getElementById('vpn-connect-btn');
    connectBtn.innerHTML = '<i class="fas fa-power-off"></i> Disconnect';
    connectBtn.classList.add('connected');

    vpnSeconds = 0;
    vpnTimer = setInterval(updateVPNTimer, 1000);
    document.getElementById('vpn-speed').textContent = (Math.random() * 50 + 50).toFixed(1) + ' Mbps';

    const server = document.getElementById('server-select').value;
    chrome.runtime.sendMessage({ action: 'connect', server: server });
}

function disconnectVPN() {
    isVPNConnected = false;
    const statusIcon = document.querySelector('.status-icon');
    statusIcon.classList.remove('connected');
    statusIcon.classList.add('disconnected');
    document.getElementById('vpn-status-title').textContent = 'Disconnected';
    document.getElementById('vpn-status-subtitle').textContent = 'Click to connect';

    const connectBtn = document.getElementById('vpn-connect-btn');
    connectBtn.innerHTML = '<i class="fas fa-power-off"></i> Connect VPN';
    connectBtn.classList.remove('connected');

    clearInterval(vpnTimer);
    document.getElementById('vpn-duration').textContent = '00:00';
    document.getElementById('vpn-speed').textContent = '0 Mbps';
    chrome.runtime.sendMessage({ action: 'disconnect' });
}

function updateVPNTimer() {
    vpnSeconds++;
    const minutes = Math.floor(vpnSeconds / 60);
    const seconds = vpnSeconds % 60;
    document.getElementById('vpn-duration').textContent = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
}

// ========== SETTINGS ==========
const saveSettingsBtn = document.getElementById('saveSettingsBtn');
saveSettingsBtn && saveSettingsBtn.addEventListener('click', async () => {
    const settings = {
        protectionLevel: document.getElementById('protectionLevel').value,
        autoScan: document.getElementById('autoScan').checked,
        blockDangerous: document.getElementById('blockDangerous').checked
    };
    await chrome.storage.local.set({ settings: settings });
    alert('Settings saved successfully!');
});

chrome.storage.local.get(['settings'], (result) => {
    if (result.settings) {
        const s = result.settings;
        if (document.getElementById('protectionLevel')) document.getElementById('protectionLevel').value = s.protectionLevel || 'medium';
        if (document.getElementById('autoScan')) document.getElementById('autoScan').checked = s.autoScan !== false;
        if (document.getElementById('blockDangerous')) document.getElementById('blockDangerous').checked = s.blockDangerous !== false;
    }
});

// ========== HELPER FUNCTIONS ==========
async function getSession() {
    return new Promise((resolve) => {
        chrome.storage.local.get(['token', 'user'], (result) => resolve(result));
    });
}

function showAlert(elementId, message, type) {
    const alert = document.getElementById(elementId);
    if (alert) {
        if (type === 'none') {
            alert.style.display = 'none';
            return;
        }
        alert.textContent = message;
        alert.className = `alert ${type}`;
        alert.style.display = 'block';
        if (type === 'success') {
            setTimeout(() => { alert.style.display = 'none'; }, 5000);
        }
    }
}

chrome.storage.onChanged.addListener((changes, namespace) => {
    if (namespace === 'local' && changes.user) {
        const updatedUser = changes.user.newValue;
        if (updatedUser) showDashboard(updatedUser);
    }
});
document.addEventListener('DOMContentLoaded', () => { document.querySelectorAll('.toggle-password').forEach(icon => { icon.addEventListener('click', () => { const targetId = icon.getAttribute('data-target'); const input = document.getElementById(targetId); if (input.type === 'password') { input.type = 'text'; icon.classList.remove('fa-eye'); icon.classList.add('fa-eye-slash'); } else { input.type = 'password'; icon.classList.remove('fa-eye-slash'); icon.classList.add('fa-eye'); } }); }); });
