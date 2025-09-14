# MongoDB Persistence and Startup Guide

## Overview
This guide ensures that MongoDB starts with the secure configuration and all your data persists between restarts.

## Current Configuration Status ✅

### 1. **Data Persistence**
- **Volume Mounting**: MongoDB data is stored in Docker volume `mongodb_data`
- **Persistent Storage**: Data survives container restarts and system reboots
- **Location**: `/var/lib/mongodb/data` inside container

### 2. **Security Configuration**
- **Authentication**: Enabled with `--auth` flag
- **Root User**: `innkt_admin` / `SecurePassword123!@#`
- **App User**: `innkt_messaging_user` / `MessagingUser123!@#`
- **Database**: `innkt_messaging` with proper permissions

### 3. **Initialization Scripts**
- **Location**: `./mongodb-init/01-init-security.js`
- **Auto-execution**: Runs on first startup
- **Creates**: Users, collections, indexes, and security settings

## Startup Procedure

### 1. **Start Infrastructure (Always use this command)**
```bash
docker-compose -f docker-compose-infrastructure-secure.yml up -d
```

### 2. **Verify MongoDB is Running**
```bash
docker ps | grep mongodb
```

### 3. **Check MongoDB Logs**
```bash
docker logs innkt-mongodb
```

### 4. **Test Connection**
```bash
docker exec -it innkt-mongodb mongosh
```

## Data Persistence Verification

### 1. **Check Volume Exists**
```bash
docker volume ls | grep mongodb
```

### 2. **Verify Data Persistence**
1. Start MongoDB
2. Create some test data
3. Stop MongoDB: `docker-compose -f docker-compose-infrastructure-secure.yml down`
4. Start MongoDB again
5. Check if data still exists

### 3. **Backup Data (Recommended)**
```bash
# Create backup
docker exec innkt-mongodb mongodump --username innkt_admin --password SecurePassword123!@# --authenticationDatabase admin --db innkt_messaging --out /backup

# Copy backup to host
docker cp innkt-mongodb:/backup ./mongodb-backup
```

## Troubleshooting

### If MongoDB Won't Start
1. **Check logs**: `docker logs innkt-mongodb`
2. **Check port conflicts**: `netstat -an | grep 27017`
3. **Remove old containers**: `docker container prune -f`
4. **Restart Docker service** (if needed)

### If Data is Missing
1. **Check volume mounting**: `docker inspect innkt-mongodb`
2. **Verify volume exists**: `docker volume inspect innkt_mongodb_data`
3. **Check permissions**: Ensure Docker has access to volumes

### If Authentication Fails
1. **Check environment variables**: Verify `.env` file
2. **Recreate users**: Run initialization script manually
3. **Reset database**: Remove volume and restart (⚠️ **WARNING**: This deletes all data)

## Production Recommendations

### 1. **Change Default Passwords**
```bash
# Update mongodb-secure.env with strong passwords
MONGO_ROOT_PASSWORD=YourStrongPassword123!@#
MONGO_APP_PASSWORD=YourAppPassword123!@#
```

### 2. **Enable SSL/TLS**
- Add SSL configuration to MongoDB
- Use certificates for secure connections
- Update connection strings in applications

### 3. **Regular Backups**
```bash
# Create automated backup script
#!/bin/bash
DATE=$(date +%Y%m%d_%H%M%S)
docker exec innkt-mongodb mongodump --username innkt_admin --password SecurePassword123!@# --authenticationDatabase admin --db innkt_messaging --out /backup/backup_$DATE
```

### 4. **Monitoring**
- Set up MongoDB monitoring
- Monitor disk space for volumes
- Set up alerts for failures

## Quick Commands

### Start Everything
```bash
docker-compose -f docker-compose-infrastructure-secure.yml up -d
```

### Stop Everything
```bash
docker-compose -f docker-compose-infrastructure-secure.yml down
```

### View Logs
```bash
docker logs -f innkt-mongodb
```

### Access MongoDB Shell
```bash
docker exec -it innkt-mongodb mongosh --username innkt_admin --password SecurePassword123!@# --authenticationDatabase admin
```

### Check Data
```bash
# In MongoDB shell
use innkt_messaging
db.conversations.find().pretty()
db.messages.find().pretty()
```

## Summary

✅ **Your MongoDB is configured for persistence**
✅ **Data will survive restarts**
✅ **Security is properly configured**
✅ **Initialization scripts are in place**

**Always use**: `docker-compose -f docker-compose-infrastructure-secure.yml up -d`

This ensures you get the secure, persistent MongoDB configuration every time!
