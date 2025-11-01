"use client";

import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router";
import {
  Shield,
  CheckCircle,
  XCircle,
  Clock,
  User,
  Mail,
  Calendar,
  ArrowLeft,
  RefreshCw,
} from "lucide-react";

export default function AdminApprovalsPage() {
  const navigate = useNavigate();
  const [pendingAdmins, setPendingAdmins] = useState([]);
  const [approvedAdmins, setApprovedAdmins] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isCheckingAuth, setIsCheckingAuth] = useState(true);
  const [processingId, setProcessingId] = useState(null);

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    try {
      const response = await fetch("/api/admin/auth/check");
      const result = await response.json();

      if (!result.success || !result.isSuperAdmin) {
        navigate("/admin");
        return;
      }

      setIsCheckingAuth(false);
      loadApprovals();
    } catch (error) {
      console.error("Auth check failed:", error);
      navigate("/admin/signin");
    }
  };

  const loadApprovals = async () => {
    setIsLoading(true);
    try {
      const response = await fetch("/api/admin/auth/approvals");
      const result = await response.json();

      if (result.success && result.data) {
        setPendingAdmins(result.data.pending || []);
        setApprovedAdmins(result.data.approved || []);
      }
    } catch (error) {
      console.error("Error loading approvals:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleApprove = async (adminId) => {
    if (!confirm("Are you sure you want to approve this admin?")) {
      return;
    }

    setProcessingId(adminId);
    try {
      const response = await fetch(`/api/admin/auth/approvals/${adminId}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ action: "approve" }),
      });

      const result = await response.json();

      if (result.success) {
        alert(`Admin approved successfully!`);
        loadApprovals();
      } else {
        alert(`Failed to approve: ${result.error}`);
      }
    } catch (error) {
      console.error("Error approving admin:", error);
      alert("Failed to approve admin");
    } finally {
      setProcessingId(null);
    }
  };

  const handleReject = async (adminId) => {
    if (
      !confirm(
        "Are you sure you want to reject this admin? This will permanently delete their account."
      )
    ) {
      return;
    }

    setProcessingId(adminId);
    try {
      const response = await fetch(`/api/admin/auth/approvals/${adminId}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ action: "reject" }),
      });

      const result = await response.json();

      if (result.success) {
        alert(`Admin rejected and account removed`);
        loadApprovals();
      } else {
        alert(`Failed to reject: ${result.error}`);
      }
    } catch (error) {
      console.error("Error rejecting admin:", error);
      alert("Failed to reject admin");
    } finally {
      setProcessingId(null);
    }
  };

  if (isCheckingAuth) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Checking authentication...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div className="flex items-center">
              <button
                onClick={() => navigate("/admin")}
                className="mr-4 p-2 hover:bg-gray-100 rounded-md"
              >
                <ArrowLeft size={20} />
              </button>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">
                  Admin Approvals
                </h1>
                <p className="text-gray-600">
                  Manage pending and approved admin accounts
                </p>
              </div>
            </div>
            <button
              onClick={loadApprovals}
              className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
            >
              <RefreshCw size={16} className="mr-2" />
              Refresh
            </button>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          <div className="bg-yellow-50 rounded-lg p-6 border border-yellow-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-yellow-800">
                  Pending Approvals
                </p>
                <p className="text-3xl font-bold text-yellow-900 mt-2">
                  {pendingAdmins.length}
                </p>
              </div>
              <div className="p-3 bg-yellow-100 rounded-full">
                <Clock size={24} className="text-yellow-600" />
              </div>
            </div>
          </div>

          <div className="bg-green-50 rounded-lg p-6 border border-green-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-green-800">
                  Approved Admins
                </p>
                <p className="text-3xl font-bold text-green-900 mt-2">
                  {approvedAdmins.length}
                </p>
              </div>
              <div className="p-3 bg-green-100 rounded-full">
                <CheckCircle size={24} className="text-green-600" />
              </div>
            </div>
          </div>
        </div>

        {/* Pending Admins */}
        <div className="bg-white rounded-lg shadow mb-8">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg font-medium text-gray-900 flex items-center">
              <Clock size={20} className="mr-2 text-yellow-600" />
              Pending Approval Requests
            </h2>
          </div>

          {isLoading ? (
            <div className="p-8 text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600 mx-auto"></div>
              <p className="mt-2 text-gray-600">Loading...</p>
            </div>
          ) : pendingAdmins.length === 0 ? (
            <div className="p-8 text-center text-gray-500">
              <Clock size={48} className="mx-auto mb-4 text-gray-400" />
              <p>No pending approval requests</p>
            </div>
          ) : (
            <div className="divide-y divide-gray-200">
              {pendingAdmins.map((admin) => (
                <div key={admin.id} className="p-6">
                  <div className="flex items-start justify-between">
                    <div className="flex items-start space-x-4">
                      <div className="flex-shrink-0 h-12 w-12 rounded-full bg-purple-100 flex items-center justify-center">
                        <User size={24} className="text-purple-600" />
                      </div>
                      <div>
                        <h3 className="text-lg font-medium text-gray-900">
                          {admin.name}
                        </h3>
                        <div className="mt-2 space-y-1">
                          <div className="flex items-center text-sm text-gray-600">
                            <Mail size={14} className="mr-2" />
                            {admin.email}
                          </div>
                          <div className="flex items-center text-sm text-gray-500">
                            <Calendar size={14} className="mr-2" />
                            Requested:{" "}
                            {new Date(admin.created_at).toLocaleString()}
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="flex space-x-2">
                      <button
                        onClick={() => handleApprove(admin.id)}
                        disabled={processingId === admin.id}
                        className="inline-flex items-center px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:opacity-50"
                      >
                        <CheckCircle size={16} className="mr-2" />
                        Approve
                      </button>
                      <button
                        onClick={() => handleReject(admin.id)}
                        disabled={processingId === admin.id}
                        className="inline-flex items-center px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 disabled:opacity-50"
                      >
                        <XCircle size={16} className="mr-2" />
                        Reject
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Approved Admins */}
        <div className="bg-white rounded-lg shadow">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg font-medium text-gray-900 flex items-center">
              <CheckCircle size={20} className="mr-2 text-green-600" />
              Approved Admins
            </h2>
          </div>

          {approvedAdmins.length === 0 ? (
            <div className="p-8 text-center text-gray-500">
              <Shield size={48} className="mx-auto mb-4 text-gray-400" />
              <p>No approved admins yet</p>
            </div>
          ) : (
            <div className="divide-y divide-gray-200">
              {approvedAdmins.map((admin) => (
                <div key={admin.id} className="p-6">
                  <div className="flex items-center space-x-4">
                    <div className="flex-shrink-0 h-10 w-10 rounded-full bg-green-100 flex items-center justify-center">
                      <User size={20} className="text-green-600" />
                    </div>
                    <div className="flex-1">
                      <h3 className="text-base font-medium text-gray-900">
                        {admin.name}
                      </h3>
                      <div className="mt-1 flex items-center space-x-4 text-sm text-gray-600">
                        <span className="flex items-center">
                          <Mail size={14} className="mr-1" />
                          {admin.email}
                        </span>
                        <span className="flex items-center">
                          <Calendar size={14} className="mr-1" />
                          {new Date(admin.created_at).toLocaleDateString()}
                        </span>
                      </div>
                    </div>
                    <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                      <CheckCircle size={12} className="mr-1" />
                      Approved
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
