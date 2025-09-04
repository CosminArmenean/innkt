export interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  username?: string;
  language: string;
  profilePicture?: string;
  isActive: boolean;
  createdAt: Date;
  lastLoginAt?: Date;
  isJointAccount?: boolean;
  linkedUserId?: string;
  bio?: string;
  location?: string;
  website?: string;
  socialLinks?: SocialLinks;
  preferences?: UserPreferences;
}

export interface SocialLinks {
  twitter?: string;
  linkedin?: string;
  github?: string;
  facebook?: string;
  instagram?: string;
}

export interface UserPreferences {
  emailNotifications: boolean;
  pushNotifications: boolean;
  privacyLevel: 'public' | 'friends' | 'private';
  theme: 'light' | 'dark' | 'auto';
  language: string;
}

export interface UpdateProfileRequest {
  firstName?: string;
  lastName?: string;
  username?: string;
  bio?: string;
  location?: string;
  website?: string;
  socialLinks?: SocialLinks;
  preferences?: Partial<UserPreferences>;
}

export interface ChangePasswordRequest {
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
}

export interface UserStats {
  posts: number;
  followers: number;
  following: number;
  likes: number;
  comments: number;
}





