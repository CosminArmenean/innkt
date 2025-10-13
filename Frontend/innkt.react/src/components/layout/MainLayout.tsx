import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../../contexts/AuthContext';
import LeftSidebar from './LeftSidebar';
import RightPanel from './RightPanel';
import TopNavbar from './TopNavbar';
import BottomNavigation from './BottomNavigation';

interface MainLayoutProps {
  children: React.ReactNode;
}

const MainLayout: React.FC<MainLayoutProps> = ({ children }) => {
  const { t } = useTranslation();
  const { isAuthenticated, isLoading } = useAuth();
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  console.log('MainLayout render - isAuthenticated:', isAuthenticated, 'isLoading:', isLoading);

  if (!isAuthenticated) {
    console.log('User not authenticated, rendering children only');
    return <>{children}</>;
  }

  return (
    <div className="h-screen bg-gray-50 flex overflow-hidden">
      {/* Left Sidebar - Fixed */}
      <div className="flex-shrink-0">
        <LeftSidebar 
          collapsed={sidebarCollapsed} 
          onToggle={() => setSidebarCollapsed(!sidebarCollapsed)} 
        />
      </div>
      
      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top Navigation - Fixed */}
        <div className="flex-shrink-0">
          <TopNavbar />
        </div>
        
        {/* Main Content - Scrollable */}
        <div className="flex-1 flex min-h-0">
          <main className="flex-1 px-2 sm:px-4 py-4 sm:py-6 overflow-y-auto pb-20 lg:pb-6 scrollbar-none">
            <div className="max-w-4xl mx-auto">
              {children}
            </div>
          </main>
          
          {/* Right Panel - Hidden on mobile */}
          <div className="hidden lg:block overflow-y-auto max-h-[calc(100vh-4rem)] scrollbar-none">
            <RightPanel />
          </div>
        </div>
      </div>
      
      {/* Bottom Navigation - Mobile only - HIDDEN FOR NOW */}
      {/* <BottomNavigation /> */}
    </div>
  );
};

export default MainLayout;
