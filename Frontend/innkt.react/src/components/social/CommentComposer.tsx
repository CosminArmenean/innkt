import React, { useState, useRef, useEffect } from 'react';
import { X, Send, Image, Smile, AtSign, Hash } from 'lucide-react';
import { Post, Comment } from '../../services/social.service';
import { socialService } from '../../services/social.service';
import { useAuth } from '../../contexts/AuthContext';

interface CommentComposerProps {
  post: Post;
  parentComment?: Comment | null;
  initialContent?: string; // Added for pre-filling @username
  onCommentCreated: (comment: Comment) => void;
  onCancel: () => void;
}

const MAX_CHARACTERS = 280;

const CommentComposer: React.FC<CommentComposerProps> = ({
  post,
  parentComment,
  initialContent = '', // Default to empty string
  onCommentCreated,
  onCancel
}) => {
  const { user } = useAuth();
  const [content, setContent] = useState(initialContent);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showMentions, setShowMentions] = useState(false);
  const [showHashtags, setShowHashtags] = useState(false);
  const [mentions, setMentions] = useState<string[]>([]);
  const [hashtags, setHashtags] = useState<string[]>([]);
  
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const mentionRef = useRef<HTMLInputElement>(null);
  const hashtagRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.focus();
      
      // If there's initial content (like @username), position cursor at the end
      if (initialContent) {
        const textarea = textareaRef.current;
        const length = textarea.value.length;
        textarea.setSelectionRange(length, length);
      }
    }
  }, [initialContent]);

  // Auto-resize textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`;
    }
  }, [content]);

  // Extract mentions and hashtags from content
  useEffect(() => {
    const mentionRegex = /@(\w+)/g;
    const hashtagRegex = /#(\w+)/g;
    
    const foundMentions = content.match(mentionRegex)?.map(m => m.substring(1)) || [];
    const foundHashtags = content.match(hashtagRegex)?.map(h => h.substring(1)) || [];
    
    setMentions(foundMentions);
    setHashtags(foundHashtags);
  }, [content]);

  const handleSubmit = async () => {
    if (!content.trim() || isSubmitting) return;

    setIsSubmitting(true);
    try {
      const newComment = await socialService.createComment(
        post.id,
        content.trim(),
        parentComment?.id
      );
      
      // Note: @grok processing is handled by Social Service in the background
      // No need to call Grok API from frontend
      
      onCommentCreated(newComment);
      setContent('');
    } catch (error) {
      console.error('Failed to create comment:', error);
      alert('Failed to create comment. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    } else if (e.key === 'Escape') {
      onCancel();
    }
  };

  const insertMention = (username: string) => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const beforeCursor = content.substring(0, start);
    const afterCursor = content.substring(end);
    
    // Find the last @ symbol before cursor
    const lastAtIndex = beforeCursor.lastIndexOf('@');
    if (lastAtIndex !== -1) {
      const newContent = 
        beforeCursor.substring(0, lastAtIndex) + 
        `@${username} ` + 
        afterCursor;
      
      setContent(newContent);
      
      // Set cursor position after the mention
      setTimeout(() => {
        const newCursorPos = lastAtIndex + username.length + 2;
        textarea.setSelectionRange(newCursorPos, newCursorPos);
        textarea.focus();
      }, 0);
    }
    
    setShowMentions(false);
  };

  const insertHashtag = (hashtag: string) => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const beforeCursor = content.substring(0, start);
    const afterCursor = content.substring(end);
    
    // Find the last # symbol before cursor
    const lastHashIndex = beforeCursor.lastIndexOf('#');
    if (lastHashIndex !== -1) {
      const newContent = 
        beforeCursor.substring(0, lastHashIndex) + 
        `#${hashtag} ` + 
        afterCursor;
      
      setContent(newContent);
      
      // Set cursor position after the hashtag
      setTimeout(() => {
        const newCursorPos = lastHashIndex + hashtag.length + 2;
        textarea.setSelectionRange(newCursorPos, newCursorPos);
        textarea.focus();
      }, 0);
    }
    
    setShowHashtags(false);
  };

  const characterCount = content.length;
  const isOverLimit = characterCount > MAX_CHARACTERS;
  const remainingChars = MAX_CHARACTERS - characterCount;

  return (
    <div className="comment-composer bg-white border border-gray-200 rounded-lg p-4">
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center space-x-2">
          <div className="w-8 h-8 rounded-full bg-gradient-to-r from-blue-500 to-purple-600 flex items-center justify-center text-white text-sm font-semibold">
            {(user?.firstName && user?.lastName ? `${user.firstName} ${user.lastName}` : user?.username || 'U').charAt(0).toUpperCase()}
          </div>
          <div>
            <p className="text-sm font-medium text-gray-900">
              {parentComment ? 'Replying to' : 'Commenting on'}
            </p>
            {parentComment ? (
              <p className="text-xs text-gray-500">
                @{parentComment.author?.username || 'unknown'}
              </p>
            ) : (
              <p className="text-xs text-gray-500">
                @{post.author?.username || 'unknown'}
              </p>
            )}
          </div>
        </div>
        
        <button
          onClick={onCancel}
          className="p-1 hover:bg-gray-100 rounded-full transition-colors"
        >
          <X className="w-4 h-4 text-gray-500" />
        </button>
      </div>

      {/* Post Preview (for replies) */}
      {parentComment && (
        <div className="mb-3 p-3 bg-gray-50 rounded-lg border-l-4 border-blue-500">
          <div className="flex items-center space-x-2 mb-1">
            <div className="w-6 h-6 rounded-full overflow-hidden flex-shrink-0">
              {post.author?.avatarUrl ? (
                <img 
                  src={post.author.avatarUrl} 
                  alt={post.author.displayName || 'User'}
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    console.log('Post preview avatar image failed to load:', post.author?.avatarUrl);
                    e.currentTarget.style.display = 'none';
                  }}
                />
              ) : (
                <div className="w-full h-full bg-gradient-to-r from-blue-500 to-purple-600 flex items-center justify-center text-white text-xs font-semibold">
                  {post.author?.displayName?.charAt(0) || 'U'}
                </div>
              )}
            </div>
            <span className="text-sm font-medium text-gray-900">
              {post.author?.displayName || 'Unknown User'}
            </span>
            <span className="text-xs text-gray-500">
              @{post.author?.username || 'unknown'}
            </span>
          </div>
          <p className="text-sm text-gray-700 line-clamp-2">
            {post.content}
          </p>
        </div>
      )}

      {/* Textarea */}
      <div className="relative">
        <textarea
          ref={textareaRef}
          value={content}
          onChange={(e) => setContent(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={parentComment ? `Reply to @${parentComment.author?.username || 'unknown'}...` : 'Write a comment...'}
          className="w-full p-3 border border-gray-300 rounded-lg resize-none focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
          rows={3}
          maxLength={MAX_CHARACTERS + 50} // Allow some overflow for better UX
        />
        
        {/* Character Counter */}
        <div className="absolute bottom-2 right-2 text-xs">
          <span className={isOverLimit ? 'text-red-500' : 'text-gray-400'}>
            {characterCount}/{MAX_CHARACTERS}
          </span>
        </div>
      </div>

      {/* Toolbar */}
      <div className="flex items-center justify-between mt-3">
        <div className="flex items-center space-x-2">
          {/* Mention Button */}
          <button
            onClick={() => setShowMentions(!showMentions)}
            className="p-2 hover:bg-gray-100 rounded-full transition-colors"
            title="Mention someone"
          >
            <AtSign className="w-4 h-4 text-gray-500" />
          </button>

          {/* Hashtag Button */}
          <button
            onClick={() => setShowHashtags(!showHashtags)}
            className="p-2 hover:bg-gray-100 rounded-full transition-colors"
            title="Add hashtag"
          >
            <Hash className="w-4 h-4 text-gray-500" />
          </button>

          {/* Emoji Button */}
          <button
            className="p-2 hover:bg-gray-100 rounded-full transition-colors"
            title="Add emoji"
          >
            <Smile className="w-4 h-4 text-gray-500" />
          </button>

          {/* Media Button */}
          <button
            className="p-2 hover:bg-gray-100 rounded-full transition-colors"
            title="Add media"
          >
            <Image className="w-4 h-4 text-gray-500" />
          </button>
        </div>

        {/* Submit Button */}
        <button
          onClick={handleSubmit}
          disabled={!content.trim() || isOverLimit || isSubmitting}
          className="flex items-center space-x-2 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          <Send className="w-4 h-4" />
          <span>{isSubmitting ? 'Posting...' : 'Post'}</span>
        </button>
      </div>

      {/* Mentions Dropdown */}
      {showMentions && (
        <div className="absolute z-10 mt-2 w-64 bg-white border border-gray-200 rounded-lg shadow-lg">
          <div className="p-2">
            <input
              ref={mentionRef}
              type="text"
              placeholder="Search users..."
              className="w-full p-2 border border-gray-300 rounded text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
            />
          </div>
          <div className="max-h-48 overflow-y-auto">
            {/* TODO: Implement user search and display */}
            <div className="p-2 text-sm text-gray-500 text-center">
              User search not implemented yet
            </div>
          </div>
        </div>
      )}

      {/* Hashtags Dropdown */}
      {showHashtags && (
        <div className="absolute z-10 mt-2 w-64 bg-white border border-gray-200 rounded-lg shadow-lg">
          <div className="p-2">
            <input
              ref={hashtagRef}
              type="text"
              placeholder="Search hashtags..."
              className="w-full p-2 border border-gray-300 rounded text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
            />
          </div>
          <div className="max-h-48 overflow-y-auto">
            {/* TODO: Implement hashtag search and display */}
            <div className="p-2 text-sm text-gray-500 text-center">
              Hashtag search not implemented yet
            </div>
          </div>
        </div>
      )}

      {/* Extracted Mentions and Hashtags */}
      {(mentions.length > 0 || hashtags.length > 0) && (
        <div className="mt-3 flex flex-wrap gap-2">
          {mentions.map((mention, index) => (
            <span
              key={index}
              className="inline-flex items-center px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full"
            >
              @{mention}
            </span>
          ))}
          {hashtags.map((hashtag, index) => (
            <span
              key={index}
              className="inline-flex items-center px-2 py-1 bg-green-100 text-green-800 text-xs rounded-full"
            >
              #{hashtag}
            </span>
          ))}
        </div>
      )}

      {/* Validation Messages */}
      {isOverLimit && (
        <div className="mt-2 text-sm text-red-500">
          Comment is too long. Please remove {Math.abs(remainingChars)} characters.
        </div>
      )}
    </div>
  );
};

export default CommentComposer;
