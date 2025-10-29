import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Alert,
} from "react-native";
import { StatusBar } from "expo-status-bar";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { router } from "expo-router";
import { ArrowLeft, Phone, Shield, User } from "lucide-react-native";
import { useTranslation } from "@/i18n/useTranslation";
import { apiFetchJson } from "@/utils/api";

export default function LoginScreen() {
  const insets = useSafeAreaInsets();
  const { t } = useTranslation();

  const [formData, setFormData] = useState({
    loginField: "",
    loginType: "auto", // auto, phone, pension
  });

  const [errors, setErrors] = useState({});
  const [isLoading, setIsLoading] = useState(false);

  const detectLoginType = (value) => {
    // If it looks like a phone number (starts with + or contains () or -)
    if (/^[\+\(]|[\(\)\-\s]/.test(value) || /^\d{10,}$/.test(value.replace(/\s/g, ''))) {
      return 'phone';
    }
    // Otherwise assume it's a pension number
    return 'pension';
  };

  const validateForm = () => {
    const newErrors = {};

    if (!formData.loginField.trim()) {
      newErrors.loginField = "Please enter your phone number or pension number";
      setErrors(newErrors);
      return false;
    }

    setErrors({});
    return true;
  };

  const handleSubmit = async () => {
    if (!validateForm()) {
      return;
    }

    setIsLoading(true);

    try {
      const loginType = detectLoginType(formData.loginField);
      const loginData = loginType === 'phone' 
        ? { phone: formData.loginField.trim() }
        : { pension_number: formData.loginField.trim() };

      const result = await apiFetchJson("/api/auth/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: loginData,
      });

      if (result.success) {
        // User found, proceed to voice verification
        router.push({
          pathname: "/voice-verification",
          params: { 
            userId: result.data.user.id,
            userName: result.data.user.name,
            dateOfBirth: result.data.user.date_of_birth,
            returnUrl: "/dashboard"
          },
        });
      } else {
        Alert.alert(
          t("common.error"),
          result.error?.message || "User not found. Please check your details.",
        );
      }
    } catch (error) {
      console.error("Login error:", error);
      Alert.alert(t("common.error"), t("errors.network"));
    } finally {
      setIsLoading(false);
    }
  };

  const updateFormData = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: "" }));
    }
  };

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
    >
      <View style={[styles.container, { paddingTop: insets.top }]}>
        <StatusBar style="dark" />

        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => router.back()}
          >
            <ArrowLeft size={24} color="#333" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Sign In</Text>
          <View style={styles.headerSpacer} />
        </View>

        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* Welcome */}
          <View style={styles.welcomeContainer}>
            <Text style={styles.welcomeTitle}>Welcome Back</Text>
            <Text style={styles.welcomeSubtitle}>
              Sign in with your phone number or pension number
            </Text>
          </View>

          {/* Form */}
          <View style={styles.form}>
            {/* Login Field */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Phone Number or Pension Number *</Text>
              <View
                style={[
                  styles.inputContainer,
                  errors.loginField && styles.inputError,
                ]}
              >
                <User size={20} color="#666" style={styles.inputIcon} />
                <TextInput
                  style={styles.textInput}
                  value={formData.loginField}
                  onChangeText={(value) => updateFormData("loginField", value)}
                  placeholder="Enter phone number or pension number"
                  autoCapitalize="none"
                />
              </View>
              {errors.loginField && (
                <Text style={styles.errorText}>{errors.loginField}</Text>
              )}
            </View>

            {/* Login Type Hint */}
            <View style={styles.hintContainer}>
              <View style={styles.hintRow}>
                <Phone size={16} color="#6B7280" />
                <Text style={styles.hintText}>Phone: +1 (555) 123-4567</Text>
              </View>
              <View style={styles.hintRow}>
                <Shield size={16} color="#6B7280" />
                <Text style={styles.hintText}>Pension: ABC123456</Text>
              </View>
            </View>

            {/* Terms */}
            <Text style={styles.terms}>
              By signing in, you agree to our Terms of Service and Privacy Policy
            </Text>
          </View>
        </ScrollView>

        {/* Sign In Button */}
        <View style={styles.footer}>
          <TouchableOpacity
            style={[
              styles.loginButton,
              isLoading && styles.loginButtonDisabled,
            ]}
            onPress={handleSubmit}
            disabled={isLoading}
          >
            <Text style={styles.loginButtonText}>
              {isLoading ? t("common.loading") : "Sign In"}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.registerLink}
            onPress={() => router.push("/registration")}
          >
            <Text style={styles.registerText}>
              Don't have an account? <Text style={styles.registerTextBold}>Register</Text>
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#FFFFFF",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#F3F4F6",
  },
  backButton: {
    padding: 4,
  },
  headerTitle: {
    flex: 1,
    fontSize: 18,
    fontWeight: "600",
    color: "#1F2937",
    textAlign: "center",
  },
  headerSpacer: {
    width: 32,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 20,
  },
  welcomeContainer: {
    paddingHorizontal: 24,
    paddingTop: 40,
    paddingBottom: 32,
    alignItems: "center",
  },
  welcomeTitle: {
    fontSize: 28,
    fontWeight: "700",
    color: "#1F2937",
    marginBottom: 8,
  },
  welcomeSubtitle: {
    fontSize: 16,
    color: "#6B7280",
    textAlign: "center",
    lineHeight: 22,
  },
  form: {
    paddingHorizontal: 24,
  },
  inputGroup: {
    marginBottom: 24,
  },
  label: {
    fontSize: 14,
    fontWeight: "500",
    color: "#374151",
    marginBottom: 8,
  },
  inputContainer: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#D1D5DB",
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 16,
    backgroundColor: "#F9FAFB",
  },
  inputError: {
    borderColor: "#EF4444",
    backgroundColor: "#FEF2F2",
  },
  inputIcon: {
    marginRight: 12,
  },
  textInput: {
    flex: 1,
    fontSize: 16,
    color: "#1F2937",
  },
  errorText: {
    fontSize: 12,
    color: "#EF4444",
    marginTop: 4,
    marginLeft: 4,
  },
  hintContainer: {
    marginBottom: 24,
    paddingHorizontal: 16,
    paddingVertical: 16,
    backgroundColor: "#F8FAFC",
    borderRadius: 8,
    borderLeftWidth: 3,
    borderLeftColor: "#3B82F6",
  },
  hintRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 6,
  },
  hintText: {
    fontSize: 12,
    color: "#6B7280",
    marginLeft: 8,
  },
  terms: {
    fontSize: 12,
    color: "#6B7280",
    lineHeight: 18,
    textAlign: "center",
    marginBottom: 24,
  },
  footer: {
    paddingHorizontal: 24,
    paddingVertical: 20,
    paddingBottom: 20,
    borderTopWidth: 1,
    borderTopColor: "#F3F4F6",
  },
  loginButton: {
    backgroundColor: "#007AFF",
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: "center",
    marginBottom: 16,
  },
  loginButtonDisabled: {
    backgroundColor: "#9CA3AF",
  },
  loginButtonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "600",
  },
  registerLink: {
    alignItems: "center",
  },
  registerText: {
    fontSize: 14,
    color: "#6B7280",
  },
  registerTextBold: {
    color: "#007AFF",
    fontWeight: "600",
  },
});