import React, { useState, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { useDropzone } from 'react-dropzone';
import { imageProcessingService, ImageProcessingOptions, ImageProcessingResult } from '../../services/image-processing.service';

const ImageProcessing: React.FC = () => {
  const { t } = useTranslation();
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [processingOptions, setProcessingOptions] = useState<ImageProcessingOptions>({
    backgroundRemoval: false,
    enhancement: false,
    cropping: false,
    resize: { width: 800, height: 600 },
    filters: []
  });
  const [isProcessing, setIsProcessing] = useState(false);
  const [processingResult, setProcessingResult] = useState<ImageProcessingResult | null>(null);
  const [processingHistory, setProcessingHistory] = useState<ImageProcessingResult[]>([]);

  const onDrop = useCallback((acceptedFiles: File[]) => {
    if (acceptedFiles.length > 0) {
      setSelectedFile(acceptedFiles[0]);
    }
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'image/*': ['.jpeg', '.jpg', '.png', '.gif', '.webp']
    },
    multiple: false
  });

  const handleOptionChange = (option: keyof ImageProcessingOptions, value: any) => {
    setProcessingOptions(prev => ({
      ...prev,
      [option]: value
    }));
  };

  const handleProcessImage = async () => {
    if (!selectedFile) return;

    setIsProcessing(true);
    try {
      const result = await imageProcessingService.processImage({
        file: selectedFile,
        options: processingOptions,
        userId: 'current-user-id' // TODO: Get from auth context
      });

      setProcessingResult(result);
      setProcessingHistory(prev => [result, ...prev]);
    } catch (error) {
      console.error('Image processing failed:', error);
      // TODO: Show error message to user
    } finally {
      setIsProcessing(false);
    }
  };

  const handleDownload = (result: ImageProcessingResult) => {
    const link = document.createElement('a');
    link.href = result.processedUrl;
    link.download = `processed-${Date.now()}.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">AI Image Processing</h1>
          <p className="text-gray-600">Transform your images with AI-powered processing</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Left Column - Upload & Options */}
          <div className="space-y-6">
            {/* File Upload */}
            <div className="card">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Upload Image</h3>
              <div
                {...getRootProps()}
                className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors ${
                  isDragActive
                    ? 'border-innkt-primary bg-innkt-light bg-opacity-10'
                    : 'border-gray-300 hover:border-innkt-primary'
                }`}
              >
                <input {...getInputProps()} />
                {selectedFile ? (
                  <div>
                    <div className="w-16 h-16 bg-innkt-primary rounded-lg flex items-center justify-center mx-auto mb-4">
                      <span className="text-2xl text-white">📷</span>
                    </div>
                    <p className="text-sm text-gray-600">{selectedFile.name}</p>
                    <p className="text-xs text-gray-500">
                      {(selectedFile.size / 1024 / 1024).toFixed(2)} MB
                    </p>
                  </div>
                ) : (
                  <div>
                    <div className="w-16 h-16 bg-gray-100 rounded-lg flex items-center justify-center mx-auto mb-4">
                      <span className="text-2xl text-gray-400">📁</span>
                    </div>
                    <p className="text-gray-600">
                      {isDragActive ? 'Drop the image here' : 'Drag & drop an image, or click to select'}
                    </p>
                    <p className="text-sm text-gray-500 mt-2">
                      Supports JPEG, PNG, GIF, WebP up to 10MB
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* Processing Options */}
            <div className="card">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Processing Options</h3>
              
              {/* Background Removal - Optional as requested */}
              <div className="mb-4">
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={processingOptions.backgroundRemoval}
                    onChange={(e) => handleOptionChange('backgroundRemoval', e.target.checked)}
                    className="h-4 w-4 text-innkt-primary focus:ring-innkt-primary border-gray-300 rounded"
                  />
                  <span className="ml-2 text-sm font-medium text-gray-900">
                    Background Removal (Optional)
                  </span>
                </label>
                <p className="text-xs text-gray-500 ml-6 mt-1">
                  Remove background for transparent or custom backgrounds
                </p>
              </div>

              {/* Enhancement */}
              <div className="mb-4">
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={processingOptions.enhancement}
                    onChange={(e) => handleOptionChange('enhancement', e.target.checked)}
                    className="h-4 w-4 text-innkt-primary focus:ring-innkt-primary border-gray-300 rounded"
                  />
                  <span className="ml-2 text-sm font-medium text-gray-900">AI Enhancement</span>
                </label>
                <p className="text-xs text-gray-500 ml-6 mt-1">
                  Improve image quality, colors, and details
                </p>
              </div>

              {/* Cropping */}
              <div className="mb-4">
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={processingOptions.cropping}
                    onChange={(e) => handleOptionChange('cropping', e.target.checked)}
                    className="h-4 w-4 text-innkt-primary focus:ring-innkt-primary border-gray-300 rounded"
                  />
                  <span className="ml-2 text-sm font-medium text-gray-900">Smart Cropping</span>
                </label>
                <p className="text-xs text-gray-500 ml-6 mt-1">
                  AI-powered intelligent cropping and composition
                </p>
              </div>

              {/* Resize Options */}
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">Resize Options</label>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs text-gray-500 mb-1">Width (px)</label>
                    <input
                      type="number"
                      value={processingOptions.resize?.width || 800}
                      onChange={(e) => handleOptionChange('resize', { 
                        ...processingOptions.resize, 
                        width: parseInt(e.target.value) 
                      })}
                      className="input-field text-sm"
                      min="100"
                      max="4000"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-gray-500 mb-1">Height (px)</label>
                    <input
                      type="number"
                      value={processingOptions.resize?.height || 600}
                      onChange={(e) => handleOptionChange('resize', { 
                        ...processingOptions.resize, 
                        height: parseInt(e.target.value) 
                      })}
                      className="input-field text-sm"
                      min="100"
                      max="4000"
                    />
                  </div>
                </div>
              </div>

              {/* Process Button */}
              <button
                onClick={handleProcessImage}
                disabled={!selectedFile || isProcessing}
                className="w-full btn-primary py-3 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isProcessing ? 'Processing...' : 'Process Image'}
              </button>
            </div>
          </div>

          {/* Right Column - Results & History */}
          <div className="space-y-6">
            {/* Current Result */}
            {processingResult && (
              <div className="card">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Processing Result</h3>
                <div className="space-y-4">
                  <div className="aspect-video bg-gray-100 rounded-lg overflow-hidden">
                    <img
                      src={processingResult.processedUrl}
                      alt="Processed"
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div className="flex justify-between items-center">
                    <div className="text-sm text-gray-600">
                      Processing time: {processingResult.processingTime}ms
                    </div>
                    <button
                      onClick={() => handleDownload(processingResult)}
                      className="btn-secondary text-sm px-4 py-2"
                    >
                      Download
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Processing History */}
            {processingHistory.length > 0 && (
              <div className="card">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Processing History</h3>
                <div className="space-y-3 max-h-96 overflow-y-auto">
                  {processingHistory.map((result) => (
                    <div key={result.id} className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
                      <div className="w-12 h-12 bg-gray-200 rounded-lg overflow-hidden flex-shrink-0">
                        <img
                          src={result.processedUrl}
                          alt="History"
                          className="w-full h-full object-cover"
                        />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-900 truncate">
                          {new Date(result.createdAt).toLocaleDateString()}
                        </p>
                        <p className="text-xs text-gray-500">
                          {result.processingOptions.backgroundRemoval ? 'BG Removed' : ''}
                          {result.processingOptions.enhancement ? ' Enhanced' : ''}
                          {result.processingOptions.cropping ? ' Cropped' : ''}
                        </p>
                      </div>
                      <button
                        onClick={() => handleDownload(result)}
                        className="text-innkt-primary hover:text-innkt-dark text-sm font-medium"
                      >
                        Download
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ImageProcessing;



