import React, { useState, useRef, useEffect } from 'react';
import { socialService, Post, PostLocation } from '../../services/social.service';
import { groupsService, PollResponse, TopicResponse, GroupRoleResponse } from '../../services/groups.service';
import { PhotoIcon, VideoCameraIcon, LinkIcon, ChartBarIcon, MapPinIcon, TagIcon, PlusIcon, UserGroupIcon, UserIcon, ChevronDownIcon } from '@heroicons/react/24/outline';
import GroupPoll from './GroupPoll';

interface GroupPostCreationProps {
  groupId: string;
  groupName: string;
  onPostCreated?: (post: Post) => void;
  onPollCreated?: (poll: PollResponse) => void;
  className?: string;
  selectedTopicId?: string;
  currentUserId?: string;
}

const GroupPostCreation: React.FC<GroupPostCreationProps> = ({
  groupId,
  groupName,
  onPostCreated,
  onPollCreated,
  className = '',
  selectedTopicId,
  currentUserId
}) => {
  const [content, setContent] = useState('');
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [postType, setPostType] = useState<'text' | 'image' | 'video' | 'link' | 'poll'>('text');
  const [tags, setTags] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState('');
  const [location, setLocation] = useState<PostLocation | null>(null);
  const [selectedTopic, setSelectedTopic] = useState<string | null>(selectedTopicId || null);
  const [topics, setTopics] = useState<TopicResponse[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<{[key: number]: number}>({});
  const [showAdvancedOptions, setShowAdvancedOptions] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const [showPollCreation, setShowPollCreation] = useState(false);
  
  // Role-based posting state
  const [availableRoles, setAvailableRoles] = useState<GroupRoleResponse[]>([]);
  const [selectedRole, setSelectedRole] = useState<string | null>(null);
  const [showRoleSelector, setShowRoleSelector] = useState(false);
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    loadTopics();
    loadUserRoles();
  }, [groupId]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (showRoleSelector) {
        const target = event.target as Element;
        if (!target.closest('.role-selector-dropdown')) {
          setShowRoleSelector(false);
        }
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showRoleSelector]);

  const loadTopics = async () => {
    try {
      const topics = await groupsService.getGroupTopics(groupId);
      setTopics(topics);
    } catch (error) {
      console.error('Failed to load topics:', error);
    }
  };

  const loadUserRoles = async () => {
    try {
      console.log('🔍 Loading user roles for group:', groupId);
      const roles = await groupsService.getUserRolesInGroup(groupId);
      console.log('📋 Available roles:', roles);
      setAvailableRoles(roles);
      
      // Auto-select first role if user has roles and none selected
      if (roles.length > 0 && !selectedRole) {
        console.log('🎯 Auto-selecting first available role:', roles[0].name);
        setSelectedRole(roles[0].id);
      }
    } catch (error) {
      console.error('❌ Failed to load user roles:', error);
    }
  };

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || []);

    const validFiles = files.filter(file => {
      const maxSize = file.type.startsWith('video/') ? 100 * 1024 * 1024 : 10 * 1024 * 1024;
      if (file.size > maxSize) {
        alert(`File ${file.name} is too large. Maximum size is ${maxSize / (1024 * 1024)}MB`);
        return false;
      }
      return true;
    });

    setSelectedFiles(prev => [...prev, ...validFiles]);

    if (validFiles.some(file => file.type.startsWith('image/'))) {
      setPostType('image');
    } else if (validFiles.some(file => file.type.startsWith('video/'))) {
      setPostType('video');
    }

    if (event.target) {
      event.target.value = '';
    }
  };

  const removeFile = (index: number) => {
    setSelectedFiles(prev => prev.filter((_, i) => i !== index));
  };

  const getFilePreview = (file: File) => {
    if (file.type.startsWith('image/')) {
      return '🖼️';
    } else if (file.type.startsWith('video/')) {
      return '🎥';
    } else if (file.type.includes('pdf')) {
      return '📄';
    } else if (file.type.includes('word') || file.type.includes('document')) {
      return '📝';
    } else {
      return '📎';
    }
  };

  const handleAddTag = () => {
    if (tagInput.trim() && !tags.includes(tagInput.trim())) {
      setTags(prev => [...prev, tagInput.trim()]);
      setTagInput('');
    }
  };

  const removeTag = (index: number) => {
    setTags(prev => prev.filter((_, i) => i !== index));
  };

  const handleTagInputKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && tagInput.trim()) {
      e.preventDefault();
      if (!tags.includes(tagInput.trim())) {
        setTags(prev => [...prev, tagInput.trim()]);
      }
      setTagInput('');
    }
  };

  const handleSubmit = async () => {
    if (!content.trim() && selectedFiles.length === 0) {
      alert('Please add some content or media to your post');
      return;
    }

    setIsLoading(true);
    
    try {
      // Get selected role info
      const selectedRoleInfo = selectedRole ? availableRoles.find(r => r.id === selectedRole) : null;
      
      // Create the post
      const postData: any = {
        content: content.trim(),
        postType: postType,
        visibility: 'group',
        tags,
        groupId: groupId,
        location: location || undefined,
        topicId: selectedTopic || undefined,
        // Role posting context
        postedAsRoleId: selectedRoleInfo?.id,
        postedAsRoleName: selectedRoleInfo?.name,
        postedAsRoleAlias: selectedRoleInfo?.alias,
        showRealUsername: selectedRoleInfo?.showRealUsername || false,
      };

      let newPost;
      if (selectedTopic) {
        // Create post in topic using Groups service
        console.log('Creating post in topic:', selectedTopic, 'with data:', postData);
        newPost = await groupsService.createTopicPost(groupId, selectedTopic, {
          content: content.trim(),
          hashtags: tags,
          location: location?.name,
          mediaUrls: [], // Will be updated after media upload
          // Role posting context
          postedAsRoleId: selectedRoleInfo?.id,
          postedAsRoleName: selectedRoleInfo?.name,
          postedAsRoleAlias: selectedRoleInfo?.alias,
          showRealUsername: selectedRoleInfo?.showRealUsername || false,
        });
      } else {
        // Create regular group post using Social service
        newPost = await socialService.createPost(postData);
      }

      // Upload media if any
      if (selectedFiles.length > 0) {
        try {
          setUploadProgress({});
          const uploadPromises = selectedFiles.map(async (file, index) => {
            for (let progress = 0; progress <= 100; progress += 10) {
              setUploadProgress(prev => ({ ...prev, [index]: progress }));
              await new Promise(resolve => setTimeout(resolve, 100));
            }
          });

          await Promise.all(uploadPromises);

          await socialService.uploadPostMedia(newPost.id, selectedFiles);

          setUploadProgress({});
        } catch (uploadError) {
          console.error('Failed to upload media:', uploadError);
          alert('Failed to upload some media files. Post created without media.');
        }
      }

      // Reset form
      setContent('');
      setSelectedFiles([]);
      setTags([]);
      setLocation(null);
      setIsExpanded(false);
      setShowAdvancedOptions(false);

      if (onPostCreated) {
        // Enhance the post with role information for immediate UI display
        const enhancedPost = {
          ...newPost,
          // Ensure we have a unique ID for React key prop
          id: newPost.id || `temp-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
          // Ensure we have valid dates
          createdAt: newPost.createdAt || new Date().toISOString(),
          updatedAt: newPost.updatedAt || new Date().toISOString(),
          // Ensure role information is at the post level for immediate display
          postedAsRoleId: selectedRoleInfo?.id,
          postedAsRoleName: selectedRoleInfo?.name,
          postedAsRoleAlias: selectedRoleInfo?.alias,
          showRealUsername: selectedRoleInfo?.showRealUsername || false,
          // If posting as role, modify the author display
          author: selectedRoleInfo ? {
            ...newPost.author,
            // Override author display when posting as role
            displayName: selectedRoleInfo.alias || selectedRoleInfo.name,
            username: selectedRoleInfo.name,
            // Keep original user info for real username display if needed
            originalDisplayName: newPost.author?.displayName,
            originalUsername: newPost.author?.username,
          } : newPost.author
        };
        
        // Debug: Enhanced post for immediate display
        console.log('🎭 Enhanced post for immediate display:', {
          originalPost: newPost,
          selectedRoleInfo,
          enhancedPost
        });
        
        onPostCreated(enhancedPost);
      }
    } catch (error) {
      console.error('Failed to create post:', error);
      alert('Failed to create post. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const autoResizeTextarea = () => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = textareaRef.current.scrollHeight + 'px';
    }
  };

  const currentTopic = topics.find(t => t.id === selectedTopic);

  return (
    <div className={`bg-white border border-gray-200 rounded-lg p-4 ${className}`}>
      {/* Compact Header / Unexpanded State */}
      {!isExpanded && (
        <div 
          className="flex items-center space-x-3 cursor-pointer"
          onClick={() => setIsExpanded(true)}
        >
          <div className="w-10 h-10 rounded-full bg-purple-100 flex items-center justify-center">
            <PlusIcon className="w-6 h-6 text-purple-600" />
          </div>
          <div className="flex-1">
            <p className="font-semibold text-gray-900">
              {currentTopic ? `Create a post in ${currentTopic.name}` : `Create a post in ${groupName}`}
            </p>
            <p className="text-sm text-gray-500">Share what's on your mind with your community...</p>
          </div>
          <div className="flex items-center space-x-2">
            <button
              className="p-2 text-gray-500 hover:text-purple-600 hover:bg-purple-50 rounded-full transition-colors"
              title="Add media"
              onClick={(e) => {
                e.stopPropagation();
                setIsExpanded(true);
                fileInputRef.current?.click();
              }}
            >
              <PhotoIcon className="w-5 h-5" />
            </button>
            <button
              className="p-2 text-gray-500 hover:text-purple-600 hover:bg-purple-50 rounded-full transition-colors"
              title="Create poll"
              onClick={(e) => {
                e.stopPropagation();
                setIsExpanded(true);
                setShowPollCreation(true);
              }}
            >
              <ChartBarIcon className="w-5 h-5" />
            </button>
          </div>
        </div>
      )}

      {/* Expanded State */}
      {isExpanded && (
        <>
          {/* Header */}
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 rounded-full bg-purple-100 flex items-center justify-center">
                <span className="text-purple-600 font-semibold">👥</span>
              </div>
              <div>
                <h3 className="font-medium text-gray-900">
                  {currentTopic ? `Post to ${currentTopic.name}` : `Post to ${groupName}`}
                </h3>
                <p className="text-sm text-gray-500">
                  {currentTopic ? `Share your thoughts in this topic` : `Share something with the group`}
                </p>
              </div>
            </div>
            
            {/* Role Selector - Moved to header */}
            <div className="relative">
              <button
                onClick={() => setShowRoleSelector(!showRoleSelector)}
                className={`flex items-center space-x-2 px-3 py-2 rounded-lg border transition-colors ${
                  selectedRole 
                    ? 'border-purple-300 bg-purple-50 text-purple-700' 
                    : 'border-gray-300 bg-white text-gray-700 hover:border-purple-300 hover:bg-purple-50'
                }`}
                title="Select posting identity"
              >
                <UserGroupIcon className="w-4 h-4" />
                <span className="text-sm font-medium">
                  {selectedRole 
                    ? availableRoles.find(r => r.id === selectedRole)?.name || 'Select Role'
                    : 'Post as yourself'
                  }
                </span>
                <ChevronDownIcon className="w-4 h-4" />
              </button>
              
              {/* Role Dropdown */}
              {showRoleSelector && (
                <div className="role-selector-dropdown absolute right-0 top-full mt-2 w-64 bg-white border border-gray-200 rounded-lg shadow-lg z-10">
                  <div className="p-2">
                    <button
                      onClick={() => {
                        setSelectedRole(null);
                        setShowRoleSelector(false);
                      }}
                      className={`w-full text-left px-3 py-2 rounded-md transition-colors ${
                        !selectedRole 
                          ? 'bg-purple-100 text-purple-700' 
                          : 'bg-white text-gray-700 hover:bg-gray-100'
                      }`}
                    >
                      <div className="flex items-center space-x-2">
                        <UserIcon className="w-4 h-4" />
                        <div>
                          <div className="font-medium">Post as yourself</div>
                          <div className="text-xs text-gray-500">Your personal account</div>
                        </div>
                      </div>
                    </button>
                    
                    {availableRoles.map((role) => (
                      <button
                        key={role.id}
                        onClick={() => {
                          setSelectedRole(role.id);
                          setShowRoleSelector(false);
                        }}
                        className={`w-full text-left px-3 py-2 rounded-md transition-colors ${
                          selectedRole === role.id 
                            ? 'bg-purple-100 text-purple-700' 
                            : 'bg-white text-gray-700 hover:bg-gray-100'
                        }`}
                      >
                        <div className="flex items-center space-x-2">
                          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-purple-500 to-blue-500 flex items-center justify-center text-white text-sm font-semibold">
                            {role.name.charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <div className="font-medium">{role.name}</div>
                            <div className="text-xs text-gray-500">{role.alias || role.name}</div>
                          </div>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>

      {/* Content Input */}
      <div className="mb-4 relative">
        <textarea
          ref={textareaRef}
          value={content}
          onChange={(e) => {
            setContent(e.target.value);
            autoResizeTextarea();
          }}
          onInput={autoResizeTextarea}
          placeholder="What's happening in the group?"
          className="w-full border-0 resize-none focus:ring-0 text-lg placeholder-gray-400 min-h-[100px] pr-20"
          rows={3}
        />
        
        {/* Post Button - Inside text area */}
        <div className="absolute bottom-2 right-2">
          <button
            onClick={handleSubmit}
            disabled={isLoading || (!content.trim() && selectedFiles.length === 0)}
            className="bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-sm font-medium"
          >
            {isLoading ? 'Posting...' : 'Post'}
          </button>
        </div>
      </div>

      {/* Media Preview */}
      {selectedFiles.length > 0 && (
        <div className="mb-4">
          <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
            {selectedFiles.map((file, index) => (
              <div key={index} className="relative group">
                <div className="aspect-square bg-gray-100 rounded-lg overflow-hidden flex items-center justify-center relative">
                  {file.type.startsWith('image/') ? (
                    <img
                      src={URL.createObjectURL(file)}
                      alt="Preview"
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <span className="text-2xl">{getFilePreview(file)}</span>
                  )}

                  {uploadProgress[index] !== undefined && uploadProgress[index] < 100 && (
                    <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center">
                      <div className="text-white text-center">
                        <div className="w-8 h-8 border-2 border-white border-t-transparent rounded-full animate-spin mx-auto mb-2"></div>
                        <div className="text-sm">{uploadProgress[index]}%</div>
                      </div>
                    </div>
                  )}
                </div>

                <div className="mt-1 text-xs text-gray-500 truncate">
                  {file.name}
                </div>

                <button
                  onClick={() => removeFile(index)}
                  className="absolute top-1 right-1 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  ×
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Tags */}
      {tags.length > 0 && (
        <div className="mb-4">
          <div className="flex flex-wrap gap-2">
            {tags.map((tag, index) => (
              <span
                key={index}
                className="inline-flex items-center px-3 py-1 bg-purple-100 text-purple-800 text-sm rounded-full"
              >
                #{tag}
                <button
                  onClick={() => removeTag(index)}
                  className="ml-2 text-purple-600 hover:text-purple-800"
                >
                  ×
                </button>
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Advanced Options */}
      {showAdvancedOptions && (
        <div className="mb-4 p-4 bg-gray-50 rounded-lg space-y-4">
          {/* Tags Input */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Tags</label>
            <div className="flex space-x-2">
              <input
                type="text"
                value={tagInput}
                onChange={(e) => setTagInput(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddTag())}
                placeholder="Add a tag..."
                className="flex-1 border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-purple-500"
              />
              <button
                onClick={handleAddTag}
                className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors"
              >
                Add
              </button>
            </div>
          </div>

          {/* Location */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Location (Optional)</label>
            <input
              type="text"
              placeholder="Where are you posting from?"
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-purple-500"
            />
          </div>
        </div>
      )}

      {/* Action Bar */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          {/* Media Upload */}
          <button
            onClick={() => fileInputRef.current?.click()}
            className="p-2 text-gray-500 hover:text-purple-600 hover:bg-purple-50 rounded-full transition-colors"
            title="Add media"
          >
            <PhotoIcon className="w-5 h-5" />
          </button>

          {/* Video Upload */}
          <button
            onClick={() => fileInputRef.current?.click()}
            className="p-2 text-gray-500 hover:text-purple-600 hover:bg-purple-50 rounded-full transition-colors"
            title="Add video"
          >
            <VideoCameraIcon className="w-5 h-5" />
          </button>

          {/* Link */}
          <button
            onClick={() => setPostType('link')}
            className={`p-2 rounded-full transition-colors ${
              postType === 'link' 
                ? 'text-purple-600 bg-purple-50' 
                : 'text-gray-500 hover:text-purple-600 hover:bg-purple-50'
            }`}
            title="Add link"
          >
            <LinkIcon className="w-5 h-5" />
          </button>

          {/* Poll */}
          <button
            onClick={() => setShowPollCreation(!showPollCreation)}
            className={`p-2 rounded-full transition-colors ${
              showPollCreation 
                ? 'text-purple-600 bg-purple-50' 
                : 'text-gray-500 hover:text-purple-600 hover:bg-purple-50'
            }`}
            title="Create poll"
          >
            <ChartBarIcon className="w-5 h-5" />
          </button>


          {/* Advanced Options */}
          <button
            onClick={() => setShowAdvancedOptions(!showAdvancedOptions)}
            className={`p-2 rounded-full transition-colors ${
              showAdvancedOptions 
                ? 'text-purple-600 bg-purple-50' 
                : 'text-gray-500 hover:text-purple-600 hover:bg-purple-50'
            }`}
            title="More options"
          >
            <TagIcon className="w-5 h-5" />
          </button>
        </div>

      </div>

      {/* Hidden File Input */}
      <input
        ref={fileInputRef}
        type="file"
        multiple
        accept="image/*,video/*,.pdf,.doc,.docx"
        onChange={handleFileSelect}
        className="hidden"
      />

      {/* Poll Creation */}
      {showPollCreation && (
        <div className="mt-4">
          <GroupPoll
            groupId={groupId}
            groupName={groupName}
            onPollCreated={(poll) => {
              setShowPollCreation(false);
              if (onPollCreated) {
                onPollCreated(poll);
              }
            }}
          />
        </div>
      )}

      {/* Advanced Options */}
      {showAdvancedOptions && (
        <div className="mt-4 p-4 bg-gray-50 rounded-lg">
          <div className="space-y-4">
            {/* Topic Selection */}
            {topics.length > 0 && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Topic</label>
                <select
                  value={selectedTopic || ''}
                  onChange={(e) => setSelectedTopic(e.target.value || null)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
                >
                  <option value="">No specific topic</option>
                  {topics.map((topic) => (
                    <option key={topic.id} value={topic.id}>
                      {topic.name}
                    </option>
                  ))}
                </select>
              </div>
            )}

            {/* Tag Input */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Tags</label>
              <div className="flex flex-wrap gap-2 mb-2">
                {tags.map((tag, index) => (
                  <span
                    key={index}
                    className="inline-flex items-center px-2 py-1 bg-purple-100 text-purple-800 text-sm rounded-full"
                  >
                    {tag}
                    <button
                      onClick={() => removeTag(index)}
                      className="ml-1 text-purple-600 hover:text-purple-800"
                    >
                      ×
                    </button>
                  </span>
                ))}
              </div>
              <input
                type="text"
                value={tagInput}
                onChange={(e) => setTagInput(e.target.value)}
                onKeyPress={handleTagInputKeyPress}
                placeholder="Add tags..."
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
              />
            </div>
          </div>
        </div>
      )}

        </>
      )}
    </div>
  );
};

export default GroupPostCreation;
