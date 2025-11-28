# Suspicious People Identifier API

This project provides a FastAPI endpoint for suspicious people identification. It uses MTCNN to detect and crop a face from an uploaded image, and GFPGAN to upscale and restore facial features, providing a clearer image for analysis.

## Project Structure

```
AI/
├── .venv/
├── gfpgan/
├── Image/
├── Real-ESRGAN/
├── Suspicious_Identifier/
│   ├── __pycache__/
│   ├── gfpgan/
│   ├── Face_Processing.py  # Handles MTCNN detection & GFPGAN upscaling
│   └── FastAPI.py          # The API server
├── Test/
├── Upscaled_Results/
├── pyproject.toml
├── README.md
├── requirements.txt
└── uv.lock
```

## 🚀 Setup

Follow these steps to set up your local environment.

### 1. Navigate to Project Root

```bash
cd path/to/your/project/AI
```

### 2. Create Virtual Environment

```bash
uv venv
```

### 3. Activate Virtual Environment

On macOS/Linux:

```bash
source .venv/bin/activate
```

On Windows (Command Prompt):

```bash
.venv\Scripts\activate
```

### 4. Install Dependencies

```bash
uv sync
```

## ⚡ Running the API

Navigate to the API directory and start the server:

```bash
cd Suspicious_Identifier
uvicorn FastAPI:app --reload
```

## 🛠️ API Usage

The API provides one main endpoint for processing images.

### Root

- **Endpoint:** `GET /`
- **Description:** Check if the API server is running.
- **Response:**
  ```json
  {
    "message": "Welcome to the Face Upscaler API. POST an image to /upscale-face/"
  }
  ```

### Process & Upscale Face

- **Endpoint:** `POST /upscale-face/`
- **Description:** Upload an image. The API detects the face (MTCNN), crops it, and returns a high-quality, upscaled version (GFPGAN).
- **Request Body:** `multipart/form-data` with a single file field containing your image.
- **Success Response:**
  - **Code:** 200 OK
  - **Body:** The upscaled image is returned directly as `image/jpg`.
- **Error Responses:**
  - **404 Not Found**
    ```json
    { "detail": "No face detected in the uploaded image." }
    ```
  - **400 Bad Request**
    ```json
    { "detail": "Invalid image file. Could not decode." }
    ```
  - **500 Internal Server Error**
    ```json
    { "detail": "Face upscaling process failed on the server." }
    ```

### Example curl Request

Test the endpoint using curl (replace `/path/to/your/image.jpg` with your image path):

```bash
curl -X POST "http://127.0.0.1:8000/upscale-face/" \
     -H "accept: application/json" \
     -H "Content-Type: multipart/form-data" \
     -F "file=@/path/to/your/image.jpg" \
     --output processed_face.jpg
```

This command sends the image and saves the returned upscaled face as `processed_face.jpg` in your current directory.
