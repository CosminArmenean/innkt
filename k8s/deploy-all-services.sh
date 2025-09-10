#!/bin/bash

# Deploy All innkt Services to Kubernetes
# This script deploys all services in the correct dependency order

set -e

echo "🚀 Starting innkt Services Deployment..."

# Check if kubectl is available
if ! command -v kubectl &> /dev/null; then
    echo "❌ kubectl is not installed or not in PATH"
    exit 1
fi

# Check if namespace exists, create if not
echo "📋 Checking namespace..."
if ! kubectl get namespace innkt &> /dev/null; then
    echo "Creating namespace 'innkt'..."
    kubectl create namespace innkt
else
    echo "Namespace 'innkt' already exists"
fi

# Deploy infrastructure services first
echo "🏗️  Deploying infrastructure services..."

# 1. PostgreSQL
echo "  📊 Deploying PostgreSQL..."
kubectl apply -f postgres-deployment.yaml
kubectl apply -f postgres-service.yaml

# 2. Redis
echo "  🔴 Deploying Redis..."
kubectl apply -f redis-deployment.yaml
kubectl apply -f redis-service.yaml

# 3. Kafka
echo "  📨 Deploying Kafka..."
kubectl apply -f kafka-fixed-final.yaml

# Wait for infrastructure to be ready
echo "⏳ Waiting for infrastructure services to be ready..."
kubectl wait --for=condition=ready pod -l app=postgres -n innkt --timeout=300s
kubectl wait --for=condition=ready pod -l app=redis -n innkt --timeout=300s
kubectl wait --for=condition=ready pod -l app=kafka -n innkt --timeout=300s

# Deploy application services
echo "🔧 Deploying application services..."

# 4. ConfigMap
echo "  ⚙️  Updating ConfigMap..."
kubectl apply -f configmap.yaml

# 5. Officer Service (Identity)
echo "  👮 Deploying Officer Service (Identity)..."
kubectl apply -f officer-deployment.yaml

# 6. Messaging Service
echo "  💬 Deploying Messaging Service..."
kubectl apply -f messaging-deployment-fixed.yaml

# 7. NeuroSpark Service (AI/ML)
echo "  🧠 Deploying NeuroSpark Service (AI/ML)..."
kubectl apply -f neurospark-deployment.yaml

# 8. Seer Service (WebRTC)
echo "  📹 Deploying Seer Service (WebRTC)..."
kubectl apply -f seer-deployment.yaml

# 9. Frontend
echo "  🎨 Deploying Frontend..."
kubectl apply -f frontend-deployment.yaml

# Wait for all services to be ready
echo "⏳ Waiting for all services to be ready..."
kubectl wait --for=condition=ready pod -l app=officer-service -n innkt --timeout=300s
kubectl wait --for=condition=ready pod -l app=messaging-service -n innkt --timeout=300s
kubectl wait --for=condition=ready pod -l app=neurospark-service -n innkt --timeout=300s
kubectl wait --for=condition=ready pod -l app=seer-service -n innkt --timeout=300s
kubectl wait --for=condition=ready pod -l app=frontend-service -n innkt --timeout=300s

# Display status
echo "✅ Deployment completed! Here's the status:"
echo ""
kubectl get pods -n innkt
echo ""
kubectl get services -n innkt

echo ""
echo "🎉 All innkt services have been deployed successfully!"
echo ""
echo "📋 Service URLs (when port-forwarding is set up):"
echo "  Frontend: http://localhost:8080"
echo "  Officer (Identity): http://localhost:5001"
echo "  Messaging: http://localhost:5003"
echo "  NeuroSpark (AI/ML): http://localhost:5004"
echo "  Seer (WebRTC): http://localhost:5005"
echo ""
echo "🔧 To set up port forwarding, run:"
echo "  kubectl port-forward service/frontend-service 8080:80 -n innkt"
echo "  kubectl port-forward service/officer-service 5001:8080 -n innkt"
echo "  kubectl port-forward service/messaging-service 5003:5003 -n innkt"
echo "  kubectl port-forward service/neurospark-service 5004:8080 -n innkt"
echo "  kubectl port-forward service/seer-service 5005:8080 -n innkt"

