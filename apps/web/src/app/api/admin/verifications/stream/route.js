import { getMongoDb } from '@/app/api/utils/mongo'

// SSE for verification requests. Emits 'invalidate' events on changes.
export async function GET() {
  try {
    const db = await getMongoDb();

    const headers = {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache, no-transform',
      Connection: 'keep-alive',
      'X-Accel-Buffering': 'no',
    };

    const stream = new ReadableStream({
      start(controller) {
        const enc = new TextEncoder();
        let closed = false;
        const state = { watchers: [], keepalive: null };

        const write = (s) => {
          if (closed) return;
          try { controller.enqueue(enc.encode(s)); } catch {}
        };

        write(': connected\n\n');

        const collections = [
          { name: 'verification_requests', col: db.collection('verification_requests') },
          { name: 'documents', col: db.collection('documents') },
          { name: 'voice_profiles', col: db.collection('voice_profiles') },
          { name: 'users', col: db.collection('users') },
        ];

        const sendInvalidate = (collection, change) => {
          const payload = { collection, op: change.operationType, id: change.documentKey?._id || change.fullDocument?.id || null, ts: Date.now() };
          write(`event: invalidate\n`);
          write(`data: ${JSON.stringify(payload)}\n\n`);
        };

        for (const { name, col } of collections) {
          try {
            const cs = col.watch([], { fullDocument: 'updateLookup' });
            cs.on('change', (ch) => { if (!closed) sendInvalidate(name, ch); });
            cs.on('error', (err) => {
              if (closed) return;
              write(`event: error\n`);
              write(`data: ${JSON.stringify({ collection: name, message: err?.message || String(err) })}\n\n`);
            });
            state.watchers.push(cs);
          } catch (err) {
            console.warn('[SSE verifications stream] changeStream not available for', name, err?.message);
          }
        }

        state.keepalive = setInterval(() => write(': keep-alive\n\n'), 15000);

        this.__state = { state, close() { closed = true; } };
      },
      cancel() {
        const st = this.__state?.state;
        if (!st) return;
        if (st.keepalive) clearInterval(st.keepalive);
        for (const w of st.watchers) { try { w.close(); } catch {} }
        if (this.__state?.close) this.__state.close();
      },
    });

    return new Response(stream, { headers });
  } catch (error) {
    console.error('[SSE verifications stream] Error:', error);
    return new Response('Internal Server Error', { status: 500 });
  }
}
