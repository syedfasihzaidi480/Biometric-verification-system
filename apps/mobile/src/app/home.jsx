import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAuth } from '@/utils/auth/useAuth';
import { useTranslation } from '@/i18n/useTranslation';

export default function HomeScreen() {
  const insets = useSafeAreaInsets();
  const { signOut, auth } = useAuth();
  const { t } = useTranslation();

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <StatusBar style="dark" />
      
      <View style={styles.content}>
        <Text style={styles.title}>Welcome Home!</Text>
        <Text style={styles.subtitle}>You are now authenticated</Text>
        
        {auth && (
          <View style={styles.userInfo}>
            <Text style={styles.infoText}>User: {auth.name || 'Unknown'}</Text>
          </View>
        )}

        <TouchableOpacity
          style={styles.signOutButton}
          onPress={signOut}
        >
          <Text style={styles.signOutButtonText}>
            {t('common.signOut') || 'Sign Out'}
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 24,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#1F2937',
    marginBottom: 12,
  },
  subtitle: {
    fontSize: 16,
    color: '#6B7280',
    marginBottom: 32,
  },
  userInfo: {
    backgroundColor: '#F9FAFB',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 8,
    marginBottom: 32,
  },
  infoText: {
    fontSize: 14,
    color: '#374151',
  },
  signOutButton: {
    backgroundColor: '#EF4444',
    paddingVertical: 12,
    paddingHorizontal: 32,
    borderRadius: 8,
  },
  signOutButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});
