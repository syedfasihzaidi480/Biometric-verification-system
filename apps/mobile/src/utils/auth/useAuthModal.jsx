import React, { useEffect, useRef, useState } from 'react';
import { Modal, View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { create } from 'zustand';
import { useCallback, useMemo } from 'react';
import { AuthWebView } from './AuthWebView';
import { useAuthStore, useAuthModal } from './store';


/**
 * This component renders a modal for authentication purposes.
 * To show it programmatically, you should either use the `useRequireAuth` hook or the `useAuthModal` hook.
 *
 * @example
 * ```js
 * import { useAuthModal } from '@/utils/useAuthModal';
 * function MyComponent() {
 * const { open } = useAuthModal();
 * return <Button title="Login" onPress={() => open({ mode: 'signin' })} />;
 * }
 * ```
 *
 * @example
 * ```js
 * import { useRequireAuth } from '@/utils/useAuth';
 * function MyComponent() {
 *   // automatically opens the auth modal if the user is not authenticated
 *   useRequireAuth();
 *   return <Text>Protected Content</Text>;
 * }
 *
 */
export const AuthModal = () => {
  const { isOpen, mode, close } = useAuthModal();
  const { auth } = useAuthStore();

  const snapPoints = useMemo(() => ['100%'], []);
  const proxyURL = process.env.EXPO_PUBLIC_PROXY_BASE_URL;
  const baseURL = process.env.EXPO_PUBLIC_BASE_URL;
  const projectGroupId = process.env.EXPO_PUBLIC_PROJECT_GROUP_ID;
  const host = process.env.EXPO_PUBLIC_HOST;

  const missing = useMemo(() => {
    const keys = [];
    if (!baseURL) keys.push('EXPO_PUBLIC_BASE_URL');
    if (!proxyURL) keys.push('EXPO_PUBLIC_PROXY_BASE_URL');
    if (!projectGroupId) keys.push('EXPO_PUBLIC_PROJECT_GROUP_ID');
    if (!host) keys.push('EXPO_PUBLIC_HOST');
    return keys;
  }, [baseURL, proxyURL, projectGroupId, host]);

  return (
    <Modal
      visible={isOpen && !auth}
      transparent={true}
      animationType="slide"
    >
      <View style={styles.container}>
        {missing.length > 0 ? (
          <View style={styles.fallback}>
            <Text style={styles.title}>Sign-in is not configured</Text>
            <Text style={styles.subtitle}>
              The following environment variables are missing:
            </Text>
            {missing.map((k) => (
              <Text key={k} style={styles.missingItem}>{`• ${k}`}</Text>
            ))}
            <Text style={styles.help}>
              Create an .env file in apps/mobile with these keys, then restart the app. For local dev, set EXPO_PUBLIC_BASE_URL and EXPO_PUBLIC_PROXY_BASE_URL to your web server URL.
            </Text>
            <TouchableOpacity style={styles.closeButton} onPress={close}>
              <Text style={styles.closeButtonText}>Close</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <AuthWebView mode={mode} proxyURL={proxyURL} baseURL={baseURL} />
        )}
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: '100%',
    width: '100%',
    backgroundColor: '#fff',
  },
  fallback: {
    flex: 1,
    padding: 24,
    justifyContent: 'center',
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 8,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 14,
    color: '#374151',
    marginBottom: 8,
    textAlign: 'center',
  },
  missingItem: {
    fontSize: 14,
    color: '#B91C1C',
    marginVertical: 2,
    textAlign: 'center',
  },
  help: {
    fontSize: 12,
    color: '#6B7280',
    marginTop: 12,
    textAlign: 'center',
  },
  closeButton: {
    alignSelf: 'center',
    marginTop: 16,
    backgroundColor: '#111827',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 8,
  },
  closeButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
});

export default useAuthModal;