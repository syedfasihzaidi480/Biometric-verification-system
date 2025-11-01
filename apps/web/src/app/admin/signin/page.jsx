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
      // First verify admin role and approval status
      const checkResponse = await fetch("/api/admin/auth/signin", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email, password, requiredRole: role }),
      });

      const checkResult = await checkResponse.json();

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

      // Use Auth.js callback URL approach
      const formData = new URLSearchParams();
      formData.append("email", email);
      formData.append("password", password);
      formData.append("callbackUrl", "/admin");

      const signInResponse = await fetch("/api/auth/callback/credentials", {
        method: "POST",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
        },
        body: formData.toString(),
        credentials: "include",
        redirect: "follow", // Allow browser to follow redirects
      });

      console.log("SignIn response status:", signInResponse.status);
      console.log("SignIn response URL:", signInResponse.url);
      
      // Check if we were redirected (successful signin)
      if (signInResponse.url && (signInResponse.url.includes("/admin") || signInResponse.url.includes("error") === false)) {
        // Successfully signed in
        window.location.href = "/admin";
      } else if (signInResponse.url && signInResponse.url.includes("error")) {
        // Auth.js redirected to error page
        setError("Authentication failed. Please check your credentials.");
        setIsLoading(false);
      } else if (signInResponse.status === 200) {
        // Check response content
        const text = await signInResponse.text();
        if (text && !text.includes("error")) {
          window.location.href = "/admin";
        } else {
          setError("Authentication failed. Please check your credentials.");
          setIsLoading(false);
        }
      } else {
        setError("Failed to sign in. Please try again.");
        setIsLoading(false);
      }
    } catch (err) {
      setError("Failed to sign in. Please try again.");
      console.error("Sign in error:", err);
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
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Admin Sign In
          </h1>
          <p className="text-gray-600">
            Access the Voice Biometrics Admin Dashboard
          </p>
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
                  placeholder="admin@example.com"
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
