// DOM Scanning for suspicious elements
document.addEventListener('DOMContentLoaded', () => {
    scanPage();
});

function scanPage() {
    const warnings = [];
    
    // Check for hidden inputs
    const hiddenInputs = document.querySelectorAll('input[type="hidden"]');
    if (hiddenInputs.length > 5) {
        warnings.push(`Found ${hiddenInputs.length} hidden inputs`);
    }
    
    // Check for password fields without HTTPS
    if (window.location.protocol !== 'https:' && document.querySelector('input[type="password"]')) {
        warnings.push('Password field on non-HTTPS page');
    }
    
    // Check for suspicious form actions
    const forms = document.querySelectorAll('form');
    forms.forEach((form, index) => {
        if (form.action && !form.action.startsWith('http')) {
            warnings.push(`Form #${index + 1} has suspicious action: ${form.action}`);
        }
    });
    
    // Check for iframes from external domains
    const iframes = document.querySelectorAll('iframe');
    iframes.forEach((iframe, index) => {
        try {
            const src = iframe.src;
            if (src && !src.startsWith(window.location.origin)) {
                warnings.push(`External iframe found: ${src}`);
            }
        } catch (e) {}
    });
    
    // Send warnings to background script
    if (warnings.length > 0) {
        chrome.runtime.sendMessage({
            type: 'DOM_WARNINGS',
            warnings: warnings,
            url: window.location.href
        });
    }
}

// Listen for messages from popup
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.type === 'SCAN_DOM') {
        const results = {
            forms: document.querySelectorAll('form').length,
            passwordFields: document.querySelectorAll('input[type="password"]').length,
            hiddenInputs: document.querySelectorAll('input[type="hidden"]').length,
            iframes: document.querySelectorAll('iframe').length,
            url: window.location.href
        };
        sendResponse(results);
    }
    return true;
});
