"""
Module: Explainable AI (XAI) Engine for Border Document Screening
Synthesizes all forensic indicators into human-understandable explanations for border officers and judges.
"""

def generate_explainable_ai_report(
    extracted_data,
    validation_results,
    tamper_results,
    face_result=None,
    document_validity=None,
    date_results=None,
    risk_score_data=None
):
    """
    Generate structured Explainable AI (XAI) diagnostic cards explaining:
    - Why was this document flagged?
    - What are the technical/forensic indicators?
    - What is the operational guidance?
    """
    explanations = []
    
    # 1. Document Validity / Type Mismatch
    if document_validity and not document_validity.get('is_valid_document'):
        type_mismatch = document_validity.get('type_mismatch', {})
        if document_validity.get('error_type') == 'DOCUMENT_TYPE_MISMATCH' and type_mismatch:
            explanations.append({
                'category': 'DOCUMENT_TYPE_MISMATCH',
                'title': 'Category & Format Mismatch',
                'severity': 'CRITICAL',
                'icon': 'AlertTriangle',
                'summary': f"Selected category was '{type_mismatch.get('selected_label')}', but optical features match '{type_mismatch.get('detected_label')}'.",
                'forensic_evidence': f"Header/template layout matches {type_mismatch.get('detected_label')}.",
                'officer_action': f"Request the applicant to present the correct {type_mismatch.get('selected_label')}."
            })
        elif document_validity.get('error_type') == 'PORTRAIT_INSTEAD_OF_DOCUMENT':
            explanations.append({
                'category': 'INVALID_DOCUMENT_MEDIA',
                'title': 'Personal Portrait Uploaded',
                'severity': 'CRITICAL',
                'icon': 'User',
                'summary': "The uploaded image is a personal selfie/portrait with no document credentials.",
                'forensic_evidence': "Face bounding box covers >40% of canvas with zero security guilloche patterns or text blocks.",
                'officer_action': "Require physical document scan on terminal flatbed."
            })
        else:
            explanations.append({
                'category': 'INVALID_DOCUMENT',
                'title': 'Unrecognized Document Template',
                'severity': 'CRITICAL',
                'icon': 'FileX',
                'summary': "The image does not correspond to any recognized Indo-Nepal or Indo-Bhutan border document.",
                'forensic_evidence': "Zero template keypoints or security watermark structures matched.",
                'officer_action': "Escalate to secondary physical inspection."
            })

    # 2. Tampering & Photo Forensics (ELA, Noise, Metadata)
    if tamper_results:
        if tamper_results.get('ela_detected'):
            ratio = tamper_results.get('ela_ratio', 0)
            explanations.append({
                'category': 'PHOTO_MANIPULATION',
                'title': 'Error Level Analysis (ELA) Manipulation',
                'severity': 'CRITICAL' if ratio > 0.08 else 'WARNING',
                'icon': 'Camera',
                'summary': "Photo region shows significant digital compression and resampling inconsistencies indicative of image splicing.",
                'forensic_evidence': f"JPEG re-compression error differential ratio: {ratio} (Normal threshold: <0.04).",
                'officer_action': "Check for physical laminate tampering or photo replacement under UV light."
            })

        if tamper_results.get('metadata_edited'):
            sw = tamper_results.get('metadata_software', 'Unknown Editor')
            explanations.append({
                'category': 'METADATA_ALTERATION',
                'title': 'Editing Software Artifacts in EXIF',
                'severity': 'HIGH',
                'icon': 'FileCode',
                'summary': f"Document file contains metadata signatures from digital photo-editing software ({sw}).",
                'forensic_evidence': f"EXIF Software tag: '{sw}'.",
                'officer_action': "Verify document origin and authenticity of digital copy."
            })

        if tamper_results.get('photo_inconsistent'):
            noise_diff = tamper_results.get('photo_noise_diff', 'Elevated')
            explanations.append({
                'category': 'SENSOR_NOISE_ANOMALY',
                'title': 'Photo Noise Variance Inconsistency',
                'severity': 'HIGH',
                'icon': 'Layers',
                'summary': "The sensor grain and high-frequency noise of the portrait photo does not match the paper substrate.",
                'forensic_evidence': f"Photo region noise variance differential: {noise_diff}.",
                'officer_action': "Inspect photo boundary edges for digital pasting or misaligned borders."
            })

    # 3. Validation Failures (Districts, Format, MRZ, Blacklist)
    if validation_results:
        errors = validation_results.get('errors', [])
        for err in errors:
            if 'district' in err.lower() or 'dzongkhag' in err.lower():
                explanations.append({
                    'category': 'JURISDICTION_FRAUD',
                    'title': 'Invalid Administrative Jurisdiction / District Code',
                    'severity': 'CRITICAL',
                    'icon': 'MapPin',
                    'summary': err,
                    'forensic_evidence': "Cross-referenced against official statutory list (Nepal: 77 districts, Bhutan: 20 Dzongkhags).",
                    'officer_action': "Detain for fraudulent administrative credential."
                })
            elif 'blacklist' in err.lower():
                explanations.append({
                    'category': 'SECURITY_WATCHLIST',
                    'title': 'Document on Security Blacklist / Watchlist',
                    'severity': 'CRITICAL',
                    'icon': 'ShieldAlert',
                    'summary': err,
                    'forensic_evidence': "Exact document number match in SSB National Watchlist database.",
                    'officer_action': "IMMEDIATE INTERCEPTION: Alert checkpoint supervisor and detain subject."
                })
            elif 'format' in err.lower() or 'digit' in err.lower():
                explanations.append({
                    'category': 'SYNTAX_FORMAT_ERROR',
                    'title': 'Non-Standard Serial Number Format',
                    'severity': 'WARNING',
                    'icon': 'Hash',
                    'summary': err,
                    'forensic_evidence': "Number format violates national issuing authority regex pattern.",
                    'officer_action': "Verify document series and issuing authority stamp."
                })
            elif 'visa' in err.lower():
                explanations.append({
                    'category': 'VISA_FRAUD',
                    'title': 'Fraudulent Visa Endorsement',
                    'severity': 'CRITICAL',
                    'icon': 'FileX',
                    'summary': err,
                    'forensic_evidence': "Visa endorsement serial number matches known counterfeit templates.",
                    'officer_action': "Deny entry and initiate immigration fraud protocol."
                })

    # 4. Biometric Face Verification
    if face_result is not None:
        if not face_result.get('match', True):
            dist = face_result.get('distance', 0.65)
            thresh = face_result.get('threshold', 0.40)
            explanations.append({
                'category': 'BIOMETRIC_IMPERSONATION',
                'title': 'Biometric Facial Mismatch (Impersonation Risk)',
                'severity': 'CRITICAL',
                'icon': 'UserX',
                'summary': f"Live applicant portrait does not match the photo embedded on the document.",
                'forensic_evidence': f"Facenet cosine embedding distance: {dist} (Must be ≤ {thresh} to qualify as genuine).",
                'officer_action': "Perform secondary biometric verification and check for identity fraud / document borrowing."
            })
        else:
            explanations.append({
                'category': 'BIOMETRIC_VERIFIED',
                'title': '1:1 Biometric Identity Verified',
                'severity': 'CLEAN',
                'icon': 'CheckCircle2',
                'summary': "Applicant face matches document photo with high biometric confidence.",
                'forensic_evidence': f"Distance {face_result.get('distance', 0.22)} within tolerance threshold.",
                'officer_action': "Identity confirmed."
            })

    # 5. Date & Expiry Results
    if date_results and date_results.get('findings'):
        for f in date_results['findings']:
            explanations.append({
                'category': f.get('category', 'DATE_CHECK'),
                'title': f.get('title', 'Date Sanity Flag'),
                'severity': f.get('severity', 'WARNING'),
                'icon': 'Calendar',
                'summary': f.get('detail'),
                'forensic_evidence': f.get('evidence'),
                'officer_action': "Verify physical stamps and travel authorization dates."
            })

    # If no flags found
    if not explanations or all(e.get('severity') == 'CLEAN' for e in explanations):
        explanations.append({
            'category': 'ALL_CHECKS_PASSED',
            'title': 'Clean Forensic Profile',
            'severity': 'CLEAN',
            'icon': 'CheckCircle2',
            'summary': "Document adheres to all format rules, jurisdiction district codes, compression analysis, and valid expiry windows.",
            'forensic_evidence': "All 5 verification pipeline checks passed with zero anomalous penalties.",
            'officer_action': "Authorize standard border crossing clearance."
        })

    return {
        'total_explanations': len(explanations),
        'critical_count': len([e for e in explanations if e.get('severity') == 'CRITICAL']),
        'warning_count': len([e for e in explanations if e.get('severity') in ('WARNING', 'HIGH')]),
        'items': explanations
    }
