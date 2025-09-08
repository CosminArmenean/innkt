import React, { useState } from 'react';
import { fileUploadService } from '../../services/fileUpload.service';
import { 
  DocumentIcon, 
  PhotoIcon,
  EyeIcon,
  ArrowDownTrayIcon,
  TrashIcon,
  XMarkIcon
} from '@heroicons/react/24/outline';

interface FileMessageProps {
  file: {
    id: string;
    name: string;
    type: string;
    size: number;
    url: string;
    preview?: {
      type: 'image' | 'pdf' | 'text' | 'unknown';
      url?: string;
      thumbnail?: string;
      preview?: string;
      icon?: string;
    };
  };
  isOwnMessage?: boolean;
  onDelete?: (fileId: string) => void;
  className?: string;
}

const FileMessage: React.FC<FileMessageProps> = ({
  file,
  isOwnMessage = false,
  onDelete,
  className = ''
}) => {
  const [showPreview, setShowPreview] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const handleDownload = () => {
    const link = document.createElement('a');
    link.href = file.url;
    link.download = file.name;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleDelete = () => {
    if (onDelete) {
      onDelete(file.id);
      setShowDeleteConfirm(false);
    }
  };

  const handlePreview = () => {
    setShowPreview(true);
  };

  const getFileIcon = () => {
    if (file.type.startsWith('image/')) {
      return <PhotoIcon className="w-8 h-8 text-blue-600" />;
    } else if (file.type === 'application/pdf') {
      return <DocumentIcon className="w-8 h-8 text-red-600" />;
    } else if (file.type === 'text/plain') {
      return <DocumentIcon className="w-8 h-8 text-green-600" />;
    }
    return <DocumentIcon className="w-8 h-8 text-gray-600" />;
  };

  const renderPreview = () => {
    if (file.type.startsWith('image/')) {
      return (
        <div className="max-w-xs">
          <img
            src={file.url}
            alt={file.name}
            className="rounded-lg max-w-full h-auto cursor-pointer hover:opacity-90 transition-opacity"
            onClick={handlePreview}
          />
        </div>
      );
    } else if (file.type === 'application/pdf') {
      return (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 max-w-xs">
          <div className="flex items-center space-x-3">
            <DocumentIcon className="w-8 h-8 text-red-600" />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-gray-900 truncate">{file.name}</p>
              <p className="text-xs text-gray-500">PDF Document</p>
            </div>
          </div>
        </div>
      );
    } else if (file.type === 'text/plain') {
      return (
        <div className="bg-green-50 border border-green-200 rounded-lg p-4 max-w-xs">
          <div className="flex items-center space-x-3">
            <DocumentIcon className="w-8 h-8 text-green-600" />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-gray-900 truncate">{file.name}</p>
              <p className="text-xs text-gray-500">Text File</p>
            </div>
          </div>
        </div>
      );
    }

    return (
      <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 max-w-xs">
        <div className="flex items-center space-x-3">
          <DocumentIcon className="w-8 h-8 text-gray-600" />
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-gray-900 truncate">{file.name}</p>
            <p className="text-xs text-gray-500">{fileUploadService.formatFileSize(file.size)}</p>
          </div>
        </div>
      </div>
    );
  };

  return (
    <>
      <div className={`relative group ${className}`}>
        {renderPreview()}
        
        {/* Action buttons */}
        <div className={`absolute top-2 right-2 flex space-x-1 opacity-0 group-hover:opacity-100 transition-opacity ${
          isOwnMessage ? 'flex' : 'hidden'
        }`}>
          <button
            onClick={handlePreview}
            className="p-1 bg-white bg-opacity-80 hover:bg-opacity-100 rounded-full shadow-sm"
            title="Preview"
          >
            <EyeIcon className="w-4 h-4 text-gray-600" />
          </button>
          
          <button
            onClick={handleDownload}
            className="p-1 bg-white bg-opacity-80 hover:bg-opacity-100 rounded-full shadow-sm"
            title="Download"
          >
            <ArrowDownTrayIcon className="w-4 h-4 text-gray-600" />
          </button>
          
          {onDelete && (
            <button
              onClick={() => setShowDeleteConfirm(true)}
              className="p-1 bg-white bg-opacity-80 hover:bg-opacity-100 rounded-full shadow-sm"
              title="Delete"
            >
              <TrashIcon className="w-4 h-4 text-red-600" />
            </button>
          )}
        </div>
      </div>

      {/* Delete confirmation modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-sm w-full mx-4">
            <h3 className="text-lg font-medium text-gray-900 mb-2">Delete File</h3>
            <p className="text-sm text-gray-600 mb-4">
              Are you sure you want to delete "{file.name}"? This action cannot be undone.
            </p>
            <div className="flex space-x-3">
              <button
                onClick={handleDelete}
                className="flex-1 bg-red-600 text-white py-2 px-4 rounded-lg hover:bg-red-700"
              >
                Delete
              </button>
              <button
                onClick={() => setShowDeleteConfirm(false)}
                className="flex-1 bg-gray-200 text-gray-800 py-2 px-4 rounded-lg hover:bg-gray-300"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Preview modal */}
      {showPreview && (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-4xl max-h-[90vh] w-full overflow-hidden">
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b border-gray-200">
              <div className="flex items-center space-x-3">
                {getFileIcon()}
                <div>
                  <h3 className="text-lg font-medium text-gray-900">{file.name}</h3>
                  <p className="text-sm text-gray-500">{fileUploadService.formatFileSize(file.size)}</p>
                </div>
              </div>
              <div className="flex items-center space-x-2">
                <button
                  onClick={handleDownload}
                  className="p-2 text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-full"
                  title="Download"
                >
                  <ArrowDownTrayIcon className="w-5 h-5" />
                </button>
                <button
                  onClick={() => setShowPreview(false)}
                  className="p-2 text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-full"
                >
                  <XMarkIcon className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Content */}
            <div className="p-4 overflow-auto max-h-[calc(90vh-80px)]">
              {file.type.startsWith('image/') ? (
                <img
                  src={file.url}
                  alt={file.name}
                  className="max-w-full h-auto mx-auto"
                />
              ) : file.type === 'application/pdf' ? (
                <div className="text-center py-8">
                  <DocumentIcon className="w-16 h-16 text-red-600 mx-auto mb-4" />
                  <p className="text-gray-600 mb-4">PDF preview not available</p>
                  <button
                    onClick={handleDownload}
                    className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700"
                  >
                    Download PDF
                  </button>
                </div>
              ) : file.type === 'text/plain' ? (
                <div className="bg-gray-50 rounded-lg p-4">
                  <pre className="whitespace-pre-wrap text-sm text-gray-800 font-mono">
                    {file.preview?.preview || 'Text content not available'}
                  </pre>
                </div>
              ) : (
                <div className="text-center py-8">
                  <DocumentIcon className="w-16 h-16 text-gray-600 mx-auto mb-4" />
                  <p className="text-gray-600 mb-4">Preview not available for this file type</p>
                  <button
                    onClick={handleDownload}
                    className="bg-gray-600 text-white px-4 py-2 rounded-lg hover:bg-gray-700"
                  >
                    Download File
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default FileMessage;
