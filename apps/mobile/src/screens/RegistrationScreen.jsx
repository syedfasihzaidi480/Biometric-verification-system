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
import { ArrowLeft, Calendar, User, Phone, Mail, Shield, Lock } from "lucide-react-native";
import { useTranslation } from "@/i18n/useTranslation";
import { apiFetchJson } from "@/utils/api";
import { signInWithCredentials } from "@/utils/auth/credentials";
import DateInput from "@/components/DateInput";
import PhoneNumberInput from "@/components/PhoneNumberInput";
import PasswordPhoneInput from "@/components/PasswordPhoneInput";

export default function RegistrationScreen() {
  const insets = useSafeAreaInsets();
  const { t, currentLanguage } = useTranslation();

  const [formData, setFormData] = useState({
    fullName: "",
    dateOfBirth: "",
    pensionNumber: "",
    phoneNumber: "",
    email: "",
    passwordPhone: "",
  });

  const [errors, setErrors] = useState({});
  const [isLoading, setIsLoading] = useState(false);
  const [isPhoneValid, setIsPhoneValid] = useState(false);

  const validateForm = () => {
    const newErrors = {};

    // Name validation
    if (!formData.fullName.trim()) {
      newErrors.fullName = t("registration.nameRequired");
    }

    // Date validation (YYYY-MM-DD format)
    if (!formData.dateOfBirth.trim()) {
      newErrors.dateOfBirth = t('registration.dateRequired');
    } else if (!/^\d{4}-\d{2}-\d{2}$/.test(formData.dateOfBirth.trim())) {
      newErrors.dateOfBirth = t('registration.dateFormat');
    } else {
      // Check if date is in the future
      const [year, month, day] = formData.dateOfBirth.split("-");
      const selectedDate = new Date(Number(year), Number(month) - 1, Number(day));
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      if (selectedDate > today) {
        newErrors.dateOfBirth = t('registration.dateNoFuture') || 'Date of birth cannot be in the future';
      }
    }

    // Pension number validation
    if (!formData.pensionNumber.trim()) {
      newErrors.pensionNumber = t('registration.pensionRequired');
    }

    // Phone validation
    if (!formData.phoneNumber.trim()) {
      newErrors.phoneNumber = t("registration.phoneRequired");
    } else if (!isPhoneValid) {
      newErrors.phoneNumber = t("registration.validPhone");
    }

    // Email validation
    if (formData.email.trim() && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email.trim())) {
      newErrors.email = t('registration.validEmail');
    }

    // Password phone validation
    if (!formData.passwordPhone.trim()) {
      newErrors.passwordPhone = t('registration.passwordRequired');
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
      // Already in YYYY-MM-DD format
      const isoDate = formData.dateOfBirth.trim();

      const result = await apiFetchJson("/api/auth/register", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: {
          name: formData.fullName.trim(),
          phone: formData.phoneNumber.trim(),
          email: formData.email.trim() || undefined,
          password: formData.passwordPhone.trim(),
          date_of_birth: isoDate,
          pension_number: formData.pensionNumber.trim(),
          preferred_language: currentLanguage,
        },
      });

      if (result.success) {
        const loginIdentifier = formData.email.trim() || formData.phoneNumber.trim();

        if (loginIdentifier) {
          try {
            await signInWithCredentials({
              identifier: loginIdentifier,
              email: formData.email.trim() || undefined,
              phone: formData.phoneNumber.trim() || undefined,
              password: formData.passwordPhone.trim(),
              callbackUrl: "/",
            });
          } catch (authError) {
            console.warn("Registration auto sign-in failed:", authError);
          }
        }

        // Store user data for next steps
        router.push({
          pathname: "/voice-enrollment",
          params: {
            userId: result.data.user.id,
            userName: formData.fullName.trim(),
            dateOfBirth: formData.dateOfBirth,
          },
        });
      } else {
        Alert.alert(
          t("common.error"),
          result.error?.message || t("errors.server"),
        );
      }
    } catch (error) {
      // Handle duplicates: if user/email/phone already exists, inform them to sign in instead
      console.error("Registration error:", error);
      const apiCode = error?.data?.error?.code;
      const rawMessage = error?.data?.error?.message || error?.message || '';
      const apiMessage = typeof rawMessage === 'string' ? rawMessage : '';

      const emailProvided = !!formData.email.trim();
      const phoneProvided = !!formData.phoneNumber.trim();

      const isDuplicate = (
        apiCode === 'EMAIL_EXISTS' ||
        apiCode === 'PHONE_EXISTS' ||
        apiCode === 'USER_EXISTS' ||
        (apiMessage.toLowerCase().includes('already exists')) ||
        (apiMessage.toLowerCase().includes('duplicate'))
      );

      if (isDuplicate) {
        // Determine which field to show in message.
        // Priority: if only phone provided => phone number.
        // If email provided and message/code points to email => email address.
        // If both provided and ambiguous => account.
  let duplicateField = 'account';

        if (!emailProvided && phoneProvided) {
          duplicateField = 'phone number';
        } else if (emailProvided && !phoneProvided) {
          duplicateField = 'email address';
        } else if (emailProvided && phoneProvided) {
          // Try to narrow by message or code
          if (apiCode === 'EMAIL_EXISTS' || apiMessage.toLowerCase().includes('email')) {
            duplicateField = 'email address';
          } else if (apiCode === 'PHONE_EXISTS' || apiMessage.toLowerCase().includes('phone')) {
            duplicateField = 'phone number';
          } else {
            duplicateField = 'account';
          }
        } else {
          // Neither provided? Should not happen (phone required) but fallback.
          duplicateField = 'account';
        }

        Alert.alert(
          t('common.error'),
          `An account with this ${duplicateField} already exists. Please sign in instead.`,
          [
            { text: 'Sign In', onPress: () => router.replace('/') },
            { text: 'Cancel', style: 'cancel' }
          ]
        );
        return;
      }

      // Surface a meaningful error to the user
      if (error?.code === 'NETWORK_ERROR') {
        Alert.alert(t('common.error'), t('errors.network'));
      } else if (typeof apiMessage === 'string' && apiMessage.trim()) {
        Alert.alert(t('common.error'), apiMessage.trim());
      } else {
        Alert.alert(t('common.error'), t('errors.server'));
      }
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
          <Text style={styles.headerTitle}>{t("registration.title")}</Text>
          <View style={styles.headerSpacer} />
        </View>

        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* Form */}
          <View style={styles.form}>
            {/* Full Name */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>{t("registration.fullName")} *</Text>
              <View
                style={[
                  styles.inputContainer,
                  errors.fullName && styles.inputError,
                ]}
              >
                <User size={20} color="#666" style={styles.inputIcon} />
                <TextInput
                  style={styles.textInput}
                  value={formData.fullName}
                  onChangeText={(value) => updateFormData("fullName", value)}
                  placeholder={t("registration.fullNamePlaceholder")}
                  autoCapitalize="words"
                  autoComplete="name"
                />
              </View>
              {errors.fullName && (
                <Text style={styles.errorText}>{errors.fullName}</Text>
              )}
            </View>

            {/* Date of Birth */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>
                {t("registration.dateOfBirth")} *
              </Text>
              <View style={[styles.inputContainer, errors.dateOfBirth && styles.inputError]}>
                <Calendar size={20} color="#666" style={styles.inputIcon} />
                <DateInput
                  value={formData.dateOfBirth}
                  onChangeText={(value) => updateFormData("dateOfBirth", value)}
                  displayFormat="YYYY-MM-DD"
                />
              </View>
              {errors.dateOfBirth && (
                <Text style={styles.errorText}>{errors.dateOfBirth}</Text>
              )}
            </View>

            {/* Pension Number */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>{t('registration.pensionNumber')} *</Text>
              <View
                style={[
                  styles.inputContainer,
                  errors.pensionNumber && styles.inputError,
                ]}
              >
                <Shield size={20} color="#666" style={styles.inputIcon} />
                <TextInput
                  style={styles.textInput}
                  value={formData.pensionNumber}
                  onChangeText={(value) =>
                    updateFormData("pensionNumber", value)
                  }
                  placeholder={t('registration.pensionNumberPlaceholder')}
                  autoCapitalize="characters"
                />
              </View>
              {errors.pensionNumber && (
                <Text style={styles.errorText}>{errors.pensionNumber}</Text>
              )}
            </View>

            {/* Phone Number */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>
                {t("registration.phoneNumber")} *
              </Text>
              <PhoneNumberInput
                value={formData.phoneNumber}
                onChangeText={(value) => updateFormData("phoneNumber", value)}
                onValidationChange={setIsPhoneValid}
                placeholder={t('registration.phoneNumberPlaceholder')}
                error={!!errors.phoneNumber}
              />
              {errors.phoneNumber && (
                <Text style={styles.errorText}>{errors.phoneNumber}</Text>
              )}
            </View>

            {/* Email */}
            <View style={styles.inputGroup}>
              <View style={styles.labelRow}>
                <Text style={styles.label}>{t("registration.email")}</Text>
                <Text style={styles.optionalTag}>{t("registration.emailOptionalTag")}</Text>
              </View>
              <View
                style={[
                  styles.inputContainer,
                  errors.email && styles.inputError,
                ]}
              >
                <Mail size={20} color="#666" style={styles.inputIcon} />
                <TextInput
                  style={styles.textInput}
                  value={formData.email}
                  onChangeText={(value) => updateFormData("email", value)}
                  placeholder={t("registration.emailPlaceholder")}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  autoComplete="email"
                />
              </View>
              {errors.email && (
                <Text style={styles.errorText}>{errors.email}</Text>
              )}
              {!errors.email && (
                <Text style={styles.helperText}>{t("registration.emailHelper")}</Text>
              )}
            </View>

            {/* Password */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>
                {t('registration.password')} *
              </Text>
              <PasswordPhoneInput
                value={formData.passwordPhone}
                onChangeText={(value) => updateFormData("passwordPhone", value)}
                placeholder={t('registration.passwordPlaceholder')}
                error={!!errors.passwordPhone}
              />
              {errors.passwordPhone && (
                <Text style={styles.errorText}>{errors.passwordPhone}</Text>
              )}
            </View>

            {/* Required fields note */}
            <Text style={styles.requiredNote}>{t("registration.requiredNote")}</Text>
          </View>
        </ScrollView>

        {/* Create Account Button */}
        <View style={styles.footer}>
          <TouchableOpacity
            style={[
              styles.createButton,
              isLoading && styles.createButtonDisabled,
            ]}
            onPress={handleSubmit}
            disabled={isLoading}
          >
            <Text style={styles.createButtonText}>
              {isLoading
                ? t("common.loading")
                : t("registration.createAccount")}
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
  form: {
    paddingHorizontal: 24,
    paddingTop: 24,
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
  labelRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 8,
  },
  optionalTag: {
    fontSize: 12,
    color: "#6B7280",
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
  helperText: {
    fontSize: 12,
    color: "#6B7280",
    marginTop: 6,
    marginBottom: 8,
    fontStyle: "italic",
  },
  requiredNote: {
    fontSize: 12,
    color: "#9CA3AF",
    marginTop: 8,
    marginBottom: 16,
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
    paddingBottom: 20,
    borderTopWidth: 1,
    borderTopColor: "#F3F4F6",
  },
  createButton: {
    backgroundColor: "#007AFF",
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: "center",
  },
  createButtonDisabled: {
    backgroundColor: "#9CA3AF",
  },
  createButtonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "600",
  },
});
