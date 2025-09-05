import React from 'react';
import { useParams } from 'react-router-dom';

const Profile: React.FC = () => {
  const { id } = useParams<{ id: string }>();

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Profile</h1>
          <p className="text-gray-600">Manage your profile and account settings.</p>
        </div>
        
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8 text-center">
          <div className="w-16 h-16 bg-innkt-primary rounded-full flex items-center justify-center mx-auto mb-4">
            <span className="text-2xl text-white">👤</span>
          </div>
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Profile Management Coming Soon</h2>
          <p className="text-gray-600 mb-4">
            Profile management features including dual-picture layout for joint accounts, 
            background removal options, and advanced settings will be available here.
          </p>
          <p className="text-sm text-gray-500">
            Profile ID: {id}
          </p>
        </div>
      </div>
    </div>
  );
};

export default Profile;



