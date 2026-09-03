"""
Module 3: Tampering Detection Engine
ELA (Error Level Analysis) + Metadata Analysis + High-Frequency Photo Residual Noise Consistency
"""

import cv2
import numpy as np
from PIL import Image
from PIL.ExifTags import TAGS
import os
import tempfile

def find_tampered_regions(ela_image):
    """Analyze an ELA image and return bounding boxes for unusually high-error areas."""
    if ela_image is None:
        return []

    if isinstance(ela_image, Image.Image):
        image = np.asarray(ela_image.convert('RGB'))
    else:
        image = np.asarray(ela_image)

    if image.size == 0:
        return []

    if image.ndim == 2:
        gray = image.astype(np.uint8)
    elif image.ndim == 3:
        if image.shape[2] == 4:
            image = cv2.cvtColor(image, cv2.COLOR_BGRA2BGR)
        if image.shape[2] == 3:
            gray = cv2.cvtColor(image, cv2.COLOR_BGR2GRAY)
        else:
            return []
    else:
        return []

    # Blur reduces random noise before thresholding
    blurred = cv2.GaussianBlur(gray, (5, 5), 0)

    # High-error ELA pixels are brighter than typical background
    threshold_value = max(35, int(np.percentile(blurred, 98)))
    _, thresh = cv2.threshold(blurred, threshold_value, 255, cv2.THRESH_BINARY)

    contours, _ = cv2.findContours(thresh, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)

    image_area = gray.shape[0] * gray.shape[1]
    min_area = max(80, int(image_area * 0.001))

    boxes = []
    for contour in contours:
        area = cv2.contourArea(contour)
        if area < min_area:
            continue

        x, y, width, height = cv2.boundingRect(contour)
        boxes.append({
            'x': int(x),
            'y': int(y),
            'width': int(width),
            'height': int(height),
            'area': int(area),
        })

    return boxes

def error_level_analysis(image_path, quality=90, threshold=0.08):
    """
    Error Level Analysis: Re-save image at known quality, compare difference.
    Tampered regions often have different compression artifacts.
    """
    try:
        original = cv2.imread(image_path)
        if original is None:
            return {'ela_detected': False, 'ela_ratio': 0.0, 'ela_error': 'Could not load image'}

        # Close descriptor before OpenCV writes (Windows safe)
        file_descriptor, temp_path = tempfile.mkstemp(suffix='.jpg')
        os.close(file_descriptor)
        cv2.imwrite(temp_path, original, [cv2.IMWRITE_JPEG_QUALITY, quality])
        compressed = cv2.imread(temp_path)
        if os.path.exists(temp_path):
            os.remove(temp_path)

        # Compute absolute difference
        diff = cv2.absdiff(original, compressed)
        diff = cv2.convertScaleAbs(diff, alpha=15)

        gray = cv2.cvtColor(diff, cv2.COLOR_BGR2GRAY)
        _, thresh = cv2.threshold(gray, 60, 255, cv2.THRESH_BINARY)

        tamper_ratio = np.count_nonzero(thresh) / float(thresh.shape[0] * thresh.shape[1])

        return {
            'ela_detected': bool(tamper_ratio > threshold),
            'ela_ratio': float(round(tamper_ratio, 4)),
            'ela_threshold': threshold,
            'suspected_regions': find_tampered_regions(diff),
        }
    except Exception as e:
        return {'ela_detected': False, 'ela_ratio': 0.0, 'ela_error': str(e)}

def check_metadata(image_path):
    """Check EXIF metadata for editing software traces."""
    try:
        img = Image.open(image_path)
        exif = img._getexif()

        if not exif:
            return {'metadata_edited': False, 'metadata_software': None}

        software = ""
        for tag_id, value in exif.items():
            tag = TAGS.get(tag_id, tag_id)
            if tag == "Software":
                software = str(value)
                break

        suspicious_software = ['Photoshop', 'GIMP', 'Paint.NET', 'Canva', 'Figma', 'Adobe']
        is_edited = any(s.lower() in software.lower() for s in suspicious_software)

        return {
            'metadata_edited': bool(is_edited),
            'metadata_software': software if software else None,
        }
    except Exception as e:
        return {'metadata_edited': False, 'metadata_software': None, 'metadata_error': str(e)}

def photo_noise_analysis(image_path, photo_bbox=None, threshold=12.0):
    """
    Compare high-frequency sensor noise residuals between photo region
    and the rest of the document.
    """
    try:
        img = cv2.imread(image_path)
        if img is None:
            return {'photo_inconsistent': False, 'photo_noise_diff': 0.0}

        h, w = img.shape[:2]
        gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)

        # High-pass filter to isolate high-frequency sensor/compression noise from macro content
        blurred = cv2.GaussianBlur(gray, (5, 5), 0)
        noise_residual = cv2.absdiff(gray, blurred)

        if photo_bbox is None:
            # Check for detected face
            cascade_path = cv2.data.haarcascades + 'haarcascade_frontalface_default.xml'
            face_cascade = cv2.CascadeClassifier(cascade_path)
            faces = face_cascade.detectMultiScale(gray, 1.3, 4)
            if len(faces) > 0:
                photo_bbox = faces[0]
            else:
                photo_bbox = (int(w*0.05), int(h*0.15), int(w*0.25), int(h*0.35))

        x, y, pw, ph = photo_bbox
        x, y = max(0, x), max(0, y)
        pw, ph = min(pw, w - x), min(ph, h - y)

        if pw <= 0 or ph <= 0:
            return {'photo_inconsistent': False, 'photo_noise_diff': 0.0}

        photo_residual = noise_residual[y:y+ph, x:x+pw]

        mask = np.ones((h, w), dtype=np.uint8)
        mask[y:y+ph, x:x+pw] = 0
        rest_residual = noise_residual[mask == 1]

        if photo_residual.size == 0 or rest_residual.size == 0:
            return {'photo_inconsistent': False, 'photo_noise_diff': 0.0}

        photo_noise_std = float(np.std(photo_residual))
        rest_noise_std = float(np.std(rest_residual))

        noise_diff = abs(photo_noise_std - rest_noise_std)

        return {
            'photo_inconsistent': bool(noise_diff > threshold),
            'photo_noise_diff': float(round(noise_diff, 2)),
            'photo_noise_threshold': threshold,
        }
    except Exception as e:
        return {'photo_inconsistent': False, 'photo_noise_diff': 0.0, 'photo_error': str(e)}

def detect_tampering(image_path, face_bbox=None):
    """Main tampering detection router."""
    ela = error_level_analysis(image_path)
    meta = check_metadata(image_path)
    photo = photo_noise_analysis(image_path, photo_bbox=face_bbox)

    return {
        **ela,
        **meta,
        **photo,
        'tamper_detected': bool(
            ela.get('ela_detected') or meta.get('metadata_edited') or photo.get('photo_inconsistent')
        ),
    }
