import React from 'react';
import {createStackNavigator} from '@react-navigation/stack';
import {useAuth} from '../contexts/AuthContext';
import {useTheme} from '../contexts/ThemeContext';
import {useLanguage} from '../contexts/LanguageContext';

// Screens
import LoginScreen from '../screens/auth/LoginScreen';
import RegisterScreen from '../screens/auth/RegisterScreen';
import DashboardScreen from '../screens/main/DashboardScreen';
import ProfileScreen from '../screens/main/ProfileScreen';
import PostListScreen from '../screens/posts/PostListScreen';
import PostCreateScreen from '../screens/posts/PostCreateScreen';

// Types
import {RootStackParamList} from '../types/navigation';

const Stack = createStackNavigator<RootStackParamList>();

const AppNavigator = () => {
  const {isAuthenticated, isLoading} = useAuth();
  const {themeMode} = useTheme();
  const {language} = useLanguage();

  if (isLoading) {
    return null; // Loading state will be handled by a splash screen or loading component
  }

  return (
    <Stack.Navigator
      screenOptions={{
        headerStyle: {
          backgroundColor: themeMode === 'dark' ? '#1e1e1e' : '#ffffff',
        },
        headerTintColor: themeMode === 'dark' ? '#ffffff' : '#000000',
        headerTitleStyle: {
          fontWeight: 'bold',
        },
        gestureDirection: language === 'ar' || language === 'he' ? 'horizontal-inverted' : 'horizontal',
      }}>
      {!isAuthenticated ? (
        // Auth Stack
        <>
          <Stack.Screen
            name="Login"
            component={LoginScreen}
            options={{headerShown: false}}
          />
          <Stack.Screen
            name="Register"
            component={RegisterScreen}
            options={{headerShown: false}}
          />
        </>
      ) : (
        // Main App Stack
        <>
          <Stack.Screen
            name="Dashboard"
            component={DashboardScreen}
            options={{title: 'Dashboard'}}
          />
          <Stack.Screen
            name="Profile"
            component={ProfileScreen}
            options={{title: 'Profile'}}
          />
          <Stack.Screen
            name="PostList"
            component={PostListScreen}
            options={{title: 'Posts'}}
          />
          <Stack.Screen
            name="PostCreate"
            component={PostCreateScreen}
            options={{title: 'Create Post'}}
          />
        </>
      )}
    </Stack.Navigator>
  );
};

export default AppNavigator;





