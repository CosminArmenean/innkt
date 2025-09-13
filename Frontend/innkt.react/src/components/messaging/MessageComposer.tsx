import React, { useState, useRef, useCallback } from 'react';
import { Conversation } from '../../services/messaging.service';

interface MessageComposerProps {
  onSendMessage: (content: string, type: 'text' | 'image' | 'file', media?: File) => void;
  conversation: Conversation;
}

const MessageComposer: React.FC<MessageComposerProps> = ({ onSendMessage, conversation }) => {
  const [message, setMessage] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [isEncrypted, setIsEncrypted] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Common emojis for quick access
  const commonEmojis = ['😀', '😂', '😍', '🤔', '👍', '👎', '❤️', '🎉', '🔥', '💯'];

  const handleSendMessage = useCallback(() => {
    if (!message.trim() && !selectedFile) return;

    const messageType = selectedFile ? 
      (selectedFile.type.startsWith('image/') ? 'image' : 'file') : 
      'text';

    onSendMessage(message, messageType, selectedFile || undefined);
    
    // Reset form
    setMessage('');
    setSelectedFile(null);
    setIsEncrypted(false);
    setShowEmojiPicker(false);
    
    // Reset file input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  }, [message, selectedFile, onSendMessage]);

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedFile(file);
    }
  };

  const handleEmojiSelect = (emoji: string) => {
    setMessage(prev => prev + emoji);
    setShowEmojiPicker(false);
    textareaRef.current?.focus();
  };

  const removeSelectedFile = () => {
    setSelectedFile(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const canSend = message.trim() || selectedFile;

  return (
    <div className="border-t border-gray-200 bg-white p-4 pb-20 lg:pb-4">
      {/* Selected File Preview */}
      {selectedFile && (
        <div className="mb-3 p-3 bg-gray-50 rounded-lg">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              {selectedFile.type.startsWith('image/') ? (
                <img
                  src={URL.createObjectURL(selectedFile)}
                  alt="Preview"
                  className="w-12 h-12 object-cover rounded"
                />
              ) : (
                <div className="w-12 h-12 bg-gray-200 rounded flex items-center justify-center">
                  <svg className="w-6 h-6 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                </div>
              )}
              <div>
                <p className="text-sm font-medium text-gray-900">{selectedFile.name}</p>
                <p className="text-xs text-gray-500">{formatFileSize(selectedFile.size)}</p>
              </div>
            </div>
            <button
              onClick={removeSelectedFile}
              className="text-gray-400 hover:text-gray-600"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>
      )}

      {/* Emoji Picker */}
      {showEmojiPicker && (
        <div className="mb-3 p-3 bg-gray-50 rounded-lg">
          <div className="flex flex-wrap gap-2">
            {commonEmojis.map((emoji) => (
              <button
                key={emoji}
                onClick={() => handleEmojiSelect(emoji)}
                className="text-2xl hover:bg-gray-200 rounded p-1 transition-colors"
              >
                {emoji}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Message Input */}
      <div className="flex items-end space-x-2">
        {/* File Upload Button */}
        <button
          onClick={() => fileInputRef.current?.click()}
          className="flex-shrink-0 p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100 transition-colors"
          title="Attach file"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" />
          </svg>
        </button>

        {/* Hidden File Input */}
        <input
          ref={fileInputRef}
          type="file"
          onChange={handleFileSelect}
          className="hidden"
          accept="image/*,video/*,.pdf,.doc,.docx,.txt,.zip,.rar"
        />

        {/* Emoji Button */}
        <button
          onClick={() => setShowEmojiPicker(!showEmojiPicker)}
          className="flex-shrink-0 p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100 transition-colors"
          title="Add emoji"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.828 14.828a4 4 0 01-5.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </button>

        {/* Message Textarea */}
        <div className="flex-1 relative">
          <textarea
            ref={textareaRef}
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder={`Message ${conversation.name || conversation.participants.map(p => p.displayName).join(', ')}...`}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-innkt-primary focus:border-transparent resize-none"
            rows={1}
            style={{
              minHeight: '32px',
              maxHeight: '80px',
              height: 'auto'
            }}
            onInput={(e) => {
              const target = e.target as HTMLTextAreaElement;
              target.style.height = 'auto';
              target.style.height = Math.min(target.scrollHeight, 80) + 'px';
            }}
          />
        </div>

        {/* Encryption Toggle */}
        {conversation.settings.encryptionEnabled && (
          <button
            onClick={() => setIsEncrypted(!isEncrypted)}
            className={`flex-shrink-0 p-2 rounded-lg transition-colors ${
              isEncrypted 
                ? 'text-innkt-primary bg-purple-100' 
                : 'text-gray-400 hover:text-gray-600 hover:bg-gray-100'
            }`}
            title={isEncrypted ? 'Message will be encrypted' : 'Encrypt message'}
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
            </svg>
          </button>
        )}

        {/* Send Button */}
        <button
          onClick={handleSendMessage}
          disabled={!canSend}
          className={`flex-shrink-0 p-2 rounded-lg transition-colors ${
            canSend
              ? 'bg-innkt-primary text-white hover:bg-purple-700'
              : 'bg-gray-200 text-gray-400 cursor-not-allowed'
          }`}
          title="Send message"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
          </svg>
        </button>
      </div>

      {/* Typing Indicator */}
      {isTyping && (
        <div className="mt-2 text-sm text-gray-500">
          <span className="inline-flex items-center">
            <div className="flex space-x-1">
              <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
              <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
              <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
            </div>
            <span className="ml-2">Someone is typing...</span>
          </span>
        </div>
      )}

      {/* Encryption Notice */}
      {isEncrypted && (
        <div className="mt-2 text-xs text-innkt-primary flex items-center">
          <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
          </svg>
          This message will be encrypted
        </div>
      )}
    </div>
  );
};

export default MessageComposer;

