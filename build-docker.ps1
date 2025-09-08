# PowerShell script to build all Docker images for innkt platform
param(
    [string]$Environment = "production",
    [switch]$NoCache = $false,
    [switch]$Push = $false,
    [string]$Registry = "",
    [string]$Tag = "latest"
)

Write-Host "🐳 Building innkt Platform Docker Images" -ForegroundColor Green
Write-Host "=========================================" -ForegroundColor Green

$buildResults = @()
$overallSuccess = $true

# Function to build Docker image
function Build-DockerImage {
    param(
        [string]$ServiceName,
        [string]$Context,
        [string]$Dockerfile,
        [string]$ImageName
    )
    
    Write-Host "`n🔨 Building $ServiceName..." -ForegroundColor Cyan
    Write-Host "Context: $Context" -ForegroundColor Gray
    Write-Host "Dockerfile: $Dockerfile" -ForegroundColor Gray
    Write-Host "Image: $ImageName" -ForegroundColor Gray
    
    try {
        $buildArgs = @("build")
        
        if ($NoCache) {
            $buildArgs += "--no-cache"
        }
        
        $buildArgs += "-f", $Dockerfile
        $buildArgs += "-t", $ImageName
        $buildArgs += $Context
        
        $result = & docker $buildArgs
        
        if ($LASTEXITCODE -eq 0) {
            Write-Host "✅ $ServiceName built successfully!" -ForegroundColor Green
            $buildResults += @{
                Service = $ServiceName
                Status = "SUCCESS"
                Image = $ImageName
            }
        } else {
            Write-Host "❌ $ServiceName build failed!" -ForegroundColor Red
            $buildResults += @{
                Service = $ServiceName
                Status = "FAILED"
                Image = $ImageName
            }
            $script:overallSuccess = $false
        }
        
    } catch {
        Write-Host "💥 Error building $ServiceName : $($_.Exception.Message)" -ForegroundColor Red
        $buildResults += @{
            Service = $ServiceName
            Status = "ERROR"
            Image = $ImageName
        }
        $script:overallSuccess = $false
    }
}

# Function to push Docker image
function Push-DockerImage {
    param(
        [string]$ImageName
    )
    
    Write-Host "📤 Pushing $ImageName..." -ForegroundColor Yellow
    
    try {
        $result = & docker push $ImageName
        
        if ($LASTEXITCODE -eq 0) {
            Write-Host "✅ $ImageName pushed successfully!" -ForegroundColor Green
        } else {
            Write-Host "❌ $ImageName push failed!" -ForegroundColor Red
            $script:overallSuccess = $false
        }
        
    } catch {
        Write-Host "💥 Error pushing $ImageName : $($_.Exception.Message)" -ForegroundColor Red
        $script:overallSuccess = $false
    }
}

# Define services to build
$services = @(
    @{
        Name = "Officer"
        Context = "./Backend/innkt.Officer"
        Dockerfile = "Dockerfile"
        ImageName = "innkt/officer:$Tag"
    },
    @{
        Name = "NeuroSpark"
        Context = "./Backend/innkt.NeuroSpark/innkt.NeuroSpark"
        Dockerfile = "Dockerfile"
        ImageName = "innkt/neurospark:$Tag"
    },
    @{
        Name = "Seer"
        Context = "./Backend/innkt.Seer"
        Dockerfile = "Dockerfile"
        ImageName = "innkt/seer:$Tag"
    },
    @{
        Name = "Messaging"
        Context = "./Backend/innkt.Messaging"
        Dockerfile = "Dockerfile"
        ImageName = "innkt/messaging:$Tag"
    },
    @{
        Name = "Frontend"
        Context = "./Frontend/innkt.react"
        Dockerfile = "Dockerfile"
        ImageName = "innkt/frontend:$Tag"
    }
)

# Build all services
Write-Host "🚀 Starting Docker builds..." -ForegroundColor Yellow
Write-Host "Environment: $Environment" -ForegroundColor White
Write-Host "Tag: $Tag" -ForegroundColor White
Write-Host "No Cache: $NoCache" -ForegroundColor White
Write-Host "Push: $Push" -ForegroundColor White
Write-Host ""

foreach ($service in $services) {
    $imageName = $service.ImageName
    
    if ($Registry) {
        $imageName = "$Registry/$($service.ImageName)"
    }
    
    Build-DockerImage -ServiceName $service.Name -Context $service.Context -Dockerfile $service.Dockerfile -ImageName $imageName
}

# Push images if requested
if ($Push -and $overallSuccess) {
    Write-Host "`n📤 Pushing images to registry..." -ForegroundColor Yellow
    
    foreach ($service in $services) {
        $imageName = $service.ImageName
        
        if ($Registry) {
            $imageName = "$Registry/$($service.ImageName)"
        }
        
        Push-DockerImage -ImageName $imageName
    }
}

# Display results summary
Write-Host "`n📊 Build Results Summary" -ForegroundColor Yellow
Write-Host "========================" -ForegroundColor Yellow

foreach ($result in $buildResults) {
    $statusColor = switch ($result.Status) {
        "SUCCESS" { "Green" }
        "FAILED" { "Red" }
        "ERROR" { "Red" }
        default { "Yellow" }
    }
    
    Write-Host "$($result.Service): " -NoNewline
    Write-Host $result.Status -ForegroundColor $statusColor
    Write-Host "  Image: $($result.Image)" -ForegroundColor Gray
}

# Overall result
Write-Host "`n🎯 Overall Result: " -NoNewline
if ($overallSuccess) {
    Write-Host "ALL BUILDS SUCCESSFUL! 🎉" -ForegroundColor Green
} else {
    Write-Host "SOME BUILDS FAILED! ❌" -ForegroundColor Red
}

# Build information
Write-Host "`n📋 Build Information:" -ForegroundColor Yellow
Write-Host "  Environment: $Environment" -ForegroundColor White
Write-Host "  Tag: $Tag" -ForegroundColor White
Write-Host "  Registry: $(if ($Registry) { $Registry } else { 'Local' })" -ForegroundColor White
Write-Host "  No Cache: $NoCache" -ForegroundColor White
Write-Host "  Push: $Push" -ForegroundColor White

# Exit with appropriate code
if ($overallSuccess) {
    Write-Host "`n🎉 All Docker images built successfully!" -ForegroundColor Green
    exit 0
} else {
    Write-Host "`n💥 Some Docker builds failed. Please check the output above." -ForegroundColor Red
    exit 1
}
