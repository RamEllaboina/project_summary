import React from 'react';
import { useNavigate } from 'react-router-dom';

const AdminPanel: React.FC = () => {
  const navigate = useNavigate();

  const handleLogout = () => {
    sessionStorage.removeItem('adminToken');
    navigate('/admin-login');
  };

  return (
    <div className="quiz-card">
      <div className="text-center">
        <div style={{ fontSize: '3rem', marginBottom: '20px', color: '#06b6d4' }}>
          <i className="fas fa-tools"></i>
        </div>
        <h2>Admin Panel</h2>
        <p className="section-desc">Manage quizzes, subjects, and users</p>
      </div>

      <div style={{ maxWidth: '600px', margin: '0 auto' }}>
        <div style={{ 
          display: 'grid', 
          gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', 
          gap: '20px',
          marginTop: '40px'
        }}>
          <div 
            className="subject-card"
            style={{ cursor: 'pointer' }}
            onClick={() => alert('Manage Subjects - Feature coming soon!')}
          >
            <div className="subject-icon" style={{ backgroundColor: 'rgba(6, 182, 212, 0.1)', color: '#06b6d4' }}>
              <i className="fas fa-book"></i>
            </div>
            <div className="subject-title">Manage Subjects</div>
            <div className="subject-count">Create and edit subjects</div>
          </div>

          <div 
            className="subject-card"
            style={{ cursor: 'pointer' }}
            onClick={() => alert('Manage Quizzes - Feature coming soon!')}
          >
            <div className="subject-icon" style={{ backgroundColor: 'rgba(99, 102, 241, 0.1)', color: 'var(--primary)' }}>
              <i className="fas fa-question-circle"></i>
            </div>
            <div className="subject-title">Manage Quizzes</div>
            <div className="subject-count">Create and edit quizzes</div>
          </div>

          <div 
            className="subject-card"
            style={{ cursor: 'pointer' }}
            onClick={() => alert('View Users - Feature coming soon!')}
          >
            <div className="subject-icon" style={{ backgroundColor: 'rgba(16, 185, 129, 0.1)', color: 'var(--success)' }}>
              <i className="fas fa-users"></i>
            </div>
            <div className="subject-title">View Users</div>
            <div className="subject-count">Manage user accounts</div>
          </div>

          <div 
            className="subject-card"
            style={{ cursor: 'pointer' }}
            onClick={() => alert('View Results - Feature coming soon!')}
          >
            <div className="subject-icon" style={{ backgroundColor: 'rgba(245, 158, 11, 0.1)', color: '#f59e0b' }}>
              <i className="fas fa-chart-bar"></i>
            </div>
            <div className="subject-title">View Results</div>
            <div className="subject-count">Analyze quiz results</div>
          </div>
        </div>

        <div style={{ textAlign: 'center', marginTop: '40px' }}>
          <button 
            className="btn-secondary"
            onClick={handleLogout}
          >
            <i className="fas fa-sign-out-alt" style={{ marginRight: '8px' }}></i>
            Logout
          </button>
        </div>
      </div>
    </div>
  );
};

export default AdminPanel;
