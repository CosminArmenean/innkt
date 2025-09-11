import React, { useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import LeftSidebar from './LeftSidebar';
import RightPanel from './RightPanel';
import TopNavbar from './TopNavbar';
import BottomNavigation from './BottomNavigation';

interface MainLayoutProps {
  children: React.ReactNode;
}

const MainLayout: React.FC<MainLayoutProps> = ({ children }) => {
  const { isAuthenticated } = useAuth();
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  if (!isAuthenticated) {
    return <>{children}</>;
  }

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Left Sidebar */}
      <LeftSidebar 
        collapsed={sidebarCollapsed} 
        onToggle={() => setSidebarCollapsed(!sidebarCollapsed)} 
      />
      
      {/* Main Content Area */}
      <div className="flex-1 flex flex-col">
        {/* Top Navigation */}
        <TopNavbar />
        
        {/* Main Content */}
        <div className="flex-1 flex">
          <main className="flex-1 px-2 sm:px-4 py-4 sm:py-6 overflow-y-auto pb-20 lg:pb-6">
            <div className="max-w-4xl mx-auto">
              {children}
            </div>
          </main>
          
          {/* Right Panel - Hidden on mobile */}
          <div className="hidden lg:block overflow-y-auto max-h-[calc(100vh-4rem)]">
            <RightPanel />
          </div>
        </div>
      </div>
      
      {/* Bottom Navigation - Mobile only */}
      <BottomNavigation />
    </div>
  );
};

export default MainLayout;
