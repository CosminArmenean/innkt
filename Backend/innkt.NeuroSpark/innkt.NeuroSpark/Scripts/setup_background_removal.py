#!/usr/bin/env python3
"""
Background Removal Setup Script for innkt.NeuroSpark
This script sets up rembg and its dependencies for AI background removal.
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
            "rembg==2.0.50",
            "opencv-python==4.8.1.78",
            "Pillow==10.0.1",
            "numpy==1.24.3",
            "requests==2.31.0",
            "onnxruntime==1.15.1",
            "scikit-image==0.21.0"
        ]
        
        for package in packages:
            if not run_command(f"pip install {package}", f"Installing {package}"):
                return False
    
    return True

def download_rembg_models():
    """Download rembg models if not present."""
    print("🤖 Setting up rembg models...")
    
    try:
        from rembg import new_session
        
        # Initialize session to download models
        print("📥 Downloading rembg models (this may take a while)...")
        
        # Download different models
        models = ["u2net", "u2net_human_seg", "u2netp", "u2net_cloth_seg", "silueta", "isnet-general-use"]
        
        for model in models:
            try:
                print(f"   Downloading {model} model...")
                session = new_session(model)
                print(f"   ✅ {model} model downloaded successfully")
            except Exception as e:
                print(f"   ⚠️  Failed to download {model} model: {e}")
        
        print("✅ rembg models setup completed")
        return True
        
    except Exception as e:
        print(f"❌ Failed to setup rembg models: {e}")
        return False

def create_directories():
    """Create necessary directories."""
    print("📁 Creating directories...")
    
    directories = [
        "Models",
        "Models/rembg",
        "Scripts",
        "processed",
        "processed/background_removed",
        "uploads"
    ]
    
    for directory in directories:
        dir_path = Path(directory)
        dir_path.mkdir(parents=True, exist_ok=True)
        print(f"✅ Created directory: {directory}")
    
    return True

def test_installation():
    """Test the rembg installation."""
    print("🧪 Testing rembg installation...")
    
    try:
        from rembg import remove, new_session
        from PIL import Image
        import numpy as np
        
        # Test session initialization
        session = new_session("u2net")
        print("✅ rembg session initialized successfully")
        
        # Test with a simple image
        test_image = Image.new('RGBA', (100, 100), (255, 0, 0, 255))  # Red square
        test_image_path = "test_image.png"
        
        # Save test image
        test_image.save(test_image_path)
        
        # Test background removal
        with open(test_image_path, 'rb') as input_file:
            input_data = input_file.read()
        
        output_data = remove(input_data, session=session)
        
        # Save result
        with open("test_output.png", 'wb') as output_file:
            output_file.write(output_data)
        
        print("✅ rembg background removal test completed successfully")
        
        # Clean up test files
        for test_file in [test_image_path, "test_output.png"]:
            if os.path.exists(test_file):
                os.remove(test_file)
        
        return True
        
    except Exception as e:
        print(f"❌ rembg test failed: {e}")
        return False

def setup_permissions():
    """Set up file permissions for the Python script."""
    print("🔐 Setting up file permissions...")
    
    script_path = Path(__file__).parent / "background_removal.py"
    if script_path.exists():
        if platform.system() != "Windows":
            # Make script executable on Unix-like systems
            os.chmod(script_path, 0o755)
            print("✅ Made background_removal.py executable")
        else:
            print("✅ Windows detected, no permission changes needed")
    
    return True

def create_test_script():
    """Create a test script for background removal."""
    print("📝 Creating test script...")
    
    test_script_content = '''#!/usr/bin/env python3
"""
Test script for background removal functionality
"""

import sys
import os
from pathlib import Path

# Add the Scripts directory to the path
sys.path.append(str(Path(__file__).parent))

try:
    from background_removal import BackgroundRemovalProcessor
    
    def test_background_removal():
        """Test background removal functionality."""
        print("🧪 Testing background removal...")
        
        # Initialize processor
        processor = BackgroundRemovalProcessor()
        
        if not processor.is_available:
            print("❌ Background removal processor not available")
            return False
        
        # Test model info
        model_info = processor.get_model_info()
        print(f"✅ Model info: {model_info['model_name']} v{model_info['version']}")
        print(f"   Available models: {', '.join(model_info['available_models'])}")
        
        print("✅ Background removal test completed successfully")
        return True
    
    if __name__ == "__main__":
        success = test_background_removal()
        sys.exit(0 if success else 1)
        
except ImportError as e:
    print(f"❌ Failed to import background removal module: {e}")
    sys.exit(1)
except Exception as e:
    print(f"❌ Test failed: {e}")
    sys.exit(1)
'''
    
    test_script_path = Path(__file__).parent / "test_background_removal.py"
    with open(test_script_path, 'w') as f:
        f.write(test_script_content)
    
    if platform.system() != "Windows":
        os.chmod(test_script_path, 0o755)
    
    print("✅ Created test_background_removal.py")
    return True

def main():
    """Main setup function."""
    print("🚀 Setting up Background Removal for innkt.NeuroSpark")
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
    
    # Download rembg models
    if not download_rembg_models():
        print("❌ Failed to download rembg models")
        sys.exit(1)
    
    # Set up permissions
    if not setup_permissions():
        print("❌ Failed to set up permissions")
        sys.exit(1)
    
    # Create test script
    if not create_test_script():
        print("❌ Failed to create test script")
        sys.exit(1)
    
    # Test installation
    if not test_installation():
        print("❌ Installation test failed")
        sys.exit(1)
    
    print("=" * 60)
    print("🎉 Background Removal setup completed successfully!")
    print("")
    print("📋 Next steps:")
    print("   1. Ensure the NeuroSpark service is configured with background removal settings")
    print("   2. Test the background removal endpoints")
    print("   3. Monitor logs for any issues")
    print("")
    print("🔧 Configuration:")
    print("   - Python script: Scripts/background_removal.py")
    print("   - Model path: Models/rembg")
    print("   - Output path: processed/background_removed")
    print("   - Default model: u2net")
    print("")
    print("🧪 Testing:")
    print("   - Run: python Scripts/test_background_removal.py")
    print("   - Test API endpoints via Swagger UI")
    print("")
    print("⚠️  Important notes:")
    print("   - Background removal requires significant computational resources")
    print("   - Consider using GPU acceleration for better performance")
    print("   - Monitor memory usage during batch processing")
    print("   - Models are downloaded on first use")
    print("   - Ensure proper security measures for image processing")

if __name__ == "__main__":
    main()
