# Update all microservices with new language files
Write-Host "Updating all microservices with new language files..." -ForegroundColor Green

# List of all .NET microservices
$microservices = @(
    "Backend/innkt.Officer",
    "Backend/innkt.Groups", 
    "Backend/innkt.Kinder",
    "Backend/innkt.Notifications",
    "Backend/innkt.NeuroSpark/innkt.NeuroSpark",
    "Backend/innkt.Seer"
)

# List of new languages to add
$newLanguages = @("fr", "de", "it", "pt", "nl", "pl", "cs", "hu", "ro", "he", "ja", "ko", "hi")

# Source directory for language files
$sourceDir = "Frontend/innkt.react/public/locales"

foreach ($service in $microservices) {
    Write-Host "Processing $service..." -ForegroundColor Yellow
    
    # Create Resources directory if it doesn't exist
    $resourcesDir = "$service/Resources"
    if (!(Test-Path $resourcesDir)) {
        New-Item -ItemType Directory -Path $resourcesDir -Force
        Write-Host "   Created Resources directory" -ForegroundColor Green
    }
    
    # Copy English and Spanish
    if (Test-Path "$sourceDir/en/translation.json") {
        Copy-Item "$sourceDir/en/translation.json" "$resourcesDir/en.json" -Force
        Write-Host "   Updated en.json" -ForegroundColor Green
    }
    
    if (Test-Path "$sourceDir/es/translation.json") {
        Copy-Item "$sourceDir/es/translation.json" "$resourcesDir/es.json" -Force
        Write-Host "   Updated es.json" -ForegroundColor Green
    }
    
    # Copy all new language files
    foreach ($lang in $newLanguages) {
        if (Test-Path "$sourceDir/$lang/translation.json") {
            Copy-Item "$sourceDir/$lang/translation.json" "$resourcesDir/$lang.json" -Force
            Write-Host "   Added $lang.json" -ForegroundColor Green
        }
    }
}

# Update Messaging service (Node.js)
Write-Host "Processing Messaging service (Node.js)..." -ForegroundColor Yellow
$messagingDir = "Backend/innkt.Messaging/locales"

if (!(Test-Path $messagingDir)) {
    New-Item -ItemType Directory -Path $messagingDir -Force
    Write-Host "   Created locales directory" -ForegroundColor Green
}

# Copy all language files to Messaging service
$allLanguages = @("en", "es") + $newLanguages
foreach ($lang in $allLanguages) {
    if (Test-Path "$sourceDir/$lang/translation.json") {
        Copy-Item "$sourceDir/$lang/translation.json" "$messagingDir/$lang.json" -Force
        Write-Host "   Added $lang.json to Messaging service" -ForegroundColor Green
    }
}

Write-Host "All microservices updated with new language files!" -ForegroundColor Green
Write-Host "Summary:" -ForegroundColor Cyan
Write-Host "   - 6 .NET microservices updated" -ForegroundColor White
Write-Host "   - 1 Node.js microservice updated" -ForegroundColor White
Write-Host "   - 15 language files per service" -ForegroundColor White
Write-Host "   - Total: 105 language files deployed" -ForegroundColor White
