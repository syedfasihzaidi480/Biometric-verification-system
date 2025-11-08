import { jsxs as _jsxs, jsx as _jsx } from "react/jsx-runtime";
import { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
export const VoiceRecorder = ({ onRecorded }) => {
    const [isRecording, setIsRecording] = useState(false);
    const [duration, setDuration] = useState(0);
    const toggle = () => {
        if (!isRecording) {
            setIsRecording(true);
            setDuration(0);
            // Fake timer
            setTimeout(() => setDuration(3), 300);
        }
        else {
            setIsRecording(false);
            onRecorded?.('file://fake/audio.m4a');
        }
    };
    return (_jsxs(View, { style: styles.wrap, children: [isRecording && _jsxs(Text, { style: styles.time, children: [duration, "s"] }), _jsx(TouchableOpacity, { style: [styles.btn, isRecording && styles.btnActive], onPress: toggle, children: _jsx(Text, { style: styles.btnText, children: isRecording ? 'Stop' : 'Record' }) })] }));
};
const styles = StyleSheet.create({
    wrap: { alignItems: 'center' },
    time: { marginBottom: 12, fontSize: 18, fontWeight: '600' },
    btn: {
        width: 100,
        height: 100,
        borderRadius: 50,
        backgroundColor: '#007AFF',
        alignItems: 'center',
        justifyContent: 'center'
    },
    btnActive: { backgroundColor: '#EF4444' },
    btnText: { color: '#fff', fontWeight: '700' }
});
export default VoiceRecorder;
