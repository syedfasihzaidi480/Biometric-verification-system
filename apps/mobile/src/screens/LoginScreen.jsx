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
import { ArrowLeft, Mail, Phone, Mic } from "lucide-react-native";
import { useTranslation } from "@/i18n/useTranslation";
import PhoneNumberInput from "@/components/PhoneNumberInput";
import PasswordPhoneInput from "@/components/PasswordPhoneInput";
import VoiceLoginModal from "@/components/VoiceLoginModal";

export default function LoginScreen() {
  const insets = useSafeAreaInsets();
  const { t } = useTranslation();

  const [authMode, setAuthMode] = useState("phone");
  const [formData, setFormData] = useState({
    email: "",
    loginPhone: "",
    passwordPhone: "",
  });
  const [errors, setErrors] = useState({});
  const [isLoading, setIsLoading] = useState(false);
  const [isLoginPhoneValid, setIsLoginPhoneValid] = useState(false);
  const [showVoiceLogin, setShowVoiceLogin] = useState(false);

  const validateForm = () => {
    const newErrors = {};
    const emailValue = formData.email.trim();

    if (authMode === "email") {
      if (!emailValue) {
        newErrors.email = t("login.emailRequired", { defaultValue: "Email is required" });
      } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(emailValue)) {
        newErrors.email = t("login.validEmail", { defaultValue: "Please enter a valid email address" });
      }
      
      if (!formData.passwordPhone.trim()) {
        newErrors.passwordPhone = t("login.passwordRequired", { defaultValue: "Password is required" });
      }
    } else {
      if (!formData.loginPhone.trim()) {
        newErrors.loginPhone = t("login.phoneRequired", { defaultValue: "Phone number is required" });
      } else if (!isLoginPhoneValid) {
        newErrors.loginPhone = t("login.validPhone", { defaultValue: "Please enter a valid phone number" });
      }

      if (!formData.passwordPhone.trim()) {
        newErrors.passwordPhone = t("login.passwordRequired", { defaultValue: "Password is required" });
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validateForm()) {
      return;
    }

    setIsLoading(true);

    try {
      const { signInWithCredentials } = await import("@/utils/auth/credentials");
      const emailValue = formData.email.trim();
      const loginPhoneValue = formData.loginPhone.trim();
      const identifier = authMode === "email" ? emailValue : loginPhoneValue;

      const result = await signInWithCredentials({
        identifier,
        email: authMode === "email" ? emailValue : undefined,
        phone: authMode === "phone" ? loginPhoneValue : undefined,
        password: formData.passwordPhone.trim(),
        callbackUrl: "/(tabs)",
      });

      if (result.ok && result.session) {
        Alert.alert(
          t("common.success", { defaultValue: "Success" }),
          t("login.signInSuccess", { defaultValue: "You have successfully signed in!" }),
          [
            {
              text: t("common.ok", { defaultValue: "OK" }),
              onPress: () => router.replace("/(tabs)"),
            },
          ]
        );
        return;
      }

      const lowerError = result.error?.toLowerCase?.() || "";
      let errorMessage = t("login.invalidCredentials", { defaultValue: "Invalid credentials. Please try again." });
      if (lowerError.includes("no session")) {
        errorMessage = t("login.noSession", { defaultValue: "Unable to establish session. Please check your credentials and try again." });
      } else if (lowerError.includes("invalid")) {
        errorMessage = t("login.incorrectCredentials", { defaultValue: "The credentials you entered are incorrect. If you don't have an account, please register first." });
      }

      Alert.alert(
        t("login.signInFailed", { defaultValue: "Sign In Failed" }),
        errorMessage,
        [
          { text: t("registration.register", { defaultValue: "Register" }), onPress: () => router.push("/registration") },
          { text: t("common.tryAgain", { defaultValue: "Try Again" }), style: "cancel" },
        ]
      );
    } catch (error) {
      console.error("[LoginScreen] Login error:", error);
      Alert.alert(
        t("common.error", { defaultValue: "Error" }), 
        error.message || t("errors.server", { defaultValue: "Something went wrong. Please try again." })
      );
    } finally {
      setIsLoading(false);
    }
  };

  const updateFormData = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: "" }));
    }
  };

  const handleVoiceLoginSuccess = async (userData) => {
    // Voice authentication successful, sign in the user
    try {
      const { signInWithCredentials } = await import("@/utils/auth/credentials");
      
      // Use the auth_user_id from voice auth to establish session
      const result = await signInWithCredentials({
        identifier: userData.email || userData.phone,
        email: userData.email,
        phone: userData.phone,
        voiceAuthenticated: true,
        userId: userData.auth_user_id,
        callbackUrl: "/(tabs)",
      });

      if (result.ok && result.session) {
        Alert.alert(
          t("common.success", { defaultValue: "Success" }),
          t("login.voiceLoginSuccess", { defaultValue: "Voice authentication successful!" }),
          [
            {
              text: t("common.ok", { defaultValue: "OK" }),
              onPress: () => router.replace("/(tabs)"),
            },
          ]
        );
      } else {
        Alert.alert(
          t("login.signInFailed", { defaultValue: "Sign In Failed" }),
          t("login.voiceAuthSessionFailed", { defaultValue: "Failed to establish session after voice authentication." })
        );
      }
    } catch (error) {
      console.error("Voice login session error:", error);
      Alert.alert(
        t("common.error", { defaultValue: "Error" }),
        t("errors.network", { defaultValue: "Network error. Please try again." })
      );
    }
  };

  const handleVoiceLoginPress = () => {
    // Get identifier (email or phone) from form
    const identifier = authMode === "email" 
      ? formData.email.trim() 
      : formData.loginPhone.trim();

    if (!identifier) {
      Alert.alert(
        t("voiceLogin.identifierRequired", { defaultValue: "Identifier Required" }),
        t("voiceLogin.identifierRequiredMessage", { 
          defaultValue: "Please enter your email or phone number first to use voice login." 
        })
      );
      return;
    }

    setShowVoiceLogin(true);
  };

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
    >
      <View style={[styles.container, { paddingTop: insets.top }]}>        
        <StatusBar style="dark" />

        <View style={styles.header}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => router.back()}
          >
            <ArrowLeft size={24} color="#333" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>{t("auth.signIn", { defaultValue: "Sign In" })}</Text>
          <View style={styles.headerSpacer} />
        </View>

        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.welcomeContainer}>
            <Text style={styles.welcomeTitle}>{t("login.welcomeBack", { defaultValue: "Welcome Back" })}</Text>
            <Text style={styles.welcomeSubtitle}>
              {t("login.signInToAccount", { defaultValue: "Sign in to your account" })}
            </Text>
          </View>

          <View style={styles.form}>
            <Text style={styles.modeToggleLabel}>{t("login.signInUsing", { defaultValue: "Sign in using" })}</Text>
            <View style={styles.modeToggleRow}>
              <TouchableOpacity
                style={[styles.modeButton, authMode === "phone" && styles.modeButtonActive]}
                onPress={() => {
                  setAuthMode("phone");
                  setErrors((prev) => ({ ...prev, email: "" }));
                }}
              >
                <Text style={[styles.modeButtonText, authMode === "phone" && styles.modeButtonTextActive]}>
                  {t("login.phone", { defaultValue: "Phone" })}
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modeButton, authMode === "email" && styles.modeButtonActive]}
                onPress={() => {
                  setAuthMode("email");
                  setErrors((prev) => ({ ...prev, loginPhone: "" }));
                }}
              >
                <Text style={[styles.modeButtonText, authMode === "email" && styles.modeButtonTextActive]}>
                  {t("login.email", { defaultValue: "Email" })}
                </Text>
              </TouchableOpacity>
            </View>
            <Text style={styles.modeToggleHelper}>
              {authMode === "phone"
                ? t("login.usePhoneNumber", { defaultValue: "Use your phone number" })
                : t("login.useEmailAddress", { defaultValue: "Use your email address" })}
            </Text>

            {authMode === "email" ? (
              <View style={styles.inputGroup}>
                <Text style={styles.label}>{t("login.emailAddress", { defaultValue: "Email Address" })}</Text>
                <View style={[styles.inputContainer, errors.email && styles.inputError]}>
                  <Mail size={20} color="#666" style={styles.inputIcon} />
                  <TextInput
                    style={styles.textInput}
                    value={formData.email}
                    onChangeText={(value) => updateFormData("email", value)}
                    placeholder={t("login.emailPlaceholder", { defaultValue: "you@example.com" })}
                    autoCapitalize="none"
                    keyboardType="email-address"
                    autoComplete="email"
                  />
                </View>
                {errors.email ? <Text style={styles.errorText}>{errors.email}</Text> : null}
              </View>
            ) : (
              <View style={styles.inputGroup}>
                <Text style={styles.label}>{t("login.phoneNumber", { defaultValue: "Phone Number" })}</Text>
                <PhoneNumberInput
                  value={formData.loginPhone}
                  onChangeText={(value) => updateFormData("loginPhone", value)}
                  onValidationChange={setIsLoginPhoneValid}
                  placeholder={t("login.phonePlaceholder", { defaultValue: "Enter your phone number" })}
                  error={!!errors.loginPhone}
                />
                {errors.loginPhone ? <Text style={styles.errorText}>{errors.loginPhone}</Text> : null}
              </View>
            )}

            <View style={styles.inputGroup}>
              <Text style={styles.label}>
                {t("login.password", { defaultValue: "Password" })}
              </Text>
              <PasswordPhoneInput
                value={formData.passwordPhone}
                onChangeText={(value) => updateFormData("passwordPhone", value)}
                placeholder={t("login.passwordPlaceholder", { defaultValue: "••••••••" })}
                error={!!errors.passwordPhone}
              />
              {errors.passwordPhone ? <Text style={styles.errorText}>{errors.passwordPhone}</Text> : null}
            </View>

            <Text style={styles.terms}>
              {t("login.termsAgreement", { defaultValue: "By signing in, you agree to our Terms of Service and Privacy Policy" })}
            </Text>
          </View>
        </ScrollView>

        <View style={styles.footer}>
          <TouchableOpacity
            style={[styles.loginButton, isLoading && styles.loginButtonDisabled]}
            onPress={handleSubmit}
            disabled={isLoading}
          >
            <Text style={styles.loginButtonText}>
              {isLoading ? t("common.loading") : t("auth.signIn", { defaultValue: "Sign In" })}
            </Text>
          </TouchableOpacity>

          {/* Voice Login Option */}
          <TouchableOpacity
            style={styles.voiceLoginButton}
            onPress={handleVoiceLoginPress}
            disabled={isLoading}
          >
            <Mic size={20} color="#007AFF" />
            <Text style={styles.voiceLoginButtonText}>
              {t("login.useVoiceLogin", { defaultValue: "Or sign in with Voice" })}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.registerLink}
            onPress={() => router.push("/registration")}
          >
            <Text style={styles.registerText}>
              {t("login.noAccount", { defaultValue: "Don't have an account?" })}{" "}
              <Text style={styles.registerTextBold}>{t("registration.register", { defaultValue: "Register" })}</Text>
            </Text>
          </TouchableOpacity>
        </View>

        {/* Voice Login Modal */}
        <VoiceLoginModal
          visible={showVoiceLogin}
          onClose={() => setShowVoiceLogin(false)}
          identifier={authMode === "email" ? formData.email.trim() : formData.loginPhone.trim()}
          onSuccess={handleVoiceLoginSuccess}
        />
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
  modeToggleRow: {
    flexDirection: "row",
    backgroundColor: "#F3F4F6",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#D1D5DB",
    padding: 4,
    marginBottom: 12,
  },
  modeToggleLabel: {
    fontSize: 13,
    fontWeight: "500",
    color: "#4B5563",
    marginBottom: 8,
  },
  modeButton: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 10,
    alignItems: "center",
  },
  modeButtonActive: {
    backgroundColor: "#FFFFFF",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  modeButtonText: {
    fontSize: 14,
    fontWeight: "500",
    color: "#6B7280",
  },
  modeButtonTextActive: {
    color: "#007AFF",
    fontWeight: "600",
  },
  modeToggleHelper: {
    fontSize: 12,
    color: "#6B7280",
    marginBottom: 24,
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
  terms: {
    fontSize: 12,
    color: "#6B7280",
    lineHeight: 18,
    textAlign: "center",
  },
  footer: {
    paddingHorizontal: 24,
    paddingVertical: 20,
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
  voiceLoginButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 14,
    marginTop: 12,
    gap: 8,
  },
  voiceLoginButtonText: {
    fontSize: 15,
    fontWeight: "500",
    color: "#007AFF",
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
