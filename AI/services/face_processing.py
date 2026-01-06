"""
Face Processing Module

Provides face detection using MTCNN and upscaling using Real-ESRGAN.
Used to enhance low-quality faces from reporter-submitted images for enforcement identification.
"""

import cv2
import numpy as np
from mtcnn import MTCNN
import subprocess
import sys
import os
import tempfile
import logging

# Configure module logger
logger = logging.getLogger(__name__)

# --- GPU Status Check ---
try:
    import torch
    if torch.cuda.is_available():
        logger.info(f"PyTorch CUDA available: GPU={torch.cuda.get_device_name(0)}")
    else:
        logger.warning("PyTorch CUDA not available - Real-ESRGAN will use CPU (slow)")
except ImportError:
    logger.warning("PyTorch not found - GPU status unknown")

# --- Initialization ---
logger.info("Initializing MTCNN detector...")
try:
    detector = MTCNN()
    logger.info("MTCNN detector initialized successfully.")
except Exception as e:
    logger.error(f"Error initializing MTCNN: {e}")
    logger.error("Please ensure TensorFlow (or a compatible backend) is correctly installed.")
    detector = None

# Get the parent directory
SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))
AI_DIR = os.path.dirname(SCRIPT_DIR)

# Path to the python executable currently running this
PYTHON_EXE = sys.executable

# Path to the Real-ESRGAN inference script
SCRIPT_PATH = os.path.join(AI_DIR, 'models', 'realesrgan', 'inference_realesrgan.py')

def detect_and_crop_face(image_array: np.ndarray, padding_percent: float = 0.25) -> np.ndarray | None:
    """
    Detects the first face in an image, crops it, and adds padding.

    Args:
        image_array: The image as a NumPy array (from cv2.imdecode).
        padding_percent: Percentage of width/height to add as padding.
                         0.25 means 25% padding.

    Returns:
        A NumPy array of the cropped face, or None if no face is detected.
    """
    if detector is None:
        logger.error("MTCNN detector is not available. Aborting face detection.")
        return None

    logger.info("Detecting faces...")
    try:
        # MTCNN expects images in RGB format
        image_rgb = cv2.cvtColor(image_array, cv2.COLOR_BGR2RGB)
        result = detector.detect_faces(image_rgb)
    except Exception as e:
        logger.error(f"An error occurred during face detection: {e}")
        return None

    if not result:
        logger.warning("No face detected.")
        return None

    # Use the first detected face
    face = result[0]
    x, y, w, h = face['box']

    logger.info(f"Face detected at [x={x}, y={y}, w={w}, h={h}]")

    img_h, img_w = image_array.shape[:2]
    pad_h = int(h * padding_percent) 
    pad_w = int(w * padding_percent)
    pad_h_top = int(pad_h * 0.7)
    pad_h_bottom = pad_h - pad_h_top
    pad_w_sides = pad_w // 2
    
    x1 = max(0, x - pad_w_sides)
    y1 = max(0, y - pad_h_top)
    x2 = min(img_w, x + w + pad_w_sides)
    y2 = min(img_h, y + h + pad_h_bottom)
    
    logger.debug(f"Cropping with padding to [x1={x1}, y1={y1}, x2={x2}, y2={y2}]")

    # Crop the original image (BGR)
    cropped_face = image_array[y1:y2, x1:x2]

    return cropped_face

# --- Face Upscaling ---

def upscale_face(face_array: np.ndarray) -> np.ndarray | None:
    """
    Upscales a cropped face image using Real-ESRGAN.

    This function saves the input array to a temporary file,
    runs the Real-ESRGAN subprocess, reads the upscaled
    image from a temporary output directory, and returns it.

    Args:
        face_array: The cropped face image as a NumPy array.

    Returns:
        The upscaled face image as a NumPy array, or None if upscaling fails.
    """
    if not os.path.exists(SCRIPT_PATH):
        logger.error(f"Real-ESRGAN script not found at {SCRIPT_PATH}")
        logger.error("Please ensure 'Real-ESRGAN' folder is in models/ directory")
        return None

    logger.info("Starting face upscaling...")
    
    try:
        # Create a temporary directory to store the output
        with tempfile.TemporaryDirectory() as output_dir:
            # Create a temporary file for the input face
            # delete=False is needed so we can write to it, pass its name, and delete manually
            with tempfile.NamedTemporaryFile(suffix=".jpg", delete=False) as input_file:
                cv2.imwrite(input_file.name, face_array)
                input_path = input_file.name

            logger.debug(f"Temporary input file: {input_path}")
            logger.debug(f"Temporary output dir: {output_dir}")

            # --- Build the Command ---
            # This is based on your Face_Upscaler_test.py
            command = [
                PYTHON_EXE,
                SCRIPT_PATH,
                '-n', 'RealESRGAN_x4plus',  # Model name
                '-i', input_path,             # Input file path
                '-o', output_dir,             # Output directory
                # '--face_enhance',             # Use face enhancement model
                '--fp32',                     # Use full precision
                '-g', '0'                   
            ]

            logger.debug(f"Running command: {' '.join(command)}")

            # --- Run the Subprocess ---
            try:
                subprocess.run(
                    command,
                    check=True,  # Raise an error if the command fails
                    capture_output=True, # Capture stdout/stderr
                    text=True,
                    encoding='utf-8'
                )
                logger.info("Real-ESRGAN process completed.")
                
            except subprocess.CalledProcessError as e:
                logger.error(f"Real-ESRGAN process failed with error code {e.returncode}")
                logger.debug(f"STDOUT: {e.stdout}")
                logger.debug(f"STDERR: {e.stderr}")
                os.remove(input_path)  # Clean up input file
                return None
            
            # --- Read the Upscaled Image ---
            output_files = os.listdir(output_dir)
            if not output_files:
                logger.error("Real-ESRGAN ran but produced no output files.")
                os.remove(input_path)  # Clean up input file
                return None

            # Assuming the first file found is our upscaled image
            upscaled_image_name = output_files[0]
            upscaled_image_path = os.path.join(output_dir, upscaled_image_name)

            logger.debug(f"Reading upscaled file: {upscaled_image_path}")
            
            upscaled_image = cv2.imread(upscaled_image_path)
            
            if upscaled_image is None:
                logger.error("Failed to read the upscaled image file from disk.")
                os.remove(input_path)  # Clean up input file
                return None
            
            # Clean up the temporary input file
            os.remove(input_path)

            logger.info("Face upscaling completed successfully.")
            return upscaled_image

    except Exception as e:
        logger.error(f"An unexpected error occurred during upscaling: {e}")
        # Ensure cleanup if input_path was defined
        if 'input_path' in locals() and os.path.exists(input_path):
            os.remove(input_path)
        return None
