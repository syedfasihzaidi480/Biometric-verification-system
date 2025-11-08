import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
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
            return _jsx(PendingVerifications, {});
        case '/details':
            return _jsx(VerificationDetails, {});
        case '/settings':
            return _jsx(AdminSettings, {});
        case '/activity':
            return _jsx(ActivityLog, {});
        default:
            return _jsx(Login, {});
    }
}
export default function App() {
    return (_jsxs(Layout, { children: [_jsx(Nav, {}), _jsx(Router, {})] }));
}
