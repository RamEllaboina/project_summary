import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import { CheckCircle, Clock, Users, Gift, Copy, LogOut, XCircle } from 'lucide-react';

const Dashboard = () => {
  const [dashboardData, setDashboardData] = useState(null);
  const [copied, setCopied] = useState(false);
  const { user, logout } = useAuth();

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      const res = await axios.get('/api/users/dashboard');
      setDashboardData(res.data);
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    }
  };

  const copyReferralLink = () => {
    const referralLink = `${window.location.origin}/register?ref=${user.referralCode}`;
    navigator.clipboard.writeText(referralLink);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const getTaskStatusColor = (status) => {
    switch (status) {
      case 'verified':
      case 'completed':
        return 'text-green-600';
      case 'submitted':
        return 'text-yellow-600';
      case 'rejected':
        return 'text-red-600';
      default:
        return 'text-gray-600';
    }
  };

  const getTaskStatusIcon = (status) => {
    switch (status) {
      case 'verified':
      case 'completed':
        return <CheckCircle className="w-5 h-5" />;
      case 'submitted':
        return <Clock className="w-5 h-5" />;
      default:
        return <Clock className="w-5 h-5" />;
    }
  };

  if (!dashboardData) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  const { user: userData, validReferralCount } = dashboardData;
  const referralProgress = Math.min((validReferralCount / 10) * 100, 100);

  // Remove registration blocking - all users can access dashboard normally
  // Only show specific task-related notifications, not registration blocking

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Pending Task Notifications */}
      {userData.task1Status === 'submitted' && (
        <div className="bg-yellow-50 border-b border-yellow-200 px-4 py-3">
          <div className="max-w-7xl mx-auto flex items-center justify-between">
            <div className="flex items-center">
              <Clock className="w-5 h-5 text-yellow-600 mr-3" />
              <span className="text-yellow-800 font-medium">
                Your payment verification is pending admin review
              </span>
            </div>
            <span className="text-yellow-600 text-sm">
              Submitted: {new Date().toLocaleDateString()}
            </span>
          </div>
        </div>
      )}
      
      {userData.task1Status === 'rejected' && (
        <div className="bg-red-50 border-b border-red-200 px-4 py-3">
          <div className="max-w-7xl mx-auto flex items-center justify-between">
            <div className="flex items-center">
              <XCircle className="w-5 h-5 text-red-600 mr-3" />
              <span className="text-red-800 font-medium">
                Your payment was rejected. Please resubmit with correct UTR.
              </span>
            </div>
            <Link
              to="/task-payment"
              className="text-red-600 hover:text-red-800 text-sm font-medium"
            >
              Resubmit Payment →
            </Link>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
              <p className="text-sm text-gray-600">Welcome back, {userData.email}</p>
            </div>
            <button
              onClick={logout}
              className="flex items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:text-gray-900"
            >
              <LogOut className="w-4 h-4" />
              Logout
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Overall Status */}
        <div className="mb-8">
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-lg font-semibold text-gray-900">Overall Status</h2>
                <p className={`text-2xl font-bold mt-2 ${getTaskStatusColor(userData.overallStatus)}`}>
                  {userData.overallStatus.replace('_', ' ').toUpperCase()}
                </p>
              </div>
              {userData.overallStatus === 'all_completed' && (
                <Gift className="w-12 h-12 text-green-600" />
              )}
            </div>
          </div>
        </div>

        {/* Tasks Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          {/* Task 1 */}
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">Task 1: Scanner Payment</h3>
              <span className={`flex items-center gap-2 ${getTaskStatusColor(userData.task1Status)}`}>
                {getTaskStatusIcon(userData.task1Status)}
                <span className="text-sm font-medium">
                  {userData.task1Status.toUpperCase()}
                </span>
              </span>
            </div>
            <p className="text-gray-600 mb-4">
              Pay ₹10 and submit UTR for verification
            </p>
            {userData.task1Status === 'pending' && (
              <Link
                to="/task-payment"
                className="w-full bg-primary-600 text-white py-2 px-4 rounded-md hover:bg-primary-700 transition-colors text-center block"
              >
                Complete Task 1
              </Link>
            )}
            {userData.task1Status === 'submitted' && (
              <p className="text-sm text-yellow-600">Waiting for admin verification...</p>
            )}
            {userData.task1Status === 'verified' && (
              <p className="text-sm text-green-600">✓ Task completed successfully!</p>
            )}
            {userData.task1Status === 'rejected' && (
              <Link
                to="/task-payment"
                className="w-full bg-red-600 text-white py-2 px-4 rounded-md hover:bg-red-700 transition-colors text-center block"
              >
                Resubmit Payment
              </Link>
            )}
          </div>

          {/* Task 2 */}
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">Task 2: Referrals</h3>
              <span className={`flex items-center gap-2 ${getTaskStatusColor(userData.task2Status)}`}>
                {getTaskStatusIcon(userData.task2Status)}
                <span className="text-sm font-medium">
                  {userData.task2Status.toUpperCase()}
                </span>
              </span>
            </div>
            <p className="text-gray-600 mb-4">
              Get 10 valid referrals who complete Task 1
            </p>
            <div className="mb-4">
              <div className="flex justify-between text-sm text-gray-600 mb-1">
                <span>Progress: {validReferralCount}/10</span>
                <span>{Math.round(referralProgress)}%</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div
                  className="bg-primary-600 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${referralProgress}%` }}
                ></div>
              </div>
            </div>
            <Link
              to="/referrals"
              className="w-full bg-primary-600 text-white py-2 px-4 rounded-md hover:bg-primary-700 transition-colors text-center block"
            >
              Manage Referrals
            </Link>
          </div>
        </div>

        {/* Referral Link */}
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Your Referral Link</h3>
          <div className="flex items-center gap-4">
            <div className="flex-1">
              <input
                type="text"
                value={`${window.location.origin}/register?ref=${user.referralCode}`}
                readOnly
                className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-50"
              />
            </div>
            <button
              onClick={copyReferralLink}
              className="flex items-center gap-2 px-4 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700 transition-colors"
            >
              <Copy className="w-4 h-4" />
              {copied ? 'Copied!' : 'Copy'}
            </button>
          </div>
          <p className="text-sm text-gray-600 mt-2">
            Share this link with friends to earn referrals
          </p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-8">
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <Users className="w-8 h-8 text-primary-600" />
              <div className="ml-4">
                <p className="text-sm text-gray-600">Total Referrals</p>
                <p className="text-2xl font-bold text-gray-900">{userData.totalReferrals}</p>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <CheckCircle className="w-8 h-8 text-green-600" />
              <div className="ml-4">
                <p className="text-sm text-gray-600">Valid Referrals</p>
                <p className="text-2xl font-bold text-gray-900">{validReferralCount}</p>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <Gift className="w-8 h-8 text-yellow-600" />
              <div className="ml-4">
                <p className="text-sm text-gray-600">Reward Status</p>
                <p className="text-lg font-bold text-gray-900">
                  {userData.overallStatus === 'all_completed' ? '₹100 Earned!' : 'In Progress'}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
