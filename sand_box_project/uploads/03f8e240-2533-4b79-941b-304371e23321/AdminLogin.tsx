import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';

const AdminLogin: React.FC = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);
  
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!username || !password) {
      setMessage('Please enter both username and password');
      return;
    }

    setLoading(true);
    setMessage('');

    try {
      // This would connect to admin login endpoint
      // For now, just simulate admin login
      if (username === 'admin' && password === 'admin') {
        sessionStorage.setItem('adminToken', 'demo-admin-token');
        setMessage('Login successful! Redirecting...');
        setTimeout(() => {
          navigate('/admin');
        }, 1000);
      } else {
        setMessage('Invalid admin credentials');
      }
    } catch (error) {
      setMessage('Login failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="quiz-card">
      <div className="text-center">
        <div style={{ fontSize: '3rem', marginBottom: '20px', color: '#06b6d4' }}>
          <i className="fas fa-shield-alt"></i>
        </div>
        <h2>Admin Login</h2>
        <p className="section-desc">Access the administrative dashboard</p>
      </div>

      <form onSubmit={handleSubmit} style={{ maxWidth: '400px', margin: '0 auto' }}>
        {message && (
          <div 
            style={{
              padding: '12px',
              borderRadius: '8px',
              marginBottom: '20px',
              backgroundColor: 'rgba(239, 68, 68, 0.1)',
              border: '1px solid var(--danger)',
              color: 'var(--danger)'
            }}
          >
            {message}
          </div>
        )}

        <div style={{ marginBottom: '20px' }}>
          <label style={{ display: 'block', marginBottom: '8px', fontWeight: '500' }}>
            Admin Username
          </label>
          <input
            type="text"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            style={{
              width: '100%',
              padding: '12px',
              borderRadius: '8px',
              border: '1px solid var(--border-color)',
              backgroundColor: 'var(--bg-card)',
              color: 'var(--text-main)',
              fontSize: '16px'
            }}
            placeholder="Enter admin username"
            required
          />
        </div>

        <div style={{ marginBottom: '30px' }}>
          <label style={{ display: 'block', marginBottom: '8px', fontWeight: '500' }}>
            Admin Password
          </label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            style={{
              width: '100%',
              padding: '12px',
              borderRadius: '8px',
              border: '1px solid var(--border-color)',
              backgroundColor: 'var(--bg-card)',
              color: 'var(--text-main)',
              fontSize: '16px'
            }}
            placeholder="Enter admin password"
            required
          />
        </div>

        <button
          type="submit"
          className="btn-primary"
          disabled={loading}
          style={{
            width: '100%',
            padding: '14px',
            fontSize: '16px',
            fontWeight: '600',
            marginBottom: '20px',
            backgroundColor: '#06b6d4'
          }}
        >
          {loading ? (
            <>
              <i className="fas fa-spinner fa-spin" style={{ marginRight: '8px' }}></i>
              Logging in...
            </>
          ) : (
            <>
              <i className="fas fa-sign-in-alt" style={{ marginRight: '8px' }}></i>
              Admin Login
            </>
          )}
        </button>

        <div style={{ textAlign: 'center', paddingTop: '20px', borderTop: '1px solid var(--border-color)' }}>
          <Link
            to="/login"
            style={{
              color: 'var(--primary)',
              textDecoration: 'none',
              fontWeight: '600'
            }}
          >
            <i className="fas fa-arrow-left" style={{ marginRight: '5px' }}></i>
            Back to User Login
          </Link>
        </div>
      </form>
    </div>
  );
};

export default AdminLogin;
