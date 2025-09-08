import React, { useState, useRef, useCallback } from 'react';
import { fileUploadService, FileInfo, UploadProgress } from '../../services/fileUpload.service';
import { 
  PaperClipIcon, 
  XMarkIcon, 
  CheckIcon,
  ExclamationTriangleIcon,
  PhotoIcon,
  DocumentIcon
} from '@heroicons/react/24/outline';

interface FileUploadProps {
  conversationId: string;
  onFileUploaded: (file: FileInfo) => void;
  onUploadError: (error: string) => void;
  disabled?: boolean;
  className?: string;
}

const FileUpload: React.FC<FileUploadProps> = ({
  conversationId,
  onFileUploaded,
  onUploadError,
  disabled = false,
  className = ''
}) => {
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<UploadProgress | null>(null);
  const [dragActive, setDragActive] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = useCallback(async (files: FileList | File[]) => {
    if (disabled || isUploading) return;

    const fileArray = Array.from(files);
    if (fileArray.length === 0) return;

    // Validate files
    const { valid, invalid } = fileUploadService.validateFiles(fileArray);
    
    if (invalid.length > 0) {
      const errorMessage = invalid.map(({ file, error }) => `${file.name}: ${error}`).join(', ');
      onUploadError(errorMessage);
      return;
    }

    // Upload first valid file (we'll support multiple files later)
    const file = valid[0];
    await uploadFile(file);
  }, [conversationId, disabled, isUploading, onFileUploaded, onUploadError]);

  const uploadFile = async (file: File) => {
    setIsUploading(true);
    setUploadProgress(null);
    setMessage(null);

    try {
      const result = await fileUploadService.uploadFile(
        conversationId,
        file,
        undefined, // No additional message
        (progress) => {
          setUploadProgress(progress);
        }
      );

      onFileUploaded(result.file);
      setMessage({ type: 'success', text: 'File uploaded successfully!' });
      
      // Clear progress after a short delay
      setTimeout(() => {
        setUploadProgress(null);
        setMessage(null);
      }, 2000);
    } catch (error: any) {
      const errorMessage = error.message || 'Failed to upload file';
      onUploadError(errorMessage);
      setMessage({ type: 'error', text: errorMessage });
    } finally {
      setIsUploading(false);
    }
  };

  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    if (disabled || isUploading) return;

    const files = e.dataTransfer.files;
    if (files && files.length > 0) {
      handleFileSelect(files);
    }
  }, [handleFileSelect, disabled, isUploading]);

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      handleFileSelect(files);
    }
    // Reset input value
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const openFileDialog = () => {
    if (disabled || isUploading) return;
    fileInputRef.current?.click();
  };

  const getFileTypeIcon = (file: File) => {
    if (file.type.startsWith('image/')) {
      return <PhotoIcon className="w-5 h-5 text-blue-600" />;
    } else if (file.type === 'application/pdf') {
      return <DocumentIcon className="w-5 h-5 text-red-600" />;
    } else if (file.type === 'text/plain') {
      return <DocumentIcon className="w-5 h-5 text-green-600" />;
    }
    return <DocumentIcon className="w-5 h-5 text-gray-600" />;
  };

  return (
    <div className={`relative ${className}`}>
      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        accept=".jpg,.jpeg,.png,.gif,.pdf,.txt,image/*,application/pdf,text/plain"
        onChange={handleFileInputChange}
        className="hidden"
        disabled={disabled || isUploading}
      />

      {/* Upload button */}
      <button
        onClick={openFileDialog}
        disabled={disabled || isUploading}
        className={`p-2 rounded-full transition-colors ${
          disabled || isUploading
            ? 'text-gray-400 cursor-not-allowed'
            : 'text-gray-600 hover:text-gray-800 hover:bg-gray-100'
        }`}
        title="Upload file (Photos, PDF, TXT only)"
      >
        <PaperClipIcon className="w-5 h-5" />
      </button>

      {/* Drag and drop overlay */}
      {dragActive && (
        <div
          className="fixed inset-0 bg-blue-500 bg-opacity-20 flex items-center justify-center z-50"
          onDragEnter={handleDrag}
          onDragLeave={handleDrag}
          onDragOver={handleDrag}
          onDrop={handleDrop}
        >
          <div className="bg-white rounded-lg p-8 shadow-lg border-2 border-dashed border-blue-500">
            <div className="text-center">
              <PaperClipIcon className="w-12 h-12 text-blue-500 mx-auto mb-4" />
              <p className="text-lg font-medium text-gray-900">Drop files here</p>
              <p className="text-sm text-gray-500">Photos, PDF, and TXT files only</p>
            </div>
          </div>
        </div>
      )}

      {/* Upload progress */}
      {isUploading && uploadProgress && (
        <div className="absolute bottom-full left-0 mb-2 bg-white rounded-lg shadow-lg border border-gray-200 p-4 min-w-64">
          <div className="flex items-center space-x-3">
            <div className="flex-shrink-0">
              <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                <PaperClipIcon className="w-4 h-4 text-blue-600" />
              </div>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-gray-900 truncate">
                Uploading...
              </p>
              <div className="mt-1 bg-gray-200 rounded-full h-2">
                <div
                  className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${uploadProgress.percentage}%` }}
                />
              </div>
              <p className="text-xs text-gray-500 mt-1">
                {uploadProgress.percentage}% ({fileUploadService.formatFileSize(uploadProgress.loaded)} / {fileUploadService.formatFileSize(uploadProgress.total)})
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Success/Error message */}
      {message && (
        <div className={`absolute bottom-full left-0 mb-2 bg-white rounded-lg shadow-lg border p-3 min-w-48 ${
          message.type === 'success' ? 'border-green-200' : 'border-red-200'
        }`}>
          <div className="flex items-center space-x-2">
            {message.type === 'success' ? (
              <CheckIcon className="w-4 h-4 text-green-600" />
            ) : (
              <ExclamationTriangleIcon className="w-4 h-4 text-red-600" />
            )}
            <p className={`text-sm ${
              message.type === 'success' ? 'text-green-800' : 'text-red-800'
            }`}>
              {message.text}
            </p>
          </div>
        </div>
      )}

      {/* Drag and drop zone (invisible overlay) */}
      <div
        className="fixed inset-0 pointer-events-none"
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
      />
    </div>
  );
};

export default FileUpload;
