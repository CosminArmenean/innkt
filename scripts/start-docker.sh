#!/bin/bash

# INNKT Microservices Docker Startup Script
echo "🚀 Starting INNKT Microservices Stack..."

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Check if Docker is running
if ! docker info > /dev/null 2>&1; then
    print_error "Docker is not running. Please start Docker Desktop first."
    exit 1
fi

print_success "Docker is running"

# Check if docker-compose is available
if ! command -v docker-compose &> /dev/null; then
    print_error "docker-compose is not installed. Please install it first."
    exit 1
fi

print_success "docker-compose is available"

# Stop any existing containers
print_status "Stopping existing containers..."
docker-compose down

# Remove old volumes (optional - uncomment if you want fresh start)
# print_status "Removing old volumes..."
# docker-compose down -v

# Start infrastructure services first
print_status "Starting infrastructure services (PostgreSQL, Redis, Kafka, Zookeeper)..."
docker-compose up -d postgres redis zookeeper kafka

# Wait for infrastructure services to be healthy
print_status "Waiting for infrastructure services to be healthy..."
sleep 30

# Check infrastructure health
print_status "Checking infrastructure health..."

# Check PostgreSQL
if docker-compose exec -T postgres pg_isready -U innkt_user -d innkt_db > /dev/null 2>&1; then
    print_success "PostgreSQL is healthy"
else
    print_error "PostgreSQL is not healthy"
    exit 1
fi

# Check Redis
if docker-compose exec -T redis redis-cli --raw incr ping > /dev/null 2>&1; then
    print_success "Redis is healthy"
else
    print_error "Redis is not healthy"
    exit 1
fi

# Check Kafka
if docker-compose exec -T kafka kafka-topics --bootstrap-server localhost:9092 --list > /dev/null 2>&1; then
    print_success "Kafka is healthy"
else
    print_error "Kafka is not healthy"
    exit 1
fi

# Start microservices
print_status "Starting microservices (Officer, NeuroSpark)..."
docker-compose up -d officer neurospark

# Wait for microservices to be healthy
print_status "Waiting for microservices to be healthy..."
sleep 30

# Check microservices health
print_status "Checking microservices health..."

# Check Officer service
if curl -f http://localhost:5004/health > /dev/null 2>&1; then
    print_success "Officer service is healthy"
else
    print_warning "Officer service health check failed (may still be starting)"
fi

# Check NeuroSpark service
if curl -f http://localhost:5006/health > /dev/null 2>&1; then
    print_success "NeuroSpark service is healthy"
else
    print_warning "NeuroSpark service health check failed (may still be starting)"
fi

# Start web client
print_status "Starting web client..."
docker-compose up -d web-client

# Start monitoring services
print_status "Starting monitoring services (Prometheus, Grafana)..."
docker-compose up -d prometheus grafana

# Start Nginx
print_status "Starting Nginx load balancer..."
docker-compose up -d nginx

# Start development tools
print_status "Starting development tools..."
docker-compose up -d adminer kafka-ui redis-commander

# Final status
print_status "Waiting for all services to be ready..."
sleep 20

print_success "🎉 INNKT Microservices Stack is starting up!"
echo ""
echo "📊 Service Status:"
echo "  • PostgreSQL: http://localhost:5432"
echo "  • Redis: localhost:6379"
echo "  • Kafka: localhost:9092"
echo "  • Zookeeper: localhost:2181"
echo "  • Officer Service: http://localhost:5004"
echo "  • NeuroSpark Service: http://localhost:5006"
echo "  • Web Client: http://localhost:3000"
echo "  • Nginx Load Balancer: http://localhost:80"
echo "  • Prometheus: http://localhost:9090"
echo "  • Grafana: http://localhost:3001 (admin/admin123)"
echo "  • Adminer (DB): http://localhost:8080"
echo "  • Kafka UI: http://localhost:8081"
echo "  • Redis Commander: http://localhost:8082"
echo ""
echo "🔍 Check service status with: docker-compose ps"
echo "📋 View logs with: docker-compose logs -f [service-name]"
echo "🛑 Stop all services with: docker-compose down"
echo ""
print_success "All services are starting up. Please wait a few minutes for full initialization."


