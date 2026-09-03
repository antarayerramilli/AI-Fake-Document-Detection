import os
import sys
import unittest

sys.path.insert(0, os.path.dirname(os.path.dirname(__file__)))

from modules.document_detector import classify_document_type, validate_document_type_match, detect_document_validity
from modules.validator import validate_document
from modules.risk_scorer import calculate_risk_score

class DocumentTypeValidationTests(unittest.TestCase):
    
    def test_classify_passport_text(self):
        sample = "REPUBLIC OF INDIA PASSPORT PASSPORT NO: Z1234567 SURNAME: SHARMA GIVEN NAMES: ANITA"
        detected_type, label, conf, scores = classify_document_type(sample)
        self.assertIn(detected_type, ('indian_passport', 'passport'))
        self.assertIn('Passport', label)

    def test_classify_driving_licence_text(self):
        sample = "UNION OF INDIA DRIVING LICENCE MOTOR VEHICLES DEPARTMENT DL NO: DL-0420110012345 COV: LMV"
        detected_type, label, conf, scores = classify_document_type(sample)
        self.assertEqual(detected_type, 'driving_licence')
        self.assertEqual(label, 'Driving Licence')

    def test_classify_aadhaar_text(self):
        sample = "UNIQUE IDENTIFICATION AUTHORITY OF INDIA MERA AADHAAR 1234 5678 9012 ENROLMENT NO: 1234/56789/01234"
        detected_type, label, conf, scores = classify_document_type(sample)
        self.assertEqual(detected_type, 'aadhaar')
        self.assertEqual(label, 'Aadhaar Card')

    def test_classify_pan_card_text(self):
        sample = "INCOME TAX DEPARTMENT GOVT. OF INDIA PERMANENT ACCOUNT NUMBER CARD ABCDE1234F"
        detected_type, label, conf, scores = classify_document_type(sample)
        self.assertEqual(detected_type, 'pan_card')
        self.assertEqual(label, 'PAN Card')

    def test_classify_nepal_citizenship_text(self):
        sample = "NEPAL CITIZENSHIP CERTIFICATE CITIZENSHIP NO: 4101-12345671 DISTRICT: LALITPUR"
        detected_type, label, conf, scores = classify_document_type(sample)
        self.assertEqual(detected_type, 'nepal_citizenship')
        self.assertEqual(label, 'Nepalese Citizenship Certificate')

    def test_classify_bhutan_cid_text(self):
        sample = "ROYAL GOVERNMENT OF BHUTAN CITIZEN IDENTITY CARD (CID) CID NUMBER: 10700123456 DZONGKHAG: PARO"
        detected_type, label, conf, scores = classify_document_type(sample)
        self.assertEqual(detected_type, 'bhutan_cid')
        self.assertEqual(label, 'Bhutanese Citizen Identity Card (CID)')

    def test_classify_indian_epic_text(self):
        sample = "ELECTION COMMISSION OF INDIA ELECTORS PHOTO IDENTITY CARD EPIC NO: ABC1234567 CONSTITUENCY: DELHI SADAR"
        detected_type, label, conf, scores = classify_document_type(sample)
        self.assertEqual(detected_type, 'indian_epic')
        self.assertEqual(label, 'Indian Voter ID Card (EPIC)')

    def test_mismatch_user_selects_passport_uploads_driving_licence(self):
        dl_text = "UNION OF INDIA DRIVING LICENCE MOTOR VEHICLES DEPARTMENT DL NO: DL-0420110012345"
        res = validate_document_type_match('indian_passport', dl_text)
        self.assertFalse(res['is_type_match'])
        self.assertEqual(res['selected_type'], 'indian_passport')
        self.assertEqual(res['detected_type'], 'driving_licence')
        self.assertIn("Driving Licence", res['error_message'])
        self.assertIn("Indian Passport", res['error_message'])
        self.assertIn("Please upload the correct document", res['guidance_message'])

    def test_mismatch_user_selects_passport_uploads_aadhaar(self):
        aadhaar_text = "UNIQUE IDENTIFICATION AUTHORITY OF INDIA MERA AADHAAR 1234 5678 9012"
        res = validate_document_type_match('indian_passport', aadhaar_text)
        self.assertFalse(res['is_type_match'])
        self.assertEqual(res['detected_type'], 'aadhaar')

    def test_mismatch_user_selects_passport_uploads_nepal_citizenship(self):
        nepal_text = "NEPAL CITIZENSHIP CERTIFICATE CITIZENSHIP NO: 4101-12345671 DISTRICT: LALITPUR"
        res = validate_document_type_match('indian_passport', nepal_text)
        self.assertFalse(res['is_type_match'])
        self.assertEqual(res['detected_type'], 'nepal_citizenship')

    def test_mismatch_user_selects_bhutan_cid_uploads_indian_epic(self):
        epic_text = "ELECTION COMMISSION OF INDIA ELECTORS PHOTO IDENTITY CARD EPIC NO: ABC1234567"
        res = validate_document_type_match('bhutan_cid', epic_text)
        self.assertFalse(res['is_type_match'])
        self.assertEqual(res['detected_type'], 'indian_epic')

    def test_matching_passport_passes(self):
        passport_text = "REPUBLIC OF INDIA PASSPORT PASSPORT NO: Z1234567"
        res = validate_document_type_match('indian_passport', passport_text)
        self.assertTrue(res['is_type_match'])

    def test_end_to_end_mismatch_scoring_rejection(self):
        dl_text = "UNION OF INDIA DRIVING LICENCE MOTOR VEHICLES DEPARTMENT DL NO: DL-0420110012345"
        dummy_path = os.path.join(os.path.dirname(os.path.dirname(__file__)), "data", "nepal", "nepal_citizenship_clean_1.png")
        
        # User selected passport, but uploaded driving licence text
        doc_val = detect_document_validity(dummy_path, dl_text, 'indian_passport')
        self.assertFalse(doc_val['is_valid_document'])
        self.assertEqual(doc_val['error_type'], 'DOCUMENT_TYPE_MISMATCH')
        
        val = validate_document({}, 'indian_passport', doc_val)
        self.assertFalse(val['valid_format'])
        self.assertTrue(val['document_type_mismatch'])
        
        risk = calculate_risk_score({}, val, {}, None, doc_val)
        self.assertEqual(risk['level'], 'RED')
        self.assertGreaterEqual(risk['score'], 80)
        self.assertIn("REJECTED", risk['action'])
        self.assertIn("Driving Licence", risk['reasons'][0])

if __name__ == '__main__':
    unittest.main()
