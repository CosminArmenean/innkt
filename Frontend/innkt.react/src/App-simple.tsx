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
              <h1 className="text-2xl font-bold text-gray-900">Innkt</h1>
            </div>
            <nav className="flex space-x-8">
              <a href="#" className="text-gray-500 hover:text-gray-900">Home</a>
              <a href="#" className="text-gray-500 hover:text-gray-900">Features</a>
              <a href="#" className="text-gray-500 hover:text-gray-900">About</a>
              <button className="bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700">
                Get Started
              </button>
            </nav>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="text-center">
          <h1 className="text-4xl font-bold text-gray-900 sm:text-5xl md:text-6xl">
            Welcome to Innkt
          </h1>
          <p className="mt-3 max-w-md mx-auto text-base text-gray-500 sm:text-lg md:mt-5 md:text-xl md:max-w-3xl">
            The professional social platform with AI-powered features, real-time messaging, and advanced security.
          </p>
          <div className="mt-5 max-w-md mx-auto sm:flex sm:justify-center md:mt-8">
            <div className="rounded-md shadow">
              <button className="w-full flex items-center justify-center px-8 py-3 border border-transparent text-base font-medium rounded-md text-white bg-purple-600 hover:bg-purple-700 md:py-4 md:text-lg md:px-10">
                Start Building
              </button>
            </div>
            <div className="mt-3 rounded-md shadow sm:mt-0 sm:ml-3">
              <button className="w-full flex items-center justify-center px-8 py-3 border border-transparent text-base font-medium rounded-md text-purple-600 bg-white hover:bg-gray-50 md:py-4 md:text-lg md:px-10">
                Learn More
              </button>
            </div>
          </div>
        </div>

        {/* Features Grid */}
        <div className="mt-20">
          <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-3">
            <div className="bg-white rounded-lg shadow-md p-6">
              <div className="text-purple-600 text-3xl mb-4">🚀</div>
              <h3 className="text-lg font-medium text-gray-900">AI-Powered</h3>
              <p className="mt-2 text-gray-500">
                Advanced AI features for image processing, content optimization, and intelligent recommendations.
              </p>
            </div>
            <div className="bg-white rounded-lg shadow-md p-6">
              <div className="text-purple-600 text-3xl mb-4">💬</div>
              <h3 className="text-lg font-medium text-gray-900">Real-time Messaging</h3>
              <p className="mt-2 text-gray-500">
                Instant messaging with WebRTC support for voice and video calls.
              </p>
            </div>
            <div className="bg-white rounded-lg shadow-md p-6">
              <div className="text-purple-600 text-3xl mb-4">🔒</div>
              <h3 className="text-lg font-medium text-gray-900">Enterprise Security</h3>
              <p className="mt-2 text-gray-500">
                Bank-level security with end-to-end encryption and advanced authentication.
              </p>
            </div>
            <div className="bg-white rounded-lg shadow-md p-6">
              <div className="text-purple-600 text-3xl mb-4">📱</div>
              <h3 className="text-lg font-medium text-gray-900">PWA Ready</h3>
              <p className="mt-2 text-gray-500">
                Progressive Web App with offline support and native app-like experience.
              </p>
            </div>
            <div className="bg-white rounded-lg shadow-md p-6">
              <div className="text-purple-600 text-3xl mb-4">👥</div>
              <h3 className="text-lg font-medium text-gray-900">Social Features</h3>
              <p className="mt-2 text-gray-500">
                Groups, posts, trending content, and advanced social interaction tools.
              </p>
            </div>
            <div className="bg-white rounded-lg shadow-md p-6">
              <div className="text-purple-600 text-3xl mb-4">📊</div>
              <h3 className="text-lg font-medium text-gray-900">Analytics</h3>
              <p className="mt-2 text-gray-500">
                Comprehensive analytics and monitoring dashboard for insights and performance.
              </p>
            </div>
          </div>
        </div>

        {/* Status Section */}
        <div className="mt-20 bg-white rounded-lg shadow-md p-8">
          <h2 className="text-2xl font-bold text-gray-900 text-center mb-8">System Status</h2>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <div className="text-center">
              <div className="text-green-500 text-2xl mb-2">✅</div>
              <p className="text-sm font-medium text-gray-900">Frontend</p>
              <p className="text-xs text-gray-500">React UI Running</p>
            </div>
            <div className="text-center">
              <div className="text-green-500 text-2xl mb-2">✅</div>
              <p className="text-sm font-medium text-gray-900">Database</p>
              <p className="text-xs text-gray-500">PostgreSQL Ready</p>
            </div>
            <div className="text-center">
              <div className="text-green-500 text-2xl mb-2">✅</div>
              <p className="text-sm font-medium text-gray-900">Cache</p>
              <p className="text-xs text-gray-500">Redis Connected</p>
            </div>
            <div className="text-center">
              <div className="text-yellow-500 text-2xl mb-2">⚠️</div>
              <p className="text-sm font-medium text-gray-900">Messaging</p>
              <p className="text-xs text-gray-500">Starting Up</p>
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-gray-800 mt-20">
        <div className="max-w-7xl mx-auto py-12 px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <p className="text-gray-400">
              © 2024 Innkt. Professional Social Platform with AI-Powered Features.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}

export default App;
