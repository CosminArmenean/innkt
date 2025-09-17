# Fix MongoDB Replica Set for Change Streams
Write-Host "🔧 Configuring MongoDB Replica Set for Change Streams" -ForegroundColor Cyan
Write-Host "=================================================" -ForegroundColor Cyan

Write-Host "`n📋 Step 1: Stopping current MongoDB..." -ForegroundColor Yellow
docker stop innkt-mongodb

Write-Host "`n📋 Step 2: Starting MongoDB with replica set..." -ForegroundColor Yellow
docker run -d --name innkt-mongodb-rs `
  --network innkt_innkt-network `
  -p 27017:27017 `
  -e MONGO_INITDB_ROOT_USERNAME=admin `
  -e MONGO_INITDB_ROOT_PASSWORD=password `
  mongo:7 --replSet rs0

Write-Host "`n⏳ Waiting for MongoDB to start..." -ForegroundColor Yellow
Start-Sleep -Seconds 10

Write-Host "`n📋 Step 3: Initializing replica set..." -ForegroundColor Yellow
$initScript = @"
rs.initiate({
  _id: 'rs0',
  members: [
    { _id: 0, host: 'localhost:27017' }
  ]
})
"@

# Save script to temp file
$initScript | Out-File -FilePath "init-replica-set.js" -Encoding UTF8

# Execute the replica set initialization
docker exec innkt-mongodb-rs mongosh --eval "rs.initiate({_id: 'rs0', members: [{_id: 0, host: 'localhost:27017'}]})"

Write-Host "`n⏳ Waiting for replica set to initialize..." -ForegroundColor Yellow
Start-Sleep -Seconds 15

Write-Host "`n📋 Step 4: Checking replica set status..." -ForegroundColor Yellow
docker exec innkt-mongodb-rs mongosh --eval "rs.status()"

Write-Host "`n✅ MongoDB Replica Set Configuration Complete!" -ForegroundColor Green
Write-Host "🔄 You can now restart your Social service to enable Change Streams" -ForegroundColor Green

# Clean up
Remove-Item "init-replica-set.js" -ErrorAction SilentlyContinue

Write-Host "`n📋 Next Steps:" -ForegroundColor Cyan
Write-Host "1. Update your MongoDB connection string to include replica set" -ForegroundColor White
Write-Host "2. Restart the Social service" -ForegroundColor White
Write-Host "3. Test real-time notifications" -ForegroundColor White
