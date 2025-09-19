# MongoDB Replica Set Setup Script
# This script sets up the MongoDB replica set for the first time

param(
    [switch]$Force,
    [switch]$Verbose
)

Write-Host "🚀 MongoDB Replica Set Setup for INNKT Platform" -ForegroundColor Cyan
Write-Host "=================================================" -ForegroundColor Cyan

if ($Verbose) {
    $VerbosePreference = "Continue"
}

# Function to check if Docker is running
function Test-DockerRunning {
    try {
        docker version | Out-Null
        return $true
    }
    catch {
        return $false
    }
}

# Function to check if containers exist
function Test-ContainersExist {
    $socialExists = docker ps -a --filter "name=mongodb-social" --format "{{.Names}}" | Select-String "mongodb-social"
    $messagingExists = docker ps -a --filter "name=mongodb-messaging" --format "{{.Names}}" | Select-String "mongodb-messaging"
    
    return ($socialExists -or $messagingExists)
}

# Function to wait for container health
function Wait-ForContainerHealth {
    param([string]$ContainerName, [int]$TimeoutSeconds = 60)
    
    Write-Host "⏳ Waiting for $ContainerName to be healthy..." -ForegroundColor Yellow
    
    $elapsed = 0
    while ($elapsed -lt $TimeoutSeconds) {
        $health = docker inspect --format='{{.State.Health.Status}}' $ContainerName 2>$null
        if ($health -eq "healthy") {
            Write-Host "✅ $ContainerName is healthy" -ForegroundColor Green
            return $true
        }
        
        Start-Sleep -Seconds 2
        $elapsed += 2
        Write-Host "." -NoNewline -ForegroundColor Yellow
    }
    
    Write-Host ""
    Write-Host "❌ $ContainerName failed to become healthy within $TimeoutSeconds seconds" -ForegroundColor Red
    return $false
}

# Function to initialize replica set
function Initialize-ReplicaSet {
    Write-Host "🔧 Initializing replica set..." -ForegroundColor Yellow
    
    $initScript = @"
try {
    let status = rs.status();
    print('✅ Replica set already initialized with ' + status.members.length + ' members');
    status.members.forEach(m => print('  - ' + m.name + ': ' + m.stateStr));
} catch (e) {
    if (e.message.includes('no replset config')) {
        print('🚀 Initializing combined replica set with both instances...');
        rs.initiate({
            _id: 'rs0',
            members: [
                { _id: 0, host: 'mongodb-social:27017', priority: 2 },
                { _id: 1, host: 'mongodb-messaging:27017', priority: 1 }
            ]
        });
        print('⏳ Waiting for replica set to stabilize...');
        sleep(10000);
        
        let finalStatus = rs.status();
        print('✅ Combined replica set initialized with ' + finalStatus.members.length + ' members:');
        finalStatus.members.forEach(m => {
            print('  - ' + m.name + ': ' + m.stateStr + ' (health: ' + m.health + ')');
        });
    } else {
        print('❌ Error: ' + e.message);
    }
}
"@

    try {
        docker exec mongodb-social mongosh --eval $initScript
        return $true
    }
    catch {
        Write-Host "❌ Failed to initialize replica set: $($_.Exception.Message)" -ForegroundColor Red
        return $false
    }
}

# Function to create test data
function Create-TestData {
    Write-Host "📊 Creating test data..." -ForegroundColor Yellow
    
    # Social Service test data
    $socialScript = @"
if (db.posts.countDocuments() === 0) {
    db.posts.insertMany([
        {
            content: 'Welcome to INNKT Social - MongoDB Replica Set Active!',
            authorId: '5e578ba9-edd9-487a-b222-8aad79db6e81',
            createdAt: new Date(),
            visibility: 'Public',
            likes: 10,
            userSnapshot: {
                userId: '5e578ba9-edd9-487a-b222-8aad79db6e81',
                firstName: 'John',
                lastName: 'Doe',
                email: 'john.doe@example.com'
            }
        },
        {
            content: 'Change Streams are now enabled for real-time updates!',
            authorId: '5e578ba9-edd9-487a-b222-8aad79db6e81',
            createdAt: new Date(),
            visibility: 'Public',
            likes: 15,
            userSnapshot: {
                userId: '5e578ba9-edd9-487a-b222-8aad79db6e81',
                firstName: 'John',
                lastName: 'Doe',
                email: 'john.doe@example.com'
            }
        }
    ]);
}
print('✅ Social posts: ' + db.posts.countDocuments());
"@

    # Messaging Service test data
    $messagingScript = @"
if (db.conversations.countDocuments() === 0) {
    let convId = new ObjectId();
    db.conversations.insertOne({
        _id: convId,
        type: 'direct',
        participants: [
            { userId: 'user1', name: 'Alice' },
            { userId: 'user2', name: 'Bob' }
        ],
        createdAt: new Date()
    });
    
    db.messages.insertMany([
        {
            conversationId: convId,
            senderId: 'user1',
            content: 'Hello! MongoDB replica set is working!',
            timestamp: new Date()
        },
        {
            conversationId: convId,
            senderId: 'user2',
            content: 'Great! Change Streams will make messaging instant!',
            timestamp: new Date()
        }
    ]);
}
print('✅ Messages: ' + db.messages.countDocuments());
print('✅ Conversations: ' + db.conversations.countDocuments());
"@

    try {
        docker exec mongodb-social mongosh innkt_social --eval $socialScript
        docker exec mongodb-messaging mongosh innkt_messaging --eval $messagingScript
        Write-Host "✅ Test data created successfully" -ForegroundColor Green
    }
    catch {
        Write-Host "⚠️ Warning: Could not create test data: $($_.Exception.Message)" -ForegroundColor Yellow
    }
}

# Main execution
try {
    # Check prerequisites
    if (-not (Test-DockerRunning)) {
        Write-Host "❌ Docker is not running. Please start Docker Desktop and try again." -ForegroundColor Red
        exit 1
    }

    # Check if containers already exist
    if ((Test-ContainersExist) -and -not $Force) {
        Write-Host "⚠️ MongoDB containers already exist. Use -Force to recreate them." -ForegroundColor Yellow
        Write-Host "Current containers:" -ForegroundColor Cyan
        docker ps -a --filter "name=mongodb" --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}"
        
        $response = Read-Host "Do you want to continue anyway? (y/N)"
        if ($response -notmatch "^[Yy]") {
            Write-Host "Setup cancelled by user." -ForegroundColor Yellow
            exit 0
        }
    }

    if ($Force) {
        Write-Host "🧹 Cleaning up existing containers..." -ForegroundColor Yellow
        docker-compose -f docker-compose-mongodb.yml down -v 2>$null
    }

    # Start the MongoDB containers
    Write-Host "🚀 Starting MongoDB replica set containers..." -ForegroundColor Green
    docker-compose -f docker-compose-mongodb.yml up -d

    if ($LASTEXITCODE -ne 0) {
        Write-Host "❌ Failed to start containers" -ForegroundColor Red
        exit 1
    }

    # Wait for containers to be healthy
    if (-not (Wait-ForContainerHealth "mongodb-social" 60)) {
        Write-Host "❌ mongodb-social failed to start properly" -ForegroundColor Red
        exit 1
    }

    if (-not (Wait-ForContainerHealth "mongodb-messaging" 60)) {
        Write-Host "❌ mongodb-messaging failed to start properly" -ForegroundColor Red
        exit 1
    }

    # Wait a bit more for MongoDB to be fully ready
    Write-Host "⏳ Waiting for MongoDB instances to be fully ready..." -ForegroundColor Yellow
    Start-Sleep -Seconds 15

    # Initialize the replica set
    if (-not (Initialize-ReplicaSet)) {
        Write-Host "❌ Failed to initialize replica set" -ForegroundColor Red
        exit 1
    }

    # Wait for replica set to stabilize
    Write-Host "⏳ Waiting for replica set to stabilize..." -ForegroundColor Yellow
    Start-Sleep -Seconds 20

    # Create test data
    Create-TestData

    # Final status check with nice display
    Write-Host ""
    Write-Host "🎉 MongoDB Replica Set Setup Complete!" -ForegroundColor Green
    Write-Host "=====================================" -ForegroundColor Green
    Write-Host ""
    Write-Host "📊 Container Status:" -ForegroundColor Cyan
    docker-compose -f docker-compose-mongodb.yml ps

    # Show detailed replica set status
    Write-Host ""
    Write-Host "🔗 MongoDB Replica Set Status:" -ForegroundColor Cyan
    try {
        $replicaStatus = docker exec mongodb-social mongosh --quiet --eval 'try { let s = rs.status(); print("RS_OK:" + s.set + ":" + s.members.length + ":" + s.myState); s.members.forEach(m => print("MEMBER:" + m._id + ":" + m.name + ":" + m.stateStr)); } catch (e) { print("RS_ERROR:" + e.message); }' 2>$null

        if ($replicaStatus -match "RS_OK:(.+):(\d+):(\d+)") {
            $setName = $matches[1]
            $memberCount = $matches[2]
            $myState = $matches[3]
            
            Write-Host "🎯 Replica Set: $setName" -ForegroundColor Green
            Write-Host "📊 Total Members: $memberCount" -ForegroundColor Green
            
            $myStateText = if ($myState -eq "1") { "PRIMARY" } else { "SECONDARY" }
            Write-Host "🔧 My State: $myStateText" -ForegroundColor Green
            
            # Parse member information
            $memberLines = $replicaStatus -split "`n" | Where-Object { $_ -match "MEMBER:(\d+):(.+):(.+)" }
            foreach ($memberLine in $memberLines) {
                if ($memberLine -match "MEMBER:(\d+):(.+):(.+)") {
                    $memberId = $matches[1]
                    $memberName = $matches[2]
                    $memberState = $matches[3]
                    
                    $emoji = if ($memberState -eq "PRIMARY") { "[P]" } else { "[S]" }
                    $color = if ($memberState -eq "PRIMARY") { "Green" } else { "Cyan" }
                    Write-Host "$emoji Member $memberId`: $memberName ($memberState)" -ForegroundColor $color
                }
            }
            
            Write-Host ""
            Write-Host "✅ CHANGE STREAMS READY: Both services can now use real-time updates!" -ForegroundColor Green
        } else {
            Write-Host "⚠️ Replica set is still initializing..." -ForegroundColor Yellow
        }
    } catch {
        Write-Host "⚠️ Replica set status will be available shortly" -ForegroundColor Yellow
    }

    Write-Host ""
    Write-Host "🔗 Connection Information:" -ForegroundColor Cyan
    Write-Host "  Social Service:    mongodb://localhost:27018/innkt_social?replicaSet=rs0" -ForegroundColor White
    Write-Host "  Messaging Service: mongodb://localhost:27017/innkt_messaging?replicaSet=rs0" -ForegroundColor White

    Write-Host ""
    Write-Host "Next steps:" -ForegroundColor Yellow
    Write-Host "  1. Start your services with: .\start-services.ps1" -ForegroundColor White
    Write-Host "  2. Check status with: .\check-mongodb-status.ps1" -ForegroundColor White
    Write-Host "  3. View logs with: docker-compose -f docker-compose-mongodb.yml logs" -ForegroundColor White

}
catch {
    Write-Host "❌ Setup failed: $($_.Exception.Message)" -ForegroundColor Red
    Write-Host "Check Docker logs for more details:" -ForegroundColor Yellow
    Write-Host "  docker-compose -f docker-compose-mongodb.yml logs" -ForegroundColor White
    exit 1
}
