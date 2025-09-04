import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
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
import './App.css';

function App() {
  return (
    <Router>
      <div className="min-h-screen bg-gray-50 flex flex-col">
        <Header />
        <main className="flex-grow">
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/security" element={<SecurityDashboard />} />
            <Route path="/profile/:id" element={<Profile />} />
            <Route path="/image-processing" element={<ImageProcessing />} />
            <Route path="/monitoring" element={<EnhancedMonitoringDashboard />} />
            <Route path="/social" element={<SocialDashboard currentUserId="demo-user" />} />
            <Route path="/messaging" element={<MessagingDashboard />} />
            <Route path="/advanced" element={<AdvancedFeatures />} />
          </Routes>
        </main>
        <Footer />
      </div>
    </Router>
  );
}

export default App;
