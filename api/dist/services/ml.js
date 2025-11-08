import axios from 'axios';
const ML_URL = process.env.ML_SERVICE_URL || 'http://localhost:8000';
export async function enrollVoice(files) {
    const form = new (await import('form-data')).default();
    files.forEach((f) => {
        form.append('files', f.buffer, { filename: f.filename, contentType: f.mimetype });
    });
    const res = await axios.post(`${ML_URL}/voice/enroll`, form, { headers: form.getHeaders() });
    return res.data;
}
export async function verifyVoice(enrollmentId, file) {
    const form = new (await import('form-data')).default();
    form.append('enrollment_id', enrollmentId);
    form.append('file', file.buffer, { filename: file.filename, contentType: file.mimetype });
    const res = await axios.post(`${ML_URL}/voice/verify`, form, { headers: form.getHeaders() });
    return res.data;
}
export async function checkLiveness(image) {
    const form = new (await import('form-data')).default();
    form.append('image', image.buffer, { filename: image.filename, contentType: image.mimetype });
    const res = await axios.post(`${ML_URL}/liveness/check`, form, { headers: form.getHeaders() });
    return res.data;
}
export async function verifyDocument(image) {
    const form = new (await import('form-data')).default();
    form.append('image', image.buffer, { filename: image.filename, contentType: image.mimetype });
    const res = await axios.post(`${ML_URL}/document/verify`, form, { headers: form.getHeaders() });
    return res.data;
}
