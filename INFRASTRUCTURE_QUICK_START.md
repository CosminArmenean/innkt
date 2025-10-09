# INNKT Infrastructure Quick Start Guide

This guide provides simple commands to manage the INNKT platform infrastructure.

## Prerequisites

- Docker Desktop installed and running
- PowerShell 5.1 or higher

## Quick Commands

### Start Infrastructure

```powershell
.\start-infra-simple.ps1
```

This will start all required infrastructure services:
- PostgreSQL Database (port 5433)
- Redis Cache (port 6379)
- MongoDB Social (port 27018)
- MongoDB Messaging (port 27017)
- Kafka Message Broker (port 9092)
- Zookeeper (port 2181)
- Kafka UI (port 8080)

### Stop Infrastructure

```powershell
.\stop-infra-simple.ps1
```

This will stop and remove all infrastructure containers.

### Check Infrastructure Status

```powershell
docker ps
```

View all running containers.

### View Logs

```powershell
# All infrastructure logs
docker-compose -f docker-compose-infrastructure.yml logs -f

# Specific service logs
docker logs innkt-postgres -f
docker logs innkt-redis -f
docker logs mongodb-social -f
docker logs mongodb-messaging -f
docker logs innkt-kafka -f
```

## Infrastructure Services

| Service | Port | Container Name | Health Check |
|---------|------|----------------|--------------|
| PostgreSQL | 5433 | innkt-postgres | ✓ |
| Redis | 6379 | innkt-redis | ✓ |
| MongoDB (Social) | 27018 | mongodb-social | ✓ |
| MongoDB (Messaging) | 27017 | mongodb-messaging | ✓ |
| Kafka | 9092 | innkt-kafka | ✓ |
| Zookeeper | 2181 | innkt-zookeeper | ✓ |
| Kafka UI | 8080 | innkt-kafka-ui | - |

## Next Steps

After infrastructure is running:

1. **Start Backend Services**
   ```powershell
   .\start-services.ps1
   ```

2. **Start Frontend**
   ```powershell
   cd Frontend/innkt.react
   npm start
   ```

## Troubleshooting

### Docker not running
```
ERROR: Docker is not running!
```
**Solution**: Start Docker Desktop and wait for it to fully initialize.

### Port already in use
```
ERROR: Port 5433 is already allocated
```
**Solution**: Stop any services using the required ports or change the port mappings in docker-compose files.

### Container health check failing
```powershell
# Check specific container logs
docker logs <container-name>

# Restart a specific container
docker restart <container-name>

# Restart all infrastructure
.\stop-infra-simple.ps1
.\start-infra-simple.ps1
```

### View container resource usage
```powershell
docker stats
```

## Manual Commands (Advanced)

### Start infrastructure manually
```powershell
docker-compose -f docker-compose-infrastructure.yml -f docker-compose-mongodb.yml up -d
```

### Stop infrastructure manually
```powershell
docker-compose -f docker-compose-infrastructure.yml -f docker-compose-mongodb.yml down
```

### Remove all containers and volumes (clean slate)
```powershell
docker-compose -f docker-compose-infrastructure.yml -f docker-compose-mongodb.yml down -v
```
**Warning**: This will delete all data in the databases!

## File Structure

```
innkt/
├── start-infra-simple.ps1              # Start infrastructure
├── stop-infra-simple.ps1               # Stop infrastructure
├── docker-compose-infrastructure.yml   # PostgreSQL, Redis, Kafka, Zookeeper
├── docker-compose-mongodb.yml          # MongoDB services
└── INFRASTRUCTURE_QUICK_START.md       # This file
```

## Notes

- The infrastructure must be running before starting backend services
- Data persists in Docker volumes even when containers are stopped
- Use `docker-compose down -v` only if you want to completely reset the databases
- Kafka UI is available at http://localhost:8080 for monitoring message queues

