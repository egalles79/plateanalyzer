from fastapi import FastAPI, File, UploadFile
from fastapi.responses import JSONResponse
import tempfile, os, cv2, json
import subprocess

app = FastAPI()

@app.post("/process-video/")
async def process_video(file: UploadFile = File(...)):
    # Desa temporalment
    with tempfile.NamedTemporaryFile(delete=False, suffix=".mp4") as temp:
        temp.write(await file.read())
        temp_path = temp.name

    plates_detected = []

    # Extracció de frames
    cap = cv2.VideoCapture(temp_path)
    frame_count = 0

    while cap.isOpened():
        ret, frame = cap.read()
        if not ret or frame_count > 300:  # Limitem per exemple a 300 frames
            break

        # Desa frame com a imatge
        frame_path = f"/tmp/frame_{frame_count}.jpg"
        cv2.imwrite(frame_path, frame)

        # Crida a openalpr
        result = subprocess.run([
            "alpr", "-c", "eu", frame_path
        ], capture_output=True, text=True)

        if result.stdout:
            try:
                parsed = json.loads(result.stdout)
                for plate in parsed.get("results", []):
                    plates_detected.append({
                        "plate": plate["plate"],
                        "confidence": plate["confidence"],
                        "frame": frame_count
                    })
            except Exception as e:
                print("Error parsing ALPR output:", e)

        os.remove(frame_path)
        frame_count += 10  # Cada 10 frames per no saturar

    cap.release()
    os.remove(temp_path)
    return JSONResponse(content={"plates": plates_detected})

