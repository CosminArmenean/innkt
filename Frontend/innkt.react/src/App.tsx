import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import ProtectedRoute from './components/auth/ProtectedRoute';
import MainLayout from './components/layout/MainLayout';
import Header from './components/layout/Header';
import Footer from './components/layout/Footer';
import Home from './components/pages/Home';
import Login from './components/auth/Login';
import Register from './components/auth/Register';
import Dashboard from './components/dashboard/Dashboard';
import SecurityDashboard from './components/security/SecurityDashboard';
import Profile from './components/profile/Profile';
import ImageProcessing from './components/image-processing/ImageProcessing';
import EnhancedMonitoringDashboard from './components/monitoring/EnhancedMonitoringDashboard';
import SocialDashboard from './components/social/SocialDashboard';
import AdvancedFeatures from './components/pages/AdvancedFeatures';
import MessagingDashboard from './components/messaging/MessagingDashboard';
import Unauthorized from './components/pages/Unauthorized';
import Setup2FA from './components/auth/Setup2FA';
import './App.css';

function App() {
  return (
    <AuthProvider>
      <Router>
        <div className="min-h-screen bg-gray-50">
          <MainLayout>
            <Routes>
              {/* Public Routes */}
              <Route path="/" element={<Home />} />
              <Route path="/login" element={<Login />} />
              <Route path="/register" element={<Register />} />
              
              {/* Protected Routes */}
              <Route path="/dashboard" element={
                <ProtectedRoute>
                  <Dashboard />
                </ProtectedRoute>
              } />
              
              <Route path="/social" element={
                <ProtectedRoute>
                  <SocialDashboard currentUserId="demo-user" />
                </ProtectedRoute>
              } />
              
              <Route path="/messaging" element={
                <ProtectedRoute>
                  <MessagingDashboard />
                </ProtectedRoute>
              } />
              
              <Route path="/profile/:id" element={
                <ProtectedRoute>
                  <Profile />
                </ProtectedRoute>
              } />
              
              <Route path="/settings" element={
                <ProtectedRoute>
                  <SecurityDashboard />
                </ProtectedRoute>
              } />
              
              <Route path="/image-processing" element={
                <ProtectedRoute>
                  <ImageProcessing />
                </ProtectedRoute>
              } />
              
              <Route path="/monitoring" element={
                <ProtectedRoute requiredRole="admin">
                  <EnhancedMonitoringDashboard />
                </ProtectedRoute>
              } />
              
              <Route path="/advanced" element={
                <ProtectedRoute requiredRole="premium">
                  <AdvancedFeatures />
                </ProtectedRoute>
              } />
              
              <Route path="/apis" element={
                <ProtectedRoute requiredRole="premium">
                  <AdvancedFeatures />
                </ProtectedRoute>
              } />
              
              <Route path="/subscription" element={
                <ProtectedRoute requiredRole="premium">
                  <AdvancedFeatures />
                </ProtectedRoute>
              } />
              
              <Route path="/support" element={
                <ProtectedRoute>
                  <AdvancedFeatures />
                </ProtectedRoute>
              } />
              
              {/* 2FA Setup */}
              <Route path="/setup-2fa" element={
                <ProtectedRoute>
                  <Setup2FA />
                </ProtectedRoute>
              } />
              
              {/* Error Pages */}
              <Route path="/unauthorized" element={<Unauthorized />} />
            </Routes>
          </MainLayout>
        </div>
      </Router>
    </AuthProvider>
  );
}

export default App;
