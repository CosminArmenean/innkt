// User models matching the backend structure

export interface BaseEntity {
  id: string;
  createdAt: Date;
  updatedAt: Date;
  isActive: boolean;
}

export interface UserConsent {
  id: string;
  userId: string;
  consentType: ConsentType;
  isAccepted: boolean;
  acceptedAt: Date;
  revokedAt?: Date;
  version: string;
}

export enum ConsentType {
  TermsOfService = 'TermsOfService',
  PrivacyPolicy = 'PrivacyPolicy',
  Marketing = 'Marketing',
  Cookies = 'Cookies',
  Biometrics = 'Biometrics',
  Location = 'Location',
  Notifications = 'Notifications',
}

export interface UserRole {
  id: string;
  userId: string;
  roleId: string;
  assignedAt: Date;
  assignedBy?: string;
}

export interface Role {
  id: string;
  name: string;
  description?: string;
  isActive: boolean;
  permissions: Permission[];
}

export interface Permission {
  id: string;
  name: string;
  description?: string;
  resource: string;
  action: string;
}

export interface RolePermission {
  id: string;
  roleId: string;
  permissionId: string;
}

// Main User model matching backend
export interface User extends BaseEntity {
  firstName: string;
  lastName: string;
  email: string;
  passwordHash?: string; // Only for backend, not exposed to frontend
  countryCode?: string;
  mobilePhone?: string;
  birthDate?: Date;
  gender?: string;
  language: string;
  theme: string;
  profilePictureUrl?: string;
  
  // Joint account support
  isJointAccount: boolean;
  linkedUserId?: string;
  linkedUser?: User;
  
  // Navigation properties
  userRoles: UserRole[];
  userConsents: UserConsent[];
  
  // Computed properties
  fullName: string;
  isLinked: boolean;
}

// Frontend User model (simplified for mobile app)
export interface AppUser {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  countryCode?: string;
  mobilePhone?: string;
  birthDate?: Date;
  gender?: string;
  language: string;
  theme: string;
  profilePictureUrl?: string;
  
  // Joint account support
  isJointAccount: boolean;
  linkedUserId?: string;
  linkedUser?: AppUser;
  
  // User roles and permissions
  roles: string[];
  permissions: string[];
  
  // GDPR consent status
  consentStatus: ConsentStatus;
  
  // Computed properties
  fullName: string;
  isLinked: boolean;
  
  // Timestamps
  createdAt: Date;
  updatedAt: Date;
  lastLoginAt?: Date;
}

// Consent status for GDPR compliance
export interface ConsentStatus {
  termsOfService: boolean;
  privacyPolicy: boolean;
  marketing: boolean;
  cookies: boolean;
  biometrics: boolean;
  location: boolean;
  notifications: boolean;
  
  // Timestamps
  termsAcceptedAt?: Date;
  privacyAcceptedAt?: Date;
  marketingAcceptedAt?: Date;
  cookiesAcceptedAt?: Date;
  biometricsAcceptedAt?: Date;
  locationAcceptedAt?: Date;
  notificationsAcceptedAt?: Date;
}

// User registration request
export interface UserRegistrationRequest {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  passwordConfirmation: string;
  countryCode?: string;
  mobilePhone?: string;
  birthDate?: Date;
  gender?: string;
  language: string;
  theme?: string;
  
  // Joint account support
  isJointAccount?: boolean;
  jointAccount?: JointAccountRequest;
  
  // GDPR consent
  acceptTerms: boolean;
  acceptPrivacyPolicy: boolean;
  acceptMarketing: boolean;
  acceptCookies: boolean;
}

// Joint account request
export interface JointAccountRequest {
  secondUserFirstName: string;
  secondUserLastName: string;
  secondUserPassword: string;
  secondUserPasswordConfirmation: string;
  secondUserCountryCode?: string;
  secondUserMobilePhone?: string;
  secondUserBirthDate?: Date;
  secondUserGender?: string;
}

// User login request
export interface UserLoginRequest {
  email: string;
  password: string;
  rememberMe?: boolean;
  biometricAuth?: boolean;
}

// User authentication response
export interface UserAuthResponse {
  user: AppUser;
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
  tokenType: string;
}

// User profile update request
export interface UserProfileUpdateRequest {
  firstName?: string;
  lastName?: string;
  countryCode?: string;
  mobilePhone?: string;
  birthDate?: Date;
  gender?: string;
  language?: string;
  theme?: string;
  profilePictureUrl?: string;
}

// Password change request
export interface PasswordChangeRequest {
  currentPassword: string;
  newPassword: string;
  newPasswordConfirmation: string;
}

// User search and filtering
export interface UserSearchRequest {
  query?: string;
  language?: string;
  isJointAccount?: boolean;
  hasProfilePicture?: boolean;
  page: number;
  pageSize: number;
}

export interface UserSearchResponse {
  users: AppUser[];
  totalCount: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

// User statistics
export interface UserStats {
  userId: string;
  postsCount: number;
  followersCount: number;
  followingCount: number;
  likesReceived: number;
  commentsReceived: number;
  sharesReceived: number;
  lastActivityAt: Date;
}

// User activity
export interface UserActivity {
  id: string;
  userId: string;
  activityType: UserActivityType;
  description: string;
  metadata?: Record<string, any>;
  createdAt: Date;
}

export enum UserActivityType {
  Login = 'Login',
  Logout = 'Logout',
  ProfileUpdate = 'ProfileUpdate',
  PasswordChange = 'PasswordChange',
  PostCreated = 'PostCreated',
  PostLiked = 'PostLiked',
  PostCommented = 'PostCommented',
  PostShared = 'PostShared',
  UserFollowed = 'UserFollowed',
  UserUnfollowed = 'UserUnfollowed',
  ConsentUpdated = 'ConsentUpdated',
}

// User preferences
export interface UserPreferences {
  userId: string;
  language: string;
  theme: string;
  timezone: string;
  dateFormat: string;
  timeFormat: string;
  currency: string;
  notifications: NotificationPreferences;
  privacy: PrivacyPreferences;
}

export interface NotificationPreferences {
  pushNotifications: boolean;
  emailNotifications: boolean;
  smsNotifications: boolean;
  inAppNotifications: boolean;
  postLikes: boolean;
  postComments: boolean;
  postShares: boolean;
  newFollowers: boolean;
  mentions: boolean;
  marketing: boolean;
}

export interface PrivacyPreferences {
  profileVisibility: ProfileVisibility;
  postVisibility: PostVisibility;
  allowMessages: boolean;
  allowFollowRequests: boolean;
  showOnlineStatus: boolean;
  showLastSeen: boolean;
  allowTagging: boolean;
  allowLocationSharing: boolean;
}

export enum ProfileVisibility {
  Public = 'Public',
  Friends = 'Friends',
  Private = 'Private',
}

export enum PostVisibility {
  Public = 'Public',
  Friends = 'Friends',
  Private = 'Private',
  Custom = 'Custom',
}

// Utility functions
export const createEmptyUser = (): AppUser => ({
  id: '',
  firstName: '',
  lastName: '',
  email: '',
  language: 'en',
  theme: 'light',
  isJointAccount: false,
  roles: [],
  permissions: [],
  consentStatus: {
    termsOfService: false,
    privacyPolicy: false,
    marketing: false,
    cookies: false,
    biometrics: false,
    location: false,
    notifications: false,
  },
  fullName: '',
  isLinked: false,
  createdAt: new Date(),
  updatedAt: new Date(),
});

export const createEmptyConsentStatus = (): ConsentStatus => ({
  termsOfService: false,
  privacyPolicy: false,
  marketing: false,
  cookies: false,
  biometrics: false,
  location: false,
  notifications: false,
});

export const getUserDisplayName = (user: AppUser): string => {
  if (user.fullName) return user.fullName;
  return `${user.firstName} ${user.lastName}`.trim() || user.email;
};

export const isUserConsentComplete = (user: AppUser): boolean => {
  const {consentStatus} = user;
  return consentStatus.termsOfService && consentStatus.privacyPolicy;
};

export const hasUserPermission = (user: AppUser, permission: string): boolean => {
  return user.permissions.includes(permission);
};

export const hasUserRole = (user: AppUser, role: string): boolean => {
  return user.roles.includes(role);
};






