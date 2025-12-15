# UTM Report System AI Service

A unified AI-powered API providing **Face Detection & Upscaling** and **Car Plate Identification** for the UTM Report System.

---

## 📖 Overview

### Why We Built This

The **UTM Report System** allows reporters to submit images when filing reports about suspicious activities or incidents. This AI service processes those images to assist enforcement teams by:

1. **🧑 Capturing Suspicious Person Faces**  
   When a reporter submits an image containing a person of interest, this service detects and extracts the face, then upscales it to a higher resolution. This enhanced facial image helps enforcement personnel identify the individual more effectively.

2. **🚗 Capturing Car Plates**  
   When a reporter submits an image of a vehicle involved in an incident, this service detects the license plate region and extracts the plate number using OCR. This information aids enforcement in tracking and identifying vehicles.

---

### What Does This Service Do?

| Feature | Input | Output | Use Case |
|---------|-------|--------|----------|
| **Face Detection & Upscaling** | Image with a suspicious person | High-resolution cropped face (JPG) | Identify individuals from blurry or low-quality report images |
| **Car Plate Identification** | Image of a vehicle | Plate text + confidence (JSON) | Extract plate numbers from images submitted in reports |

---

## 🏗️ Architecture

```
AI/
├── main.py                 # FastAPI entry point (unified router)
├── services/               # AI processing modules
│   ├── face_processing.py  # MTCNN detection + Real-ESRGAN upscaling
│   ├── plate_identifier.py # YOLOv8n detection + EasyOCR
│   └── model_downloader.py # Auto-downloads missing AI models
├── models/                 # Pre-trained weights (auto-downloaded)
│   ├── gfpgan/             # Face enhancement weights
│   ├── Yolov8n/            # Car plate YOLO weights (best.pt)
│   └── realesrgan/         # Real-ESRGAN upscaling model
├── Image/                  # Sample test images
├── Test/                   # Additional test resources
├── Upscaled_Results/       # Output folder for upscaled faces
├── pyproject.toml          # Dependencies managed by uv
└── README.md               # This file
```

### How It Works

```
┌─────────────────────────────────────────────────────────────┐
│                        main.py                              │
│                     (FastAPI Router)                        │
├─────────────────────┬───────────────────────────────────────┤
│    POST /face       │           POST /plate                 │
└──────────┬──────────┴──────────────────┬────────────────────┘
           │                             │
           ▼                             ▼
┌──────────────────────┐    ┌─────────────────────────────────┐
│  face_processing.py  │    │     plate_identifier.py         │
│                      │    │                                 │
│  1. MTCNN detects    │    │  1. YOLOv8n detects plate box   │
│     face bounding    │    │  2. Crop & preprocess           │
│     box              │    │  3. EasyOCR extracts text       │
│  2. Crop with pad    │    │  4. Return best result          │
│  3. Real-ESRGAN      │    │                                 │
│     upscales 4x      │    │                                 │
└──────────────────────┘    └─────────────────────────────────┘
```

---

## 🛠️ Tech Stack & Models

### AI Models We Use

| Model | Purpose | Why We Chose It |
|-------|---------|-----------------|
| **MTCNN** (Multi-task Cascaded Convolutional Networks) | Face Detection | MTCNN excels at detecting faces in various angles, lighting conditions, and partial occlusions—exactly the conditions found in reporter-submitted photos. It accurately locates facial landmarks, ensuring precise cropping. |
| **Real-ESRGAN** | Face Upscaling (4x Super-Resolution) | Report images are often taken from mobile phones at a distance, resulting in low-resolution faces. Real-ESRGAN is a state-of-the-art neural network that can upscale images by 4x while intelligently reconstructing facial details, making identification significantly easier. |
| **YOLOv8n** (You Only Look Once v8 nano) | Car Plate Detection | YOLO is renowned for its speed and accuracy in object detection. The nano variant is lightweight yet powerful enough to quickly locate license plates in images of varying quality. **This model is self-trained** specifically for Malaysian license plates (see below). |
| **EasyOCR** | Text Recognition from Plates | After detecting the plate region, EasyOCR extracts the alphanumeric characters. We chose EasyOCR because it handles various fonts and plate styles well, works completely offline (no API calls needed), and supports multiple languages including those found on Malaysian plates. |

### 🇲🇾 Custom-Trained YOLOv8n for Malaysian Plates

The YOLOv8n model included in this repository is **self-trained** (not a pre-trained generic model). It was fine-tuned specifically for **Malaysian license plates** to ensure high accuracy on local plate formats.

**Training Dataset:**

<a href="https://universe.roboflow.com/ivan-fbups/license-plate-malaysia-kqy48-looza">
    <img src="https://app.roboflow.com/images/download-dataset-badge.svg"></img>
</a>

The dataset contains Malaysian license plates with various:
- Plate colors (white background, black background)
- Lighting conditions (day, night, shadows)
- Angles and distances
- Vehicle types (cars, motorcycles, trucks)

This fine-tuning ensures the model performs significantly better on Malaysian plates compared to generic license plate detection models.

### Supporting Technologies

| Component | Technology | Why |
|-----------|------------|-----|
| **API Framework** | FastAPI | Auto-generates Swagger UI for easy testing, supports async operations, and provides type hints for reliability |
| **Image Processing** | OpenCV, NumPy | Industry-standard libraries for computer vision preprocessing tasks |
| **Dependency Manager** | uv | Ultra-fast Python package manager that simplifies installation |

---

## 🚀 Setup

### Prerequisites
- Python 3.10+
- [uv](https://github.com/astral-sh/uv) package manager

### Installation

```bash
# Navigate to AI folder
cd AI

# Create virtual environment
uv venv

# Activate (Windows PowerShell)
.venv\Scripts\Activate

# Activate (Linux/macOS)
source .venv/bin/activate

# Install dependencies
uv sync
```

---

## ⚡ Running the API

```bash
uv run python main.py
```

### 🔄 Automatic Model Download

On first run, the service will **automatically download** the required AI models:

| Model | Size | Purpose |
|-------|------|---------|
| Real-ESRGAN repository | ~15 MB | Face upscaling scripts |
| RealESRGAN_x4plus.pth | ~67 MB | Upscaling weights |
| detection_Resnet50_Final.pth | ~109 MB | Face detection weights |
| parsing_parsenet.pth | ~85 MB | Face parsing weights |

> **Note:** First startup may take a few minutes while models download. Subsequent starts are instant.

**Output:**
```
Starting UTM Report System AI API...
Swagger UI: http://127.0.0.1:8000/docs
INFO:     Uvicorn running on http://127.0.0.1:8000
```

Open **http://127.0.0.1:8000/docs** for interactive API documentation (Swagger UI).

---

## 📡 API Endpoints

### `GET /` – Health Check

Returns service status and available endpoints.

```bash
curl http://127.0.0.1:8000/
```

**Response:**
```json
{
  "status": "healthy",
  "message": "UTM Report System AI API",
  "endpoints": {
    "/face": "POST - Face detection and upscaling",
    "/plate": "POST - Car plate identification"
  }
}
```

---

### `POST /face` – Face Upscaling

Upload an image containing a face. The API:
1. Detects the face using MTCNN
2. Crops with padding for context
3. Upscales 4x using Real-ESRGAN
4. Returns the enhanced face as JPG

```bash
curl -X POST "http://127.0.0.1:8000/face" \
  -F "file=@person.jpg" \
  -o upscaled_face.jpg
```

**Success:** Returns `image/jpg` (the upscaled face)

**Errors:**
| Code | Reason |
|------|--------|
| 400 | Invalid image file |
| 404 | No face detected |
| 500 | Upscaling failed |

---

### `POST /plate` – Car Plate Identification

Upload an image of a vehicle. The API:
1. Detects the plate region using YOLOv8n
2. Preprocesses the crop (grayscale, upscale, threshold)
3. Runs EasyOCR on multiple image variants (normal + inverted)
4. Returns the best OCR result

```bash
curl -X POST "http://127.0.0.1:8000/plate" \
  -F "file=@car.jpg"
```

**Success Response:**
```json
{
  "status": "success",
  "plate": "VCF2025",
  "confidence": 0.999
}
```

**Error Response:**
```json
{
  "status": "error",
  "plate": null,
  "confidence": null
}
```

---

## 🔍 How the Plate OCR Handles Different Plate Types

Malaysian plates come in two styles:
- **White background** with black text (standard)
- **Black background** with white text (EV cars)

The system tries **both normal and inverted** images, then picks the result with the highest confidence. This dual-mode approach ensures accurate OCR regardless of plate color scheme.

---

## 🔧 Extending the Service

To add a new AI feature:

1. Create a processing module in `services/` (e.g., `object_detector.py`)
2. Import and expose it in `main.py`:
   ```python
   from services.object_detector import detect_objects
   
   @app.post("/detect")
   async def detect(file: UploadFile = File(...)):
       ...
   ```
3. Swagger UI updates automatically – no extra configuration needed

---

## 📁 Model Weights

All weights are pre-downloaded in `models/`:

| Folder | Model | Size | Purpose |
|--------|-------|------|---------|
| `gfpgan/` | Face enhancement | ~195 MB | Facial feature restoration |
| `Yolov8n/train/weights/best.pt` | YOLOv8n | ~6 MB | Car plate detection |
| `realesrgan/` | Real-ESRGAN | ~67 MB | 4x image upscaling |

---

## 🧪 Testing

Put sample in the `Image/` folder for testing purpose:

```bash
# Test face upscaling
curl -X POST "http://127.0.0.1:8000/face" -F "file=@Image/sample_person.jpg" -o test.jpg

# Test plate identification
curl -X POST "http://127.0.0.1:8000/plate" -F "file=@Image/sample_carPlate.jpg"
```
