"use client";

import React from "react";
import {
  Smartphone,
  Monitor,
  Mic,
  Camera,
  FileText,
  Users,
  Settings,
  Shield,
  Globe,
} from "lucide-react";

export default function HomePage() {
  const demoRoutes = [
    {
      title: "Mobile App Demo",
      description: "Test the complete mobile verification flow",
      icon: <Smartphone size={24} />,
      href: "/mobile-demo",
      color: "bg-blue-500",
    },
    {
      title: "Admin Dashboard",
      description: "Manage verification requests and users",
      icon: <Monitor size={24} />,
      href: "/admin",
      color: "bg-purple-500",
    },
    {
      title: "Voice Biometrics",
      description: "Voice enrollment and verification APIs",
      icon: <Mic size={24} />,
      href: "/api/voice/enroll",
      color: "bg-green-500",
      external: true,
    },
    {
      title: "Liveness Detection",
      description: "Facial liveness verification system",
      icon: <Camera size={24} />,
      href: "/api/liveness/check",
      color: "bg-orange-500",
      external: true,
    },
    {
      title: "Document Verification",
      description: "OCR and tamper detection for ID documents",
      icon: <FileText size={24} />,
      href: "/api/document/upload",
      color: "bg-red-500",
      external: true,
    },
    {
      title: "User Management",
      description: "Registration and profile management",
      icon: <Users size={24} />,
      href: "/api/auth/register",
      color: "bg-teal-500",
      external: true,
    },
  ];

  const features = [
    {
      icon: <Shield size={20} />,
      title: "Multi-Modal Biometrics",
      description:
        "Voice recognition, facial liveness detection, and document verification",
    },
    {
      icon: <Globe size={20} />,
      title: "Multi-Language Support",
      description:
        "English, French, Somali, Amharic, and Oromo languages supported",
    },
    {
      icon: <Smartphone size={20} />,
      title: "Cross-Platform",
      description: "React Native mobile app with admin web dashboard",
    },
    {
      icon: <Users size={20} />,
      title: "Admin Management",
      description: "Complete verification workflow with admin approval system",
    },
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">
                Voice Biometrics Platform
              </h1>
              <p className="text-gray-600 mt-2">
                Complete identity verification solution with multi-modal
                biometrics
              </p>
            </div>
            <div className="flex items-center space-x-4">
              <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-green-100 text-green-800">
                ✅ Live Demo
              </span>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Hero Section */}
        <div className="text-center mb-16">
          <h2 className="text-4xl font-bold text-gray-900 mb-4">
            Secure Identity Verification
          </h2>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Experience our comprehensive biometric verification system with
            voice recognition, facial liveness detection, and document
            verification - all with multi-language support.
          </p>
        </div>

        {/* Demo Routes */}
        <div className="mb-16">
          <h3 className="text-2xl font-bold text-gray-900 mb-8 text-center">
            Try the Platform
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {demoRoutes.map((route, index) => (
              <a
                key={index}
                href={route.href}
                className="group block"
                {...(route.external
                  ? { target: "_blank", rel: "noopener noreferrer" }
                  : {})}
              >
                <div className="bg-white rounded-lg shadow-md hover:shadow-lg transition-shadow duration-200 p-6 h-full">
                  <div
                    className={`inline-flex items-center justify-center w-12 h-12 rounded-lg ${route.color} text-white mb-4`}
                  >
                    {route.icon}
                  </div>
                  <h4 className="text-lg font-semibold text-gray-900 mb-2 group-hover:text-blue-600 transition-colors">
                    {route.title}
                  </h4>
                  <p className="text-gray-600 text-sm">{route.description}</p>
                  {route.external && (
                    <div className="mt-3">
                      <span className="inline-flex items-center text-xs text-blue-600 font-medium">
                        API Endpoint →
                      </span>
                    </div>
                  )}
                </div>
              </a>
            ))}
          </div>
        </div>

        {/* Features */}
        <div className="mb-16">
          <h3 className="text-2xl font-bold text-gray-900 mb-8 text-center">
            Platform Features
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {features.map((feature, index) => (
              <div key={index} className="flex items-start space-x-4">
                <div className="flex-shrink-0">
                  <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-blue-100 text-blue-600">
                    {feature.icon}
                  </div>
                </div>
                <div>
                  <h4 className="text-lg font-semibold text-gray-900 mb-2">
                    {feature.title}
                  </h4>
                  <p className="text-gray-600">{feature.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Quick Start */}
        <div className="bg-white rounded-lg shadow-md p-8">
          <h3 className="text-2xl font-bold text-gray-900 mb-6 text-center">
            Quick Start Guide
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div>
              <h4 className="text-lg font-semibold text-gray-900 mb-4">
                🎯 For Testing the Mobile App:
              </h4>
              <ol className="list-decimal list-inside space-y-2 text-gray-600">
                <li>Open the mobile app (scan QR code or use simulator)</li>
                <li>Complete language selection and registration</li>
                <li>Record voice samples for enrollment</li>
                <li>Complete voice verification</li>
                <li>Take liveness selfie</li>
                <li>Upload identity document</li>
                <li>Check status in dashboard</li>
              </ol>
            </div>
            <div>
              <h4 className="text-lg font-semibold text-gray-900 mb-4">
                🔧 For Admin Testing:
              </h4>
              <ol className="list-decimal list-inside space-y-2 text-gray-600">
                <li>Access the admin dashboard</li>
                <li>Review pending verification requests</li>
                <li>Check voice match scores and media</li>
                <li>Approve or reject verifications</li>
                <li>Monitor user activity and audit logs</li>
                <li>Export verification reports</li>
              </ol>
            </div>
          </div>
        </div>

        {/* API Information */}
        <div className="mt-16 bg-gray-100 rounded-lg p-8">
          <h3 className="text-2xl font-bold text-gray-900 mb-6 text-center">
            API Endpoints
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 text-sm">
            <div className="bg-white p-4 rounded-lg">
              <h4 className="font-semibold text-gray-900 mb-2">
                Authentication
              </h4>
              <ul className="space-y-1 text-gray-600">
                <li>POST /api/auth/register</li>
                <li>POST /api/auth/login</li>
                <li>GET /api/auth/token</li>
              </ul>
            </div>
            <div className="bg-white p-4 rounded-lg">
              <h4 className="font-semibold text-gray-900 mb-2">
                Voice Biometrics
              </h4>
              <ul className="space-y-1 text-gray-600">
                <li>POST /api/voice/enroll</li>
                <li>POST /api/voice/verify</li>
              </ul>
            </div>
            <div className="bg-white p-4 rounded-lg">
              <h4 className="font-semibold text-gray-900 mb-2">Verification</h4>
              <ul className="space-y-1 text-gray-600">
                <li>POST /api/liveness/check</li>
                <li>POST /api/document/upload</li>
              </ul>
            </div>
            <div className="bg-white p-4 rounded-lg">
              <h4 className="font-semibold text-gray-900 mb-2">Admin</h4>
              <ul className="space-y-1 text-gray-600">
                <li>GET /api/admin/verifications</li>
                <li>PATCH /api/admin/verifications/[id]</li>
              </ul>
            </div>
          </div>
        </div>

        {/* Footer */}
        <footer className="mt-16 text-center text-gray-500">
          <p>© 2025 Voice Biometrics Platform - Built with ❤️ on Anything</p>
          <p className="mt-2 text-sm">
            Complete end-to-end biometric verification system with
            multi-language support
          </p>
        </footer>
      </div>
    </div>
  );
}
