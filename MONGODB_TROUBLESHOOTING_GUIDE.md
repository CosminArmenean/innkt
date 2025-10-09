# MongoDB Troubleshooting Guide

## 🔍 Common Issues and Solutions

This guide covers common MongoDB issues in the INNKT platform and how to resolve them.

---

## 1️⃣ Messaging Service: "RSGhost" or "Server Selection Timeout"

### **Symptoms**
```
error: Failed to connect to MongoDB: Server selection timed out after 5000 ms
type: "RSGhost"
```

### **Root Cause**
The messaging service is trying to connect to a replica set member instead of the standalone instance.

### **Solution**

#### Quick Fix (Recommended)
```powershell
# Stop any old messaging MongoDB containers
docker stop mongodb-messaging
docker rm mongodb-messaging

# Ensure standalone container is running
docker ps | Select-String "mongodb-messaging-standalone"

# If not running, recreate it
docker run -d \
  --name mongodb-messaging-standalone \
  --network innkt_innkt-network \
  -p 27017:27017 \
  -v mongodb-messaging-data:/data/db \
  mongo:7
```

#### Using Infrastructure Script
```powershell
# Stop current infrastructure
.\stop-infra-simple.ps1

# Restart with correct configuration
.\start-infra-simple.ps1
```

### **Verification**
```powershell
# Should show "not running with --replSet" (this is correct!)
docker exec mongodb-messaging-standalone mongosh --eval "rs.status()"

# Should show { ok: 1 }
docker exec mongodb-messaging-standalone mongosh --eval "db.adminCommand('ping')"
```

---

## 2️⃣ Social Service: Change Streams Not Working

### **Symptoms**
```
error: The $changeStream stage is only supported on replica sets
```

### **Root Cause**
The Social MongoDB is not configured as a replica set.

### **Solution**

#### Check Replica Set Status
```powershell
docker exec mongodb-social mongosh --eval "rs.status()"
```

#### Initialize Replica Set (if needed)
```powershell
docker exec mongodb-social mongosh --eval "
rs.initiate({
  _id: 'rs0',
  members: [
    { _id: 0, host: 'mongodb-social:27017', priority: 1 }
  ]
})
"

# Wait 5 seconds for initialization
Start-Sleep -Seconds 5

# Verify
docker exec mongodb-social mongosh --eval "rs.status()"
```

### **Verification**
```powershell
# Should open a change stream (Ctrl+C to exit)
docker exec -it mongodb-social mongosh --eval "
use innkt_social
db.posts.watch()
"
```

---

## 3️⃣ Port Already in Use

### **Symptoms**
```
ERROR: Port 27017 is already allocated
ERROR: Port 27018 is already allocated
```

### **Root Cause**
Another MongoDB instance or service is using the ports.

### **Solution**

#### Find What's Using the Port
```powershell
# Check port 27017
netstat -ano | findstr :27017

# Check port 27018
netstat -ano | findstr :27018
```

#### Option 1: Stop Conflicting Process
```powershell
# Find process ID from netstat output
taskkill /PID <process_id> /F
```

#### Option 2: Use Different Ports
Edit `docker-compose-mongodb.yml`:
```yaml
mongodb-messaging-standalone:
  ports:
    - "27019:27017"  # Changed from 27017
```

---

## 4️⃣ Data Corruption or Need Fresh Start

### **Symptoms**
- MongoDB won't start
- Corrupt data errors
- Need to reset everything

### **⚠️ Warning: This Will Delete All Data!**

#### Complete MongoDB Reset
```powershell
# Stop all MongoDB containers
docker stop mongodb-social mongodb-messaging-standalone

# Remove containers
docker rm mongodb-social mongodb-messaging-standalone

# Remove volumes (THIS DELETES ALL DATA!)
docker volume rm mongodb-social-data mongodb-messaging-data

# Restart infrastructure
.\start-infra-simple.ps1
```

---

## 5️⃣ Connection String Issues

### **Common Mistakes**

#### ❌ Wrong: Messaging with Replica Set
```javascript
// DON'T DO THIS for messaging service
mongodb://localhost:27017/innkt_messaging?replicaSet=rs0
```

#### ✅ Correct: Messaging Standalone
```javascript
// Correct for messaging service
mongodb://localhost:27017/innkt_messaging
```

#### ❌ Wrong: Social without Replica Set
```json
// DON'T DO THIS for social service
"MongoDB": "mongodb://localhost:27018/innkt_social"
```

#### ✅ Correct: Social with Replica Set
```json
// Correct for social service
"MongoDB": "mongodb://localhost:27018/innkt_social?replicaSet=rs0"
```

---

## 6️⃣ Container Health Check Failing

### **Symptoms**
```
Container "mongodb-social" is unhealthy
Container "mongodb-messaging-standalone" is unhealthy
```

### **Solution**

#### Check Container Logs
```powershell
docker logs mongodb-social
docker logs mongodb-messaging-standalone
```

#### Manual Health Check
```powershell
# Should return { ok: 1 }
docker exec mongodb-social mongosh --eval "db.adminCommand('ping')"
docker exec mongodb-messaging-standalone mongosh --eval "db.adminCommand('ping')"
```

#### Restart Container
```powershell
docker restart mongodb-social
# or
docker restart mongodb-messaging-standalone
```

---

## 7️⃣ Replica Set Member Configuration Issues

### **Symptoms**
```
error: Replica set config is invalid
error: Not all members are accessible
```

### **Solution**

#### Check Current Configuration
```powershell
docker exec mongodb-social mongosh --eval "rs.conf()"
```

#### Reconfigure if Needed
```powershell
docker exec mongodb-social mongosh --eval "
cfg = rs.conf()
cfg.members = [
  { _id: 0, host: 'mongodb-social:27017', priority: 1 }
]
rs.reconfig(cfg, {force: true})
"
```

---

## 8️⃣ Can't Connect from Service

### **Symptoms**
```
error: getaddrinfo ENOTFOUND mongodb-social
error: connect ECONNREFUSED 127.0.0.1:27017
```

### **Solution**

#### Check Service is Running Outside Docker
If your backend service runs on your host machine (not in Docker):

```powershell
# Use localhost, not container names
"MongoDB": "mongodb://localhost:27018/innkt_social?replicaSet=rs0"
```

#### Check Service is Running Inside Docker
If your backend service runs in Docker:

```yaml
# Use container names, not localhost
"MongoDB": "mongodb://mongodb-social:27017/innkt_social?replicaSet=rs0"
```

#### Check Network
```powershell
# Both containers should be on same network
docker network inspect innkt_innkt-network
```

---

## 🔧 Diagnostic Commands

### Quick Status Check
```powershell
# All MongoDB containers
docker ps --filter "name=mongodb"

# Replica set status (Social only)
docker exec mongodb-social mongosh --eval "rs.status()"

# Standalone check (Messaging only)
docker exec mongodb-messaging-standalone mongosh --eval "db.adminCommand('ping')"
```

### Connection Test
```powershell
# Test from host machine
mongosh "mongodb://localhost:27018/innkt_social?replicaSet=rs0"
mongosh "mongodb://localhost:27017/innkt_messaging"
```

### Volume Inspection
```powershell
# List MongoDB volumes
docker volume ls | Select-String "mongodb"

# Inspect specific volume
docker volume inspect mongodb-social-data
docker volume inspect mongodb-messaging-data
```

### Log Inspection
```powershell
# Last 100 lines
docker logs --tail 100 mongodb-social
docker logs --tail 100 mongodb-messaging-standalone

# Follow live logs
docker logs -f mongodb-social
docker logs -f mongodb-messaging-standalone
```

---

## 📋 Health Check Script

Save this as `check-mongodb-health.ps1`:

```powershell
#!/usr/bin/env pwsh

Write-Host "=== MongoDB Health Check ===" -ForegroundColor Cyan
Write-Host ""

# Check containers
Write-Host "Container Status:" -ForegroundColor Yellow
docker ps --filter "name=mongodb" --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}"
Write-Host ""

# Check Social replica set
Write-Host "Social MongoDB (Replica Set):" -ForegroundColor Yellow
try {
    $socialStatus = docker exec mongodb-social mongosh --quiet --eval "rs.status().ok"
    if ($socialStatus -eq "1") {
        Write-Host "  ✅ Replica set operational" -ForegroundColor Green
    }
} catch {
    Write-Host "  ❌ Replica set check failed" -ForegroundColor Red
}

# Check Messaging standalone
Write-Host "Messaging MongoDB (Standalone):" -ForegroundColor Yellow
try {
    $messagingPing = docker exec mongodb-messaging-standalone mongosh --quiet --eval "db.adminCommand('ping').ok"
    if ($messagingPing -eq "1") {
        Write-Host "  ✅ Standalone operational" -ForegroundColor Green
    }
} catch {
    Write-Host "  ❌ Standalone check failed" -ForegroundColor Red
}

Write-Host ""
Write-Host "=== Health Check Complete ===" -ForegroundColor Cyan
```

---

## 🆘 Emergency Recovery

If nothing else works:

```powershell
# 1. Stop everything
.\stop-infra-simple.ps1

# 2. Remove all MongoDB containers (keeps data)
docker rm -f mongodb-social mongodb-messaging-standalone mongodb-messaging

# 3. Restart infrastructure (will recreate containers)
.\start-infra-simple.ps1

# 4. Verify services
docker ps | Select-String "mongodb"
```

---

## 📞 Getting Help

When reporting MongoDB issues, include:

1. **Error message** from service logs
2. **Container status**: `docker ps -a | Select-String "mongodb"`
3. **Container logs**: `docker logs mongodb-social` or `docker logs mongodb-messaging-standalone`
4. **Connection string** being used (redact passwords)
5. **Output of**: `docker exec mongodb-social mongosh --eval "rs.status()"` (if applicable)

---

**Last Updated:** October 9, 2024

