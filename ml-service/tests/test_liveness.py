from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)

def test_liveness_check():
    r = client.post('/liveness/check', files={'image': ('face.jpg', b'x'*123, 'image/jpeg')})
    assert r.status_code == 200
    data = r.json()
    assert 0.5 <= data['liveness'] <= 1.0
    assert isinstance(data['is_live'], bool)
    assert isinstance(data['reasons'], list)
