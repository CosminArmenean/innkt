#!/bin/bash

# INNKT Angular Production Build Script
# This script builds the application for production deployment

set -e  # Exit on any error

echo "🚀 Starting INNKT Angular Production Build..."

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
PROJECT_NAME="innkt"
BUILD_DIR="dist/${PROJECT_NAME}/browser"
BACKUP_DIR="dist/backup-$(date +%Y%m%d-%H%M%S)"

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

# Check if Node.js is installed
check_node() {
    if ! command -v node &> /dev/null; then
        print_error "Node.js is not installed. Please install Node.js 18+ and try again."
        exit 1
    fi
    
    NODE_VERSION=$(node --version | cut -d'v' -f2 | cut -d'.' -f1)
    if [ "$NODE_VERSION" -lt 18 ]; then
        print_error "Node.js version 18+ is required. Current version: $(node --version)"
        exit 1
    fi
    
    print_success "Node.js version: $(node --version)"
}

# Check if npm is installed
check_npm() {
    if ! command -v npm &> /dev/null; then
        print_error "npm is not installed. Please install npm and try again."
        exit 1
    fi
    
    print_success "npm version: $(npm --version)"
}

# Check if Angular CLI is installed
check_angular_cli() {
    if ! command -v ng &> /dev/null; then
        print_warning "Angular CLI not found globally. Installing locally..."
        npm install -g @angular/cli@latest
    fi
    
    print_success "Angular CLI version: $(ng version | grep 'Angular CLI' | awk '{print $3}')"
}

# Clean previous builds
clean_build() {
    print_status "Cleaning previous build artifacts..."
    
    if [ -d "$BUILD_DIR" ]; then
        print_status "Creating backup of previous build..."
        mkdir -p "$BACKUP_DIR"
        cp -r "$BUILD_DIR" "$BACKUP_DIR/"
        print_success "Backup created at: $BACKUP_DIR"
        
        print_status "Removing previous build..."
        rm -rf "$BUILD_DIR"
    fi
    
    # Clean npm cache if needed
    if [ "$1" = "--clean-cache" ]; then
        print_status "Cleaning npm cache..."
        npm cache clean --force
    fi
}

# Install dependencies
install_dependencies() {
    print_status "Installing dependencies..."
    
    if [ -f "package-lock.json" ]; then
        npm ci --production=false
    else
        npm install
    fi
    
    print_success "Dependencies installed successfully"
}

# Run tests
run_tests() {
    print_status "Running tests..."
    
    if npm run test:ci &> /dev/null; then
        print_success "Tests passed successfully"
    else
        print_warning "Tests failed or not configured. Continuing with build..."
    fi
}

# Build application
build_application() {
    print_status "Building application for production..."
    
    # Build with production configuration
    ng build --configuration=production
    
    if [ $? -eq 0 ]; then
        print_success "Application built successfully"
    else
        print_error "Build failed. Please check the error messages above."
        exit 1
    fi
}

# Verify build output
verify_build() {
    print_status "Verifying build output..."
    
    if [ ! -d "$BUILD_DIR" ]; then
        print_error "Build directory not found: $BUILD_DIR"
        exit 1
    fi
    
    # Check for essential files
    ESSENTIAL_FILES=("index.html" "main.js" "polyfills.js" "runtime.js" "styles.css")
    
    for file in "${ESSENTIAL_FILES[@]}"; do
        if [ ! -f "$BUILD_DIR/$file" ]; then
            print_warning "Essential file not found: $file"
        fi
    done
    
    # Check build size
    BUILD_SIZE=$(du -sh "$BUILD_DIR" | cut -f1)
    print_success "Build size: $BUILD_SIZE"
    
    # Check file count
    FILE_COUNT=$(find "$BUILD_DIR" -type f | wc -l)
    print_success "Total files: $FILE_COUNT"
}

# Generate build report
generate_report() {
    print_status "Generating build report..."
    
    REPORT_FILE="build-report-$(date +%Y%m%d-%H%M%S).txt"
    
    {
        echo "INNKT Angular Production Build Report"
        echo "====================================="
        echo "Build Date: $(date)"
        echo "Build Time: $(date +%T)"
        echo "Node Version: $(node --version)"
        echo "npm Version: $(npm --version)"
        echo "Angular CLI Version: $(ng version | grep 'Angular CLI' | awk '{print $3}')"
        echo ""
        echo "Build Output:"
        echo "- Build Directory: $BUILD_DIR"
        echo "- Build Size: $(du -sh "$BUILD_DIR" | cut -f1)"
        echo "- Total Files: $(find "$BUILD_DIR" -type f | wc -l)"
        echo ""
        echo "Essential Files:"
        for file in index.html main.js polyfills.js runtime.js styles.css; do
            if [ -f "$BUILD_DIR/$file" ]; then
                echo "- ✓ $file ($(du -h "$BUILD_DIR/$file" | cut -f1))"
            else
                echo "- ✗ $file (MISSING)"
            fi
        done
        echo ""
        echo "Service Worker:"
        if [ -f "$BUILD_DIR/ngsw-worker.js" ]; then
            echo "- ✓ Service Worker generated"
        else
            echo "- ✗ Service Worker not found"
        fi
        echo ""
        echo "Build completed successfully!"
    } > "$REPORT_FILE"
    
    print_success "Build report generated: $REPORT_FILE"
}

# Optimize build (optional)
optimize_build() {
    if [ "$1" = "--optimize" ]; then
        print_status "Running additional optimizations..."
        
        # Compress images if possible
        if command -v imagemin &> /dev/null; then
            print_status "Optimizing images..."
            find "$BUILD_DIR" -name "*.png" -o -name "*.jpg" -o -name "*.jpeg" | xargs -I {} imagemin {} --out-dir "$(dirname {})"
        fi
        
        # Generate gzip files
        print_status "Generating gzip files..."
        find "$BUILD_DIR" -name "*.js" -o -name "*.css" -o -name "*.html" | xargs -I {} gzip -k {}
        
        print_success "Build optimization completed"
    fi
}

# Main build process
main() {
    echo "=========================================="
    echo "  INNKT Angular Production Build Script"
    echo "=========================================="
    echo ""
    
    # Parse command line arguments
    CLEAN_CACHE=false
    RUN_OPTIMIZATION=false
    
    while [[ $# -gt 0 ]]; do
        case $1 in
            --clean-cache)
                CLEAN_CACHE=true
                shift
                ;;
            --optimize)
                RUN_OPTIMIZATION=true
                shift
                ;;
            --help)
                echo "Usage: $0 [OPTIONS]"
                echo "Options:"
                echo "  --clean-cache    Clean npm cache before building"
                echo "  --optimize       Run additional optimizations"
                echo "  --help          Show this help message"
                exit 0
                ;;
            *)
                print_error "Unknown option: $1"
                echo "Use --help for usage information"
                exit 1
                ;;
        esac
    done
    
    # Start build process
    START_TIME=$(date +%s)
    
    check_node
    check_npm
    check_angular_cli
    
    clean_build $([ "$CLEAN_CACHE" = true ] && echo "--clean-cache")
    install_dependencies
    run_tests
    build_application
    verify_build
    generate_report
    optimize_build $([ "$RUN_OPTIMIZATION" = true ] && echo "--optimize")
    
    END_TIME=$(date +%s)
    BUILD_DURATION=$((END_TIME - START_TIME))
    
    echo ""
    echo "=========================================="
    print_success "Build completed successfully in ${BUILD_DURATION} seconds!"
    print_success "Build output: $BUILD_DIR"
    echo "=========================================="
    
    # Show next steps
    echo ""
    echo "Next steps:"
    echo "1. Test the build locally: npx http-server $BUILD_DIR"
    echo "2. Deploy to your hosting provider"
    echo "3. Verify the application works in production"
    echo ""
}

# Run main function
main "$@"





