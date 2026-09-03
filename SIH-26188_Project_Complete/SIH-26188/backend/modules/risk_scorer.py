"""
Module 5: Risk Scoring Engine
Combines all module outputs into a calibrated 0-100 risk score and explainable decision.
"""

def calculate_risk_score(extracted_data, validation_results, tamper_results, face_result=None, document_validity=None):
    """
    Calculate risk score (0-100) based on:
    - Document Type Validity (70-100 points) - Is it even a border document?
    - Face verification (50 points) - Live identity verification
    - Validation failures (geographic, format, dates, blacklist)
    - Tampering indicators (ELA, metadata, photo noise)
    """
    score = 0
    reasons = []

    # === 1. DOCUMENT VALIDITY (HIGHEST PRIORITY) ===
    if document_validity and not document_validity.get('is_valid_document'):
        error_type = document_validity.get('error_type', 'Invalid Document')
        type_mismatch = document_validity.get('type_mismatch', {})
        
        if error_type == 'DOCUMENT_TYPE_MISMATCH' and type_mismatch:
            score = 80
            level = 'RED'
            action = f"REJECTED — Incorrect document type uploaded (Detected: {type_mismatch.get('detected_label')})"
            reasons.append(f"CRITICAL: {type_mismatch.get('error_message')}")
            reasons.append(type_mismatch.get('guidance_message', 'Please upload the correct document.'))
        elif error_type == 'PORTRAIT_INSTEAD_OF_DOCUMENT':
            score = 75
            level = 'RED'
            action = 'REJECTED — Portrait/selfie uploaded instead of border document'
            reasons.append("CRITICAL: Image is a personal selfie/portrait, not a valid border document")
            for warning in document_validity.get('warnings', []):
                if warning not in reasons:
                    reasons.append(warning)
        else:
            score = 70
            level = 'RED'
            action = 'REJECTED — Not a valid border document'
            reasons.append(f"CRITICAL: {error_type} — Not a valid border document")
            for warning in document_validity.get('warnings', []):
                if warning not in reasons:
                    reasons.append(warning)
        
        final_score = min(score, 100)
        
        return {
            'score': final_score,
            'level': level,
            'action': action,
            'reasons': reasons,
            'breakdown': {
                'document_validity_penalty': final_score,
                'face_penalty': 0,
                'tampering_penalty': 0,
                'validation_penalty': 0,
            }
        }

    # === 2. FACE VERIFICATION (80 pts - CRITICAL IMPERSONATION RISK) ===
    face_penalty = 0
    if face_result is not None:
        if not face_result.get('match', True):
            face_penalty = 80
            score += 80
            reasons.append("CRITICAL: Face verification failed — Impersonation risk detected (Mismatch with document photo)")
        else:
            reasons.append("Face verification matched")

    # === 3. VALIDATION FAILURES ===
    validation_score, validation_reasons = score_from_validation(validation_results)
    score += validation_score
    reasons.extend(validation_reasons)

    # === 4. TAMPERING INDICATORS ===
    tampering_score = 0
    if tamper_results.get('ela_detected'):
        tampering_score += 12
        reasons.append(f"Digital manipulation detected (ELA ratio: {tamper_results.get('ela_ratio', 0)})")

    if tamper_results.get('metadata_edited'):
        tampering_score += 8
        reasons.append(f"Metadata indicates editing software: {tamper_results.get('metadata_software')}")

    if tamper_results.get('photo_inconsistent'):
        tampering_score += 15
        reasons.append("Photo region sensor noise inconsistent with document background")

    score += tampering_score

    # Cap at 100
    final_score = min(score, 100)

    # Determine risk level and action
    if final_score <= 30:
        level = 'GREEN'
        action = 'CLEAR — Proceed'
    elif final_score <= 70:
        level = 'YELLOW'
        action = 'SUSPICIOUS — Secondary inspection required'
    else:
        level = 'RED'
        action = 'HIGH RISK — Detain and investigate'

    return {
        'score': final_score,
        'level': level,
        'action': action,
        'reasons': reasons,
        'breakdown': {
            'document_validity_penalty': 0,
            'validation_penalty': validation_score,
            'tampering_penalty': min(tampering_score, 35),
            'face_penalty': face_penalty,
        }
    }

def score_from_validation(v):
    """Calculate validation penalty score and reasons."""
    if not v:
        return 0, []

    score = 0
    reasons = []
    errors = v.get('errors', [])
    lower_errors = [error.lower() for error in errors]

    # 1. Geographic validation (district / dzongkhag / constituency)
    if not v.get('valid_district', True):
        if v.get('district_validation_is_definitive', False):
            score += 75  # Definitive fraud: invalid district in Nepal/Bhutan
        else:
            # India constituency check
            score += 60 if not v.get('valid_format', True) else 50
        reasons.append("District/constituency validation failed")

    # 2. Document format validation
    has_separate_format_error = any(
        not any(term in error for term in (
            'district', 'constituency', 'dzongkhag',
            'blacklist', 'date', 'expired'
        ))
        for error in lower_errors
    )
    
    if not v.get('valid_format', True):
        if not v.get('district_validation_is_definitive', False) and (has_separate_format_error or not errors):
            score += 40
            reasons.append("Invalid document format")

    # 3. Date validation (expired passport / invalid issue date)
    if not v.get('valid_dates', True):
        if any('expired' in e for e in lower_errors) or any('before 1985' in e for e in lower_errors):
            score += 75
            reasons.append("Document is expired or invalid issue date")
        else:
            score += 15
            reasons.append("Date validation failed")

    # 4. Blacklist validation
    if any('blacklist' in error for error in lower_errors):
        score += 80
        reasons.append("Document is BLACKLISTED")

    # 5. Fraudulent Visa endorsement
    if any('visa' in error for error in lower_errors):
        score += 75
        reasons.append("Invalid or fraudulent Visa endorsement")

    return min(score, 100), reasons

def score_from_tampering(t):
    s = 0
    if t.get('ela_detected'): s += 12
    if t.get('metadata_edited'): s += 8
    if t.get('photo_inconsistent'): s += 15
    return min(s, 35)
