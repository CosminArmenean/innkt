#!/usr/bin/env python3
"""
Background Removal Script for .NET Integration
This script provides AI-powered background removal using rembg for the innkt.NeuroSpark service.
"""

import sys
import json
import argparse
import os
import tempfile
import time
from pathlib import Path
from typing import List, Dict, Any, Optional
import logging

# Configure logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

try:
    from rembg import remove, new_session
    from PIL import Image, ImageOps
    import cv2
    import numpy as np
    import requests
    from urllib.parse import urlparse
except ImportError as e:
    logger.error(f"Required dependencies not installed: {e}")
    logger.error("Please install: pip install rembg pillow opencv-python requests")
    sys.exit(1)

class BackgroundRemovalProcessor:
    """AI-powered background removal using rembg."""
    
    def __init__(self, model_path: str = None, default_model: str = "u2net"):
        """
        Initialize the background removal processor.
        
        Args:
            model_path: Path to store models (optional)
            default_model: Default model to use for background removal
        """
        self.model_path = model_path
        self.default_model = default_model
        self.session = None
        
        try:
            # Initialize rembg session
            self.session = new_session(default_model)
            self.is_available = True
            logger.info(f"Background removal processor initialized with model: {default_model}")
            
        except Exception as e:
            logger.error(f"Failed to initialize background removal processor: {e}")
            self.session = None
            self.is_available = False
    
    def remove_background(self, image_path: str, output_path: str = None, options: Dict[str, Any] = None) -> Dict[str, Any]:
        """
        Remove background from an image.
        
        Args:
            image_path: Path to the input image
            output_path: Path to save the output image (optional)
            options: Processing options
            
        Returns:
            Dictionary containing processing results
        """
        if not self.is_available:
            return {
                "success": False,
                "error": "Background removal processor not available"
            }
        
        try:
            start_time = time.time()
            
            # Check if image file exists
            if not os.path.exists(image_path):
                return {
                    "success": False,
                    "error": f"Image file not found: {image_path}"
                }
            
            # Load and validate image
            image = self._load_image(image_path)
            if image is None:
                return {
                    "success": False,
                    "error": "Failed to load image"
                }
            
            # Get processing options
            opts = options or {}
            model = opts.get('model', self.default_model)
            output_format = opts.get('output_format', 'PNG')
            quality = opts.get('quality', 95)
            max_size = opts.get('max_size')
            optimize_for_web = opts.get('optimize_for_web', True)
            
            # Resize image if max_size is specified
            if max_size and (image.width > max_size or image.height > max_size):
                image = self._resize_image(image, max_size)
            
            # Remove background
            logger.info(f"Removing background using model: {model}")
            output_image = remove(image, session=self.session)
            
            # Apply post-processing
            if optimize_for_web:
                output_image = self._optimize_for_web(output_image, output_format, quality)
            
            # Save output image
            if output_path:
                output_image.save(output_path, format=output_format, optimize=True, quality=quality)
                processed_image_path = output_path
            else:
                # Save to temporary file
                temp_output = tempfile.NamedTemporaryFile(suffix=f'.{output_format.lower()}', delete=False)
                output_image.save(temp_output.name, format=output_format, optimize=True, quality=quality)
                processed_image_path = temp_output.name
                temp_output.close()
            
            processing_time = time.time() - start_time
            
            return {
                "success": True,
                "processed_image_path": processed_image_path,
                "original_image_path": image_path,
                "model_used": model,
                "output_format": output_format,
                "processing_time": processing_time,
                "original_size": f"{image.width}x{image.height}",
                "processed_size": f"{output_image.width}x{output_image.height}",
                "error": None
            }
            
        except Exception as e:
            logger.error(f"Error removing background from {image_path}: {e}")
            return {
                "success": False,
                "error": f"Background removal failed: {str(e)}"
            }
    
    def remove_background_batch(self, image_paths: List[str], output_dir: str, requests: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
        """
        Remove background from multiple images in batch.
        
        Args:
            image_paths: List of input image paths
            output_dir: Directory to save output images
            requests: List of request data with options
            
        Returns:
            List of processing results
        """
        results = []
        
        # Ensure output directory exists
        os.makedirs(output_dir, exist_ok=True)
        
        for i, (image_path, request) in enumerate(zip(image_paths, requests)):
            logger.info(f"Processing image {i+1}/{len(image_paths)}: {image_path}")
            
            # Generate output path
            input_filename = Path(image_path).stem
            output_format = request.get('options', {}).get('output_format', 'PNG')
            output_path = os.path.join(output_dir, f"{input_filename}_no_bg.{output_format.lower()}")
            
            # Process image
            result = self.remove_background(image_path, output_path, request.get('options'))
            result["user_id"] = request.get('user_id', 'unknown')
            results.append(result)
        
        return results
    
    def get_model_info(self) -> Dict[str, Any]:
        """
        Get information about available models.
        
        Returns:
            Dictionary containing model information
        """
        if not self.is_available:
            return {
                "model_name": "Unknown",
                "version": "Unknown",
                "is_available": False,
                "error": "Background removal processor not available"
            }
        
        try:
            # Get available models
            available_models = [
                "u2net",           # General purpose
                "u2net_human_seg", # Human segmentation
                "u2netp",          # Lightweight version
                "u2net_cloth_seg", # Clothing segmentation
                "silueta",         # Silhouette detection
                "isnet-general-use" # High quality general use
            ]
            
            model_info = {
                "model_name": "rembg",
                "version": "2.0.50",  # rembg version
                "is_available": True,
                "available_models": available_models,
                "default_model": self.default_model,
                "supported_formats": ["PNG", "JPEG", "JPG", "WEBP"],
                "error": None
            }
            
            return model_info
            
        except Exception as e:
            logger.error(f"Error getting model info: {e}")
            return {
                "model_name": "Unknown",
                "version": "Unknown",
                "is_available": False,
                "error": f"Failed to get model info: {str(e)}"
            }
    
    def _load_image(self, image_path: str) -> Optional[Image.Image]:
        """
        Load and validate an image file.
        
        Args:
            image_path: Path to the image file
            
        Returns:
            PIL Image or None if loading failed
        """
        try:
            with Image.open(image_path) as img:
                # Convert to RGBA if not already
                if img.mode != 'RGBA':
                    img = img.convert('RGBA')
                return img
                
        except Exception as e:
            logger.error(f"Failed to load image {image_path}: {e}")
            return None
    
    def _resize_image(self, image: Image.Image, max_size: int) -> Image.Image:
        """
        Resize image while maintaining aspect ratio.
        
        Args:
            image: PIL Image to resize
            max_size: Maximum size for width or height
            
        Returns:
            Resized PIL Image
        """
        try:
            # Calculate new size maintaining aspect ratio
            width, height = image.size
            if width > height:
                new_width = max_size
                new_height = int((height * max_size) / width)
            else:
                new_height = max_size
                new_width = int((width * max_size) / height)
            
            return image.resize((new_width, new_height), Image.Resampling.LANCZOS)
            
        except Exception as e:
            logger.error(f"Failed to resize image: {e}")
            return image
    
    def _optimize_for_web(self, image: Image.Image, format: str, quality: int) -> Image.Image:
        """
        Optimize image for web use.
        
        Args:
            image: PIL Image to optimize
            format: Output format
            quality: Quality setting
            
        Returns:
            Optimized PIL Image
        """
        try:
            # Apply auto-orientation
            image = ImageOps.exif_transpose(image)
            
            # Optimize based on format
            if format.upper() in ['JPEG', 'JPG']:
                # Convert RGBA to RGB for JPEG
                if image.mode == 'RGBA':
                    # Create white background
                    background = Image.new('RGB', image.size, (255, 255, 255))
                    background.paste(image, mask=image.split()[-1])  # Use alpha channel as mask
                    image = background
            
            return image
            
        except Exception as e:
            logger.error(f"Failed to optimize image for web: {e}")
            return image

def main():
    """Main function to handle command line arguments and execute background removal."""
    parser = argparse.ArgumentParser(description='Background Removal for .NET Integration')
    parser.add_argument('image_path', nargs='?', help='Path to input image file')
    parser.add_argument('model_path', nargs='?', help='Path to model directory')
    parser.add_argument('output_path', nargs='?', help='Path to output directory')
    parser.add_argument('options_file', nargs='?', help='Path to options JSON file')
    parser.add_argument('--batch', help='Path to batch request JSON file')
    parser.add_argument('--info', help='Get model information')
    
    args = parser.parse_args()
    
    try:
        # Initialize processor
        processor = BackgroundRemovalProcessor(
            model_path=args.model_path,
            default_model="u2net"
        )
        
        # Handle different operation modes
        if args.info:
            # Get model information
            result = processor.get_model_info()
            print(json.dumps(result, indent=2))
            
        elif args.batch:
            # Batch processing
            with open(args.batch, 'r') as f:
                batch_request = json.load(f)
            
            image_paths = batch_request.get('image_paths', [])
            requests = batch_request.get('requests', [])
            output_path = batch_request.get('output_path', 'output')
            
            if len(image_paths) != len(requests):
                raise ValueError("Number of image paths must match number of requests")
            
            results = processor.remove_background_batch(image_paths, output_path, requests)
            print(json.dumps(results, indent=2))
            
        elif args.image_path:
            # Single image processing
            options = {}
            if args.options_file and os.path.exists(args.options_file):
                with open(args.options_file, 'r') as f:
                    options = json.load(f)
            
            result = processor.remove_background(args.image_path, args.output_path, options)
            print(json.dumps(result, indent=2))
            
        else:
            # No arguments provided, show help
            parser.print_help()
            
    except Exception as e:
        logger.error(f"Script execution failed: {e}")
        error_result = {
            "success": False,
            "error": f"Script execution failed: {str(e)}"
        }
        print(json.dumps(error_result, indent=2))
        sys.exit(1)

if __name__ == "__main__":
    main()
