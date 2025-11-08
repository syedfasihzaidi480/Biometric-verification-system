import React, { PropsWithChildren } from 'react';

export default function Layout({ children }: PropsWithChildren) {
  return (
    <div style={{ display: 'grid', gridTemplateColumns: '200px 1fr', minHeight: '100vh' }}>
      <aside style={{ padding: 16, borderRight: '1px solid #eee' }}>Admin</aside>
      <main style={{ padding: 16 }}>{children}</main>
    </div>
  );
}
