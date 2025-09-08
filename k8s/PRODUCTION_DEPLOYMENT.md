# INNKT Platform - Production Kubernetes Deployment Guide

## 🚀 Production Deployment Overview

This guide covers deploying the INNKT Platform to production using Kubernetes with enterprise-grade configurations.

## 📋 Prerequisites

### 1. Kubernetes Cluster
- **Cloud Providers**: AKS (Azure), EKS (AWS), GKE (Google Cloud)
- **On-Premises**: OpenShift, Rancher, or self-managed Kubernetes
- **Local Development**: Docker Desktop, Minikube, or Kind

### 2. Required Tools
```bash
# Install kubectl
curl -LO "https://dl.k8s.io/release/$(curl -L -s https://dl.k8s.io/release/stable.txt)/bin/linux/amd64/kubectl"
chmod +x kubectl
sudo mv kubectl /usr/local/bin/

# Install Helm (for package management)
curl https://raw.githubusercontent.com/helm/helm/main/scripts/get-helm-3 | bash
```

### 3. Docker Images
Build and push images to your container registry:
```bash
# Build all images
./build-docker.ps1 -Environment production -Tag v1.0.0

# Push to registry (example with Azure Container Registry)
docker tag innkt-officer:latest your-registry.azurecr.io/innkt-officer:v1.0.0
docker push your-registry.azurecr.io/innkt-officer:v1.0.0
```

## 🏗️ Production Architecture

### Microservices
- **Officer Service** (Identity/Auth) - 2 replicas
- **Frontier Service** (API Gateway) - 2 replicas  
- **NeuroSpark Service** (AI/ML) - 2 replicas
- **Seer Service** (WebRTC) - 2 replicas
- **Messaging Service** (Real-time) - 3 replicas

### Infrastructure
- **PostgreSQL** - Primary database
- **MongoDB** - Messaging storage
- **Redis** - Cache and Pub/Sub
- **Kafka** - Event streaming

### Networking
- **Ingress Controller** - NGINX or Traefik
- **Service Mesh** - Istio (optional)
- **Load Balancer** - Cloud provider LB

## 🔧 Production Configuration

### 1. Environment Variables
Update `configmap.yaml` for production:
```yaml
data:
  ASPNETCORE_ENVIRONMENT: "Production"
  POSTGRES_DB: "innkt_production"
  KAFKA_BOOTSTRAP_SERVERS: "kafka-cluster:9092"
```

### 2. Secrets Management
Update `secrets.yaml` with production secrets:
```yaml
data:
  postgres-password: <base64-encoded-production-password>
  jwt-secret: <base64-encoded-jwt-secret>
  encryption-key: <base64-encoded-encryption-key>
```

### 3. Resource Limits
Production resource allocation:
- **Officer/Frontier**: 1Gi memory, 1000m CPU
- **NeuroSpark**: 2Gi memory, 2000m CPU (AI processing)
- **Seer**: 1Gi memory, 1000m CPU (WebRTC)
- **Messaging**: 1Gi memory, 1000m CPU (real-time)

## 🚀 Deployment Steps

### 1. Quick Deployment
```bash
# Make script executable
chmod +x deploy-production.sh

# Deploy to production
./deploy-production.sh
```

### 2. Manual Deployment
```bash
# Create namespace
kubectl apply -f namespace.yaml

# Apply configuration
kubectl apply -f configmap.yaml
kubectl apply -f secrets.yaml

# Deploy infrastructure
kubectl apply -f infrastructure.yaml

# Wait for infrastructure
kubectl wait --for=condition=available --timeout=300s deployment/postgres -n innkt
kubectl wait --for=condition=available --timeout=300s deployment/redis -n innkt
kubectl wait --for=condition=available --timeout=300s deployment/mongodb -n innkt

# Deploy microservices
kubectl apply -f officer-deployment.yaml
kubectl apply -f frontier-deployment.yaml
kubectl apply -f neurospark-deployment.yaml
kubectl apply -f seer-deployment.yaml
kubectl apply -f messaging-deployment.yaml

# Deploy ingress
kubectl apply -f ingress.yaml
```

## 📊 Monitoring and Observability

### 1. Health Checks
All services include:
- **Liveness Probes**: `/health`
- **Readiness Probes**: `/health/ready`
- **Startup Probes**: Initial delay for slow-starting services

### 2. Logging
```bash
# View logs
kubectl logs -f deployment/officer-service -n innkt
kubectl logs -f deployment/messaging-service -n innkt

# Log aggregation (recommended)
# - ELK Stack (Elasticsearch, Logstash, Kibana)
# - Fluentd + Elasticsearch
# - Cloud logging (Azure Monitor, CloudWatch, Stackdriver)
```

### 3. Metrics
```bash
# Check resource usage
kubectl top pods -n innkt
kubectl top nodes

# Prometheus + Grafana (recommended)
# - Application metrics
# - Infrastructure metrics
# - Custom business metrics
```

## 🔒 Security Best Practices

### 1. Network Policies
```yaml
apiVersion: networking.k8s.io/v1
kind: NetworkPolicy
metadata:
  name: innkt-network-policy
  namespace: innkt
spec:
  podSelector: {}
  policyTypes:
  - Ingress
  - Egress
  ingress:
  - from:
    - namespaceSelector:
        matchLabels:
          name: innkt
```

### 2. Pod Security Standards
```yaml
apiVersion: v1
kind: Namespace
metadata:
  name: innkt
  labels:
    pod-security.kubernetes.io/enforce: restricted
    pod-security.kubernetes.io/audit: restricted
    pod-security.kubernetes.io/warn: restricted
```

### 3. RBAC
```yaml
apiVersion: rbac.authorization.k8s.io/v1
kind: Role
metadata:
  namespace: innkt
  name: innkt-service-role
rules:
- apiGroups: [""]
  resources: ["secrets", "configmaps"]
  verbs: ["get", "list"]
```

## 📈 Scaling and Performance

### 1. Horizontal Pod Autoscaler
```yaml
apiVersion: autoscaling/v2
kind: HorizontalPodAutoscaler
metadata:
  name: messaging-hpa
  namespace: innkt
spec:
  scaleTargetRef:
    apiVersion: apps/v1
    kind: Deployment
    name: messaging-service
  minReplicas: 3
  maxReplicas: 10
  metrics:
  - type: Resource
    resource:
      name: cpu
      target:
        type: Utilization
        averageUtilization: 70
```

### 2. Vertical Pod Autoscaler
```yaml
apiVersion: autoscaling.k8s.io/v1
kind: VerticalPodAutoscaler
metadata:
  name: officer-vpa
  namespace: innkt
spec:
  targetRef:
    apiVersion: apps/v1
    kind: Deployment
    name: officer-service
  updatePolicy:
    updateMode: "Auto"
```

## 🔄 CI/CD Integration

### 1. GitHub Actions
```yaml
name: Deploy to Production
on:
  push:
    branches: [main]
jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
    - uses: actions/checkout@v2
    - name: Deploy to Kubernetes
      run: |
        kubectl apply -f k8s/
        kubectl rollout restart deployment/officer-service -n innkt
```

### 2. Azure DevOps
```yaml
trigger:
- main
pool:
  vmImage: 'ubuntu-latest'
steps:
- task: Kubernetes@1
  inputs:
    connectionType: 'Kubernetes Service Connection'
    command: 'apply'
    useConfigurationFile: true
    configuration: 'k8s/'
```

## 🚨 Troubleshooting

### Common Issues

1. **Pod CrashLoopBackOff**
   ```bash
   kubectl describe pod <pod-name> -n innkt
   kubectl logs <pod-name> -n innkt --previous
   ```

2. **Service Not Accessible**
   ```bash
   kubectl get services -n innkt
   kubectl get ingress -n innkt
   kubectl describe ingress innkt-ingress -n innkt
   ```

3. **Database Connection Issues**
   ```bash
   kubectl exec -it deployment/postgres -n innkt -- psql -U innkt_user -d innkt_db
   kubectl logs deployment/officer-service -n innkt | grep -i connection
   ```

### Debug Commands
```bash
# Check cluster status
kubectl cluster-info
kubectl get nodes

# Check namespace resources
kubectl get all -n innkt

# Port forward for testing
kubectl port-forward service/officer-service 5001:5001 -n innkt

# Execute commands in pods
kubectl exec -it deployment/postgres -n innkt -- bash
```

## 📋 Production Checklist

- [ ] Kubernetes cluster configured
- [ ] Container registry set up
- [ ] Images built and pushed
- [ ] Secrets configured
- [ ] ConfigMaps updated
- [ ] Resource limits set
- [ ] Health checks configured
- [ ] Ingress controller installed
- [ ] Monitoring stack deployed
- [ ] Backup strategy implemented
- [ ] Security policies applied
- [ ] CI/CD pipeline configured
- [ ] Load testing completed
- [ ] Disaster recovery plan ready

## 🎯 Next Steps

1. **Monitoring**: Set up Prometheus + Grafana
2. **Logging**: Implement ELK stack
3. **Backup**: Configure database backups
4. **Security**: Implement network policies
5. **Performance**: Set up autoscaling
6. **CI/CD**: Configure deployment pipeline
7. **Testing**: Implement automated testing
8. **Documentation**: Create runbooks

## 📞 Support

For production deployment support:
- Check logs: `kubectl logs -f deployment/<service> -n innkt`
- Monitor resources: `kubectl top pods -n innkt`
- Review events: `kubectl get events -n innkt --sort-by='.lastTimestamp'`
