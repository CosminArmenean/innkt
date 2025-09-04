# Innkt Mobile App

A React Native mobile application for the Innkt social platform, supporting both iOS and Android platforms.

## 🚀 Features

### Core Functionality
- **Authentication System**
  - User registration and login
  - Joint account support (dual passwords)
  - OAuth 2.0 integration with Officer service
  - Biometric authentication support
  - Secure token management

- **Social Features**
  - Create, edit, and delete posts
  - Like, comment, and share posts
  - User profiles and friend management
  - News feed with filtering and search
  - Real-time notifications

- **Multi-language Support**
  - English, Hebrew, and Arabic
  - Right-to-Left (RTL) layout support
  - Dynamic language switching

- **Theme System**
  - Light, Dark, and Auto themes
  - Material Design 3 components
  - Custom color schemes
  - System theme detection

### Technical Features
- **Navigation**
  - Stack navigation for screens
  - Tab navigation for main sections
  - Drawer navigation for settings
  - Deep linking support

- **State Management**
  - React Context for global state
  - AsyncStorage for local persistence
  - Secure storage for sensitive data

- **Performance**
  - Image optimization and caching
  - Lazy loading for posts
  - Pull-to-refresh functionality
  - Offline support (planned)

## 📱 Supported Platforms

- **iOS**: 12.0+
- **Android**: API level 21+ (Android 5.0+)

## 🛠️ Prerequisites

Before running this project, ensure you have the following installed:

### Required Software
- **Node.js**: 18.0.0 or higher
- **npm**: 8.0.0 or higher
- **React Native CLI**: Latest version
- **Watchman** (macOS): For file watching

### Platform-Specific Requirements

#### iOS Development
- **Xcode**: 14.0 or higher
- **CocoaPods**: Latest version
- **iOS Simulator** or physical device

#### Android Development
- **Android Studio**: Latest version
- **Android SDK**: API level 21+
- **Android Emulator** or physical device

## 🚀 Installation

### 1. Clone the Repository
```bash
git clone <repository-url>
cd innkt/Mobile/innkt.Mobile
```

### 2. Install Dependencies
```bash
npm install
```

### 3. iOS Setup (macOS only)
```bash
cd ios
pod install
cd ..
```

### 4. Environment Configuration
Create a `.env` file in the root directory:
```env
# Backend Services
OFFICER_BASE_URL=https://localhost:5000
FRONTIER_BASE_URL=https://localhost:5002

# Feature Flags
ENABLE_BIOMETRICS=true
ENABLE_PUSH_NOTIFICATIONS=true
ENABLE_ANALYTICS=true

# Social Login (Optional)
GOOGLE_CLIENT_ID=your_google_client_id
FACEBOOK_APP_ID=your_facebook_app_id
```

## 🏃‍♂️ Running the App

### Start Metro Bundler
```bash
npm start
```

### Run on iOS
```bash
npm run ios
```

### Run on Android
```bash
npm run android
```

### Run Tests
```bash
npm test
```

### Linting and Type Checking
```bash
npm run lint
npm run type-check
```

## 🏗️ Project Structure

```
src/
├── components/          # Reusable UI components
│   ├── common/         # Generic components
│   ├── forms/          # Form components
│   └── navigation/     # Navigation components
├── contexts/           # React Context providers
│   ├── AuthContext.tsx # Authentication state
│   ├── ThemeContext.tsx # Theme management
│   └── LanguageContext.tsx # Internationalization
├── screens/            # Screen components
│   ├── auth/          # Authentication screens
│   ├── main/          # Main app screens
│   ├── posts/         # Post-related screens
│   └── settings/      # Settings screens
├── services/           # API and external services
│   ├── api/           # API client
│   ├── storage/       # Local storage
│   └── notifications/ # Push notifications
├── types/              # TypeScript type definitions
├── utils/              # Utility functions
└── assets/             # Images, fonts, etc.
```

## 🔧 Configuration

### Navigation Configuration
The app uses React Navigation with the following structure:

- **Auth Stack**: Login, Register
- **Main Stack**: Dashboard, Profile, Posts
- **Tab Navigator**: Home, Explore, Create, Notifications, Profile
- **Drawer Navigator**: Settings, Help, About

### Theme Configuration
Themes are defined in `ThemeContext.tsx` with Material Design 3 support:

- **Light Theme**: Default light appearance
- **Dark Theme**: Dark mode with custom colors
- **Auto Theme**: Follows system preference

### Language Configuration
Languages are configured in `LanguageContext.tsx`:

- **English**: Default language
- **Hebrew**: RTL support
- **Arabic**: RTL support

## 📱 Key Components

### Authentication Components
- `LoginScreen`: User login interface
- `RegisterScreen`: User registration with joint account support
- `AuthContext`: Global authentication state management

### Main App Components
- `DashboardScreen`: Main feed and user overview
- `ProfileScreen`: User profile and settings
- `PostListScreen`: Posts feed with filtering
- `PostCreateScreen`: Post creation interface

### Context Providers
- `AuthProvider`: Manages user authentication state
- `ThemeProvider`: Handles theme switching and customization
- `LanguageProvider`: Manages internationalization

## 🔐 Security Features

### Authentication Security
- JWT token management
- Secure token storage using Keychain (iOS) and Keystore (Android)
- Biometric authentication support
- Token refresh mechanism

### Data Security
- Encrypted local storage for sensitive data
- Secure API communication
- Input validation and sanitization

## 🌐 API Integration

### Backend Services
- **Officer Service**: Identity and authentication
- **Frontier Service**: API gateway and routing
- **Data Service**: User data and content management

### API Endpoints
- Authentication: `/api/auth/*`
- Posts: `/api/posts/*`
- Users: `/api/users/*`
- Media: `/api/media/*`

## 📊 Performance Optimization

### Image Handling
- Image compression and resizing
- Lazy loading for post images
- Caching strategies
- Progressive image loading

### State Management
- Efficient re-renders with React.memo
- Optimized context usage
- Local state for UI interactions

## 🧪 Testing

### Test Structure
- **Unit Tests**: Component and utility testing
- **Integration Tests**: API and navigation testing
- **E2E Tests**: Full user flow testing

### Running Tests
```bash
# Run all tests
npm test

# Run tests in watch mode
npm test -- --watch

# Generate coverage report
npm test -- --coverage
```

## 🚀 Deployment

### Build Configuration

#### Android
```bash
# Debug build
npm run android

# Release build
npm run build:android
```

#### iOS
```bash
# Debug build
npm run ios

# Release build
npm run build:ios
```

### App Store Deployment
1. Update version in `package.json`
2. Configure signing certificates
3. Build release version
4. Upload to App Store Connect/Google Play Console

## 🔧 Development Guidelines

### Code Style
- Use TypeScript for all new code
- Follow React Native best practices
- Use functional components with hooks
- Implement proper error handling

### Component Guidelines
- Keep components focused and single-purpose
- Use proper prop typing
- Implement proper loading and error states
- Follow accessibility guidelines

### State Management
- Use Context for global state
- Use local state for component-specific data
- Implement proper loading states
- Handle errors gracefully

## 🐛 Troubleshooting

### Common Issues

#### Metro Bundler Issues
```bash
# Clear Metro cache
npx react-native start --reset-cache
```

#### iOS Build Issues
```bash
# Clean build folder
cd ios && xcodebuild clean && cd ..
# Reinstall pods
cd ios && pod install && cd ..
```

#### Android Build Issues
```bash
# Clean Android build
cd android && ./gradlew clean && cd ..
# Reset Metro cache
npx react-native start --reset-cache
```

### Debug Mode
- Enable React Native Debugger
- Use Flipper for advanced debugging
- Monitor network requests
- Check console logs

## 📚 Additional Resources

### Documentation
- [React Native Documentation](https://reactnative.dev/)
- [React Navigation](https://reactnavigation.org/)
- [React Native Paper](https://callstack.github.io/react-native-paper/)
- [TypeScript Handbook](https://www.typescriptlang.org/docs/)

### Community
- [React Native Community](https://github.com/react-native-community)
- [Stack Overflow](https://stackoverflow.com/questions/tagged/react-native)
- [Discord Community](https://discord.gg/react-native)

## 🤝 Contributing

### Development Workflow
1. Create feature branch from `main`
2. Implement changes with tests
3. Run linting and type checking
4. Submit pull request
5. Code review and approval

### Code Review Checklist
- [ ] Code follows style guidelines
- [ ] Tests are included and passing
- [ ] Documentation is updated
- [ ] No console.log statements
- [ ] Proper error handling
- [ ] Accessibility considerations

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🆘 Support

For support and questions:
- Create an issue in the repository
- Contact the development team
- Check the troubleshooting section
- Review the documentation

---

**Note**: This is a development version. Some features may be incomplete or in development. Please refer to the latest documentation for current status.





