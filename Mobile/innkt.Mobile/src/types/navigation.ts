export type RootStackParamList = {
  // Auth Screens
  Login: undefined;
  Register: undefined;
  
  // Main App Screens
  Dashboard: undefined;
  Profile: {userId?: string};
  PostList: {category?: string};
  PostCreate: {draftId?: string};
  
  // Post Screens
  PostDetail: {postId: string};
  PostEdit: {postId: string};
  
  // User Screens
  UserProfile: {userId: string};
  UserSettings: undefined;
  UserFriends: undefined;
  
  // Chat Screens
  ChatList: undefined;
  ChatRoom: {chatId: string; otherUserId: string};
  
  // Notification Screens
  Notifications: undefined;
  
  // Search Screens
  Search: {query?: string};
  SearchResults: {query: string; filters?: any};
  
  // Settings Screens
  Settings: undefined;
  PrivacySettings: undefined;
  NotificationSettings: undefined;
  LanguageSettings: undefined;
  ThemeSettings: undefined;
  
  // Help Screens
  Help: undefined;
  About: undefined;
  TermsOfService: undefined;
  PrivacyPolicy: undefined;
  
  // Modal Screens
  ImagePicker: {onImageSelected: (image: any) => void};
  Camera: {onPhotoTaken: (photo: any) => void};
  LocationPicker: {onLocationSelected: (location: any) => void};
  
  // Deep Link Screens
  DeepLink: {url: string};
  
  // Error Screens
  Error: {error: string; retry?: () => void};
  Maintenance: undefined;
  Offline: undefined;
};

export type TabParamList = {
  Home: undefined;
  Explore: undefined;
  Create: undefined;
  Notifications: undefined;
  Profile: undefined;
};

export type DrawerParamList = {
  Main: undefined;
  Settings: undefined;
  Help: undefined;
  About: undefined;
  Logout: undefined;
};





