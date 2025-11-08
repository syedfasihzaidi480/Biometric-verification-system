const store = { requests: [] };
export async function listRequests(_req, res) {
    return res.json({ success: true, data: { requests: store.requests } });
}
export async function approveRequest(req, res) {
    const { id } = req.params;
    const item = store.requests.find((r) => r.id === id);
    if (!item)
        return res.status(404).json({ success: false, error: { message: 'not_found' } });
    item.status = 'approved';
    return res.json({ success: true, data: { request: item } });
}
export async function rejectRequest(req, res) {
    const { id } = req.params;
    const { notes } = req.body || {};
    const item = store.requests.find((r) => r.id === id);
    if (!item)
        return res.status(404).json({ success: false, error: { message: 'not_found' } });
    item.status = 'rejected';
    item.notes = notes || item.notes;
    return res.json({ success: true, data: { request: item } });
}
// Helper to add a pending request (could be called from verify endpoints in a real app)
export function addPendingRequest(userId) {
    const item = {
        id: 'req_' + Math.random().toString(36).slice(2, 8),
        userId,
        status: 'pending',
        createdAt: new Date().toISOString(),
    };
    store.requests.push(item);
    return item;
}
