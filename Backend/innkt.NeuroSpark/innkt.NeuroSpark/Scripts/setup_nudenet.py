#!/usr/bin/env python3
"""
NudeNet Setup Script for innkt.NeuroSpark
This script sets up NudeNet and its dependencies for AI content moderation.
"""

import os
import sys
import subprocess
import platform
from pathlib import Path

def run_command(command, description):
    """Run a command and handle errors."""
    print(f"🔄 {description}...")
    try:
        result = subprocess.run(command, shell=True, check=True, capture_output=True, text=True)
        print(f"✅ {description} completed successfully")
        return True
    except subprocess.CalledProcessError as e:
        print(f"❌ {description} failed:")
        print(f"   Error: {e.stderr}")
        return False

def check_python_version():
    """Check if Python version is compatible."""
    print("🐍 Checking Python version...")
    version = sys.version_info
    if version.major < 3 or (version.major == 3 and version.minor < 8):
        print(f"❌ Python 3.8+ is required. Current version: {version.major}.{version.minor}")
        return False
    print(f"✅ Python {version.major}.{version.minor}.{version.micro} is compatible")
    return True

def install_dependencies():
    """Install required Python dependencies."""
    print("📦 Installing Python dependencies...")
    
    # Upgrade pip first
    if not run_command("python -m pip install --upgrade pip", "Upgrading pip"):
        return False
    
    # Install requirements
    requirements_file = Path(__file__).parent / "requirements.txt"
    if requirements_file.exists():
        if not run_command(f"pip install -r {requirements_file}", "Installing requirements"):
            return False
    else:
        print("⚠️  requirements.txt not found, installing individual packages...")
        packages = [
            "nudenet==1.0.0",
            "opencv-python==4.8.1.78",
            "Pillow==10.0.1",
            "numpy==1.24.3",
            "requests==2.31.0"
        ]
        
        for package in packages:
            if not run_command(f"pip install {package}", f"Installing {package}"):
                return False
    
    return True

def download_nudenet_model():
    """Download NudeNet model if not present."""
    print("🤖 Setting up NudeNet model...")
    
    try:
        from nudenet import NudeNetDetector
        
        # Initialize detector to download model
        print("📥 Downloading NudeNet model (this may take a while)...")
        detector = NudeNetDetector()
        print("✅ NudeNet model downloaded successfully")
        return True
        
    except Exception as e:
        print(f"❌ Failed to download NudeNet model: {e}")
        return False

def create_directories():
    """Create necessary directories."""
    print("📁 Creating directories...")
    
    directories = [
        "Models",
        "Models/nudenet",
        "Scripts",
        "uploads",
        "processed"
    ]
    
    for directory in directories:
        dir_path = Path(directory)
        dir_path.mkdir(parents=True, exist_ok=True)
        print(f"✅ Created directory: {directory}")
    
    return True

def test_installation():
    """Test the NudeNet installation."""
    print("🧪 Testing NudeNet installation...")
    
    try:
        from nudenet import NudeNetDetector
        import cv2
        import numpy as np
        from PIL import Image
        
        # Test detector initialization
        detector = NudeNetDetector()
        print("✅ NudeNet detector initialized successfully")
        
        # Test with a simple image
        test_image = np.zeros((100, 100, 3), dtype=np.uint8)
        test_image_path = "test_image.jpg"
        
        # Save test image
        cv2.imwrite(test_image_path, test_image)
        
        # Test detection
        detections = detector.detect(test_image_path)
        print(f"✅ NudeNet detection test completed. Found {len(detections)} detections")
        
        # Clean up test image
        if os.path.exists(test_image_path):
            os.remove(test_image_path)
        
        return True
        
    except Exception as e:
        print(f"❌ NudeNet test failed: {e}")
        return False

def setup_permissions():
    """Set up file permissions for the Python script."""
    print("🔐 Setting up file permissions...")
    
    script_path = Path(__file__).parent / "nudenet_analyzer.py"
    if script_path.exists():
        if platform.system() != "Windows":
            # Make script executable on Unix-like systems
            os.chmod(script_path, 0o755)
            print("✅ Made nudenet_analyzer.py executable")
        else:
            print("✅ Windows detected, no permission changes needed")
    
    return True

def main():
    """Main setup function."""
    print("🚀 Setting up NudeNet for innkt.NeuroSpark AI Moderation")
    print("=" * 60)
    
    # Check Python version
    if not check_python_version():
        sys.exit(1)
    
    # Create directories
    if not create_directories():
        sys.exit(1)
    
    # Install dependencies
    if not install_dependencies():
        print("❌ Failed to install dependencies")
        sys.exit(1)
    
    # Download NudeNet model
    if not download_nudenet_model():
        print("❌ Failed to download NudeNet model")
        sys.exit(1)
    
    # Set up permissions
    if not setup_permissions():
        print("❌ Failed to set up permissions")
        sys.exit(1)
    
    # Test installation
    if not test_installation():
        print("❌ Installation test failed")
        sys.exit(1)
    
    print("=" * 60)
    print("🎉 NudeNet setup completed successfully!")
    print("")
    print("📋 Next steps:")
    print("   1. Ensure the NeuroSpark service is configured with NudeNet settings")
    print("   2. Test the AI moderation endpoints")
    print("   3. Monitor logs for any issues")
    print("")
    print("🔧 Configuration:")
    print("   - Python script: Scripts/nudenet_analyzer.py")
    print("   - Model path: Models/nudenet")
    print("   - Confidence threshold: 0.5 (configurable)")
    print("")
    print("⚠️  Important notes:")
    print("   - NudeNet requires significant computational resources")
    print("   - Consider using GPU acceleration for better performance")
    print("   - Monitor memory usage during batch processing")
    print("   - Ensure proper security measures for content moderation")

if __name__ == "__main__":
    main()
