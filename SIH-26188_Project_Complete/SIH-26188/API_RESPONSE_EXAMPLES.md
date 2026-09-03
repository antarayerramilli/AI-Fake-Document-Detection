# API Response Examples - Photo vs Document

## EXAMPLE 1: Photo/Selfie Upload (AFTER FIX)

### Request
```bash
curl -X POST http://localhost:5000/api/screen \
  -F "document=@user_selfie.jpg" \
  -F "document_type=indian_passport"
```

### Response (Status: 200)
```json
{
  "success": true,
  "timestamp": "2026-08-31T21:15:42.123456",
  "document_type": "indian_passport",
  
  "document_validity": {
    "is_valid_document": false,
    "confidence": 0.87,
    "error_type": "PORTRAIT_INSTEAD_OF_DOCUMENT",
    "reasons": [
      "Image appears to be a portrait/selfie (confidence: 0.87)",
      "Face region detected occupying 42% of image"
    ],
    "warnings": [
      "⚠ CRITICAL: Portrait/selfie uploaded instead of border document"
    ]
  },
  
  "extracted_data": {
    "raw_text": "hello world smile photo",
    "fields": {}
  },
  
  "validation": {
    "valid_format": false,
    "valid_dates": false,
    "valid_district": false,
    "district_validation_is_definitive": true,
    "document_type_error": true,
    "errors": [
      "⚠ CRITICAL: Portrait/selfie uploaded instead of border document"
    ],
    "warnings": []
  },
  
  "tampering": {
    "ela_detected": false,
    "ela_ratio": 0.0,
    "metadata_edited": false,
    "photo_inconsistent": false
  },
  
  "face_verification": null,
  
  "risk_score": 70,
  "risk_level": "RED",
  "risk_action": "REJECTED — Not a valid border document",
  "risk_reasons": [
    "⚠ CRITICAL: PORTRAIT_INSTEAD_OF_DOCUMENT — Not a valid border document",
    "Image appears to be a portrait/selfie (confidence: 0.87)"
  ],
  
  "risk_breakdown": {
    "document_validity_penalty": 70,
    "validation_penalty": 0,
    "tampering_penalty": 0,
    "face_penalty": 0
  },
  
  "report_filename": "report_20260831_211542_a1b2c3d4.pdf"
}
```

**KEY OBSERVATIONS:**
- ✅ `document_validity.is_valid_document`: **false**
- ✅ `document_validity.error_type`: **"PORTRAIT_INSTEAD_OF_DOCUMENT"**
- ✅ `risk_score`: **70/100** (HIGH - IMMEDIATE)
- ✅ `risk_level`: **"RED"**
- ✅ `risk_action`: **"REJECTED — Not a valid border document"**
- ✅ Only `document_validity_penalty`: 70 (other penalties: 0)
- ✅ Early rejection - no face verification, no tampering check

---

## EXAMPLE 2: Valid Passport Upload (CONTROL)

### Request
```bash
curl -X POST http://localhost:5000/api/screen \
  -F "document=@valid_passport.jpg" \
  -F "document_type=indian_passport" \
  -F "selfie=@matching_face.jpg"
```

### Response (Status: 200)
```json
{
  "success": true,
  "timestamp": "2026-08-31T21:16:15.654321",
  "document_type": "indian_passport",
  
  "document_validity": {
    "is_valid_document": true,
    "confidence": 0.98,
    "error_type": null,
    "reasons": [
      "Document patterns detected: ['passport', 'indian_passport', 'general']",
      "Found 12 passport-related text patterns"
    ],
    "warnings": [],
    "detected_patterns": [
      ["passport", 5],
      ["indian_passport", 4],
      ["general", 3]
    ]
  },
  
  "extracted_data": {
    "raw_text": "PASSPORT INDIA MRZ VALID UNTIL 2030...",
    "document_number": "P1234567",
    "surname": "SHARMA",
    "given_name": "RAJESH",
    "nationality": "IND",
    "date_of_birth": "1990-05-15",
    "date_of_issue": "2020-03-12",
    "date_of_expiry": "2030-03-12",
    "gender": "M"
  },
  
  "validation": {
    "valid_format": true,
    "valid_dates": true,
    "valid_district": true,
    "valid_blacklist": true,
    "errors": [],
    "warnings": []
  },
  
  "tampering": {
    "ela_detected": false,
    "ela_ratio": 0.002,
    "metadata_edited": false,
    "photo_inconsistent": false
  },
  
  "face_verification": {
    "match": true,
    "confidence": 0.92,
    "distance": 0.18,
    "threshold": 0.4,
    "model": "Facenet (MOCK)"
  },
  
  "risk_score": 5,
  "risk_level": "GREEN",
  "risk_action": "CLEAR — Proceed",
  "risk_reasons": [
    "✓ Document is valid border document",
    "✓ Face verification matched",
    "Document patterns detected: ['passport', 'indian_passport', 'general']"
  ],
  
  "risk_breakdown": {
    "document_validity_penalty": 0,
    "validation_penalty": 0,
    "tampering_penalty": 0,
    "face_penalty": 0
  },
  
  "report_filename": "report_20260831_211615_x9y8z7w6.pdf"
}
```

**KEY OBSERVATIONS:**
- ✅ `document_validity.is_valid_document`: **true**
- ✅ `document_validity.confidence`: **0.98**
- ✅ `validation.valid_format`: **true**
- ✅ `validation.valid_dates`: **true**
- ✅ `face_verification.match`: **true**
- ✅ `risk_score`: **5/100** (GREEN)
- ✅ All penalties: 0
- ✅ Full pipeline executed successfully

---

## EXAMPLE 3: Random Image Upload (NO FACES)

### Request
```bash
curl -X POST http://localhost:5000/api/screen \
  -F "document=@landscape_photo.jpg" \
  -F "document_type=nepal_citizenship"
```

### Response (Status: 200)
```json
{
  "success": true,
  "timestamp": "2026-08-31T21:17:08.987654",
  "document_type": "nepal_citizenship",
  
  "document_validity": {
    "is_valid_document": false,
    "confidence": 0.95,
    "error_type": "NO_DOCUMENT_PATTERNS",
    "reasons": [
      "No border document text patterns detected in OCR"
    ],
    "warnings": [
      "⚠ Image quality too low or not a document"
    ]
  },
  
  "extracted_data": {
    "raw_text": "mountain sky clouds landscape beautiful day",
    "fields": {}
  },
  
  "validation": {
    "valid_format": false,
    "valid_dates": false,
    "valid_district": false,
    "document_type_error": true,
    "errors": [
      "⚠ CRITICAL: No_DOCUMENT_PATTERNS — Not a valid border document"
    ],
    "warnings": []
  },
  
  "tampering": {
    "ela_detected": false,
    "ela_ratio": 0.0,
    "metadata_edited": false,
    "photo_inconsistent": false
  },
  
  "face_verification": null,
  
  "risk_score": 70,
  "risk_level": "RED",
  "risk_action": "REJECTED — Not a valid border document",
  "risk_reasons": [
    "⚠ CRITICAL: NO_DOCUMENT_PATTERNS — Not a valid border document",
    "No border document text patterns detected in OCR"
  ],
  
  "risk_breakdown": {
    "document_validity_penalty": 70,
    "validation_penalty": 0,
    "tampering_penalty": 0,
    "face_penalty": 0
  },
  
  "report_filename": "report_20260831_211708_m5n4o3p2.pdf"
}
```

**KEY OBSERVATIONS:**
- ✅ `document_validity.is_valid_document`: **false**
- ✅ `document_validity.error_type`: **"NO_DOCUMENT_PATTERNS"**
- ✅ `extracted_data` shows random text (no document patterns)
- ✅ `risk_score`: **70/100** (RED)
- ✅ Immediate rejection without checking validation/tampering
- ✅ All validation fields: false

---

## EXAMPLE 4: Insufficient Text Image

### Request
```bash
curl -X POST http://localhost:5000/api/screen \
  -F "document=@blurry_image.jpg" \
  -F "document_type=indian_epic"
```

### Response (Status: 200)
```json
{
  "success": true,
  "timestamp": "2026-08-31T21:18:00.111111",
  "document_type": "indian_epic",
  
  "document_validity": {
    "is_valid_document": false,
    "confidence": 0.85,
    "error_type": "INSUFFICIENT_TEXT",
    "reasons": [
      "Very low text extraction (12 chars)"
    ],
    "warnings": [
      "⚠ Image quality too low or not a document"
    ]
  },
  
  "extracted_data": {
    "raw_text": "blur vote",
    "fields": {}
  },
  
  "validation": {
    "valid_format": false,
    "document_type_error": true,
    "errors": [
      "⚠ CRITICAL: INSUFFICIENT_TEXT — Not a valid border document"
    ]
  },
  
  "risk_score": 70,
  "risk_level": "RED",
  "risk_action": "REJECTED — Not a valid border document",
  "risk_reasons": [
    "⚠ CRITICAL: INSUFFICIENT_TEXT — Not a valid border document",
    "Very low text extraction (12 chars)"
  ],
  
  "risk_breakdown": {
    "document_validity_penalty": 70,
    "validation_penalty": 0,
    "tampering_penalty": 0,
    "face_penalty": 0
  },
  
  "report_filename": "report_20260831_211800_a1a2a3a4.pdf"
}
```

**KEY OBSERVATIONS:**
- ✅ `document_validity.error_type`: **"INSUFFICIENT_TEXT"**
- ✅ `extracted_data.raw_text` is very short (< 50 chars)
- ✅ `risk_score`: **70/100** (RED)
- ✅ Clear message about image quality

---

## Response Field Comparison Table

| Field | Photo Upload | Valid Doc | Random Image | Insufficient |
|-------|--------------|-----------|--------------|--------------|
| **document_validity** | ❌ false | ✅ true | ❌ false | ❌ false |
| **error_type** | PORTRAIT | null | NO_PATTERNS | INSUFFICIENT |
| **confidence** | 0.87 | 0.98 | 0.95 | 0.85 |
| **risk_score** | 70 | 5 | 70 | 70 |
| **risk_level** | RED | GREEN | RED | RED |
| **validation.valid_format** | false | true | false | false |
| **extracted fields** | none | all | none | none |
| **face_verification** | null | true | null | null |
| **tampering checked** | no | yes | no | no |
| **time to response** | 🚀 Fast | ⏱️ Medium | 🚀 Fast | 🚀 Fast |

---

## HTTP Status Codes

All responses return **200 OK** even on failure because:
- Invalid input is validated at application level, not HTTP level
- `success` field indicates actual validation success
- `risk_level` indicates severity (RED = rejected)
- PDF report is generated regardless of outcome
- Users get structured feedback for debugging

```
200 OK with success=true → Document accepted
200 OK with success=true + RED level → Document rejected
400 Bad Request → Missing required fields
429 Too Many Requests → Rate limit exceeded
500 Server Error → Unexpected backend error
```

---

## Summary of Key Differences

### Photo Upload (Photo vs Document)

**BEFORE Enhancement:**
```
Document Upload → OCR Fails → Validation Fails → RED (confusing)
```

**AFTER Enhancement:**
```
Photo Upload → Document Check Fails → IMMEDIATE REJECTION
              ↓
Risk Score: 70/100 (RED)
Action: "REJECTED — Not a valid border document"
Reason: "PORTRAIT_INSTEAD_OF_DOCUMENT"
```

**Result**: Users get crystal-clear feedback on why the submission failed! ✅
