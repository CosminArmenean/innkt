import React from 'react';
import { useTranslation } from 'react-i18next';

interface PostSkeletonProps {
  count?: number;
}

const PostSkeleton: React.FC<PostSkeletonProps> = ({ count = 1 }) => {
  const { t } = useTranslation();
  return (
    <>
      {Array.from({ length: count }).map((_, index) => (
        <div key={index} className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden animate-pulse">
          {/* Post Header Skeleton */}
          <div className="px-6 py-4 border-b border-gray-100">
            <div className="flex items-start space-x-3">
              {/* Avatar Skeleton */}
              <div className="w-12 h-12 rounded-full bg-gray-200 flex-shrink-0"></div>
              
              {/* User Info Skeleton */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center space-x-2">
                  <div className="h-4 bg-gray-200 rounded w-32"></div>
                  <div className="h-3 bg-gray-200 rounded w-16"></div>
                </div>
                <div className="flex items-center space-x-2 mt-1">
                  <div className="h-3 bg-gray-200 rounded w-20"></div>
                  <div className="h-3 bg-gray-200 rounded w-12"></div>
                </div>
              </div>
              
              {/* Menu Skeleton */}
              <div className="w-6 h-6 bg-gray-200 rounded"></div>
            </div>
          </div>
          
          {/* Post Content Skeleton */}
          <div className="px-6 py-4">
            <div className="space-y-2">
              <div className="h-4 bg-gray-200 rounded w-full"></div>
              <div className="h-4 bg-gray-200 rounded w-4/5"></div>
              <div className="h-4 bg-gray-200 rounded w-3/5"></div>
            </div>
          </div>
          
          {/* Engagement Skeleton */}
          <div className="px-6 py-3 border-t border-gray-100">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-6">
                <div className="flex items-center space-x-2">
                  <div className="w-5 h-5 bg-gray-200 rounded"></div>
                  <div className="h-3 bg-gray-200 rounded w-8"></div>
                </div>
                <div className="flex items-center space-x-2">
                  <div className="w-5 h-5 bg-gray-200 rounded"></div>
                  <div className="h-3 bg-gray-200 rounded w-8"></div>
                </div>
                <div className="flex items-center space-x-2">
                  <div className="w-5 h-5 bg-gray-200 rounded"></div>
                  <div className="h-3 bg-gray-200 rounded w-8"></div>
                </div>
              </div>
              <div className="h-3 bg-gray-200 rounded w-12"></div>
            </div>
          </div>
        </div>
      ))}
    </>
  );
};

export default PostSkeleton;
