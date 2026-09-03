"""
Module 0: Document Type Detector & Classifier
Validates whether the uploaded image is a valid border document, detects the specific document type,
and validates that the uploaded document matches the document type selected by the user.
"""

import cv2
import numpy as np
import re

# Human-readable labels for document types
DOC_TYPE_LABELS = {
    'indian_passport': 'Indian Passport',
    'foreign_passport': 'Foreign Passport + Indian Visa',
    'passport': 'Passport',
    'nepal_citizenship': 'Nepalese Citizenship Certificate',
    'bhutan_cid': 'Bhutanese Citizen Identity Card (CID)',
    'indian_epic': 'Indian Voter ID Card (EPIC)',
    'aadhaar': 'Aadhaar Card',
    'driving_licence': 'Driving Licence',
    'pan_card': 'PAN Card',
    'bangladesh_nid': 'Bangladesh National Identity Card (NID)',
    'unknown_document': 'Unrecognized Document',
    'portrait_photo': 'Personal Portrait / Selfie',
}

# Compatibility groupings (e.g. general passport matches indian_passport or foreign_passport)
COMPATIBLE_TYPES = {
    'indian_passport': {'indian_passport', 'passport'},
    'foreign_passport': {'foreign_passport', 'passport'},
    'nepal_citizenship': {'nepal_citizenship'},
    'bhutan_cid': {'bhutan_cid'},
    'indian_epic': {'indian_epic'},
    'bangladesh_nid': {'bangladesh_nid'},
}

def is_portrait_photo(image_path):
    """
    Check if image contains a prominent face.
    Returns: (is_portrait: bool, confidence: float, face_bbox: tuple or None)
    """
    try:
        img = cv2.imread(image_path)
        if img is None:
            return False, 0.0, None
        
        h, w = img.shape[:2]
        if h == 0 or w == 0:
            return False, 0.0, None

        gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)
        
        cascade_path = cv2.data.haarcascades + 'haarcascade_frontalface_default.xml'
        face_cascade = cv2.CascadeClassifier(cascade_path)
        faces = face_cascade.detectMultiScale(gray, scaleFactor=1.2, minNeighbors=4, minSize=(40, 40))
        
        if len(faces) > 0:
            largest_face = max(faces, key=lambda f: f[2] * f[3])
            fx, fy, fw, fh = largest_face
            face_area = fw * fh
            total_area = w * h
            face_ratio = face_area / float(total_area)
            return True, min(max(face_ratio * 3.0, 0.5), 1.0), (int(fx), int(fy), int(fw), int(fh))
        
        return False, 0.0, None
    except Exception:
        return False, 0.0, None

def get_document_patterns():
    """Returns regex pattern definitions for all supported and common document types."""
    return {
        'indian_passport': [
            (r'republic\s+of\s+india', 4),
            (r'passport\s+no', 3),
            (r'p<ind', 4),
            (r'indian\s+passport', 4),
            (r'mofa|passport\s+officer', 2),
        ],
        'foreign_passport': [
            (r'indian\s+visa', 5),
            (r'visa\s*(?:no|number)?', 3),
            (r'type:\s*(?:tourist|business|entry|employment)', 3),
            (r'foreign\s+passport', 3),
            (r'p<[a-z]{3}', 2),
        ],
        'passport': [
            (r'passport', 3),
            (r'p<[a-z]{3}', 4),
            (r'mrz|machine\s+readable', 3),
            (r'date\s+of\s+expiry|expiry\s+date', 2),
            (r'surname|given\s+names?', 2),
            (r'place\s+of\s+birth', 2),
            (r'holder\'?s?\s+signature', 2),
        ],
        'nepal_citizenship': [
            (r'citizenship\s*(?:certificate|no|number)?', 4),
            (r'nepal\s*citizenship', 5),
            (r'nagarikta|नागरिकता', 5),
            (r'नेपाल\s+सरकार', 4),
            (r'district:\s*[a-z]+', 3),
            (r'\b\d{4}[ -]\d{8}\b', 3),
        ],
        'bhutan_cid': [
            (r'citizen\s+identity\s+card', 5),
            (r'cid\s*(?:no|number)?', 4),
            (r'royal\s+government\s+of\s+bhutan', 4),
            (r'dzongkhag', 4),
            (r'nationality:\s*bhutanese', 3),
            (r'\b\d{11}\b', 2),
        ],
        'indian_epic': [
            (r'electors?\s+photo\s+identity\s+card', 5),
            (r'epic\s*(?:no|number)?', 4),
            (r'election\s+commission\s+of\s+india', 5),
            (r'constituency', 4),
            (r'elector\'?s?\s+name', 3),
            (r'voter\s+id', 4),
            (r'\b[a-z]{3}\d{7}\b', 3),
        ],
        'aadhaar': [
            (r'unique\s+identification\s+authority\s+of\s+india', 5),
            (r'uidai', 4),
            (r'aadhaar|aadhar', 5),
            (r'mera\s+aadhaar', 4),
            (r'\b\d{4}\s+\d{4}\s+\d{4}\b', 4),
            (r'enrolment\s+no', 3),
        ],
        'driving_licence': [
            (r'driving\s+licen[sc]e', 5),
            (r'motor\s+vehicles?\s+department', 4),
            (r'union\s+of\s+india\s+driving', 5),
            (r'dl\s*(?:no|number)', 4),
            (r'licen[sc]e\s*(?:no|number)', 3),
            (r'transport\s+department', 4),
            (r'form\s+7\b', 3),
            (r'cov:\s*(?:lmv|mcwg)', 3),
        ],
        'pan_card': [
            (r'permanent\s+account\s+number', 5),
            (r'income\s+tax\s+department', 5),
            (r'pan\s+card', 4),
            (r'\b[a-z]{5}\d{4}[a-z]\b', 4),
            (r'govt\.?\s+of\s+india\s+income\s+tax', 4),
        ],
        'bangladesh_nid': [
            (r'government\s+of\s+the\s+people\'?s?\s+republic\s+of\s+bangladesh', 6),
            (r'national\s+id\s+card', 5),
            (r'nid\s*(?:no|number)?', 4),
            (r'bangladesh', 4),
            (r'\b\d{10}\b|\b\d{13}\b|\b\d{17}\b', 3),
        ],
    }


def classify_document_type(extracted_text):
    """
    Classify extracted text into a specific document type.
    Returns: (detected_type_key, detected_type_label, confidence, score_breakdown)
    """
    if not extracted_text or len(extracted_text.strip()) < 8:
        return 'unknown_document', DOC_TYPE_LABELS['unknown_document'], 0.0, {}

    text_lower = extracted_text.lower()
    patterns_dict = get_document_patterns()
    scores = {}

    for doc_type, pattern_list in patterns_dict.items():
        score = 0
        for pattern, weight in pattern_list:
            if re.search(pattern, text_lower):
                score += weight
        if score > 0:
            scores[doc_type] = score

    if not scores:
        return 'unknown_document', DOC_TYPE_LABELS['unknown_document'], 0.0, {}

    # Prioritize specialized passport subtypes if both generic and specific match
    if 'indian_passport' in scores and 'passport' in scores:
        if scores['indian_passport'] >= 4:
            scores['indian_passport'] += scores['passport'] // 2
    if 'foreign_passport' in scores and 'passport' in scores:
        if scores['foreign_passport'] >= 4:
            scores['foreign_passport'] += scores['passport'] // 2

    # Find highest scoring type
    best_type = max(scores, key=scores.get)
    best_score = scores[best_type]
    
    # Normalize confidence (max typical score ~12)
    confidence = min(round(best_score / 10.0, 2), 1.0)
    label = DOC_TYPE_LABELS.get(best_type, best_type.replace('_', ' ').title())

    return best_type, label, confidence, scores

def validate_document_type_match(selected_doc_type, extracted_text):
    """
    Validates whether the uploaded document matches the user's selected document type.
    Returns a structured dictionary with match status and user-facing explanation.
    """
    detected_type, detected_label, confidence, scores = classify_document_type(extracted_text)
    selected_label = DOC_TYPE_LABELS.get(selected_doc_type, selected_doc_type.replace('_', ' ').title())

    # Case 1: Unrecognized document with minimal or no matches
    if detected_type == 'unknown_document':
        return {
            'is_type_match': True,  # Fallback to general validation rules if specific type not determined
            'selected_type': selected_doc_type,
            'selected_label': selected_label,
            'detected_type': 'unknown_document',
            'detected_label': 'Unrecognized Document',
            'confidence': 0.0,
            'error_message': None,
            'guidance_message': None,
        }

    # Case 2: Check compatibility
    compatible = COMPATIBLE_TYPES.get(selected_doc_type, {selected_doc_type})
    
    # If detected type is within compatible types (or general passport for specific passports)
    if detected_type in compatible or (selected_doc_type in ('indian_passport', 'foreign_passport') and detected_type == 'passport'):
        return {
            'is_type_match': True,
            'selected_type': selected_doc_type,
            'selected_label': selected_label,
            'detected_type': detected_type,
            'detected_label': detected_label,
            'confidence': confidence,
            'error_message': None,
            'guidance_message': None,
        }

    # Case 3: Definite Document-Type Mismatch
    # (e.g. selected Indian Passport, but uploaded Driving Licence, Aadhaar, Nepal Citizenship, or EPIC)
    error_msg = f"Incorrect document uploaded. You selected {selected_label}, but the uploaded document appears to be a {detected_label}."
    guidance_msg = f"Please upload the correct document ({selected_label})."

    return {
        'is_type_match': False,
        'selected_type': selected_doc_type,
        'selected_label': selected_label,
        'detected_type': detected_type,
        'detected_label': detected_label,
        'confidence': confidence,
        'error_message': error_msg,
        'guidance_message': guidance_msg,
    }

def has_document_text_patterns(text):
    """
    Check if extracted text contains any known border document patterns and structure.
    Returns: (has_patterns: bool, detected_patterns: list)
    """
    if not text or len(text.strip()) < 8:
        return False, []
    
    detected_type, label, confidence, scores = classify_document_type(text)
    detected_list = list(scores.items())
    has_patterns = len(detected_list) > 0
    return has_patterns, detected_list

def detect_document_validity(image_path, extracted_text, doc_type):
    """
    Comprehensive document validity & document-type mismatch verification.
    
    Rules:
    1. Pure Selfie/Portrait: Dominated by a face with NO document text -> REJECTED.
    2. Document-Type Mismatch: Uploaded document does not match selected type -> REJECTED.
    3. Random Non-Document: Minimal or no text, no structure -> REJECTED.
    4. Valid Matching Document: Genuine document matching selected type -> ACCEPTED.
    """
    reasons = []
    warnings = []
    text_length = len(extracted_text.strip()) if extracted_text else 0
    
    # Check 1: Face presence
    is_portrait, portrait_conf, face_bbox = is_portrait_photo(image_path)
    
    # Check 2: Classify document type & validate match
    type_match = validate_document_type_match(doc_type, extracted_text)
    has_patterns, detected_patterns = has_document_text_patterns(extracted_text)
    
    # CASE A: Pure Selfie/Portrait (No document text/patterns)
    if is_portrait and not has_patterns:
        reasons.append(f"Image is primarily a personal portrait/selfie (face confidence: {portrait_conf:.2f})")
        reasons.append("No border document text, headers, or structured identity fields detected")
        warnings.append("CRITICAL: Portrait/selfie uploaded instead of border document")
        return {
            'is_valid_document': False,
            'confidence': 0.90,
            'face_detected': True,
            'face_bbox': face_bbox,
            'reasons': reasons,
            'warnings': warnings,
            'error_type': 'PORTRAIT_INSTEAD_OF_DOCUMENT',
            'type_mismatch': type_match,
        }
    
    # CASE B: Document-Type Mismatch
    if not type_match['is_type_match']:
        reasons.append(f"Document type mismatch: Selected '{type_match['selected_label']}', but detected '{type_match['detected_label']}' (confidence: {type_match['confidence']:.2f})")
        warnings.append(type_match['error_message'])
        warnings.append(type_match['guidance_message'])
        return {
            'is_valid_document': False,
            'confidence': type_match['confidence'],
            'face_detected': is_portrait,
            'face_bbox': face_bbox,
            'reasons': reasons,
            'warnings': warnings,
            'error_type': 'DOCUMENT_TYPE_MISMATCH',
            'type_mismatch': type_match,
        }
    
    # CASE C: Valid Matching Document
    if has_patterns:
        pattern_types = [p[0] for p in detected_patterns]
        reasons.append(f"Valid border document patterns detected: {', '.join(set(pattern_types))}")
        reasons.append(f"Document type confirmed: {type_match['selected_label']}")
        if is_portrait:
            reasons.append("ID photograph detected within document frame")
        return {
            'is_valid_document': True,
            'confidence': 0.95,
            'face_detected': is_portrait,
            'face_bbox': face_bbox,
            'reasons': reasons,
            'warnings': [],
            'error_type': None,
            'type_mismatch': type_match,
        }
    
    # CASE D: Minimal or no text (Random non-document)
    if text_length < 25:
        reasons.append(f"Insufficient text extracted ({text_length} chars)")
        reasons.append("No border document patterns or identity structure identified")
        warnings.append("Image is not a valid border document")
        return {
            'is_valid_document': False,
            'confidence': 0.85,
            'face_detected': False,
            'face_bbox': None,
            'reasons': reasons,
            'warnings': warnings,
            'error_type': 'INSUFFICIENT_TEXT',
            'type_mismatch': type_match,
        }
    
    # CASE E: Unrecognized format
    reasons.append(f"Extracted {text_length} characters of text, but standard border patterns not matched")
    warnings.append("Document format not recognized — manual inspection required")
    return {
        'is_valid_document': False,
        'confidence': 0.65,
        'face_detected': False,
        'face_bbox': None,
        'reasons': reasons,
        'warnings': warnings,
        'error_type': 'NO_DOCUMENT_PATTERNS',
        'type_mismatch': type_match,
    }
