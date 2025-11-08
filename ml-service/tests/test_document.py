from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)

def test_document_verify():
    r = client.post('/document/verify', files={'image': ('id.png', b'\x00\x01\x02\x03', 'image/png')})
    assert r.status_code == 200
    data = r.json()
    assert data['text_extracted'].startswith('DOC-')
    assert isinstance(data['tamper_flag'], bool)
    assert isinstance(data['face_region_base64'], str)
