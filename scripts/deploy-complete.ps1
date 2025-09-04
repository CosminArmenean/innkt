# INNKT Platform Complete Deployment Script (PowerShell)
# This script deploys the entire INNKT platform with monitoring

param(
    [switch]$SkipLoadTests,
    [switch]$SkipMonitoring,
    [switch]$Force
)

# Configuration
$NAMESPACE = "innkt"
$MONITORING_NAMESPACE = "monitoring"
$CLUSTER_NAME = "innkt-cluster"

Write-Host "🚀 INNKT Platform Complete Deployment" -ForegroundColor Blue
Write-Host "=================================="

# Function to print status
function Write-Status {
    param([string]$Message)
    Write-Host "✅ $Message" -ForegroundColor Green
}

function Write-Warning {
    param([string]$Message)
    Write-Host "⚠️  $Message" -ForegroundColor Yellow
}

function Write-Error {
    param([string]$Message)
    Write-Host "❌ $Message" -ForegroundColor Red
}

# Check prerequisites
function Test-Prerequisites {
    Write-Host "📋 Checking prerequisites..." -ForegroundColor Blue
    
    $commands = @("kubectl", "kind", "docker")
    foreach ($cmd in $commands) {
        if (-not (Get-Command $cmd -ErrorAction SilentlyContinue)) {
            Write-Error "$cmd is not installed"
            exit 1
        }
    }
    
    Write-Status "All prerequisites are installed"
}

# Create Kind cluster
function New-KindCluster {
    Write-Host "🏗️  Creating Kind cluster..." -ForegroundColor Blue
    
    # Check if cluster already exists
    $existingClusters = kind get clusters 2>$null
    if ($existingClusters -contains $CLUSTER_NAME) {
        Write-Warning "Cluster $CLUSTER_NAME already exists"
        if (-not $Force) {
            $response = Read-Host "Do you want to delete and recreate it? (y/N)"
            if ($response -eq "y" -or $response -eq "Y") {
                kind delete cluster --name $CLUSTER_NAME
            } else {
                Write-Status "Using existing cluster"
                return
            }
        } else {
            kind delete cluster --name $CLUSTER_NAME
        }
    }
    
    # Create cluster configuration
    $kindConfig = @"
kind: Cluster
apiVersion: kind.x-k8s.io/v1alpha4
nodes:
- role: control-plane
  kubeadmConfigPatches:
  - |
    kind: InitConfiguration
    nodeRegistration:
      kubeletExtraArgs:
        node-labels: "ingress-ready=true"
  extraPortMappings:
  - containerPort: 80
    hostPort: 80
    protocol: TCP
  - containerPort: 443
    hostPort: 443
    protocol: TCP
  - containerPort: 3000
    hostPort: 3000
    protocol: TCP
  - containerPort: 9090
    hostPort: 9090
    protocol: TCP
"@
    
    $kindConfig | Out-File -FilePath "kind-config.yaml" -Encoding UTF8
    kind create cluster --name $CLUSTER_NAME --config kind-config.yaml
    Remove-Item "kind-config.yaml" -Force
    Write-Status "Kind cluster created successfully"
}

# Build and load Docker images
function Build-AndLoadImages {
    Write-Host "🔨 Building and loading Docker images..." -ForegroundColor Blue
    
    # Build Officer service
    Write-Host "Building Officer service..."
    docker build -t innkt-officer:latest -f Backend/innkt.Officer/Dockerfile Backend/
    kind load docker-image innkt-officer:latest --name $CLUSTER_NAME
    Write-Status "Officer service image loaded"
    
    # Build Frontier service
    Write-Host "Building Frontier service..."
    docker build -t innkt-frontier:latest -f Backend/innkt.Frontier/Dockerfile Backend/
    kind load docker-image innkt-frontier:latest --name $CLUSTER_NAME
    Write-Status "Frontier service image loaded"
    
    # Build NeuroSpark service
    Write-Host "Building NeuroSpark service..."
    docker build -t innkt-neurospark:latest -f Backend/innkt.NeuroSpark/innkt.NeuroSpark/Dockerfile Backend/
    kind load docker-image innkt-neurospark:latest --name $CLUSTER_NAME
    Write-Status "NeuroSpark service image loaded"
    
    # Build Messaging service
    Write-Host "Building Messaging service..."
    docker build -t innkt-messaging:latest -f Backend/innkt.Messaging/Dockerfile Backend/innkt.Messaging/
    kind load docker-image innkt-messaging:latest --name $CLUSTER_NAME
    Write-Status "Messaging service image loaded"
    
    # Build Frontend
    Write-Host "Building Frontend..."
    docker build -t innkt-frontend:latest -f Frontend/innkt.react/Dockerfile Frontend/innkt.react/
    kind load docker-image innkt-frontend:latest --name $CLUSTER_NAME
    Write-Status "Frontend image loaded"
}

# Deploy infrastructure
function Deploy-Infrastructure {
    Write-Host "🏗️  Deploying infrastructure..." -ForegroundColor Blue
    
    # Create namespaces
    kubectl apply -f k8s/namespace.yaml
    kubectl create namespace monitoring --dry-run=client -o yaml | kubectl apply -f -
    Write-Status "Namespaces created"
    
    # Deploy infrastructure services
    kubectl apply -f k8s/infrastructure.yaml
    Write-Status "Infrastructure services deployed"
    
    # Wait for infrastructure to be ready
    Write-Host "Waiting for infrastructure services to be ready..."
    kubectl wait --for=condition=available --timeout=300s deployment/postgres -n $NAMESPACE
    kubectl wait --for=condition=available --timeout=300s deployment/redis -n $NAMESPACE
    kubectl wait --for=condition=available --timeout=300s deployment/mongodb -n $NAMESPACE
    Write-Status "Infrastructure services are ready"
}

# Deploy application services
function Deploy-Application {
    Write-Host "🚀 Deploying application services..." -ForegroundColor Blue
    
    # Deploy configuration
    kubectl apply -f k8s/configmap.yaml
    kubectl apply -f k8s/secrets.yaml
    Write-Status "Configuration deployed"
    
    # Deploy services
    kubectl apply -f k8s/officer-deployment.yaml
    kubectl apply -f k8s/frontier-deployment.yaml
    kubectl apply -f k8s/neurospark-deployment.yaml
    kubectl apply -f k8s/messaging-deployment.yaml
    kubectl apply -f k8s/frontend-deployment.yaml
    Write-Status "Application services deployed"
    
    # Wait for services to be ready
    Write-Host "Waiting for application services to be ready..."
    kubectl wait --for=condition=available --timeout=300s deployment/officer-service -n $NAMESPACE
    kubectl wait --for=condition=available --timeout=300s deployment/messaging-service -n $NAMESPACE
    kubectl wait --for=condition=available --timeout=300s deployment/frontend-service -n $NAMESPACE
    Write-Status "Application services are ready"
}

# Deploy monitoring
function Deploy-Monitoring {
    if ($SkipMonitoring) {
        Write-Warning "Skipping monitoring deployment"
        return
    }
    
    Write-Host "📊 Deploying monitoring stack..." -ForegroundColor Blue
    
    # Deploy Prometheus
    kubectl apply -f monitoring/prometheus.yml
    Write-Status "Prometheus deployed"
    
    # Deploy Grafana
    kubectl apply -f monitoring/grafana/dashboard.yaml
    Write-Status "Grafana deployed"
    
    # Wait for monitoring to be ready
    Write-Host "Waiting for monitoring services to be ready..."
    kubectl wait --for=condition=available --timeout=300s deployment/prometheus-server -n $MONITORING_NAMESPACE
    kubectl wait --for=condition=available --timeout=300s deployment/grafana -n $MONITORING_NAMESPACE
    Write-Status "Monitoring services are ready"
}

# Deploy ingress
function Deploy-Ingress {
    Write-Host "🌐 Deploying ingress..." -ForegroundColor Blue
    
    # Install NGINX ingress controller
    kubectl apply -f https://raw.githubusercontent.com/kubernetes/ingress-nginx/main/deploy/static/provider/kind/deploy.yaml
    Write-Status "NGINX ingress controller installed"
    
    # Wait for ingress controller
    kubectl wait --namespace ingress-nginx --for=condition=ready pod --selector=app.kubernetes.io/component=controller --timeout=300s
    Write-Status "NGINX ingress controller is ready"
    
    # Deploy ingress
    kubectl apply -f k8s/ingress.yaml
    Write-Status "Ingress deployed"
}

# Run health checks
function Test-HealthChecks {
    Write-Host "🏥 Running health checks..." -ForegroundColor Blue
    
    # Port forward services for testing
    Start-Process kubectl -ArgumentList "port-forward", "service/officer-service", "5001:5001", "-n", $NAMESPACE -WindowStyle Hidden
    Start-Process kubectl -ArgumentList "port-forward", "service/messaging-service", "5003:5003", "-n", $NAMESPACE -WindowStyle Hidden
    Start-Process kubectl -ArgumentList "port-forward", "service/frontend-service", "8080:80", "-n", $NAMESPACE -WindowStyle Hidden
    
    if (-not $SkipMonitoring) {
        Start-Process kubectl -ArgumentList "port-forward", "service/grafana", "3000:80", "-n", $MONITORING_NAMESPACE -WindowStyle Hidden
        Start-Process kubectl -ArgumentList "port-forward", "service/prometheus-server", "9090:80", "-n", $MONITORING_NAMESPACE -WindowStyle Hidden
    }
    
    # Wait for port forwarding
    Start-Sleep -Seconds 10
    
    # Test health endpoints
    Write-Host "Testing Officer service..."
    try {
        $response = Invoke-WebRequest -Uri "http://localhost:5001/health" -TimeoutSec 10
        if ($response.StatusCode -eq 200) {
            Write-Status "Officer service is healthy"
        }
    } catch {
        Write-Error "Officer service health check failed"
    }
    
    Write-Host "Testing Messaging service..."
    try {
        $response = Invoke-WebRequest -Uri "http://localhost:5003/health" -TimeoutSec 10
        if ($response.StatusCode -eq 200) {
            Write-Status "Messaging service is healthy"
        }
    } catch {
        Write-Error "Messaging service health check failed"
    }
    
    Write-Host "Testing Frontend..."
    try {
        $response = Invoke-WebRequest -Uri "http://localhost:8080" -TimeoutSec 10
        if ($response.StatusCode -eq 200) {
            Write-Status "Frontend is accessible"
        }
    } catch {
        Write-Error "Frontend health check failed"
    }
    
    if (-not $SkipMonitoring) {
        Write-Host "Testing Grafana..."
        try {
            $response = Invoke-WebRequest -Uri "http://localhost:3000" -TimeoutSec 10
            if ($response.StatusCode -eq 200) {
                Write-Status "Grafana is accessible"
            }
        } catch {
            Write-Error "Grafana health check failed"
        }
        
        Write-Host "Testing Prometheus..."
        try {
            $response = Invoke-WebRequest -Uri "http://localhost:9090" -TimeoutSec 10
            if ($response.StatusCode -eq 200) {
                Write-Status "Prometheus is accessible"
            }
        } catch {
            Write-Error "Prometheus health check failed"
        }
    }
}

# Run load tests
function Test-LoadTests {
    if ($SkipLoadTests) {
        Write-Warning "Skipping load tests"
        return
    }
    
    Write-Host "⚡ Running load tests..." -ForegroundColor Blue
    
    Push-Location scripts
    npm install
    node simple-load-test.js
    Pop-Location
    
    Write-Status "Load tests completed"
}

# Display access information
function Show-AccessInfo {
    Write-Host "🌐 Access Information" -ForegroundColor Blue
    Write-Host "=================="
    Write-Host ""
    Write-Host "Frontend Application:"
    Write-Host "  URL: http://localhost:8080"
    Write-Host "  Port Forward: kubectl port-forward service/frontend-service 8080:80 -n $NAMESPACE"
    Write-Host ""
    Write-Host "API Services:"
    Write-Host "  Officer API: http://localhost:5001"
    Write-Host "  Messaging API: http://localhost:5003"
    Write-Host "  Port Forward: kubectl port-forward service/officer-service 5001:5001 -n $NAMESPACE"
    Write-Host "  Port Forward: kubectl port-forward service/messaging-service 5003:5003 -n $NAMESPACE"
    Write-Host ""
    
    if (-not $SkipMonitoring) {
        Write-Host "Monitoring:"
        Write-Host "  Grafana: http://localhost:3000 (admin/admin123)"
        Write-Host "  Prometheus: http://localhost:9090"
        Write-Host "  Port Forward: kubectl port-forward service/grafana 3000:80 -n $MONITORING_NAMESPACE"
        Write-Host "  Port Forward: kubectl port-forward service/prometheus-server 9090:80 -n $MONITORING_NAMESPACE"
        Write-Host ""
    }
    
    Write-Host "Kubernetes Dashboard:"
    Write-Host "  kubectl get pods -n $NAMESPACE"
    Write-Host "  kubectl get services -n $NAMESPACE"
    Write-Host "  kubectl logs -f deployment/officer-service -n $NAMESPACE"
    Write-Host ""
    Write-Host "🎉 INNKT Platform deployment completed successfully!" -ForegroundColor Green
}

# Main deployment function
function Main {
    Test-Prerequisites
    New-KindCluster
    Build-AndLoadImages
    Deploy-Infrastructure
    Deploy-Application
    Deploy-Monitoring
    Deploy-Ingress
    Test-HealthChecks
    Test-LoadTests
    Show-AccessInfo
}

# Run main function
Main
