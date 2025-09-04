# INNKT Platform - Kubernetes Deployment

This directory contains Kubernetes manifests for deploying the INNKT Platform microservices.

## Architecture

The INNKT Platform consists of the following microservices:

### .NET 9 Services
- **Officer Service** (Identity/Authentication) - Port 5001
- **Frontier Service** (API Gateway) - Port 5002  
- **NeuroSpark Service** (AI/ML Processing) - Port 5003

### Node.js Services
- **Messaging Service** (Real-time messaging) - Port 5003 (HTTP), 3000 (WebSocket)

### Infrastructure Services
- **PostgreSQL** - Database (Port 5432)
- **Redis** - Cache and Pub/Sub (Port 6379)
- **MongoDB** - Messaging storage (Port 27017)

## Prerequisites

1. **Kubernetes Cluster** - One of the following:
   - Docker Desktop with Kubernetes enabled
   - Minikube: `minikube start`
   - Kind: `kind create cluster`
   - Cloud Kubernetes (AKS, EKS, GKE)

2. **kubectl** - Kubernetes command-line tool

3. **Docker Images** - Build the required images:
   ```bash
   # From the innkt directory
   docker build -t innkt-officer -f Backend/innkt.Officer/Dockerfile Backend
   docker build -t innkt-frontier -f Backend/innkt.Frontier/Dockerfile Backend
   docker build -t innkt-neurospark -f Backend/innkt.NeuroSpark/Dockerfile Backend
   docker build -t innkt-messaging -f Backend/innkt.Messaging/Dockerfile Backend/innkt.Messaging
   ```

## Quick Deployment

### Option 1: Using the deployment script
```bash
chmod +x deploy.sh
./deploy.sh
```

### Option 2: Manual deployment
```bash
# Create namespace and configuration
kubectl apply -f namespace.yaml
kubectl apply -f configmap.yaml
kubectl apply -f secrets.yaml

# Deploy infrastructure
kubectl apply -f infrastructure.yaml

# Wait for infrastructure to be ready
kubectl wait --for=condition=available --timeout=300s deployment/postgres -n innkt
kubectl wait --for=condition=available --timeout=300s deployment/redis -n innkt
kubectl wait --for=condition=available --timeout=300s deployment/mongodb -n innkt

# Deploy microservices
kubectl apply -f officer-deployment.yaml
kubectl apply -f frontier-deployment.yaml
kubectl apply -f neurospark-deployment.yaml
kubectl apply -f messaging-deployment.yaml

# Deploy ingress
kubectl apply -f ingress.yaml
```

## Accessing Services

Once deployed, services are accessible via:

- **API Gateway**: http://localhost/api
- **Identity Service**: http://localhost/identity
- **Messaging Service**: http://localhost/messaging
- **AI Service**: http://localhost/ai
- **WebSocket**: ws://localhost/socket.io

## Monitoring

### Check service status
```bash
kubectl get pods -n innkt
kubectl get services -n innkt
kubectl get ingress -n innkt
```

### View logs
```bash
kubectl logs -f deployment/officer-service -n innkt
kubectl logs -f deployment/frontier-service -n innkt
kubectl logs -f deployment/neurospark-service -n innkt
kubectl logs -f deployment/messaging-service -n innkt
```

### Scale services
```bash
kubectl scale deployment officer-service --replicas=3 -n innkt
kubectl scale deployment messaging-service --replicas=5 -n innkt
```

## Cleanup

To remove all resources:
```bash
chmod +x cleanup.sh
./cleanup.sh
```

Or manually:
```bash
kubectl delete namespace innkt
```

## Configuration

### Environment Variables
- Configuration is managed via ConfigMaps and Secrets
- Database credentials are stored in secrets
- Service URLs are configured in the ConfigMap

### Resource Limits
- Each service has CPU and memory limits configured
- Officer/Frontier: 512Mi memory, 500m CPU
- NeuroSpark: 1Gi memory, 1000m CPU (AI processing)
- Messaging: 512Mi memory, 500m CPU

### Health Checks
- All services have liveness and readiness probes
- Health endpoints: `/health` and `/health/ready`

## Troubleshooting

### Common Issues

1. **Images not found**
   - Ensure Docker images are built and available locally
   - Check `imagePullPolicy: Never` in deployments

2. **Services not starting**
   - Check logs: `kubectl logs deployment/<service-name> -n innkt`
   - Verify database connectivity
   - Check resource limits

3. **Ingress not working**
   - Ensure ingress controller is installed
   - For Minikube: `minikube addons enable ingress`
   - For Docker Desktop: Enable ingress in settings

### Debug Commands
```bash
# Describe pod for detailed status
kubectl describe pod <pod-name> -n innkt

# Check events
kubectl get events -n innkt --sort-by='.lastTimestamp'

# Port forward for direct access
kubectl port-forward service/officer-service 5001:5001 -n innkt
```

## Benefits of Kubernetes Deployment

1. **Auto-scaling** - Services scale based on demand
2. **High Availability** - Multiple replicas with health checks
3. **Rolling Updates** - Zero-downtime deployments
4. **Service Discovery** - Built-in load balancing
5. **Resource Management** - Efficient CPU/memory usage
6. **Monitoring** - Built-in health checks and metrics
7. **Security** - Network policies and secrets management
