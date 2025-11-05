import { useEffect } from 'react';
import { router } from 'expo-router';

export default function FaceVerificationRedirect() {
  useEffect(() => {
    router.replace('/liveness-check');
  }, []);
  return null;
}
