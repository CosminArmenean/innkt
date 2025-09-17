# Simple Infrastructure Startup Script
Write-Host "🚀 Starting INNKT Infrastructure" -ForegroundColor Green
Write-Host "=================================" -ForegroundColor Green

# Check Docker
Write-Host "`n🐳 Checking Docker..." -ForegroundColor Yellow
try {
    docker --version | Out-Null
    Write-Host "✅ Docker is running" -ForegroundColor Green
} catch {
    Write-Host "❌ Docker not available!" -ForegroundColor Red
    exit 1
}

# Stop existing containers
Write-Host "`n🛑 Stopping existing containers..." -ForegroundColor Yellow
docker-compose down 2>$null

# Start infrastructure
Write-Host "`n🗄️ Starting infrastructure services..." -ForegroundColor Cyan
docker-compose up -d

# Wait a bit for services to start
Write-Host "`n⏳ Waiting for services to start..." -ForegroundColor Yellow
Start-Sleep -Seconds 10

# Initialize MongoDB replica set for Change Streams
Write-Host "`n🔧 Setting up MongoDB replica set..." -ForegroundColor Cyan
Write-Host "This is required for real-time Change Streams..." -ForegroundColor Yellow

try {
    # Wait for MongoDB to be ready first
    Start-Sleep -Seconds 5
    
    # Initialize replica set
    docker exec innkt-mongodb mongosh --eval "
    try {
      rs.status();
      print('✅ Replica set already initialized');
    } catch (e) {
      print('🚀 Initializing replica set...');
      rs.initiate({
        _id: 'rs0',
        members: [{ _id: 0, host: 'localhost:27017' }]
      });
      print('✅ Replica set initialized - Change Streams ready!');
    }
    "
    Write-Host "✅ MongoDB replica set configured" -ForegroundColor Green
} catch {
    Write-Host "⚠️ MongoDB replica set setup failed (will try manual setup)" -ForegroundColor Yellow
}

# Check what's running
Write-Host "`n📊 Checking services..." -ForegroundColor Cyan
$ports = @(5433, 6379, 27017, 9092, 2181)
$services = @("PostgreSQL", "Redis", "MongoDB", "Kafka", "Zookeeper")

for ($i = 0; $i -lt $ports.Count; $i++) {
    $port = $ports[$i]
    $service = $services[$i]
    
    try {
        $tcpClient = New-Object System.Net.Sockets.TcpClient
        $tcpClient.Connect("localhost", $port)
        $tcpClient.Close()
        Write-Host "✅ $service (port $port) - Ready" -ForegroundColor Green
    } catch {
        Write-Host "❌ $service (port $port) - Not ready" -ForegroundColor Red
    }
}

Write-Host "`n🎉 Infrastructure startup complete!" -ForegroundColor Green
Write-Host "You can now run: .\start-services.ps1" -ForegroundColor Yellow
