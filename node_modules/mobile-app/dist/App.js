import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState } from 'react';
import { SafeAreaView, View, StyleSheet } from 'react-native';
import Onboarding from './screens/Onboarding';
import RegisterVoice from './screens/RegisterVoice';
import LoginVoice from './screens/LoginVoice';
import LivenessCamera from './screens/LivenessCamera';
import DocumentUpload from './screens/DocumentUpload';
import DashboardHome from './screens/DashboardHome';
import Button from './components/Button';
export default function App() {
    const [screen, setScreen] = useState('onboarding');
    return (_jsxs(SafeAreaView, { style: styles.container, children: [screen === 'onboarding' && (_jsx(Onboarding, { onContinue: () => setScreen('enroll') })), screen === 'enroll' && (_jsx(RegisterVoice, { onComplete: () => setScreen('login') })), screen === 'login' && (_jsx(LoginVoice, { onSuccess: () => setScreen('liveness') })), screen === 'liveness' && (_jsx(LivenessCamera, { onDone: () => setScreen('document') })), screen === 'document' && (_jsx(DocumentUpload, { onUploaded: () => setScreen('dashboard') })), screen === 'dashboard' && (_jsxs(View, { style: { flex: 1 }, children: [_jsx(DashboardHome, {}), _jsx(View, { style: { padding: 16 }, children: _jsx(Button, { label: "Restart", onPress: () => setScreen('onboarding') }) })] }))] }));
}
const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#fff' }
});
