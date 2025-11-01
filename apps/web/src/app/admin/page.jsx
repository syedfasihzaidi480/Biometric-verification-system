"use client";

import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router";
import {
  Users,
  User,
  Clock,
  CheckCircle,
  XCircle,
  Search,
  Filter,
  Volume2,
  Eye,
  FileText,
  Shield,
  RefreshCw,
} from "lucide-react";

export default function AdminDashboard() {
  const navigate = useNavigate();
  const [verificationRequests, setVerificationRequests] = useState([]);
  const [filter, setFilter] = useState("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [verificationDetails, setVerificationDetails] = useState(null);
  const [loadingDetails, setLoadingDetails] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isCheckingAuth, setIsCheckingAuth] = useState(true);
  const [isSuperAdmin, setIsSuperAdmin] = useState(false);

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    try {
      console.log("[ADMIN DASHBOARD] Checking authentication...");
      const response = await fetch("/api/admin/auth/check");
      const result = await response.json();
      console.log("[ADMIN DASHBOARD] Auth check result:", result);

      if (!result.success || !result.isAdmin) {
        console.log("[ADMIN DASHBOARD] Not authenticated or not admin, redirecting to signin");
        navigate("/admin/signin");
        return;
      }

      console.log("[ADMIN DASHBOARD] Authentication successful");
      setIsSuperAdmin(result.isSuperAdmin || false);
      setIsCheckingAuth(false);
      loadVerificationRequests();
    } catch (error) {
      console.error("[ADMIN DASHBOARD] Auth check failed:", error);
      navigate("/admin/signin");
    }
  };

  const loadVerificationRequests = async () => {
    setIsLoading(true);
    try {
      console.log("[DASHBOARD] Fetching verification requests...");
      const response = await fetch("/api/admin/verifications");
      const result = await response.json();
      console.log("[DASHBOARD] Received data:", result);

      if (result.success && result.data && result.data.verifications) {
        console.log("[DASHBOARD] Setting", result.data.verifications.length, "verification requests");
        console.log("[DASHBOARD] First request:", result.data.verifications[0]);
        setVerificationRequests(result.data.verifications);
      } else {
        // If no data, keep empty array
        console.log("[DASHBOARD] No verification data received");
        setVerificationRequests([]);
      }
    } catch (error) {
      console.error("[DASHBOARD] Error loading verification requests:", error);
      setVerificationRequests([]); // Ensure it's always an array
    } finally {
      setIsLoading(false);
    }
  };

  const loadVerificationDetails = async (verificationId) => {
    setLoadingDetails(true);
    setSelectedRequest(verificationId);
    try {
      const response = await fetch(`/api/admin/verifications/${verificationId}`);
      const result = await response.json();
      
      if (result.success && result.data) {
        setVerificationDetails(result.data.verification);
      }
    } catch (error) {
      console.error("Error loading verification details:", error);
    } finally {
      setLoadingDetails(false);
    }
  };

  const closeVerificationDetails = () => {
    setSelectedRequest(null);
    setVerificationDetails(null);
  };

  const handleApprove = async (requestId) => {
    try {
      const response = await fetch(`/api/admin/verifications/${requestId}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          action: "approve",
          notes: "Approved by admin",
          adminId: 1, // TODO: Get from authenticated admin user
        }),
      });

      const result = await response.json();
      if (result.success) {
        loadVerificationRequests();
        setSelectedRequest(null);
      }
    } catch (error) {
      console.error("Error approving request:", error);
    }
  };

  const handleReject = async (requestId, reason) => {
    try {
      const response = await fetch(`/api/admin/verifications/${requestId}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          action: "reject",
          notes: reason,
          adminId: 1, // TODO: Get from authenticated admin user
        }),
      });

      const result = await response.json();
      if (result.success) {
        loadVerificationRequests();
        setSelectedRequest(null);
      }
    } catch (error) {
      console.error("Error rejecting request:", error);
    }
  };

  const filteredRequests = Array.isArray(verificationRequests)
    ? verificationRequests.filter((request) => {
        const matchesFilter = filter === "all" || request.status === filter;
        const matchesSearch =
          searchTerm === '' ||
          request.user?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          request.user?.phone?.includes(searchTerm) ||
          request.user?.email?.toLowerCase().includes(searchTerm.toLowerCase());

        return matchesFilter && matchesSearch;
      })
    : [];

  const getStatusColor = (status) => {
    switch (status) {
      case "approved":
        return "text-green-600 bg-green-100";
      case "rejected":
        return "text-red-600 bg-red-100";
      case "pending":
      default:
        return "text-yellow-600 bg-yellow-100";
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case "approved":
        return <CheckCircle size={16} />;
      case "rejected":
        return <XCircle size={16} />;
      case "pending":
      default:
        return <Clock size={16} />;
    }
  };

  const mockRequests = [
    {
      id: 1,
      user_name: "John Doe",
      user_phone: "+1-555-0123",
      user_email: "john@example.com",
      status: "pending",
      voice_match_score: 0.87,
      liveness_image_url: "/api/placeholder-image.jpg",
      document_url: "/api/placeholder-document.jpg",
      created_at: "2025-01-15T10:30:00Z",
      notes: null,
    },
    {
      id: 2,
      user_name: "Jane Smith",
      user_phone: "+1-555-0124",
      user_email: "jane@example.com",
      status: "pending",
      voice_match_score: 0.94,
      liveness_image_url: "/api/placeholder-image.jpg",
      document_url: "/api/placeholder-document.jpg",
      created_at: "2025-01-15T09:15:00Z",
      notes: null,
    },
    {
      id: 3,
      user_name: "Mike Johnson",
      user_phone: "+1-555-0125",
      user_email: "mike@example.com",
      status: "approved",
      voice_match_score: 0.91,
      liveness_image_url: "/api/placeholder-image.jpg",
      document_url: "/api/placeholder-document.jpg",
      created_at: "2025-01-14T16:45:00Z",
      notes: "All verification checks passed",
    },
  ];

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
            <div>
              <h1 className="text-2xl font-bold text-gray-900">
                Voice Biometrics Admin
              </h1>
              <p className="text-gray-600">
                Manage verification requests and user accounts
              </p>
            </div>
            <div className="flex gap-3">
              {isSuperAdmin && (
                <a
                  href="/admin/approvals"
                  className="inline-flex items-center px-4 py-2 border border-purple-300 bg-purple-50 rounded-md shadow-sm text-sm font-medium text-purple-700 hover:bg-purple-100"
                >
                  <Shield size={16} className="mr-2" />
                  Admin Approvals
                </a>
              )}
              <a
                href="/admin/users"
                className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
              >
                <Users size={16} className="mr-2" />
                All Users
              </a>
              <button
                onClick={loadVerificationRequests}
                className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
              >
                <RefreshCw size={16} className="mr-2" />
                Refresh
              </button>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2">
            {/* Filters and Search */}
            <div className="bg-white rounded-lg shadow mb-6">
              <div className="p-6">
                <div className="flex flex-col sm:flex-row gap-4">
                  {/* Search */}
                  <div className="relative flex-1">
                    <Search
                      size={20}
                      className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"
                    />
                    <input
                      type="text"
                      placeholder="Search by name or phone..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10 pr-4 py-2 w-full border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>

                  {/* Filter */}
                  <div className="relative">
                    <Filter
                      size={20}
                      className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"
                    />
                    <select
                      value={filter}
                      onChange={(e) => setFilter(e.target.value)}
                      className="pl-10 pr-8 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                    >
                      <option value="all">All Status</option>
                      <option value="pending">Pending</option>
                      <option value="approved">Approved</option>
                      <option value="rejected">Rejected</option>
                    </select>
                  </div>
                </div>
              </div>
            </div>

            {/* Verification Requests Table */}
            <div className="bg-white rounded-lg shadow">
              <div className="px-6 py-4 border-b border-gray-200">
                <h2 className="text-lg font-medium text-gray-900">
                  Verification Requests
                </h2>
              </div>

              {isLoading ? (
                <div className="p-8 text-center">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
                  <p className="mt-2 text-gray-600">Loading requests...</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          User
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Voice Score
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Status
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Submitted
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Actions
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {filteredRequests.length > 0 ? (
                        filteredRequests.map((request) => (
                        <tr key={request.id} className="hover:bg-gray-50">
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div>
                              <div className="text-sm font-medium text-gray-900">
                                {request.user?.name || request.user_name || 'Unknown User'}
                              </div>
                              <div className="text-sm text-gray-500">
                                {request.user?.phone || request.user_phone || '-'}
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm text-gray-900">
                              {request.voice_match_score
                                ? (request.voice_match_score * 100).toFixed(1) +
                                  "%"
                                : "-"}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span
                              className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(request.status)}`}
                            >
                              {getStatusIcon(request.status)}
                              <span className="ml-1 capitalize">
                                {request.status}
                              </span>
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {new Date(request.created_at).toLocaleDateString()}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                            <button
                              onClick={() => loadVerificationDetails(request.id)}
                              className="text-blue-600 hover:text-blue-900 mr-4"
                            >
                              <Eye size={16} />
                            </button>
                            {request.status === "pending" && (
                              <>
                                <button
                                  onClick={() => handleApprove(request.id)}
                                  className="text-green-600 hover:text-green-900 mr-2"
                                >
                                  <CheckCircle size={16} />
                                </button>
                                <button
                                  onClick={() =>
                                    handleReject(
                                      request.id,
                                      "Failed verification",
                                    )
                                  }
                                  className="text-red-600 hover:text-red-900"
                                >
                                  <XCircle size={16} />
                                </button>
                              </>
                            )}
                          </td>
                        </tr>
                        ))
                      ) : (
                        <tr>
                          <td colSpan="5" className="px-6 py-12 text-center">
                            <div className="text-gray-500">
                              <Shield size={48} className="mx-auto mb-4 text-gray-400" />
                              <p className="text-lg font-medium mb-1">No verification requests</p>
                              <p className="text-sm">Verification requests will appear here when users submit them</p>
                            </div>
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Stats Cards */}
            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">
                Overview
              </h3>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <Clock size={20} className="text-yellow-500 mr-2" />
                    <span className="text-sm text-gray-600">Pending</span>
                  </div>
                  <span className="font-medium">
                    {filteredRequests.filter((r) => r.status === "pending")
                      .length || 2}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <CheckCircle size={20} className="text-green-500 mr-2" />
                    <span className="text-sm text-gray-600">Approved</span>
                  </div>
                  <span className="font-medium">
                    {filteredRequests.filter((r) => r.status === "approved")
                      .length || 1}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <XCircle size={20} className="text-red-500 mr-2" />
                    <span className="text-sm text-gray-600">Rejected</span>
                  </div>
                  <span className="font-medium">
                    {filteredRequests.filter((r) => r.status === "rejected")
                      .length || 0}
                  </span>
                </div>
              </div>
            </div>

            {/* Selected Request Details - Full Screen Modal */}
            {selectedRequest && (
              <div className="fixed inset-0 z-50 overflow-hidden">
                <div className="absolute inset-0 bg-black bg-opacity-50" onClick={closeVerificationDetails}></div>
                
                <div className="absolute inset-y-0 right-0 max-w-3xl w-full bg-white shadow-xl overflow-y-auto">
                  {loadingDetails ? (
                    <div className="p-8 text-center">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
                      <p className="mt-2 text-gray-600">Loading verification details...</p>
                    </div>
                  ) : verificationDetails ? (
                    <div className="p-6">
                      {/* Header */}
                      <div className="flex justify-between items-start mb-6 border-b pb-4">
                        <div>
                          <h2 className="text-2xl font-bold text-gray-900">Verification Request</h2>
                          <p className="text-sm text-gray-500">ID: {verificationDetails.id}</p>
                        </div>
                        <button
                          onClick={closeVerificationDetails}
                          className="p-2 hover:bg-gray-100 rounded-md"
                        >
                          <XCircle size={24} />
                        </button>
                      </div>

                      {/* Status Badge */}
                      <div className="mb-6">
                        <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${
                          verificationDetails.status === 'approved' 
                            ? 'bg-green-100 text-green-800' 
                            : verificationDetails.status === 'rejected'
                            ? 'bg-red-100 text-red-800'
                            : 'bg-yellow-100 text-yellow-800'
                        }`}>
                          {verificationDetails.status === 'approved' && <CheckCircle size={16} className="mr-1" />}
                          {verificationDetails.status === 'rejected' && <XCircle size={16} className="mr-1" />}
                          {verificationDetails.status === 'pending' && <Clock size={16} className="mr-1" />}
                          <span className="capitalize">{verificationDetails.status}</span>
                        </span>
                      </div>

                      {/* User Information */}
                      {verificationDetails.user && (
                        <div className="mb-6 bg-blue-50 rounded-lg p-4">
                          <h3 className="text-lg font-semibold mb-3 flex items-center">
                            <User size={20} className="mr-2 text-blue-600" />
                            User Information
                          </h3>
                          <div className="grid grid-cols-2 gap-3 text-sm">
                            <div>
                              <span className="text-gray-600">Name:</span>
                              <p className="font-medium">{verificationDetails.user.name || 'N/A'}</p>
                            </div>
                            <div>
                              <span className="text-gray-600">Phone:</span>
                              <p className="font-medium">{verificationDetails.user.phone || 'N/A'}</p>
                            </div>
                            <div>
                              <span className="text-gray-600">Email:</span>
                              <p className="font-medium">{verificationDetails.user.email || 'N/A'}</p>
                            </div>
                            <div>
                              <span className="text-gray-600">DOB:</span>
                              <p className="font-medium">
                                {verificationDetails.user.date_of_birth 
                                  ? new Date(verificationDetails.user.date_of_birth).toLocaleDateString()
                                  : 'N/A'}
                              </p>
                            </div>
                          </div>
                        </div>
                      )}

                      {/* Voice Verification */}
                      {verificationDetails.voice && (
                        <div className="mb-6 bg-purple-50 rounded-lg p-4">
                          <h3 className="text-lg font-semibold mb-3 flex items-center">
                            <Volume2 size={20} className="mr-2 text-purple-600" />
                            Voice Verification
                          </h3>
                          <div className="space-y-2">
                            <div className="flex justify-between">
                              <span className="text-gray-600">Match Score:</span>
                              <span className="font-bold text-purple-600">
                                {verificationDetails.voice.match_score 
                                  ? (verificationDetails.voice.match_score * 100).toFixed(1) + '%'
                                  : 'N/A'}
                              </span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-gray-600">Enrollment Status:</span>
                              <span className="font-medium">
                                {verificationDetails.voice.is_enrolled ? 'Enrolled' : 'Not Enrolled'}
                              </span>
                            </div>
                            {verificationDetails.voice.enrollment_samples_count && (
                              <div className="flex justify-between">
                                <span className="text-gray-600">Samples:</span>
                                <span className="font-medium">{verificationDetails.voice.enrollment_samples_count}</span>
                              </div>
                            )}
                            {verificationDetails.voice.last_match_score && (
                              <div className="flex justify-between">
                                <span className="text-gray-600">Last Match:</span>
                                <span className="font-medium">
                                  {(verificationDetails.voice.last_match_score * 100).toFixed(1)}%
                                </span>
                              </div>
                            )}
                          </div>
                        </div>
                      )}

                      {/* Liveness Check */}
                      {verificationDetails.liveness && (
                        <div className="mb-6 bg-green-50 rounded-lg p-4">
                          <h3 className="text-lg font-semibold mb-3 flex items-center">
                            <Eye size={20} className="mr-2 text-green-600" />
                            Liveness Check
                          </h3>
                          {verificationDetails.liveness.image_url ? (
                            <div className="mt-2">
                              <img 
                                src={verificationDetails.liveness.image_url}
                                alt="Liveness check"
                                className="w-full rounded-lg border border-green-200"
                              />
                            </div>
                          ) : (
                            <div className="text-center py-8 bg-white rounded border border-green-200">
                              <span className="text-gray-500">No liveness image available</span>
                            </div>
                          )}
                        </div>
                      )}

                      {/* Document Verification */}
                      {verificationDetails.document && (
                        <div className="mb-6 bg-indigo-50 rounded-lg p-4">
                          <h3 className="text-lg font-semibold mb-3 flex items-center">
                            <FileText size={20} className="mr-2 text-indigo-600" />
                            Document Verification
                          </h3>
                          <div className="mb-3">
                            <div className="flex justify-between items-center mb-2">
                              <span className="text-sm text-gray-600">Document Type:</span>
                              <span className="font-medium capitalize">
                                {verificationDetails.document.type?.replace('_', ' ') || 'N/A'}
                              </span>
                            </div>
                            {verificationDetails.document.tamper_flag && (
                              <div className="mb-2 p-2 bg-red-100 text-red-800 rounded text-sm">
                                ⚠️ Tamper detected on this document
                              </div>
                            )}
                          </div>
                          {verificationDetails.document.url ? (
                            <div className="mt-2">
                              <img 
                                src={verificationDetails.document.url}
                                alt="Document"
                                className="w-full rounded-lg border border-indigo-200"
                              />
                            </div>
                          ) : (
                            <div className="text-center py-8 bg-white rounded border border-indigo-200">
                              <FileText size={32} className="mx-auto mb-2 text-gray-400" />
                              <span className="text-gray-500">No document image available</span>
                            </div>
                          )}
                          {verificationDetails.document.extracted_text && (
                            <div className="mt-3 p-3 bg-white rounded border border-indigo-100">
                              <span className="text-xs text-gray-600 block mb-1">Extracted Text:</span>
                              <p className="text-sm text-gray-800 whitespace-pre-wrap">
                                {verificationDetails.document.extracted_text}
                              </p>
                            </div>
                          )}
                        </div>
                      )}

                      {/* Admin Notes */}
                      {verificationDetails.notes && (
                        <div className="mb-6 bg-gray-50 rounded-lg p-4">
                          <h3 className="text-sm font-semibold mb-2 text-gray-700">Admin Notes</h3>
                          <p className="text-sm text-gray-600">{verificationDetails.notes}</p>
                        </div>
                      )}

                      {/* Timestamps */}
                      <div className="mb-6 bg-gray-50 rounded-lg p-4">
                        <h3 className="text-sm font-semibold mb-2 text-gray-700">Timeline</h3>
                        <div className="space-y-2 text-sm">
                          <div className="flex justify-between">
                            <span className="text-gray-600">Submitted:</span>
                            <span className="font-medium">
                              {new Date(verificationDetails.created_at).toLocaleString()}
                            </span>
                          </div>
                          {verificationDetails.updated_at && (
                            <div className="flex justify-between">
                              <span className="text-gray-600">Last Updated:</span>
                              <span className="font-medium">
                                {new Date(verificationDetails.updated_at).toLocaleString()}
                              </span>
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Action Buttons */}
                      {verificationDetails.status === "pending" && (
                        <div className="sticky bottom-0 bg-white border-t pt-4 space-y-2">
                          <button
                            onClick={() => {
                              handleApprove(verificationDetails.id);
                              closeVerificationDetails();
                            }}
                            className="w-full bg-green-600 text-white py-3 px-4 rounded-md hover:bg-green-700 flex items-center justify-center font-medium"
                          >
                            <CheckCircle size={20} className="mr-2" />
                            Approve Verification
                          </button>
                          <button
                            onClick={() => {
                              const reason = prompt("Reason for rejection:");
                              if (reason) {
                                handleReject(verificationDetails.id, reason);
                                closeVerificationDetails();
                              }
                            }}
                            className="w-full bg-red-600 text-white py-3 px-4 rounded-md hover:bg-red-700 flex items-center justify-center font-medium"
                          >
                            <XCircle size={20} className="mr-2" />
                            Reject Verification
                          </button>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="p-8 text-center text-gray-500">
                      <p>Failed to load verification details</p>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
