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
    print("Starting UTM Report System AI API...")
    print("Swagger UI: http://127.0.0.1:8000/docs")
    uvicorn.run(app, host="127.0.0.1", port=8000)
