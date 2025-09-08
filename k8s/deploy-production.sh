#!/bin/bash

# INNKT Production Kubernetes Deployment Script
echo "🚀 Deploying INNKT Platform to Production Kubernetes..."

# Check if kubectl is available
if ! command -v kubectl &> /dev/null; then
    echo "❌ kubectl is not installed. Please install kubectl first."
    exit 1
fi

# Check if cluster is available
if ! kubectl cluster-info &> /dev/null; then
    echo "❌ No Kubernetes cluster is running. Please start a cluster first."
    echo "   Options:"
    echo "   - Enable Kubernetes in Docker Desktop"
    echo "   - Install and start Minikube: minikube start"
    echo "   - Install and start Kind: kind create cluster"
    echo "   - Connect to cloud cluster (AKS, EKS, GKE)"
    exit 1
fi

echo "✅ Kubernetes cluster is available"

# Check if Docker images are built
echo "🔍 Checking Docker images..."
required_images=("innkt-officer:latest" "innkt-frontier:latest" "innkt-neurospark:latest" "innkt-seer:latest" "innkt-messaging:latest")
missing_images=()

for image in "${required_images[@]}"; do
    if ! docker image inspect "$image" &> /dev/null; then
        missing_images+=("$image")
    fi
done

if [ ${#missing_images[@]} -ne 0 ]; then
    echo "❌ Missing Docker images:"
    for image in "${missing_images[@]}"; do
        echo "   - $image"
    done
    echo ""
    echo "Please build the images first:"
    echo "   ./build-docker.ps1 -Environment production"
    exit 1
fi

echo "✅ All required Docker images are available"

# Create namespace
echo "📦 Creating namespace..."
kubectl apply -f namespace.yaml

# Apply configuration
echo "⚙️  Applying configuration..."
kubectl apply -f configmap.yaml
kubectl apply -f secrets.yaml

# Deploy infrastructure services
echo "🏗️  Deploying infrastructure services..."
kubectl apply -f infrastructure.yaml

# Wait for infrastructure to be ready
echo "⏳ Waiting for infrastructure services to be ready..."
kubectl wait --for=condition=available --timeout=300s deployment/postgres -n innkt
kubectl wait --for=condition=available --timeout=300s deployment/redis -n innkt
kubectl wait --for=condition=available --timeout=300s deployment/mongodb -n innkt

# Deploy .NET microservices
echo "🔧 Deploying .NET microservices..."
kubectl apply -f officer-deployment.yaml
kubectl apply -f frontier-deployment.yaml
kubectl apply -f neurospark-deployment.yaml
kubectl apply -f seer-deployment.yaml

# Deploy messaging service
echo "💬 Deploying messaging service..."
kubectl apply -f messaging-deployment.yaml

# Deploy ingress
echo "🌐 Deploying ingress..."
kubectl apply -f ingress.yaml

# Wait for all services to be ready
echo "⏳ Waiting for all services to be ready..."
kubectl wait --for=condition=available --timeout=300s deployment/officer-service -n innkt
kubectl wait --for=condition=available --timeout=300s deployment/frontier-service -n innkt
kubectl wait --for=condition=available --timeout=300s deployment/neurospark-service -n innkt
kubectl wait --for=condition=available --timeout=300s deployment/seer-service -n innkt
kubectl wait --for=condition=available --timeout=300s deployment/messaging-service -n innkt

echo "✅ INNKT Platform deployed successfully!"
echo ""
echo "📊 Service Status:"
kubectl get pods -n innkt
echo ""
echo "🌐 Access URLs:"
echo "   API Gateway: http://localhost/api"
echo "   Identity Service: http://localhost/identity"
echo "   Messaging Service: http://localhost/messaging"
echo "   AI Service: http://localhost/ai"
echo "   WebRTC Service: http://localhost/webrtc"
echo ""
echo "🔍 To check logs:"
echo "   kubectl logs -f deployment/officer-service -n innkt"
echo "   kubectl logs -f deployment/frontier-service -n innkt"
echo "   kubectl logs -f deployment/neurospark-service -n innkt"
echo "   kubectl logs -f deployment/seer-service -n innkt"
echo "   kubectl logs -f deployment/messaging-service -n innkt"
echo ""
echo "📈 To scale services:"
echo "   kubectl scale deployment officer-service --replicas=3 -n innkt"
echo "   kubectl scale deployment messaging-service --replicas=5 -n innkt"
echo ""
echo "🔄 To update a service:"
echo "   kubectl rollout restart deployment/officer-service -n innkt"
