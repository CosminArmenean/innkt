# INNKT Microservices Docker Startup Script (PowerShell)
Write-Host "🚀 Starting INNKT Microservices Stack..." -ForegroundColor Cyan

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

# Check if Docker is running
try {
    docker info | Out-Null
    Write-Success "Docker is running"
} catch {
    Write-Error "Docker is not running. Please start Docker Desktop first."
    exit 1
}

# Check if docker-compose is available
try {
    docker-compose --version | Out-Null
    Write-Success "docker-compose is available"
} catch {
    Write-Error "docker-compose is not installed. Please install it first."
    exit 1
}

# Stop any existing containers
Write-Status "Stopping existing containers..."
docker-compose down

# Start infrastructure services first
Write-Status "Starting infrastructure services (PostgreSQL, Redis, Kafka, Zookeeper)..."
docker-compose up -d postgres redis zookeeper kafka

# Wait for infrastructure services to be healthy
Write-Status "Waiting for infrastructure services to be healthy..."
Start-Sleep -Seconds 30

# Check infrastructure health
Write-Status "Checking infrastructure health..."

# Check PostgreSQL
try {
    docker-compose exec -T postgres pg_isready -U innkt_user -d innkt_db | Out-Null
    Write-Success "PostgreSQL is healthy"
} catch {
    Write-Error "PostgreSQL is not healthy"
    exit 1
}

# Check Redis
try {
    docker-compose exec -T redis redis-cli --raw incr ping | Out-Null
    Write-Success "Redis is healthy"
} catch {
    Write-Error "Redis is not healthy"
    exit 1
}

# Check Kafka
try {
    docker-compose exec -T kafka kafka-topics --bootstrap-server localhost:9092 --list | Out-Null
    Write-Success "Kafka is healthy"
} catch {
    Write-Error "Kafka is not healthy"
    exit 1
}

# Start microservices
Write-Status "Starting microservices (Officer, NeuroSpark)..."
docker-compose up -d officer neurospark

# Wait for microservices to be healthy
Write-Status "Waiting for microservices to be healthy..."
Start-Sleep -Seconds 30

# Check microservices health
Write-Status "Checking microservices health..."

# Check Officer service
try {
    Invoke-WebRequest -Uri "http://localhost:5004/health" -UseBasicParsing | Out-Null
    Write-Success "Officer service is healthy"
} catch {
    Write-Warning "Officer service health check failed (may still be starting)"
}

# Check NeuroSpark service
try {
    Invoke-WebRequest -Uri "http://localhost:5006/health" -UseBasicParsing | Out-Null
    Write-Success "NeuroSpark service is healthy"
} catch {
    Write-Warning "NeuroSpark service health check failed (may still be starting)"
}

# Start web client
Write-Status "Starting web client..."
docker-compose up -d web-client

# Start monitoring services
Write-Status "Starting monitoring services (Prometheus, Grafana)..."
docker-compose up -d prometheus grafana

# Start Nginx
Write-Status "Starting Nginx load balancer..."
docker-compose up -d nginx

# Start development tools
Write-Status "Starting development tools..."
docker-compose up -d adminer kafka-ui redis-commander

# Final status
Write-Status "Waiting for all services to be ready..."
Start-Sleep -Seconds 20

Write-Success "🎉 INNKT Microservices Stack is starting up!"
Write-Host ""
Write-Host "📊 Service Status:" -ForegroundColor Cyan
Write-Host "  • PostgreSQL: localhost:5432"
Write-Host "  • Redis: localhost:6379"
Write-Host "  • Kafka: localhost:9092"
Write-Host "  • Zookeeper: localhost:2181"
Write-Host "  • Officer Service: http://localhost:5004"
Write-Host "  • NeuroSpark Service: http://localhost:5006"
Write-Host "  • Web Client: http://localhost:3000"
Write-Host "  • Nginx Load Balancer: http://localhost:80"
Write-Host "  • Prometheus: http://localhost:9090"
Write-Host "  • Grafana: http://localhost:3001 (admin/admin123)"
Write-Host "  • Adminer (DB): http://localhost:8080"
Write-Host "  • Kafka UI: http://localhost:8081"
Write-Host "  • Redis Commander: http://localhost:8082"
Write-Host ""
Write-Host "🔍 Check service status with: docker-compose ps" -ForegroundColor Yellow
Write-Host "📋 View logs with: docker-compose logs -f [service-name]" -ForegroundColor Yellow
Write-Host "🛑 Stop all services with: docker-compose down" -ForegroundColor Yellow
Write-Host ""
Write-Success "All services are starting up. Please wait a few minutes for full initialization."



