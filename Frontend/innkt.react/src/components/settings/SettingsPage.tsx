import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import ThemeSelector from '../theme/ThemeSelector';
import LanguageSelector from '../language/LanguageSelector';
import { 
  Cog6ToothIcon, 
  PaintBrushIcon, 
  LanguageIcon, 
  ShieldCheckIcon,
  BellIcon,
  UserIcon,
  ChevronRightIcon,
  CheckIcon
} from '@heroicons/react/24/outline';

interface SettingsSection {
  id: string;
  title: string;
  description: string;
  icon: React.ComponentType<any>;
  href?: string;
  component?: React.ComponentType<any>;
  badge?: string;
}

const SettingsPage: React.FC = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [activeSection, setActiveSection] = useState<string | null>(null);

  const settingsSections: SettingsSection[] = [
    {
      id: 'appearance',
      title: t('settings.appearance'),
      description: t('theme.themeDescription'),
      icon: PaintBrushIcon,
      component: ThemeSelector
    },
    {
      id: 'language',
      title: t('settings.language'),
      description: t('settings.languageDescription'),
      icon: LanguageIcon,
      href: '/settings/language'
    },
    {
      id: 'notifications',
      title: t('settings.notifications'),
      description: 'Manage your notification preferences',
      icon: BellIcon,
      href: '/notifications'
    },
    {
      id: 'security',
      title: t('nav.security'),
      description: 'Manage your account security and privacy',
      icon: ShieldCheckIcon,
      href: '/security'
    },
    {
      id: 'profile',
      title: t('nav.profile'),
      description: 'Manage your profile and account settings',
      icon: UserIcon,
      href: '/profile'
    }
  ];

  const handleSectionClick = (section: SettingsSection) => {
    if (section.href) {
      navigate(section.href);
    } else if (section.component) {
      setActiveSection(activeSection === section.id ? null : section.id);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="bg-card border-b border-border">
        <div className="max-w-4xl mx-auto px-4 py-6">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-primary bg-opacity-10 rounded-lg">
              <Cog6ToothIcon className="h-6 w-6 text-primary" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-primary">{t('nav.settings')}</h1>
              <p className="text-secondary">Manage your account preferences and settings</p>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Settings Navigation */}
          <div className="lg:col-span-1">
            <div className="bg-card rounded-xl border border-border shadow-sm">
              <div className="p-6">
                <h2 className="text-lg font-semibold text-primary mb-4">Settings</h2>
                <nav className="space-y-2">
                  {settingsSections.map((section) => {
                    const IconComponent = section.icon;
                    const isActive = activeSection === section.id;
                    
                    return (
                      <button
                        key={section.id}
                        onClick={() => handleSectionClick(section)}
                        className={`w-full flex items-center justify-between p-3 rounded-lg text-left transition-all duration-200 ${
                          isActive 
                            ? 'bg-primary bg-opacity-10 border border-primary border-opacity-20' 
                            : 'hover:bg-hover border border-transparent'
                        }`}
                      >
                        <div className="flex items-center space-x-3">
                          <div className={`p-2 rounded-lg ${
                            isActive 
                              ? 'bg-primary bg-opacity-20' 
                              : 'bg-gray-100 dark:bg-gray-700'
                          }`}>
                            <IconComponent className={`h-5 w-5 ${
                              isActive 
                                ? 'text-primary' 
                                : 'text-gray-600 dark:text-gray-300'
                            }`} />
                          </div>
                          <div>
                            <div className="flex items-center space-x-2">
                              <span className="font-medium text-primary">{section.title}</span>
                              {section.badge && (
                                <span className="px-2 py-1 text-xs bg-primary bg-opacity-20 text-primary rounded-full">
                                  {section.badge}
                                </span>
                              )}
                            </div>
                            <p className="text-sm text-secondary">{section.description}</p>
                          </div>
                        </div>
                        
                        {section.href ? (
                          <ChevronRightIcon className="h-5 w-5 text-secondary" />
                        ) : section.component ? (
                          <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center ${
                            isActive 
                              ? 'border-primary bg-primary' 
                              : 'border-gray-300 dark:border-gray-600'
                          }`}>
                            {isActive && <CheckIcon className="h-3 w-3 text-white" />}
                          </div>
                        ) : null}
                      </button>
                    );
                  })}
                </nav>
              </div>
            </div>
          </div>

          {/* Settings Content */}
          <div className="lg:col-span-2">
            <div className="bg-card rounded-xl border border-border shadow-sm">
              <div className="p-6">
                {activeSection === 'appearance' && (
                  <div>
                    <div className="flex items-center space-x-3 mb-6">
                      <div className="p-2 bg-primary bg-opacity-10 rounded-lg">
                        <PaintBrushIcon className="h-6 w-6 text-primary" />
                      </div>
                      <div>
                        <h2 className="text-xl font-semibold text-primary">{t('settings.appearance')}</h2>
                        <p className="text-secondary">Customize the look and feel of your interface</p>
                      </div>
                    </div>
                    
                    <ThemeSelector showLabels={true} />
                  </div>
                )}

                {activeSection === 'language' && (
                  <div>
                    <div className="flex items-center space-x-3 mb-6">
                      <div className="p-2 bg-primary bg-opacity-10 rounded-lg">
                        <LanguageIcon className="h-6 w-6 text-primary" />
                      </div>
                      <div>
                        <h2 className="text-xl font-semibold text-primary">{t('settings.language')}</h2>
                        <p className="text-secondary">Choose your preferred language</p>
                      </div>
                    </div>
                    
                    <LanguageSelector />
                  </div>
                )}

                {!activeSection && (
                  <div className="text-center py-12">
                    <div className="p-4 bg-gray-100 dark:bg-gray-700 rounded-full w-16 h-16 mx-auto mb-4 flex items-center justify-center">
                      <Cog6ToothIcon className="h-8 w-8 text-gray-400" />
                    </div>
                    <h3 className="text-lg font-semibold text-primary mb-2">Welcome to Settings</h3>
                    <p className="text-secondary max-w-md mx-auto">
                      Choose a setting from the sidebar to customize your experience. 
                      You can manage your appearance, language, notifications, security, and more.
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SettingsPage;
