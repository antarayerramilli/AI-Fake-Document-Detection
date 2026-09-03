"""
Module 4: Face Verification Engine
DeepFace wrapper for document-to-selfie matching
"""

import os

# For demo/hackathon: if DeepFace model fails, use mock
USE_MOCK = os.environ.get('DEEPFACE_MOCK', 'false').lower() == 'true'

if not USE_MOCK:
    try:
        from deepface import DeepFace
    except Exception:
        USE_MOCK = True  # Fall back to mock if import fails

def verify_identity(document_image_path, live_selfie_path, 
                     model_name='Facenet', 
                     detector_backend='opencv',
                     distance_threshold=None):
    """
    Compare document photo with live selfie.
    Returns match result with confidence score.
    """
    if USE_MOCK:
        import random
        is_match = random.random() > 0.3
        return {
            'match': is_match,
            'confidence': round(random.uniform(0.1, 0.9), 4),
            'threshold': 0.4,
            'model': f'{model_name} (MOCK)',
            'distance': round(random.uniform(0.1, 0.9), 4),
        }

    try:
        result = DeepFace.verify(
            img1_path=document_image_path,
            img2_path=live_selfie_path,
            model_name=model_name,
            detector_backend=detector_backend,
            enforce_detection=False,  # Don't fail if face not detected
        )

        return {
            'match': result.get('verified', False),
            'confidence': round(1 - result.get('distance', 1), 4),
            'threshold': result.get('threshold', 0.4),
            'model': model_name,
            'distance': round(result.get('distance', 1), 4),
        }
    except Exception as e:
        return {
            'match': False,
            'confidence': 0,
            'threshold': 0.4,
            'model': model_name,
            'error': str(e),
        }
