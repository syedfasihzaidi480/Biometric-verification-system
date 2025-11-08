from fastapi import FastAPI, File, UploadFile, Form
from pydantic import BaseModel
from typing import List, Optional
import hashlib
import base64

app = FastAPI(title="ML Service", version="0.1.0")


@app.get("/health")
async def health():
    return {"success": True, "data": {"status": "ok"}}


class VoiceEnrollResponse(BaseModel):
    enrollment_id: str
    samples: int


class VoiceVerifyResponse(BaseModel):
    match_score: float
    is_match: bool


class LivenessResponse(BaseModel):
    liveness: float
    is_live: bool
    reasons: List[str]


class DocumentVerifyResponse(BaseModel):
    text_extracted: str
    tamper_flag: bool
    face_region_base64: Optional[str] = None


def _hash_bytes(b: bytes) -> str:
    return hashlib.sha256(b).hexdigest()


@app.post("/voice/enroll", response_model=VoiceEnrollResponse)
async def voice_enroll(files: List[UploadFile] = File(...)):
    # Deterministic placeholder: enrollment_id is hash of all bytes
    all_bytes = b""
    for f in files:
        chunk = await f.read()
        all_bytes += chunk
    digest = _hash_bytes(all_bytes) if all_bytes else _hash_bytes(b"empty")
    return VoiceEnrollResponse(enrollment_id=digest[:16], samples=len(files))


@app.post("/voice/verify", response_model=VoiceVerifyResponse)
async def voice_verify(enrollment_id: str = Form(...), file: UploadFile = File(...)):
    # Deterministic score: compare hash prefixes
    audio = await file.read()
    audio_hash = _hash_bytes(audio)
    # Compute pseudo similarity by counting matching prefix chars
    match_chars = 0
    for a, b in zip(enrollment_id, audio_hash):
        if a == b:
            match_chars += 1
        else:
            break
    # Normalize score between 0.5 and 0.98
    score = 0.5 + min(match_chars / 16.0, 1.0) * 0.48
    return VoiceVerifyResponse(match_score=round(score, 4), is_match=score >= 0.75)


@app.post("/liveness/check", response_model=LivenessResponse)
async def liveness_check(image: UploadFile = File(...)):
    content = await image.read()
    # Deterministic liveness from size
    lv = 0.5 + ((len(content) % 100) / 100.0) * 0.5
    reasons: List[str] = []
    if lv < 0.7:
        reasons.append("face_not_centered")
    if lv < 0.6:
        reasons.append("low_brightness")
    return LivenessResponse(liveness=round(lv, 4), is_live=lv >= 0.75, reasons=reasons)


@app.post("/document/verify", response_model=DocumentVerifyResponse)
async def document_verify(image: UploadFile = File(...)):
    content = await image.read()
    digest = _hash_bytes(content)
    text = f"DOC-{digest[:10]}"
    tamper = (len(content) % 2) == 1
    face_region = base64.b64encode(b"placeholder_region").decode("utf-8")
    return DocumentVerifyResponse(
        text_extracted=text,
        tamper_flag=tamper,
        face_region_base64=face_region,
    )
