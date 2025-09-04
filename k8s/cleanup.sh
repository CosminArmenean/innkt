#!/bin/bash

# INNKT Kubernetes Cleanup Script
echo "🧹 Cleaning up INNKT Platform from Kubernetes..."

# Delete all resources
kubectl delete -f ingress.yaml --ignore-not-found=true
kubectl delete -f messaging-deployment.yaml --ignore-not-found=true
kubectl delete -f neurospark-deployment.yaml --ignore-not-found=true
kubectl delete -f frontier-deployment.yaml --ignore-not-found=true
kubectl delete -f officer-deployment.yaml --ignore-not-found=true
kubectl delete -f infrastructure.yaml --ignore-not-found=true
kubectl delete -f secrets.yaml --ignore-not-found=true
kubectl delete -f configmap.yaml --ignore-not-found=true
kubectl delete -f namespace.yaml --ignore-not-found=true

echo "✅ INNKT Platform cleaned up successfully!"
