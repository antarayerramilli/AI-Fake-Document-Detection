import os
import sys
import json
from pathlib import Path

import PIL.Image
if not hasattr(PIL.Image, 'ANTIALIAS'):
    PIL.Image.ANTIALIAS = PIL.Image.Resampling.LANCZOS

# Add backend directory to sys.path
backend_dir = Path(r"c:\SIH-26188-updated\SIH-26188\backend")
sys.path.insert(0, str(backend_dir))

from modules.ocr_engine import extract_text, extract_fields
from modules.document_detector import is_portrait_photo, has_document_text_patterns, detect_document_validity
from modules.validator import validate_document
from modules.tamper_detector import detect_tampering
from modules.risk_scorer import calculate_risk_score

data_root = Path(r"c:\SIH-26188-updated\SIH-26188")

test_cases = [
    # (filepath, doc_type, expected_outcome)
    ("data/nepal/nepal_citizenship_clean_1.png", "nepal_citizenship", "CLEAN / GREEN"),
    ("data/nepal/nepal_citizenship_clean_2.png", "nepal_citizenship", "CLEAN / GREEN"),
    ("data/nepal/nepal_citizenship_tampered_3.png", "nepal_citizenship", "TAMPERED (Invalid District 88) / RED"),
    
    ("data/bhutan/bhutan_cid_clean_1.png", "bhutan_cid", "CLEAN / GREEN"),
    ("data/bhutan/bhutan_cid_clean_2.png", "bhutan_cid", "CLEAN / GREEN"),
    ("data/bhutan/bhutan_cid_tampered_3.png", "bhutan_cid", "TAMPERED (Invalid Dzongkhag FakeDzong) / RED"),
    
    ("data/india_epic/india_epic_clean_1.png", "indian_epic", "CLEAN / GREEN"),
    ("data/india_epic/india_epic_clean_2.png", "indian_epic", "CLEAN / GREEN"),
    ("data/india_epic/india_epic_tampered_3.png", "indian_epic", "TAMPERED (Invalid EPIC format) / RED"),
    
    ("data/india_passport/india_passport_clean_1.png", "indian_passport", "CLEAN / GREEN"),
    ("data/india_passport/india_passport_clean_2.png", "india_passport", "CLEAN / GREEN"),
    ("data/india_passport/india_passport_tampered_3.png", "indian_passport", "TAMPERED (Expired) / RED or YELLOW"),
    
    ("data/foreign/foreign_passport_visa_clean_1.png", "foreign_passport", "CLEAN / GREEN"),
    ("data/foreign/foreign_passport_visa_clean_2.png", "foreign_passport", "CLEAN / GREEN"),
    ("data/foreign/foreign_passport_visa_tampered_3.png", "foreign_passport", "TAMPERED (Fake Visa) / RED"),
    
    ("face1.jpg", "indian_passport", "REJECTED (Selfie/Portrait, not a doc) / RED"),
    ("face2.jpg", "nepal_citizenship", "REJECTED (Selfie/Portrait, not a doc) / RED"),
]

print("=" * 80, flush=True)
print("AUDITING DEMO DOCUMENTS WITH CURRENT PIPELINE", flush=True)
print("=" * 80, flush=True)

for rel_path, doc_type, expected in test_cases:
    full_path = data_root / rel_path
    if not full_path.exists():
        print(f"[-] File not found: {full_path}", flush=True)
        continue
    
    print(f"\n=======================================================", flush=True)
    print(f"--- FILE: {rel_path} (Type: {doc_type}) ---", flush=True)
    print(f"Expected: {expected}", flush=True)
    
    # 1. OCR raw text
    try:
        raw_text = extract_text(str(full_path))
    except Exception as e:
        raw_text = f"OCR ERROR: {e}"
    print(f"Raw Text Sample ({len(raw_text)} chars): {repr(raw_text[:150])}", flush=True)
    
    # 2. Document validity check
    doc_validity = detect_document_validity(str(full_path), raw_text, doc_type)
    print(f"Doc Validity: is_valid={doc_validity.get('is_valid_document')} conf={doc_validity.get('confidence')} error={doc_validity.get('error_type')}", flush=True)
    print(f"Doc Validity Reasons: {doc_validity.get('reasons')}", flush=True)
    print(f"Doc Validity Warnings: {doc_validity.get('warnings')}", flush=True)
    
    # 3. Field Extraction
    extracted = extract_fields(str(full_path), doc_type)
    print(f"Extracted Fields: {json.dumps(extracted, default=str)}", flush=True)
    
    # 4. Validation
    validation = validate_document(extracted, doc_type, doc_validity)
    print(f"Validation: valid_format={validation.get('valid_format')}, valid_district={validation.get('valid_district')}, valid_dates={validation.get('valid_dates')}", flush=True)
    print(f"Validation Errors: {validation.get('errors')}", flush=True)
    print(f"Validation Warnings: {validation.get('warnings')}", flush=True)
    
    # 5. Tampering
    tampering = detect_tampering(str(full_path))
    print(f"Tampering: detected={tampering.get('tamper_detected')}, ela={tampering.get('ela_detected')} ({tampering.get('ela_ratio')}), photo_inconsistent={tampering.get('photo_inconsistent')} ({tampering.get('photo_noise_diff')})", flush=True)
    
    # 6. Risk Scoring
    risk = calculate_risk_score(extracted, validation, tampering, None, doc_validity)
    print(f"Risk Result: Score={risk['score']}, Level={risk['level']}, Action={risk['action']}", flush=True)
    print(f"Risk Breakdown: {risk.get('breakdown')}", flush=True)
    print(f"Risk Reasons: {risk.get('reasons')}", flush=True)

print("\nAudit script complete.", flush=True)
