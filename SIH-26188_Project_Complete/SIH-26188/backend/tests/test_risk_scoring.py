import os
import sys
import unittest
import json

sys.path.insert(0, os.path.dirname(os.path.dirname(__file__)))

from modules.risk_scorer import calculate_risk_score
from modules.tamper_detector import detect_tampering
from modules.validator import validate_document


def score(data, document_type, tampering=None):
    validation = validate_document(data, document_type)
    return calculate_risk_score(data, validation, tampering or {})


class RiskScoringTests(unittest.TestCase):
    def test_tamper_result_is_json_serializable(self):
        document = os.path.join(
            os.path.dirname(os.path.dirname(os.path.dirname(__file__))),
            'data', 'nepal', 'nepal_citizenship_clean_1.png',
        )
        result = detect_tampering(document)

        json.dumps(result)
        self.assertIsInstance(result['ela_detected'], bool)
        self.assertIsInstance(result['ela_ratio'], (int, float))
        self.assertIsInstance(result['photo_inconsistent'], bool)
        self.assertIsInstance(result['photo_noise_diff'], (int, float))

    def test_fake_nepal_district_is_red_without_tampering_signal(self):
        result = score(
            {'document_type': 'nepal_citizenship', 'district': 'District 88'},
            'nepal_citizenship',
        )

        self.assertEqual(result['score'], 75)
        self.assertEqual(result['level'], 'RED')
        self.assertEqual(result['breakdown']['validation_penalty'], 75)
        self.assertEqual(result['reasons'].count('Invalid document format'), 0)

    def test_valid_nepal_citizenship_is_clear(self):
        result = score({'district': 'Kathmandu'}, 'nepal_citizenship')

        self.assertEqual(result['score'], 0)
        self.assertEqual(result['level'], 'GREEN')

    def test_fake_indian_epic_is_red_without_tampering_signal(self):
        result = score(
            {'epic_number': 'XYZ123456', 'constituency': 'Fake Constituency 99 DEMO'},
            'indian_epic',
        )

        self.assertEqual(result['score'], 100)
        self.assertEqual(result['level'], 'RED')
        self.assertNotEqual(result['action'], 'CLEAR — Proceed')

    def test_valid_indian_epic_is_clear(self):
        result = score(
            {'epic_number': 'ABC1234567', 'constituency': 'Delhi Sadar'},
            'indian_epic',
        )

        self.assertEqual(result['score'], 0)
        self.assertEqual(result['level'], 'GREEN')

    def test_valid_bhutan_cid_is_clear(self):
        result = score(
            {'cid_number': '12345678901', 'dzongkhag': 'Thimphu'},
            'bhutan_cid',
        )

        self.assertEqual(result['score'], 0)
        self.assertEqual(result['level'], 'GREEN')

    def test_altered_bhutan_cid_requires_review(self):
        result = score(
            {'cid_number': '1234567890', 'dzongkhag': 'Thimphu'},
            'bhutan_cid',
        )

        self.assertEqual(result['score'], 40)
        self.assertEqual(result['level'], 'YELLOW')
        self.assertIn('Invalid document format', result['reasons'])
