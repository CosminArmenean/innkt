import React from 'react';
import { useAuth } from '../../contexts/AuthContext';
import LeftSidebar from './LeftSidebar';
import RightPanel from './RightPanel';
import TopNavbar from './TopNavbar';

interface MainLayoutProps {
  children: React.ReactNode;
}

const MainLayout: React.FC<MainLayoutProps> = ({ children }) => {
  const { isAuthenticated } = useAuth();

  if (!isAuthenticated) {
    return <>{children}</>;
  }

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Left Sidebar */}
      <LeftSidebar />
      
      {/* Main Content Area */}
      <div className="flex-1 flex flex-col">
        {/* Top Navigation */}
        <TopNavbar />
        
        {/* Main Content */}
        <div className="flex-1 flex">
          <main className="flex-1 max-w-2xl mx-auto px-4 py-6">
            {children}
          </main>
          
          {/* Right Panel */}
          <RightPanel />
        </div>
      </div>
    </div>
  );
};

export default MainLayout;
