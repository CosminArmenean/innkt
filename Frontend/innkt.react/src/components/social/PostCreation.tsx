import React, { useState, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../../contexts/AuthContext';
import { socialService, Post, Group, PostLocation } from '../../services/social.service';

interface PostCreationProps {
  onPostCreated?: (post: Post) => void;
  groupId?: string;
  replyToPostId?: string;
}

const PostCreation: React.FC<PostCreationProps> = ({ 
  onPostCreated, 
  groupId, 
  replyToPostId 
}) => {
  const { t } = useTranslation();
  const { user } = useAuth();
  const [content, setContent] = useState('');
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [postType, setPostType] = useState<'text' | 'image' | 'video' | 'link' | 'poll'>('text');
  const [visibility, setVisibility] = useState<'public' | 'friends' | 'group' | 'private'>('public');
  const [tags, setTags] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState('');
  const [location, setLocation] = useState<PostLocation | null>(null);
  const [showLocationSelector, setShowLocationSelector] = useState(false);
  const [locationSearch, setLocationSearch] = useState('');
  const [suggestedLocations, setSuggestedLocations] = useState<PostLocation[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<{[key: number]: number}>({});
  const [showAdvancedOptions, setShowAdvancedOptions] = useState(false);
  const [selectedGroup, setSelectedGroup] = useState<Group | null>(null);
  const [availableGroups, setAvailableGroups] = useState<Group[]>([]);
  const [showGroupSelector, setShowGroupSelector] = useState(false);
  const [useAIProcessing, setUseAIProcessing] = useState(false);
  const [aiProcessingStatus, setAiProcessingStatus] = useState<'idle' | 'processing' | 'completed' | 'error'>('idle');
  const [showPollCreation, setShowPollCreation] = useState(false);
  const [pollOptions, setPollOptions] = useState<string[]>(['', '']);
  const [pollDuration, setPollDuration] = useState<number>(24); // hours
  // Blockchain feature disabled for now
  // const [blockchainEnabled, setBlockchainEnabled] = useState(false);
  // const [blockchainNetwork, setBlockchainNetwork] = useState<'hashgraph' | 'ethereum' | 'polygon'>('hashgraph');
  const [imageProcessingOptions, setImageProcessingOptions] = useState({
    removeBackground: false,
    enhanceQuality: false,
    addFilters: false
  });
  const [isDragOver, setIsDragOver] = useState(false);
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Load available groups when component mounts
  React.useEffect(() => {
    if (groupId) {
      loadGroup();
    } else {
      loadAvailableGroups();
    }
  }, [groupId]);

  const loadGroup = async () => {
    if (!groupId) return;
    
    try {
      const group = await socialService.getGroup(groupId);
      setSelectedGroup(group);
      setVisibility('group');
    } catch (error) {
      console.error('Failed to load group:', error);
    }
  };

  const loadAvailableGroups = async () => {
    try {
      const response = await socialService.getGroups({ limit: 50 });
      setAvailableGroups(response.groups);
    } catch (error) {
      console.error('Failed to load groups:', error);
    }
  };

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || []);
    
    // Validate file sizes and types
    const validFiles = files.filter(file => {
      const maxSize = file.type.startsWith('video/') ? 100 * 1024 * 1024 : 10 * 1024 * 1024; // 100MB for video, 10MB for images
      if (file.size > maxSize) {
        alert(t('social.postCreation.fileTooLarge', { name: file.name, size: maxSize / (1024 * 1024) }));
        return false;
      }
      return true;
    });
    
    setSelectedFiles(prev => [...prev, ...validFiles]);
    
    // Auto-set post type based on file type
    if (validFiles.some(file => file.type.startsWith('image/'))) {
      setPostType('image');
    } else if (validFiles.some(file => file.type.startsWith('video/'))) {
      setPostType('video');
    }
    
    // Reset file input
    if (event.target) {
      event.target.value = '';
    }
  };

  const removeFile = (index: number) => {
    setSelectedFiles(prev => prev.filter((_, i) => i !== index));
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    
    const files = Array.from(e.dataTransfer.files);
    if (files.length > 0) {
      // Use the same validation logic as file input
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
    }
  };

  const handleTagInput = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (event.key === 'Enter' && tagInput.trim()) {
      event.preventDefault();
      if (!tags.includes(tagInput.trim()) && tags.length < 10) {
        setTags(prev => [...prev, tagInput.trim()]);
        setTagInput('');
      }
    }
  };

  const removeTag = (tagToRemove: string) => {
    setTags(prev => prev.filter(tag => tag !== tagToRemove));
  };

  // Location handling
  const handleLocationSearch = async (query: string) => {
    setLocationSearch(query);
    if (query.length < 2) {
      setSuggestedLocations([]);
      return;
    }

    // Mock location suggestions - in real app, this would call a location API
    const mockLocations: PostLocation[] = [
      { 
        name: `${query}, New York, NY`, 
        coordinates: { latitude: 40.7128, longitude: -74.0060 }
      },
      { 
        name: `${query}, Los Angeles, CA`, 
        coordinates: { latitude: 34.0522, longitude: -118.2437 }
      },
      { 
        name: `${query}, Chicago, IL`, 
        coordinates: { latitude: 41.8781, longitude: -87.6298 }
      },
      { 
        name: `${query}, Houston, TX`, 
        coordinates: { latitude: 29.7604, longitude: -95.3698 }
      },
      { 
        name: `${query}, Phoenix, AZ`, 
        coordinates: { latitude: 33.4484, longitude: -112.0740 }
      }
    ];
    
    setSuggestedLocations(mockLocations);
  };

  const selectLocation = (selectedLocation: PostLocation) => {
    setLocation(selectedLocation);
    setShowLocationSelector(false);
    setLocationSearch('');
    setSuggestedLocations([]);
  };

  const removeLocation = () => {
    setLocation(null);
  };

  // Poll handling
  const addPollOption = () => {
    if (pollOptions.length < 6) {
      setPollOptions([...pollOptions, '']);
    }
  };

  const updatePollOption = (index: number, value: string) => {
    const newOptions = [...pollOptions];
    newOptions[index] = value;
    setPollOptions(newOptions);
  };

  const removePollOption = (index: number) => {
    if (pollOptions.length > 2) {
      setPollOptions(pollOptions.filter((_, i) => i !== index));
    }
  };

  const handlePollTypeSelect = () => {
    setPostType('poll');
    setShowPollCreation(true);
  };

  const handleSubmit = async () => {
    if (!content.trim() && selectedFiles.length === 0) {
      alert('Please add some content or media to your post');
      return;
    }

    setIsLoading(true);
    
    try {
      // Create the post
      const postData: any = {
        Content: content.trim(),
        MediaUrls: [], // Will be populated after upload
        Hashtags: tags,
        Mentions: [], // TODO: Extract mentions from content
        Location: location || null,
        IsPublic: visibility === 'public',
        PostType: postType,
        // Poll data
        ...(postType === 'poll' && {
          PollOptions: pollOptions.filter(opt => opt.trim()),
          PollDuration: pollDuration
        })
      };

      const newPost = await socialService.createPost(postData);

      // Upload media if any
      if (selectedFiles.length > 0) {
        try {
          // Show upload progress
          setUploadProgress({});
          const uploadPromises = selectedFiles.map(async (file, index) => {
            // Simulate progress for each file
            for (let progress = 0; progress <= 100; progress += 10) {
              setUploadProgress(prev => ({ ...prev, [index]: progress }));
              await new Promise(resolve => setTimeout(resolve, 100));
            }
          });
          
          await Promise.all(uploadPromises);
          
          // Actually upload the files
          await socialService.uploadPostMedia(newPost.id, selectedFiles);
          
          // Clear progress
          setUploadProgress({});
        } catch (uploadError) {
          console.error('Failed to upload media:', uploadError);
          alert(t('social.postCreation.failedToUploadMedia'));
        }
      }

      // AI Processing if enabled
      if (useAIProcessing) {
        await processPostWithAI(newPost.id);
      }

      // Blockchain integration disabled for now
      // if (blockchainEnabled && newPost.authorProfile?.isVerified) {
      //   await createBlockchainPost(newPost.id);
      // }

      // Reset form
      setContent('');
      setSelectedFiles([]);
      setTags([]);
      setLocation(null);
      setUseAIProcessing(false);
      setShowLocationSelector(false);
      setShowPollCreation(false);
      setPollOptions(['', '']);
      setPollDuration(24);
      setPostType('text');
      // setBlockchainEnabled(false); // Blockchain disabled
      
      // Notify parent component
      if (onPostCreated) {
        onPostCreated(newPost);
      }

    } catch (error) {
      console.error('Failed to create post:', error);
      alert('Failed to create post. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const processPostWithAI = async (postId: string) => {
    setAiProcessingStatus('processing');
    
    try {
      // TODO: Integrate with NeuroSpark AI service
      await new Promise(resolve => setTimeout(resolve, 2000)); // Simulate AI processing
      setAiProcessingStatus('completed');
    } catch (error) {
      console.error('AI processing failed:', error);
      setAiProcessingStatus('error');
    }
  };

  // Blockchain functionality disabled for now
  // const createBlockchainPost = async (postId: string) => {
  //   try {
  //     const result = await socialService.createBlockchainPost(postId, {
  //       network: blockchainNetwork,
  //       metadata: {
  //         timestamp: new Date().toISOString(),
  //         contentHash: btoa(content), // Simple hash for demo
  //         author: 'verified-user'
  //       }
  //     });
  //     
  //     console.log('Blockchain post created:', result);
  //   } catch (error) {
  //     console.error('Failed to create blockchain post:', error);
  //   }
  // };

  const autoResizeTextarea = () => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = textareaRef.current.scrollHeight + 'px';
    }
  };

  const getFilePreview = (file: File) => {
    if (file.type.startsWith('image/')) {
      return URL.createObjectURL(file);
    } else if (file.type.startsWith('video/')) {
      return '🎥';
    } else {
      return '📄';
    }
  };

  return (
    <div className="post-creation-container bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-600 p-6">
      <div className="flex items-start space-x-4">
        {/* User Avatar */}
        {user?.avatar ? (
          <img
            src={user.avatar}
            alt={user.username || 'User'}
            className="w-12 h-12 rounded-full object-cover shadow-lg"
          />
        ) : (
          <div className="w-12 h-12 rounded-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center shadow-lg">
            <span className="text-gray-600 dark:text-white text-lg">
              {(user?.username || 'U').charAt(0).toUpperCase()}
            </span>
          </div>
        )}
        
        <div className="flex-1 space-y-4">
          {/* Post Type Selector */}
          <div className="flex space-x-2">
            {['text', 'image', 'video', 'link', 'poll'].map((type) => (
              <button
                key={type}
                onClick={() => type === 'poll' ? handlePollTypeSelect() : setPostType(type as any)}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 transform hover:scale-105 ${
                  postType === type
                    ? 'bg-purple-600 dark:bg-gradient-to-r dark:from-purple-600 dark:to-purple-700 text-white shadow-lg'
                    : 'bg-gray-100 dark:bg-white dark:bg-opacity-20 text-gray-700 dark:text-purple-200 hover:bg-gray-200 dark:hover:bg-opacity-30 hover:text-gray-900 dark:hover:text-white border border-gray-200 dark:border-white dark:border-opacity-30'
                }`}
              >
                {type === 'text' && '📝'}
                {type === 'image' && '🖼️'}
                {type === 'video' && '🎥'}
                {type === 'link' && '🔗'}
                {type === 'poll' && '📊'}
                {type.charAt(0).toUpperCase() + type.slice(1)}
              </button>
            ))}
          </div>

          {/* Content Input */}
          <div 
            className={`relative ${isDragOver ? 'bg-blue-50 border-2 border-blue-300 border-dashed rounded-lg' : ''}`}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
          >
            <textarea
              ref={textareaRef}
              value={content}
              onChange={(e) => {
                setContent(e.target.value);
                autoResizeTextarea();
              }}
              onInput={autoResizeTextarea}
              placeholder={
                replyToPostId 
                  ? "Write your reply..." 
                  : "What's on your mind?"
              }
              className="w-full bg-gray-50 dark:bg-white dark:bg-opacity-10 border border-gray-200 dark:border-white dark:border-opacity-20 rounded-lg p-4 resize-none focus:ring-2 focus:ring-purple-500 focus:border-transparent text-xl placeholder-gray-400 dark:placeholder-white text-gray-900 dark:text-white min-h-[120px] dark:backdrop-blur-sm"
              rows={4}
            />
            
            {/* Drag and Drop Overlay */}
            {isDragOver && (
              <div className="absolute inset-0 bg-blue-50 bg-opacity-90 flex items-center justify-center rounded-lg">
                <div className="text-center">
                  <div className="text-4xl mb-2">📁</div>
                  <div className="text-blue-600 font-medium">Drop files here to upload</div>
                </div>
              </div>
            )}
          </div>

          {/* Media Preview */}
          {selectedFiles.length > 0 && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                {selectedFiles.map((file, index) => (
                  <div key={index} className="relative group">
                    <div className="aspect-square bg-gray-100 rounded-lg overflow-hidden flex items-center justify-center relative">
                      {file.type.startsWith('image/') ? (
                        <img
                          src={getFilePreview(file)}
                          alt="Preview"
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <span className="text-2xl">{getFilePreview(file)}</span>
                      )}
                      
                      {/* Upload Progress Overlay */}
                      {uploadProgress[index] !== undefined && uploadProgress[index] < 100 && (
                        <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center">
                          <div className="text-white text-center">
                            <div className="w-8 h-8 border-2 border-white border-t-transparent rounded-full animate-spin mx-auto mb-2"></div>
                            <div className="text-sm">{uploadProgress[index]}%</div>
                          </div>
                        </div>
                      )}
                    </div>
                    
                    {/* File Info */}
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
              
              {/* Image Processing Options */}
              {selectedFiles.some(file => file.type.startsWith('image/')) && (
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <h4 className="text-sm font-medium text-blue-800 mb-3">🖼️ Image Processing Options</h4>
                  <div className="space-y-2">
                    <label className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        checked={imageProcessingOptions.removeBackground}
                        onChange={(e) => setImageProcessingOptions(prev => ({
                          ...prev,
                          removeBackground: e.target.checked
                        }))}
                        className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                      />
                      <span className="text-sm text-blue-700">Remove background (AI-powered)</span>
                    </label>
                    <label className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        checked={imageProcessingOptions.enhanceQuality}
                        onChange={(e) => setImageProcessingOptions(prev => ({
                          ...prev,
                          enhanceQuality: e.target.checked
                        }))}
                        className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                      />
                      <span className="text-sm text-blue-700">Enhance image quality</span>
                    </label>
                    <label className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        checked={imageProcessingOptions.addFilters}
                        onChange={(e) => setImageProcessingOptions(prev => ({
                          ...prev,
                          addFilters: e.target.checked
                        }))}
                        className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                      />
                      <span className="text-sm text-blue-700">Apply smart filters</span>
                    </label>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Location Selector */}
          {showLocationSelector && (
            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
              <div className="flex items-center justify-between mb-3">
                <h4 className="text-sm font-medium text-green-800">📍 Add Location</h4>
                <button
                  onClick={() => setShowLocationSelector(false)}
                  className="text-green-600 hover:text-green-800"
                >
                  ✕
                </button>
              </div>
              
              <div className="space-y-3">
                <input
                  type="text"
                  placeholder="Search for a location..."
                  value={locationSearch}
                  onChange={(e) => handleLocationSearch(e.target.value)}
                  className="w-full px-3 py-2 border border-green-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                />
                
                {suggestedLocations.length > 0 && (
                  <div className="space-y-1 max-h-32 overflow-y-auto">
                    {suggestedLocations.map((loc, index) => (
                      <button
                        key={index}
                        onClick={() => selectLocation(loc)}
                        className="w-full text-left px-3 py-2 hover:bg-green-100 rounded text-sm"
                      >
                        {loc.name}
                      </button>
                    ))}
                  </div>
                )}
                
                {location && (
                  <div className="flex items-center justify-between bg-green-100 px-3 py-2 rounded">
                    <span className="text-sm text-green-800">📍 {location.name}</span>
                    <button
                      onClick={removeLocation}
                      className="text-green-600 hover:text-green-800"
                    >
                      Remove
                    </button>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Poll Creation */}
          {showPollCreation && (
            <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
              <div className="flex items-center justify-between mb-3">
                <h4 className="text-sm font-medium text-purple-800">📊 Create Poll</h4>
                <button
                  onClick={() => setShowPollCreation(false)}
                  className="text-purple-600 hover:text-purple-800"
                >
                  ✕
                </button>
              </div>
              
              <div className="space-y-3">
                <div>
                  <label className="block text-sm font-medium text-purple-700 mb-2">
                    Poll Question
                  </label>
                  <input
                    type="text"
                    placeholder="What's your question?"
                    value={content}
                    onChange={(e) => setContent(e.target.value)}
                    className="w-full px-3 py-2 border border-purple-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-purple-700 mb-2">
                    Poll Options
                  </label>
                  <div className="space-y-2">
                    {pollOptions.map((option, index) => (
                      <div key={index} className="flex items-center space-x-2">
                        <input
                          type="text"
                          placeholder={`Option ${index + 1}`}
                          value={option}
                          onChange={(e) => updatePollOption(index, e.target.value)}
                          className="flex-1 px-3 py-2 border border-purple-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                        />
                        {pollOptions.length > 2 && (
                          <button
                            onClick={() => removePollOption(index)}
                            className="text-red-500 hover:text-red-700"
                          >
                            ✕
                          </button>
                        )}
                      </div>
                    ))}
                    
                    {pollOptions.length < 6 && (
                      <button
                        onClick={addPollOption}
                        className="text-purple-600 hover:text-purple-800 text-sm font-medium"
                      >
                        + Add Option
                      </button>
                    )}
                  </div>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-purple-700 mb-2">
                    Poll Duration (hours)
                  </label>
                  <select
                    value={pollDuration}
                    onChange={(e) => setPollDuration(Number(e.target.value))}
                    className="px-3 py-2 border border-purple-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  >
                    <option value={1}>1 hour</option>
                    <option value={6}>6 hours</option>
                    <option value={12}>12 hours</option>
                    <option value={24}>1 day</option>
                    <option value={72}>3 days</option>
                    <option value={168}>1 week</option>
                  </select>
                </div>
              </div>
            </div>
          )}

          {/* Tags */}
          {tags.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {tags.map((tag, index) => (
                <span
                  key={index}
                  className="bg-innkt-light text-innkt-dark px-2 py-1 rounded-full text-sm flex items-center space-x-1"
                >
                  <span>#{tag}</span>
                  <button
                    onClick={() => removeTag(tag)}
                    className="hover:text-red-600"
                  >
                    ×
                  </button>
                </span>
              ))}
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              {/* File Upload */}
              <button
                onClick={() => fileInputRef.current?.click()}
                className="p-3 bg-gray-100 dark:bg-white dark:bg-opacity-10 hover:bg-gray-200 dark:hover:bg-opacity-20 text-gray-500 dark:text-purple-200 hover:text-gray-700 dark:hover:text-white rounded-lg transition-all duration-200 transform hover:scale-105 border border-gray-200 dark:border-white dark:border-opacity-20"
                title="Add media"
              >
                📎
              </button>
              
              {/* Location */}
              <button
                onClick={() => setShowLocationSelector(!showLocationSelector)}
                className={`p-3 rounded-lg transition-all duration-200 transform hover:scale-105 border border-gray-200 dark:border-white dark:border-opacity-20 ${
                  location ? 'bg-purple-600 dark:bg-gradient-to-r dark:from-purple-600 dark:to-purple-700 text-white' : 'bg-gray-100 dark:bg-white dark:bg-opacity-10 hover:bg-gray-200 dark:hover:bg-opacity-20 text-gray-500 dark:text-purple-200 hover:text-gray-700 dark:hover:text-white'
                }`}
                title="Add location"
              >
                📍
              </button>
              
              {/* AI Processing Toggle */}
              <button
                onClick={() => setUseAIProcessing(!useAIProcessing)}
                className={`p-3 rounded-lg transition-all duration-200 transform hover:scale-105 border border-gray-200 dark:border-white dark:border-opacity-20 ${
                  useAIProcessing ? 'bg-purple-600 dark:bg-gradient-to-r dark:from-purple-600 dark:to-purple-700 text-white' : 'bg-gray-100 dark:bg-white dark:bg-opacity-10 hover:bg-gray-200 dark:hover:bg-opacity-20 text-gray-500 dark:text-purple-200 hover:text-gray-700 dark:hover:text-white'
                }`}
                title="AI Processing"
              >
                🤖
              </button>
              
              {/* Blockchain Toggle - Disabled for now */}
              {/* <button
                onClick={() => setBlockchainEnabled(!blockchainEnabled)}
                className={`p-2 transition-colors ${
                  blockchainEnabled ? 'text-innkt-primary' : 'text-gray-500 hover:text-innkt-primary'
                }`}
                title="Blockchain Integration"
              >
                ⛓️
              </button> */}
            </div>

            <button
              onClick={() => setShowAdvancedOptions(!showAdvancedOptions)}
              className="text-sm text-gray-500 dark:text-purple-200 hover:text-gray-700 dark:hover:text-white transition-colors font-medium"
            >
              {showAdvancedOptions ? 'Hide' : 'Advanced'} Options
            </button>
          </div>

          {/* Advanced Options */}
          {showAdvancedOptions && (
            <div className="space-y-4 pt-4 border-t border-gray-200 dark:border-white dark:border-opacity-20">
              {/* Visibility Settings */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-purple-200 mb-2">
                  Post Visibility
                </label>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                  {[
                    { value: 'public', label: '🌍 Public', desc: 'Everyone can see' },
                    { value: 'friends', label: '👥 Friends', desc: 'Friends only' },
                    { value: 'group', label: '👥 Group', desc: 'Group members' },
                    { value: 'private', label: '🔒 Private', desc: 'Only you' }
                  ].map((option) => (
                    <label
                      key={option.value}
                      className={`relative flex flex-col p-3 border rounded-lg cursor-pointer transition-colors ${
                        visibility === option.value
                          ? 'border-innkt-primary bg-innkt-primary bg-opacity-10'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      <input
                        type="radio"
                        name="visibility"
                        value={option.value}
                        checked={visibility === option.value}
                        onChange={(e) => setVisibility(e.target.value as any)}
                        className="sr-only"
                      />
                      <span className="text-sm font-medium text-gray-900">
                        {option.label}
                      </span>
                      <span className="text-xs text-gray-500 mt-1">
                        {option.desc}
                      </span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Group Selection */}
              {visibility === 'group' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Select Group
                  </label>
                  <button
                    onClick={() => setShowGroupSelector(true)}
                    className="w-full text-left p-3 border border-gray-300 rounded-lg hover:border-gray-400 focus:outline-none focus:ring-2 focus:ring-innkt-primary"
                  >
                    {selectedGroup ? selectedGroup.name : 'Choose a group...'}
                  </button>
                </div>
              )}

              {/* Tags Input */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Tags (press Enter to add)
                </label>
                <input
                  type="text"
                  value={tagInput}
                  onChange={(e) => setTagInput(e.target.value)}
                  onKeyDown={handleTagInput}
                  placeholder="Add tags..."
                  className="input-field"
                  maxLength={50}
                />
                <p className="text-xs text-gray-500 mt-1">
                  {tags.length}/10 tags • Press Enter to add
                </p>
              </div>

              {/* AI Processing Options */}
              {useAIProcessing && (
                <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
                  <div className="flex items-center space-x-2 mb-2">
                    <span className="text-blue-600">🤖</span>
                    <span className="text-sm font-medium text-blue-800">AI Processing</span>
                  </div>
                  <p className="text-xs text-blue-700">
                    Your post will be enhanced with AI-powered content analysis, 
                    automatic tagging, and smart categorization.
                  </p>
                  {aiProcessingStatus === 'processing' && (
                    <div className="mt-2 text-xs text-blue-600">
                      Processing with AI... ⏳
                    </div>
                  )}
                  {aiProcessingStatus === 'completed' && (
                    <div className="mt-2 text-xs text-green-600">
                      AI processing completed! ✅
                    </div>
                  )}
                </div>
              )}

              {/* Blockchain Options - Disabled for now */}
              {/* {blockchainEnabled && (
                <div className="p-3 bg-purple-50 border border-purple-200 rounded-lg">
                  <div className="flex items-center space-x-2 mb-2">
                    <span className="text-purple-600">⛓️</span>
                    <span className="text-sm font-medium text-purple-800">Blockchain Integration</span>
                  </div>
                  <div className="space-y-2">
                    <div>
                      <label className="block text-xs font-medium text-purple-700 mb-1">
                        Blockchain Network
                      </label>
                      <select
                        value={blockchainNetwork}
                        onChange={(e) => setBlockchainNetwork(e.target.value as any)}
                        className="w-full text-sm border border-purple-300 rounded px-2 py-1"
                      >
                        <option value="hashgraph">Hedera Hashgraph</option>
                        <option value="ethereum">Ethereum</option>
                        <option value="polygon">Polygon</option>
                      </select>
                    </div>
                    <p className="text-xs text-purple-700">
                      Your post will be permanently recorded on the blockchain for enhanced trust and verification.
                    </p>
                  </div>
                </div>
              )} */}
            </div>
          )}

          {/* Submit Button */}
          <div className="flex justify-end">
            <button
              onClick={handleSubmit}
              disabled={isLoading || (!content.trim() && selectedFiles.length === 0)}
              className="bg-purple-600 dark:bg-gradient-to-r dark:from-purple-600 dark:to-purple-700 hover:bg-purple-700 dark:hover:from-purple-700 dark:hover:to-purple-800 text-white px-8 py-3 rounded-lg font-semibold shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
            >
              {isLoading ? 'Creating...' : replyToPostId ? 'Reply' : 'Post'}
            </button>
          </div>
        </div>
      </div>

      {/* Hidden File Input */}
      <input
        ref={fileInputRef}
        type="file"
        multiple
        accept="image/*,video/*,.pdf,.doc,.docx,.txt"
        onChange={handleFileSelect}
        className="hidden"
      />

      {/* Group Selector Modal */}
      {showGroupSelector && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-card rounded-lg p-6 max-w-md w-full mx-4 max-h-96 overflow-y-auto">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Select Group</h3>
            
            <div className="space-y-2">
              {availableGroups.map((group) => (
                <button
                  key={group.id}
                  onClick={() => {
                    setSelectedGroup(group);
                    setShowGroupSelector(false);
                  }}
                  className="w-full text-left p-3 border border-gray-200 rounded-lg hover:border-gray-300 hover:bg-gray-50"
                >
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 rounded-lg bg-gray-200 flex items-center justify-center">
                      {group.avatar ? (
                        <img 
                          src={group.avatar} 
                          alt={group.name}
                          className="w-full h-full rounded-lg object-cover"
                        />
                      ) : (
                        <span className="text-gray-600">
                          {group.name.charAt(0).toUpperCase()}
                        </span>
                      )}
                    </div>
                    <div>
                      <h4 className="font-medium text-gray-900">{group.name}</h4>
                      <p className="text-sm text-gray-600">{group.memberCount} members</p>
                    </div>
                  </div>
                </button>
              ))}
            </div>
            
            <div className="mt-4 flex justify-end">
              <button
                onClick={() => setShowGroupSelector(false)}
                className="btn-secondary px-4 py-2"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PostCreation;

