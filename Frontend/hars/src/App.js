import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import DashboardPage from './pages/DashboardPage';
import './App.css'; 
import './styles/styles.css';

// Hook per verificare l'autenticazione (semplificato)
function useAuth() {
  // In un'app reale, questo controllerebbe un token valido, magari da localStorage o Context
  const token = localStorage.getItem('jwt');
  return !!token; // Ritorna true se il token esiste
}

// Componente per proteggere le route
function ProtectedRoute({ children }) {
  const isAuthenticated = useAuth();
  return isAuthenticated ? children : <Navigate to="/login" />;
}

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route
          path="/dashboard"
          element={
            <ProtectedRoute>
              <DashboardPage />
            </ProtectedRoute>
          }
        />
        {/* Reindirizza alla dashboard se loggato, altrimenti al login */}
        <Route
          path="/"
          element={useAuth() ? <Navigate to="/dashboard" /> : <Navigate to="/login" />}
        />
      </Routes>
    </Router>
  );
}

export default App;