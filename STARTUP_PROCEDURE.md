# INNKT Platform Startup Procedure

## Standard Startup Commands

When asked to start infrastructure and services, always use these commands in this exact order:

### 1. Start Infrastructure First
```bash
docker-compose -f docker-compose-infrastructure-secure.yml up -d
```

**⚠️ IMPORTANT**: Always use the `-secure` version to ensure MongoDB starts with authentication and your data persists!

This starts:
- PostgreSQL Database (port 5432)
- Redis Cache (port 6379) 
- MongoDB Database (port 27017)
- Kafka Message Broker (port 9092)
- Zookeeper (port 2181)
- Kafka UI (port 8080)

### 2. Start All Services
```powershell
.\start-services.ps1
```

This starts all backend and frontend services:
- Officer Service (Identity): http://localhost:5001
- Social Service (Posts/Groups): http://localhost:8081
- Groups Service (Group Mgmt): http://localhost:5002
- NeuroSpark Service (AI): http://localhost:5003
- Seer Service (Video Calls): http://localhost:5267
- Frontier Service (API Gateway): http://localhost:51303
- Messaging Service (Chat): http://localhost:3000
- React UI: http://localhost:3001

## Important Notes

- **Always start infrastructure first** - The start-services.ps1 script checks if infrastructure is running
- Infrastructure must be fully up before starting services
- Backend services run in background
- Messaging and React UI run in CMD windows for easy log monitoring
- Use this exact procedure every time to ensure consistent startup

## Verification

After startup, verify services are running by checking:
- Infrastructure: `docker ps`
- Services: Check CMD windows and background processes
- Health checks: Visit service URLs in browser
