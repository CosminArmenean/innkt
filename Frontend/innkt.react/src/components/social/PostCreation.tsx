import React, { useState, useRef } from 'react';
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
  const [content, setContent] = useState('');
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [postType, setPostType] = useState<'text' | 'image' | 'video' | 'link' | 'poll'>('text');
  const [visibility, setVisibility] = useState<'public' | 'friends' | 'group' | 'private'>('public');
  const [tags, setTags] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState('');
  const [location, setLocation] = useState<PostLocation | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [showAdvancedOptions, setShowAdvancedOptions] = useState(false);
  const [selectedGroup, setSelectedGroup] = useState<Group | null>(null);
  const [availableGroups, setAvailableGroups] = useState<Group[]>([]);
  const [showGroupSelector, setShowGroupSelector] = useState(false);
  const [useAIProcessing, setUseAIProcessing] = useState(false);
  const [aiProcessingStatus, setAiProcessingStatus] = useState<'idle' | 'processing' | 'completed' | 'error'>('idle');
  const [blockchainEnabled, setBlockchainEnabled] = useState(false);
  const [blockchainNetwork, setBlockchainNetwork] = useState<'hashgraph' | 'ethereum' | 'polygon'>('hashgraph');
  
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
    setSelectedFiles(prev => [...prev, ...files]);
    
    // Auto-set post type based on file type
    if (files.some(file => file.type.startsWith('image/'))) {
      setPostType('image');
    } else if (files.some(file => file.type.startsWith('video/'))) {
      setPostType('video');
    }
  };

  const removeFile = (index: number) => {
    setSelectedFiles(prev => prev.filter((_, i) => i !== index));
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

  const handleSubmit = async () => {
    if (!content.trim() && selectedFiles.length === 0) {
      alert('Please add some content or media to your post');
      return;
    }

    setIsLoading(true);
    
    try {
      // Create the post
      const postData: Partial<Post> = {
        content: content.trim(),
        type: postType,
        visibility,
        tags,
        groupId: selectedGroup?.id,
        location: location || undefined,
      };

      const newPost = await socialService.createPost(postData);

      // Upload media if any
      if (selectedFiles.length > 0) {
        await socialService.uploadPostMedia(newPost.id, selectedFiles);
      }

      // AI Processing if enabled
      if (useAIProcessing) {
        await processPostWithAI(newPost.id);
      }

      // Blockchain integration if enabled
      if (blockchainEnabled && newPost.authorProfile.isVerified) {
        await createBlockchainPost(newPost.id);
      }

      // Reset form
      setContent('');
      setSelectedFiles([]);
      setTags([]);
      setLocation(null);
      setUseAIProcessing(false);
      setBlockchainEnabled(false);
      
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

  const createBlockchainPost = async (postId: string) => {
    try {
      const result = await socialService.createBlockchainPost(postId, {
        network: blockchainNetwork,
        metadata: {
          timestamp: new Date().toISOString(),
          contentHash: btoa(content), // Simple hash for demo
          author: 'verified-user'
        }
      });
      
      console.log('Blockchain post created:', result);
    } catch (error) {
      console.error('Failed to create blockchain post:', error);
    }
  };

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
    <div className="card">
      <div className="flex items-start space-x-3">
        {/* User Avatar */}
        <div className="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center">
          <span className="text-gray-600">👤</span>
        </div>
        
        <div className="flex-1 space-y-4">
          {/* Post Type Selector */}
          <div className="flex space-x-2">
            {['text', 'image', 'video', 'link', 'poll'].map((type) => (
              <button
                key={type}
                onClick={() => setPostType(type as any)}
                className={`px-3 py-1 rounded-full text-sm font-medium transition-colors ${
                  postType === type
                    ? 'bg-innkt-primary text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
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
          <div>
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
              className="w-full border-0 resize-none focus:ring-0 text-lg placeholder-gray-400"
              rows={3}
            />
          </div>

          {/* Media Preview */}
          {selectedFiles.length > 0 && (
            <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
              {selectedFiles.map((file, index) => (
                <div key={index} className="relative group">
                  <div className="aspect-square bg-gray-100 rounded-lg overflow-hidden flex items-center justify-center">
                    {file.type.startsWith('image/') ? (
                      <img
                        src={getFilePreview(file)}
                        alt="Preview"
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <span className="text-2xl">{getFilePreview(file)}</span>
                    )}
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
                className="p-2 text-gray-500 hover:text-innkt-primary transition-colors"
                title="Add media"
              >
                📎
              </button>
              
              {/* Location */}
              <button
                onClick={() => setLocation(location ? null : { name: 'Current Location' })}
                className={`p-2 transition-colors ${
                  location ? 'text-innkt-primary' : 'text-gray-500 hover:text-innkt-primary'
                }`}
                title="Add location"
              >
                📍
              </button>
              
              {/* AI Processing Toggle */}
              <button
                onClick={() => setUseAIProcessing(!useAIProcessing)}
                className={`p-2 transition-colors ${
                  useAIProcessing ? 'text-innkt-primary' : 'text-gray-500 hover:text-innkt-primary'
                }`}
                title="AI Processing"
              >
                🤖
              </button>
              
              {/* Blockchain Toggle */}
              <button
                onClick={() => setBlockchainEnabled(!blockchainEnabled)}
                className={`p-2 transition-colors ${
                  blockchainEnabled ? 'text-innkt-primary' : 'text-gray-500 hover:text-innkt-primary'
                }`}
                title="Blockchain Integration"
              >
                ⛓️
              </button>
            </div>

            <button
              onClick={() => setShowAdvancedOptions(!showAdvancedOptions)}
              className="text-sm text-gray-500 hover:text-gray-700"
            >
              {showAdvancedOptions ? 'Hide' : 'Advanced'} Options
            </button>
          </div>

          {/* Advanced Options */}
          {showAdvancedOptions && (
            <div className="space-y-4 pt-4 border-t">
              {/* Visibility Settings */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
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

              {/* Blockchain Options */}
              {blockchainEnabled && (
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
              )}
            </div>
          )}

          {/* Submit Button */}
          <div className="flex justify-end">
            <button
              onClick={handleSubmit}
              disabled={isLoading || (!content.trim() && selectedFiles.length === 0)}
              className="btn-primary px-6 py-2 disabled:opacity-50 disabled:cursor-not-allowed"
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
        accept="image/*,video/*"
        onChange={handleFileSelect}
        className="hidden"
      />

      {/* Group Selector Modal */}
      {showGroupSelector && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4 max-h-96 overflow-y-auto">
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

