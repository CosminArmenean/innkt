import React, { useState, useRef } from 'react';
import { socialService, Post, PostLocation } from '../../services/social.service';
import { PhotoIcon, VideoCameraIcon, LinkIcon, ChartBarIcon, MapPinIcon, TagIcon } from '@heroicons/react/24/outline';
import GroupPoll from './GroupPoll';

interface GroupPostCreationProps {
  groupId: string;
  groupName: string;
  onPostCreated?: (post: Post) => void;
  className?: string;
}

const GroupPostCreation: React.FC<GroupPostCreationProps> = ({
  groupId,
  groupName,
  onPostCreated,
  className = ''
}) => {
  const [content, setContent] = useState('');
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [postType, setPostType] = useState<'text' | 'image' | 'video' | 'link' | 'poll'>('text');
  const [tags, setTags] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState('');
  const [location, setLocation] = useState<PostLocation | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<{[key: number]: number}>({});
  const [showAdvancedOptions, setShowAdvancedOptions] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const [showPollCreation, setShowPollCreation] = useState(false);
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

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

  const handleRemoveTag = (tagToRemove: string) => {
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
        visibility: 'group',
        tags,
        groupId: groupId,
        location: location || undefined,
      };

      const newPost = await socialService.createPost(postData);

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
        onPostCreated(newPost);
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

  return (
    <div className={`bg-white border border-gray-200 rounded-lg p-4 ${className}`}>
      {/* Header */}
      <div className="flex items-center space-x-3 mb-4">
        <div className="w-10 h-10 rounded-full bg-purple-100 flex items-center justify-center">
          <span className="text-purple-600 font-semibold">👥</span>
        </div>
        <div>
          <h3 className="font-medium text-gray-900">Post to {groupName}</h3>
          <p className="text-sm text-gray-500">Share something with the group</p>
        </div>
      </div>

      {/* Content Input */}
      <div className="mb-4">
        <textarea
          ref={textareaRef}
          value={content}
          onChange={(e) => {
            setContent(e.target.value);
            autoResizeTextarea();
          }}
          onInput={autoResizeTextarea}
          placeholder="What's happening in the group?"
          className="w-full border-0 resize-none focus:ring-0 text-lg placeholder-gray-400 min-h-[100px]"
          rows={3}
        />
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
                  onClick={() => handleRemoveTag(tag)}
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

        {/* Post Button */}
        <button
          onClick={handleSubmit}
          disabled={isLoading || (!content.trim() && selectedFiles.length === 0)}
          className="bg-purple-600 text-white px-6 py-2 rounded-lg hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {isLoading ? 'Posting...' : 'Post to Group'}
        </button>
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
            onPollCreated={(post) => {
              setShowPollCreation(false);
              if (onPostCreated) {
                onPostCreated(post);
              }
            }}
          />
        </div>
      )}
    </div>
  );
};

export default GroupPostCreation;
