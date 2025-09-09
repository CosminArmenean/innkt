#!/bin/bash

# Build and Deploy Script with Immutable Tags
# Usage: ./scripts/build-and-deploy.sh [service-name] [environment]

set -e

SERVICE_NAME=${1:-"messaging"}
ENVIRONMENT=${2:-"dev"}
COMMIT_HASH=$(git rev-parse --short HEAD)
TIMESTAMP=$(date +%Y%m%d-%H%M%S)

# Create immutable tag
IMMUTABLE_TAG="sha-${COMMIT_HASH}-${TIMESTAMP}"
IMAGE_NAME="innkt-${SERVICE_NAME}"

echo "🏗️  Building ${IMAGE_NAME}:${IMMUTABLE_TAG}"

# Build the Docker image
case $SERVICE_NAME in
    "messaging")
        docker build -t ${IMAGE_NAME}:${IMMUTABLE_TAG} Backend/innkt.Messaging/
        ;;
    "officer")
        docker build -t ${IMAGE_NAME}:${IMMUTABLE_TAG} Backend/innkt.Officer/
        ;;
    "neurospark")
        docker build -t ${IMAGE_NAME}:${IMMUTABLE_TAG} Backend/innkt.NeuroSpark/
        ;;
    "seer")
        docker build -t ${IMAGE_NAME}:${IMMUTABLE_TAG} Backend/innkt.Seer/
        ;;
    "frontend")
        docker build -t ${IMAGE_NAME}:${IMMUTABLE_TAG} Frontend/
        ;;
    *)
        echo "❌ Unknown service: $SERVICE_NAME"
        echo "Available services: messaging, officer, neurospark, seer, frontend"
        exit 1
        ;;
esac

echo "✅ Image built successfully: ${IMAGE_NAME}:${IMMUTABLE_TAG}"

# Deploy to Kubernetes
echo "🚀 Deploying to Kubernetes..."
kubectl set image deployment/${SERVICE_NAME}-service ${SERVICE_NAME}-service=${IMAGE_NAME}:${IMMUTABLE_TAG} -n innkt

echo "⏳ Waiting for deployment to complete..."
kubectl rollout status deployment/${SERVICE_NAME}-service -n innkt --timeout=300s

echo "✅ Deployment completed successfully!"
echo "📊 Image: ${IMAGE_NAME}:${IMMUTABLE_TAG}"
echo "🔗 Commit: ${COMMIT_HASH}"
echo "⏰ Timestamp: ${TIMESTAMP}"

# Show pod status
echo "📋 Pod Status:"
kubectl get pods -n innkt -l app=${SERVICE_NAME}
