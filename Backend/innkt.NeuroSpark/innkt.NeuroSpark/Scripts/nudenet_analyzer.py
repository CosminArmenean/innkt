#!/usr/bin/env python3
"""
NudeNet Image Analysis Script for .NET Integration
This script provides NSFW content detection using NudeNet for the innkt.NeuroSpark service.
"""

import sys
import json
import argparse
import os
import tempfile
from pathlib import Path
from typing import List, Dict, Any, Optional
import logging

# Configure logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

try:
    from nudenet import NudeNetDetector
    import cv2
    import numpy as np
    from PIL import Image
    import requests
    from urllib.parse import urlparse
except ImportError as e:
    logger.error(f"Required dependencies not installed: {e}")
    logger.error("Please install: pip install nudenet opencv-python pillow requests")
    sys.exit(1)

class NudeNetAnalyzer:
    """NudeNet-based image analysis for NSFW content detection."""
    
    def __init__(self, model_path: str = None, confidence_threshold: float = 0.5):
        """
        Initialize the NudeNet analyzer.
        
        Args:
            model_path: Path to the NudeNet model (optional, uses default if None)
            confidence_threshold: Minimum confidence threshold for NSFW detection
        """
        self.confidence_threshold = confidence_threshold
        self.model_path = model_path
        
        try:
            # Initialize NudeNet detector
            if model_path and os.path.exists(model_path):
                self.detector = NudeNetDetector(model_path)
                logger.info(f"Loaded custom NudeNet model from: {model_path}")
            else:
                self.detector = NudeNetDetector()
                logger.info("Loaded default NudeNet model")
                
            self.is_available = True
            logger.info("NudeNet analyzer initialized successfully")
            
        except Exception as e:
            logger.error(f"Failed to initialize NudeNet detector: {e}")
            self.detector = None
            self.is_available = False
    
    def analyze_image(self, image_path: str) -> Dict[str, Any]:
        """
        Analyze a single image for NSFW content.
        
        Args:
            image_path: Path to the image file
            
        Returns:
            Dictionary containing analysis results
        """
        if not self.is_available:
            return {
                "is_nsfw": False,
                "confidence": 0.0,
                "detections": [],
                "error": "NudeNet detector not available"
            }
        
        try:
            # Check if image file exists
            if not os.path.exists(image_path):
                return {
                    "is_nsfw": False,
                    "confidence": 0.0,
                    "detections": [],
                    "error": f"Image file not found: {image_path}"
                }
            
            # Load and validate image
            image = self._load_image(image_path)
            if image is None:
                return {
                    "is_nsfw": False,
                    "confidence": 0.0,
                    "detections": [],
                    "error": "Failed to load image"
                }
            
            # Perform NSFW detection
            detections = self.detector.detect(image_path)
            
            # Process results
            nsfw_detections = []
            max_confidence = 0.0
            is_nsfw = False
            
            for detection in detections:
                if detection['class'] in ['EXPOSED_BUTTOCKS', 'EXPOSED_BREAST_F', 'EXPOSED_GENITALIA_F', 'EXPOSED_GENITALIA_M']:
                    confidence = detection['score']
                    if confidence >= self.confidence_threshold:
                        is_nsfw = True
                        max_confidence = max(max_confidence, confidence)
                        
                        nsfw_detections.append({
                            "class": detection['class'],
                            "confidence": confidence,
                            "bounding_box": {
                                "x": detection['box'][0],
                                "y": detection['box'][1],
                                "width": detection['box'][2] - detection['box'][0],
                                "height": detection['box'][3] - detection['box'][1]
                            }
                        })
            
            return {
                "is_nsfw": is_nsfw,
                "confidence": max_confidence,
                "detections": nsfw_detections,
                "error": None
            }
            
        except Exception as e:
            logger.error(f"Error analyzing image {image_path}: {e}")
            return {
                "is_nsfw": False,
                "confidence": 0.0,
                "detections": [],
                "error": f"Analysis failed: {str(e)}"
            }
    
    def analyze_batch(self, image_paths: List[str], user_ids: List[str]) -> List[Dict[str, Any]]:
        """
        Analyze multiple images in batch.
        
        Args:
            image_paths: List of image file paths
            user_ids: List of user IDs corresponding to each image
            
        Returns:
            List of analysis results
        """
        results = []
        
        for i, (image_path, user_id) in enumerate(zip(image_paths, user_ids)):
            logger.info(f"Analyzing image {i+1}/{len(image_paths)} for user {user_id}")
            
            result = self.analyze_image(image_path)
            result["user_id"] = user_id
            results.append(result)
        
        return results
    
    def get_model_info(self) -> Dict[str, Any]:
        """
        Get information about the loaded model.
        
        Returns:
            Dictionary containing model information
        """
        if not self.is_available:
            return {
                "model_name": "Unknown",
                "version": "Unknown",
                "is_available": False,
                "error": "NudeNet detector not available"
            }
        
        try:
            # Get model information
            model_info = {
                "model_name": "NudeNet",
                "version": "1.0.0",  # NudeNet version
                "is_available": True,
                "confidence_threshold": self.confidence_threshold,
                "supported_classes": [
                    "EXPOSED_BUTTOCKS",
                    "EXPOSED_BREAST_F", 
                    "EXPOSED_GENITALIA_F",
                    "EXPOSED_GENITALIA_M"
                ],
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
    
    def _load_image(self, image_path: str) -> Optional[np.ndarray]:
        """
        Load and validate an image file.
        
        Args:
            image_path: Path to the image file
            
        Returns:
            Image as numpy array or None if loading failed
        """
        try:
            # Try to load with OpenCV first
            image = cv2.imread(image_path)
            if image is not None:
                return cv2.cvtColor(image, cv2.COLOR_BGR2RGB)
            
            # Fallback to PIL
            with Image.open(image_path) as img:
                return np.array(img)
                
        except Exception as e:
            logger.error(f"Failed to load image {image_path}: {e}")
            return None

def main():
    """Main function to handle command line arguments and execute analysis."""
    parser = argparse.ArgumentParser(description='NudeNet Image Analysis for .NET Integration')
    parser.add_argument('image_path', nargs='?', help='Path to image file for single analysis')
    parser.add_argument('model_path', nargs='?', help='Path to NudeNet model')
    parser.add_argument('confidence_threshold', nargs='?', type=float, default=0.5, 
                       help='Confidence threshold for NSFW detection')
    parser.add_argument('--batch', help='Path to batch request JSON file')
    parser.add_argument('--info', help='Get model information')
    
    args = parser.parse_args()
    
    try:
        # Initialize analyzer
        analyzer = NudeNetAnalyzer(
            model_path=args.model_path,
            confidence_threshold=args.confidence_threshold
        )
        
        # Handle different operation modes
        if args.info:
            # Get model information
            result = analyzer.get_model_info()
            print(json.dumps(result, indent=2))
            
        elif args.batch:
            # Batch analysis
            with open(args.batch, 'r') as f:
                batch_request = json.load(f)
            
            image_paths = batch_request.get('image_paths', [])
            user_ids = batch_request.get('user_ids', [])
            
            if len(image_paths) != len(user_ids):
                raise ValueError("Number of image paths must match number of user IDs")
            
            results = analyzer.analyze_batch(image_paths, user_ids)
            print(json.dumps(results, indent=2))
            
        elif args.image_path:
            # Single image analysis
            result = analyzer.analyze_image(args.image_path)
            print(json.dumps(result, indent=2))
            
        else:
            # No arguments provided, show help
            parser.print_help()
            
    except Exception as e:
        logger.error(f"Script execution failed: {e}")
        error_result = {
            "is_nsfw": False,
            "confidence": 0.0,
            "detections": [],
            "error": f"Script execution failed: {str(e)}"
        }
        print(json.dumps(error_result, indent=2))
        sys.exit(1)

if __name__ == "__main__":
    main()
