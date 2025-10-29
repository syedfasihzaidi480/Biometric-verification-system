"use client";

import { useState } from "react";
import useAuth from "@/utils/useAuth";

export default function SignUpPage() {
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    fullName: "",
    dateOfBirth: "",
    pensionNumber: "",
    phoneNumber: "",
    email: "",
    password: "",
  });

  const validateForm = () => {
    const newErrors = {};

    // Name validation
    if (!formData.fullName.trim()) {
      return "Full name is required";
    }

    // Date validation (DD/MM/YYYY format)
    if (!formData.dateOfBirth.trim()) {
      return "Date of birth is required";
    } else if (!/^\d{2}\/\d{2}\/\d{4}$/.test(formData.dateOfBirth.trim())) {
      return "Please enter date in DD/MM/YYYY format";
    }

    // Pension number validation
    if (!formData.pensionNumber.trim()) {
      return "Pension number is required";
    }

    // Phone validation
    if (!formData.phoneNumber.trim()) {
      return "Phone number is required";
    }

    // Email + password for credentials auth
    if (!formData.email.trim()) {
      return "Email is required";
    }
    if (!formData.password.trim()) {
      return "Password is required";
    }

    return null;
  };

  const { signInWithCredentials } = useAuth();

  const onSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const validationError = validateForm();
    if (validationError) {
      setError(validationError);
      setLoading(false);
      return;
    }

    try {
      // Convert DD/MM/YYYY to YYYY-MM-DD for database
      const [day, month, year] = formData.dateOfBirth.split("/");
      const isoDate = `${year}-${month.padStart(2, "0")}-${day.padStart(2, "0")}`;

      // Register the user - this now creates both profile AND auth credentials
      const response = await fetch("/api/auth/register", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: formData.fullName.trim(),
          phone: formData.phoneNumber.trim(),
          email: formData.email.trim(),
          password: formData.password.trim(),
          date_of_birth: isoDate,
          pension_number: formData.pensionNumber.trim(),
          preferred_language: "en",
        }),
      });

      const result = await response.json();

      if (!result.success) {
        setError(
          result.error?.message || "Registration failed. Please try again.",
        );
        setLoading(false);
        return;
      }

      // Now sign in with the credentials that were just created
      console.log('[SIGNUP] Registration successful, signing in...');
      try {
        // After successful registration, sign in without forcing a callbackUrl.
        // This allows the mobile WebView to pass ?callbackUrl=/api/auth/token
        // so the native app can complete the auth flow.
        await signInWithCredentials({
          email: formData.email.trim(),
          password: formData.password.trim(),
          redirect: true,
        });
      } catch (e) {
        console.error('[SIGNUP] Sign-in after registration failed:', e);
        setError("Account created successfully! Please sign in.");
        setLoading(false);
      }
    } catch (err) {
      console.error('[SIGNUP] Registration error:', err);
      setError("Something went wrong. Please try again.");
      setLoading(false);
    }
  };

  const updateFormData = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  return (
    <div className="min-h-screen bg-[#F8F9FA] flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <form
          onSubmit={onSubmit}
          className="bg-white rounded-2xl shadow-sm p-8"
        >
          {/* Header */}
          <div className="text-center mb-8">
            <h1 className="text-2xl font-bold text-gray-900 mb-2">
              Create Account
            </h1>
            <p className="text-gray-600">
              Register for voice biometric verification
            </p>
          </div>

          {/* Form Fields */}
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Full Name *
              </label>
              <input
                type="text"
                required
                value={formData.fullName}
                onChange={(e) => updateFormData("fullName", e.target.value)}
                className="w-full px-3 py-3 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Enter your full name"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Date of Birth *
              </label>
              <input
                type="text"
                required
                value={formData.dateOfBirth}
                onChange={(e) => updateFormData("dateOfBirth", e.target.value)}
                className="w-full px-3 py-3 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="DD/MM/YYYY"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Pension Number *
              </label>
              <input
                type="text"
                required
                value={formData.pensionNumber}
                onChange={(e) =>
                  updateFormData("pensionNumber", e.target.value)
                }
                className="w-full px-3 py-3 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Enter your pension number"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Phone Number (Include area code) *
              </label>
              <input
                type="tel"
                required
                value={formData.phoneNumber}
                onChange={(e) => updateFormData("phoneNumber", e.target.value)}
                className="w-full px-3 py-3 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="+1 (555) 123-4567"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Email *
              </label>
              <input
                type="email"
                value={formData.email}
                onChange={(e) => updateFormData("email", e.target.value)}
                className="w-full px-3 py-3 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Enter your email address"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Password *
              </label>
              <input
                type="password"
                required
                value={formData.password}
                onChange={(e) => updateFormData("password", e.target.value)}
                className="w-full px-3 py-3 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Create a password"
              />
            </div>

            {error && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                <p className="text-red-600 text-sm">{error}</p>
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-blue-600 text-white font-medium py-3 px-4 rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {loading ? "Creating Account..." : "Create Account"}
            </button>
          </div>

          {/* Footer */}
          <div className="text-center mt-6">
            <p className="text-gray-600 text-sm mb-4">* Required fields</p>
            <p className="text-gray-600">
              Already have an account?{" "}
              <a
                href="/account/signin"
                className="text-blue-600 font-medium hover:text-blue-700"
              >
                Sign in
              </a>
            </p>
          </div>
        </form>
      </div>
    </div>
  );
}
