# Build and Deploy Script with Immutable Tags (PowerShell)
# Usage: .\scripts\build-and-deploy.ps1 [service-name] [environment]

param(
    [string]$ServiceName = "messaging",
    [string]$Environment = "dev"
)

# Get commit hash and timestamp
$CommitHash = git rev-parse --short HEAD
$Timestamp = Get-Date -Format "yyyyMMdd-HHmmss"

# Create immutable tag
$ImmutableTag = "sha-$CommitHash-$Timestamp"
$ImageName = "innkt-$ServiceName"

Write-Host "🏗️  Building $ImageName`:$ImmutableTag" -ForegroundColor Green

# Build the Docker image
switch ($ServiceName) {
    "messaging" {
        docker build -t "${ImageName}:${ImmutableTag}" Backend/innkt.Messaging/
    }
    "officer" {
        docker build -t "${ImageName}:${ImmutableTag}" Backend/innkt.Officer/
    }
    "neurospark" {
        docker build -t "${ImageName}:${ImmutableTag}" Backend/innkt.NeuroSpark/
    }
    "seer" {
        docker build -t "${ImageName}:${ImmutableTag}" Backend/innkt.Seer/
    }
    "frontend" {
        docker build -t "${ImageName}:${ImmutableTag}" Frontend/
    }
    default {
        Write-Host "❌ Unknown service: $ServiceName" -ForegroundColor Red
        Write-Host "Available services: messaging, officer, neurospark, seer, frontend" -ForegroundColor Yellow
        exit 1
    }
}

if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Docker build failed" -ForegroundColor Red
    exit 1
}

Write-Host "✅ Image built successfully: $ImageName`:$ImmutableTag" -ForegroundColor Green

# Deploy to Kubernetes
Write-Host "🚀 Deploying to Kubernetes..." -ForegroundColor Blue
kubectl set image deployment/${ServiceName}-service ${ServiceName}-service="${ImageName}:${ImmutableTag}" -n innkt

if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Kubernetes deployment failed" -ForegroundColor Red
    exit 1
}

Write-Host "⏳ Waiting for deployment to complete..." -ForegroundColor Yellow
kubectl rollout status deployment/${ServiceName}-service -n innkt --timeout=300s

if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Deployment rollout failed" -ForegroundColor Red
    exit 1
}

Write-Host "✅ Deployment completed successfully!" -ForegroundColor Green
Write-Host "📊 Image: $ImageName`:$ImmutableTag" -ForegroundColor Cyan
Write-Host "🔗 Commit: $CommitHash" -ForegroundColor Cyan
Write-Host "⏰ Timestamp: $Timestamp" -ForegroundColor Cyan

# Show pod status
Write-Host "📋 Pod Status:" -ForegroundColor Blue
kubectl get pods -n innkt -l app=$ServiceName
