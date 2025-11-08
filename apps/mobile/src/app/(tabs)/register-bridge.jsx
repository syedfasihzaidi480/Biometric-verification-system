import React from 'react';
import { Redirect } from 'expo-router';

// Bridge screen to avoid route name conflicts; keeps Tabs child name stable
export default function RegisterBridge() {
  return <Redirect href="/(tabs)/register" />;
}
