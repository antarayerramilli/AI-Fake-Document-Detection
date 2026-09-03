import os
import sys
import json
from pathlib import Path

# Add backend directory to sys.path
backend_dir = Path(r"c:\SIH-26188-updated\SIH-26188\backend")
sys.path.insert(0, str(backend_dir))

from modules.ocr_engine import extract_fields
from modules.document_detector import detect_document_validity, is_portrait_photo
from modules.validator import validate_document
from modules.tamper_detector import detect_tampering
from modules.risk_scorer import calculate_risk_score

data_root = Path(r"c:\SIH-26188-updated\SIH-26188")

demo_documents = [
    # 1. NEPAL CITIZENSHIP
    ("data/nepal/nepal_citizenship_clean_1.png", "nepal_citizenship", "GREEN", "Valid Nepal document (Lalitpur/Bhaktapur)"),
    ("data/nepal/nepal_citizenship_clean_2.png", "nepal_citizenship", "GREEN", "Valid Nepal document (Bhaktapur)"),
    ("data/nepal/nepal_citizenship_tampered_3.png", "nepal_citizenship", "RED", "Tampered District 88 (Non-existent district)"),
    
    # 2. BHUTAN CID
    ("data/bhutan/bhutan_cid_clean_1.png", "bhutan_cid", "GREEN", "Valid Bhutan CID (Paro)"),
    ("data/bhutan/bhutan_cid_clean_2.png", "bhutan_cid", "GREEN", "Valid Bhutan CID (Punakha)"),
    ("data/bhutan/bhutan_cid_tampered_3.png", "bhutan_cid", "RED", "Tampered FakeDzong (Non-existent Dzongkhag)"),
    
    # 3. INDIA EPIC (VOTER ID)
    ("data/india_epic/india_epic_clean_1.png", "indian_epic", "GREEN", "Valid Indian Voter ID (Mumbai South)"),
    ("data/india_epic/india_epic_clean_2.png", "indian_epic", "GREEN", "Valid Indian Voter ID (Bangalore North)"),
    ("data/india_epic/india_epic_tampered_3.png", "indian_epic", "RED", "Tampered INVALID-EPIC number"),
    
    # 4. INDIA PASSPORT
    ("data/india_passport/india_passport_clean_1.png", "indian_passport", "GREEN", "Valid Indian Passport (Future expiry)"),
    ("data/india_passport/india_passport_clean_2.png", "indian_passport", "GREEN", "Valid Indian Passport (Future expiry)"),
    ("data/india_passport/india_passport_tampered_3.png", "indian_passport", "RED", "Tampered Expired Passport"),
    
    # 5. FOREIGN PASSPORT + INDIAN VISA
    ("data/foreign/foreign_passport_visa_clean_1.png", "foreign_passport", "GREEN", "Valid Foreign Passport + Indian Visa"),
    ("data/foreign/foreign_passport_visa_clean_2.png", "foreign_passport", "GREEN", "Valid Foreign Passport + Indian Visa"),
    ("data/foreign/foreign_passport_visa_tampered_3.png", "foreign_passport", "RED", "Tampered Fake Visa / Invalid"),
    
    # 6. GENUINE SCANNED PASSPORT IMAGES (WITH EMBEDDED FACES & MRZ)
    ("face1.jpg", "indian_passport", "GREEN", "Genuine Scanned Passport (Contains photo ID + MRZ)"),
    ("face2.jpg", "indian_passport", "GREEN", "Genuine Scanned Passport (Contains photo ID + MRZ)"),
    
    # 7. DOCUMENT TYPE MISMATCH TEST CASE
    ("face2.jpg", "nepal_citizenship", "RED", "Deliberate Mismatch: Upload Passport when Nepal Citizenship selected"),
]

print("=" * 90, flush=True)
print("SIH26188 COMPREHENSIVE FORENSIC VERIFICATION AUDIT MATRIX", flush=True)
print("=" * 90, flush=True)

passed_count = 0
failed_count = 0
results_table = []

for rel_path, doc_type, expected_level, test_desc in demo_documents:
    full_path = (data_root / rel_path).resolve()
    if not full_path.exists():
        print(f"[-] Missing file: {full_path}", flush=True)
        continue
    
    abs_path_str = str(full_path)
    
    # 1. OCR Field Extraction
    extracted = extract_fields(abs_path_str, doc_type)
    raw_text = extracted.get('raw_text', '')
    
    # 2. Document Validity Check (Selfie vs Document)
    doc_validity = detect_document_validity(abs_path_str, raw_text, doc_type)
    
    # 3. Rules & Format Validation
    validation = validate_document(extracted, doc_type, doc_validity)
    
    # 4. Tampering Analysis
    tampering = detect_tampering(abs_path_str, face_bbox=doc_validity.get('face_bbox'))
    
    # 5. Risk Scoring
    risk = calculate_risk_score(extracted, validation, tampering, None, doc_validity)
    
    actual_level = risk['level']
    actual_score = risk['score']
    action = risk['action']
    
    is_pass = (actual_level == expected_level) or (expected_level in ('RED', 'YELLOW') and actual_level in ('RED', 'YELLOW'))
    if is_pass:
        passed_count += 1
        status_icon = "[PASS]"
    else:
        failed_count += 1
        status_icon = "[FAIL]"
        
    print(f"\n{status_icon} {rel_path} ({doc_type})", flush=True)
    print(f"    Description: {test_desc}", flush=True)
    print(f"    Expected: {expected_level} | Actual: {actual_level} (Score: {actual_score}/100)", flush=True)
    print(f"    Action: {action}", flush=True)
    print(f"    Reasons: {risk.get('reasons')}", flush=True)
    print(f"    Breakdown: {risk.get('breakdown')}", flush=True)
    
    results_table.append({
        'file': rel_path,
        'type': doc_type,
        'expected': expected_level,
        'actual': actual_level,
        'score': actual_score,
        'status': "PASS" if is_pass else "FAIL",
        'action': action,
    })

# 7. EXPLICIT TEST: Pure Selfie / Non-Document Rejection
# Create a dummy portrait image (face with zero text) and verify it is REJECTED (RED)
import numpy as np
import cv2
dummy_selfie_path = str(data_root / "temp_dummy_selfie.jpg")
dummy_img = np.ones((500, 500, 3), dtype=np.uint8) * 200
# Draw a simple face circle
cv2.circle(dummy_img, (250, 220), 120, (140, 160, 200), -1)
cv2.imwrite(dummy_selfie_path, dummy_img)

doc_val_selfie = detect_document_validity(dummy_selfie_path, "", "indian_passport")
risk_selfie = calculate_risk_score({}, {}, {}, None, doc_val_selfie)
if os.path.exists(dummy_selfie_path):
    os.remove(dummy_selfie_path)

selfie_pass = (risk_selfie['level'] == 'RED' and not doc_val_selfie['is_valid_document'])
if selfie_pass:
    passed_count += 1
    print(f"\n[PASS] Pure Selfie Image Rejection Test", flush=True)
else:
    failed_count += 1
    print(f"\n[FAIL] Pure Selfie Image Rejection Test", flush=True)
print(f"    Expected: RED (REJECTED) | Actual: {risk_selfie['level']} (Score: {risk_selfie['score']}/100)", flush=True)
print(f"    Action: {risk_selfie['action']}", flush=True)

total_tests = len(demo_documents) + 1
print("\n" + "=" * 90, flush=True)
print(f"AUDIT SUMMARY: {passed_count}/{total_tests} PASSED ({failed_count} failures)", flush=True)
print("=" * 90, flush=True)
