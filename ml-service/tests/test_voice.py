from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)

def test_voice_enroll_and_verify():
    # Enroll with two small files
    files = [
        ('files', ('a.wav', b'aaa', 'audio/wav')),
        ('files', ('b.wav', b'bbb', 'audio/wav')),
    ]
    r = client.post('/voice/enroll', files=files)
    assert r.status_code == 200
    data = r.json()
    assert data['samples'] == 2
    enrollment_id = data['enrollment_id']
    assert isinstance(enrollment_id, str) and len(enrollment_id) == 16

    # Verify with a small file
    r2 = client.post(
        '/voice/verify',
        data={'enrollment_id': enrollment_id},
        files={'file': ('c.wav', b'ccc', 'audio/wav')}
    )
    assert r2.status_code == 200
    res = r2.json()
    assert 0.5 <= res['match_score'] <= 0.98
    assert isinstance(res['is_match'], bool)
