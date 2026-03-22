import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import { ArrowLeft, Award, CheckCircle, XCircle, DollarSign, Calendar, User, MessageSquare, Clock } from 'lucide-react';

const AdminRewards = () => {
  const [rewards, setRewards] = useState([]);
  const [stats, setStats] = useState({
    totalRewards: 0,
    pendingRewards: 0,
    approvedRewards: 0,
    rejectedRewards: 0,
    paidRewards: 0
  });
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(null);
  const [notes, setNotes] = useState({});
  const { logout } = useAuth();

  useEffect(() => {
    fetchRewards();
    fetchStats();
  }, []);

  const fetchRewards = async () => {
    try {
      setLoading(true);
      const res = await axios.get('/api/rewards');
      setRewards(res.data);
    } catch (error) {
      console.error('Error fetching rewards:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      const res = await axios.get('/api/rewards/stats');
      setStats(res.data);
    } catch (error) {
      console.error('Error fetching stats:', error);
    }
  };

  const handleApprove = async (rewardId) => {
    try {
      setProcessing(rewardId);
      await axios.put(`/api/rewards/${rewardId}/approve`, {
        adminNotes: notes[rewardId] || ''
      });
      alert('Reward approved successfully');
      fetchRewards();
      fetchStats();
    } catch (error) {
      alert('Failed to approve reward');
    } finally {
      setProcessing(null);
    }
  };

  const handleReject = async (rewardId) => {
    try {
      setProcessing(rewardId);
      await axios.put(`/api/rewards/${rewardId}/reject`, {
        adminNotes: notes[rewardId] || ''
      });
      alert('Reward rejected successfully');
      fetchRewards();
      fetchStats();
    } catch (error) {
      alert('Failed to reject reward');
    } finally {
      setProcessing(null);
    }
  };

  const handleMarkPaid = async (rewardId) => {
    try {
      setProcessing(rewardId);
      await axios.put(`/api/rewards/${rewardId}/paid`);
      alert('Reward marked as paid successfully');
      fetchRewards();
      fetchStats();
    } catch (error) {
      alert('Failed to mark reward as paid');
    } finally {
      setProcessing(null);
    }
  };

  const handleNotesChange = (rewardId, value) => {
    setNotes(prev => ({
      ...prev,
      [rewardId]: value
    }));
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'approved':
        return <CheckCircle className="w-5 h-5 text-green-600" />;
      case 'rejected':
        return <XCircle className="w-5 h-5 text-red-600" />;
      case 'paid':
        return <DollarSign className="w-5 h-5 text-blue-600" />;
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
      case 'paid':
        return 'text-blue-600 bg-blue-50';
      default:
        return 'text-yellow-600 bg-yellow-50';
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
          <div className="flex justify-between items-center py-6">
            <div className="flex items-center gap-4">
              <Link
                to="/admin/dashboard"
                className="flex items-center gap-2 text-gray-600 hover:text-gray-900"
              >
                <ArrowLeft className="w-5 h-5" />
                Back to Dashboard
              </Link>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Reward Management</h1>
                <p className="text-sm text-gray-600">Approve and manage user rewards</p>
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
        <div className="grid grid-cols-1 md:grid-cols-5 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-200">
            <div className="flex items-center">
              <Award className="w-8 h-8 text-primary-600" />
              <div className="ml-4">
                <p className="text-sm text-gray-600">Total Rewards</p>
                <p className="text-2xl font-bold text-gray-900">{stats.totalRewards}</p>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-200">
            <div className="flex items-center">
              <Clock className="w-8 h-8 text-yellow-600" />
              <div className="ml-4">
                <p className="text-sm text-gray-600">Pending</p>
                <p className="text-2xl font-bold text-gray-900">{stats.pendingRewards}</p>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-200">
            <div className="flex items-center">
              <CheckCircle className="w-8 h-8 text-green-600" />
              <div className="ml-4">
                <p className="text-sm text-gray-600">Approved</p>
                <p className="text-2xl font-bold text-gray-900">{stats.approvedRewards}</p>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-200">
            <div className="flex items-center">
              <XCircle className="w-8 h-8 text-red-600" />
              <div className="ml-4">
                <p className="text-sm text-gray-600">Rejected</p>
                <p className="text-2xl font-bold text-gray-900">{stats.rejectedRewards}</p>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-200">
            <div className="flex items-center">
              <DollarSign className="w-8 h-8 text-blue-600" />
              <div className="ml-4">
                <p className="text-sm text-gray-600">Paid</p>
                <p className="text-2xl font-bold text-gray-900">{stats.paidRewards}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Rewards Table */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900">All Rewards</h2>
          </div>
          
          {rewards.length === 0 ? (
            <div className="text-center py-12">
              <Award className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-600">No rewards found</p>
              <p className="text-sm text-gray-500 mt-2">Rewards will appear here when users complete both tasks</p>
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
                      Amount
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Created
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {rewards.map((reward) => (
                    <tr key={reward._id}>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div>
                          <div className="text-sm font-medium text-gray-900">
                            {reward.userId.email}
                          </div>
                          <div className="text-sm text-gray-500">
                            Ref: {reward.userId.referralCode}
                          </div>
                          <div className="text-xs text-gray-400">
                            Referrals: {reward.userId.validReferrals}/{reward.userId.totalReferrals}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        ₹{reward.amount}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex items-center gap-1 px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(reward.status)}`}>
                          {getStatusIcon(reward.status)}
                          {reward.status.charAt(0).toUpperCase() + reward.status.slice(1)}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        <div>
                          <div>{new Date(reward.createdAt).toLocaleDateString()}</div>
                          <div className="text-xs">{new Date(reward.createdAt).toLocaleTimeString()}</div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        {reward.status === 'pending' ? (
                          <div className="space-y-2">
                            <div className="flex gap-2">
                              <button
                                onClick={() => handleApprove(reward._id)}
                                disabled={processing === reward._id}
                                className="px-3 py-1 bg-green-600 text-white rounded hover:bg-green-700 disabled:opacity-50 text-xs"
                              >
                                {processing === reward._id ? 'Processing...' : 'Approve'}
                              </button>
                              <button
                                onClick={() => handleReject(reward._id)}
                                disabled={processing === reward._id}
                                className="px-3 py-1 bg-red-600 text-white rounded hover:bg-red-700 disabled:opacity-50 text-xs"
                              >
                                {processing === reward._id ? 'Processing...' : 'Reject'}
                              </button>
                            </div>
                            <input
                              type="text"
                              placeholder="Add notes..."
                              value={notes[reward._id] || ''}
                              onChange={(e) => handleNotesChange(reward._id, e.target.value)}
                              className="w-full px-2 py-1 text-xs border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-primary-500"
                            />
                          </div>
                        ) : reward.status === 'approved' ? (
                          <div className="space-y-2">
                            <button
                              onClick={() => handleMarkPaid(reward._id)}
                              disabled={processing === reward._id}
                              className="px-3 py-1 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50 text-xs"
                            >
                              {processing === reward._id ? 'Processing...' : 'Mark as Paid'}
                            </button>
                            {reward.adminNotes && (
                              <div className="text-xs text-gray-600 max-w-xs">
                                <strong>Note:</strong> {reward.adminNotes}
                              </div>
                            )}
                          </div>
                        ) : (
                          <div>
                            {reward.adminNotes && (
                              <div className="text-xs text-gray-600 max-w-xs">
                                <strong>Note:</strong> {reward.adminNotes}
                              </div>
                            )}
                            {reward.approvedAt && (
                              <div className="text-xs text-gray-500 mt-1">
                                Approved: {new Date(reward.approvedAt).toLocaleDateString()}
                              </div>
                            )}
                            {reward.paidAt && (
                              <div className="text-xs text-gray-500 mt-1">
                                Paid: {new Date(reward.paidAt).toLocaleDateString()}
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

export default AdminRewards;
