import { useEffect } from 'react';
import { router } from 'expo-router';

export default function DocumentVerificationRedirect() {
  useEffect(() => {
    router.replace('/document-upload');
  }, []);
  return null;
}
