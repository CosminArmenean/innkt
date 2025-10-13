import React from 'react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import { ExclamationTriangleIcon } from '@heroicons/react/24/outline';

const Unauthorized: React.FC = () => {
  const { t } = useTranslation();
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-8 text-center">
        <ExclamationTriangleIcon className="h-16 w-16 text-red-500 mx-auto mb-4" />
        <h1 className="text-2xl font-bold text-gray-900 mb-2">{t('pages.unauthorized.title')}</h1>
        <p className="text-gray-600 mb-6">
          {t('pages.unauthorized.message')}
        </p>
        <div className="space-y-3">
          <Link
            to="/"
            className="block w-full bg-purple-600 text-white py-2 px-4 rounded-lg hover:bg-purple-700 transition-colors"
          >
            {t('pages.unauthorized.goHome')}
          </Link>
          <Link
            to="/settings"
            className="block w-full bg-gray-200 text-gray-800 py-2 px-4 rounded-lg hover:bg-gray-300 transition-colors"
          >
            {t('pages.unauthorized.accountSettings')}
          </Link>
        </div>
      </div>
    </div>
  );
};

export default Unauthorized;
