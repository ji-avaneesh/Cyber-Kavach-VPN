// blocked_screen.js - RED SCREEN OVERLAY
console.log('🎬 blocked_screen.js loaded successfully!');
console.log('URL:', window.location.href);

function injectRedScreen(url, reason, riskScore = null) {
    console.log('🛑 Injecting red screen for:', url, 'reason:', reason);
    
    // Remove any existing overlay
    const existingOverlay = document.querySelector('.red-screen-overlay, .yellow-screen-overlay');
    if (existingOverlay) {
        existingOverlay.remove();
    }
    
    // Create overlay container
    const overlay = document.createElement('div');
    
    if (riskScore && riskScore < 80) {
        // Yellow warning screen for suspicious sites (score 60-79)
        overlay.className = 'yellow-screen-overlay';
        overlay.innerHTML = createYellowWarningScreen(url, reason, riskScore);
    } else {
        // Red blocked screen for dangerous sites (score 80+)
        overlay.className = 'red-screen-overlay';
        overlay.innerHTML = createRedBlockedScreen(url, reason, riskScore);
    }
    
    // Add to page
    document.body.appendChild(overlay);
    document.body.style.overflow = 'hidden';
    
    // Add event listeners
    setTimeout(() => {
        setupBlockedScreenListeners(overlay, url);
    }, 100);
    
    return overlay;
}

function createRedBlockedScreen(url, reason, riskScore = 95) {
    const urlObj = new URL(url);
    const hostname = urlObj.hostname;
    
    return `
        <div class="red-screen-content flash-danger">
            <div style="font-size: 120px; margin-bottom: 20px;">🚨</div>
            
            <h1 class="red-screen-title">BLOCKED BY CYBER KAVACH</h1>
            
            <div class="red-screen-subtitle">
                This website has been blocked for your security
            </div>
            
            <div style="font-size: 48px; font-weight: bold; margin: 20px 0; color: white;">
                ${riskScore}/100
            </div>
            
            <div class="red-screen-url">
                <strong>Blocked URL:</strong><br>
                ${url}
            </div>
            
            <div class="red-screen-reason shake-warning">
                ⚠️ <strong>Security Issue Detected:</strong><br>
                ${getReasonText(reason)}
            </div>
            
            <div class="red-screen-warning">
                <strong>⚠️ SECURITY WARNING:</strong><br>
                This site may attempt to steal passwords, credit card information, or install malware.
                Cyber Kavach has blocked access to protect your data.
            </div>
            
            <div class="red-screen-buttons">
                <button id="goBackBtn" class="red-screen-btn red-screen-btn-primary">
                    ← Go Back to Safety
                </button>
                <button id="proceedBtn" class="red-screen-btn red-screen-btn-danger">
                    ⚠️ Proceed Anyway (Risky)
                </button>
            </div>
            
            <div style="margin-top: 30px; font-size: 12px; opacity: 0.7;">
                Cyber Kavach v1.0 • Powered by Machine Learning
            </div>
        </div>
    `;
}

function createYellowWarningScreen(url, reason, riskScore) {
    const urlObj = new URL(url);
    const hostname = urlObj.hostname;
    
    let riskLevel = 'HIGH';
    let riskColor = '#dc2626';
    
    if (riskScore < 70) {
        riskLevel = 'MEDIUM';
        riskColor = '#f59e0b';
    }
    
    return `
        <div class="yellow-screen-content">
            <div style="font-size: 80px; margin-bottom: 20px;">⚠️</div>
            
            <h1 class="yellow-screen-title">SECURITY WARNING</h1>
            
            <div class="yellow-screen-subtitle">
                Suspicious website detected - Proceed with caution
            </div>
            
            <div class="yellow-screen-risk-score">
                ${riskScore}/100
            </div>
            
            <div class="yellow-screen-risk-label" style="color: ${riskColor};">
                ${riskLevel} RISK LEVEL
            </div>
            
            <div class="red-screen-url">
                <strong>Website:</strong><br>
                ${url}
            </div>
            
            <div class="red-screen-warning">
                <strong>⚠️ Potential Issues:</strong><br>
                ${getReasonText(reason)}<br><br>
                This site shows characteristics commonly found in phishing websites.
            </div>
            
            <div class="red-screen-buttons">
                <button id="goBackBtn" class="red-screen-btn red-screen-btn-warning">
                    ← Go Back
                </button>
                <button id="proceedAnywayBtn" class="red-screen-btn red-screen-btn-secondary">
                    ⚠️ Proceed Anyway
                </button>
                <button id="reportBtn" class="red-screen-btn red-screen-btn-danger">
                    🚨 Report as Phishing
                </button>
            </div>
            
            <div style="margin-top: 30px; font-size: 12px; opacity: 0.7;">
                Cyber Kavach is warning you based on ML analysis. Use your own judgment.
            </div>
        </div>
    `;
}

function getReasonText(reason) {
    const reasons = {
        'blacklisted': 'This website is in our phishing blacklist',
        'auto_blocked': 'Automatic ML detection identified phishing patterns',
        'ml_phishing_detected': 'Machine learning model detected phishing with high confidence',
        'reported': 'This site was reported by users as malicious',
        'high_risk': 'Extremely high risk score from security analysis',
        'suspicious': 'Multiple suspicious characteristics detected'
    };
    
    return reasons[reason] || 'Security threat detected';
}

function setupBlockedScreenListeners(overlay, originalUrl) {
    // Go Back button
    const goBackBtn = overlay.querySelector('#goBackBtn');
    if (goBackBtn) {
        goBackBtn.addEventListener('click', () => {
            if (window.history.length > 1) {
                window.history.back();
            } else {
                window.location.href = 'https://www.google.com';
            }
            overlay.remove();
            document.body.style.overflow = '';
        });
    }
    
    // Proceed Anyway button (for red screen)
    const proceedBtn = overlay.querySelector('#proceedBtn');
    if (proceedBtn) {
        proceedBtn.addEventListener('click', () => {
            if (confirm('⚠️ EXTREME SECURITY WARNING\n\n' +
                       'This website has been blocked because it may:\n' +
                       '• Steal your passwords and credit card information\n' +
                       '• Install malware or viruses\n' +
                       '• Hijack your accounts\n' +
                       '\n' +
                       'Are you ABSOLUTELY SURE you want to proceed?')) {
                overlay.remove();
                document.body.style.overflow = '';
                window.location.href = originalUrl;
            }
        });
    }
    
    // Proceed Anyway button (for yellow screen)
    const proceedAnywayBtn = overlay.querySelector('#proceedAnywayBtn');
    if (proceedAnywayBtn) {
        proceedAnywayBtn.addEventListener('click', () => {
            overlay.remove();
            document.body.style.overflow = '';
            // Continue to the site (it's just a warning)
        });
    }
    
    // Report button
    const reportBtn = overlay.querySelector('#reportBtn');
    if (reportBtn) {
        reportBtn.addEventListener('click', () => {
            chrome.runtime.sendMessage({
                type: 'REPORT_SITE',
                url: originalUrl
            }, response => {
                if (response && response.success) {
                    reportBtn.innerHTML = '✅ Reported!';
                    reportBtn.disabled = true;
                    reportBtn.style.background = '#4ade80';
                    reportBtn.style.color = 'white';
                }
            });
        });
    }
}

// ===== EXPOSE FUNCTIONS FOR BACKGROUND SCRIPT =====
window.injectRedScreen = injectRedScreen;