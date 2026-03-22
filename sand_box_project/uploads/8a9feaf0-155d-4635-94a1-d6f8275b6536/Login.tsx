import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';

const Login: React.FC = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(false);
  const [message, setMessage] = useState('');
  const [messageType, setMessageType] = useState<'success' | 'error' | ''>('');
  const [loading, setLoading] = useState(false);
  
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!username || !password) {
      showMessage('Please enter both username/email and password', 'error');
      return;
    }

    setLoading(true);
    setMessage('');

    try {
      const response = await login(username, password);
      
      if (response.success) {
        showMessage('Login successful! Redirecting...', 'success');
        
        if (rememberMe) {
          localStorage.setItem('rememberMe', 'true');
        }
        
        setTimeout(() => {
          navigate('/');
        }, 1500);
      } else {
        showMessage(response.message || 'Invalid credentials', 'error');
      }
    } catch (error) {
      showMessage('Login failed. Please check your connection.', 'error');
      console.error('Login error:', error);
    } finally {
      setLoading(false);
    }
  };

  const showMessage = (text: string, type: 'success' | 'error') => {
    setMessage(text);
    setMessageType(type);
    
    if (type === 'success') {
      setTimeout(() => {
        setMessage('');
        setMessageType('');
      }, 3000);
    }
  };

  return (
    <div className="quiz-card">
      <div className="text-center">
        <div style={{ fontSize: '3rem', marginBottom: '20px', color: 'var(--primary)' }}>
          <i className="fas fa-graduation-cap"></i>
        </div>
        <h2>Welcome Back</h2>
        <p className="section-desc">Sign in to continue your learning journey</p>
      </div>

      <form onSubmit={handleSubmit} style={{ maxWidth: '400px', margin: '0 auto' }}>
        {message && (
          <div 
            className={`message ${messageType}`}
            style={{
              padding: '12px',
              borderRadius: '8px',
              marginBottom: '20px',
              backgroundColor: messageType === 'error' ? 'rgba(239, 68, 68, 0.1)' : 'rgba(16, 185, 129, 0.1)',
              border: `1px solid ${messageType === 'error' ? 'var(--danger)' : 'var(--success)'}`,
              color: messageType === 'error' ? 'var(--danger)' : 'var(--success)'
            }}
          >
            {message}
          </div>
        )}

        <div style={{ marginBottom: '20px' }}>
          <label style={{ display: 'block', marginBottom: '8px', fontWeight: '500' }}>
            Username or Email
          </label>
          <input
            type="text"
            id="username"
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
            placeholder="Enter your username or email"
            required
          />
        </div>

        <div style={{ marginBottom: '20px' }}>
          <label style={{ display: 'block', marginBottom: '8px', fontWeight: '500' }}>
            Password
          </label>
          <input
            type="password"
            id="password"
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
            placeholder="Enter your password"
            required
          />
        </div>

        <div style={{ marginBottom: '30px', display: 'flex', alignItems: 'center', gap: '10px' }}>
          <input
            type="checkbox"
            id="rememberMe"
            checked={rememberMe}
            onChange={(e) => setRememberMe(e.target.checked)}
            style={{ width: 'auto' }}
          />
          <label htmlFor="rememberMe" style={{ margin: 0, cursor: 'pointer' }}>
            Remember me
          </label>
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
            marginBottom: '20px'
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
              Login
            </>
          )}
        </button>

        <div style={{ textAlign: 'center', paddingTop: '20px', borderTop: '1px solid var(--border-color)' }}>
          <p style={{ color: 'var(--text-muted)', marginBottom: '10px' }}>
            Don't have an account?
          </p>
          <Link
            to="/register"
            style={{
              color: 'var(--primary)',
              textDecoration: 'none',
              fontWeight: '600'
            }}
          >
            <i className="fas fa-user-plus" style={{ marginRight: '5px' }}></i>
            Create Account
          </Link>
        </div>

        <div style={{ textAlign: 'center', marginTop: '20px' }}>
          <Link
            to="/admin-login"
            style={{
              color: 'var(--text-muted)',
              textDecoration: 'none',
              fontSize: '0.9rem'
            }}
          >
            <i className="fas fa-shield-alt" style={{ marginRight: '5px' }}></i>
            Admin Panel
          </Link>
        </div>
      </form>
    </div>
  );
};

export default Login;
