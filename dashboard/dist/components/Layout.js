import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
export default function Layout({ children }) {
    return (_jsxs("div", { style: { display: 'grid', gridTemplateColumns: '200px 1fr', minHeight: '100vh' }, children: [_jsx("aside", { style: { padding: 16, borderRight: '1px solid #eee' }, children: "Admin" }), _jsx("main", { style: { padding: 16 }, children: children })] }));
}
