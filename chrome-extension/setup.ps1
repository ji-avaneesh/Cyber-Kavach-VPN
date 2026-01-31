# Cyber Kavach Extension - Quick Setup Script

Write-Host "🔥 Cyber Kavach Extension - Setup" -ForegroundColor Cyan
Write-Host "================================" -ForegroundColor Cyan
Write-Host ""

# Check if icons exist
if (-Not (Test-Path "icons/icon16.png")) {
    Write-Host "⚠️  Icons not found!" -ForegroundColor Yellow
    Write-Host ""
    Write-Host "Please create icons manually:" -ForegroundColor White
    Write-Host "  1. Use your logo.png from '../fire kavach/assets/images/logo.png'" -ForegroundColor Gray
    Write-Host "  2. Create 3 sizes: 16x16, 48x48, 128x128 pixels" -ForegroundColor Gray
    Write-Host "  3. Save as icon16.png, icon48.png, icon128.png in 'icons' folder" -ForegroundColor Gray
    Write-Host ""
    Write-Host "Online tool: https://redketchup.io/icon-converter" -ForegroundColor Green
    Write-Host ""
}
else {
    Write-Host "✅ Icons found" -ForegroundColor Green
}

# Check backend
Write-Host "Checking backend connection..." -ForegroundColor White
try {
    $response = Invoke-WebRequest -Uri "http://localhost:5001/api/config" -UseBasicParsing -TimeoutSec 3 -ErrorAction Stop
    if ($response.StatusCode -eq 200) {
        Write-Host "✅ Backend is running on localhost:5001" -ForegroundColor Green
    }
}
catch {
    Write-Host "❌ Backend not accessible" -ForegroundColor Red
    Write-Host "   Make sure your backend is running on http://localhost:5001" -ForegroundColor Yellow
}

Write-Host ""
Write-Host "📦 Extension Files Created:" -ForegroundColor Cyan
Write-Host "  ✓ manifest.json" -ForegroundColor Green
Write-Host "  ✓ popup.html" -ForegroundColor Green
Write-Host "  ✓ popup.css" -ForegroundColor Green
Write-Host "  ✓ popup.js" -ForegroundColor Green
Write-Host "  ✓ background.js" -ForegroundColor Green
Write-Host "  ✓ README.md" -ForegroundColor Green
Write-Host ""

Write-Host "🚀 Next Steps:" -ForegroundColor Cyan
Write-Host "  1. Add icons to 'icons' folder (see above)" -ForegroundColor White
Write-Host "  2. Open Chrome → chrome://extensions/" -ForegroundColor White
Write-Host "  3. Enable 'Developer mode'" -ForegroundColor White
Write-Host "  4. Click 'Load unpacked' → Select this folder" -ForegroundColor White
Write-Host "  5. Extension ready! 🎉" -ForegroundColor White
Write-Host ""
Write-Host "📖 Full guide: See README.md" -ForegroundColor Gray
Write-Host ""
