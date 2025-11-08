import React from 'react';

export default function Nav() {
  return (
    <nav style={{ display: 'flex', gap: 12 }}>
      <a href="#/login">Login</a>
      <a href="#/pending">Pending</a>
      <a href="#/settings">Settings</a>
      <a href="#/activity">Activity</a>
    </nav>
  );
}
