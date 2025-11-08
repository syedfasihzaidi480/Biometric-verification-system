import React, { useState } from 'react';
import { SafeAreaView, View, StyleSheet } from 'react-native';
import Onboarding from './screens/Onboarding';
import RegisterVoice from './screens/RegisterVoice';
import LoginVoice from './screens/LoginVoice';
import LivenessCamera from './screens/LivenessCamera';
import DocumentUpload from './screens/DocumentUpload';
import DashboardHome from './screens/DashboardHome';
import VerificationCenter from './screens/VerificationCenter';
import Button from './components/Button';
import {
  VerificationProvider,
  useVerificationStatus,
} from './hooks/useVerificationStatus';

// Minimal screen switcher without react-navigation to keep dependencies light in scaffold

type Screen =
  | 'onboarding'
  | 'enroll'
  | 'login'
  | 'liveness'
  | 'document'
  | 'dashboard'
  | 'verification';

const Navigator = () => {
  const [screen, setScreen] = useState<Screen>('onboarding');
  const { reset } = useVerificationStatus();

  const handleRestart = () => {
    reset();
    setScreen('onboarding');
  };

  return (
    <>
      {screen === 'onboarding' && (
        <Onboarding onContinue={() => setScreen('enroll')} />
      )}

      {screen === 'enroll' && (
        <RegisterVoice onComplete={() => setScreen('login')} />
      )}

      {screen === 'login' && (
        <LoginVoice onSuccess={() => setScreen('liveness')} />
      )}

      {screen === 'liveness' && (
        <LivenessCamera onDone={() => setScreen('document')} />
      )}

      {screen === 'document' && (
        <DocumentUpload onUploaded={() => setScreen('dashboard')} />
      )}

      {screen === 'dashboard' && (
        <View style={{ flex: 1 }}>
          <DashboardHome onOpenVerify={() => setScreen('verification')} />
          <View style={{ padding: 16 }}>
            <Button label="Restart" onPress={handleRestart} />
          </View>
        </View>
      )}

      {screen === 'verification' && (
        <VerificationCenter onBack={() => setScreen('dashboard')} />
      )}
    </>
  );
};

export default function App() {
  return (
    <VerificationProvider>
      <SafeAreaView style={styles.container}>
        <Navigator />
      </SafeAreaView>
    </VerificationProvider>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' }
});
