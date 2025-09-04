import React, {useEffect} from 'react';
import {NavigationContainer} from '@react-navigation/native';
import {Provider as PaperProvider} from 'react-native-paper';
import {GestureHandlerRootView} from 'react-native-gesture-handler';

// Contexts
import {ThemeProvider, useTheme} from './contexts/ThemeContext';
import {LanguageProvider, useLanguage} from './contexts/LanguageContext';
import {AuthProvider, useAuth} from './contexts/AuthContext';
import {NotificationProvider} from './contexts/NotificationContext';
import {AnalyticsContextProvider} from './contexts/AnalyticsContext';

// Services
import {notificationService} from './services/notifications/notificationService';
import {pushNotificationService} from './services/notifications/pushNotificationService';
import {offlineService} from './services/offline/offlineService';
import {mediaService} from './services/media/mediaService';

// Navigation
import AppNavigator from './navigation/AppNavigator';

// Theme and Language
import {getTheme} from './theme/theme';
import {getLanguage} from './i18n/language';

const AppContent = () => {
  const {themeMode} = useTheme();
  const {currentLanguage} = useLanguage();
  const {isAuthenticated} = useAuth();

  const theme = getTheme(themeMode);
  const lang = getLanguage(currentLanguage.code as any);

  useEffect(() => {
    // Initialize offline service
    offlineService.initialize();

    // Initialize push notification service if authenticated
    if (isAuthenticated) {
      pushNotificationService.initialize();
    }
  }, [isAuthenticated]);

  return (
    <PaperProvider theme={theme}>
      <NavigationContainer theme={theme}>
        <AppNavigator />
      </NavigationContainer>
    </PaperProvider>
  );
};

const App = () => {
  return (
    <GestureHandlerRootView style={{flex: 1}}>
      <ThemeProvider>
        <LanguageProvider>
          <AuthProvider>
            <NotificationProvider>
              <AnalyticsContextProvider>
                <AppContent />
              </AnalyticsContextProvider>
            </NotificationProvider>
          </AuthProvider>
        </LanguageProvider>
      </ThemeProvider>
    </GestureHandlerRootView>
  );
};

export default App;
