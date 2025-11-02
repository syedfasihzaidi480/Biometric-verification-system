import { getMongoDb } from '@/app/api/utils/mongo'

// Server-Sent Events stream to notify the admin UI of user-related changes
// Emits a lightweight `invalidate` event whenever relevant collections change,
// so the client can refresh the current page/pagination and remain up-to-date.

export async function GET() {
  try {
    const db = await getMongoDb();

    const headers = {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache, no-transform',
      Connection: 'keep-alive',
      // Allow browser to include cookies on same-origin requests
      'X-Accel-Buffering': 'no',
    };

    const stream = new ReadableStream({
      start(controller) {
        const textEncoder = new TextEncoder();
        let closed = false;
        const state = { watchers: [], keepalive: null };

        const safeEnqueue = (text) => {
          if (closed) return;
          try {
            controller.enqueue(textEncoder.encode(text));
          } catch (_) {
            // Ignore writes after close
          }
        };

        const send = (event, data) => {
          const payload = `event: ${event}\n` + `data: ${JSON.stringify(data)}\n\n`;
          safeEnqueue(payload);
        };

        // Initial comment to establish stream
        safeEnqueue(': connected\n\n');

        const collections = [
          { name: 'users', col: db.collection('users') },
          { name: 'voice_profiles', col: db.collection('voice_profiles') },
          { name: 'documents', col: db.collection('documents') },
          { name: 'verification_requests', col: db.collection('verification_requests') },
        ];

        for (const { name, col } of collections) {
          try {
            const changeStream = col.watch([], { fullDocument: 'updateLookup' });
            changeStream.on('change', (change) => {
              if (closed) return;
              const id = change.documentKey?._id || change.fullDocument?.id || change.fullDocument?.user_id || null;
              send('invalidate', { collection: name, op: change.operationType, id, ts: Date.now() });
            });
            changeStream.on('error', (err) => {
              if (closed) return;
              send('error', { collection: name, message: err?.message || String(err) });
            });
            state.watchers.push(changeStream);
          } catch (err) {
            console.warn('[SSE users stream] changeStream not available for', name, err?.message);
          }
        }

        // Keepalive every 15s so proxies don’t kill the stream
        state.keepalive = setInterval(() => {
          safeEnqueue(': keep-alive\n\n');
        }, 15000);

        // Save cleanup on the object so cancel() can access
        this.__state = { state, close() { closed = true; } };
      },
      cancel() {
        const st = this.__state?.state;
        if (!st) return;
        // Stop keepalive and close watchers
        if (st.keepalive) clearInterval(st.keepalive);
        for (const w of st.watchers) {
          try { w.close(); } catch {}
        }
        if (this.__state?.close) this.__state.close();
      },
    });

    return new Response(stream, { headers });
  } catch (error) {
    console.error('[SSE users stream] Error setting up stream:', error);
    return new Response('Internal Server Error', { status: 500 });
  }
}
