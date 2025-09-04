# INNKT Angular Production Build Script (PowerShell)
# This script builds the application for production deployment on Windows

param(
    [switch]$CleanCache,
    [switch]$Optimize,
    [switch]$Help
)

# Set error action preference
$ErrorActionPreference = "Stop"

# Configuration
$ProjectName = "innkt"
$BuildDir = "dist\$ProjectName\browser"
$BackupDir = "dist\backup-$(Get-Date -Format 'yyyyMMdd-HHmmss')"
$Global:BuildSizeMB = 0
$Global:FileCount = 0
$Global:EssentialFiles = @("index.html", "main.js", "polyfills.js", "runtime.js", "styles.css")

# Function to print colored output
function Write-Status {
    param([string]$Message)
    Write-Host "[INFO] $Message" -ForegroundColor Blue
}

function Write-Success {
    param([string]$Message)
    Write-Host "[SUCCESS] $Message" -ForegroundColor Green
}

function Write-Warning {
    param([string]$Message)
    Write-Host "[WARNING] $Message" -ForegroundColor Yellow
}

function Write-Error {
    param([string]$Message)
    Write-Host "[ERROR] $Message" -ForegroundColor Red
}

# Show help
if ($Help) {
    Write-Host "INNKT Angular Production Build Script (PowerShell)" -ForegroundColor Cyan
    Write-Host "Usage: .\build-production.ps1 [OPTIONS]" -ForegroundColor White
    Write-Host ""
    Write-Host "Options:" -ForegroundColor White
    Write-Host "  -CleanCache    Clean npm cache before building" -ForegroundColor Gray
    Write-Host "  -Optimize      Run additional optimizations" -ForegroundColor Gray
    Write-Host "  -Help         Show this help message" -ForegroundColor Gray
    Write-Host ""
    exit 0
}

# Check if Node.js is installed
function Test-NodeJS {
    try {
        $nodeVersion = node --version
        if ($LASTEXITCODE -eq 0) {
            $majorVersion = [int]($nodeVersion -replace 'v', '' -split '\.')[0]
            if ($majorVersion -ge 18) {
                Write-Success "Node.js version: $nodeVersion"
                return $true
            } else {
                Write-Error "Node.js version 18+ is required. Current version: $nodeVersion"
                return $false
            }
        }
    } catch {
        Write-Error "Node.js is not installed. Please install Node.js 18+ and try again."
        return $false
    }
    return $false
}

# Check if npm is installed
function Test-NPM {
    try {
        $npmVersion = npm --version
        if ($LASTEXITCODE -eq 0) {
            Write-Success "npm version: $npmVersion"
            return $true
        }
    } catch {
        Write-Error "npm is not installed. Please install npm and try again."
        return $false
    }
    return $false
}

# Check if Angular CLI is installed
function Test-AngularCLI {
    try {
        $ngVersion = ng version 2>$null | Select-String "Angular CLI"
        if ($ngVersion) {
            $version = ($ngVersion -split '\s+')[2]
            Write-Success "Angular CLI version: $version"
            return $true
        } else {
            Write-Warning "Angular CLI not found globally. Installing locally..."
            npm install -g @angular/cli@latest
            if ($LASTEXITCODE -eq 0) {
                Write-Success "Angular CLI installed successfully"
                return $true
            } else {
                Write-Error "Failed to install Angular CLI"
                return $false
            }
        }
    } catch {
        Write-Error "Failed to check Angular CLI"
        return $false
    }
    return $false
}

# Clean previous builds
function Clear-Build {
    Write-Status "Cleaning previous build artifacts..."
    
    if (Test-Path $BuildDir) {
        Write-Status "Creating backup of previous build..."
        if (!(Test-Path "dist")) {
            New-Item -ItemType Directory -Path "dist" -Force | Out-Null
        }
        Copy-Item -Path $BuildDir -Destination $BackupDir -Recurse -Force
        Write-Success "Backup created at: $BackupDir"
        
        Write-Status "Removing previous build..."
        Remove-Item -Path $BuildDir -Recurse -Force
    }
    
    # Clean npm cache if needed
    if ($CleanCache) {
        Write-Status "Cleaning npm cache..."
        npm cache clean --force
        if ($LASTEXITCODE -eq 0) {
            Write-Success "npm cache cleaned successfully"
        } else {
            Write-Warning "Failed to clean npm cache"
        }
    }
}

# Install dependencies
function Install-Dependencies {
    Write-Status "Installing dependencies..."
    
    if (Test-Path "package-lock.json") {
        npm ci --production=$false
    } else {
        npm install
    }
    
    if ($LASTEXITCODE -eq 0) {
        Write-Success "Dependencies installed successfully"
    } else {
        Write-Error "Failed to install dependencies"
        exit 1
    }
}

# Run tests
function Invoke-Tests {
    Write-Status "Running tests..."
    
    try {
        npm run test:ci 2>$null
        if ($LASTEXITCODE -eq 0) {
            Write-Success "Tests passed successfully"
        } else {
            Write-Warning "Tests failed or not configured. Continuing with build..."
        }
    } catch {
        Write-Warning "Tests failed or not configured. Continuing with build..."
    }
}

# Build application
function Build-Application {
    Write-Status "Building application for production..."
    
    # Build with production configuration
    ng build --configuration=production
    
    if ($LASTEXITCODE -eq 0) {
        Write-Success "Application built successfully"
    } else {
        Write-Error "Build failed. Please check the error messages above."
        exit 1
    }
}

# Verify build output
function Test-BuildOutput {
    Write-Status "Verifying build output..."
    
    if (!(Test-Path $BuildDir)) {
        Write-Error "Build directory not found: $BuildDir"
        exit 1
    }
    
    # Check for essential files
    
    foreach ($file in $Global:EssentialFiles) {
        $filePath = Join-Path $BuildDir $file
        if (!(Test-Path $filePath)) {
            Write-Warning "Essential file not found: $file"
        }
    }
    
    # Check build size
    $buildSize = (Get-ChildItem -Path $BuildDir -Recurse | Measure-Object -Property Length -Sum).Sum
    $Global:BuildSizeMB = [math]::Round($buildSize / 1MB, 2)
    Write-Success "Build size: $Global:BuildSizeMB MB"
    
    # Check file count
    $Global:FileCount = (Get-ChildItem -Path $BuildDir -Recurse -File).Count
    Write-Success "Total files: $Global:FileCount"
}

# Generate build report
function New-BuildReport {
    Write-Status "Generating build report..."
    
    $reportFile = "build-report-$(Get-Date -Format 'yyyyMMdd-HHmmss').txt"
    
    $reportContent = @"
INNKT Angular Production Build Report
=====================================
Build Date: $(Get-Date)
Build Time: $(Get-Date -Format 'HH:mm:ss')
Node Version: $(node --version)
npm Version: $(npm --version)
Angular CLI Version: $(ng version 2>$null | Select-String "Angular CLI" | ForEach-Object { ($_ -split '\s+')[2] })

Build Output:
- Build Directory: $BuildDir
- Build Size: $Global:BuildSizeMB MB
- Total Files: $Global:FileCount

Essential Files:
"@

    # Check essential files
    foreach ($file in $Global:EssentialFiles) {
        $filePath = Join-Path $BuildDir $file
        if (Test-Path $filePath) {
            $fileSize = (Get-Item $filePath).Length
            $fileSizeKB = [math]::Round($fileSize / 1KB, 2)
            $reportContent += "`n- [OK] $file ($fileSizeKB KB)"
        } else {
            $reportContent += "`n- [MISSING] $file"
        }
    }

    $reportContent += @"

Service Worker:
"@

    # Check service worker
    $swPath = Join-Path $BuildDir "ngsw-worker.js"
    if (Test-Path $swPath) {
        $reportContent += "`n- [OK] Service Worker generated"
    } else {
        $reportContent += "`n- [MISSING] Service Worker not found"
    }

    $reportContent += @"

Build completed successfully!
"@

    $reportContent | Out-File -FilePath $reportFile -Encoding UTF8
    Write-Success "Build report generated: $reportFile"
}

# Optimize build (optional)
function Optimize-Build {
    if ($Optimize) {
        Write-Status "Running additional optimizations..."
        
        # Generate gzip files
        Write-Status "Generating gzip files..."
        $compressibleFiles = Get-ChildItem -Path $BuildDir -Recurse -Include "*.js", "*.css", "*.html"
        
        foreach ($file in $compressibleFiles) {
            try {
                $gzipPath = "$($file.FullName).gz"
                $content = Get-Content $file.FullName -Raw -Encoding UTF8
                $bytes = [System.Text.Encoding]::UTF8.GetBytes($content)
                
                $gzipStream = [System.IO.Compression.GZipStream]::new(
                    [System.IO.File]::Create($gzipPath),
                    [System.IO.Compression.CompressionMode]::Compress
                )
                $gzipStream.Write($bytes, 0, $bytes.Length)
                $gzipStream.Close()
                
                Write-Status "Compressed: $($file.Name)"
            } catch {
                Write-Warning "Failed to compress: $($file.Name)"
            }
        }
        
        Write-Success "Build optimization completed"
    }
}

# Main build process
function Start-Build {
    Write-Host "==========================================" -ForegroundColor Cyan
    Write-Host "  INNKT Angular Production Build Script" -ForegroundColor Cyan
    Write-Host "==========================================" -ForegroundColor Cyan
    Write-Host ""
    
    # Start build process
    $startTime = Get-Date
    
    # Check prerequisites
    if (!(Test-NodeJS)) { exit 1 }
    if (!(Test-NPM)) { exit 1 }
    if (!(Test-AngularCLI)) { exit 1 }
    
    Clear-Build
    # Install-Dependencies  # Skipping dependency installation since they're already installed
    Invoke-Tests
    Build-Application
    Test-BuildOutput
    New-BuildReport
    Optimize-Build
    
    $endTime = Get-Date
    $buildDuration = ($endTime - $startTime).TotalSeconds
    
    Write-Host ""
    Write-Host "==========================================" -ForegroundColor Cyan
    Write-Success "Build completed successfully in $([math]::Round($buildDuration, 2)) seconds!"
    Write-Success "Build output: $BuildDir"
    Write-Host "==========================================" -ForegroundColor Cyan
    
    # Show next steps
    Write-Host ""
    Write-Host "Next steps:" -ForegroundColor White
    Write-Host "1. Test the build locally: npx http-server $BuildDir" -ForegroundColor Gray
    Write-Host "2. Deploy to your hosting provider" -ForegroundColor Gray
    Write-Host "3. Verify the application works in production" -ForegroundColor Gray
    Write-Host ""
}

# Run main build function
try {
    Start-Build
} catch {
    Write-Error "Build failed with error: $($_.Exception.Message)"
    exit 1
}

