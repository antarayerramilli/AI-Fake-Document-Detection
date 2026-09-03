"""
Module 2: Document Validation Engine
Validates extracted fields against known official rules for Nepal, Bhutan, India, and International Passports.
"""

import re
from datetime import datetime, timedelta
from modules.constants import (
    BLACKLISTED_DOCS,
    VALID_BHUTAN_DZONGKHAGS,
    VALID_CONSTITUENCIES,
    VALID_NEPAL_DISTRICTS,
)

def validate_mrz_checksum(mrz_line):
    """Validate an MRZ field/value and its trailing checksum digit using the ICAO 9303 algorithm."""
    if not mrz_line or not isinstance(mrz_line, str):
        return {
            'valid': False,
            'message': 'MRZ value is empty or not a string',
            'computed_checksum': None,
            'provided_checksum': None,
        }

    normalized = mrz_line.strip().upper()
    if len(normalized) < 2:
        return {
            'valid': False,
            'message': 'MRZ value is too short to contain a checksum digit',
            'computed_checksum': None,
            'provided_checksum': None,
        }

    check_char = normalized[-1]
    content = normalized[:-1]

    if not check_char.isdigit():
        return {
            'valid': False,
            'message': 'MRZ checksum digit is missing or invalid',
            'computed_checksum': None,
            'provided_checksum': check_char,
        }

    def char_value(ch):
        if ch.isdigit():
            return int(ch)
        if ch == '<':
            return 0
        if 'A' <= ch <= 'Z':
            return ord(ch) - ord('A') + 10
        return None

    total = 0
    weights = [7, 3, 1]
    for index, ch in enumerate(content):
        value = char_value(ch)
        if value is None:
            return {
                'valid': False,
                'message': f"MRZ contains unsupported character '{ch}'",
                'computed_checksum': None,
                'provided_checksum': int(check_char),
            }
        weight = weights[index % len(weights)]
        total += value * weight

    computed = total % 10
    provided = int(check_char)

    valid = (computed == provided)
    return {
        'valid': valid,
        'message': 'MRZ checksum is valid' if valid else 'MRZ checksum is invalid',
        'computed_checksum': computed,
        'provided_checksum': provided,
    }

def validate_nepal_citizenship(data):
    """Validate Nepalese Citizenship Certificate."""
    errors = []
    warnings = []

    # 1. District check (Definitive: Nepal has exactly 77 districts)
    district = data.get('district', '')
    is_invalid_district = False
    if district:
        if district not in VALID_NEPAL_DISTRICTS:
            errors.append(f"District '{district}' does not exist in Nepal (valid: 1-77)")
            is_invalid_district = True
    else:
        warnings.append("District not extracted")

    # 2. Citizenship number format (e.g. 4101-12345671)
    cid = data.get('citizenship_no', '')
    if cid:
        if not re.match(r'^\d{4}[ -]\d{8}$', cid):
            warnings.append(f"Citizenship number '{cid}' has unusual format")
    else:
        warnings.append("Citizenship number not extracted")

    # 3. DOB check
    dob_str = data.get('dob', '')
    if dob_str:
        try:
            dob = datetime.strptime(dob_str, "%d/%m/%Y")
            age = (datetime.now() - dob).days / 365.25
            if age < 16:
                warnings.append("Holder appears under 16 years old")
            if age > 100:
                warnings.append("Holder appears over 100 years old — verify")
        except Exception:
            warnings.append("Could not parse date of birth")

    # 4. Blacklist check
    if cid and cid in BLACKLISTED_DOCS:
        errors.append(f"Citizenship Certificate {cid} is BLACKLISTED")

    return {
        'valid_format': len([e for e in errors if 'format' in e.lower()]) == 0 and not is_invalid_district,
        'valid_dates': len([e for e in errors if 'date' in e.lower()]) == 0,
        'valid_district': not is_invalid_district,
        'district_validation_is_definitive': is_invalid_district,
        'errors': errors,
        'warnings': warnings,
    }

def validate_bhutan_cid(data):
    """Validate Bhutanese CID."""
    errors = []
    warnings = []

    # 1. CID must be exactly 11 digits
    cid = data.get('cid_number', '')
    if cid:
        if len(cid) != 11 or not cid.isdigit():
            errors.append(f"CID must be exactly 11 digits, got '{cid}' ({len(cid)} digits)")
    else:
        warnings.append("CID number not extracted")

    # 2. Dzongkhag check (Definitive: Bhutan has exactly 20 Dzongkhags)
    dzong = data.get('dzongkhag', '')
    is_invalid_dzong = False
    if dzong:
        if dzong not in VALID_BHUTAN_DZONGKHAGS:
            errors.append(f"Dzongkhag '{dzong}' is not a valid Bhutanese district")
            is_invalid_dzong = True
    else:
        warnings.append("Dzongkhag not extracted")

    # 3. Date of issue
    doi_str = data.get('date_of_issue', '')
    if doi_str:
        try:
            doi = datetime.strptime(doi_str, "%d/%m/%Y")
            if doi.year < 1985:
                errors.append("CID issued before 1985 — Bhutan CID system started in 1985")
            if doi > datetime.now():
                errors.append("Date of issue is in the future")
        except Exception:
            warnings.append("Could not parse date of issue")

    # 4. Blacklist check
    if cid and cid in BLACKLISTED_DOCS:
        errors.append(f"CID {cid} is BLACKLISTED")

    return {
        'valid_format': len([e for e in errors if 'format' in e.lower() or 'digits' in e.lower()]) == 0 and not is_invalid_dzong,
        'valid_dates': len([e for e in errors if 'date' in e.lower() or '1985' in e.lower()]) == 0,
        'valid_district': not is_invalid_dzong,
        'district_validation_is_definitive': is_invalid_dzong,
        'errors': errors,
        'warnings': warnings,
    }

def validate_indian_epic(data):
    """Validate Indian Voter ID (EPIC)."""
    errors = []
    warnings = []

    # 1. EPIC format: 3 letters + 7 digits (e.g. ABC1234561)
    epic = data.get('epic_number', '')
    if epic:
        if not re.match(r'^[A-Z]{3}\d{7}$', epic) and not re.match(r'^[A-Z]{2}\d{8}$', epic):
            errors.append(f"EPIC '{epic}' does not match standard format (ABC1234567)")
    else:
        warnings.append("EPIC number not extracted")

    # 2. Constituency check
    const = data.get('constituency', '')
    is_invalid_const = False
    if const:
        if const not in VALID_CONSTITUENCIES:
            warnings.append(f"Constituency '{const}' not in known database (using demo subset)")
            is_invalid_const = True
    else:
        warnings.append("Constituency not extracted")

    # 3. Blacklist check
    if epic and epic in BLACKLISTED_DOCS:
        errors.append(f"EPIC {epic} is BLACKLISTED")

    return {
        'valid_format': len(errors) == 0,
        'valid_dates': True,
        'valid_district': not is_invalid_const,
        'district_validation_is_definitive': False,
        'errors': errors,
        'warnings': warnings,
    }

def validate_passport(data):
    """Validate Indian / Foreign Passport and Entry Visa."""
    errors = []
    warnings = []

    pno = data.get('passport_number', '')
    if pno:
        if not re.match(r'^[A-Z]\d{7,8}$', str(pno)):
            warnings.append(f"Passport number '{pno}' has unusual format")
    else:
        warnings.append("Passport number not extracted")

    # Expiry validation
    expiry = data.get('expiry', '')
    if expiry:
        exp_date = None
        try:
            # 1. Check dd/mm/yyyy
            if '/' in str(expiry):
                exp_date = datetime.strptime(str(expiry), "%d/%m/%Y")
            # 2. Check MRZ YYMMDD
            elif len(str(expiry)) == 6 and str(expiry).isdigit():
                yy = int(str(expiry)[:2])
                mm = int(str(expiry)[2:4])
                dd = int(str(expiry)[4:6])
                year = 2000 + yy if yy < 50 else 1900 + yy
                exp_date = datetime(year, mm, dd)
            
            if exp_date:
                if exp_date < datetime.now():
                    errors.append(f"Passport expired on {exp_date.strftime('%d/%m/%Y')}")
            else:
                warnings.append("Could not parse expiry date format")
        except Exception as e:
            warnings.append(f"Expiry date parsing error: {e}")

    # Nationality
    nat = data.get('nationality', '')
    if nat and nat not in ('IND', 'USA', 'GBR', 'CAN', 'AUS', 'PAK', 'BGD', 'LKA', 'NPL', 'BTN'):
        warnings.append(f"Unusual nationality code: {nat}")

    # Foreign Visa validation
    visa = data.get('visa', {})
    if visa:
        if visa.get('is_fake'):
            errors.append("Invalid or fraudulent Indian Visa endorsement detected")
        elif visa.get('visa_number') == 'FAKE-VISA':
            errors.append("Indian Visa number is fraudulent (FAKE-VISA)")
        
        visa_exp = visa.get('expiry_date')
        if visa_exp:
            try:
                vexp_date = datetime.strptime(visa_exp, "%d/%m/%Y")
                if vexp_date < datetime.now():
                    errors.append(f"Indian Visa expired on {vexp_date.strftime('%d/%m/%Y')}")
            except Exception:
                pass

    # Blacklist check
    if pno and str(pno).upper() in BLACKLISTED_DOCS:
        errors.append(f"Passport {pno} is BLACKLISTED")

    return {
        'valid_format': len([e for e in errors if 'expired' not in e.lower()]) == 0,
        'valid_dates': len([e for e in errors if 'expired' in e.lower()]) == 0,
        'valid_district': True,
        'district_validation_is_definitive': False,
        'errors': errors,
        'warnings': warnings,
    }

def validate_bangladesh_nid(data):
    """Validate Bangladesh National Identity Card (NID)."""
    errors = []
    warnings = []

    nid = str(data.get('nid_number', '') or data.get('document_number', '')).strip().replace(' ', '').replace('-', '')
    if nid:
        if not nid.isdigit():
            errors.append(f"Bangladesh NID must contain only digits, got '{nid}'")
        elif len(nid) not in (10, 13, 17):
            errors.append(f"Invalid Bangladesh NID length ({len(nid)} digits). Expected 10 (Smart), 13, or 17 digits.")
    else:
        warnings.append("Bangladesh NID number not extracted")

    # DOB validation
    dob_str = data.get('dob', '')
    if dob_str:
        try:
            if '-' in dob_str:
                dob = datetime.strptime(dob_str, "%Y-%m-%d")
            else:
                dob = datetime.strptime(dob_str, "%d/%m/%Y")
            
            if nid and len(nid) == 17 and nid.isdigit():
                if int(nid[:4]) != dob.year:
                    errors.append(f"First 4 digits of 17-digit NID ({nid[:4]}) do not match year of birth ({dob.year})")
        except Exception:
            warnings.append("Could not verify date of birth against NID")

    name = data.get('name', '') or data.get('full_name', '')
    if not name:
        warnings.append("Holder name could not be definitively extracted")

    return {
        'valid_format': len([e for e in errors if 'format' in e.lower() or 'digits' in e.lower() or 'length' in e.lower()]) == 0,
        'valid_dates': len([e for e in errors if 'year' in e.lower() or 'birth' in e.lower() or 'date' in e.lower()]) == 0,
        'valid_district': True,
        'district_validation_is_definitive': False,
        'errors': errors,
        'warnings': warnings,
    }

def validate_document(data, doc_type, document_validity=None):
    """Main validation router."""
    if document_validity and not document_validity.get('is_valid_document'):
        type_mismatch = document_validity.get('type_mismatch', {})
        if document_validity.get('error_type') == 'DOCUMENT_TYPE_MISMATCH' and type_mismatch:
            return {
                'valid_format': False,
                'valid_dates': False,
                'valid_district': False,
                'district_validation_is_definitive': True,
                'document_type_mismatch': True,
                'type_mismatch': type_mismatch,
                'errors': [type_mismatch.get('error_message', 'Document type mismatch detected')],
                'warnings': [type_mismatch.get('guidance_message', f"Please upload the correct document ({type_mismatch.get('selected_label')}).")],
                'document_type_error': True,
            }

        return {
            'valid_format': False,
            'valid_dates': False,
            'valid_district': False,
            'district_validation_is_definitive': True,
            'document_type_mismatch': False,
            'errors': document_validity.get('warnings', [document_validity.get('error_type', 'Invalid document')]),
            'warnings': [],
            'document_type_error': True,
        }

    if doc_type == 'nepal_citizenship':
        return validate_nepal_citizenship(data)
    elif doc_type == 'bhutan_cid':
        return validate_bhutan_cid(data)
    elif doc_type == 'indian_epic':
        return validate_indian_epic(data)
    elif doc_type in ('indian_passport', 'foreign_passport'):
        return validate_passport(data)
    elif doc_type == 'bangladesh_nid':
        return validate_bangladesh_nid(data)
    else:
        return {
            'valid_format': False,
            'valid_dates': False,
            'valid_district': False,
            'district_validation_is_definitive': True,
            'errors': [f"Unknown document type: {doc_type}"],
            'warnings': [],
        }


