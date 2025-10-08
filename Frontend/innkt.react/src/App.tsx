import React, { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import { NotificationProvider } from './contexts/NotificationContext';
import { MessagingProvider } from './contexts/MessagingContext';
import ProtectedRoute from './components/auth/ProtectedRoute';
import MainLayout from './components/layout/MainLayout'; 
import Home from './components/pages/Home';
import Login from './components/auth/Login';
import Register from './components/auth/Register';
import Dashboard from './components/dashboard/Dashboard';
import SecurityDashboard from './components/security/SecurityDashboard';
import UserProfileProfessional from './components/social/UserProfileProfessional';
import { ParentDashboard } from './components/kidSafety/ParentDashboard';
import { KidSafetyDashboard } from './components/kidSafety/KidSafetyDashboard';
import { useAuth } from './contexts/AuthContext';
import { useParams } from 'react-router-dom';
import ImageProcessing from './components/image-processing/ImageProcessing';
import EnhancedMonitoringDashboard from './components/monitoring/EnhancedMonitoringDashboard';
import SocialDashboard from './components/social/SocialDashboard';
import SearchPage from './components/search/SearchPage';
import GroupsPage from './components/groups/GroupsPage';
import GroupDetailPage from './components/groups/GroupDetailPage';
import InvitePage from './pages/InvitePage';
import AdvancedFeatures from './components/pages/AdvancedFeatures';
import MessagingDashboard from './components/messaging/MessagingDashboard';
import FollowersPage from './components/social/FollowersPage';
import Unauthorized from './components/pages/Unauthorized';
import Setup2FA from './components/auth/Setup2FA';
import NotificationToast from './components/notifications/NotificationToast';
import NotificationsPage from './pages/NotificationsPage';
import PostDetail from './components/social/PostDetail';
import PWAInstallPrompt from './components/pwa/PWAInstallPrompt';
import { pwaService } from './services/pwa.service'; 
import './App.css';

// GroupsPage now uses useAuth() directly, no wrapper needed

// GroupDetailPage now uses useAuth() directly, no wrapper needed

// Wrapper component to handle user ID for profile routes
const UserProfileWrapper: React.FC<{ isOwnProfile: boolean }> = ({ isOwnProfile }) => {
  const { user } = useAuth();
  const { id } = useParams<{ id: string }>();
  
  const userId = isOwnProfile ? (user?.id || '') : (id || '');
  
  // Determine if this is the user's own profile
  const isActuallyOwnProfile = isOwnProfile || (!!id && !!user?.id && id === user.id);
  
  return <UserProfileProfessional userId={userId} isOwnProfile={isActuallyOwnProfile} currentUserId={user?.id} />;
};

function App() {
  useEffect(() => {
    const initializePWA = async () => {
      try {
        // Note: Notification permission will be requested after user login
        // to avoid permission errors on login page

        // Sync offline data if online
        if (pwaService.isOnlineStatus()) {
          await pwaService.syncOfflineData();
        }
        console.log('PWA features initialized successfully');
      } catch (error) {
        console.warn('Failed to initialize PWA features:', error);
        // Don't throw the error, just log it and continue
      }
    };
    initializePWA();
  }, []);

  return (
    <AuthProvider>
      <NotificationProvider>
        <MessagingProvider>
          <Router>
          <div className="min-h-screen bg-gray-50">
          <MainLayout>
            <Routes>
              <Route path="/" element={<Home />} />
              <Route path="/login" element={<Login />} />
              <Route path="/register" element={<Register />} />
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
                  <SearchPage />
                </ProtectedRoute>
              } />
              <Route path="/groups" element={
                <ProtectedRoute>
                  <GroupsPage />
                </ProtectedRoute>
              } />
              <Route path="/groups/:id" element={
                <ProtectedRoute>
                  <GroupDetailPage />
                </ProtectedRoute>
              } />
              <Route path="/invite/:inviteId" element={
                <ProtectedRoute>
                  <InvitePage />
                </ProtectedRoute>
              } />
              <Route path="/test-invite" element={
                <ProtectedRoute>
                  <InvitePage />
                </ProtectedRoute>
              } />
              <Route path="/followers" element={
                <ProtectedRoute>
                  <FollowersPage />
                </ProtectedRoute>
              } />
              <Route path="/messaging" element={
                <ProtectedRoute>
                  <MessagingDashboard />
                </ProtectedRoute>
              } />
              <Route path="/profile" element={
                <ProtectedRoute>
                  <UserProfileWrapper isOwnProfile={true} />
                </ProtectedRoute>
              } />
              <Route path="/profile/:id" element={
                <ProtectedRoute>
                  <UserProfileWrapper isOwnProfile={false} />
                </ProtectedRoute>
              } />
              <Route path="/post/:id" element={
                <ProtectedRoute>
                  <PostDetail />
                </ProtectedRoute>
              } />
              <Route path="/messages/:id" element={
                <ProtectedRoute>
                  <MessagingDashboard />
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
              <Route path="/setup-2fa" element={
                <ProtectedRoute>
                  <Setup2FA />
                </ProtectedRoute>
              } />
              <Route path="/parent-dashboard" element={
                <ProtectedRoute>
                  <ParentDashboard />
                </ProtectedRoute>
              } />
              <Route path="/kid-safety" element={
                <ProtectedRoute>
                  <KidSafetyDashboard />
                </ProtectedRoute>
              } />
              <Route path="/notifications" element={
                <ProtectedRoute>
                  <NotificationsPage />
                </ProtectedRoute>
              } />
              <Route path="/unauthorized" element={<Unauthorized />} />
            </Routes>
          </MainLayout>
          <NotificationToast />
          <PWAInstallPrompt />
        </div>
      </Router>
        </MessagingProvider>
      </NotificationProvider>
    </AuthProvider>
  );
}

export default App;