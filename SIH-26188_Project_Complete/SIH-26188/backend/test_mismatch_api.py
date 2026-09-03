import urllib.request
import urllib.parse
import json
import os
import io

def test_mismatch_via_api():
    # Use real file nepal_citizenship_clean_1.png
    base_dir = os.path.dirname(os.path.abspath(__file__))
    nepal_doc = os.path.join(os.path.dirname(base_dir), "data", "nepal", "nepal_citizenship_clean_1.png")
    
    if not os.path.exists(nepal_doc):
        print(f"File not found: {nepal_doc}")
        return

    # Prepare multipart form data: user selected indian_passport, but uploaded nepal_citizenship
    boundary = "----WebKitFormBoundary7MA4YWxkTrZu0gW"
    
    with open(nepal_doc, "rb") as f:
        file_bytes = f.read()

    body = io.BytesIO()
    body.write(f"--{boundary}\r\n".encode("utf-8"))
    body.write(f'Content-Disposition: form-data; name="document_type"\r\n\r\n'.encode("utf-8"))
    body.write(b"indian_passport\r\n")
    
    body.write(f"--{boundary}\r\n".encode("utf-8"))
    body.write(f'Content-Disposition: form-data; name="document"; filename="nepal_citizenship_clean_1.png"\r\n'.encode("utf-8"))
    body.write(b"Content-Type: image/png\r\n\r\n")
    body.write(file_bytes)
    body.write(b"\r\n")
    body.write(f"--{boundary}--\r\n".encode("utf-8"))
    
    req = urllib.request.Request(
        "http://localhost:5000/api/screen",
        data=body.getvalue(),
        headers={"Content-Type": f"multipart/form-data; boundary={boundary}"},
        method="POST"
    )

    try:
        with urllib.request.urlopen(req) as resp:
            data = json.loads(resp.read().decode("utf-8"))
            print("STATUS CODE:", resp.status)
            print("SUCCESS:", data.get("success"))
            print("RISK LEVEL:", data.get("risk_level"))
            print("RISK SCORE:", data.get("risk_score"))
            print("RISK ACTION:", data.get("risk_action"))
            print("TYPE MISMATCH OBJECT:", json.dumps(data.get("type_mismatch"), indent=2))
            print("RISK REASONS:", data.get("risk_reasons"))
    except urllib.error.HTTPError as e:
        print("HTTP Error:", e.code, e.read().decode("utf-8"))

if __name__ == '__main__':
    test_mismatch_via_api()
