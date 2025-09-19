# MongoDB Replica Set Management Scripts

This directory contains PowerShell scripts for managing MongoDB replica sets in the INNKT platform.

## 📁 Files Overview

| File | Purpose | Usage |
|------|---------|-------|
| `MONGODB_REPLICA_SET_SETUP.md` | Complete documentation | Read for detailed setup guide |
| `setup-mongodb-replica.ps1` | Initial setup | `.\setup-mongodb-replica.ps1` |
| `start-mongodb-replica.ps1` | Smart start/restart | `.\start-mongodb-replica.ps1` |
| `stop-mongodb-replica.ps1` | Safe shutdown | `.\stop-mongodb-replica.ps1` |
| `check-mongodb-status.ps1` | Status monitoring | `.\check-mongodb-status.ps1` |
| `mongodb-commands.ps1` | Quick commands | `.\mongodb-commands.ps1 <command>` |

## 🚀 Quick Start

### First Time Setup
```powershell
# Set up MongoDB replica set for the first time
.\setup-mongodb-replica.ps1
```

### Daily Usage
```powershell
# Start MongoDB (automatically handles restarts if needed)
.\start-mongodb-replica.ps1

# Check status
.\check-mongodb-status.ps1

# Stop MongoDB
.\stop-mongodb-replica.ps1
```

### Quick Commands
```powershell
# Use the unified command interface
.\mongodb-commands.ps1 start
.\mongodb-commands.ps1 status -Detailed
.\mongodb-commands.ps1 logs
.\mongodb-commands.ps1 shell
```

## 🏗️ Architecture

```
MongoDB Replica Set (rs0)
├── mongodb-social (Primary)    - Port 27018 → innkt_social
└── mongodb-messaging (Secondary) - Port 27017 → innkt_messaging
```

## 🔗 Connection Strings

```
Social Service:    mongodb://localhost:27018/innkt_social?replicaSet=rs0
Messaging Service: mongodb://localhost:27017/innkt_messaging?replicaSet=rs0
```

## 📋 Common Commands

### Setup & Management
```powershell
# Initial setup
.\setup-mongodb-replica.ps1

# Force recreation
.\setup-mongodb-replica.ps1 -Force

# Smart start (checks if already running)
.\start-mongodb-replica.ps1

# Force restart
.\start-mongodb-replica.ps1 -Force

# Stop (preserve data)
.\stop-mongodb-replica.ps1

# Stop and remove all data
.\stop-mongodb-replica.ps1 -RemoveVolumes
```

### Monitoring
```powershell
# Quick status
.\check-mongodb-status.ps1

# Detailed status with database stats
.\check-mongodb-status.ps1 -Detailed

# Continuous monitoring (refreshes every 10 seconds)
.\check-mongodb-status.ps1 -Continuous

# View logs
docker-compose -f docker-compose-mongodb.yml logs
```

### Troubleshooting
```powershell
# Check container status
docker ps --filter "name=mongodb"

# View specific container logs
docker logs mongodb-social
docker logs mongodb-messaging

# Open MongoDB shell
docker exec -it mongodb-social mongosh innkt_social

# Check replica set status manually
docker exec mongodb-social mongosh --eval "rs.status()"
```

## ⚠️ Important Notes

1. **Always use the scripts** - Don't manually start/stop containers
2. **Check status first** - Use `check-mongodb-status.ps1` to diagnose issues
3. **Data preservation** - By default, stopping preserves data volumes
4. **Force restart** - Use `-Force` flag if containers are in a bad state
5. **Backup important data** - Scripts can create backups before major operations

## 🔧 Script Features

### `setup-mongodb-replica.ps1`
- ✅ First-time replica set creation
- ✅ Automatic initialization
- ✅ Test data creation
- ✅ Health checks
- ✅ Force recreation option

### `start-mongodb-replica.ps1`
- ✅ Smart detection (only restart if needed)
- ✅ Health monitoring
- ✅ Replica set validation
- ✅ Force restart option
- ✅ Automatic recovery

### `stop-mongodb-replica.ps1`
- ✅ Graceful shutdown
- ✅ Data preservation
- ✅ Optional data removal
- ✅ Backup creation
- ✅ Status verification

### `check-mongodb-status.ps1`
- ✅ Container health
- ✅ Replica set status
- ✅ Database statistics
- ✅ Continuous monitoring
- ✅ Connection info

### `mongodb-commands.ps1`
- ✅ Unified interface
- ✅ All operations
- ✅ Parameter passing
- ✅ Help system
- ✅ Quick access

## 🐛 Troubleshooting Guide

### Container Won't Start
```powershell
# Check Docker status
docker version

# Check port conflicts
netstat -an | findstr ":27017\|:27018"

# Force restart
.\start-mongodb-replica.ps1 -Force
```

### Replica Set Issues
```powershell
# Check replica set status
docker exec mongodb-social mongosh --eval "rs.status()"

# Re-initialize if needed
docker exec mongodb-social mongosh --eval "rs.initiate({_id:'rs0',members:[{_id:0,host:'mongodb-social:27017',priority:2},{_id:1,host:'mongodb-messaging:27017',priority:1}]})"
```

### Connection Problems
```powershell
# Test connections
docker exec mongodb-social mongosh --eval "db.adminCommand('ping')"
docker exec mongodb-messaging mongosh --eval "db.adminCommand('ping')"

# Check network
docker network ls
docker network inspect innkt_innkt-network
```

## 📞 Support

1. Read `MONGODB_REPLICA_SET_SETUP.md` for detailed information
2. Run `.\check-mongodb-status.ps1 -Detailed` for diagnostics
3. Check Docker logs: `docker-compose -f docker-compose-mongodb.yml logs`
4. Use `.\mongodb-commands.ps1 help` for quick reference

---

**Created**: September 2025  
**For**: INNKT Platform MongoDB Replica Set Management
