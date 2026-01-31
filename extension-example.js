// example-extension-usage.js
// This file demonstrates how your Chrome Extension background script can call our API.

const API_BASE = "http://localhost:5001/api";

// 1. Get the stored token (saved after login via extension popup)
const getUserToken = () => {
    // In chrome extension: return chrome.storage.local.get(['authToken']);
    return localStorage.getItem('auth-token');
};

// 2. Function to Scan a Link
async function scanCurrentUrl(url) {
    const token = getUserToken();

    if (!token) {
        console.log("User not logged in. Cannot scan.");
        return { error: "Login required" };
    }

    try {
        const response = await fetch(`${API_BASE}/scan/link`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'auth-token': token
            },
            body: JSON.stringify({ url: url })
        });

        const data = await response.json();

        if (response.status === 429) {
            console.warn("Rate limit reached:", data.message);
            // Show upgrade prompt in extension UI
            return data;
        }

        console.log("Scan Result:", data);
        // data looks like:
        // {
        //   url: "http://example.com",
        //   status: "SAFE" | "SUSPICIOUS" | "DANGEROUS",
        //   message: "...",
        //   scanType: "BASIC" | "DEEP"
        // }

        return data;

    } catch (error) {
        console.error("API Error:", error);
    }
}

// Example Usage:
// scanCurrentUrl("http://phishing-site.com/login");
