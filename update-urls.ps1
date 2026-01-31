# ========================================
# URL Update Script - Cyber Kavach
# ========================================
# This script updates all localhost URLs to production URLs

param(
    [Parameter(Mandatory = $false)]
    [string]$BackendURL = "",
    
    [Parameter(Mandatory = $false)]
    [string]$FrontendURL = "",
    
    [Parameter(Mandatory = $false)]
    [switch]$Preview = $false
)

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "   Cyber Kavach - URL Update Script" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# ========================================
# Configuration
# ========================================

$rootPath = "c:\Users\HP\Desktop\app"

# If URLs not provided, ask user
if ([string]::IsNullOrWhiteSpace($BackendURL)) {
    Write-Host "📝 Enter your production URLs:" -ForegroundColor Yellow
    Write-Host ""
    Write-Host "Example Backend URLs:" -ForegroundColor Gray
    Write-Host "  - https://cyber-kavach-api.onrender.com" -ForegroundColor Gray
    Write-Host "  - https://api.cyberkavach.com" -ForegroundColor Gray
    Write-Host ""
    $BackendURL = Read-Host "Backend API URL (without /api)"
    
    Write-Host ""
    Write-Host "Example Frontend URLs:" -ForegroundColor Gray
    Write-Host "  - https://cyber-kavach.vercel.app" -ForegroundColor Gray
    Write-Host "  - https://www.cyberkavach.com" -ForegroundColor Gray
    Write-Host ""
    $FrontendURL = Read-Host "Frontend URL"
}

# Remove trailing slashes
$BackendURL = $BackendURL.TrimEnd('/')
$FrontendURL = $FrontendURL.TrimEnd('/')

Write-Host ""
Write-Host "🎯 Configuration:" -ForegroundColor Green
Write-Host "   Backend:  $BackendURL" -ForegroundColor White
Write-Host "   Frontend: $FrontendURL" -ForegroundColor White
Write-Host ""

if ($Preview) {
    Write-Host "👁️  PREVIEW MODE - No files will be modified" -ForegroundColor Yellow
    Write-Host ""
}

# ========================================
# Files to Update
# ========================================

$filesToUpdate = @(
    # Frontend JS Files
    @{
        Path        = "fire kavach\js\script.js"
        Find        = "http://localhost:5001"
        Replace     = "$BackendURL"
        Description = "Main Script API URL"
    },
    @{
        Path        = "payments.html"
        Find        = "http://localhost:5001"
        Replace     = "$BackendURL"
        Description = "Payments Page API URL"
    },
    @{
        Path        = "profile.html"
        Find        = "http://localhost:5001"
        Replace     = "$BackendURL"
        Description = "Profile Page API URL"
    },
    @{
        Path        = "forgot-password.html"
        Find        = "http://localhost:5001"
        Replace     = "$BackendURL"
        Description = "Forgot Password API URL"
    },
    @{
        Path        = "reset-password.html"
        Find        = "http://localhost:5001"
        Replace     = "$BackendURL"
        Description = "Reset Password API URL"
    },
    @{
        Path        = "chrome-extension\popup.js"
        Find        = "http://localhost:5001"
        Replace     = "$BackendURL"
        Description = "Extension Popup API URL"
    },
    @{
        Path        = "extension-example.js"
        Find        = "http://localhost:5001"
        Replace     = "$BackendURL"
        Description = "Extension Example API URL"
    },
    # Frontend URLs in Extension
    @{
        Path        = "chrome-extension\popup.js"
        Find        = "http://localhost:8000/fire%20kavach/index.html#pricing"
        Replace     = "$FrontendURL/#pricing"
        Description = "Extension Payment URL"
    },
    @{
        Path        = "chrome-extension\popup.js"
        Find        = "https://vpndigitalservice.com/"
        Replace     = "$FrontendURL/"
        Description = "Extension Signup URL"
    },
    # Dashboard redirect URLs
    @{
        Path        = "fire kavach\js\script.js"
        Find        = "'../dashboard.html'"
        Replace     = "'/dashboard.html'"
        Description = "Dashboard redirect path"
    }
)

# ========================================
# Backup Function
# ========================================

function Backup-Files {
    $backupFolder = "$rootPath\backups\url-update-$(Get-Date -Format 'yyyy-MM-dd-HHmmss')"
    
    Write-Host "📦 Creating backup..." -ForegroundColor Yellow
    
    if (-not (Test-Path "$rootPath\backups")) {
        New-Item -ItemType Directory -Path "$rootPath\backups" | Out-Null
    }
    
    New-Item -ItemType Directory -Path $backupFolder | Out-Null
    
    foreach ($file in $filesToUpdate) {
        $sourcePath = Join-Path $rootPath $file.Path
        if (Test-Path $sourcePath) {
            $destPath = Join-Path $backupFolder $file.Path
            $destDir = Split-Path $destPath -Parent
            
            if (-not (Test-Path $destDir)) {
                New-Item -ItemType Directory -Path $destDir -Force | Out-Null
            }
            
            Copy-Item $sourcePath $destPath -Force
        }
    }
    
    Write-Host "✅ Backup created at: $backupFolder" -ForegroundColor Green
    Write-Host ""
    
    return $backupFolder
}

# ========================================
# Update Function
# ========================================

function Update-URLs {
    param (
        [bool]$PreviewOnly = $false
    )
    
    $updatedCount = 0
    $skippedCount = 0
    
    foreach ($file in $filesToUpdate) {
        $filePath = Join-Path $rootPath $file.Path
        
        if (-not (Test-Path $filePath)) {
            Write-Host "⚠️  File not found: $($file.Path)" -ForegroundColor Yellow
            $skippedCount++
            continue
        }
        
        $content = Get-Content $filePath -Raw -Encoding UTF8
        
        if ($content -match [regex]::Escape($file.Find)) {
            if ($PreviewOnly) {
                Write-Host "📄 $($file.Description)" -ForegroundColor Cyan
                Write-Host "   File: $($file.Path)" -ForegroundColor Gray
                Write-Host "   Find: $($file.Find)" -ForegroundColor Red
                Write-Host "   Replace: $($file.Replace)" -ForegroundColor Green
                Write-Host ""
            }
            else {
                $newContent = $content -replace [regex]::Escape($file.Find), $file.Replace
                Set-Content $filePath -Value $newContent -Encoding UTF8 -NoNewline
                Write-Host "✅ Updated: $($file.Description)" -ForegroundColor Green
            }
            $updatedCount++
        }
        else {
            if (-not $PreviewOnly) {
                Write-Host "⏭️  Already updated: $($file.Description)" -ForegroundColor Gray
            }
            $skippedCount++
        }
    }
    
    return @{
        Updated = $updatedCount
        Skipped = $skippedCount
    }
}

# ========================================
# Main Execution
# ========================================

Write-Host "🔍 Scanning files..." -ForegroundColor Yellow
Write-Host ""

if ($Preview) {
    # Preview mode - show what would be changed
    Write-Host "========================================" -ForegroundColor Yellow
    Write-Host "   PREVIEW - Changes to be made:" -ForegroundColor Yellow
    Write-Host "========================================" -ForegroundColor Yellow
    Write-Host ""
    
    $result = Update-URLs -PreviewOnly $true
    
    Write-Host "========================================" -ForegroundColor Yellow
    Write-Host "Summary:" -ForegroundColor Cyan
    Write-Host "  Files to update: $($result.Updated)" -ForegroundColor White
    Write-Host "  Files to skip: $($result.Skipped)" -ForegroundColor White
    Write-Host ""
    Write-Host "Run without -Preview flag to apply changes" -ForegroundColor Yellow
    Write-Host "========================================" -ForegroundColor Yellow
    
}
else {
    # Actual update
    Write-Host "⚠️  This will modify your files!" -ForegroundColor Yellow
    Write-Host ""
    $confirmation = Read-Host "Continue? (yes/no)"
    
    if ($confirmation -eq "yes" -or $confirmation -eq "y") {
        # Create backup first
        $backupPath = Backup-Files
        
        Write-Host "🔄 Updating URLs..." -ForegroundColor Yellow
        Write-Host ""
        
        $result = Update-URLs -PreviewOnly $false
        
        Write-Host ""
        Write-Host "========================================" -ForegroundColor Green
        Write-Host "   ✅ UPDATE COMPLETE!" -ForegroundColor Green
        Write-Host "========================================" -ForegroundColor Green
        Write-Host ""
        Write-Host "Summary:" -ForegroundColor Cyan
        Write-Host "  Files updated: $($result.Updated)" -ForegroundColor Green
        Write-Host "  Files skipped: $($result.Skipped)" -ForegroundColor Yellow
        Write-Host "  Backup location: $backupPath" -ForegroundColor Gray
        Write-Host ""
        Write-Host "📋 Next Steps:" -ForegroundColor Cyan
        Write-Host "  1. Review the changes" -ForegroundColor White
        Write-Host "  2. Test your application locally" -ForegroundColor White
        Write-Host "  3. Deploy to production" -ForegroundColor White
        Write-Host "  4. Verify everything works" -ForegroundColor White
        Write-Host ""
        
    }
    else {
        Write-Host "❌ Update cancelled" -ForegroundColor Red
    }
}

Write-Host "========================================" -ForegroundColor Cyan
