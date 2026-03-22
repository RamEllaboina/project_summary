import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import { ArrowLeft, CheckCircle, XCircle, Clock, Award, Users, MessageSquare } from 'lucide-react';

const AdminTaskApprovals = () => {
  const [approvals, setApprovals] = useState([]);
  const [stats, setStats] = useState({
    totalApprovals: 0,
    pendingApprovals: 0,
    approvedApprovals: 0,
    rejectedApprovals: 0
  });
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(null);
  const [notes, setNotes] = useState({});
  const { logout } = useAuth();

  useEffect(() => {
    fetchApprovals();
    fetchStats();
  }, []);

  const fetchApprovals = async () => {
    try {
      setLoading(true);
      const res = await axios.get('/api/task-approvals');
      setApprovals(res.data);
    } catch (error) {
      console.error('Error fetching approvals:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      const res = await axios.get('/api/task-approvals/stats');
      setStats(res.data);
    } catch (error) {
      console.error('Error fetching stats:', error);
    }
  };

  const handleApprove = async (approvalId) => {
    try {
      setProcessing(approvalId);
      await axios.put(`/api/task-approvals/${approvalId}/approve`, {
        adminNotes: notes[approvalId] || ''
      });
      alert('Task approved successfully');
      fetchApprovals();
      fetchStats();
    } catch (error) {
      alert('Failed to approve task');
    } finally {
      setProcessing(null);
    }
  };

  const handleReject = async (approvalId) => {
    try {
      setProcessing(approvalId);
      await axios.put(`/api/task-approvals/${approvalId}/reject`, {
        adminNotes: notes[approvalId] || ''
      });
      alert('Task rejected successfully');
      fetchApprovals();
      fetchStats();
    } catch (error) {
      alert('Failed to reject task');
    } finally {
      setProcessing(null);
    }
  };

  const handleNotesChange = (approvalId, value) => {
    setNotes(prev => ({
      ...prev,
      [approvalId]: value
    }));
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'approved':
        return <CheckCircle className="w-5 h-5 text-green-600" />;
      case 'rejected':
        return <XCircle className="w-5 h-5 text-red-600" />;
      default:
        return <Clock className="w-5 h-5 text-yellow-600" />;
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'approved':
        return 'text-green-600 bg-green-50';
      case 'rejected':
        return 'text-red-600 bg-red-50';
      default:
        return 'text-yellow-600 bg-yellow-50';
    }
  };

  const getTaskTypeLabel = (taskType) => {
    switch (taskType) {
      case 'task1_completion':
        return 'Task 1 Completion';
      case 'task2_completion':
        return 'Task 2 Completion';
      case 'reward_eligibility':
        return 'Reward Eligibility';
      default:
        return taskType;
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between py-6">
            <div className="flex items-center gap-4">
              <Link
                to="/admin/dashboard"
                className="flex items-center gap-2 text-gray-600 hover:text-gray-900"
              >
                <ArrowLeft className="w-5 h-5" />
                Back to Dashboard
              </Link>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Task Approvals</h1>
                <p className="text-sm text-gray-600">Review and approve task completions</p>
              </div>
            </div>
            <button
              onClick={logout}
              className="px-4 py-2 text-sm text-gray-700 hover:text-gray-900"
            >
              Logout
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-200">
            <div className="flex items-center">
              <Users className="w-8 h-8 text-primary-600" />
              <div className="ml-4">
                <p className="text-sm text-gray-600">Total Approvals</p>
                <p className="text-2xl font-bold text-gray-900">{stats.totalApprovals}</p>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-200">
            <div className="flex items-center">
              <Clock className="w-8 h-8 text-yellow-600" />
              <div className="ml-4">
                <p className="text-sm text-gray-600">Pending</p>
                <p className="text-2xl font-bold text-gray-900">{stats.pendingApprovals}</p>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-200">
            <div className="flex items-center">
              <CheckCircle className="w-8 h-8 text-green-600" />
              <div className="ml-4">
                <p className="text-sm text-gray-600">Approved</p>
                <p className="text-2xl font-bold text-gray-900">{stats.approvedApprovals}</p>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-200">
            <div className="flex items-center">
              <XCircle className="w-8 h-8 text-red-600" />
              <div className="ml-4">
                <p className="text-sm text-gray-600">Rejected</p>
                <p className="text-2xl font-bold text-gray-900">{stats.rejectedApprovals}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Approvals Table */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900">Task Completion Requests</h2>
          </div>
          
          {approvals.length === 0 ? (
            <div className="text-center py-12">
              <Award className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-600">No task approvals found</p>
              <p className="text-sm text-gray-500 mt-2">Task completions will appear here for review</p>
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
                      Task Type
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Requested
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {approvals.map((approval) => (
                    <tr key={approval._id}>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div>
                          <div className="text-sm font-medium text-gray-900">
                            {approval.userId.email}
                          </div>
                          <div className="text-sm text-gray-500">
                            Ref: {approval.userId.referralCode}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="inline-flex px-2 py-1 text-xs font-medium rounded-full bg-blue-100 text-blue-800">
                          {getTaskTypeLabel(approval.taskType)}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex items-center gap-1 px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(approval.status)}`}>
                          {getStatusIcon(approval.status)}
                          {approval.status.charAt(0).toUpperCase() + approval.status.slice(1)}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {new Date(approval.createdAt).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        {approval.status === 'pending' ? (
                          <div className="space-y-2">
                            <input
                              type="text"
                              placeholder="Add admin notes..."
                              value={notes[approval._id] || ''}
                              onChange={(e) => handleNotesChange(approval._id, e.target.value)}
                              className="w-full px-2 py-1 text-xs border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-primary-500"
                            />
                            <div className="flex gap-2">
                              <button
                                onClick={() => handleApprove(approval._id)}
                                disabled={processing === approval._id}
                                className="px-3 py-1 bg-green-600 text-white rounded hover:bg-green-700 disabled:opacity-50 text-xs"
                              >
                                {processing === approval._id ? 'Processing...' : 'Approve'}
                              </button>
                              <button
                                onClick={() => handleReject(approval._id)}
                                disabled={processing === approval._id}
                                className="px-3 py-1 bg-red-600 text-white rounded hover:bg-red-700 disabled:opacity-50 text-xs"
                              >
                                {processing === approval._id ? 'Processing...' : 'Reject'}
                              </button>
                            </div>
                          </div>
                        ) : (
                          <div>
                            {approval.adminNotes && (
                              <div className="text-xs text-gray-600 max-w-xs">
                                <MessageSquare className="w-3 h-3 inline mr-1" />
                                {approval.adminNotes}
                              </div>
                            )}
                            {approval.processedAt && (
                              <div className="text-xs text-gray-500 mt-1">
                                Processed: {new Date(approval.processedAt).toLocaleDateString()}
                              </div>
                            )}
                          </div>
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
    </div>
  );
};

export default AdminTaskApprovals;
