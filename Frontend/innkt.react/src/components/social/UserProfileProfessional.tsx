import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  User, 
  Camera, 
  MapPin, 
  Calendar, 
  Link as LinkIcon, 
  MoreHorizontal,
  MessageCircle,
  Settings,
  BarChart3,
  Building,
  GraduationCap,
  Shield,
  CheckCircle,
  Users,
  FileText,
  Heart,
  MessageSquare,
  Repeat,
  Share,
  Plus,
  AlertTriangle,
  XCircle,
  Eye
} from 'lucide-react';
import { socialService, UserProfile, Post, Group, Follow, KidAccount } from '../../services/social.service';
import { feedService } from '../../services/feed.service';
import { Repost, repostService } from '../../services/repost.service';
import RepostCard from './RepostCard';
import { useAuth } from '../../contexts/AuthContext';
import FollowButton from './FollowButton';
import UserActionsMenu from './UserActionsMenu';
import ReportUserModal from './ReportUserModal';

interface UserProfileProfessionalProps {
  userId: string;
  isOwnProfile?: boolean;
  currentUserId?: string;
}

const UserProfileProfessional: React.FC<UserProfileProfessionalProps> = ({ 
  userId, 
  isOwnProfile = false, 
  currentUserId 
}) => {
  const { user, updateUser, reloadUser } = useAuth();
  const navigate = useNavigate();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [posts, setPosts] = useState<Post[]>([]);
  const [reposts, setReposts] = useState<Repost[]>([]);
  const [kidAccounts, setKidAccounts] = useState<KidAccount[]>([]);
  const [linkedAccount, setLinkedAccount] = useState<UserProfile | null>(null);
  const [activeTab, setActiveTab] = useState<'posts' | 'reposts' | 'media' | 'chat' | 'kids' | 'business'>('posts');
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [page, setPage] = useState(1);
  const [isFollowing, setIsFollowing] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [showAvatarUpload, setShowAvatarUpload] = useState(false);
  const [showReportModal, setShowReportModal] = useState(false);
  const [showContextMenu, setShowContextMenu] = useState(false);

  useEffect(() => {
    loadProfile();
    loadPosts(true); // Reset posts on profile change
    loadReposts(true); // Reset reposts on profile change
    if (isOwnProfile) {
      loadKidAccounts();
    }
    if (!isOwnProfile && currentUserId) {
      checkFollowStatus();
    }
    loadLinkedAccount();
  }, [userId, isOwnProfile, currentUserId]);

  // Load data when tab changes
  useEffect(() => {
    if (activeTab === 'reposts') {
      loadReposts(true);
    } else if (activeTab === 'kids' && isOwnProfile) {
      loadKidAccounts();
    }
  }, [activeTab, isOwnProfile]);

  // Infinite scroll effect (copied from SocialFeed pattern)
  useEffect(() => {
    const handleScroll = () => {
      const scrollTop = document.documentElement.scrollTop;
      const scrollHeight = document.documentElement.scrollHeight;
      const clientHeight = document.documentElement.clientHeight;
      
      console.log('Scroll debug:', { 
        scrollTop, 
        scrollHeight, 
        clientHeight, 
        threshold: scrollHeight - 1000,
        hasMore, 
        isLoadingMore, 
        activeTab 
      });
      
      if (scrollTop + clientHeight >= scrollHeight - 1000) {
        if (hasMore && !isLoadingMore) {
          console.log('🔄 Triggering infinite scroll for', activeTab);
          loadMoreContent();
        }
      }
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, [hasMore, isLoadingMore, activeTab, page]);

  // Close context menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (showContextMenu) {
        setShowContextMenu(false);
      }
    };

    if (showContextMenu) {
      document.addEventListener('click', handleClickOutside);
      return () => document.removeEventListener('click', handleClickOutside);
    }
  }, [showContextMenu]);

  const loadProfile = async () => {
    try {
      setIsLoading(true);
      const profileData = await socialService.getUserProfile(userId);
      setProfile(profileData);
    } catch (error) {
      console.error('Error loading profile:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const loadPosts = async (reset = false) => {
    if ((isLoading || isLoadingMore) && !reset) return;

    try {
      if (reset) {
        setIsLoading(true);
        setPage(1);
        setPosts([]);
        console.log(`🔄 Initial load - Posts for user: ${userId}`);
      } else {
        setIsLoadingMore(true);
        console.log(`📚 Infinite scroll loading - Page: ${page}`);
      }

      const batchSize = reset ? 15 : 10;
      const postsData = await socialService.getPosts({ 
        userId, 
        page: reset ? 1 : page,
        limit: batchSize
      });
      
      if (reset) {
        setPosts(postsData.posts);
        setPage(2);
      } else {
        setPosts(prev => {
          const existingIds = new Set(prev.map(p => p.id));
          const uniqueNewPosts = postsData.posts.filter(p => !existingIds.has(p.id));
          return [...prev, ...uniqueNewPosts];
        });
        setPage(prev => prev + 1);
      }
      
      setHasMore(postsData.hasMore || false);
      
      if (!postsData.hasMore) {
        console.log('📄 End of posts reached - no more posts to load');
      }
    } catch (error) {
      console.error('❌ Failed to load posts:', error);
    } finally {
      setIsLoading(false);
      setIsLoadingMore(false);
    }
  };

  const loadReposts = async (reset = false) => {
    try {
      if (reset) {
        setReposts([]);
        setHasMore(true);
        console.log(`🔄 Initial load - Reposts for user: ${userId}`);
      } else {
        setIsLoadingMore(true);
        console.log(`📚 Infinite scroll loading reposts - Page: ${Math.ceil(reposts.length / 10) + 1}`);
      }

      const repostData = await repostService.getUserReposts(userId, reset ? 1 : Math.ceil(reposts.length / 10) + 1, 10);
      
      if (reset) {
        setReposts(repostData.reposts);
      } else {
        setReposts(prev => {
          const existingIds = new Set(prev.map(r => r.id));
          const uniqueNewReposts = repostData.reposts.filter(r => !existingIds.has(r.id));
          return [...prev, ...uniqueNewReposts];
        });
      }
      
      // Set hasMore based on whether we got a full page
      setHasMore(repostData.hasMore || repostData.reposts.length >= 10);
      
      console.log(`📊 Loaded ${repostData.reposts.length} reposts for user ${userId}, hasMore: ${repostData.hasMore || repostData.reposts.length >= 10}`);
    } catch (error) {
      console.error('❌ Failed to load reposts:', error);
    } finally {
      setIsLoadingMore(false);
    }
  };

  // Separate function for infinite scroll loading (copied from SocialFeed pattern)
  const loadMoreContent = async () => {
    if (!hasMore || isLoading || isLoadingMore) return;
    
    console.log('🔄 Infinite scroll: Loading next batch...');
    if (activeTab === 'posts') {
      await loadPosts(false);
    } else if (activeTab === 'reposts') {
      await loadReposts(false);
    }
  };

  const loadKidAccounts = async () => {
    try {
      const accounts = await socialService.getKidAccounts();
      setKidAccounts(accounts);
      console.log('Loaded kid accounts:', accounts);
    } catch (error) {
      console.error('Failed to load kid accounts:', error);
    }
  };

  const checkFollowStatus = async () => {
    console.log('checkFollowStatus called:', { userId, isOwnProfile, currentUserId });
    if (!currentUserId || isOwnProfile) {
      console.log('Skipping follow status check - own profile or no currentUserId');
      return;
    }
    
    try {
      const following = await socialService.getFollowing(currentUserId);
      console.log('Following data:', following);
      const isCurrentlyFollowing = following.following.some(f => f.following?.id === userId);
      console.log('Is currently following:', isCurrentlyFollowing);
      setIsFollowing(isCurrentlyFollowing);
    } catch (error) {
      console.error('Failed to check follow status:', error);
    }
  };

  const loadLinkedAccount = async () => {
    // Mock linked account for demonstration
    // In real implementation, this would come from the profile data
    setLinkedAccount(null);
  };

  const getAccountTypeIcon = () => {
    if (profile?.isKidAccount) return <Shield className="w-4 h-4" />;
    // For now, we'll use User icon for all other account types
    // TODO: Add accountType property to UserProfile interface for business/educational
    return <User className="w-4 h-4" />;
  };

  const getAccountTypeBadge = () => {
    if (profile?.isKidAccount) {
      return <span className="bg-pink-100 text-pink-800 text-xs px-2 py-1 rounded-full flex items-center gap-1">
        <Shield className="w-3 h-3" /> Kid Account
      </span>;
    }
    if (profile?.isVerified) {
      return <span className="bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded-full flex items-center gap-1">
        <CheckCircle className="w-3 h-3" /> Verified
      </span>;
    }
    return <span className="bg-gray-100 text-gray-800 text-xs px-2 py-1 rounded-full flex items-center gap-1">
      <User className="w-3 h-3" /> Personal
    </span>;
  };

  if (isLoading) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-6">
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div>
        </div>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-6">
        <div className="text-center py-12">
          <p className="text-gray-500">Profile not found</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-6">
        
        {/* ROW 1: PROFESSIONAL PROFILE HEADER */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 mb-6">
          <div className="grid grid-cols-4 gap-4 items-start">
            
            {/* COLUMN 1: Profile Picture Section */}
            <div className="flex flex-col items-center">
              <div className="relative">
                <div className="w-20 h-20 rounded-full border-4 border-white shadow-lg overflow-hidden bg-gradient-to-br from-purple-500 to-indigo-600">
                  {(profile.avatar || profile.profilePictureUrl) ? (
                    <img 
                      src={profile.avatar || profile.profilePictureUrl} 
                      alt={profile.displayName}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full bg-gradient-to-br from-purple-500 to-indigo-600 flex items-center justify-center">
                      <span className="text-xl text-white font-bold">
                        {profile.displayName?.charAt(0)?.toUpperCase() || 'U'}
                      </span>
                    </div>
                  )}
                </div>
                
                {isOwnProfile && (
                  <button
                    onClick={() => setShowAvatarUpload(true)}
                    className="absolute -bottom-1 -right-1 bg-white text-purple-600 p-2 rounded-full shadow-lg hover:bg-purple-50 transition-colors border border-gray-200"
                    title="Change Profile Picture"
                  >
                    <Camera className="w-4 h-4" />
                  </button>
                )}
              </div>
              
              {/* Online Status */}
              <div className="flex items-center mt-2 text-xs text-gray-500">
                <div className="w-2 h-2 bg-green-400 rounded-full mr-1"></div>
                Online
              </div>
            </div>

            {/* COLUMN 2: General Information */}
            <div className="col-span-1">
              <div className="space-y-1">
                {/* Full Name */}
                <h1 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                  {profile.displayName || 'Unknown User'}
                  {profile.isVerified && (
                    <div title="Verified Account">
                      <CheckCircle className="w-4 h-4 text-blue-500" />
                    </div>
                  )}
                </h1>
                
                {/* Username with Message Icon */}
                <div className="flex items-center gap-2">
                  <p className="text-gray-500 text-sm">@{profile.username || 'unknown'}</p>
                  {!isOwnProfile && (
                    <button 
                      className="p-1 text-gray-400 hover:text-purple-600 hover:bg-purple-50 rounded-full transition-colors"
                      title="Send Message"
                    >
                      <MessageCircle className="w-4 h-4" />
                    </button>
                  )}
                </div>
                
                {/* Account Type Badge */}
                <div className="flex items-center gap-2">
                  {getAccountTypeBadge()}
                </div>
                
                {/* Bio */}
                {profile.bio && (
                  <p className="text-gray-700 text-xs leading-relaxed mt-2 max-w-sm line-clamp-2">
                    {profile.bio}
                  </p>
                )}
                
                {/* Additional Info */}
                <div className="flex flex-wrap items-center gap-2 text-xs text-gray-500 mt-2">
                  {profile.location && (
                    <div className="flex items-center gap-1">
                      <MapPin className="w-4 h-4" />
                      {profile.location}
                    </div>
                  )}
                  <div className="flex items-center gap-1">
                    <Calendar className="w-4 h-4" />
                    Joined {new Date(profile.createdAt || '').toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
                  </div>
                  {profile.website && (
                    <div className="flex items-center gap-1">
                      <LinkIcon className="w-4 h-4" />
                      <a href={profile.website} target="_blank" rel="noopener noreferrer" className="text-purple-600 hover:underline">
                        Website
                      </a>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* COLUMN 3: Statistics & Actions */}
            <div className="flex flex-col items-center">
              {/* Statistics */}
              <div className="flex gap-4 mb-3">
                <div className="text-center">
                  <div className="text-lg font-bold text-gray-900">{profile.followersCount || 0}</div>
                  <div className="text-xs text-gray-500">Followers</div>
                </div>
                <div className="text-center">
                  <div className="text-lg font-bold text-gray-900">{profile.postsCount || 0}</div>
                  <div className="text-xs text-gray-500">Posts</div>
                </div>
              </div>

              {/* Action Buttons (Under Statistics) */}
              <div className="flex flex-col gap-2 w-full">
                {!isOwnProfile ? (
                  <div className="flex items-center gap-2">
                    <FollowButton
                      userId={userId}
                      currentUserId={currentUserId}
                      initialFollowing={isFollowing}
                      onFollowChange={setIsFollowing}
                      size="sm"
                      variant="primary"
                      className="flex-1"
                    />
                    <div className="relative">
                      <button 
                        onClick={() => setShowContextMenu(!showContextMenu)}
                        className="p-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                        title="More Options"
                      >
                        <MoreHorizontal className="w-4 h-4" />
                      </button>
                      
                      {/* Context Menu */}
                      {showContextMenu && (
                        <div className="absolute right-0 top-full mt-1 w-48 bg-white border border-gray-200 rounded-lg shadow-lg z-50">
                          <div className="py-1">
                            <button
                              onClick={() => {
                                setShowReportModal(true);
                                setShowContextMenu(false);
                              }}
                              className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 flex items-center gap-2"
                            >
                              <AlertTriangle className="w-4 h-4 text-red-500" />
                              Report User
                            </button>
                            <button
                              onClick={() => {
                                console.log('🚫 Blocking user:', userId);
                                setShowContextMenu(false);
                                // TODO: Implement block functionality
                                alert('Block functionality coming soon!');
                              }}
                              className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 flex items-center gap-2"
                            >
                              <XCircle className="w-4 h-4 text-red-500" />
                              Block User
                            </button>
                            <button
                              onClick={() => {
                                console.log('🔇 Muting user:', userId);
                                setShowContextMenu(false);
                                // TODO: Implement mute functionality
                                alert('Mute functionality coming soon!');
                              }}
                              className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 flex items-center gap-2"
                            >
                              <Eye className="w-4 h-4 text-orange-500" />
                              Mute User
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                ) : (
                  <>
                    <button 
                      onClick={() => setIsEditing(true)}
                      className="flex items-center justify-center gap-1 px-3 py-1.5 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors text-sm"
                    >
                      <Settings className="w-3 h-3" />
                      Edit Profile
                    </button>
                    {/* TODO: Add Analytics button when accountType is available */}
                    {profile.isVerified && (
                      <button className="flex items-center justify-center gap-1 px-3 py-1.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm">
                        <BarChart3 className="w-3 h-3" />
                        Analytics
                      </button>
                    )}
                  </>
                )}
              </div>
            </div>

            {/* COLUMN 4: Linked Account (Highlighted) */}
            <div className="bg-gradient-to-br from-purple-50 to-indigo-50 border-2 border-purple-200 rounded-lg p-3 flex flex-col justify-center">
              
              {linkedAccount ? (
                <div className="text-center">
                  <div className="w-20 h-20 rounded-full border-2 border-purple-300 overflow-hidden bg-gradient-to-br from-purple-400 to-indigo-500 mx-auto mb-2">
                    {linkedAccount.avatar ? (
                      <img 
                        src={linkedAccount.avatar} 
                        alt={linkedAccount.displayName}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-white text-xl font-bold">
                        {linkedAccount.displayName?.charAt(0)?.toUpperCase()}
                      </div>
                    )}
                  </div>
                  <p className="text-sm font-medium text-gray-900">{linkedAccount.displayName}</p>
                  <p className="text-xs text-gray-500 mb-3">@{linkedAccount.username}</p>
                  <button className="text-xs bg-purple-600 text-white px-3 py-1 rounded-full hover:bg-purple-700 transition-colors">
                    Visit Profile
                  </button>
                </div>
              ) : (
                <div className="text-center">
                  <div className="w-20 h-20 rounded-full border-2 border-dashed border-purple-300 bg-purple-50 mx-auto mb-2 flex items-center justify-center">
                    <Plus className="w-6 h-6 text-purple-400" />
                  </div>
                  <p className="text-xs text-gray-600 mb-2">No Linked Account</p>
                  <button className="text-xs bg-purple-100 text-purple-700 px-3 py-1 rounded-full hover:bg-purple-200 transition-colors">
                    Select User
                  </button>
                  
                </div>
              )}
            </div>
          </div>
        </div>

        {/* ROW 2: Navigation Tabs */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 mb-6">
          <div className="border-b border-gray-200">
            <nav className="flex space-x-8 px-6">
              {[
                { id: 'posts', label: 'Posts', icon: FileText, count: profile.postsCount },
                { id: 'reposts', label: 'Reposts', icon: Repeat, count: reposts.length },
                { id: 'media', label: 'Media', icon: FileText, count: 0 },
                { id: 'chat', label: 'Chat', icon: MessageCircle, count: 0 },
                ...(isOwnProfile ? [{ id: 'kids', label: 'Kids', icon: Users, count: kidAccounts.length }] : []),
                ...(profile?.isVerified ? [{ id: 'business', label: 'Business', icon: Building, count: 0 }] : [])
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as any)}
                  className={`py-4 px-2 border-b-2 font-medium text-sm flex items-center gap-2 transition-colors ${
                    activeTab === tab.id
                      ? 'border-purple-500 text-purple-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  <tab.icon className="w-4 h-4" />
                  {tab.label}
                  {tab.count > 0 && (
                    <span className="bg-gray-100 text-gray-600 text-xs px-2 py-1 rounded-full">
                      {tab.count}
                    </span>
                  )}
                </button>
              ))}
            </nav>
          </div>
        </div>

        {/* ROW 3: Full-Width Content Area */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            {activeTab === 'posts' && (
              <div className="space-y-6">
                {posts.length > 0 ? (
                  posts.map((post) => (
                    <div key={post.id} className="border border-gray-200 rounded-lg p-6 hover:shadow-md transition-shadow">
                      <div className="flex items-start space-x-4">
                        <div className="w-12 h-12 rounded-full bg-gradient-to-br from-purple-500 to-indigo-600 flex items-center justify-center text-white font-bold">
                          {profile.displayName?.charAt(0)?.toUpperCase()}
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <h3 className="font-semibold text-gray-900">{profile.displayName}</h3>
                            <span className="text-gray-500 text-sm">@{profile.username}</span>
                            <span className="text-gray-500 text-sm">·</span>
                            <span className="text-gray-500 text-sm">
                              {new Date(post.createdAt).toLocaleDateString()}
                            </span>
                          </div>
                          <p className="text-gray-800 mb-4">{post.content}</p>
                          
                          {/* Post Actions */}
                          <div className="flex items-center space-x-6 text-gray-500">
                            <button className="flex items-center gap-1 hover:text-red-500 transition-colors">
                              <Heart className="w-4 h-4" />
                              <span className="text-sm">{post.likesCount || 0}</span>
                            </button>
                            <button className="flex items-center gap-1 hover:text-blue-500 transition-colors">
                              <MessageSquare className="w-4 h-4" />
                              <span className="text-sm">{post.commentsCount || 0}</span>
                            </button>
                            <button className="flex items-center gap-1 hover:text-green-500 transition-colors">
                              <Repeat className="w-4 h-4" />
                              <span className="text-sm">{post.repostsCount || 0}</span>
                            </button>
                            <button className="flex items-center gap-1 hover:text-purple-500 transition-colors">
                              <Share className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-12">
                    <FileText className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 mb-2">No posts yet</h3>
                    <p className="text-gray-500">
                      {isOwnProfile ? "Share your first post to get started!" : "This user hasn't posted anything yet."}
                    </p>
                  </div>
                )}
              </div>
            )}

            {activeTab === 'reposts' && (
              <div className="space-y-6">
                {reposts.length > 0 ? (
                  reposts.map((repost) => (
                    <RepostCard
                      key={repost.id}
                      repost={repost}
                      currentUserId={currentUserId}
                      onLike={async (repostId) => {
                        try {
                          console.log('❤️ Liking repost:', repostId);
                          // The RepostCard handles the actual like/unlike logic internally
                        } catch (error) {
                          console.error('Failed to like repost:', error);
                        }
                      }}
                      onComment={(repostId) => {
                        console.log('💬 Opening comments for repost:', repostId);
                        // TODO: Navigate to repost detail page or open comment modal
                        // For now, we could navigate to the original post
                        const repost = reposts.find(r => r.repostId === repostId);
                        if (repost?.originalPostSnapshot?.postId) {
                          window.open(`/post/${repost.originalPostSnapshot.postId}`, '_blank');
                        }
                      }}
                      onShare={async (repostId) => {
                        try {
                          console.log('🔄 Sharing repost:', repostId);
                          // Copy repost link to clipboard
                          const repostUrl = `${window.location.origin}/repost/${repostId}`;
                          await navigator.clipboard.writeText(repostUrl);
                          // Show success message (you could add a toast notification here)
                          alert('Repost link copied to clipboard!');
                        } catch (error) {
                          console.error('Failed to share repost:', error);
                          // Fallback for older browsers
                          const repostUrl = `${window.location.origin}/repost/${repostId}`;
                          prompt('Copy this link to share the repost:', repostUrl);
                        }
                      }}
                      onDelete={async (repostId) => {
                        try {
                          console.log('🗑️ Deleting repost:', repostId);
                          await repostService.deleteRepost(repostId);
                          // Remove from local state
                          setReposts(prev => prev.filter(r => r.repostId !== repostId));
                        } catch (error) {
                          console.error('Failed to delete repost:', error);
                        }
                      }}
                    />
                  ))
                ) : (
                  <div className="text-center py-12">
                    <Repeat className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 mb-2">No reposts yet</h3>
                    <p className="text-gray-500">
                      {isOwnProfile ? "Repost content to share with your followers!" : "This user hasn't reposted anything yet."}
                    </p>
                  </div>
                )}
              </div>
            )}

            {activeTab === 'kids' && isOwnProfile && (
              <div className="space-y-6">
                {kidAccounts.length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {kidAccounts.map((kidAccount) => (
                      <div key={kidAccount.id} className="bg-gradient-to-br from-blue-50 to-purple-50 border-2 border-blue-200 rounded-lg p-6">
                        <div className="flex items-center gap-3 mb-4">
                          <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
                            <span className="text-white font-bold text-lg">
                              {kidAccount.firstName?.charAt(0)?.toUpperCase() || 'K'}
                            </span>
                          </div>
                          <div>
                            <h3 className="font-semibold text-gray-900">{kidAccount.fullName || `${kidAccount.firstName} ${kidAccount.lastName}`}</h3>
                            <p className="text-sm text-gray-600">Kid Account</p>
                          </div>
                        </div>
                        <div className="space-y-2 text-sm">
                          <div className="flex items-center gap-2">
                            <Shield className="w-4 h-4 text-blue-600" />
                            <span className="text-gray-700">Status: {kidAccount.status || 'Active'}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <Calendar className="w-4 h-4 text-purple-600" />
                            <span className="text-gray-700">Created: {new Date(kidAccount.createdAt).toLocaleDateString()}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <Users className="w-4 h-4 text-green-600" />
                            <span className="text-gray-700">Parent: {kidAccount.parentFullName}</span>
                          </div>
                          {kidAccount.independenceDate && (
                            <div className="flex items-center gap-2">
                              <Calendar className="w-4 h-4 text-orange-600" />
                              <span className="text-gray-700">Independence: {new Date(kidAccount.independenceDate).toLocaleDateString()}</span>
                            </div>
                          )}
                        </div>
                        <div className="mt-4 flex gap-2">
                          <button 
                            onClick={() => {
                              console.log('🛠️ Managing kid account:', kidAccount.id);
                              navigate('/parent-dashboard');
                            }}
                            className="flex-1 bg-blue-600 text-white px-3 py-2 rounded-lg text-sm hover:bg-blue-700 transition-colors"
                          >
                            Manage
                          </button>
                          <button 
                            onClick={() => {
                              console.log('👀 Viewing kid profile:', kidAccount.id);
                              // TODO: Navigate to kid account profile page
                              // For now, we could try to navigate to their profile if they have a user account
                              const kidUserId = kidAccount.id; // This might need to be mapped to actual user ID
                              window.open(`/profile/${kidUserId}`, '_blank');
                            }}
                            className="flex-1 bg-gray-100 text-gray-700 px-3 py-2 rounded-lg text-sm hover:bg-gray-200 transition-colors"
                          >
                            View Profile
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-12">
                    <Users className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 mb-2">No Kid Accounts</h3>
                    <p className="text-gray-500 mb-4">Create and manage kid accounts for your family</p>
                    <button className="bg-purple-600 text-white px-6 py-2 rounded-lg hover:bg-purple-700 transition-colors">
                      Add Kid Account
                    </button>
                  </div>
                )}
              </div>
            )}

            {activeTab === 'business' && profile?.isVerified && (
              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  <div className="bg-blue-50 rounded-lg p-6">
                    <h3 className="font-semibold text-blue-900 mb-2">Business Hours</h3>
                    <p className="text-blue-700 text-sm">Mon-Fri: 9:00 AM - 6:00 PM</p>
                  </div>
                  <div className="bg-green-50 rounded-lg p-6">
                    <h3 className="font-semibold text-green-900 mb-2">Services</h3>
                    <p className="text-green-700 text-sm">Digital Marketing, Web Development</p>
                  </div>
                  <div className="bg-purple-50 rounded-lg p-6">
                    <h3 className="font-semibold text-purple-900 mb-2">Contact</h3>
                    <p className="text-purple-700 text-sm">business@company.com</p>
                  </div>
                </div>
              </div>
            )}

            {/* Loading indicator for infinite scroll */}
            {isLoadingMore && (
              <div className="flex justify-center items-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600"></div>
                <span className="ml-2 text-gray-500">Loading more...</span>
              </div>
            )}
        </div>

        {/* Modals */}
        {showReportModal && (
          <ReportUserModal
            isOpen={showReportModal}
            userId={userId}
            userName={profile.displayName || profile.username || 'Unknown User'}
            onClose={() => setShowReportModal(false)}
          />
        )}
    </div>
  );
};

export default UserProfileProfessional;
