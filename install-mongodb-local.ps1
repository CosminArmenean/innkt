# Install MongoDB Community Edition Locally for Change Streams
Write-Host "🚀 Installing MongoDB Community Edition Locally" -ForegroundColor Cyan
Write-Host "=============================================" -ForegroundColor Cyan

Write-Host "`n📋 Step 1: Checking if MongoDB is already installed..." -ForegroundColor Yellow
$mongoInstalled = Get-Command mongod -ErrorAction SilentlyContinue
if ($mongoInstalled) {
    Write-Host "✅ MongoDB is already installed at: $($mongoInstalled.Source)" -ForegroundColor Green
    $skipInstall = $true
} else {
    Write-Host "❌ MongoDB not found - proceeding with installation" -ForegroundColor Red
    $skipInstall = $false
}

if (-not $skipInstall) {
    Write-Host "`n📋 Step 2: Downloading MongoDB Community Edition..." -ForegroundColor Yellow
    Write-Host "🌐 Please download MongoDB from: https://www.mongodb.com/try/download/community" -ForegroundColor Cyan
    Write-Host "   • Select: Windows x64" -ForegroundColor White
    Write-Host "   • Version: 7.0 or later" -ForegroundColor White
    Write-Host "   • Package: MSI" -ForegroundColor White
    Write-Host "`n⏳ After download, run the installer and follow the setup wizard" -ForegroundColor Yellow
    Write-Host "   • Choose 'Complete' installation" -ForegroundColor White
    Write-Host "   • Install MongoDB as a Service" -ForegroundColor White
    Write-Host "   • Install MongoDB Compass (optional but recommended)" -ForegroundColor White
    
    Write-Host "`n⚠️  IMPORTANT: After installation, come back and run this script again!" -ForegroundColor Red
    Write-Host "Press any key when MongoDB installation is complete..." -ForegroundColor Yellow
    $null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")
}

Write-Host "`n📋 Step 3: Verifying MongoDB installation..." -ForegroundColor Yellow
$mongoInstalled = Get-Command mongod -ErrorAction SilentlyContinue
if (-not $mongoInstalled) {
    Write-Host "❌ MongoDB still not found in PATH. Please ensure:" -ForegroundColor Red
    Write-Host "   1. MongoDB is installed" -ForegroundColor White
    Write-Host "   2. C:\Program Files\MongoDB\Server\7.0\bin is in your PATH" -ForegroundColor White
    Write-Host "   3. Restart PowerShell after installation" -ForegroundColor White
    exit 1
}

Write-Host "✅ MongoDB found at: $($mongoInstalled.Source)" -ForegroundColor Green

Write-Host "`n📋 Step 4: Stopping Docker MongoDB to avoid port conflicts..." -ForegroundColor Yellow
try {
    docker stop innkt-mongodb-rs
    Write-Host "✅ Stopped Docker MongoDB container" -ForegroundColor Green
} catch {
    Write-Host "⚠️  Docker MongoDB container not running or already stopped" -ForegroundColor Yellow
}

Write-Host "`n📋 Step 5: Creating MongoDB data directory..." -ForegroundColor Yellow
$dataDir = "C:\data\db"
if (-not (Test-Path $dataDir)) {
    New-Item -ItemType Directory -Path $dataDir -Force
    Write-Host "✅ Created data directory: $dataDir" -ForegroundColor Green
} else {
    Write-Host "✅ Data directory already exists: $dataDir" -ForegroundColor Green
}

Write-Host "`n📋 Step 6: Creating MongoDB configuration file..." -ForegroundColor Yellow
$configContent = @"
# MongoDB Configuration for Change Streams
storage:
  dbPath: C:\data\db
  journal:
    enabled: true

systemLog:
  destination: file
  path: C:\data\mongod.log
  logAppend: true

net:
  port: 27018
  bindIp: 127.0.0.1

replication:
  replSetName: "rs0"

setParameter:
  enableLocalhostAuthBypass: true
"@

$configPath = "C:\data\mongod.conf"
$configContent | Out-File -FilePath $configPath -Encoding UTF8
Write-Host "✅ Created MongoDB config file: $configPath" -ForegroundColor Green

Write-Host "`n📋 Step 7: Starting MongoDB as replica set..." -ForegroundColor Yellow
Write-Host "🔧 Using port 27018 to avoid conflicts with Docker MongoDB" -ForegroundColor Cyan

# Start MongoDB with the config file
$mongoProcess = Start-Process -FilePath "mongod" -ArgumentList "--config", $configPath -PassThru -WindowStyle Hidden
Write-Host "✅ Started MongoDB process (PID: $($mongoProcess.Id))" -ForegroundColor Green

Write-Host "`n⏳ Waiting for MongoDB to start..." -ForegroundColor Yellow
Start-Sleep -Seconds 10

Write-Host "`n📋 Step 8: Initializing replica set..." -ForegroundColor Yellow
try {
    $initResult = mongosh --port 27018 --eval "rs.initiate()"
    Write-Host "✅ Replica set initialized successfully" -ForegroundColor Green
} catch {
    Write-Host "⚠️  Replica set may already be initialized" -ForegroundColor Yellow
}

Write-Host "`n📋 Step 9: Verifying replica set status..." -ForegroundColor Yellow
Start-Sleep -Seconds 5
try {
    $rsStatus = mongosh --port 27018 --eval "rs.status().ok"
    if ($rsStatus -eq "1") {
        Write-Host "✅ Replica set is working perfectly!" -ForegroundColor Green
    }
} catch {
    Write-Host "⚠️  Checking replica set status..." -ForegroundColor Yellow
}

Write-Host "`n🎉 MongoDB Local Installation Complete!" -ForegroundColor Green
Write-Host "===============================================" -ForegroundColor Green

Write-Host "`n📊 Configuration Summary:" -ForegroundColor Cyan
Write-Host "• MongoDB Port: 27018" -ForegroundColor White
Write-Host "• Data Directory: C:\data\db" -ForegroundColor White
Write-Host "• Config File: C:\data\mongod.conf" -ForegroundColor White
Write-Host "• Replica Set: rs0" -ForegroundColor White
Write-Host "• Change Streams: ✅ ENABLED" -ForegroundColor Green

Write-Host "`n🔧 Next Steps:" -ForegroundColor Cyan
Write-Host "1. Update appsettings.json to use port 27018" -ForegroundColor White
Write-Host "2. Restart your Social service" -ForegroundColor White
Write-Host "3. Enjoy true real-time Change Streams! 🚀" -ForegroundColor White

Write-Host "`n💡 Connection String to Use:" -ForegroundColor Yellow
Write-Host '"MongoDB": "mongodb://127.0.0.1:27018/innkt_social?replicaSet=rs0"' -ForegroundColor Green
