import React, { useEffect, useState } from "react";
import { Redirect } from "expo-router";
import { hasSeenOnboarding, resetOnboarding } from "@/utils/onboarding";
import { View, ActivityIndicator } from "react-native";

export default function Index() {
  const [isLoading, setIsLoading] = useState(true);
  const [showOnboarding, setShowOnboarding] = useState(false);

  useEffect(() => {
    checkOnboardingStatus();
  }, []);

  const checkOnboardingStatus = async () => {
    try {
      // TEMPORARY: Uncomment the line below to reset onboarding and see it again
      await resetOnboarding();
      
      const hasSeen = await hasSeenOnboarding();
      console.log("Has seen onboarding:", hasSeen);
      setShowOnboarding(!hasSeen);
    } catch (error) {
      console.error("Error checking onboarding status:", error);
      setShowOnboarding(false);
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
        <ActivityIndicator size="large" color="#667eea" />
      </View>
    );
  }

  // Redirect to onboarding if user hasn't seen it, otherwise go to tabs home screen
  return <Redirect href={showOnboarding ? "/onboarding" : "/(tabs)/"} />;
}
