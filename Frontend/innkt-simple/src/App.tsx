import React from 'react';
import './App.css';

function App() {
  return (
    <div className="min-h-screen bg-gray-100">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center">
              <div className="w-8 h-8 bg-purple-600 rounded-lg flex items-center justify-center mr-3">
                <span className="text-white font-bold text-lg">I</span>
              </div>
              <h1 className="text-2xl font-bold text-gray-900">Innkt</h1>
            </div>
            <nav className="hidden md:flex space-x-8">
              <a href="#" className="text-gray-500 hover:text-gray-900 transition-colors">Home</a>
              <a href="#" className="text-gray-500 hover:text-gray-900 transition-colors">Features</a>
              <a href="#" className="text-gray-500 hover:text-gray-900 transition-colors">About</a>
              <a href="#" className="text-gray-500 hover:text-gray-900 transition-colors">Contact</a>
            </nav>
            <div className="flex items-center space-x-4">
              <button className="text-gray-500 hover:text-gray-900 transition-colors">
                Sign In
              </button>
              <button className="bg-purple-600 text-white px-6 py-2 rounded-lg hover:bg-purple-700 transition-colors">
                Get Started
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="text-center">
          <h1 className="text-4xl font-bold text-gray-900 sm:text-5xl md:text-6xl">
            Welcome to <span className="text-purple-600">Innkt</span>
          </h1>
          <p className="mt-6 max-w-3xl mx-auto text-xl text-gray-500">
            The professional social platform with AI-powered features, real-time messaging, 
            and enterprise-grade security. Built for the modern digital world.
          </p>
          <div className="mt-10 flex flex-col sm:flex-row gap-4 justify-center">
            <button className="bg-purple-600 text-white px-8 py-4 rounded-lg text-lg font-semibold hover:bg-purple-700 transition-colors shadow-lg">
              Start Building Today
            </button>
            <button className="border-2 border-purple-600 text-purple-600 px-8 py-4 rounded-lg text-lg font-semibold hover:bg-purple-50 transition-colors">
              Watch Demo
            </button>
          </div>
        </div>

        {/* Features Grid */}
        <div className="mt-24">
          <h2 className="text-3xl font-bold text-center text-gray-900 mb-16">
            Powerful Features for Modern Teams
          </h2>
          <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-3">
            <div className="bg-white rounded-xl shadow-lg p-8 hover:shadow-xl transition-shadow">
              <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center mb-6">
                <span className="text-2xl">🚀</span>
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-4">AI-Powered Intelligence</h3>
              <p className="text-gray-600">
                Advanced AI features for image processing, content optimization, 
                and intelligent recommendations that adapt to your workflow.
              </p>
            </div>
            
            <div className="bg-white rounded-xl shadow-lg p-8 hover:shadow-xl transition-shadow">
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mb-6">
                <span className="text-2xl">💬</span>
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-4">Real-time Communication</h3>
              <p className="text-gray-600">
                Instant messaging with WebRTC support for voice and video calls, 
                screen sharing, and collaborative workspaces.
              </p>
            </div>
            
            <div className="bg-white rounded-xl shadow-lg p-8 hover:shadow-xl transition-shadow">
              <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center mb-6">
                <span className="text-2xl">🔒</span>
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-4">Enterprise Security</h3>
              <p className="text-gray-600">
                Bank-level security with end-to-end encryption, multi-factor authentication, 
                and advanced threat detection.
              </p>
            </div>
            
            <div className="bg-white rounded-xl shadow-lg p-8 hover:shadow-xl transition-shadow">
              <div className="w-12 h-12 bg-yellow-100 rounded-lg flex items-center justify-center mb-6">
                <span className="text-2xl">📱</span>
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-4">PWA Ready</h3>
              <p className="text-gray-600">
                Progressive Web App with offline support, push notifications, 
                and native app-like experience across all devices.
              </p>
            </div>
            
            <div className="bg-white rounded-xl shadow-lg p-8 hover:shadow-xl transition-shadow">
              <div className="w-12 h-12 bg-red-100 rounded-lg flex items-center justify-center mb-6">
                <span className="text-2xl">👥</span>
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-4">Social Collaboration</h3>
              <p className="text-gray-600">
                Groups, posts, trending content, and advanced social interaction tools 
                designed for professional networking.
              </p>
            </div>
            
            <div className="bg-white rounded-xl shadow-lg p-8 hover:shadow-xl transition-shadow">
              <div className="w-12 h-12 bg-indigo-100 rounded-lg flex items-center justify-center mb-6">
                <span className="text-2xl">📊</span>
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-4">Advanced Analytics</h3>
              <p className="text-gray-600">
                Comprehensive analytics and monitoring dashboard with real-time insights 
                and performance metrics.
              </p>
            </div>
          </div>
        </div>

        {/* Status Dashboard */}
        <div className="mt-24 bg-white rounded-2xl shadow-xl p-8">
          <h2 className="text-2xl font-bold text-gray-900 text-center mb-8">System Status</h2>
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
            <div className="text-center p-6 bg-green-50 rounded-lg">
              <div className="text-green-500 text-3xl mb-3">✅</div>
              <p className="text-lg font-semibold text-gray-900">Frontend</p>
              <p className="text-sm text-gray-600">React UI Running</p>
              <div className="mt-2 w-full bg-green-200 rounded-full h-2">
                <div className="bg-green-500 h-2 rounded-full" style={{width: '100%'}}></div>
              </div>
            </div>
            
            <div className="text-center p-6 bg-green-50 rounded-lg">
              <div className="text-green-500 text-3xl mb-3">✅</div>
              <p className="text-lg font-semibold text-gray-900">Database</p>
              <p className="text-sm text-gray-600">PostgreSQL Ready</p>
              <div className="mt-2 w-full bg-green-200 rounded-full h-2">
                <div className="bg-green-500 h-2 rounded-full" style={{width: '100%'}}></div>
              </div>
            </div>
            
            <div className="text-center p-6 bg-green-50 rounded-lg">
              <div className="text-green-500 text-3xl mb-3">✅</div>
              <p className="text-lg font-semibold text-gray-900">Cache</p>
              <p className="text-sm text-gray-600">Redis Connected</p>
              <div className="mt-2 w-full bg-green-200 rounded-full h-2">
                <div className="bg-green-500 h-2 rounded-full" style={{width: '100%'}}></div>
              </div>
            </div>
            
            <div className="text-center p-6 bg-yellow-50 rounded-lg">
              <div className="text-yellow-500 text-3xl mb-3">⚠️</div>
              <p className="text-lg font-semibold text-gray-900">Messaging</p>
              <p className="text-sm text-gray-600">Starting Up</p>
              <div className="mt-2 w-full bg-yellow-200 rounded-full h-2">
                <div className="bg-yellow-500 h-2 rounded-full" style={{width: '75%'}}></div>
              </div>
            </div>
          </div>
        </div>

        {/* CTA Section */}
        <div className="mt-24 bg-gradient-to-r from-purple-600 to-blue-600 rounded-2xl p-12 text-center text-white">
          <h2 className="text-3xl font-bold mb-6">Ready to Get Started?</h2>
          <p className="text-xl mb-8 opacity-90">
            Join thousands of professionals who trust Innkt for their social and collaboration needs.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <button className="bg-white text-purple-600 px-8 py-4 rounded-lg text-lg font-semibold hover:bg-gray-100 transition-colors">
              Start Free Trial
            </button>
            <button className="border-2 border-white text-white px-8 py-4 rounded-lg text-lg font-semibold hover:bg-white hover:text-purple-600 transition-colors">
              Contact Sales
            </button>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-gray-900 mt-24">
        <div className="max-w-7xl mx-auto py-12 px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div className="col-span-1 md:col-span-2">
              <div className="flex items-center mb-4">
                <div className="w-8 h-8 bg-purple-600 rounded-lg flex items-center justify-center mr-3">
                  <span className="text-white font-bold text-lg">I</span>
                </div>
                <h3 className="text-xl font-bold text-white">Innkt</h3>
              </div>
              <p className="text-gray-400 mb-4">
                The professional social platform with AI-powered features, 
                real-time messaging, and enterprise-grade security.
              </p>
            </div>
            
            <div>
              <h4 className="text-white font-semibold mb-4">Product</h4>
              <ul className="space-y-2">
                <li><a href="#" className="text-gray-400 hover:text-white transition-colors">Features</a></li>
                <li><a href="#" className="text-gray-400 hover:text-white transition-colors">Pricing</a></li>
                <li><a href="#" className="text-gray-400 hover:text-white transition-colors">Security</a></li>
                <li><a href="#" className="text-gray-400 hover:text-white transition-colors">API</a></li>
              </ul>
            </div>
            
            <div>
              <h4 className="text-white font-semibold mb-4">Company</h4>
              <ul className="space-y-2">
                <li><a href="#" className="text-gray-400 hover:text-white transition-colors">About</a></li>
                <li><a href="#" className="text-gray-400 hover:text-white transition-colors">Blog</a></li>
                <li><a href="#" className="text-gray-400 hover:text-white transition-colors">Careers</a></li>
                <li><a href="#" className="text-gray-400 hover:text-white transition-colors">Contact</a></li>
              </ul>
            </div>
          </div>
          
          <div className="border-t border-gray-800 mt-8 pt-8 text-center">
            <p className="text-gray-400">
              © 2024 Innkt. All rights reserved. Professional Social Platform with AI-Powered Features.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}

export default App;