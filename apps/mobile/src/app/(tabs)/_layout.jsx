import React from 'react';
import { Tabs } from 'expo-router';
import { Home, ShieldCheck, User, UserPlus } from 'lucide-react-native';

export default function TabLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          backgroundColor: '#FFFFFF',
          borderTopWidth: 1,
          borderTopColor: '#E5E7EB',
          paddingTop: 4,
          paddingBottom: 4,
          height: 60,
        },
        tabBarActiveTintColor: '#3B82F6',
        tabBarInactiveTintColor: '#6B7280',
        tabBarLabelStyle: {
          fontSize: 12,
          fontWeight: '500',
          marginBottom: 4,
        },
      }}
      initialRouteName="index"
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Home',
          tabBarIcon: ({ color, size = 24 }) => (
            <Home color={color} size={size} />
          ),
        }}
      />
      <Tabs.Screen
        name="verify"
        options={{
          title: 'Verify',
          tabBarIcon: ({ color, size = 24 }) => (
            <ShieldCheck color={color} size={size} />
          ),
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Profile',
          tabBarIcon: ({ color, size = 24 }) => (
            <User color={color} size={size} />
          ),
        }}
      />
      <Tabs.Screen
        name="register/index"
        options={{
          title: 'Register',
          tabBarIcon: ({ color, size = 24 }) => (
            <UserPlus color={color} size={size} />
          ),
        }}
      />
      <Tabs.Screen
        name="register-bridge"
        options={{
          href: null, // This hides it from the tab bar
        }}
      />
    </Tabs>
  );
}