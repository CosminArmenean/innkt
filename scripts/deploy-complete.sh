#!/bin/bash

# INNKT Platform Complete Deployment Script
# This script deploys the entire INNKT platform with monitoring

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
NAMESPACE="innkt"
MONITORING_NAMESPACE="monitoring"
CLUSTER_NAME="innkt-cluster"

echo -e "${BLUE}🚀 INNKT Platform Complete Deployment${NC}"
echo "=================================="

# Function to print status
print_status() {
    echo -e "${GREEN}✅ $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

print_error() {
    echo -e "${RED}❌ $1${NC}"
}

# Check prerequisites
check_prerequisites() {
    echo -e "${BLUE}📋 Checking prerequisites...${NC}"
    
    if ! command -v kubectl &> /dev/null; then
        print_error "kubectl is not installed"
        exit 1
    fi
    
    if ! command -v kind &> /dev/null; then
        print_error "kind is not installed"
        exit 1
    fi
    
    if ! command -v docker &> /dev/null; then
        print_error "docker is not installed"
        exit 1
    fi
    
    print_status "All prerequisites are installed"
}

# Create Kind cluster
create_cluster() {
    echo -e "${BLUE}🏗️  Creating Kind cluster...${NC}"
    
    # Check if cluster already exists
    if kind get clusters | grep -q "$CLUSTER_NAME"; then
        print_warning "Cluster $CLUSTER_NAME already exists"
        read -p "Do you want to delete and recreate it? (y/N): " -n 1 -r
        echo
        if [[ $REPLY =~ ^[Yy]$ ]]; then
            kind delete cluster --name "$CLUSTER_NAME"
        else
            print_status "Using existing cluster"
            return
        fi
    fi
    
    # Create cluster configuration
    cat <<EOF > kind-config.yaml
kind: Cluster
apiVersion: kind.x-k8s.io/v1alpha4
nodes:
- role: control-plane
  kubeadmConfigPatches:
  - |
    kind: InitConfiguration
    nodeRegistration:
      kubeletExtraArgs:
        node-labels: "ingress-ready=true"
  extraPortMappings:
  - containerPort: 80
    hostPort: 80
    protocol: TCP
  - containerPort: 443
    hostPort: 443
    protocol: TCP
  - containerPort: 3000
    hostPort: 3000
    protocol: TCP
  - containerPort: 9090
    hostPort: 9090
    protocol: TCP
EOF
    
    kind create cluster --name "$CLUSTER_NAME" --config kind-config.yaml
    print_status "Kind cluster created successfully"
    
    # Clean up config file
    rm kind-config.yaml
}

# Build and load Docker images
build_and_load_images() {
    echo -e "${BLUE}🔨 Building and loading Docker images...${NC}"
    
    # Build Officer service
    echo "Building Officer service..."
    docker build -t innkt-officer:latest -f Backend/innkt.Officer/Dockerfile Backend/
    kind load docker-image innkt-officer:latest --name "$CLUSTER_NAME"
    print_status "Officer service image loaded"
    
    # Build Frontier service
    echo "Building Frontier service..."
    docker build -t innkt-frontier:latest -f Backend/innkt.Frontier/Dockerfile Backend/
    kind load docker-image innkt-frontier:latest --name "$CLUSTER_NAME"
    print_status "Frontier service image loaded"
    
    # Build NeuroSpark service
    echo "Building NeuroSpark service..."
    docker build -t innkt-neurospark:latest -f Backend/innkt.NeuroSpark/innkt.NeuroSpark/Dockerfile Backend/
    kind load docker-image innkt-neurospark:latest --name "$CLUSTER_NAME"
    print_status "NeuroSpark service image loaded"
    
    # Build Messaging service
    echo "Building Messaging service..."
    docker build -t innkt-messaging:latest -f Backend/innkt.Messaging/Dockerfile Backend/innkt.Messaging/
    kind load docker-image innkt-messaging:latest --name "$CLUSTER_NAME"
    print_status "Messaging service image loaded"
    
    # Build Frontend
    echo "Building Frontend..."
    docker build -t innkt-frontend:latest -f Frontend/innkt.react/Dockerfile Frontend/innkt.react/
    kind load docker-image innkt-frontend:latest --name "$CLUSTER_NAME"
    print_status "Frontend image loaded"
}

# Deploy infrastructure
deploy_infrastructure() {
    echo -e "${BLUE}🏗️  Deploying infrastructure...${NC}"
    
    # Create namespaces
    kubectl apply -f k8s/namespace.yaml
    kubectl create namespace monitoring --dry-run=client -o yaml | kubectl apply -f -
    print_status "Namespaces created"
    
    # Deploy infrastructure services
    kubectl apply -f k8s/infrastructure.yaml
    print_status "Infrastructure services deployed"
    
    # Wait for infrastructure to be ready
    echo "Waiting for infrastructure services to be ready..."
    kubectl wait --for=condition=available --timeout=300s deployment/postgres -n "$NAMESPACE"
    kubectl wait --for=condition=available --timeout=300s deployment/redis -n "$NAMESPACE"
    kubectl wait --for=condition=available --timeout=300s deployment/mongodb -n "$NAMESPACE"
    print_status "Infrastructure services are ready"
}

# Deploy application services
deploy_application() {
    echo -e "${BLUE}🚀 Deploying application services...${NC}"
    
    # Deploy configuration
    kubectl apply -f k8s/configmap.yaml
    kubectl apply -f k8s/secrets.yaml
    print_status "Configuration deployed"
    
    # Deploy services
    kubectl apply -f k8s/officer-deployment.yaml
    kubectl apply -f k8s/frontier-deployment.yaml
    kubectl apply -f k8s/neurospark-deployment.yaml
    kubectl apply -f k8s/messaging-deployment.yaml
    kubectl apply -f k8s/frontend-deployment.yaml
    print_status "Application services deployed"
    
    # Wait for services to be ready
    echo "Waiting for application services to be ready..."
    kubectl wait --for=condition=available --timeout=300s deployment/officer-service -n "$NAMESPACE"
    kubectl wait --for=condition=available --timeout=300s deployment/messaging-service -n "$NAMESPACE"
    kubectl wait --for=condition=available --timeout=300s deployment/frontend-service -n "$NAMESPACE"
    print_status "Application services are ready"
}

# Deploy monitoring
deploy_monitoring() {
    echo -e "${BLUE}📊 Deploying monitoring stack...${NC}"
    
    # Deploy Prometheus
    kubectl apply -f monitoring/prometheus.yml
    print_status "Prometheus deployed"
    
    # Deploy Grafana
    kubectl apply -f monitoring/grafana/dashboard.yaml
    print_status "Grafana deployed"
    
    # Wait for monitoring to be ready
    echo "Waiting for monitoring services to be ready..."
    kubectl wait --for=condition=available --timeout=300s deployment/prometheus-server -n "$MONITORING_NAMESPACE"
    kubectl wait --for=condition=available --timeout=300s deployment/grafana -n "$MONITORING_NAMESPACE"
    print_status "Monitoring services are ready"
}

# Deploy ingress
deploy_ingress() {
    echo -e "${BLUE}🌐 Deploying ingress...${NC}"
    
    # Install NGINX ingress controller
    kubectl apply -f https://raw.githubusercontent.com/kubernetes/ingress-nginx/main/deploy/static/provider/kind/deploy.yaml
    print_status "NGINX ingress controller installed"
    
    # Wait for ingress controller
    kubectl wait --namespace ingress-nginx \
      --for=condition=ready pod \
      --selector=app.kubernetes.io/component=controller \
      --timeout=300s
    print_status "NGINX ingress controller is ready"
    
    # Deploy ingress
    kubectl apply -f k8s/ingress.yaml
    print_status "Ingress deployed"
}

# Run health checks
run_health_checks() {
    echo -e "${BLUE}🏥 Running health checks...${NC}"
    
    # Port forward services for testing
    kubectl port-forward service/officer-service 5001:5001 -n "$NAMESPACE" &
    kubectl port-forward service/messaging-service 5003:5003 -n "$NAMESPACE" &
    kubectl port-forward service/frontend-service 8080:80 -n "$NAMESPACE" &
    kubectl port-forward service/grafana 3000:80 -n "$MONITORING_NAMESPACE" &
    kubectl port-forward service/prometheus-server 9090:80 -n "$MONITORING_NAMESPACE" &
    
    # Wait for port forwarding
    sleep 10
    
    # Test health endpoints
    echo "Testing Officer service..."
    if curl -f http://localhost:5001/health > /dev/null 2>&1; then
        print_status "Officer service is healthy"
    else
        print_error "Officer service health check failed"
    fi
    
    echo "Testing Messaging service..."
    if curl -f http://localhost:5003/health > /dev/null 2>&1; then
        print_status "Messaging service is healthy"
    else
        print_error "Messaging service health check failed"
    fi
    
    echo "Testing Frontend..."
    if curl -f http://localhost:8080 > /dev/null 2>&1; then
        print_status "Frontend is accessible"
    else
        print_error "Frontend health check failed"
    fi
    
    echo "Testing Grafana..."
    if curl -f http://localhost:3000 > /dev/null 2>&1; then
        print_status "Grafana is accessible"
    else
        print_error "Grafana health check failed"
    fi
    
    echo "Testing Prometheus..."
    if curl -f http://localhost:9090 > /dev/null 2>&1; then
        print_status "Prometheus is accessible"
    else
        print_error "Prometheus health check failed"
    fi
}

# Run load tests
run_load_tests() {
    echo -e "${BLUE}⚡ Running load tests...${NC}"
    
    cd scripts
    npm install
    node simple-load-test.js
    cd ..
    
    print_status "Load tests completed"
}

# Display access information
display_access_info() {
    echo -e "${BLUE}🌐 Access Information${NC}"
    echo "=================="
    echo ""
    echo "Frontend Application:"
    echo "  URL: http://localhost:8080"
    echo "  Port Forward: kubectl port-forward service/frontend-service 8080:80 -n $NAMESPACE"
    echo ""
    echo "API Services:"
    echo "  Officer API: http://localhost:5001"
    echo "  Messaging API: http://localhost:5003"
    echo "  Port Forward: kubectl port-forward service/officer-service 5001:5001 -n $NAMESPACE"
    echo "  Port Forward: kubectl port-forward service/messaging-service 5003:5003 -n $NAMESPACE"
    echo ""
    echo "Monitoring:"
    echo "  Grafana: http://localhost:3000 (admin/admin123)"
    echo "  Prometheus: http://localhost:9090"
    echo "  Port Forward: kubectl port-forward service/grafana 3000:80 -n $MONITORING_NAMESPACE"
    echo "  Port Forward: kubectl port-forward service/prometheus-server 9090:80 -n $MONITORING_NAMESPACE"
    echo ""
    echo "Kubernetes Dashboard:"
    echo "  kubectl get pods -n $NAMESPACE"
    echo "  kubectl get services -n $NAMESPACE"
    echo "  kubectl logs -f deployment/officer-service -n $NAMESPACE"
    echo ""
    echo -e "${GREEN}🎉 INNKT Platform deployment completed successfully!${NC}"
}

# Main deployment function
main() {
    check_prerequisites
    create_cluster
    build_and_load_images
    deploy_infrastructure
    deploy_application
    deploy_monitoring
    deploy_ingress
    run_health_checks
    run_load_tests
    display_access_info
}

# Run main function
main "$@"
