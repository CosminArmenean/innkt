# MongoDB Replica Set Setup Guide

## Overview

This guide explains how to set up and manage MongoDB replica sets for the INNKT platform. The setup uses two MongoDB instances running on different ports as members of a single replica set `rs0` to enable Change Streams for real-time updates.

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    MongoDB Replica Set (rs0)               │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  ┌─────────────────────┐    ┌─────────────────────────────┐ │
│  │   mongodb-social    │    │   mongodb-messaging         │ │
│  │   Port: 27018       │◄──►│   Port: 27017              │ │
│  │   Priority: 2       │    │   Priority: 1               │ │
│  │   (Primary)         │    │   (Secondary)               │ │
│  │                     │    │                             │ │
│  │   Database:         │    │   Database:                 │ │
│  │   innkt_social      │    │   innkt_messaging           │ │
│  └─────────────────────┘    └─────────────────────────────┘ │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

## Components

### 1. MongoDB Social Instance
- **Container**: `mongodb-social`
- **Host Port**: `27018`
- **Container Port**: `27017`
- **Database**: `innkt_social`
- **Role**: Primary member (priority 2)
- **Usage**: Social Service (Posts, Feeds, User interactions)

### 2. MongoDB Messaging Instance
- **Container**: `mongodb-messaging`
- **Host Port**: `27017`
- **Container Port**: `27017`
- **Database**: `innkt_messaging`
- **Role**: Secondary member (priority 1)
- **Usage**: Messaging Service (Chat, Messages, Conversations)

### 3. Replica Set Configuration
- **Name**: `rs0`
- **Members**: 2 (both instances)
- **Automatic Failover**: Enabled
- **Change Streams**: Enabled for real-time updates

## Connection Strings

### Social Service
```
mongodb://localhost:27018/innkt_social?replicaSet=rs0
```

### Messaging Service
```
mongodb://localhost:27017/innkt_messaging?replicaSet=rs0
```

## Files Structure

```
innkt/
├── docker-compose-mongodb.yml          # Main MongoDB setup
├── setup-mongodb-replica.ps1           # Setup script
├── start-mongodb-replica.ps1            # Start/restart script
├── stop-mongodb-replica.ps1             # Stop script
├── check-mongodb-status.ps1             # Status check script
└── MONGODB_REPLICA_SET_SETUP.md         # This documentation
```

## Setup Process

### 1. Initial Setup
Run the setup script to create the replica set for the first time:
```powershell
.\setup-mongodb-replica.ps1
```

### 2. Daily Operations
Use the start script to manage the instances:
```powershell
.\start-mongodb-replica.ps1
```

### 3. Status Checking
Check the health and status of the replica set:
```powershell
.\check-mongodb-status.ps1
```

### 4. Stopping
Stop all MongoDB instances:
```powershell
.\stop-mongodb-replica.ps1
```

## Key Features

### Change Streams Support
- **Real-time Updates**: Both services get instant notifications
- **No Polling**: Eliminates the need for 3-second polling
- **Efficient**: Lower CPU and network usage

### High Availability
- **Automatic Failover**: If primary fails, secondary becomes primary
- **Data Replication**: All data is synchronized between instances
- **Health Monitoring**: Built-in health checks and recovery

### Development Friendly
- **Single Machine**: Both instances run on the same development machine
- **Different Ports**: No conflicts between services
- **Docker Compose**: Easy management and consistent environments

## Troubleshooting

### Common Issues

#### 1. Replica Set Not Initialized
**Symptoms**: Services show "no replset config has been received"
**Solution**: Run the setup script or manually initialize:
```javascript
rs.initiate({
  _id: "rs0",
  members: [
    { _id: 0, host: "mongodb-social:27017", priority: 2 },
    { _id: 1, host: "mongodb-messaging:27017", priority: 1 }
  ]
});
```

#### 2. Port Conflicts
**Symptoms**: Container fails to start with port binding errors
**Solution**: Ensure ports 27017 and 27018 are free, or stop conflicting services

#### 3. No Primary Elected
**Symptoms**: All members show as SECONDARY
**Solution**: Wait 30 seconds for election, or restart the higher priority member

#### 4. Connection Timeouts
**Symptoms**: Services can't connect to MongoDB
**Solution**: Verify containers are running and health checks pass

### Health Check Commands

```bash
# Check container status
docker ps --filter "name=mongodb"

# Check replica set status
docker exec mongodb-social mongosh --eval "rs.status()"

# Test connections
docker exec mongodb-social mongosh --eval "db.adminCommand('ping')"
docker exec mongodb-messaging mongosh --eval "db.adminCommand('ping')"
```

## Best Practices

### 1. Always Use Scripts
- Use provided PowerShell scripts for consistency
- Don't manually start/stop containers unless necessary
- Scripts handle proper initialization and health checks

### 2. Monitor Logs
- Check Docker Compose logs for initialization issues
- Monitor application logs for connection problems
- Use health check endpoints in services

### 3. Data Backup
- Regularly backup both databases
- Test restore procedures
- Keep backups of replica set configuration

### 4. Development vs Production
- Development: Single machine, 2 members
- Production: Multiple machines, 3+ members for true high availability

## Security Notes

### Development Environment
- No authentication required for development
- Containers only accessible from localhost
- Network isolation via Docker networks

### Production Considerations
- Enable MongoDB authentication
- Use TLS/SSL for connections
- Implement proper firewall rules
- Regular security updates

## Performance Considerations

### Resource Usage
- Each MongoDB instance requires ~512MB RAM minimum
- Disk I/O is shared between instances on same machine
- CPU usage depends on Change Stream activity

### Optimization Tips
- Use SSD storage for better performance
- Monitor replica set lag in production
- Index frequently queried fields
- Limit Change Stream filters to reduce overhead

## Migration from Single Instance

If migrating from a single MongoDB instance:

1. **Backup existing data**
2. **Run setup script** to create replica set
3. **Update connection strings** in services
4. **Test Change Streams functionality**
5. **Migrate data** if needed between databases

## Support

For issues with the MongoDB replica set setup:

1. Check this documentation first
2. Run the status check script
3. Review Docker Compose logs
4. Check service application logs
5. Verify network connectivity between containers

---

**Last Updated**: September 2025  
**Version**: 1.0  
**Author**: INNKT Development Team
