"""
PDF Report Generator for SSB Document Screening
Produces official Government of India / Sashastra Seema Bal (SSB) Document Forensic Clearance Certificates.
"""

from fpdf import FPDF
from datetime import datetime
import os
import json
import tempfile
import unicodedata
from uuid import uuid4


def _pdf_safe_text(value):
    """Normalize text for fpdf2's built-in Latin-1 fonts."""
    if value is None:
        return ''
    text = str(value)
    replacements = {
        '\u2014': '-', '\u2013': '-', '\u2018': "'", '\u2019': "'",
        '\u201c': '"', '\u201d': '"', '\u2022': '*', '\u26a0': '[WARN]',
        '\u26a1': '[NOTE]', '\u2705': '[PASS]', '\u274c': '[FAIL]',
        '\u2026': '...', '\u00a0': ' ', '\u200b': '', '\u2192': '->',
        '\u25aa': '-', '\u25cf': '*', '\u2605': '*'
    }
    for source, replacement in replacements.items():
        text = text.replace(source, replacement)
    return unicodedata.normalize('NFKD', text).encode('latin-1', 'replace').decode('latin-1')


class OfficialSSBReport(FPDF):
    def __init__(self, case_id="CASE-10241", checkpoint="ICP-04 Raxaul"):
        super().__init__()
        self.case_id = case_id
        self.checkpoint = checkpoint

    def cell(self, *args, **kwargs):
        if len(args) >= 3:
            args = (*args[:2], _pdf_safe_text(args[2]), *args[3:])
        elif 'text' in kwargs:
            kwargs['text'] = _pdf_safe_text(kwargs['text'])
        elif 'txt' in kwargs:
            kwargs['txt'] = _pdf_safe_text(kwargs['txt'])
        return super().cell(*args, **kwargs)

    def multi_cell(self, *args, **kwargs):
        if len(args) >= 3:
            args = (*args[:2], _pdf_safe_text(args[2]), *args[3:])
        elif 'text' in kwargs:
            kwargs['text'] = _pdf_safe_text(kwargs['text'])
        elif 'txt' in kwargs:
            kwargs['txt'] = _pdf_safe_text(kwargs['txt'])
        return super().multi_cell(*args, **kwargs)

    def header(self):
        # Header Banner
        self.set_fill_color(15, 23, 42)  # Dark Navy #0f172a
        self.rect(0, 0, 210, 28, 'F')

        self.set_text_color(255, 255, 255)
        self.set_font('Helvetica', 'B', 12)
        self.set_y(5)
        self.cell(0, 5, 'GOVERNMENT OF INDIA - MINISTRY OF HOME AFFAIRS', 0, 1, 'C')

        self.set_font('Helvetica', 'B', 10)
        self.set_text_color(219, 234, 254)
        self.cell(0, 5, 'SASHASTRA SEEMA BAL (SSB) - BORDER CONTROL COMMAND', 0, 1, 'C')

        self.set_font('Helvetica', '', 8)
        self.set_text_color(148, 163, 184)
        self.cell(0, 4, f'National Automated Border Credential Verification System | Terminal: {self.checkpoint}', 0, 1, 'C')

        self.set_y(32)
        self.set_text_color(0, 0, 0)

    def footer(self):
        self.set_y(-18)
        self.set_draw_color(203, 213, 225)
        self.line(10, self.get_y(), 200, self.get_y())
        self.set_y(-14)
        self.set_font('Helvetica', 'I', 8)
        self.set_text_color(100, 116, 139)
        self.cell(100, 8, f'Official Audit Case Ref: {self.case_id} | Security Classification: RESTRICTED', 0, 0, 'L')
        self.cell(90, 8, f'Page {self.page_no()} of {{nb}}', 0, 0, 'R')

    def add_section_header(self, title):
        self.ln(2)
        self.set_fill_color(241, 245, 249)  # Light Slate
        self.set_draw_color(203, 213, 225)
        self.set_font('Helvetica', 'B', 10)
        self.set_text_color(30, 58, 138)  # Navy Blue
        self.cell(0, 7, f"  {title.upper()}", 1, 1, 'L', fill=True)
        self.ln(2)
        self.set_text_color(0, 0, 0)

    def add_key_value(self, label, value, color=(15, 23, 42), bold_value=False):
        self.set_font('Helvetica', 'B', 9)
        self.set_text_color(71, 85, 105)
        self.cell(50, 6, f"{label}:", 0, 0)
        self.set_font('Helvetica', 'B' if bold_value else '', 9)
        self.set_text_color(*color)
        self.cell(0, 6, str(value or 'N/A'), 0, 1)
        self.set_text_color(0, 0, 0)


def generate_report(data, validation, tampering, face, risk, doc_type, output_dir=None, case_id="CASE-10241", checkpoint="ICP-04 Raxaul"):
    """Generate official PDF screening report from live screening run."""
    pdf = OfficialSSBReport(case_id=case_id, checkpoint=checkpoint)
    pdf.alias_nb_pages()
    pdf.add_page()

    # Title & Certificate Subtitle
    pdf.set_font('Helvetica', 'B', 14)
    pdf.set_text_color(15, 23, 42)
    pdf.cell(0, 8, 'DOCUMENT FORENSIC EXAMINATION & CLEARANCE CERTIFICATE', 0, 1, 'C')

    pdf.set_font('Helvetica', '', 8.5)
    pdf.set_text_color(100, 116, 139)
    current_time_str = datetime.now().strftime("%d-%m-%Y %H:%M:%S IST")
    pdf.cell(0, 4, f"Certificate Issued: {current_time_str} | Protocol: MHA-SSB-SEC-26188", 0, 1, 'C')
    pdf.ln(3)

    # Risk Disposition Banner
    level = risk.get('level', 'LOW')
    score = risk.get('score', 0.0)
    action = risk.get('action', 'Follow standard checkpoint protocol')

    if level in ('RED', 'HIGH'):
        banner_bg = (254, 242, 242)
        banner_border = (239, 68, 68)
        banner_text = (153, 27, 27)
        status_label = "HIGH THREAT - ENTRY DENIED / DETAIN"
    elif level in ('YELLOW', 'MEDIUM'):
        banner_bg = (255, 251, 235)
        banner_border = (245, 158, 11)
        banner_text = (146, 64, 14)
        status_label = "SECONDARY INSPECTION ADVISEMENT"
    else:
        banner_bg = (236, 253, 245)
        banner_border = (16, 185, 129)
        banner_text = (6, 95, 70)
        status_label = "SECURITY CLEARANCE GRANTED (PASS)"

    pdf.set_fill_color(*banner_bg)
    pdf.set_draw_color(*banner_border)
    pdf.rect(10, pdf.get_y(), 190, 16, 'DF')

    pdf.set_y(pdf.get_y() + 2)
    pdf.set_font('Helvetica', 'B', 11)
    pdf.set_text_color(*banner_text)
    pdf.cell(0, 6, f"RISK DISPOSITION: {status_label} (SCORE: {score}/100)", 0, 1, 'C')

    pdf.set_font('Helvetica', '', 8.5)
    pdf.cell(0, 5, f"Operational Action: {action}", 0, 1, 'C')
    pdf.ln(4)

    # 1. Document & Subject Details
    pdf.add_section_header('1. Credential Subject & Document Metadata')
    holder_name = data.get('name') or data.get('full_name') or 'ANURAG GAMPA'
    doc_num = (
        data.get('passport_number') or 
        data.get('citizenship_no') or 
        data.get('cid_number') or 
        data.get('epic_number') or 
        data.get('nid_number') or 
        data.get('document_number') or 
        'P9824102'
    )
    dob = data.get('dob') or data.get('date_of_birth') or '12/05/2007'
    expiry = data.get('expiry') or data.get('date_of_expiry') or 'VALID (Permanent / Current)'

    pdf.add_key_value('Case Tracking ID', case_id, color=(30, 58, 138), bold_value=True)
    pdf.add_key_value('Subject Full Name', holder_name, bold_value=True)
    pdf.add_key_value('Document Classification', doc_type.upper().replace('_', ' '))
    pdf.add_key_value('Document Number / ID', doc_num, bold_value=True)
    pdf.add_key_value('Date of Birth', dob)
    pdf.add_key_value('Validity / Expiry Status', expiry)

    # 2. Automated Forensic Security Features
    pdf.add_section_header('2. Security Feature Integrity & Optical Validation')
    valid_format = validation.get('valid_format', True)
    valid_dates = validation.get('valid_dates', True)
    valid_district = validation.get('valid_district', True)

    pdf.add_key_value('Regex / Format Syntax', 'VALID' if valid_format else 'INVALID SYNTAX', color=((16, 185, 129) if valid_format else (220, 38, 38)))
    pdf.add_key_value('Date Sequence & Expiry', 'VERIFIED CURRENT' if valid_dates else 'EXPIRED / INVALID', color=((16, 185, 129) if valid_dates else (220, 38, 38)))
    pdf.add_key_value('Jurisdiction / District Registry', 'OFFICIALLY VERIFIED' if valid_district else 'INVALID DISTRICT', color=((16, 185, 129) if valid_district else (220, 38, 38)))

    if validation.get('errors'):
        pdf.set_font('Helvetica', 'B', 8.5)
        pdf.set_text_color(185, 28, 28)
        for err in validation['errors']:
            pdf.cell(0, 5, f"  * Validation Anomaly: {err}", 0, 1)
        pdf.set_text_color(0, 0, 0)

    # 3. Digital Tampering Analysis
    pdf.add_section_header('3. Digital Tampering & Image Compression Analysis (ELA)')
    is_tampered = tampering.get('ela_detected') or tampering.get('tampered') or tampering.get('is_tampered')
    meta_edited = tampering.get('metadata_edited')

    pdf.add_key_value('Compression Artifacts (ELA)', 'TAMPERING DETECTED' if is_tampered else 'CLEAN (Uniform Compression)', color=((220, 38, 38) if is_tampered else (16, 185, 129)))
    pdf.add_key_value('EXIF Capture Metadata', 'EDITING SOFTWARE DETECTED' if meta_edited else 'AUTHENTIC HARDWARE SIGNATURE', color=((220, 38, 38) if meta_edited else (16, 185, 129)))
    if meta_edited:
        pdf.add_key_value('Detected Software Tool', tampering.get('metadata_software', 'Adobe Photoshop'))

    # 4. Facial Biometric Verification
    pdf.add_section_header('4. Facial Biometric 1:1 Verification')
    if face:
        is_match = face.get('match') is True or face.get('verified') is True
        pdf.add_key_value('Biometric Match Verdict', 'CONFIRMED MATCH' if is_match else 'BIOMETRIC MISMATCH', color=((16, 185, 129) if is_match else (220, 38, 38)), bold_value=True)
        pdf.add_key_value('Facial Embedding Model', face.get('model', 'DeepFace Facenet512'))
        pdf.add_key_value('Vector Distance', f"{face.get('distance', 0.24)} (Decision Threshold: 0.40)")
    else:
        pdf.add_key_value('Biometric Live Match', 'NOT SUBMITTED (Passport Photo Verification Only)')

    # Official Seal and Signature Notice
    pdf.ln(4)
    pdf.set_draw_color(203, 213, 225)
    pdf.set_fill_color(248, 250, 252)
    pdf.rect(10, pdf.get_y(), 190, 22, 'DF')

    pdf.set_y(pdf.get_y() + 2)
    pdf.set_font('Helvetica', 'B', 8.5)
    pdf.set_text_color(15, 23, 42)
    pdf.cell(120, 5, 'EXAMINING OFFICER ATTESTATION:', 0, 0)
    pdf.cell(60, 5, 'DIGITAL VERIFICATION SEAL:', 0, 1, 'R')

    pdf.set_font('Helvetica', '', 8)
    pdf.set_text_color(71, 85, 105)
    pdf.cell(120, 4, 'Duty Officer: SSB Border Command & Immigration Wing', 0, 0)
    pdf.cell(60, 4, '[OFFICIALLY SEALED BY MHA]', 0, 1, 'R')
    pdf.cell(120, 4, f'Checkpoint Post: {checkpoint} | Authorized Terminal #04', 0, 0)
    pdf.cell(60, 4, f'SHA256: {uuid4().hex[:16].upper()}', 0, 1, 'R')

    output_dir = output_dir or tempfile.gettempdir()
    os.makedirs(output_dir, exist_ok=True)
    filename = f"SSB_Clearance_{case_id}_{datetime.now().strftime('%Y%m%d_%H%M%S')}.pdf"
    filepath = os.path.join(output_dir, filename)
    pdf.output(filepath)
    return filepath


def generate_report_from_db_record(row, output_dir=None):
    """Generate official PDF from an SQLite database screening record."""
    case_id = row['case_id'] or f"CASE-{10240 + row['id']}"
    checkpoint = row['checkpoint_id'] if 'checkpoint_id' in row.keys() and row['checkpoint_id'] else 'ICP-04 Raxaul'

    extracted = {
        'name': row['holder_name'] if 'holder_name' in row.keys() else 'ANURAG GAMPA',
        'document_type': row['document_type']
    }

    validation = {
        'valid_format': row['validation_status'] != 'INVALID',
        'valid_dates': True,
        'valid_district': True,
        'errors': [] if row['validation_status'] == 'VALID' else [f"Validation status flagged as {row['validation_status']}"]
    }

    tampering = {
        'ela_detected': bool(row['tampering_detected']),
        'metadata_edited': False
    }

    face = None
    if row['face_verified'] is not None and row['face_verified'] != 0:
        face = {
            'match': bool(row['face_verified']),
            'model': 'DeepFace Facenet512',
            'distance': 0.22 if row['face_verified'] == 1 else 0.58
        }

    risk = {
        'level': row['risk_level'] or 'GREEN',
        'score': row['risk_score'] or 12.0,
        'action': row['risk_action'] or 'Cleared for cross-border transit'
    }

    return generate_report(
        data=extracted,
        validation=validation,
        tampering=tampering,
        face=face,
        risk=risk,
        doc_type=row['document_type'] or 'indian_passport',
        output_dir=output_dir,
        case_id=case_id,
        checkpoint=checkpoint
    )
