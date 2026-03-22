import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import { ArrowLeft, Upload, CheckCircle, Clock, XCircle } from 'lucide-react';

const TaskPayment = () => {
  const [utrNumber, setUtrNumber] = useState('');
  const [paymentRequests, setPaymentRequests] = useState([]);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const { user } = useAuth();

  useEffect(() => {
    fetchPaymentRequests();
  }, []);

  const fetchPaymentRequests = async () => {
    try {
      setLoading(true);
      const res = await axios.get('/api/payments/my-requests');
      setPaymentRequests(res.data);
    } catch (error) {
      console.error('Error fetching payment requests:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!utrNumber.trim()) {
      alert('Please enter UTR number');
      return;
    }

    try {
      setSubmitting(true);
      const res = await axios.post('/api/payments/submit', { utrNumber: utrNumber.trim() });
      
      alert('Payment request submitted successfully!');
      setUtrNumber('');
      fetchPaymentRequests();
      
      // Update user data in context
      window.location.reload(); // Simple refresh to update user status
    } catch (error) {
      alert(error.response?.data?.message || 'Failed to submit payment request');
    } finally {
      setSubmitting(false);
    }
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

  const hasPendingRequest = paymentRequests.some(req => req.status === 'pending');
  const hasApprovedRequest = paymentRequests.some(req => req.status === 'approved');

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Pending/Rejected Status Banner */}
      {user?.task1Status === 'submitted' && (
        <div className="bg-yellow-50 border-b border-yellow-200 px-4 py-3">
          <div className="max-w-7xl mx-auto flex items-center justify-between">
            <div className="flex items-center">
              <Clock className="w-5 h-5 text-yellow-600 mr-3" />
              <span className="text-yellow-800 font-medium">
                Your payment verification is pending admin review
              </span>
            </div>
            <span className="text-yellow-600 text-sm">
              Check status in dashboard
            </span>
          </div>
        </div>
      )}
      
      {user?.task1Status === 'rejected' && (
        <div className="bg-red-50 border-b border-red-200 px-4 py-3">
          <div className="max-w-7xl mx-auto flex items-center justify-between">
            <div className="flex items-center">
              <XCircle className="w-5 h-5 text-red-600 mr-3" />
              <span className="text-red-800 font-medium">
                Your payment was rejected. Please resubmit below.
              </span>
            </div>
            <span className="text-red-600 text-sm">
              Review admin notes and resubmit
            </span>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center py-6">
            <Link
              to="/dashboard"
              className="flex items-center gap-2 text-gray-600 hover:text-gray-900"
            >
              <ArrowLeft className="w-5 h-5" />
              Back to Dashboard
            </Link>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Task 1: Scanner Payment</h1>
          <p className="mt-2 text-gray-600">Complete your payment verification to proceed</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* QR Code Scanner Section */}
          <div className="bg-white rounded-lg shadow p-6">
            <div className="text-center">
              <div className="flex justify-center mb-4">
                <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
                  <span className="text-white text-xl font-bold">₹</span>
                </div>
              </div>
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Scan to Pay ₹10</h2>
              <p className="text-gray-600 mb-6">
                Scan this QR code with any payment app to complete the payment
              </p>
              
              <div className="bg-gradient-to-r from-blue-50 to-purple-50 border border-blue-200 rounded-lg p-6 mb-6">
                <div className="text-center">
                  <div className="text-3xl font-bold text-gray-900 mb-2">₹10</div>
                  <div className="text-sm text-gray-600">Payment Amount</div>
                </div>
              </div>
              
              {/* QR Code Display */}
              <div className="flex justify-center mb-6">
                <div className="relative">
                  <div className="w-64 h-64 bg-white border-4 border-gray-200 rounded-lg shadow-lg flex items-center justify-center overflow-hidden md:w-80 md:h-80">
                    <img 
                      src="/scannermobi.jpeg" 
                      alt="Payment Scanner" 
                      className="scanner-image w-full h-full object-contain"
                      style={{ 
                        maxWidth: '300px',
                        maxHeight: '300px'
                      }}
                    />
                  </div>
                  <div className="absolute -top-2 -right-2 bg-red-500 text-white text-xs px-2 py-1 rounded-full animate-pulse">
                    SCAN ME
                  </div>
                </div>
              </div>

              {/* UPI Information */}
              <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 mb-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-700">UPI ID</p>
                    <p className="text-lg font-mono text-gray-900">7815928066@mbk</p>
                  </div>
                  <button
                    onClick={() => {
                      navigator.clipboard.writeText('7815928066@mbk');
                      alert('UPI ID copied to clipboard!');
                    }}
                    className="px-3 py-2 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    Copy
                  </button>
                </div>
              </div>

              <div className="space-y-3 mb-6">
                <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <span className="text-gray-600">Payment Method</span>
                  <span className="font-medium text-gray-900">UPI/QR Code</span>
                </div>
                <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <span className="text-gray-600">Status</span>
                  <span className="font-medium text-yellow-600">Pending</span>
                </div>
                <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <span className="text-gray-600">Task Progress</span>
                  <span className="font-medium text-blue-600">1/2</span>
                </div>
              </div>

              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <div className="flex items-start">
                  <div className="flex-shrink-0">
                    <div className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center">
                      <span className="text-blue-600 text-xs font-bold">i</span>
                    </div>
                  </div>
                  <div className="ml-3">
                    <h3 className="text-sm font-medium text-blue-800">Payment Instructions</h3>
                    <div className="mt-1 text-sm text-blue-700">
                      <p>1. Open any UPI app (PhonePe, GPay, Paytm)</p>
                      <p>2. Scan the QR code above</p>
                      <p>3. Pay ₹10 to complete Task 1</p>
                      <p>4. Copy the UTR/Transaction ID</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* UTR Submission Section */}
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center mb-4">
              <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center mr-3">
                <Upload className="w-4 h-4 text-green-600" />
              </div>
              <h2 className="text-xl font-semibold text-gray-900">Submit Payment Proof</h2>
            </div>
            
            {hasApprovedRequest ? (
              <div className="text-center py-8">
                <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <CheckCircle className="w-8 h-8 text-green-600" />
                </div>
                <h3 className="text-lg font-semibold text-green-600 mb-2">Payment Verified!</h3>
                <p className="text-gray-600 mb-4">Your payment has been approved by the admin.</p>
                <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-4">
                  <p className="text-sm text-green-800">Task 1 completed successfully</p>
                </div>
                <Link
                  to="/dashboard"
                  className="inline-flex items-center px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700"
                >
                  Go to Dashboard
                </Link>
              </div>
            ) : hasPendingRequest ? (
              <div className="text-center py-8">
                <div className="w-16 h-16 bg-yellow-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Clock className="w-8 h-8 text-yellow-600" />
                </div>
                <h3 className="text-lg font-semibold text-yellow-600 mb-2">Verification Pending</h3>
                <p className="text-gray-600 mb-4">Your payment request is under review by the admin.</p>
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                  <p className="text-sm text-yellow-800">Please check back later for updates</p>
                </div>
              </div>
            ) : user?.task1Status === 'rejected' ? (
              <div className="text-center py-8">
                <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <XCircle className="w-8 h-8 text-red-600" />
                </div>
                <h3 className="text-lg font-semibold text-red-600 mb-2">Payment Rejected</h3>
                <p className="text-gray-600 mb-4">Please review the admin notes and resubmit with correct UTR.</p>
                <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4 max-w-md mx-auto">
                  <p className="text-sm text-red-800">
                    {paymentRequests.find(req => req.status === 'rejected')?.adminNotes || 'No admin notes provided.'}
                  </p>
                </div>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-6">
                <div>
                  <label htmlFor="utr" className="block text-sm font-medium text-gray-700 mb-2">
                    UTR / Transaction ID
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      id="utr"
                      value={utrNumber}
                      onChange={(e) => setUtrNumber(e.target.value)}
                      placeholder="Enter UTR number from your payment app"
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                      required
                    />
                    <div className="absolute inset-y-0 right-0 flex items-center pr-3">
                      <Upload className="w-5 h-5 text-gray-400" />
                    </div>
                  </div>
                  <p className="text-sm text-gray-500 mt-2">
                    You can find the UTR in your payment app's transaction history
                  </p>
                </div>

                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <div className="flex items-start">
                    <div className="flex-shrink-0">
                      <div className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center">
                        <span className="text-blue-600 text-xs font-bold">i</span>
                      </div>
                    </div>
                    <div className="ml-3">
                      <h3 className="text-sm font-medium text-blue-800">How to find UTR</h3>
                      <div className="mt-1 text-sm text-blue-700">
                        <ul className="list-disc list-inside space-y-1">
                          <li>Open your payment app (PhonePe, GPay, Paytm, etc.)</li>
                          <li>Go to transaction history</li>
                          <li>Find the ₹10 payment transaction</li>
                          <li>Copy the UTR/Transaction ID (usually 12-22 digits)</li>
                        </ul>
                      </div>
                    </div>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={submitting}
                  className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg hover:from-blue-700 hover:to-purple-700 disabled:opacity-50 transition-all duration-200"
                >
                  <Upload className="w-4 h-4" />
                  {submitting ? 'Submitting...' : 'Submit Payment Proof'}
                </button>
              </form>
            )}

            {/* Payment History */}
            {paymentRequests.length > 0 && (
              <div className="mt-8">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Payment History</h3>
                <div className="space-y-3">
                  {paymentRequests.map((request) => (
                    <div key={request._id} className="border border-gray-200 rounded-lg p-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-medium text-gray-900">UTR: {request.utrNumber}</p>
                          <p className="text-sm text-gray-500">
                            {new Date(request.createdAt).toLocaleString()}
                          </p>
                          {request.adminNotes && (
                            <p className="text-sm text-gray-600 mt-1">
                              Note: {request.adminNotes}
                            </p>
                          )}
                        </div>
                        <div className={`flex items-center gap-2 px-3 py-1 rounded-full ${getStatusColor(request.status)}`}>
                          {getStatusIcon(request.status)}
                          <span className="text-sm font-medium">
                            {request.status.charAt(0).toUpperCase() + request.status.slice(1)}
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default TaskPayment;
