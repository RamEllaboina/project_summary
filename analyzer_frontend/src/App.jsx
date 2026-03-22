import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { AnalysisProvider } from './context/AnalysisContext';
import Home from './pages/Home';
import UploadPage from './pages/Upload';
import Processing from './pages/Processing';
import Report from './pages/Report';

// Simple Layout wrapper if needed
const Layout = ({ children }) => (
  <div className="antialiased min-h-screen font-sans text-foreground bg-background selection:bg-primary/20">
    {children}
  </div>
);

function App() {
  return (
    <AnalysisProvider>
      <Router>
        <Layout>
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/upload" element={<UploadPage />} />
            <Route path="/processing" element={<Processing />} />
            <Route path="/report" element={<Report />} />
          </Routes>
        </Layout>
      </Router>
    </AnalysisProvider>
  );
}

export default App;
