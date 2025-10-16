import React from 'react';
import { useTranslation } from 'react-i18next';

interface PageLayoutProps {
  leftSidebar?: React.ReactNode;
  centerContent: React.ReactNode;
  rightSidebar?: React.ReactNode;
  className?: string;
  layoutType?: 'default' | 'wide-right' | 'full-width' | 'messaging';
}

const PageLayout: React.FC<PageLayoutProps> = ({ 
  leftSidebar, 
  centerContent, 
  rightSidebar, 
  className = "",
  layoutType = 'default'
}) => {
  const { t } = useTranslation();
  // Get column classes based on layout type
  const getColumnClasses = () => {
    if (layoutType === 'full-width') {
      return {
        left: '',
        center: 'lg:col-span-12',
        right: ''
      };
    } else if (layoutType === 'wide-right') {
      return {
        left: leftSidebar ? 'lg:col-span-3' : '',
        center: leftSidebar ? 'lg:col-span-9' : 'lg:col-span-12',
        right: rightSidebar ? 'lg:col-span-0' : ''
      };
    } else if (layoutType === 'messaging') {
      return {
        left: leftSidebar ? 'lg:col-span-4' : '', // Wider conversation list
        center: leftSidebar ? 'lg:col-span-8' : 'lg:col-span-12', // Narrower chat area
        right: rightSidebar ? 'lg:col-span-0' : ''
      };
    } else {
      // default layout
      return {
        left: leftSidebar ? 'lg:col-span-3' : '',
        center: leftSidebar ? (rightSidebar ? 'lg:col-span-6' : 'lg:col-span-9') : (rightSidebar ? 'lg:col-span-9' : 'lg:col-span-12'),
        right: rightSidebar ? 'lg:col-span-3' : ''
      };
    }
  };

  const columnClasses = getColumnClasses();

  return (
    <div className={`h-screen bg-gray-50 overflow-hidden ${className}`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 h-full">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 h-full">
          {/* Left Sidebar */}
          {leftSidebar && columnClasses.left && (
            <div className={columnClasses.left}>
              <div className="bg-white rounded-2xl shadow-sm overflow-hidden sticky top-8 h-full">
                {leftSidebar}
              </div>
            </div>
          )}

          {/* Center Content */}
          <div className={`${columnClasses.center} h-full flex flex-col`}>
            <div className="bg-white rounded-2xl shadow-sm overflow-hidden h-full flex flex-col scrollbar-none">
              {centerContent}
            </div>
          </div>

          {/* Right Sidebar */}
          {rightSidebar && columnClasses.right && (
            <div className={columnClasses.right}>
              <div className="bg-white rounded-2xl shadow-sm overflow-hidden sticky top-8 h-full">
                <div className="p-6 h-full overflow-y-auto scrollbar-none">
                  {rightSidebar}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default PageLayout;

