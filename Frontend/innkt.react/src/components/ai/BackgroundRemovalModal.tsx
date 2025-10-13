import React, { useState, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { XMarkIcon, PhotoIcon, ArrowDownTrayIcon, SparklesIcon } from '@heroicons/react/24/outline';
import { backgroundRemovalService, BackgroundRemovalOptions, AvatarProcessingOptions } from '../../services/backgroundRemoval.service';

interface BackgroundRemovalModalProps {
  isOpen: boolean;
  onClose: () => void;
  onImageProcessed?: (processedImageBlob: Blob) => void;
  mode?: 'background-removal' | 'avatar-processing';
  title?: string;
}

const BackgroundRemovalModal: React.FC<BackgroundRemovalModalProps> = ({
  isOpen,
  onClose,
  onImageProcessed,
  mode = 'background-removal',
  title
}) => {
  const { t } = useTranslation();
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [processedImageUrl, setProcessedImageUrl] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [processingTime, setProcessingTime] = useState<number | null>(null);
  const [options, setOptions] = useState<BackgroundRemovalOptions | AvatarProcessingOptions>(
    mode === 'avatar-processing' 
      ? backgroundRemovalService.getDefaultAvatarOptions()
      : backgroundRemovalService.getDefaultBackgroundRemovalOptions()
  );
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const dragCounter = useRef(0);
  const [isDragOver, setIsDragOver] = useState(false);

  const handleFileSelect = (file: File) => {
    const validation = backgroundRemovalService.validateImageFile(file);
    if (!validation.isValid) {
      setError(validation.error || 'Invalid file');
      return;
    }

    setSelectedFile(file);
    setError(null);
    setProcessedImageUrl(null);
    
    // Create preview URL
    const url = URL.createObjectURL(file);
    setPreviewUrl(url);
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleFileSelect(file);
    }
  };

  const handleDragEnter = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    dragCounter.current++;
    if (e.dataTransfer.items && e.dataTransfer.items.length > 0) {
      setIsDragOver(true);
    }
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    dragCounter.current--;
    if (dragCounter.current === 0) {
      setIsDragOver(false);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);
    dragCounter.current = 0;

    const files = e.dataTransfer.files;
    if (files && files.length > 0) {
      handleFileSelect(files[0]);
    }
  };

  const handleProcessImage = async () => {
    if (!selectedFile) return;

    setIsProcessing(true);
    setError(null);
    const startTime = Date.now();

    try {
      let processedBlob: Blob;

      if (mode === 'avatar-processing') {
        processedBlob = await backgroundRemovalService.processAvatar(
          selectedFile,
          options as AvatarProcessingOptions
        );
      } else {
        const result = await backgroundRemovalService.removeBackground(
          selectedFile,
          options as BackgroundRemovalOptions
        );
        
        if (!result.success) {
          throw new Error(result.error || 'Background removal failed');
        }

        if (result.processedImageData) {
          // Convert base64 to blob
          const response = await fetch(result.processedImageData);
          processedBlob = await response.blob();
        } else if (result.processedImagePath) {
          processedBlob = await backgroundRemovalService.getProcessedImage(result.processedImagePath);
        } else {
          throw new Error('No processed image data available');
        }
      }

      const processedUrl = URL.createObjectURL(processedBlob);
      setProcessedImageUrl(processedUrl);
      setProcessingTime(Date.now() - startTime);

      if (onImageProcessed) {
        onImageProcessed(processedBlob);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Processing failed');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleDownload = async () => {
    if (!processedImageUrl) return;

    try {
      const response = await fetch(processedImageUrl);
      const blob = await response.blob();
      const filename = selectedFile?.name.replace(/\.[^/.]+$/, '') + '_processed.png';
      backgroundRemovalService.downloadProcessedImage(blob, filename);
    } catch (err) {
      setError('Download failed');
    }
  };

  const handleClose = () => {
    setSelectedFile(null);
    setPreviewUrl(null);
    setProcessedImageUrl(null);
    setError(null);
    setProcessingTime(null);
    setIsProcessing(false);
    onClose();
  };

  const handleReset = () => {
    setSelectedFile(null);
    setPreviewUrl(null);
    setProcessedImageUrl(null);
    setError(null);
    setProcessingTime(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center space-x-3">
            <SparklesIcon className="h-6 w-6 text-blue-600" />
            <h2 className="text-xl font-semibold text-gray-900">
              {title || (mode === 'avatar-processing' ? 'AI Avatar Processing' : 'AI Background Removal')}
            </h2>
          </div>
          <button
            onClick={handleClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <XMarkIcon className="h-6 w-6" />
          </button>
        </div>

        <div className="p-6 overflow-y-auto max-h-[calc(90vh-120px)]">
          {/* File Upload Area */}
          {!selectedFile && (
            <div
              className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
                isDragOver
                  ? 'border-blue-500 bg-blue-50'
                  : 'border-gray-300 hover:border-gray-400'
              }`}
              onDragEnter={handleDragEnter}
              onDragLeave={handleDragLeave}
              onDragOver={handleDragOver}
              onDrop={handleDrop}
            >
              <PhotoIcon className="mx-auto h-12 w-12 text-gray-400 mb-4" />
              <p className="text-lg font-medium text-gray-900 mb-2">
                Drop your image here or click to browse
              </p>
              <p className="text-sm text-gray-500 mb-4">
                Supports JPEG, PNG, and WebP (max 10MB)
              </p>
              <button
                onClick={() => fileInputRef.current?.click()}
                className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
              >
                Choose Image
              </button>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleFileInputChange}
                className="hidden"
              />
            </div>
          )}

          {/* Image Preview and Processing */}
          {selectedFile && (
            <div className="space-y-6">
              {/* Original Image */}
              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-3">Original Image</h3>
                <div className="relative">
                  <img
                    src={previewUrl || ''}
                    alt="Original"
                    className="max-w-full h-auto max-h-64 mx-auto rounded-lg shadow-sm"
                  />
                  <div className="absolute top-2 right-2 bg-black bg-opacity-50 text-white px-2 py-1 rounded text-sm">
                    {selectedFile.name}
                  </div>
                </div>
              </div>

              {/* Options */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Model
                  </label>
                  <select
                    value={(options as any).model || 'u2net'}
                    onChange={(e) => setOptions({ ...options, model: e.target.value })}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="u2net">U²-Net (General)</option>
                    <option value="u2net_human_seg">U²-Net (Human)</option>
                    <option value="u2netp">U²-Net (Lightweight)</option>
                    <option value="u2net_cloth_seg">U²-Net (Clothing)</option>
                    <option value="silueta">Silueta</option>
                    <option value="isnet-general-use">ISNet (High Quality)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Output Format
                  </label>
                  <select
                    value={(options as any).outputFormat || (options as any).format || 'PNG'}
                    onChange={(e) => setOptions({ ...options, outputFormat: e.target.value, format: e.target.value })}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="PNG">PNG</option>
                    <option value="JPEG">JPEG</option>
                    <option value="WEBP">WebP</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Quality: {(options as any).quality || 95}%
                  </label>
                  <input
                    type="range"
                    min="50"
                    max="100"
                    value={(options as any).quality || 95}
                    onChange={(e) => setOptions({ ...options, quality: parseInt(e.target.value) })}
                    className="w-full"
                  />
                </div>

                {mode === 'avatar-processing' && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Size: {(options as AvatarProcessingOptions).resizeTo || 512}px
                    </label>
                    <input
                      type="range"
                      min="256"
                      max="1024"
                      step="64"
                      value={(options as AvatarProcessingOptions).resizeTo || 512}
                      onChange={(e) => setOptions({ ...options, resizeTo: parseInt(e.target.value) })}
                      className="w-full"
                    />
                  </div>
                )}
              </div>

              {/* Process Button */}
              <div className="flex space-x-3">
                <button
                  onClick={handleProcessImage}
                  disabled={isProcessing}
                  className="flex-1 bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center space-x-2"
                >
                  {isProcessing ? (
                    <>
                      <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                      <span>Processing...</span>
                    </>
                  ) : (
                    <>
                      <SparklesIcon className="h-5 w-5" />
                      <span>Process Image</span>
                    </>
                  )}
                </button>
                <button
                  onClick={handleReset}
                  className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Reset
                </button>
              </div>

              {/* Error Display */}
              {error && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                  <p className="text-red-800">{error}</p>
                </div>
              )}

              {/* Processed Image */}
              {processedImageUrl && (
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="text-lg font-medium text-gray-900">Processed Image</h3>
                    {processingTime && (
                      <span className="text-sm text-gray-500">
                        Processed in {(processingTime / 1000).toFixed(2)}s
                      </span>
                    )}
                  </div>
                  <div className="relative">
                    <img
                      src={processedImageUrl}
                      alt="Processed"
                      className="max-w-full h-auto max-h-64 mx-auto rounded-lg shadow-sm"
                    />
                    <button
                      onClick={handleDownload}
                      className="absolute top-2 right-2 bg-blue-600 text-white p-2 rounded-lg hover:bg-blue-700 transition-colors"
                      title="Download processed image"
                    >
                      <ArrowDownTrayIcon className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default BackgroundRemovalModal;
