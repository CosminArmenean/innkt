import React from 'react';

interface ScrollableContentProps {
  children: React.ReactNode;
  className?: string;
}

const ScrollableContent: React.FC<ScrollableContentProps> = ({ 
  children, 
  className = "" 
}) => {
  return (
    <div className={`p-6 flex-1 overflow-y-auto scrollbar-none ${className}`}>
      {children}
    </div>
  );
};

export default ScrollableContent;

