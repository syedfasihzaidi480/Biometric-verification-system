"use client";

import React, { useState } from "react";
import { useNavigate } from "react-router";
import { Shield, Mail, Lock, AlertCircle } from "lucide-react";

export default function AdminSignInPage() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState("admin"); // 'admin' or 'super_admin'
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);

    try {
      console.log("[SIGNIN] Starting signin process for:", email, "as", role);

      // First verify admin role and approval status
      const checkResponse = await fetch("/api/admin/auth/signin", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password, requiredRole: role }),
      });
      console.log("[SIGNIN] Admin check response status:", checkResponse.status);
      const checkResult = await checkResponse.json();
      console.log("[SIGNIN] Admin check result:", checkResult);
      if (!checkResult.success) {
        setError(checkResult.error || "Invalid credentials");
        setIsLoading(false);
        return;
      }

      // Verify the user's actual role matches the selected role
      const userRole = checkResult.data?.user?.role;
      if (userRole !== role) {
        if (role === "super_admin" && userRole === "admin") {
          setError("You don't have Super Admin privileges. Please select Admin instead.");
        } else if (role === "admin" && userRole === "super_admin") {
          setError("You are a Super Admin. Please select Super Admin from the dropdown.");
        } else {
          setError("Access denied. Invalid role selection.");
        }
        setIsLoading(false);
        return;
      }

      console.log("[SIGNIN] Admin verification passed, preparing CSRF token and submitting to Auth.js...");

      // Obtain CSRF token for Auth.js (defensive even if skipCSRFCheck is enabled)
      let csrfToken = null;
      try {
        const csrfRes = await fetch("/api/auth/csrf", { credentials: "include" });
        if (csrfRes.ok) {
          const data = await csrfRes.json();
          csrfToken = data?.csrfToken ?? null;
        }
      } catch (e) {
        console.warn("[SIGNIN] Could not fetch CSRF token, proceeding without it", e);
      }

  // Submit a real HTML form to the CREDENTIALS CALLBACK endpoint (Auth.js/NextAuth pattern)
  // NOTE: The POST target for credentials is /api/auth/callback/credentials
  const form = document.createElement("form");
  form.method = "POST";
  form.action = "/api/auth/callback/credentials";

      const addField = (name, value) => {
        const input = document.createElement("input");
        input.type = "hidden";
        input.name = name;
        input.value = value;
        form.appendChild(input);
      };

      if (csrfToken) addField("csrfToken", csrfToken);
      addField("identifier", email);  // Auth.js expects "identifier" not "email"
      addField("password", password);
      addField("callbackUrl", "/admin");

      document.body.appendChild(form);
      form.submit();
      return; // Hand off navigation to the browser
    } catch (err) {
      console.error("[SIGNIN] Error:", err);
      setError("Failed to sign in. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-blue-50 flex items-center justify-center p-4">
      <div className="max-w-md w-full">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-purple-600 rounded-full mb-4">
            <Shield size={32} className="text-white" />
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Admin Sign In</h1>
          <p className="text-gray-600">Access the Voice Biometrics Admin Dashboard</p>
        </div>

        {/* Sign In Form */}
        <div className="bg-white rounded-lg shadow-xl p-8">
          {error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg flex items-start">
              <AlertCircle size={20} className="text-red-600 mr-3 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-medium text-red-800">{error}</p>
              </div>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Role Selection */}
            <div>
              <label
                htmlFor="role"
                className="block text-sm font-medium text-gray-700 mb-2"
              >
                Sign in as
              </label>
              <select
                id="role"
                value={role}
                onChange={(e) => setRole(e.target.value)}
                className="block w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent bg-white"
              >
                <option value="admin">Admin</option>
                <option value="super_admin">Super Admin</option>
              </select>
              <p className="mt-1 text-xs text-gray-500">
                Select your role to access the appropriate dashboard
              </p>
            </div>

            {/* Email Field */}
            <div>
              <label
                htmlFor="email"
                className="block text-sm font-medium text-gray-700 mb-2"
              >
                Email Address
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Mail size={18} className="text-gray-400" />
                </div>
                <input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="block w-full pl-10 pr-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  placeholder="admin@company.com"
                />
              </div>
            </div>

            {/* Password Field */}
            <div>
              <label
                htmlFor="password"
                className="block text-sm font-medium text-gray-700 mb-2"
              >
                Password
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Lock size={18} className="text-gray-400" />
                </div>
                <input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="block w-full pl-10 pr-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  placeholder="••••••••"
                />
              </div>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isLoading}
              className="w-full bg-purple-600 text-white py-3 px-4 rounded-lg font-medium hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {isLoading ? (
                <span className="flex items-center justify-center">
                  <svg
                    className="animate-spin -ml-1 mr-3 h-5 w-5 text-white"
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                  >
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                    ></circle>
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                    ></path>
                  </svg>
                  Signing in...
                </span>
              ) : (
                "Sign In"
              )}
            </button>
          </form>

          {/* Sign Up Link */}
          <div className="mt-6 text-center">
            <p className="text-sm text-gray-600">
              Don't have an admin account?{" "}
              <a
                href="/admin/signup"
                className="font-medium text-purple-600 hover:text-purple-500"
              >
                Create one here
              </a>
            </p>
          </div>
        </div>

        {/* Back to Home */}
        <div className="mt-6 text-center">
          <a
            href="/"
            className="text-sm text-gray-600 hover:text-gray-900 transition-colors"
          >
            ← Back to Home
          </a>
        </div>
      </div>
    </div>
  );
}
