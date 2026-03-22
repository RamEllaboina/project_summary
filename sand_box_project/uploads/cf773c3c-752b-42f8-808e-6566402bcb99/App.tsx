import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './hooks/useAuth';
import Login from './pages/Login';
import Register from './pages/Register';
import QuizDashboard from './pages/QuizDashboard';
import AdminLogin from './pages/AdminLogin';
import AdminPanel from './pages/AdminPanel';
import './styles/global.css';

const AppContent: React.FC = () => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="app-container">
        <div className="quiz-card">
          <div className="text-center">
            <div style={{ fontSize: '2rem', marginBottom: '20px' }}>
              <i className="fas fa-spinner fa-spin"></i>
            </div>
            <h2>Loading...</h2>
          </div>
        </div>
      </div>
    );
  }

  return (
    <Routes>
      <Route 
        path="/login" 
        element={user ? <Navigate to="/" replace /> : <Login />} 
      />
      <Route 
        path="/register" 
        element={user ? <Navigate to="/" replace /> : <Register />} 
      />
      <Route 
        path="/admin-login" 
        element={<AdminLogin />} 
      />
      <Route 
        path="/admin" 
        element={<AdminPanel />} 
      />
      <Route 
        path="/" 
        element={user ? <QuizDashboard /> : <Navigate to="/login" replace />} 
      />
    </Routes>
  );
};

function App() {
  return (
    <Router>
      <AuthProvider>
        <div className="app-container">
          <AppContent />
        </div>
      </AuthProvider>
    </Router>
  );
}

export default App;
