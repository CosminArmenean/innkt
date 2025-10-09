# Current MongoDB Configuration

## 🎯 **PRODUCTION SETUP** (Updated: October 9, 2024)

### Architecture Overview

The INNKT platform uses a **hybrid MongoDB architecture**:
- **Social Service**: Single-member replica set (enables Change Streams for real-time features)
- **Messaging Service**: Standalone instance (simpler, faster, no replica set overhead)

---

## 📊 **MongoDB Containers**

### ✅ Social MongoDB (mongodb-social)
- **Image:** `mongo:7`
- **Container Name:** `mongodb-social`
- **Type:** Replica Set (single member)
- **Replica Set Name:** `rs0`
- **Command:** `mongod --replSet rs0 --bind_ip_all`
- **Port Mapping:** `27018:27017`
- **Volume:** `mongodb-social-data:/data/db`
- **Health Check:** `mongosh --eval "db.adminCommand('ping')"`
- **Purpose:** Enables Change Streams for real-time social features (posts, likes, comments)

### ✅ Messaging MongoDB (mongodb-messaging-standalone)
- **Image:** `mongo:7`
- **Container Name:** `mongodb-messaging-standalone`
- **Type:** Standalone (no replica set)
- **Command:** `mongod --bind_ip_all`
- **Port Mapping:** `27017:27017`
- **Volume:** `mongodb-messaging-data:/data/db`
- **Health Check:** `mongosh --eval "db.adminCommand('ping')"`
- **Purpose:** Simple, fast storage for messaging data

---

## 🔌 **Service Connection Strings**

### Social Service
```json
{
  "MongoDB": "mongodb://localhost:27018/innkt_social?replicaSet=rs0"
}
```
- **Database:** `innkt_social`
- **Features:** Change Streams enabled ✅
- **Real-time:** Instant notifications for posts, comments, likes

### Messaging Service
```javascript
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/innkt_messaging';
```
- **Database:** `innkt_messaging`
- **Type:** Standalone (no `replicaSet` parameter)
- **Features:** Fast reads/writes, WebSocket-based real-time

---

## 🚀 **Starting MongoDB Services**

### Using Infrastructure Script (Recommended)
```powershell
.\start-infra-simple.ps1
```

### Using Docker Compose Directly
```powershell
docker-compose -f docker-compose-mongodb.yml up -d
```

### Manual Start
```powershell
# Start both MongoDB containers
docker start mongodb-social
docker start mongodb-messaging-standalone

# Verify they're running
docker ps | Select-String "mongodb"
```

---

## ✅ **Verification & Testing**

### Check Container Status
```powershell
docker ps --filter "name=mongodb"
```

**Expected output:**
```
mongodb-social                Running (healthy)    0.0.0.0:27018->27017/tcp
mongodb-messaging-standalone  Running (healthy)    0.0.0.0:27017->27017/tcp
```

### Verify Social Replica Set
```powershell
docker exec mongodb-social mongosh --eval "rs.status()"
```

**Expected:** Shows replica set `rs0` with PRIMARY status

### Verify Messaging Standalone
```powershell
docker exec mongodb-messaging-standalone mongosh --eval "db.adminCommand('ping')"
```

**Expected:** `{ ok: 1 }`

### Test Change Streams (Social only)
```powershell
docker exec mongodb-social mongosh --eval "db.getSiblingDB('innkt_social').posts.watch()"
```

**Expected:** Change stream starts successfully (Ctrl+C to exit)

---

## 📋 **Key Differences**

| Feature | Social MongoDB | Messaging MongoDB |
|---------|----------------|-------------------|
| **Type** | Replica Set (single member) | Standalone |
| **Port** | 27018 | 27017 |
| **Change Streams** | ✅ Enabled | ❌ Not supported |
| **Oplog** | ✅ Available | ❌ Not available |
| **Overhead** | Higher (replica set) | Lower (standalone) |
| **Use Case** | Real-time social features | High-speed messaging |
| **Connection String** | Includes `?replicaSet=rs0` | No replica set param |

---

## 🔧 **Troubleshooting**

### Messaging Service Shows "RSGhost" Error

**Problem:** Messaging service tries to connect to a replica set member instead of standalone.

**Solution:**
```powershell
# Stop old replica set container
docker stop mongodb-messaging
docker rm mongodb-messaging

# Ensure standalone is running
docker ps | Select-String "mongodb-messaging-standalone"

# If not running, start it
.\start-infra-simple.ps1
```

### Social Service Can't Use Change Streams

**Problem:** Replica set not initialized properly.

**Solution:**
```powershell
# Check replica set status
docker exec mongodb-social mongosh --eval "rs.status()"

# If not initialized, run init script manually
docker exec mongodb-social mongosh --eval "rs.initiate({_id: 'rs0', members: [{_id: 0, host: 'mongodb-social:27017'}]})"
```

### Port Already in Use

**Problem:** Port 27017 or 27018 is occupied.

**Solution:**
```powershell
# Find what's using the port
netstat -ano | findstr :27017

# Stop the conflicting process or change port mapping in docker-compose-mongodb.yml
```

---

## 📁 **Data Persistence**

Both MongoDB instances use Docker volumes for data persistence:

```powershell
# List MongoDB volumes
docker volume ls | Select-String "mongodb"

# Inspect volume
docker volume inspect mongodb-social-data
docker volume inspect mongodb-messaging-data

# Backup volume (example)
docker run --rm -v mongodb-social-data:/data -v ${PWD}:/backup mongo:7 tar czf /backup/mongodb-social-backup.tar.gz /data
```

**⚠️ Warning:** Removing volumes will delete all data!

---

## 🔄 **Migration Notes**

### Previous Architecture (Deprecated)
- Both Social and Messaging were in a combined replica set `rs0`
- Caused cross-service dependencies
- Messaging service tried to connect to `mongodb-social` container

### Current Architecture (Active)
- **Social:** Single-member replica set (independent)
- **Messaging:** Standalone (no replica set)
- **Benefits:** Cleaner separation, no cross-dependencies, easier maintenance

---

## 📚 **Related Documentation**

- [MESSAGING_MONGODB_FIX_DOCUMENTATION.md](./MESSAGING_MONGODB_FIX_DOCUMENTATION.md) - Original fix details
- [INFRASTRUCTURE_QUICK_START.md](./INFRASTRUCTURE_QUICK_START.md) - Infrastructure management
- [docker-compose-mongodb.yml](./docker-compose-mongodb.yml) - Current configuration

---

## ✨ **Summary**

| Service | Container | Port | Type | Status |
|---------|-----------|------|------|--------|
| **Social** | `mongodb-social` | 27018 | Replica Set (rs0) | ✅ Production Ready |
| **Messaging** | `mongodb-messaging-standalone` | 27017 | Standalone | ✅ Production Ready |

**✅ Both services are operational and optimized for their specific use cases!**
