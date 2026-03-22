import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { Subject, Quiz, QuizResult } from '../types';
import { apiClient } from '../utils/api';

const QuizDashboard: React.FC = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [quizzes, setQuizzes] = useState<Quiz[]>([]);
  const [history, setHistory] = useState<QuizResult[]>([]);
  const [selectedSubject, setSelectedSubject] = useState<string | null>(null);
  const [currentView, setCurrentView] = useState<'subjects' | 'quizzes' | 'history' | 'quiz'>('subjects');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadSubjects();
  }, []);

  const loadSubjects = async () => {
    try {
      setLoading(true);
      const response = await apiClient.getSubjects();
      setSubjects(response.subjects);
    } catch (error) {
      console.error('Failed to load subjects:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadQuizzes = async (subjectId: string) => {
    try {
      setLoading(true);
      const response = await apiClient.getQuizzes(subjectId);
      setQuizzes(response.quizzes);
      setSelectedSubject(subjectId);
      setCurrentView('quizzes');
    } catch (error) {
      console.error('Failed to load quizzes:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadHistory = async () => {
    try {
      setLoading(true);
      const response = await apiClient.getMyHistory();
      setHistory(response.results);
      setCurrentView('history');
    } catch (error) {
      console.error('Failed to load history:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    if (confirm('Are you sure you want to logout?')) {
      logout();
      navigate('/login');
    }
  };

  const goBackToSubjects = () => {
    setCurrentView('subjects');
    setSelectedSubject(null);
    setQuizzes([]);
  };

  const startQuiz = (quizId: string) => {
    // Navigate to quiz component (we'll create this next)
    navigate(`/quiz/${quizId}`);
  };

  const renderSubjects = () => (
    <>
      <div className="text-center">
        <h2>Knowledge Hub</h2>
        <p className="section-desc">Select a category to begin your assessment.</p>
      </div>
      {loading ? (
        <div className="text-center">
          <i className="fas fa-spinner fa-spin" style={{ fontSize: '2rem', marginBottom: '20px' }}></i>
          <p>Loading subjects...</p>
        </div>
      ) : (
        <div className="subject-grid">
          {subjects.length === 0 ? (
            <p className="text-center" style={{ color: 'var(--text-muted)' }}>
              No subjects available yet.
            </p>
          ) : (
            subjects.map((subject, index) => (
              <div
                key={subject._id}
                className="subject-card"
                onClick={() => loadQuizzes(subject._id)}
                style={{ animationDelay: `${index * 0.1}s` }}
              >
                <div className="subject-icon">
                  <i className="fas fa-book-open"></i>
                </div>
                <div className="subject-title">{subject.name}</div>
                <div className="subject-count">{subject.description || 'Explore quizzes'}</div>
              </div>
            ))
          )}
        </div>
      )}
    </>
  );

  const renderQuizzes = () => {
    const currentSubject = subjects.find(s => s._id === selectedSubject);
    
    return (
      <>
        <div style={{ display: 'flex', alignItems: 'center', gap: '15px', marginBottom: '20px' }}>
          <button className="btn-secondary" onClick={goBackToSubjects}>
            <i className="fas fa-arrow-left"></i> Back
          </button>
          <div>
            <h3 style={{ fontSize: '1.2rem', fontWeight: '700', color: 'var(--text-main)' }}>
              {currentSubject?.name} Quizzes
            </h3>
            <p style={{ fontSize: '0.9rem', color: 'var(--text-muted)' }}>
              Select a difficulty level
            </p>
          </div>
        </div>
        
        {loading ? (
          <div className="text-center">
            <i className="fas fa-spinner fa-spin" style={{ fontSize: '2rem', marginBottom: '20px' }}></i>
            <p>Loading quizzes...</p>
          </div>
        ) : (
          <>
            {quizzes.length === 0 ? (
              <p className="text-center" style={{ color: 'var(--text-muted)' }}>
                No quizzes available for this subject.
              </p>
            ) : (
              quizzes.map((quiz, index) => (
                <div
                  key={quiz._id}
                  className="quiz-list-item"
                  style={{ animationDelay: `${index * 0.1}s` }}
                >
                  <div className="quiz-list-info">
                    <h4>{quiz.title}</h4>
                    <div className="quiz-meta">
                      <span><i className="fas fa-layer-group"></i> {quiz.difficulty}</span>
                      <span><i className="fas fa-clock"></i> {quiz.timeLimit}m</span>
                    </div>
                  </div>
                  <button 
                    className="btn-primary"
                    onClick={() => startQuiz(quiz._id)}
                  >
                    Start <i className="fas fa-arrow-right"></i>
                  </button>
                </div>
              ))
            )}
          </>
        )}
      </>
    );
  };

  const renderHistory = () => (
    <>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <h2 style={{ fontSize: '1.5rem', margin: 0 }}>Attempt History</h2>
        <button className="btn-secondary" onClick={() => setCurrentView('subjects')}>
          Close
        </button>
      </div>

      <div className="history-list" style={{ maxHeight: '400px', overflowY: 'auto' }}>
        {loading ? (
          <div className="text-center">
            <i className="fas fa-spinner fa-spin" style={{ fontSize: '2rem', marginBottom: '20px' }}></i>
            <p>Loading history...</p>
          </div>
        ) : (
          <>
            {history.length === 0 ? (
              <p className="text-center" style={{ color: 'var(--text-muted)', padding: '40px' }}>
                No attempts recorded yet.
              </p>
            ) : (
              history.map((result) => (
                <div
                  key={result._id}
                  style={{
                    background: 'var(--bg-card)',
                    padding: '15px',
                    borderRadius: '15px',
                    marginBottom: '10px',
                    borderLeft: `5px solid ${result.isPassed ? 'var(--success)' : 'var(--danger)'}`,
                    position: 'relative',
                    border: '1px solid var(--border-color)'
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                      <strong style={{ color: 'var(--text-main)', fontSize: '1.1em' }}>
                        {result.quiz?.title || 'Unknown Quiz'}
                      </strong>
                      <div style={{ marginTop: '5px', fontSize: '0.9em', color: 'var(--text-muted)' }}>
                        <span>{new Date(result.completedAt).toLocaleDateString()}</span> •{' '}
                        <span style={{ color: result.isPassed ? 'var(--success)' : 'var(--danger)', fontWeight: 'bold' }}>
                          Score: {result.score}/{result.totalQuestions} ({result.percentage}%)
                        </span>
                      </div>
                    </div>
                    <div className="history-score">
                      {result.percentage.toFixed(0)}%
                    </div>
                  </div>
                </div>
              ))
            )}
          </>
        )}
      </div>

      <div style={{ marginTop: '20px', textAlign: 'right' }}>
        <button 
          className="btn-secondary" 
          style={{ color: 'var(--danger)', borderColor: '#fecaca' }}
          onClick={() => {
            if (confirm('Are you sure you want to clear your entire quiz history? This action cannot be undone.')) {
              apiClient.clearHistory().then(() => {
                setHistory([]);
              }).catch(error => {
                console.error('Failed to clear history:', error);
              });
            }
          }}
        >
          Clear All Data
        </button>
      </div>
    </>
  );

  return (
    <>
      <div className="app-header">
        <div className="user-badge">
          <i className="fas fa-user-circle"></i>
          <span>Welcome, {user?.username}!</span>
        </div>

        <div className="header-controls">
          <button 
            className="btn-icon" 
            onClick={loadHistory}
            title="History"
          >
            <i className="fas fa-history"></i>
          </button>
          <button 
            className="btn-icon" 
            onClick={() => navigate('/admin-login')}
            title="Admin Panel"
          >
            <i className="fas fa-shield-alt"></i>
          </button>
          <button 
            className="btn-icon" 
            style={{ 
              color: 'var(--danger)', 
              borderColor: '#fecaca', 
              background: '#fef2f2' 
            }}
            onClick={handleLogout}
            title="Logout"
          >
            <i className="fas fa-sign-out-alt"></i>
          </button>
        </div>
      </div>

      <div className="quiz-card">
        {currentView === 'subjects' && renderSubjects()}
        {currentView === 'quizzes' && renderQuizzes()}
        {currentView === 'history' && renderHistory()}
      </div>
    </>
  );
};

export default QuizDashboard;
