import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import PrivateRoute from './components/PrivateRoute';
import AdminRoute from './components/AdminRoute';

// Pages
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import TaskPayment from './pages/TaskPayment';
import Referrals from './pages/Referrals';
import AdminDashboard from './pages/AdminDashboard';
import AdminPayments from './pages/AdminPayments';
import AdminRequests from './pages/AdminRequests';
import AdminLogin from './pages/AdminLogin';
import AdminRewards from './pages/AdminRewards';
import AdminTaskApprovals from './pages/AdminTaskApprovals';

function App() {
  return (
    <AuthProvider>
      <Router>
        <div className="min-h-screen bg-gray-50">
          <Routes>
            {/* Public routes */}
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route path="/admin/login" element={<AdminLogin />} />
            
            {/* Protected user routes */}
            <Route path="/dashboard" element={
              <PrivateRoute>
                <Dashboard />
              </PrivateRoute>
            } />
            <Route path="/task-payment" element={
              <PrivateRoute>
                <TaskPayment />
              </PrivateRoute>
            } />
            <Route path="/referrals" element={
              <PrivateRoute>
                <Referrals />
              </PrivateRoute>
            } />
            
            {/* Protected admin routes */}
            <Route path="/admin/dashboard" element={
              <AdminRoute>
                <AdminDashboard />
              </AdminRoute>
            } />
            <Route path="/admin/payments" element={
              <AdminRoute>
                <AdminPayments />
              </AdminRoute>
            } />
            <Route path="/admin/requests" element={
              <AdminRoute>
                <AdminRequests />
              </AdminRoute>
            } />
            <Route path="/admin/rewards" element={
              <AdminRoute>
                <AdminRewards />
              </AdminRoute>
            } />
            <Route path="/admin/task-approvals" element={
              <AdminRoute>
                <AdminTaskApprovals />
              </AdminRoute>
            } />
            
            {/* Default redirect */}
            <Route path="/" element={<Navigate to="/dashboard" />} />
          </Routes>
        </div>
      </Router>
    </AuthProvider>
  );
}

export default App;
