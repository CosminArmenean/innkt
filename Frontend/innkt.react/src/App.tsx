import React, { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import { NotificationProvider } from './contexts/NotificationContext';
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
import SearchPage from './components/search/SearchPage';
import GroupsPage from './components/groups/GroupsPage';
import GroupDetailPage from './components/groups/GroupDetailPage';
import AdvancedFeatures from './components/pages/AdvancedFeatures';
import MessagingDashboard from './components/messaging/MessagingDashboard';
import Unauthorized from './components/pages/Unauthorized';
import Setup2FA from './components/auth/Setup2FA';
import NotificationToast from './components/notifications/NotificationToast';
import PWAInstallPrompt from './components/pwa/PWAInstallPrompt';
import PWAStatus from './components/pwa/PWAStatus';
import { pwaService } from './services/pwa.service';
import './App.css';

function App() {
  useEffect(() => {
    // Initialize PWA features
    const initializePWA = async () => {
      try {
        // Request notification permission
        await pwaService.requestNotificationPermission();
        
        // Sync offline data if online
        if (pwaService.isOnlineStatus()) {
          await pwaService.syncOfflineData();
        }
        
        console.log('PWA features initialized successfully');
      } catch (error) {
        console.error('Failed to initialize PWA features:', error);
      }
    };

    initializePWA();
  }, []);

  return (
    <AuthProvider>
      <NotificationProvider>
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
              
              <Route path="/search" element={
                <ProtectedRoute>
                  <SearchPage currentUserId="demo-user" />
                </ProtectedRoute>
              } />
              
              <Route path="/groups" element={
                <ProtectedRoute>
                  <GroupsPage currentUserId="demo-user" />
                </ProtectedRoute>
              } />
              
              <Route path="/groups/:id" element={
                <ProtectedRoute>
                  <GroupDetailPage currentUserId="demo-user" />
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
          
          {/* Notification Toast */}
          <NotificationToast />
          
          {/* PWA Install Prompt */}
          <PWAInstallPrompt />
          
          {/* PWA Status (for debugging) */}
          {process.env.NODE_ENV === 'development' && (
            <div className="fixed top-4 right-4 z-50">
              <PWAStatus showDetails={false} />
            </div>
          )}
        </div>
      </Router>
      </NotificationProvider>
    </AuthProvider>
  );
}

export default App;
