# Offline Model Setup

This document records the model setup verified on 2026-08-30 for the SIH26188 demo.

## Environment

- Python: 3.11.9, 64-bit
- Python executable: `C:\Users\thumm\AppData\Local\Programs\Python\Python311\python.exe`
- DeepFace: 0.0.100
- TensorFlow: 2.21.0
- tf-keras: 2.21.0
- EasyOCR: 1.7.2
- OpenCV: 4.11.0
- Pillow: 12.3.0

The application uses:

- DeepFace `DeepFace.verify` with `model_name='Facenet'` and `detector_backend='opencv'` in `backend/modules/face_matcher.py`.
- EasyOCR `easyocr.Reader(['en'], gpu=False)` lazily in `backend/modules/ocr_engine.py`.

No VGG-Face, RetinaFace, MTCNN, ArcFace, or Facenet512 model is required by the application path.

## Cached Model Files

### DeepFace

Directory: `C:\Users\thumm\.deepface\weights\`

- `facenet_weights.h5` - 92,190,816 bytes, required by this application
- `vgg_face_weights.h5` - 580,085,408 bytes, pre-existing and not required by this application path

Approximate DeepFace model storage: 672 MiB for both files, or 88 MiB for the required Facenet file alone.

### EasyOCR

Directory: `C:\Users\thumm\.EasyOCR\model\`

- `craft_mlt_25k.pth` - 83,152,330 bytes, English text detector
- `english_g2.pth` - 15,143,997 bytes, English text recognizer

Approximate EasyOCR model storage: 94 MiB.

EasyOCR also has a duplicate cache at `C:\Users\thumm\.easyocr\model\` with the same two files. The project configuration resolves to `C:\Users\thumm\.EasyOCR\`.

### OpenCV Detector

- `C:\Users\thumm\AppData\Local\Programs\Python\Python311\Lib\site-packages\cv2\data\haarcascade_frontalface_default.xml`

The file exists and loads successfully with `cv2.CascadeClassifier`.

### Approximate Disk Space

Allow at least 1 GB for the model caches, package caches, and temporary downloads. The verified model files themselves use approximately 766 MB decimal when including the pre-existing VGG-Face file, or approximately 107 MB for only the application-required Facenet and EasyOCR files.

## Exact Setup Commands Used

All commands used the specified interpreter:

```powershell
$python = 'C:\Users\thumm\AppData\Local\Programs\Python\Python311\python.exe'

& $python -c "import deepface, easyocr, tensorflow, tf_keras, cv2, PIL; print(deepface.__version__); print(easyocr.__version__); print(tensorflow.__version__); print(tf_keras.__version__); print(cv2.__version__); print(PIL.__version__)"

& $python -c "from deepface import DeepFace; DeepFace.build_model('Facenet')"

& $python -c "import easyocr; reader = easyocr.Reader(['en'], gpu=False); print(type(reader).__name__)"

& $python -m pip install --force-reinstall --no-deps opencv-python==4.11.0.86 opencv-python-headless==4.11.0.86
```

`DeepFace.build_model('Facenet')` downloaded `facenet_weights.h5` because it was missing. The EasyOCR Reader initialization found the existing cached files and did not require a new download.

The OpenCV repair was necessary because the previously installed 5.0.0.93 package did not contain `haarcascade_frontalface_default.xml`. Matching 4.11.0.86 standard and headless wheels were installed with the current Python interpreter. Python was not changed.

## Verification Commands

```powershell
$python = 'C:\Users\thumm\AppData\Local\Programs\Python\Python311\python.exe'

& $python -c "import cv2, os; path=os.path.join(cv2.data.haarcascades, 'haarcascade_frontalface_default.xml'); print(cv2.__version__, path, os.path.isfile(path)); print(not cv2.CascadeClassifier(path).empty())"

& $python -c "from deepface import DeepFace; print(type(DeepFace.build_model('Facenet')).__name__)"

& $python -c "import easyocr; print(type(easyocr.Reader(['en'], gpu=False)).__name__)"
```

For a real local face verification using the supplied passport images:

```powershell
$one = 'C:\Users\thumm\Downloads\WhatsApp Image 2026-08-30 at 1.00.33 AM.jpeg'
$two = 'C:\Users\thumm\Downloads\WhatsApp Image 2026-08-30 at 12.43.07 AM.jpeg'
Set-Location 'C:\sih26188\sih26188_complete_build\backend'
& $python -c "from modules.face_matcher import verify_identity; print(verify_identity(r'$one', r'$two'))"
```

Observed result:

```text
{'match': False, 'confidence': 0.0057, 'threshold': 0.4, 'model': 'Facenet', 'distance': 0.9943}
```

For a real local OCR test:

```powershell
$image = 'C:\Users\thumm\Downloads\WhatsApp Image 2026-08-30 at 12.43.07 AM.jpeg'
& $python -c "from modules.ocr_engine import get_easyocr_reader; reader=get_easyocr_reader(); print(reader.readtext(r'$image', detail=0))"
```

Observed result: EasyOCR returned 42 text items, including `NEPAL PASSPORT`, `E9876543`, `GAMPA`, `ANURAG`, `NEPALI`, and the MRZ text.

## Fresh Hackathon Machine

1. Install the same 64-bit Python 3.11 environment.
2. Install the project dependencies from `backend/requirements.txt`, plus the already-approved TensorFlow, tf-keras, DeepFace, and EasyOCR dependencies as needed.
3. Use the current Python interpreter to initialize `DeepFace.build_model('Facenet')` once.
4. Use `easyocr.Reader(['en'], gpu=False)` once.
5. Confirm the OpenCV Haar cascade exists and loads.
6. Copy the resulting user cache directories to the same user profile on the demo machine, or perform the initialization while internet is available.
7. Start the Flask backend and frontend.
8. Run one face verification and one OCR check before the presentation.

Model caches are user-profile locations, not repository files. Do not commit the large model weights into Git.

## Hackathon Pre-Demo Checklist

- [ ] DeepFace installed
- [ ] DeepFace weights downloaded
- [ ] OpenCV detector available
- [ ] EasyOCR installed
- [ ] EasyOCR weights downloaded
- [ ] Application starts successfully
- [ ] Face verification tested
- [ ] OCR tested
- [ ] Offline/cache test completed

## Offline Readiness

The required DeepFace Facenet model, EasyOCR English detector/recognizer, and OpenCV Haar cascade are present and loaded successfully from local paths. The second DeepFace and EasyOCR initialization completed without download messages, so the model layer is prepared for offline use after setup.

The two supplied passport images were used for a real DeepFace test and produced a correct non-match. EasyOCR successfully processed one supplied passport image. The project test suite was run with the specified interpreter and all 7 tests passed. The complete browser workflow was verified through Vite to Flask using a synthetic Nepal document and a local selfie. OCR, validation, tamper detection, face verification, risk scoring, PDF report generation, JSON response serialization, and React result display all completed successfully.

Tesseract is not installed on this machine, so OCR logs a warning and falls back to the configured EasyOCR reader. EasyOCR successfully processed the document, so this does not block the demo; install Tesseract separately only if the primary OCR path is required.
