import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import NotificationBell from '../notifications/NotificationBell';

const Header: React.FC = () => {
  const { t } = useTranslation();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const location = useLocation();

  const navigation = [
    { name: t('nav.home'), href: '/' },
    { name: t('nav.dashboard'), href: '/dashboard' },
    { name: t('nav.advanced'), href: '/image-processing' },
    { name: t('settings.privacySecurity'), href: '/security' },
    { name: t('nav.social'), href: '/social' },
    { name: t('nav.messaging'), href: '/messaging' },
    { name: t('nav.advanced'), href: '/monitoring' },
    { name: t('nav.advanced'), href: '/advanced' },
    { name: t('nav.profile'), href: '/profile/me' },
  ];

  const isActive = (path: string) => location.pathname === path;

  return (
    <header className="bg-innkt-primary shadow-lg">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <div className="flex items-center">
            <Link to="/" className="flex items-center space-x-3">
              <div className="flex-shrink-0">
                {/* INNKT Logo Placeholder - Replace with actual logo asset */}
                <div className="w-10 h-10 bg-white rounded-lg flex items-center justify-center">
                  <span className="text-innkt-primary font-bold text-xl">I</span>
                </div>
              </div>
              <div className="text-white font-bold text-xl">innkt</div>
            </Link>
          </div>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex space-x-8">
            {navigation.map((item) => (
              <Link
                key={item.name}
                to={item.href}
                className={`px-3 py-2 rounded-md text-sm font-medium transition-colors duration-200 ${
                  isActive(item.href)
                    ? 'bg-innkt-dark text-white'
                    : 'text-innkt-light hover:text-white hover:bg-innkt-dark'
                }`}
              >
                {item.name}
              </Link>
            ))}
          </nav>

          {/* User Actions */}
          <div className="hidden md:flex items-center space-x-4">
            {/* Notifications */}
            <NotificationBell />
            
            {/* Auth Buttons */}
            <Link
              to="/login"
              className="text-innkt-light hover:text-white px-3 py-2 rounded-md text-sm font-medium transition-colors duration-200"
            >
              {t('auth.login')}
            </Link>
            <Link
              to="/register"
              className="bg-white text-innkt-primary hover:bg-gray-100 px-4 py-2 rounded-md text-sm font-medium transition-colors duration-200"
            >
              {t('auth.register')}
            </Link>
          </div>

          {/* Mobile menu button */}
          <div className="md:hidden">
            <button
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="text-innkt-light hover:text-white p-2 rounded-md"
            >
              <svg
                className="h-6 w-6"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                {isMenuOpen ? (
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                ) : (
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M4 6h16M4 12h16M4 18h16"
                  />
                )}
              </svg>
            </button>
          </div>
        </div>

        {/* Mobile Navigation */}
        {isMenuOpen && (
          <div className="md:hidden">
            <div className="px-2 pt-2 pb-3 space-y-1 sm:px-3 bg-innkt-dark rounded-lg mt-2">
              {navigation.map((item) => (
                <Link
                  key={item.name}
                  to={item.href}
                  className={`block px-3 py-2 rounded-md text-base font-medium transition-colors duration-200 ${
                    isActive(item.href)
                      ? 'bg-innkt-primary text-white'
                      : 'text-innkt-light hover:text-white hover:bg-innkt-primary'
                  }`}
                  onClick={() => setIsMenuOpen(false)}
                >
                  {item.name}
                </Link>
              ))}
              <div className="pt-4 space-y-2">
                <Link
                  to="/login"
                  className="block px-3 py-2 text-innkt-light hover:text-white text-base font-medium"
                  onClick={() => setIsMenuOpen(false)}
                >
                  {t('auth.login')}
                </Link>
                <Link
                  to="/register"
                  className="block px-3 py-2 bg-white text-innkt-primary rounded-md text-base font-medium"
                  onClick={() => setIsMenuOpen(false)}
                >
                  {t('auth.register')}
                </Link>
              </div>
            </div>
          </div>
        )}
      </div>
    </header>
  );
};

export default Header;
