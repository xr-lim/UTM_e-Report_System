"""
Model Downloader Module

Automatically downloads required AI models (Real-ESRGAN, GFPGAN) if they don't exist.
This ensures the service works immediately after cloning the repository.
"""

import os
import logging
import subprocess
import sys
import urllib.request
import zipfile
import shutil

logger = logging.getLogger(__name__)

# Get paths
SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))
AI_DIR = os.path.dirname(SCRIPT_DIR)
MODELS_DIR = os.path.join(AI_DIR, 'models')

# Model configurations
MODELS_CONFIG = {
    'realesrgan': {
        'repo_url': 'https://github.com/xinntao/Real-ESRGAN/archive/refs/heads/master.zip',
        'repo_folder_name': 'Real-ESRGAN-master',  # Name after extraction
        'target_folder': os.path.join(MODELS_DIR, 'realesrgan'),
        'weights': [
            {
                'name': 'RealESRGAN_x4plus.pth',
                'url': 'https://github.com/xinntao/Real-ESRGAN/releases/download/v0.1.0/RealESRGAN_x4plus.pth',
                'dest': os.path.join(MODELS_DIR, 'realesrgan', 'weights')
            }
        ],
        'check_file': os.path.join(MODELS_DIR, 'realesrgan', 'inference_realesrgan.py')
    },
    'gfpgan': {
        'weights': [
            {
                'name': 'detection_Resnet50_Final.pth',
                'url': 'https://github.com/xinntao/facexlib/releases/download/v0.1.0/detection_Resnet50_Final.pth',
                'dest': os.path.join(MODELS_DIR, 'gfpgan', 'weights')
            },
            {
                'name': 'parsing_parsenet.pth',
                'url': 'https://github.com/xinntao/facexlib/releases/download/v0.1.0/parsing_parsenet.pth',
                'dest': os.path.join(MODELS_DIR, 'gfpgan', 'weights')
            }
        ],
        'check_file': os.path.join(MODELS_DIR, 'gfpgan', 'weights', 'detection_Resnet50_Final.pth')
    }
}


def download_file(url: str, dest_path: str, filename: str) -> bool:
    """
    Download a file from URL to destination path.
    
    Args:
        url: URL to download from
        dest_path: Directory to save the file
        filename: Name of the file
        
    Returns:
        True if successful, False otherwise
    """
    os.makedirs(dest_path, exist_ok=True)
    file_path = os.path.join(dest_path, filename)
    
    if os.path.exists(file_path):
        logger.info(f"  ✓ {filename} already exists")
        return True
    
    logger.info(f"  ↓ Downloading {filename}...")
    logger.info(f"    From: {url}")
    
    try:
        # Download with progress indication
        urllib.request.urlretrieve(url, file_path)
        logger.info(f"  ✓ Downloaded {filename}")
        return True
    except Exception as e:
        logger.error(f"  ✗ Failed to download {filename}: {e}")
        return False


def download_and_extract_repo(url: str, target_folder: str, repo_folder_name: str) -> bool:
    """
    Download a GitHub repository as ZIP and extract it.
    
    Args:
        url: URL to the ZIP file
        target_folder: Where to extract the repo
        repo_folder_name: Name of the folder inside the ZIP
        
    Returns:
        True if successful, False otherwise
    """
    if os.path.exists(target_folder):
        logger.info(f"  ✓ Repository folder already exists: {target_folder}")
        return True
    
    logger.info(f"  ↓ Downloading repository...")
    logger.info(f"    From: {url}")
    
    try:
        # Download ZIP to temp location
        zip_path = os.path.join(MODELS_DIR, 'temp_repo.zip')
        urllib.request.urlretrieve(url, zip_path)
        
        logger.info(f"  ↓ Extracting repository...")
        
        # Extract ZIP
        with zipfile.ZipFile(zip_path, 'r') as zip_ref:
            zip_ref.extractall(MODELS_DIR)
        
        # Rename extracted folder to target name
        extracted_path = os.path.join(MODELS_DIR, repo_folder_name)
        if os.path.exists(extracted_path):
            shutil.move(extracted_path, target_folder)
        
        # Clean up ZIP
        os.remove(zip_path)
        
        logger.info(f"  ✓ Repository extracted to {target_folder}")
        return True
        
    except Exception as e:
        logger.error(f"  ✗ Failed to download/extract repository: {e}")
        # Clean up on failure
        if os.path.exists(zip_path):
            os.remove(zip_path)
        return False


def setup_realesrgan() -> bool:
    """
    Set up Real-ESRGAN: download repo and weights.
    
    Returns:
        True if successful, False otherwise
    """
    config = MODELS_CONFIG['realesrgan']
    
    logger.info("=" * 50)
    logger.info("Setting up Real-ESRGAN...")
    logger.info("=" * 50)
    
    # Check if already set up
    if os.path.exists(config['check_file']):
        # Check weights too
        weights_exist = all(
            os.path.exists(os.path.join(w['dest'], w['name']))
            for w in config['weights']
        )
        if weights_exist:
            logger.info("✓ Real-ESRGAN is already set up")
            return True
    
    # Download and extract repository
    if not download_and_extract_repo(
        config['repo_url'],
        config['target_folder'],
        config['repo_folder_name']
    ):
        return False
    
    # Create weights directory
    weights_dir = os.path.join(config['target_folder'], 'weights')
    os.makedirs(weights_dir, exist_ok=True)
    
    # Download model weights
    for weight in config['weights']:
        if not download_file(weight['url'], weight['dest'], weight['name']):
            return False
    
    logger.info("✓ Real-ESRGAN setup complete!")
    return True


def setup_gfpgan() -> bool:
    """
    Set up GFPGAN weights (only weights needed, not the full repo).
    
    Returns:
        True if successful, False otherwise
    """
    config = MODELS_CONFIG['gfpgan']
    
    logger.info("=" * 50)
    logger.info("Setting up GFPGAN weights...")
    logger.info("=" * 50)
    
    # Check if already set up
    if os.path.exists(config['check_file']):
        weights_exist = all(
            os.path.exists(os.path.join(w['dest'], w['name']))
            for w in config['weights']
        )
        if weights_exist:
            logger.info("✓ GFPGAN weights are already set up")
            return True
    
    # Download model weights
    for weight in config['weights']:
        if not download_file(weight['url'], weight['dest'], weight['name']):
            return False
    
    logger.info("✓ GFPGAN setup complete!")
    return True


def ensure_models_exist() -> bool:
    """
    Ensure all required models are downloaded and set up.
    Called at startup to auto-download missing models.
    
    Returns:
        True if all models are ready, False if any setup failed
    """
    logger.info("")
    logger.info("╔══════════════════════════════════════════════════╗")
    logger.info("║       Checking AI Models Installation...         ║")
    logger.info("╚══════════════════════════════════════════════════╝")
    logger.info("")
    
    # Create models directory if it doesn't exist
    os.makedirs(MODELS_DIR, exist_ok=True)
    
    # Set up each model
    realesrgan_ok = setup_realesrgan()
    gfpgan_ok = setup_gfpgan()
    
    if realesrgan_ok and gfpgan_ok:
        logger.info("")
        logger.info("╔══════════════════════════════════════════════════╗")
        logger.info("║         All AI Models Ready! ✓                   ║")
        logger.info("╚══════════════════════════════════════════════════╝")
        logger.info("")
        return True
    else:
        logger.error("")
        logger.error("╔══════════════════════════════════════════════════╗")
        logger.error("║   Some models failed to set up. Check logs.     ║")
        logger.error("╚══════════════════════════════════════════════════╝")
        logger.error("")
        return False


# Run setup when module is imported (optional - can also call explicitly)
if __name__ == "__main__":
    # Configure logging for standalone run
    logging.basicConfig(
        level=logging.INFO,
        format='%(asctime)s - %(levelname)s - %(message)s'
    )
    ensure_models_exist()
