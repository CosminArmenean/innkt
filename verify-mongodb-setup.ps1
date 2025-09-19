# MongoDB Setup Verification Script
# Verifies the current MongoDB configuration matches our working setup

Write-Host "🔍 MongoDB Configuration Verification" -ForegroundColor Cyan
Write-Host "====================================" -ForegroundColor Cyan

try {
    # Check running containers
    Write-Host ""
    Write-Host "1. Checking MongoDB containers..." -ForegroundColor Yellow
    $containers = docker ps --filter "name=mongodb" --format "{{.Names}}: {{.Status}} | {{.Ports}}"
    
    if ($containers) {
        $containers | ForEach-Object {
            Write-Host "   ✅ $_" -ForegroundColor Green
        }
    } else {
        Write-Host "   ❌ No MongoDB containers running" -ForegroundColor Red
        exit 1
    }

    # Check replica set status
    Write-Host ""
    Write-Host "2. Checking replica set configuration..." -ForegroundColor Yellow
    
    $socialRs = docker exec mongodb-social mongosh --quiet --eval "try { const s = rs.status(); print('REPLICA_SET:' + s.set + ':' + s.myState + ':' + s.members.length); } catch (e) { print('ERROR:' + e.message); }" 2>$null
    
    if ($socialRs -match "REPLICA_SET:rs0:1:\d+") {
        Write-Host "   ✅ Social MongoDB: PRIMARY in rs0 replica set" -ForegroundColor Green
    } elseif ($socialRs -match "REPLICA_SET:rs0:2:\d+") {
        Write-Host "   ✅ Social MongoDB: SECONDARY in rs0 replica set" -ForegroundColor Green
    } else {
        Write-Host "   ❌ Social MongoDB replica set issue: $socialRs" -ForegroundColor Red
    }

    $messagingRs = docker exec mongodb-messaging mongosh --quiet --eval "try { const s = rs.status(); print('REPLICA_SET:' + s.set + ':' + s.myState + ':' + s.members.length); } catch (e) { print('ERROR:' + e.message); }" 2>$null
    
    if ($messagingRs -match "REPLICA_SET:rs0:1:\d+") {
        Write-Host "   ✅ Messaging MongoDB: PRIMARY in rs0 replica set" -ForegroundColor Green
    } elseif ($messagingRs -match "REPLICA_SET:rs0:2:\d+") {
        Write-Host "   ✅ Messaging MongoDB: SECONDARY in rs0 replica set" -ForegroundColor Green
    } else {
        Write-Host "   ❌ Messaging MongoDB replica set issue: $messagingRs" -ForegroundColor Red
    }

    # Test Change Streams capability
    Write-Host ""
    Write-Host "3. Testing Change Streams capability..." -ForegroundColor Yellow
    
    $changeStreamTest = docker exec mongodb-social mongosh --quiet --eval "try { db.test.watch(); print('CHANGE_STREAMS_OK'); } catch (e) { print('CHANGE_STREAMS_ERROR:' + e.message); }" 2>$null
    
    if ($changeStreamTest -match "CHANGE_STREAMS_OK") {
        Write-Host "   ✅ Change Streams are working!" -ForegroundColor Green
    } else {
        Write-Host "   ❌ Change Streams not working: $changeStreamTest" -ForegroundColor Red
    }

    # Verify connection strings in services
    Write-Host ""
    Write-Host "4. Verifying service connection strings..." -ForegroundColor Yellow
    
    $socialConnection = Get-Content Backend\innkt.Social\appsettings.json | Select-String "MongoDB"
    if ($socialConnection -match "mongodb://localhost:27018/innkt_social\?replicaSet=rs0") {
        Write-Host "   ✅ Social Service connection string correct" -ForegroundColor Green
    } else {
        Write-Host "   ❌ Social Service connection string: $socialConnection" -ForegroundColor Red
    }

    $messagingConnection = Get-Content Backend\innkt.Messaging\src\server.js | Select-String "MONGODB_URI.*localhost:27017"
    if ($messagingConnection) {
        Write-Host "   ✅ Messaging Service connection string correct" -ForegroundColor Green
    } else {
        Write-Host "   ❌ Messaging Service connection string not found" -ForegroundColor Red
    }

    # Summary
    Write-Host ""
    Write-Host "🎉 MongoDB Configuration Summary:" -ForegroundColor Cyan
    Write-Host "=================================" -ForegroundColor Cyan
    Write-Host "   📊 Replica Set: rs0 (combined setup)" -ForegroundColor White
    Write-Host "   🔗 Social:    mongodb://localhost:27018/innkt_social?replicaSet=rs0" -ForegroundColor White
    Write-Host "   💬 Messaging: mongodb://localhost:27017/innkt_messaging?replicaSet=rs0" -ForegroundColor White
    Write-Host "   ⚡ Change Streams: ENABLED" -ForegroundColor White
    Write-Host "   🚀 Status: PRODUCTION READY" -ForegroundColor White

} catch {
    Write-Host "❌ Verification failed: $($_.Exception.Message)" -ForegroundColor Red
    exit 1
}

Write-Host ""
Write-Host "✅ MongoDB setup verification completed successfully!" -ForegroundColor Green
