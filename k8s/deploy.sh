#!/bin/bash

# INNKT Kubernetes Deployment Script
echo "🚀 Deploying INNKT Platform to Kubernetes..."

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
    exit 1
fi

echo "✅ Kubernetes cluster is available"

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
echo ""
echo "🔍 To check logs:"
echo "   kubectl logs -f deployment/officer-service -n innkt"
echo "   kubectl logs -f deployment/frontier-service -n innkt"
echo "   kubectl logs -f deployment/neurospark-service -n innkt"
echo "   kubectl logs -f deployment/messaging-service -n innkt"
