"""
Module: Date & Document Expiry Engine
Performs rigorous validity, expiry, and impossible date combination checks.
"""

from datetime import datetime, timedelta
import re

# Current checkpoint evaluation date (2026-09-01)
CURRENT_DATE = datetime(2026, 9, 1)

def parse_date_flexible(date_str):
    """Parse dates in formats: DD/MM/YYYY, YYYY-MM-DD, DD-MM-YYYY, YYMMDD (MRZ)."""
    if not date_str or not isinstance(date_str, str):
        return None
    
    clean_str = date_str.strip()
    
    # 1. Try standard date formats
    for fmt in ("%d/%m/%Y", "%Y-%m-%d", "%d-%m-%Y", "%d.%m.%Y", "%Y/%m/%d"):
        try:
            return datetime.strptime(clean_str, fmt)
        except ValueError:
            pass
    
    # 2. Try MRZ 6-digit YYMMDD
    if len(clean_str) == 6 and clean_str.isdigit():
        try:
            yy = int(clean_str[:2])
            mm = int(clean_str[2:4])
            dd = int(clean_str[4:6])
            year = 2000 + yy if yy < 50 else 1900 + yy
            return datetime(year, mm, dd)
        except Exception:
            pass
            
    return None

def check_document_expiry_and_dates(extracted_data, doc_type, raw_text=None):
    """
    Check document expiry, visa validity, and detect impossible date combinations.
    Returns structured results for Explainable AI.
    """
    eval_date = CURRENT_DATE
    findings = []
    is_expired = False
    expiry_details = {
        'evaluation_date': eval_date.strftime("%d/%m/%Y"),
        'expiry_date': None,
        'issue_date': None,
        'days_remaining': None,
        'is_expired': False,
        'status': 'VALID',
        'status_badge': '🟢 VALID',
        'warnings': [],
        'errors': []
    }
    
    # Extract candidate fields
    raw_expiry = extracted_data.get('expiry') or extracted_data.get('expiry_date') or extracted_data.get('valid_until')
    raw_issue = extracted_data.get('date_of_issue') or extracted_data.get('issue_date') or extracted_data.get('doi')
    raw_dob = extracted_data.get('dob') or extracted_data.get('date_of_birth')
    
    exp_dt = parse_date_flexible(str(raw_expiry)) if raw_expiry else None
    issue_dt = parse_date_flexible(str(raw_issue)) if raw_issue else None
    dob_dt = parse_date_flexible(str(raw_dob)) if raw_dob else None
    
    if exp_dt:
        expiry_details['expiry_date'] = exp_dt.strftime("%d/%m/%Y")
        days_diff = (exp_dt - eval_date).days
        expiry_details['days_remaining'] = days_diff
        
        if days_diff < 0:
            is_expired = True
            days_ago = abs(days_diff)
            expiry_details['is_expired'] = True
            expiry_details['status'] = 'EXPIRED'
            expiry_details['status_badge'] = '🔴 EXPIRED'
            err_msg = f"Document expired on {exp_dt.strftime('%d/%m/%Y')} ({days_ago} days ago as of {eval_date.strftime('%d/%m/%Y')})"
            expiry_details['errors'].append(err_msg)
            findings.append({
                'category': 'DOCUMENT_EXPIRY',
                'severity': 'CRITICAL',
                'title': 'Document Expired',
                'detail': err_msg,
                'evidence': f"Expiry Date: {exp_dt.strftime('%d/%m/%Y')} | Evaluation Date: {eval_date.strftime('%d/%m/%Y')}"
            })
        elif days_diff <= 30:
            expiry_details['status'] = 'EXPIRING_SOON'
            expiry_details['status_badge'] = '🟡 EXPIRING SOON'
            warn_msg = f"Document expiring in {days_diff} days on {exp_dt.strftime('%d/%m/%Y')}"
            expiry_details['warnings'].append(warn_msg)
            findings.append({
                'category': 'DOCUMENT_EXPIRY',
                'severity': 'WARNING',
                'title': 'Expiring Soon',
                'detail': warn_msg,
                'evidence': f"{days_diff} days validity remaining"
            })

    # Check Foreign Visa Expiry if present
    visa_info = extracted_data.get('visa')
    if isinstance(visa_info, dict):
        raw_visa_exp = visa_info.get('expiry_date') or visa_info.get('valid_until')
        visa_exp_dt = parse_date_flexible(str(raw_visa_exp)) if raw_visa_exp else None
        if visa_exp_dt:
            visa_days = (visa_exp_dt - eval_date).days
            if visa_days < 0:
                is_expired = True
                visa_err = f"Indian Visa expired on {visa_exp_dt.strftime('%d/%m/%Y')} ({abs(visa_days)} days ago)"
                expiry_details['errors'].append(visa_err)
                findings.append({
                    'category': 'VISA_EXPIRY',
                    'severity': 'CRITICAL',
                    'title': 'Indian Visa Expired',
                    'detail': visa_err,
                    'evidence': f"Visa Expiry: {visa_exp_dt.strftime('%d/%m/%Y')} | Current Date: {eval_date.strftime('%d/%m/%Y')}"
                })

    # Impossible Date Combination Checks
    if issue_dt and issue_dt > eval_date:
        err = f"Impossible Date: Issue date {issue_dt.strftime('%d/%m/%Y')} is post-dated in the future"
        expiry_details['errors'].append(err)
        findings.append({
            'category': 'DATE_SANITY',
            'severity': 'CRITICAL',
            'title': 'Post-Dated Issue Date',
            'detail': err,
            'evidence': f"Issue date is after checkpoint current date {eval_date.strftime('%d/%m/%Y')}"
        })

    if issue_dt and exp_dt and issue_dt > exp_dt:
        err = f"Impossible Date Combination: Issue date ({issue_dt.strftime('%d/%m/%Y')}) is after Expiry date ({exp_dt.strftime('%d/%m/%Y')})"
        expiry_details['errors'].append(err)
        findings.append({
            'category': 'DATE_SANITY',
            'severity': 'CRITICAL',
            'title': 'Invalid Issue/Expiry Sequence',
            'detail': err,
            'evidence': "Issue date > Expiry date"
        })

    if dob_dt:
        age_years = (eval_date - dob_dt).days / 365.25
        if age_years < 0:
            err = f"Impossible Date: Date of birth ({dob_dt.strftime('%d/%m/%Y')}) is in the future"
            expiry_details['errors'].append(err)
            findings.append({
                'category': 'DATE_SANITY',
                'severity': 'CRITICAL',
                'title': 'Future Date of Birth',
                'detail': err,
                'evidence': "DOB in future"
            })
        elif age_years < 16 and doc_type in ('nepal_citizenship', 'bhutan_cid', 'indian_epic'):
            warn = f"Age anomaly: Holder calculated age is {int(age_years)} years (under statutory threshold of 16)"
            expiry_details['warnings'].append(warn)
            findings.append({
                'category': 'AGE_SANITY',
                'severity': 'WARNING',
                'title': 'Underage Statutory Threshold',
                'detail': warn,
                'evidence': f"DOB: {dob_dt.strftime('%d/%m/%Y')} (Age: {int(age_years)})"
            })

    return {
        'is_expired': is_expired,
        'expiry_details': expiry_details,
        'findings': findings
    }
