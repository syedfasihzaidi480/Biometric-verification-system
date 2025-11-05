"use client";

import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router";
import {
  Users,
  CheckCircle,
  XCircle,
  Search,
  Volume2,
  FileText,
  Eye,
  RefreshCw,
  ArrowLeft,
  Shield,
  User,
  Phone,
  Mail,
  Calendar,
  Camera,
  MapPin,
  Globe,
  CreditCard,
  Clock,
} from "lucide-react";

export default function AdminUsersPage() {
  const navigate = useNavigate();
  const [users, setUsers] = useState([]);
  const [summary, setSummary] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [filter, setFilter] = useState("all");
  const [isLoading, setIsLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [pagination, setPagination] = useState(null);
  const [selectedUser, setSelectedUser] = useState(null);
  const [userDetails, setUserDetails] = useState(null);
  const [loadingDetails, setLoadingDetails] = useState(false);
  const [isCheckingAuth, setIsCheckingAuth] = useState(true);
  const [liveConnected, setLiveConnected] = useState(false);

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    try {
      console.log("[Users Page] Checking authentication...");
      const response = await fetch("/api/admin/auth/check", {
        credentials: "include",
      });
      const result = await response.json();
      console.log("[Users Page] Auth check result:", result);

      if (!result.success || !result.isAdmin) {
        console.log("[Users Page] Not authenticated or not admin, redirecting to signin");
        navigate("/admin/signin");
        return;
      }

      console.log("[Users Page] Authentication successful");
      setIsCheckingAuth(false);
      loadUsers();
    } catch (error) {
      console.error("Auth check failed:", error);
      navigate("/admin/signin");
    }
  };

  useEffect(() => {
    if (!isCheckingAuth) {
      loadUsers();
    }
  }, [currentPage, filter]);

  // Real-time: subscribe to server-sent events and refresh on changes
  useEffect(() => {
    if (isCheckingAuth) return;

    let debounceTimer = null;
    const triggerRefresh = () => {
      if (debounceTimer) return;
      debounceTimer = setTimeout(() => {
        debounceTimer = null;
        loadUsers();
      }, 800);
    };

    try {
      const es = new EventSource('/api/admin/users/stream', { withCredentials: true });
      es.onopen = () => setLiveConnected(true);
      es.onerror = () => setLiveConnected(false);
      es.addEventListener('invalidate', (ev) => {
        try {
          const payload = JSON.parse(ev.data || '{}');
          // Only refresh if the change is relevant; since summary and list
          // depend on multiple collections, refresh on any invalidate.
          triggerRefresh();
        } catch {}
      });

      return () => {
        try { es.close(); } catch {}
        if (debounceTimer) clearTimeout(debounceTimer);
      };
    } catch (e) {
      console.warn('EventSource not available, skipping live updates');
    }
  }, [isCheckingAuth, currentPage, filter]);

  const loadUsers = async () => {
    setIsLoading(true);
    try {
      const params = new URLSearchParams({
        page: currentPage.toString(),
        limit: '20',
      });

      if (filter !== 'all') {
        params.append('status', filter);
      }

      if (searchTerm) {
        params.append('search', searchTerm);
      }

  const response = await fetch(`/api/admin/users?${params}`, { credentials: 'include' });
      const result = await response.json();

      if (result.success && result.data) {
        setUsers(result.data.users);
        setPagination(result.data.pagination);
        setSummary(result.data.summary);
      }
    } catch (error) {
      console.error("Error loading users:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSearch = () => {
    setCurrentPage(1);
    loadUsers();
  };

  const loadUserDetails = async (userId) => {
    setLoadingDetails(true);
    setSelectedUser(userId);
    try {
  const response = await fetch(`/api/admin/users/${userId}`, { credentials: 'include' });
      const result = await response.json();
      
      if (result.success && result.data) {
        setUserDetails(result.data);
      }
    } catch (error) {
      console.error("Error loading user details:", error);
    } finally {
      setLoadingDetails(false);
    }
  };

  const closeUserDetails = () => {
    setSelectedUser(null);
    setUserDetails(null);
  };

  const getVerificationBadge = (user) => {
    if (user.admin_approved) {
      return (
        <span className="inline-flex items-center px-2 py-1 text-xs font-medium rounded-full bg-green-100 text-green-800">
          <CheckCircle size={12} className="mr-1" />
          Verified
        </span>
      );
    }
    return (
      <span className="inline-flex items-center px-2 py-1 text-xs font-medium rounded-full bg-yellow-100 text-yellow-800">
        <XCircle size={12} className="mr-1" />
        Unverified
        </span>
    );
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
                onClick={() => navigate('/admin')}
                className="mr-4 p-2 hover:bg-gray-100 rounded-md"
              >
                <ArrowLeft size={20} />
              </button>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">All Users</h1>
                <p className="text-gray-600">
                  Manage all registered users in the system
                </p>
              </div>
            </div>
            <div className="flex gap-3">
              <button
                onClick={loadUsers}
                className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
              >
                <RefreshCw size={16} className="mr-2" />
                Refresh
              </button>
              {liveConnected && (
                <span className="inline-flex items-center text-xs text-green-600 px-2 py-1">
                  ● Live
                </span>
              )}
              <button
                onClick={async () => {
                  try {
                    await fetch("/api/auth/signout", { method: "POST", credentials: "include" });
                    window.location.href = "/admin/signin";
                  } catch (error) {
                    console.error("Logout error:", error);
                    window.location.href = "/admin/signin";
                  }
                }}
                className="inline-flex items-center px-4 py-2 border border-red-300 bg-red-50 rounded-md shadow-sm text-sm font-medium text-red-700 hover:bg-red-100"
              >
                Logout
              </button>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Summary Stats */}
        {summary && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 mb-8">
            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Total Users</p>
                  <p className="text-2xl font-bold text-gray-900">{summary.total}</p>
                </div>
                <Users size={32} className="text-blue-500" />
              </div>
            </div>

            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Verified</p>
                  <p className="text-2xl font-bold text-green-600">{summary.verified}</p>
                </div>
                <Shield size={32} className="text-green-500" />
              </div>
            </div>

            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Voice</p>
                  <p className="text-2xl font-bold text-purple-600">{summary.voice_verified}</p>
                </div>
                <Volume2 size={32} className="text-purple-500" />
              </div>
            </div>

            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Face</p>
                  <p className="text-2xl font-bold text-blue-600">{summary.face_verified || 0}</p>
                </div>
                <Camera size={32} className="text-blue-500" />
              </div>
            </div>

            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Document</p>
                  <p className="text-2xl font-bold text-indigo-600">{summary.document_verified}</p>
                </div>
                <FileText size={32} className="text-indigo-500" />
              </div>
            </div>
          </div>
        )}

        {/* Filters */}
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
                  placeholder="Search by name, phone, or email..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                  className="pl-10 pr-4 py-2 w-full border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                />
              </div>

              <button
                onClick={handleSearch}
                className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
              >
                Search
              </button>

              {/* Filter */}
              <select
                value={filter}
                onChange={(e) => {
                  setFilter(e.target.value);
                  setCurrentPage(1);
                }}
                className="px-4 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="all">All Users</option>
                <option value="verified">Verified Only</option>
                <option value="unverified">Unverified Only</option>
              </select>
            </div>
          </div>
        </div>

        {/* Users Table */}
        <div className="bg-white rounded-lg shadow">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg font-medium text-gray-900">
              All Users
              {pagination && (
                <span className="ml-2 text-sm text-gray-500">
                  (Showing {(currentPage - 1) * pagination.limit + 1}-
                  {Math.min(currentPage * pagination.limit, pagination.total)} of {pagination.total})
                </span>
              )}
            </h2>
          </div>

          {isLoading ? (
            <div className="p-8 text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
              <p className="mt-2 text-gray-600">Loading users...</p>
            </div>
          ) : users.length === 0 ? (
            <div className="p-8 text-center text-gray-500">
              <Users size={48} className="mx-auto mb-4 text-gray-400" />
              <p>No users found</p>
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        User
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Contact
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Verification
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Status
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Registered
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {users.map((user) => (
                      <tr 
                        key={user.id} 
                        className="hover:bg-gray-50 cursor-pointer transition-colors"
                        onClick={() => loadUserDetails(user.id)}
                      >
                        <td className="px-6 py-4">
                          <div className="flex items-center">
                            <div className="flex-shrink-0 h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center">
                              <User size={20} className="text-blue-600" />
                            </div>
                            <div className="ml-4">
                              <div className="text-sm font-medium text-gray-900">
                                {user.name || 'N/A'}
                              </div>
                              <div className="text-sm text-gray-500">
                                ID: {user.id.substring(0, 8)}...
                              </div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="text-sm text-gray-900">
                            {user.phone && (
                              <div className="flex items-center mb-1">
                                <Phone size={14} className="mr-2 text-gray-400" />
                                {user.phone}
                              </div>
                            )}
                            {user.email && (
                              <div className="flex items-center">
                                <Mail size={14} className="mr-2 text-gray-400" />
                                {user.email}
                              </div>
                            )}
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex flex-col gap-1">
                            {user.voice_verified && (
                              <span className="inline-flex items-center text-xs">
                                <Volume2 size={12} className="mr-1 text-purple-600" />
                                Voice
                              </span>
                            )}
                            {user.face_verified && (
                              <span className="inline-flex items-center text-xs">
                                <Camera size={12} className="mr-1 text-blue-600" />
                                Face
                              </span>
                            )}
                            {user.document_verified && (
                              <span className="inline-flex items-center text-xs">
                                <FileText size={12} className="mr-1 text-indigo-600" />
                                Document
                              </span>
                            )}
                            {!user.voice_verified && !user.face_verified && !user.document_verified && (
                              <span className="text-xs text-gray-400">None</span>
                            )}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          {getVerificationBadge(user)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          <div className="flex items-center">
                            <Calendar size={14} className="mr-2 text-gray-400" />
                            {new Date(user.created_at).toLocaleDateString()}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Pagination */}
              {pagination && pagination.pages > 1 && (
                <div className="px-6 py-4 border-t border-gray-200 flex items-center justify-between">
                  <div className="text-sm text-gray-700">
                    Page {pagination.page} of {pagination.pages}
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => setCurrentPage(currentPage - 1)}
                      disabled={!pagination.hasPrev}
                      className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Previous
                    </button>
                    <button
                      onClick={() => setCurrentPage(currentPage + 1)}
                      disabled={!pagination.hasNext}
                      className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Next
                    </button>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {/* User Details Sidebar */}
      {selectedUser && (
        <div className="fixed inset-0 z-50 overflow-hidden">
          <div className="absolute inset-0 bg-black bg-opacity-50" onClick={closeUserDetails}></div>
          
          <div className="absolute inset-y-0 right-0 max-w-2xl w-full bg-white shadow-xl overflow-y-auto">
            {loadingDetails ? (
              <div className="p-8 text-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
                <p className="mt-2 text-gray-600">Loading user details...</p>
              </div>
            ) : userDetails ? (
              <div className="p-6">
                {/* Header */}
                <div className="flex justify-between items-start mb-6">
                  <div>
                    <h2 className="text-2xl font-bold text-gray-900">{userDetails.name || 'N/A'}</h2>
                    <p className="text-sm text-gray-500">User ID: {userDetails.id}</p>
                  </div>
                  <button
                    onClick={closeUserDetails}
                    className="p-2 hover:bg-gray-100 rounded-md"
                  >
                    <XCircle size={24} />
                  </button>
                </div>

                {/* Status Badge */}
                <div className="mb-6">
                  {getVerificationBadge(userDetails)}
                </div>

                {/* Contact Information */}
                <div className="mb-6 bg-gray-50 rounded-lg p-4">
                  <h3 className="text-lg font-semibold mb-3 flex items-center">
                    <User size={20} className="mr-2" />
                    User Information
                  </h3>
                  <div className="space-y-2">
                    {userDetails.phone && (
                      <div className="flex items-center text-gray-700">
                        <Phone size={16} className="mr-3 text-gray-400" />
                        <span>{userDetails.phone}</span>
                      </div>
                    )}
                    {userDetails.email && (
                      <div className="flex items-center text-gray-700">
                        <Mail size={16} className="mr-3 text-gray-400" />
                        <span>{userDetails.email}</span>
                      </div>
                    )}
                    {userDetails.date_of_birth && (
                      <div className="flex items-center text-gray-700">
                        <Calendar size={16} className="mr-3 text-gray-400" />
                        <span>DOB: {new Date(userDetails.date_of_birth).toLocaleDateString()}</span>
                      </div>
                    )}
                    {userDetails.pension_number && (
                      <div className="flex items-center text-gray-700">
                        <CreditCard size={16} className="mr-3 text-gray-400" />
                        <span>Pension #: {userDetails.pension_number}</span>
                      </div>
                    )}
                    {userDetails.address && (
                      <div className="flex items-center text-gray-700">
                        <MapPin size={16} className="mr-3 text-gray-400" />
                        <span>{userDetails.address}</span>
                      </div>
                    )}
                    {(userDetails.city || userDetails.country) && (
                      <div className="flex items-center text-gray-700">
                        <Globe size={16} className="mr-3 text-gray-400" />
                        <span>
                          {[userDetails.city, userDetails.country].filter(Boolean).join(', ')}
                        </span>
                      </div>
                    )}
                    {userDetails.preferred_language && (
                      <div className="flex items-center text-gray-700">
                        <Globe size={16} className="mr-3 text-gray-400" />
                        <span>Language: {userDetails.preferred_language.toUpperCase()}</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Voice Verification */}
                {userDetails.voice_profile && (
                  <div className="mb-6 bg-purple-50 rounded-lg p-4">
                    <h3 className="text-lg font-semibold mb-3 flex items-center">
                      <Volume2 size={20} className="mr-2 text-purple-600" />
                      Voice Verification
                    </h3>
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span className="text-gray-600">Status:</span>
                        <span className={`font-medium ${userDetails.voice_profile.is_verified ? 'text-green-600' : 'text-yellow-600'}`}>
                          {userDetails.voice_profile.is_verified ? '✓ Verified' : '○ Not Verified'}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Enrolled:</span>
                        <span className="font-medium">
                          {userDetails.voice_profile.is_enrolled ? 'Yes' : 'No'}
                        </span>
                      </div>
                      {userDetails.voice_profile.enrollment_samples_count > 0 && (
                        <div className="flex justify-between">
                          <span className="text-gray-600">Samples:</span>
                          <span className="font-medium">
                            {userDetails.voice_profile.enrollment_samples_count}
                          </span>
                        </div>
                      )}
                      {userDetails.voice_profile.last_match_score && (
                        <div className="flex justify-between">
                          <span className="text-gray-600">Last Match Score:</span>
                          <span className="font-medium">
                            {(userDetails.voice_profile.last_match_score * 100).toFixed(1)}%
                          </span>
                        </div>
                      )}
                      {userDetails.voice_profile.confidence_score && (
                        <div className="flex justify-between">
                          <span className="text-gray-600">Confidence Score:</span>
                          <span className="font-medium">
                            {(userDetails.voice_profile.confidence_score * 100).toFixed(1)}%
                          </span>
                        </div>
                      )}
                      {userDetails.voice_profile.voice_model_ref && (
                        <div className="mt-2 p-2 bg-white rounded border border-purple-100">
                          <span className="text-xs text-gray-500">Model Ref:</span>
                          <p className="text-xs font-mono text-gray-700 break-all">
                            {userDetails.voice_profile.voice_model_ref}
                          </p>
                        </div>
                      )}
                      {userDetails.voice_profile.audio_url && (
                        <div className="mt-3">
                          <label className="text-sm text-gray-600 mb-1 block">Voice Sample:</label>
                          <audio controls className="w-full">
                            <source src={userDetails.voice_profile.audio_url} type="audio/mpeg" />
                          </audio>
                        </div>
                      )}
                      {userDetails.voice_profile.created_at && (
                        <div className="flex justify-between text-xs text-gray-500 mt-2">
                          <span>Enrolled:</span>
                          <span>{new Date(userDetails.voice_profile.created_at).toLocaleString()}</span>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Facial/Liveness Verification */}
                {userDetails.facial_verification && (
                  <div className="mb-6 bg-blue-50 rounded-lg p-4">
                    <h3 className="text-lg font-semibold mb-3 flex items-center">
                      <Camera size={20} className="mr-2 text-blue-600" />
                      Facial Verification (Liveness Check)
                    </h3>
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span className="text-gray-600">Status:</span>
                        <span className={`font-medium ${userDetails.face_verified ? 'text-green-600' : 'text-yellow-600'}`}>
                          {userDetails.face_verified ? '✓ Verified' : '○ Not Verified'}
                        </span>
                      </div>
                      {userDetails.facial_verification.liveness_image_url && (
                        <div className="mt-3">
                          <label className="text-sm text-gray-600 mb-1 block">Liveness Image:</label>
                          <img 
                            src={userDetails.facial_verification.liveness_image_url} 
                            alt="Liveness Check"
                            className="w-full rounded border border-blue-200 max-h-64 object-cover"
                          />
                        </div>
                      )}
                      {userDetails.facial_verification.created_at && (
                        <div className="flex justify-between text-xs text-gray-500 mt-2">
                          <span>Captured:</span>
                          <span>{new Date(userDetails.facial_verification.created_at).toLocaleString()}</span>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Documents */}
                {userDetails.documents && userDetails.documents.length > 0 && (
                  <div className="mb-6 bg-indigo-50 rounded-lg p-4">
                    <h3 className="text-lg font-semibold mb-3 flex items-center">
                      <FileText size={20} className="mr-2 text-indigo-600" />
                      Documents
                    </h3>
                    <div className="space-y-3">
                      {userDetails.documents.map((doc) => (
                        <div key={doc.id} className="bg-white rounded-lg p-3 border border-indigo-100">
                          <div className="flex justify-between items-start mb-2">
                            <div>
                              <span className="font-medium text-gray-900 capitalize">
                                {doc.document_type.replace('_', ' ')}
                              </span>
                              {doc.is_verified && (
                                <CheckCircle size={16} className="inline ml-2 text-green-600" />
                              )}
                            </div>
                            <span className="text-xs text-gray-500">
                              {new Date(doc.created_at).toLocaleDateString()}
                            </span>
                          </div>
                          {doc.document_url && (
                            <div className="mt-2">
                              <img 
                                src={doc.document_url} 
                                alt={doc.document_type}
                                className="w-full rounded border border-gray-200"
                              />
                            </div>
                          )}
                          {doc.verification_notes && (
                            <div className="mt-2 text-sm text-gray-600">
                              <strong>Notes:</strong> {doc.verification_notes}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Verification Requests */}
                {userDetails.verification_requests && userDetails.verification_requests.length > 0 && (
                  <div className="mb-6 bg-yellow-50 rounded-lg p-4">
                    <h3 className="text-lg font-semibold mb-3 flex items-center">
                      <Shield size={20} className="mr-2 text-yellow-600" />
                      Verification Requests
                    </h3>
                    <div className="space-y-3">
                      {userDetails.verification_requests.map((req) => (
                        <div key={req.id} className="bg-white rounded-lg p-3 border border-yellow-100">
                          <div className="flex justify-between items-start mb-2">
                            <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                              req.status === 'approved' 
                                ? 'bg-green-100 text-green-800' 
                                : req.status === 'rejected'
                                ? 'bg-red-100 text-red-800'
                                : 'bg-yellow-100 text-yellow-800'
                            }`}>
                              {req.status === 'approved' && <CheckCircle size={12} className="mr-1" />}
                              {req.status === 'rejected' && <XCircle size={12} className="mr-1" />}
                              {req.status === 'pending' && <Clock size={12} className="mr-1" />}
                              {req.status}
                            </span>
                            <span className="text-xs text-gray-500">
                              {new Date(req.created_at).toLocaleString()}
                            </span>
                          </div>
                          
                          {/* Verification Details */}
                          <div className="space-y-1 text-sm">
                            {req.voice_match_score && (
                              <div className="flex items-center justify-between">
                                <span className="text-gray-600 flex items-center">
                                  <Volume2 size={12} className="mr-1" />
                                  Voice Match:
                                </span>
                                <span className="font-medium">{(req.voice_match_score * 100).toFixed(1)}%</span>
                              </div>
                            )}
                            {req.liveness_image_url && (
                              <div className="flex items-center text-gray-600">
                                <Camera size={12} className="mr-1" />
                                <span>Facial verification completed</span>
                              </div>
                            )}
                            {req.document_url && (
                              <div className="flex items-center text-gray-600">
                                <FileText size={12} className="mr-1" />
                                <span>Document uploaded</span>
                              </div>
                            )}
                          </div>

                          {req.admin_notes && (
                            <div className="mt-2 p-2 bg-gray-50 rounded text-sm">
                              <strong className="text-gray-700">Admin Notes:</strong>
                              <p className="text-gray-600 mt-1">{req.admin_notes}</p>
                            </div>
                          )}
                          
                          {req.updated_at && req.updated_at !== req.created_at && (
                            <div className="mt-2 text-xs text-gray-400">
                              Updated: {new Date(req.updated_at).toLocaleString()}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Registration Details */}
                <div className="bg-gray-50 rounded-lg p-4">
                  <h3 className="text-lg font-semibold mb-3">Registration Details</h3>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Registered:</span>
                      <span className="font-medium">
                        {new Date(userDetails.created_at).toLocaleString()}
                      </span>
                    </div>
                    {userDetails.updated_at && (
                      <div className="flex justify-between">
                        <span className="text-gray-600">Last Updated:</span>
                        <span className="font-medium">
                          {new Date(userDetails.updated_at).toLocaleString()}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ) : (
              <div className="p-8 text-center text-gray-500">
                <p>Failed to load user details</p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
