"use client";

import React, { useState, useEffect } from "react";
import {
  Users,
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
  const [verificationRequests, setVerificationRequests] = useState([]);
  const [filter, setFilter] = useState("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadVerificationRequests();
  }, []);

  const loadVerificationRequests = async () => {
    setIsLoading(true);
    try {
      const response = await fetch("/api/admin/verifications");
      const result = await response.json();

      if (result.success && result.data && result.data.verifications) {
        setVerificationRequests(result.data.verifications);
      } else {
        // If no data, keep empty array
        setVerificationRequests([]);
      }
    } catch (error) {
      console.error("Error loading verification requests:", error);
      setVerificationRequests([]); // Ensure it's always an array
    } finally {
      setIsLoading(false);
    }
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
          request.user?.name
            ?.toLowerCase()
            .includes(searchTerm.toLowerCase()) ||
          request.user?.phone?.includes(searchTerm) ||
          request.user_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          request.user_phone?.includes(searchTerm);

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
            <button
              onClick={loadVerificationRequests}
              className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
            >
              <RefreshCw size={16} className="mr-2" />
              Refresh
            </button>
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
                      {(filteredRequests.length > 0
                        ? filteredRequests
                        : mockRequests
                      ).map((request) => (
                        <tr key={request.id} className="hover:bg-gray-50">
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div>
                              <div className="text-sm font-medium text-gray-900">
                                {request.user_name}
                              </div>
                              <div className="text-sm text-gray-500">
                                {request.user_phone}
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
                              onClick={() => setSelectedRequest(request)}
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
                      ))}
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

            {/* Selected Request Details */}
            {selectedRequest && (
              <div className="bg-white rounded-lg shadow p-6">
                <h3 className="text-lg font-medium text-gray-900 mb-4">
                  Request Details
                </h3>

                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">
                      User Information
                    </label>
                    <div className="mt-1 text-sm text-gray-900">
                      <div>{selectedRequest.user_name}</div>
                      <div className="text-gray-500">
                        {selectedRequest.user_phone}
                      </div>
                      {selectedRequest.user_email && (
                        <div className="text-gray-500">
                          {selectedRequest.user_email}
                        </div>
                      )}
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700">
                      Voice Match Score
                    </label>
                    <div className="mt-1">
                      <div className="flex items-center">
                        <Volume2 size={16} className="text-blue-500 mr-2" />
                        <span className="text-sm font-medium">
                          {selectedRequest.voice_match_score
                            ? (selectedRequest.voice_match_score * 100).toFixed(
                                1,
                              ) + "%"
                            : "Not available"}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700">
                      Liveness Image
                    </label>
                    <div className="mt-1">
                      {selectedRequest.liveness_image_url ? (
                        <img
                          src={selectedRequest.liveness_image_url}
                          alt="Liveness check"
                          className="w-full h-32 object-cover rounded-md border"
                        />
                      ) : (
                        <div className="w-full h-32 bg-gray-100 rounded-md border flex items-center justify-center">
                          <span className="text-gray-500">
                            No image available
                          </span>
                        </div>
                      )}
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700">
                      Document
                    </label>
                    <div className="mt-1">
                      {selectedRequest.document_url ? (
                        <img
                          src={selectedRequest.document_url}
                          alt="Document"
                          className="w-full h-32 object-cover rounded-md border"
                        />
                      ) : (
                        <div className="w-full h-32 bg-gray-100 rounded-md border flex items-center justify-center">
                          <FileText size={24} className="text-gray-400" />
                        </div>
                      )}
                    </div>
                  </div>

                  {selectedRequest.status === "pending" && (
                    <div className="pt-4 space-y-2">
                      <button
                        onClick={() => handleApprove(selectedRequest.id)}
                        className="w-full bg-green-600 text-white py-2 px-4 rounded-md hover:bg-green-700 flex items-center justify-center"
                      >
                        <CheckCircle size={16} className="mr-2" />
                        Approve
                      </button>
                      <button
                        onClick={() => {
                          const reason = prompt("Reason for rejection:");
                          if (reason) {
                            handleReject(selectedRequest.id, reason);
                          }
                        }}
                        className="w-full bg-red-600 text-white py-2 px-4 rounded-md hover:bg-red-700 flex items-center justify-center"
                      >
                        <XCircle size={16} className="mr-2" />
                        Reject
                      </button>
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
