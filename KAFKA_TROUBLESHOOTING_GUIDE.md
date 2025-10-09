# Kafka Troubleshooting Guide

## 🔍 Common Kafka Issues and Solutions

This guide covers common Kafka issues in the INNKT platform and how to resolve them.

---

## 1️⃣ Cluster ID Mismatch Error

### **Symptoms**
```
kafka.common.InconsistentClusterIdException: The Cluster ID ObhMBMhTTHmcX0ekEDK9Gw doesn't match stored clusterId Some(Qc94_aWWSmOiDjjC3kDVrg) in meta.properties. The broker is trying to join the wrong cluster.
```

**Container Status:** Kafka exits immediately with error code 1

### **Root Cause**
- Kafka stores cluster metadata in Docker volumes
- After infrastructure restarts, the Zookeeper cluster ID may change
- Kafka's stored cluster ID becomes stale and doesn't match
- This causes Kafka to refuse to start

### **Solution: Clear Kafka Volumes**

#### Quick Fix
```powershell
# Stop and remove Kafka container
docker stop innkt-kafka
docker rm innkt-kafka

# Remove ALL Kafka volumes
docker volume rm innkt_kafka_data innkt_kafka_dev_data innkt_kafka_test_data

# Restart Kafka with fresh volumes
docker-compose -f docker-compose-infrastructure.yml up -d kafka

# Wait 10-15 seconds for Kafka to initialize
Start-Sleep -Seconds 15

# Verify Kafka is running
docker ps | Select-String "innkt-kafka"
```

#### Expected Output
```
innkt-kafka    Running (healthy)    0.0.0.0:9092->9092/tcp
```

### **Prevention**
This issue typically occurs when:
1. Infrastructure is stopped ungracefully
2. Zookeeper data is cleared but Kafka data is not
3. Different docker-compose configurations are used

**Best Practice:** Always use the infrastructure scripts:
```powershell
# Stop infrastructure properly
.\stop-infra-simple.ps1

# Start infrastructure
.\start-infra-simple.ps1
```

---

## 2️⃣ Kafka Won't Start - Zookeeper Not Ready

### **Symptoms**
```
ERROR Error while waiting for Zookeeper connection
java.util.concurrent.TimeoutException: Timed out waiting for connection
```

### **Root Cause**
Kafka is starting before Zookeeper is ready.

### **Solution**

#### Check Zookeeper Status
```powershell
docker ps | Select-String "zookeeper"
```

**Expected:** Should show `(healthy)` status

#### Restart in Correct Order
```powershell
# Stop both
docker stop innkt-kafka innkt-zookeeper

# Start Zookeeper first
docker-compose -f docker-compose-infrastructure.yml up -d zookeeper

# Wait for it to be healthy
Start-Sleep -Seconds 10

# Start Kafka
docker-compose -f docker-compose-infrastructure.yml up -d kafka
```

---

## 3️⃣ Services Can't Connect to Kafka

### **Symptoms**
```
Kafka consumer error: localhost:9092/bootstrap: Connect to ipv4#127.0.0.1:9092 failed: Unknown error
Kafka producer error: 1/1 brokers are down
```

### **Root Cause**
Kafka container is not running or not accessible on port 9092.

### **Solution**

#### Verify Kafka is Running
```powershell
docker ps | Select-String "kafka"
```

**Expected output:**
```
innkt-kafka    Running (healthy)    0.0.0.0:9092->9092/tcp
```

#### Check Kafka Logs
```powershell
docker logs innkt-kafka --tail 50
```

Look for:
- ✅ `INFO [KafkaServer id=1] started` - Kafka is ready
- ❌ `ERROR` messages - Kafka has issues

#### Test Kafka Connection
```powershell
# Test from host machine
docker exec innkt-kafka kafka-broker-api-versions --bootstrap-server localhost:29092
```

---

## 4️⃣ Topic Creation Issues

### **Symptoms**
```
WARN Topic not available yet: Subscribed topic not available: topic-name: Broker: Unknown topic or partition
```

### **Root Cause**
This is usually not an error - topics are created automatically when first used.

### **Solution**

#### Manual Topic Creation (if needed)
```powershell
# Create a topic manually
docker exec innkt-kafka kafka-topics --create \
  --bootstrap-server localhost:29092 \
  --replication-factor 1 \
  --partitions 1 \
  --topic topic-name
```

#### List Existing Topics
```powershell
docker exec innkt-kafka kafka-topics --list --bootstrap-server localhost:29092
```

#### Describe Topic
```powershell
docker exec innkt-kafka kafka-topics --describe \
  --bootstrap-server localhost:29092 \
  --topic topic-name
```

---

## 5️⃣ Kafka UI Can't Connect

### **Symptoms**
Kafka UI (http://localhost:8080) shows "No clusters available" or connection errors.

### **Root Cause**
Kafka UI is configured to connect to Kafka, but Kafka is not accessible.

### **Solution**

#### Check Environment Variables
```powershell
docker exec innkt-kafka-ui env | Select-String "KAFKA"
```

**Expected:**
```
KAFKA_CLUSTERS_0_NAME=local
KAFKA_CLUSTERS_0_BOOTSTRAPSERVERS=kafka:29092
```

#### Restart Kafka UI
```powershell
docker restart innkt-kafka-ui
```

#### Verify Network
```powershell
# Both containers should be on the same network
docker network inspect innkt_innkt-network
```

---

## 6️⃣ Port Already in Use

### **Symptoms**
```
ERROR: Port 9092 is already allocated
```

### **Root Cause**
Another service is using port 9092.

### **Solution**

#### Find What's Using the Port
```powershell
netstat -ano | findstr :9092
```

#### Stop Conflicting Process
```powershell
taskkill /PID <process_id> /F
```

#### Alternative: Use Different Port
Edit `docker-compose-infrastructure.yml`:
```yaml
kafka:
  ports:
    - "9093:9092"  # Changed external port
```

---

## 7️⃣ Disk Space Issues

### **Symptoms**
```
ERROR Error while flushing log for partition-0: No space left on device
```

### **Root Cause**
Docker volumes are full.

### **Solution**

#### Check Docker Disk Usage
```powershell
docker system df
```

#### Clean Up Old Data
```powershell
# Remove unused volumes
docker volume prune

# Remove unused images
docker image prune -a
```

#### Increase Docker Resources
1. Open Docker Desktop
2. Settings → Resources → Advanced
3. Increase Disk Image Size
4. Apply & Restart

---

## 8️⃣ Consumer Group Issues

### **Symptoms**
```
WARN Consumer group rebalance failed
ERROR Failed to join consumer group
```

### **Solution**

#### List Consumer Groups
```powershell
docker exec innkt-kafka kafka-consumer-groups --list --bootstrap-server localhost:29092
```

#### Describe Consumer Group
```powershell
docker exec innkt-kafka kafka-consumer-groups --describe \
  --bootstrap-server localhost:29092 \
  --group group-name
```

#### Reset Consumer Group (if needed)
```powershell
docker exec innkt-kafka kafka-consumer-groups --reset-offsets \
  --bootstrap-server localhost:29092 \
  --group group-name \
  --topic topic-name \
  --to-earliest \
  --execute
```

---

## 🔧 Diagnostic Commands

### Quick Health Check
```powershell
# Check Kafka container status
docker ps --filter "name=innkt-kafka"

# Check Kafka logs
docker logs innkt-kafka --tail 50 --follow

# List all topics
docker exec innkt-kafka kafka-topics --list --bootstrap-server localhost:29092

# Check broker status
docker exec innkt-kafka kafka-broker-api-versions --bootstrap-server localhost:29092
```

### Performance Monitoring
```powershell
# Monitor consumer lag
docker exec innkt-kafka kafka-consumer-groups --describe \
  --bootstrap-server localhost:29092 \
  --group group-name

# Check topic details
docker exec innkt-kafka kafka-topics --describe \
  --bootstrap-server localhost:29092 \
  --topic topic-name
```

### Test Message Flow
```powershell
# Produce a test message
docker exec -it innkt-kafka kafka-console-producer \
  --bootstrap-server localhost:29092 \
  --topic test-topic

# Consume messages
docker exec -it innkt-kafka kafka-console-consumer \
  --bootstrap-server localhost:29092 \
  --topic test-topic \
  --from-beginning
```

---

## 📋 Health Check Script

Save this as `check-kafka-health.ps1`:

```powershell
#!/usr/bin/env pwsh

Write-Host "=== Kafka Health Check ===" -ForegroundColor Cyan
Write-Host ""

# Check Kafka container
Write-Host "Kafka Container Status:" -ForegroundColor Yellow
docker ps --filter "name=innkt-kafka" --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}"
Write-Host ""

# Check if Kafka is healthy
$kafkaHealth = docker inspect innkt-kafka --format='{{.State.Health.Status}}' 2>$null
if ($kafkaHealth -eq "healthy") {
    Write-Host "✅ Kafka is healthy" -ForegroundColor Green
} else {
    Write-Host "❌ Kafka is unhealthy or not running" -ForegroundColor Red
}

# List topics
Write-Host "`nAvailable Topics:" -ForegroundColor Yellow
try {
    docker exec innkt-kafka kafka-topics --list --bootstrap-server localhost:29092 2>$null
} catch {
    Write-Host "  ❌ Unable to list topics (Kafka may not be ready)" -ForegroundColor Red
}

Write-Host ""
Write-Host "=== Health Check Complete ===" -ForegroundColor Cyan
```

---

## 🆘 Emergency Recovery

If nothing else works, perform a complete Kafka reset:

```powershell
# 1. Stop everything
.\stop-infra-simple.ps1

# 2. Remove Kafka completely
docker rm -f innkt-kafka innkt-kafka-ui

# 3. Remove ALL Kafka volumes
docker volume rm innkt_kafka_data innkt_kafka_dev_data innkt_kafka_test_data

# 4. Remove Zookeeper data (only if needed)
docker volume rm innkt_zookeeper_data 2>$null

# 5. Restart infrastructure from scratch
.\start-infra-simple.ps1

# 6. Wait for services to initialize
Start-Sleep -Seconds 30

# 7. Verify
docker ps | Select-String "kafka"
```

**⚠️ Warning:** This will delete all Kafka topics and messages!

---

## 📞 When to Seek Help

If you encounter Kafka issues, gather this information:

1. **Container status**: `docker ps -a | Select-String "kafka"`
2. **Container logs**: `docker logs innkt-kafka --tail 100`
3. **Zookeeper status**: `docker logs innkt-zookeeper --tail 50`
4. **Error messages** from services trying to connect
5. **Docker resources**: `docker system df`

---

## 🎯 Best Practices

### Daily Operations
1. Always use infrastructure scripts (`start-infra-simple.ps1`, `stop-infra-simple.ps1`)
2. Monitor Kafka logs during startup
3. Verify Kafka health before starting services
4. Keep Kafka UI accessible for monitoring

### Troubleshooting Workflow
1. Check if Kafka container is running
2. Check Kafka logs for errors
3. Verify Zookeeper is healthy
4. Test topic creation/listing
5. If all fails, perform volume reset

### Prevention
- Regular infrastructure restarts using scripts
- Monitor Docker disk space
- Don't manually stop Kafka without stopping dependent services
- Use `docker-compose down` instead of `docker stop` when possible

---

**Last Updated:** October 9, 2024  
**Related Documentation:**
- [INFRASTRUCTURE_QUICK_START.md](./INFRASTRUCTURE_QUICK_START.md)
- [MONGODB_TROUBLESHOOTING_GUIDE.md](./MONGODB_TROUBLESHOOTING_GUIDE.md)

