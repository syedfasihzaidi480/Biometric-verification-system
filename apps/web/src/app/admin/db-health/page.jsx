"use client";
import { useState } from 'react';

export default function DbHealthPage() {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);

  async function runCheck() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/admin/db-health', { cache: 'no-store' });
      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json?.error?.message || `Request failed with status ${res.status}`);
      }
      setResult(json.data);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={{ padding: 24, maxWidth: 900, margin: '0 auto' }}>
      <h1>Database Health Check</h1>
      <p>This tool inspects MongoDB indexes and flags missing, mismatched, or legacy indexes.</p>
      <button onClick={runCheck} disabled={loading} style={{ padding: '8px 16px' }}>
        {loading ? 'Checking…' : 'Run DB health check'}
      </button>

      {error && (
        <div style={{ marginTop: 16, color: 'crimson' }}>
          <strong>Error:</strong> {error}
        </div>
      )}

      {result && (
        <div style={{ marginTop: 24 }}>
          <h2>Summary</h2>
          <p>
            Overall status: {result.ok ? (
              <span style={{ color: 'green' }}>OK</span>
            ) : (
              <span style={{ color: 'orange' }}>Issues found</span>
            )}
          </p>

          {result.suggestions && result.suggestions.length > 0 && (
            <div>
              <h3>Suggestions</h3>
              <ul>
                {result.suggestions.map((s, i) => (
                  <li key={i}>{s}</li>
                ))}
              </ul>
            </div>
          )}

          {result.byCollection && (
            <div style={{ marginTop: 16 }}>
              <h3>Collections</h3>
              {Object.entries(result.byCollection).map(([col, info]) => (
                <div key={col} style={{ border: '1px solid #eee', padding: 12, borderRadius: 8, marginBottom: 12 }}>
                  <h4 style={{ margin: '4px 0 8px' }}>{col}</h4>
                  <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap' }}>
                    <div>
                      <strong>OK:</strong>
                      <ul>
                        {info.ok.length ? info.ok.map((n) => <li key={n}>{n}</li>) : <li>None</li>}
                      </ul>
                    </div>
                    <div>
                      <strong>Missing:</strong>
                      <ul>
                        {info.missing.length ? info.missing.map((n) => <li key={n}>{n}</li>) : <li>None</li>}
                      </ul>
                    </div>
                    <div>
                      <strong>Mismatched:</strong>
                      <ul>
                        {info.mismatched.length ? info.mismatched.map((m) => (
                          <li key={m.name}>
                            {m.name}
                            <details>
                              <summary>Details</summary>
                              <pre style={{ whiteSpace: 'pre-wrap' }}>{JSON.stringify(m, null, 2)}</pre>
                            </details>
                          </li>
                        )) : <li>None</li>}
                      </ul>
                    </div>
                    <div>
                      <strong>Legacy present:</strong>
                      <ul>
                        {info.legacyPresent.length ? info.legacyPresent.map((n) => <li key={n}>{n}</li>) : <li>None</li>}
                      </ul>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
