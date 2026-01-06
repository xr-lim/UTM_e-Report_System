"""
UTM Report System AI Service

This API assists enforcement teams by processing images submitted by reporters:
1. Face Detection & Upscaling - Captures and enhances suspicious person faces
2. Car Plate Identification - Extracts license plate numbers from vehicles

Endpoints:
    GET  /       : Health check and service info
    POST /face   : Detect, crop, and upscale a face from an image
    POST /plate  : Detect car plate and extract text via OCR
"""

import uvicorn
from fastapi import FastAPI, File, UploadFile, HTTPException
from fastapi.responses import StreamingResponse
from pydantic import BaseModel
import cv2
import numpy as np
import io
import logging

# Configure logging FIRST (before other imports that use logging)
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

# --- Auto-download models if missing ---
from services.model_downloader import ensure_models_exist

logger.info("Checking AI models...")
if not ensure_models_exist():
    logger.warning("Some models may not be available. Face upscaling might not work.")

# Import processing modules (after models are downloaded)
from services.face_processing import detect_and_crop_face, upscale_face
from services.plate_identifier import CarPlateIdentifier

# Initialize FastAPI
app = FastAPI(
    title="UTM Report System AI API",
    description="AI service for processing reporter-submitted images to assist enforcement teams. "
                "Provides face detection & upscaling and car plate identification.",
    version="1.0.0"
)

# Initialize plate identifier at startup
logger.info("Initializing Car Plate Identifier...")
try:
    plate_identifier = CarPlateIdentifier()
    logger.info("Car Plate Identifier initialized successfully")
except Exception as e:
    logger.error(f"Failed to initialize Car Plate Identifier: {e}")
    plate_identifier = None


class PlateResponse(BaseModel):
    """Response model for plate identification"""
    status: str
    plate: str | None
    confidence: float | None


@app.get("/")
def read_root():
    """Health check endpoint"""
    return {
        "status": "healthy",
        "message": "UTM Report System AI API",
        "endpoints": {
            "/face": "POST - Face detection and upscaling",
            "/plate": "POST - Car plate identification"
        }
    }


@app.post("/face")
async def process_face(file: UploadFile = File(...)):
    """
    Face detection, cropping, and upscaling endpoint.
    
    1. Receives an image file
    2. Detects and crops the face using MTCNN
    3. Upscales the face using Real-ESRGAN
    4. Returns the upscaled face as JPG
    """
    logger.info(f"Received face request: {file.filename}")
    
    # Read image bytes
    contents = await file.read()
    nparr = np.frombuffer(contents, np.uint8)
    img = cv2.imdecode(nparr, cv2.IMREAD_COLOR)
    
    if img is None:
        raise HTTPException(status_code=400, detail="Invalid image file. Could not decode.")
    
    # Detect and crop face
    cropped_face = detect_and_crop_face(img)
    if cropped_face is None:
        raise HTTPException(status_code=404, detail="No face detected in the uploaded image.")
    
    # Upscale face
    upscaled_face = upscale_face(cropped_face)
    if upscaled_face is None:
        raise HTTPException(status_code=500, detail="Face upscaling process failed on the server.")
    
    # Encode and return
    is_success, buffer = cv2.imencode(".jpg", upscaled_face)
    if not is_success:
        raise HTTPException(status_code=500, detail="Failed to encode upscaled image.")
    
    io_buf = io.BytesIO(buffer)
    logger.info("Successfully processed face image")
    
    return StreamingResponse(io_buf, media_type="image/jpg")


@app.post("/plate", response_model=PlateResponse)
async def identify_plate(file: UploadFile = File(...)):
    """
    Car plate detection and OCR endpoint.
    
    1. Receives an image file
    2. Detects plate using YOLOv8n
    3. Extracts text using EasyOCR
    4. Returns plate text and confidence
    """
    if plate_identifier is None:
        raise HTTPException(status_code=500, detail="Plate identifier not initialized.")
    
    logger.info(f"Received plate request: {file.filename}")
    
    # Read image bytes
    contents = await file.read()
    nparr = np.frombuffer(contents, np.uint8)
    img = cv2.imdecode(nparr, cv2.IMREAD_COLOR)
    
    if img is None:
        raise HTTPException(status_code=400, detail="Invalid image file. Could not decode.")
    
    # Identify plate
    plate_text, confidence = plate_identifier.identify_plate(img)
    
    if plate_text:
        logger.info(f"Successfully identified plate: {plate_text}")
        return PlateResponse(
            status="success",
            plate=plate_text,
            confidence=round(confidence, 4) if confidence else None
        )
    else:
        return PlateResponse(
            status="error",
            plate=None,
            confidence=None
        )


if __name__ == "__main__":
    import socket
    
    def get_network_ips():
        """Get valid network IPs, filtering out virtual adapters and link-local."""
        ips = []
        try:
            # Get all network interfaces
            for interface in socket.getaddrinfo(socket.gethostname(), None):
                ip = interface[4][0]
                # Filter for IPv4 only
                if "." not in ip:
                    continue
                # Skip loopback
                if ip.startswith("127."):
                    continue
                # Skip link-local (APIPA) addresses - these are not routable
                if ip.startswith("169.254."):
                    continue
                # Skip VirtualBox adapter
                if ip.startswith("192.168.56."):
                    continue
                # Skip already added
                if ip in ips:
                    continue
                ips.append(ip)
        except Exception:
            pass
        
        # Sort to prioritize mobile hotspot first, then WiFi
        def ip_priority(ip):
            if ip.startswith("172.20."):  # Mobile hotspot
                return 0
            if ip.startswith("192.168."):  # Home WiFi
                return 1
            if ip.startswith("10."):  # Corporate/VPN
                return 2
            return 5
        
        return sorted(ips, key=ip_priority)

    local_ips = get_network_ips()
    
    print("\n" + "="*50)
    print("UTM Report System AI API is starting...")
    print("="*50)
    print(f"Local Access:   http://127.0.0.1:8000")
    print(f"Swagger Docs:   http://127.0.0.1:8000/docs")
    print("-"*50)
    print("Network Access (Try these from other devices):")
    if local_ips:
        # Show the best IP first with emphasis
        print(f"  ★ http://{local_ips[0]}:8000  (recommended)")
        for ip in local_ips[1:]:
            print(f"  - http://{ip}:8000")
    else:
        print("  (No network interfaces detected)")
    print("-"*50)
    print("If other devices cannot connect:")
    print("1. Ensure they are on the SAME WiFi network.")
    print("2. Check Windows Firewall: Allow Python/Uvicorn or Port 8000.")
    print("3. Set your network profile to 'Private' in Windows Settings.")
    print("="*50 + "\n")
    
    uvicorn.run(app, host="0.0.0.0", port=8000)
