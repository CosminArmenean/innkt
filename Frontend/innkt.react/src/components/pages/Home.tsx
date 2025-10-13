import React from 'react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import SocialDashboard from '../social/SocialDashboard';
import Logo from '../common/Logo';

const Home: React.FC = () => {
  const { t } = useTranslation();
  const { isAuthenticated, user } = useAuth();

  // If user is authenticated, show the social dashboard
  if (isAuthenticated) {
    return <SocialDashboard currentUserId={user?.id || 'demo-user'} />;
  }
  const features = [
    {
      title: t('pages.home.jointAccounts'),
      description: t('pages.home.jointAccountsDesc'),
      icon: '👥',
      href: '/register'
    },
    {
      title: t('pages.home.advancedSecurity'),
      description: t('pages.home.advancedSecurityDesc'),
      icon: '🛡️',
      href: '/security'
    },
    {
      title: t('pages.home.kidAccountManagement'),
      description: t('pages.home.kidAccountManagementDesc'),
      icon: '👶',
      href: '/register'
    },
    {
      title: t('pages.home.aiPoweredFeatures'),
      description: t('pages.home.aiPoweredFeaturesDesc'),
      icon: '🤖',
      href: '/dashboard'
    },
    {
      title: t('pages.home.multiLanguageSupport'),
      description: t('pages.home.multiLanguageSupportDesc'),
      icon: '🌍',
      href: '/dashboard'
    },
    {
      title: t('pages.home.blockchainIntegration'),
      description: t('pages.home.blockchainIntegrationDesc'),
      icon: '⛓️',
      href: '/dashboard'
    }
  ];

  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="bg-gradient-to-br from-innkt-primary via-innkt-secondary to-innkt-accent text-white py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="mb-8">
            {/* INNKT Logo */}
            <div className="flex justify-center mb-6">
              <div className="w-20 h-20 bg-white rounded-2xl flex items-center justify-center shadow-2xl p-4">
                <Logo variant="icon" size="xl" color="purple" />
              </div>
            </div>
            <h1 className="text-5xl md:text-6xl font-bold mb-6">
              {t('pages.home.welcomeTo')} <span className="text-innkt-light">{t('common.innkt')}</span>
            </h1>
            <p className="text-xl md:text-2xl text-innkt-light mb-8 max-w-3xl mx-auto">
              {t('pages.home.nextGenSocial')}
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                to="/register"
                className="bg-white text-innkt-primary hover:bg-gray-100 px-8 py-4 rounded-lg text-lg font-semibold transition-colors duration-200 shadow-lg"
              >
                {t('pages.home.getStarted')}
              </Link>
              <Link
                to="/login"
                className="border-2 border-white text-white hover:bg-white hover:text-innkt-primary px-8 py-4 rounded-lg text-lg font-semibold transition-colors duration-200"
              >
                {t('pages.home.signIn')}
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">
              {t('pages.home.whyChooseINNKT')}
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              {t('pages.home.platformDescription')}
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {features.map((feature, index) => (
              <div key={index} className="card hover:shadow-lg transition-shadow duration-200">
                <div className="text-4xl mb-4">{feature.icon}</div>
                <h3 className="text-xl font-semibold text-gray-900 mb-3">
                  {feature.title}
                </h3>
                <p className="text-gray-600 mb-4">
                  {feature.description}
                </p>
                <Link
                  to={feature.href}
                  className="text-innkt-primary hover:text-innkt-dark font-medium transition-colors duration-200"
                >
                  {t('pages.home.learnMore')}
                </Link>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-4xl font-bold text-gray-900 mb-4">
            {t('pages.home.readyToJoin')}
          </h2>
          <p className="text-xl text-gray-600 mb-8 max-w-2xl mx-auto">
            {t('pages.home.experienceAdvanced')}
          </p>
          <Link
            to="/register"
            className="btn-primary text-lg px-10 py-4"
          >
            {t('pages.home.createYourAccount')}
          </Link>
        </div>
      </section>
    </div>
  );
};

export default Home;



