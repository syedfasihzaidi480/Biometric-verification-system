import React from 'react';
import Layout from './components/Layout';
import Nav from './components/Nav';
import Login from './pages/Login';
import PendingVerifications from './pages/PendingVerifications';
import VerificationDetails from './pages/VerificationDetails';
import AdminSettings from './pages/AdminSettings';
import ActivityLog from './pages/ActivityLog';

function Router() {
  const hash = typeof window !== 'undefined' ? window.location.hash : '#/login';
  const route = hash.replace('#', '') || '/login';
  switch (route) {
    case '/pending':
      return <PendingVerifications />;
    case '/details':
      return <VerificationDetails />;
    case '/settings':
      return <AdminSettings />;
    case '/activity':
      return <ActivityLog />;
    default:
      return <Login />;
  }
}

export default function App() {
  return (
    <Layout>
      <Nav />
      <Router />
    </Layout>
  );
}
