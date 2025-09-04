// Post models for social media functionality
import {BaseEntity, AppUser} from './user';

export interface Post extends BaseEntity {
  authorId: string;
  author: AppUser;
  content: string;
  media: PostMedia[];
  category: PostCategory;
  tags: string[];
  location?: PostLocation;
  visibility: PostVisibility;
  isPublished: boolean;
  publishedAt?: Date;
  
  // Interaction counts
  likesCount: number;
  commentsCount: number;
  sharesCount: number;
  viewsCount: number;
  
  // User interaction status
  isLiked: boolean;
  isBookmarked: boolean;
  isShared: boolean;
  
  // Metadata
  language: string;
  sentiment?: PostSentiment;
  contentModeration: ContentModeration;
  
  // Engagement metrics
  engagementRate: number;
  reachCount: number;
  impressionCount: number;
}

export interface PostMedia {
  id: string;
  postId: string;
  mediaType: MediaType;
  url: string;
  thumbnailUrl?: string;
  altText?: string;
  caption?: string;
  order: number;
  
  // Media properties
  width?: number;
  height?: number;
  size?: number;
  duration?: number; // For videos
  format: string;
  
  // Processing status
  isProcessed: boolean;
  processingStatus: ProcessingStatus;
  processingError?: string;
}

export enum MediaType {
  Image = 'Image',
  Video = 'Video',
  Audio = 'Audio',
  Document = 'Document',
  Gif = 'Gif',
}

export enum ProcessingStatus {
  Pending = 'Pending',
  Processing = 'Processing',
  Completed = 'Completed',
  Failed = 'Failed',
}

export interface PostLocation {
  id: string;
  postId: string;
  name: string;
  address?: string;
  latitude: number;
  longitude: number;
  placeId?: string; // Google Places ID
  country?: string;
  city?: string;
  state?: string;
  postalCode?: string;
}

export enum PostCategory {
  Personal = 'Personal',
  Work = 'Work',
  Travel = 'Travel',
  Food = 'Food',
  Fitness = 'Fitness',
  Technology = 'Technology',
  Entertainment = 'Entertainment',
  Education = 'Education',
  Health = 'Health',
  Sports = 'Sports',
  News = 'News',
  Other = 'Other',
}

export enum PostSentiment {
  Positive = 'Positive',
  Negative = 'Negative',
  Neutral = 'Neutral',
  Mixed = 'Mixed',
}

export interface ContentModeration {
  isModerated: boolean;
  moderationStatus: ModerationStatus;
  moderationScore: number;
  flaggedContent: string[];
  moderationNotes?: string;
  moderatedAt?: Date;
  moderatedBy?: string;
}

export enum ModerationStatus {
  Pending = 'Pending',
  Approved = 'Approved',
  Rejected = 'Rejected',
  Flagged = 'Flagged',
  UnderReview = 'UnderReview',
}

// Post creation request
export interface PostCreateRequest {
  content: string;
  media?: PostMediaRequest[];
  category: PostCategory;
  tags?: string[];
  location?: PostLocationRequest;
  visibility: PostVisibility;
  language?: string;
  scheduledAt?: Date;
}

export interface PostMediaRequest {
  mediaType: MediaType;
  file: File | Blob;
  altText?: string;
  caption?: string;
  order?: number;
}

export interface PostLocationRequest {
  name: string;
  address?: string;
  latitude: number;
  longitude: number;
  placeId?: string;
}

// Post update request
export interface PostUpdateRequest {
  content?: string;
  media?: PostMediaRequest[];
  category?: PostCategory;
  tags?: string[];
  location?: PostLocationRequest;
  visibility?: PostVisibility;
  language?: string;
}

// Post interaction requests
export interface PostLikeRequest {
  postId: string;
  userId: string;
}

export interface PostCommentRequest {
  postId: string;
  content: string;
  parentCommentId?: string;
  media?: PostMediaRequest[];
}

export interface PostShareRequest {
  postId: string;
  targetPlatform?: SocialPlatform;
  customMessage?: string;
  visibility?: PostVisibility;
}

export enum SocialPlatform {
  Facebook = 'Facebook',
  Twitter = 'Twitter',
  Instagram = 'Instagram',
  LinkedIn = 'LinkedIn',
  WhatsApp = 'WhatsApp',
  Telegram = 'Telegram',
  Email = 'Email',
  CopyLink = 'CopyLink',
}

// Post comment model
export interface PostComment extends BaseEntity {
  postId: string;
  authorId: string;
  author: AppUser;
  content: string;
  media?: PostMedia[];
  parentCommentId?: string;
  parentComment?: PostComment;
  replies: PostComment[];
  
  // Interaction counts
  likesCount: number;
  repliesCount: number;
  
  // User interaction status
  isLiked: boolean;
  
  // Moderation
  isModerated: boolean;
  moderationStatus: ModerationStatus;
}

// Post search and filtering
export interface PostSearchRequest {
  query?: string;
  authorId?: string;
  category?: PostCategory;
  tags?: string[];
  location?: PostLocationRequest;
  visibility?: PostVisibility;
  language?: string;
  dateFrom?: Date;
  dateTo?: Date;
  hasMedia?: boolean;
  mediaType?: MediaType;
  sortBy: PostSortBy;
  sortOrder: SortOrder;
  page: number;
  pageSize: number;
}

export enum PostSortBy {
  CreatedAt = 'CreatedAt',
  UpdatedAt = 'UpdatedAt',
  PublishedAt = 'PublishedAt',
  LikesCount = 'LikesCount',
  CommentsCount = 'CommentsCount',
  SharesCount = 'SharesCount',
  ViewsCount = 'ViewsCount',
  EngagementRate = 'EngagementRate',
  ReachCount = 'ReachCount',
}

export enum SortOrder {
  Ascending = 'Ascending',
  Descending = 'Descending',
}

export interface PostSearchResponse {
  posts: Post[];
  totalCount: number;
  page: number;
  pageSize: number;
  totalPages: number;
  facets: PostSearchFacets;
}

export interface PostSearchFacets {
  categories: CategoryFacet[];
  tags: TagFacet[];
  authors: AuthorFacet[];
  locations: LocationFacet[];
  dateRanges: DateRangeFacet[];
}

export interface CategoryFacet {
  category: PostCategory;
  count: number;
}

export interface TagFacet {
  tag: string;
  count: number;
}

export interface AuthorFacet {
  authorId: string;
  authorName: string;
  count: number;
}

export interface LocationFacet {
  location: string;
  count: number;
}

export interface DateRangeFacet {
  range: string;
  count: number;
}

// Post feed models
export interface PostFeedRequest {
  userId?: string;
  feedType: FeedType;
  page: number;
  pageSize: number;
  filters?: PostFeedFilters;
}

export enum FeedType {
  Home = 'Home',
  Profile = 'Profile',
  Following = 'Following',
  Trending = 'Trending',
  Category = 'Category',
  Search = 'Search',
  Saved = 'Saved',
  Bookmarked = 'Bookmarked',
}

export interface PostFeedFilters {
  categories?: PostCategory[];
  tags?: string[];
  hasMedia?: boolean;
  mediaType?: MediaType;
  dateRange?: DateRange;
  language?: string;
}

export interface DateRange {
  from: Date;
  to: Date;
}

export interface PostFeedResponse {
  posts: Post[];
  totalCount: number;
  page: number;
  pageSize: number;
  totalPages: number;
  hasMore: boolean;
  nextCursor?: string;
}

// Post analytics
export interface PostAnalytics {
  postId: string;
  views: ViewAnalytics;
  engagement: EngagementAnalytics;
  reach: ReachAnalytics;
  demographics: DemographicsAnalytics;
  timeSeries: TimeSeriesData[];
}

export interface ViewAnalytics {
  totalViews: number;
  uniqueViews: number;
  averageViewDuration: number;
  viewSources: ViewSource[];
}

export interface ViewSource {
  source: string;
  count: number;
  percentage: number;
}

export interface EngagementAnalytics {
  likes: number;
  comments: number;
  shares: number;
  bookmarks: number;
  engagementRate: number;
  clickThroughRate: number;
}

export interface ReachAnalytics {
  totalReach: number;
  organicReach: number;
  paidReach: number;
  viralReach: number;
  reachByCountry: CountryReach[];
}

export interface CountryReach {
  country: string;
  count: number;
  percentage: number;
}

export interface DemographicsAnalytics {
  ageGroups: AgeGroupData[];
  genders: GenderData[];
  languages: LanguageData[];
}

export interface AgeGroupData {
  ageGroup: string;
  count: number;
  percentage: number;
}

export interface GenderData {
  gender: string;
  count: number;
  percentage: number;
}

export interface LanguageData {
  language: string;
  count: number;
  percentage: number;
}

export interface TimeSeriesData {
  timestamp: Date;
  views: number;
  likes: number;
  comments: number;
  shares: number;
  engagement: number;
}

// Utility functions
export const createEmptyPost = (): Post => ({
  id: '',
  authorId: '',
  author: createEmptyUser(),
  content: '',
  media: [],
  category: PostCategory.Personal,
  tags: [],
  visibility: PostVisibility.Public,
  isPublished: false,
  likesCount: 0,
  commentsCount: 0,
  sharesCount: 0,
  viewsCount: 0,
  isLiked: false,
  isBookmarked: false,
  isShared: false,
  language: 'en',
  contentModeration: {
    isModerated: false,
    moderationStatus: ModerationStatus.Pending,
    moderationScore: 0,
    flaggedContent: [],
  },
  engagementRate: 0,
  reachCount: 0,
  impressionCount: 0,
  createdAt: new Date(),
  updatedAt: new Date(),
  isActive: true,
});

export const createEmptyPostComment = (): PostComment => ({
  id: '',
  postId: '',
  authorId: '',
  author: createEmptyUser(),
  content: '',
  media: [],
  replies: [],
  likesCount: 0,
  repliesCount: 0,
  isLiked: false,
  isModerated: false,
  moderationStatus: ModerationStatus.Pending,
  createdAt: new Date(),
  updatedAt: new Date(),
  isActive: true,
});

export const isPostVisible = (post: Post, currentUserId: string): boolean => {
  if (post.visibility === PostVisibility.Public) return true;
  if (post.authorId === currentUserId) return true;
  if (post.visibility === PostVisibility.Private) return false;
  
  // For Friends visibility, check if current user is a friend
  // This would need to be implemented based on friendship logic
  return false;
};

export const canUserEditPost = (post: Post, currentUserId: string): boolean => {
  return post.authorId === currentUserId;
};

export const canUserDeletePost = (post: Post, currentUserId: string): boolean => {
  return post.authorId === currentUserId;
};

export const getPostEngagementRate = (post: Post): number => {
  const totalInteractions = post.likesCount + post.commentsCount + post.sharesCount;
  if (post.viewsCount === 0) return 0;
  return (totalInteractions / post.viewsCount) * 100;
};

export const formatPostContent = (content: string, maxLength: number = 200): string => {
  if (content.length <= maxLength) return content;
  return content.substring(0, maxLength) + '...';
};

export const extractPostTags = (content: string): string[] => {
  const tagRegex = /#(\w+)/g;
  const matches = content.match(tagRegex);
  return matches ? matches.map(tag => tag.substring(1)) : [];
};

export const validatePostContent = (content: string): {isValid: boolean; errors: string[]} => {
  const errors: string[] = [];
  
  if (!content.trim()) {
    errors.push('Post content cannot be empty');
  }
  
  if (content.length < 10) {
    errors.push('Post content must be at least 10 characters long');
  }
  
  if (content.length > 1000) {
    errors.push('Post content cannot exceed 1000 characters');
  }
  
  return {
    isValid: errors.length === 0,
    errors,
  };
};
