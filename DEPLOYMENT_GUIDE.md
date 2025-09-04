# INNKT Platform Deployment Guide

## Quick Start

### 1. Prerequisites
- Docker and Docker Compose
- At least 8GB RAM
- Ports 3000, 5001-5005, 6379, 27017 available

### 2. Start All Services
```bash
# Clone repository
git clone <repository-url>
cd innkt

# Start all services
docker-compose up -d

# Check status
docker-compose ps
```

### 3. Access Applications
- **Frontend**: http://localhost:3000
- **Grafana**: http://localhost:3001 (admin/admin)
- **Prometheus**: http://localhost:9090

## Service Architecture

```
React Frontend (3000) → Frontier Gateway (5004) → Microservices
                                    ├── Officer (5001) - User Management
                                    ├── NeuroSpark (5002) - AI & Image Processing  
                                    └── Messaging (5003) - Real-time Chat
```

## Services

### Messaging Service (NEW)
- **Port**: 5003
- **Tech**: Node.js, Socket.IO, MongoDB
- **Features**: Real-time messaging, group chats, file sharing
- **Health**: `GET /health`

### Other Services
- **Officer**: User authentication & management
- **NeuroSpark**: AI, image processing, threat detection
- **Frontier**: API gateway with load balancing
- **React Frontend**: Complete social media platform

## Development

### Local Development
```bash
# Start infrastructure only
docker-compose up -d redis mongodb kafka

# Run services locally
cd Backend/innkt.Messaging && npm run dev
cd Backend/innkt.Officer && dotnet run
cd Frontend/innkt.React && npm start
```

### Environment Setup
```bash
# Messaging service
cp Backend/innkt.Messaging/env.example Backend/innkt.Messaging/.env

# Update .env with your settings
MONGODB_URI=mongodb://localhost:27017/innkt_messaging
REDIS_URL=redis://localhost:6379
JWT_SECRET=your-secret-key
```

## Troubleshooting

### Health Checks
```bash
curl http://localhost:5001/health  # Officer
curl http://localhost:5003/health  # Messaging
curl http://localhost:3000/health  # Frontend
```

### Logs
```bash
docker-compose logs -f messaging
docker-compose logs -f neurospark
```

### Common Issues
1. **Port conflicts**: Check `netstat -tulpn | grep :5003`
2. **Database connections**: Test Redis/MongoDB connectivity
3. **Service dependencies**: Ensure all services start in correct order

## Production Notes

1. **Security**: Update JWT secrets, enable HTTPS
2. **Databases**: Use production MongoDB/SQL Server instances
3. **Monitoring**: Configure Grafana dashboards
4. **Scaling**: Use `docker-compose up -d --scale messaging=3`

## Features Implemented

✅ **Phase 6A Complete**: Socket.IO messaging service with MongoDB
✅ **Frontend Integration**: React components for real-time chat
✅ **Frontier Integration**: Load balancing through API gateway
✅ **Docker Support**: Complete containerization
✅ **Monitoring**: Prometheus + Grafana setup

## Next Steps

1. Test messaging functionality
2. Configure production databases
3. Set up monitoring dashboards
4. Implement CI/CD pipelines