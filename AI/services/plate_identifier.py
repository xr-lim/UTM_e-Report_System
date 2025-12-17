"""
Car Plate Identification Module

Provides car plate detection using YOLOv8n and text extraction using EasyOCR.
Used to identify vehicle plates from images submitted in reports for enforcement purposes.
"""

import logging
import os
import cv2
import numpy as np
from ultralytics import YOLO
import easyocr

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)


class CarPlateIdentifier:
    """
    A class for identifying car plates in images using YOLOv8n for detection
    and EasyOCR for text recognition.
    """
    
    def __init__(self, model_path: str = None):
        """
        Initialize the CarPlateIdentifier with YOLO model and EasyOCR.
        
        Args:
            model_path: Path to the YOLOv8n trained weights. If None, uses default path.
        """
        # Set default model path if not provided
        if model_path is None:
            script_dir = os.path.dirname(os.path.abspath(__file__))
            ai_dir = os.path.dirname(script_dir)
            model_path = os.path.join(ai_dir, 'models', 'Yolov8n', 'train', 'weights', 'best.pt')
        
        logger.info(f"Loading YOLO model from: {model_path}")
        
        if not os.path.exists(model_path):
            raise FileNotFoundError(f"YOLO model not found at: {model_path}")
        
        try:
            self.model = YOLO(model_path)
            logger.info("YOLO model loaded successfully")
        except Exception as e:
            logger.error(f"Failed to load YOLO model: {e}")
            raise
        
        # Initialize EasyOCR for English text recognition
        logger.info("Initializing EasyOCR...")
        try:
            self.reader = easyocr.Reader(['en'], gpu=False)
            logger.info("EasyOCR initialized successfully")
        except Exception as e:
            logger.error(f"Failed to initialize EasyOCR: {e}")
            raise
    
    def identify_plate(self, image: np.ndarray) -> tuple[str | None, float | None]:
        """
        Identify car plate in an image and return the plate text with confidence.
        
        Args:
            image: Input image as a NumPy array (BGR format from OpenCV)
            
        Returns:
            Tuple of (plate_text, confidence) or (None, None) if no plate detected
        """
        logger.info("Starting plate identification...")
        
        # Step 1: Detect plate using YOLO
        detections = self._detect_plate(image)
        
        if not detections:
            logger.warning("No car plate detected in the image")
            return None, None
        
        # Step 2: Process the best detection (highest confidence)
        best_detection = max(detections, key=lambda x: x['confidence'])
        logger.info(f"Best detection confidence: {best_detection['confidence']:.2f}")
        
        # Step 3: Crop the plate region with padding
        crop = self._crop_plate(image, best_detection['box'])
        
        # Step 4: Try OCR on both normal and inverted images, pick best result
        plate_text, ocr_confidence = self._process_and_ocr(crop)
        
        if plate_text:
            logger.info(f"Plate identified: {plate_text} (confidence: {ocr_confidence:.2f})")
        else:
            logger.warning("OCR failed to extract text from plate")
        
        return plate_text, ocr_confidence
    
    def _detect_plate(self, image: np.ndarray) -> list[dict]:
        """
        Detect car plates in the image using YOLO.
        """
        logger.info("Running YOLO detection...")
        
        try:
            results = self.model(image, verbose=False)
            detections = []
            
            for result in results:
                boxes = result.boxes.cpu().numpy()
                for box in boxes:
                    x1, y1, x2, y2 = map(int, box.xyxy[0])
                    confidence = float(box.conf[0])
                    detections.append({
                        'box': (x1, y1, x2, y2),
                        'confidence': confidence
                    })
            
            logger.info(f"Found {len(detections)} plate(s)")
            return detections
            
        except Exception as e:
            logger.error(f"YOLO detection failed: {e}")
            return []
    
    def _crop_plate(self, image: np.ndarray, box: tuple, padding: int = 15) -> np.ndarray:
        """
        Crop the plate region from the image with padding.
        """
        h, w = image.shape[:2]
        x1, y1, x2, y2 = box
        
        # Add padding while staying within image bounds
        x1_pad = max(0, x1 - padding)
        y1_pad = max(0, y1 - padding)
        x2_pad = min(w, x2 + padding)
        y2_pad = min(h, y2 + padding)
        
        crop = image[y1_pad:y2_pad, x1_pad:x2_pad]
        logger.info(f"Cropped plate region: {crop.shape}")
        
        return crop
    
    def _format_malaysian_plate(self, raw_text: str) -> str:
        """
        Format raw OCR text into Malaysian plate format.
        
        Malaysian plates have letters separate from digits:
        - VLN7728 -> VLN 7728 (prefix + digits)
        - AAS2929 -> AAS 2929 (prefix + digits)
        - S2293N -> S 2293 N (prefix + digits + suffix)
        
        Args:
            raw_text: Raw OCR text without spaces
            
        Returns:
            Formatted plate string with proper spacing
        """
        letters_prefix = []
        digits = []
        letters_suffix = []
        
        in_digits = False
        for char in raw_text.upper():
            if char.isalpha():
                if in_digits:
                    letters_suffix.append(char)
                else:
                    letters_prefix.append(char)
            elif char.isdigit():
                in_digits = True
                digits.append(char)
        
        # Build formatted plate with spaces
        parts = []
        if letters_prefix:
            parts.append(''.join(letters_prefix))
        if digits:
            parts.append(''.join(digits))
        if letters_suffix:
            parts.append(''.join(letters_suffix))
        
        return ' '.join(parts)
    
    def _process_and_ocr(self, crop: np.ndarray) -> tuple[str | None, float | None]:
        """
        Process the plate crop and run OCR.
        
        Tries both normal and inverted images to handle:
        - White background with black text (standard plates)
        - Black background with white text (commercial/taxi plates)
        
        Returns the best OCR result based on confidence.
        
        Args:
            crop: Cropped plate image (BGR)
            
        Returns:
            Tuple of (best_text, confidence) or (None, None) if OCR fails
        """
        logger.info("Processing plate crop with dual-mode OCR...")
        
        # Convert to grayscale
        gray = cv2.cvtColor(crop, cv2.COLOR_BGR2GRAY)
        
        # Upscale for better OCR (3x for better letter recognition)
        gray = cv2.resize(gray, None, fx=3, fy=3, interpolation=cv2.INTER_CUBIC)
        
        # Create inverted version
        inverted = cv2.bitwise_not(gray)
        
        # Apply adaptive thresholding to both versions
        thresh_normal = cv2.adaptiveThreshold(
            gray, 255,
            cv2.ADAPTIVE_THRESH_GAUSSIAN_C,
            cv2.THRESH_BINARY,
            11, 2
        )
        
        thresh_inverted = cv2.adaptiveThreshold(
            inverted, 255,
            cv2.ADAPTIVE_THRESH_GAUSSIAN_C,
            cv2.THRESH_BINARY,
            11, 2
        )
        
        # Also try the raw grayscale images (sometimes works better)
        all_images = [
            ("normal_gray", gray),
            ("inverted_gray", inverted),
            ("normal_thresh", thresh_normal),
            ("inverted_thresh", thresh_inverted),
        ]
        
        best_result = None
        best_confidence = 0.0
        
        for name, img in all_images:
            logger.info(f"Running OCR on {name}...")
            result = self._run_ocr_single(img)
            
            if result[0] is not None and result[1] is not None:
                logger.info(f"  {name}: '{result[0]}' (conf: {result[1]:.2f})")
                if result[1] > best_confidence:
                    best_result = result
                    best_confidence = result[1]
            else:
                logger.info(f"  {name}: no result")
        
        if best_result:
            logger.info(f"Best result: '{best_result[0]}' (confidence: {best_result[1]:.2f})")
            return best_result
        
        return None, None
    
    def _run_ocr_single(self, image: np.ndarray) -> tuple[str | None, float | None]:
        """
        Run EasyOCR on a single image.
        
        Args:
            image: Preprocessed image (grayscale)
            
        Returns:
            Tuple of (best_text, confidence) or (None, None) if OCR fails
        """
        try:
            # Run OCR - EasyOCR returns list of (bbox, text, confidence)
            results = self.reader.readtext(image)
            
            if not results:
                return None, None
            
            # Filter and collect all results with bbox info for sorting
            valid_results = []
            for (bbox, text, confidence) in results:
                # Filter out very low confidence results
                if confidence > 0.1:
                    valid_results.append((bbox, text, confidence))
            
            if not valid_results:
                return None, None
            
            # Sort by horizontal position (left to right) using bbox x-coordinate
            # bbox format: [[x1,y1], [x2,y2], [x3,y3], [x4,y4]]
            valid_results.sort(key=lambda x: x[0][0][0])
            
            # Combine all text segments
            combined_text = ''.join(text.strip() for (bbox, text, confidence) in valid_results)
            avg_confidence = sum(conf for (bbox, text, conf) in valid_results) / len(valid_results)
            
            # Clean up (remove spaces and special characters, keep alphanumeric)
            cleaned_text = ''.join(c for c in combined_text.upper() if c.isalnum())
            
            # Format as Malaysian plate (letters space digits space suffix)
            formatted_plate = self._format_malaysian_plate(cleaned_text)
            
            return formatted_plate, avg_confidence
            
        except Exception as e:
            logger.debug(f"OCR failed: {e}")
            return None, None


# For testing purposes
if __name__ == "__main__":
    import sys
    
    # Initialize identifier
    identifier = CarPlateIdentifier()
    
    # Test with an image if provided
    if len(sys.argv) > 1:
        image_path = sys.argv[1]
        if os.path.exists(image_path):
            image = cv2.imread(image_path)
            if image is not None:
                plate, confidence = identifier.identify_plate(image)
                print(f"\nResult: Plate={plate}, Confidence={confidence}")
            else:
                print(f"Failed to read image: {image_path}")
        else:
            print(f"Image not found: {image_path}")
    else:
        print("Usage: python CarPlateIdentify.py <image_path>")
