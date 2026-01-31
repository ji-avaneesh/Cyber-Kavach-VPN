# 🔥 Cyber Kavach - Complete Project Guide

Welcome to **Cyber Kavach**! This is a complete security solution featuring a **VPN**, **Phishing Detector**, and a **Secure Browser Extension**.

This guide explains how to **Setup**, **Run**, and **Update** the project on GitHub.

---

## 🛠️ 1. Project Setup (For New Users)
Follow these steps to download and run the project on your computer.

### ✅ Prerequisites
Make sure you have installed:
1.  **Node.js**: [Download Here](https://nodejs.org/)
2.  **Python 3.x**: [Download Here](https://www.python.org/)
3.  **Git**: [Download Here](https://git-scm.com/)
4.  **VS Code**: Recommended Editor.

### 📥 Step 1: Download & Install
Open your terminal (Command Prompt or PowerShell) and run:

```bash
# 1. Clone the repository (Download code)
git clone <YOUR_GITHUB_REPO_LINK>
cd cyber-kavach-app

# 2. Install Website & Backend Dependencies
npm install
cd backend
npm install
cd ..

# 3. Install AI Scanner Dependencies (Python)
cd chrome-extension/phishing_url_detector/Backend
pip install -r requirements.txt
```

### 🔑 Step 2: Configure Keys (Important!)
You need a `.env` file and `serviceAccountKey.json` for the backend to work.
*Ask the project administrator for these files as they are kept secret.*

1.  Place `.env` inside `backend/` folder.
2.  Place `serviceAccountKey.json` inside `backend/` folder.

---

## 🚀 2. How to Run the Project
You need to run **3 things** simultaneously. Open **3 separate terminals** in VS Code.

### Terminal 1: Frontend (Website)
```bash
npx http-server -p 8080 -c-1
```
*Website runs at:* `http://localhost:8080/fire kavach/index.html`

### Terminal 2: Main Backend (Auth & Database)
```bash
cd backend
node server.js
```
*Backend runs at:* `http://localhost:5001`

### Terminal 3: AI Phishing Scanner (Python)
```bash
cd chrome-extension/phishing_url_detector/Backend
python app.py
```
*AI Engine runs at:* `http://127.0.0.1:5000`

---

## 🧩 3. How to Load the Chrome Extension
1.  Open Chrome and go to: `chrome://extensions/`
2.  Enable **Developer Mode** (Top right corner switch).
3.  Click **Load Unpacked**.
4.  Select the folder: `cyber-kavach-app/chrome-extension`
    *(Do not select the inner 'phishing' folder, select the main 'chrome-extension' folder)*.
5.  Pin the extension and enjoy!

---

## ☁️ 4. GitHub Guide (How to Update & Push)

### ➤ Push New Changes (Upload to GitHub)
Whenever you make changes to the code, verify them and then run these commands:

```bash
# 1. Check which files changed
git status

# 2. Add all changes
git add .

# 3. Save changes with a message (Commit)
git commit -m "Updated features: Added login button and fixed bugs"

# 4. Upload to GitHub
git push origin main
```

### ➤ Pull Updates (Download latest changes)
If someone else updated the code, run this to get the latest version:
```bash
git pull origin main
```

---

## ⚠️ Troubleshooting
-   **Error: "ModuleNameNotFound"**: Run `npm install` inside the `backend` folder again.
-   **Error: "Python not found"**: Ensure Python is added to your system PATH.
-   **Extension Error**: Click the "Errors" button on the extension card and then clear/reload.
-   **Database Error**: Ensure `serviceAccountKey.json` is in the correct place.

---
*Created by Cyber Kavach Team*
