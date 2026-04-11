import React, { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Home from './pages/Home';
import Comments from './pages/Comments';
import Auth from './pages/Auth';
import Dashboard from './pages/Dashboard';
import AdminDashboard from './pages/AdminDashboard'; // We will create this next
import PremiumFeatures from './components/PremiumFeatures';
import ProtectedRoute from './components/ProtectedRoute';

function App() {

  useEffect(() => {
    // Basic protection against right click and standard shortcuts
    const handleContextMenu = (e) => e.preventDefault();
    const handleKeyDown = (e) => {
      // Block PrintScreen by immediately clearing clipboard (hacky but widely used)
      if (e.key === 'PrintScreen') {
        navigator.clipboard.writeText('Screenshots disabled.');
      }
      // Block Ctrl+C, Ctrl+P, Ctrl+S, Ctrl+U
      if (e.ctrlKey && ['c', 'p', 's', 'u'].includes(e.key.toLowerCase())) {
        e.preventDefault();
      }
      // Block F12 (DevTools)
      if (e.key === 'F12') {
        e.preventDefault();
      }
    };

    document.addEventListener('contextmenu', handleContextMenu);
    document.addEventListener('keydown', handleKeyDown);

    return () => {
      document.removeEventListener('contextmenu', handleContextMenu);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, []);

  return (
    <Router>
      <PremiumFeatures />
      <Routes>
        {/* Public Routes */}
        <Route path="/" element={<Home />} />
        <Route path="/comments" element={<Comments />} />
        <Route path="/login" element={<Auth />} />

        {/* ── Protected Student Route ── */}
        <Route element={<ProtectedRoute allowedRoles={['student']} />}>
          <Route path="/dashboard" element={<Dashboard />} />
        </Route>

        {/* ── Protected Admin / Teacher Route ── */}
        <Route element={<ProtectedRoute allowedRoles={['admin']} />}>
          <Route path="/admin" element={<AdminDashboard />} />
        </Route>

        {/* Fallback route */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Router>
  );
}

export default App;
