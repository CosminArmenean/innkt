# 🐳 INNKT Microservices Docker Setup

This document explains how to run the complete INNKT microservices stack using Docker.

## 🚀 Quick Start

### Prerequisites
- Docker Desktop installed and running
- Docker Compose available
- At least 8GB RAM available for Docker
- Ports 80, 3000, 5004-5007, 5432, 6379, 8080-8082, 9090, 9092, 2181 available

### Start All Services
```bash
# Using the startup script (recommended)
./scripts/start-docker.sh          # Linux/Mac
./scripts/start-docker.ps1         # Windows PowerShell

# Or manually
docker-compose up -d
```

### Stop All Services
```bash
docker-compose down
```

## 🏗️ Architecture Overview

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Web Client   │    │   Nginx LB      │    │   Prometheus    │
│   (React)      │    │   (Port 80)     │    │   (Port 9090)   │
└─────────────────┘    └─────────────────┘    └─────────────────┘
         │                       │                       │
         └───────────────────────┼───────────────────────┘
                                 │
                    ┌─────────────┴─────────────┐
                    │                           │
            ┌───────────────┐         ┌───────────────┐
            │   Officer     │         │  NeuroSpark   │
            │ (Port 5004)   │         │ (Port 5006)   │
            └───────────────┘         └───────────────┘
                    │                           │
                    └───────────┬───────────────┘
                                │
        ┌───────────────────────┼───────────────────────┐
        │                       │                       │
┌───────────────┐     ┌───────────────┐     ┌───────────────┐
│  PostgreSQL  │     │     Redis     │     │     Kafka     │
│ (Port 5432)  │     │  (Port 6379)  │     │ (Port 9092)   │
└───────────────┘     └───────────────┘     └───────────────┘
                                │                       │
                                └───────────┬───────────┘
                                            │
                                    ┌───────────────┐
                                    │   Zookeeper   │
                                    │ (Port 2181)   │
                                    └───────────────┘
```

## 📊 Service Details

### Core Services
| Service | Port | Description | Health Check |
|---------|------|-------------|--------------|
| **Web Client** | 3000 | React frontend application | http://localhost:3000 |
| **Officer** | 5004 | Identity & authentication service | http://localhost:5004/health |
| **NeuroSpark** | 5006 | AI & image processing service | http://localhost:5006/health |
| **Nginx** | 80 | Load balancer & reverse proxy | http://localhost/health |

### Infrastructure
| Service | Port | Description | Health Check |
|---------|------|-------------|--------------|
| **PostgreSQL** | 5432 | Primary database | `pg_isready` |
| **Redis** | 6379 | Caching & session storage | `redis-cli ping` |
| **Kafka** | 9092 | Message queue | `kafka-topics --list` |
| **Zookeeper** | 2181 | Kafka coordination | `echo ruok` |

### Monitoring & Development Tools
| Service | Port | Description | Credentials |
|---------|------|-------------|-------------|
| **Prometheus** | 9090 | Metrics collection | N/A |
| **Grafana** | 3001 | Metrics visualization | admin/admin123 |
| **Adminer** | 8080 | Database management | N/A |
| **Kafka UI** | 8081 | Kafka management | N/A |
| **Redis Commander** | 8082 | Redis management | N/A |

## 🔧 Configuration

### Environment Variables
Key environment variables can be modified in `docker-compose.yml`:

```yaml
# Database
POSTGRES_DB: innkt_db
POSTGRES_USER: innkt_user
POSTGRES_PASSWORD: innkt_password_2024

# Redis
Redis__ConnectionString: redis:6379,password=innkt_redis_2024

# Kafka
Kafka__BootstrapServers: kafka:29092
```

### Development vs Production
- **Development**: Uses `docker-compose.override.yml` for additional tools and debugging
- **Production**: Uses only `docker-compose.yml` for minimal, secure setup

## 📝 Usage Examples

### Check Service Status
```bash
# All services
docker-compose ps

# Specific service logs
docker-compose logs -f neurospark
docker-compose logs -f officer
```

### Access Services
```bash
# Web Client
curl http://localhost:3000

# Officer Service
curl http://localhost:5004/health

# NeuroSpark Service
curl http://localhost:5006/health

# API Gateway (via Nginx)
curl http://localhost/api/neurospark/health
curl http://localhost/api/officer/health
```

### Database Operations
```bash
# Connect to PostgreSQL
docker-compose exec postgres psql -U innkt_user -d innkt_db

# Connect to Redis
docker-compose exec redis redis-cli -a innkt_redis_2024
```

### Kafka Operations
```bash
# List topics
docker-compose exec kafka kafka-topics --bootstrap-server localhost:9092 --list

# Create topic
docker-compose exec kafka kafka-topics --bootstrap-server localhost:9092 --create --topic test-topic --partitions 1 --replication-factor 1
```

## 🚨 Troubleshooting

### Common Issues

#### Service Won't Start
```bash
# Check logs
docker-compose logs [service-name]

# Check resource usage
docker stats

# Restart specific service
docker-compose restart [service-name]
```

#### Port Already in Use
```bash
# Find process using port
netstat -ano | findstr :5004    # Windows
lsof -i :5004                   # Linux/Mac

# Kill process or change port in docker-compose.yml
```

#### Database Connection Issues
```bash
# Check PostgreSQL health
docker-compose exec postgres pg_isready -U innkt_user -d innkt_db

# Check Redis health
docker-compose exec redis redis-cli -a innkt_redis_2024 ping
```

#### Memory Issues
- Increase Docker Desktop memory limit (recommended: 8GB+)
- Check `docker stats` for memory usage
- Consider stopping unused services

### Health Checks
All services include health checks. Monitor with:
```bash
# Overall health
docker-compose ps

# Individual health endpoints
curl http://localhost:5004/health
curl http://localhost:5006/health
curl http://localhost/health
```

## 🔒 Security Notes

### Production Considerations
- Change default passwords in `docker-compose.yml`
- Use secrets management for sensitive data
- Enable SSL/TLS with proper certificates
- Restrict network access to necessary ports only
- Regular security updates for base images

### Development Security
- Services run in isolated Docker network
- No external access by default
- Development tools accessible only locally

## 📚 Additional Resources

### Documentation
- [Docker Compose Reference](https://docs.docker.com/compose/)
- [Nginx Configuration](https://nginx.org/en/docs/)
- [Prometheus Configuration](https://prometheus.io/docs/prometheus/latest/configuration/)
- [Grafana Documentation](https://grafana.com/docs/)

### Monitoring
- **Grafana Dashboards**: http://localhost:3001
- **Prometheus Targets**: http://localhost:9090/targets
- **Service Metrics**: Available at `/metrics` endpoints

### Development
- **API Documentation**: http://localhost:5006/swagger
- **Database Management**: http://localhost:8080
- **Kafka Management**: http://localhost:8081
- **Redis Management**: http://localhost:8082

## 🆘 Support

For issues or questions:
1. Check service logs: `docker-compose logs [service-name]`
2. Verify Docker resources and memory
3. Check port availability
4. Review this documentation
5. Check the main project README for additional context

---

**Happy Dockerizing! 🐳✨**


