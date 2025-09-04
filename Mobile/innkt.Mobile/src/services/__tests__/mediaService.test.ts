import { Platform, Dimensions } from 'react-native';
import { launchImageLibrary, launchCamera, ImagePickerResponse, MediaType } from 'react-native-image-picker';
import { manipulateAsync, SaveFormat, ImageResult } from 'expo-image-manipulator';
import { Video, ResizeMode } from 'expo-av';
import { Camera } from 'expo-camera';
import { MediaLibrary } from 'expo-media-library';
import { FileSystem } from 'expo-file-system';
import { mediaService, MediaFile, MediaProcessingOptions, MediaFilter, WatermarkOptions } from '../media/mediaService';
import { officerApiClient, frontierApiClient } from '../api/apiClient';

// Mock dependencies
jest.mock('react-native', () => ({
  Platform: {
    OS: 'ios',
    select: jest.fn((obj) => obj.ios),
  },
  Dimensions: {
    get: jest.fn(() => ({ width: 375, height: 812 })),
  },
}));

jest.mock('react-native-image-picker', () => ({
  launchImageLibrary: jest.fn(),
  launchCamera: jest.fn(),
  ImagePickerResponse: jest.fn(),
  MediaType: { photo: 'photo', video: 'video' },
}));

jest.mock('expo-image-manipulator', () => ({
  manipulateAsync: jest.fn(),
  SaveFormat: { JPEG: 'jpeg', PNG: 'png' },
}));

jest.mock('expo-av', () => ({
  Video: 'Video',
  ResizeMode: { CONTAIN: 'contain', COVER: 'cover', STRETCH: 'stretch' },
}));

jest.mock('expo-camera', () => ({
  Camera: 'Camera',
  CameraType: { front: 'front', back: 'back' },
}));

jest.mock('expo-media-library', () => ({
  MediaLibrary: {
    createAssetAsync: jest.fn(),
    getAssetsAsync: jest.fn(),
    getAlbumAsync: jest.fn(),
    createAlbumAsync: jest.fn(),
    addAssetsToAlbumAsync: jest.fn(),
    removeAssetsFromAlbumAsync: jest.fn(),
    deleteAssetsAsync: jest.fn(),
    getAssetInfoAsync: jest.fn(),
    requestPermissionsAsync: jest.fn(),
    getPermissionsAsync: jest.fn(),
  },
}));

jest.mock('expo-file-system', () => ({
  FileSystem: {
    documentDirectory: '/mock/document/directory/',
    cacheDirectory: '/mock/cache/directory/',
    readAsStringAsync: jest.fn(),
    writeAsStringAsync: jest.fn(),
    deleteAsync: jest.fn(),
    moveAsync: jest.fn(),
    copyAsync: jest.fn(),
    makeDirectoryAsync: jest.fn(),
    readDirectoryAsync: jest.fn(),
    getInfoAsync: jest.fn(),
  },
}));

jest.mock('../api/apiClient', () => ({
  officerApiClient: {
    post: jest.fn(),
    get: jest.fn(),
    put: jest.fn(),
    delete: jest.fn(),
  },
  frontierApiClient: {
    post: jest.fn(),
    get: jest.fn(),
    put: jest.fn(),
    delete: jest.fn(),
  },
}));

describe('MediaService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Media capture', () => {
    it('should launch image library successfully', async () => {
      const mockResponse: ImagePickerResponse = {
        didCancel: false,
        errorCode: undefined,
        errorMessage: undefined,
        assets: [
          {
            uri: 'file://mock-image.jpg',
            type: 'image/jpeg',
            fileName: 'mock-image.jpg',
            fileSize: 1024000,
            width: 1920,
            height: 1080,
          },
        ],
      };

      (launchImageLibrary as jest.Mock).mockResolvedValue(mockResponse);

      const result = await mediaService.pickImage();

      expect(launchImageLibrary).toHaveBeenCalledWith({
        mediaType: 'photo',
        quality: 0.8,
        includeBase64: false,
        maxWidth: 1920,
        maxHeight: 1080,
      });
      expect(result).toEqual(mockResponse.assets![0]);
    });

    it('should launch camera successfully', async () => {
      const mockResponse: ImagePickerResponse = {
        didCancel: false,
        errorCode: undefined,
        errorMessage: undefined,
        assets: [
          {
            uri: 'file://mock-photo.jpg',
            type: 'image/jpeg',
            fileName: 'mock-photo.jpg',
            fileSize: 512000,
            width: 1920,
            height: 1080,
          },
        ],
      };

      (launchCamera as jest.Mock).mockResolvedValue(mockResponse);

      const result = await mediaService.takePhoto();

      expect(launchCamera).toHaveBeenCalledWith({
        mediaType: 'photo',
        quality: 0.8,
        includeBase64: false,
        maxWidth: 1920,
        maxHeight: 1080,
      });
      expect(result).toEqual(mockResponse.assets![0]);
    });

    it('should handle image picker cancellation', async () => {
      const mockResponse: ImagePickerResponse = {
        didCancel: true,
        errorCode: undefined,
        errorMessage: undefined,
        assets: undefined,
      };

      (launchImageLibrary as jest.Mock).mockResolvedValue(mockResponse);

      const result = await mediaService.pickImage();

      expect(result).toBeNull();
    });

    it('should handle image picker errors', async () => {
      const mockResponse: ImagePickerResponse = {
        didCancel: false,
        errorCode: 'camera_unavailable',
        errorMessage: 'Camera is not available',
        assets: undefined,
      };

      (launchImageLibrary as jest.Mock).mockResolvedValue(mockResponse);

      await expect(mediaService.pickImage()).rejects.toThrow('Camera is not available');
    });
  });

  describe('Image processing', () => {
    it('should process image with basic options', async () => {
      const mockImageResult: ImageResult = {
        uri: 'file://processed-image.jpg',
        width: 800,
        height: 600,
        base64: undefined,
      };

      (manipulateAsync as jest.Mock).mockResolvedValue(mockImageResult);

      const options: MediaProcessingOptions = {
        quality: 0.8,
        format: SaveFormat.JPEG,
      };

      const result = await mediaService.processImage('file://original-image.jpg', options);

      expect(manipulateAsync).toHaveBeenCalledWith(
        'file://original-image.jpg',
        [],
        options
      );
      expect(result).toEqual(mockImageResult);
    });

    it('should resize image', async () => {
      const mockImageResult: ImageResult = {
        uri: 'file://resized-image.jpg',
        width: 400,
        height: 300,
        base64: undefined,
      };

      (manipulateAsync as jest.Mock).mockResolvedValue(mockImageResult);

      const options: MediaProcessingOptions = {
        resize: { width: 400, height: 300 },
        quality: 0.8,
        format: SaveFormat.JPEG,
      };

      const result = await mediaService.processImage('file://original-image.jpg', options);

      expect(manipulateAsync).toHaveBeenCalledWith(
        'file://original-image.jpg',
        [{ resize: { width: 400, height: 300 } }],
        { quality: 0.8, format: 'jpeg' }
      );
      expect(result).toEqual(mockImageResult);
    });

    it('should crop image', async () => {
      const mockImageResult: ImageResult = {
        uri: 'file://cropped-image.jpg',
        width: 300,
        height: 300,
        base64: undefined,
      };

      (manipulateAsync as jest.Mock).mockResolvedValue(mockImageResult);

      const options: MediaProcessingOptions = {
        crop: { x: 100, y: 100, width: 300, height: 300 },
        quality: 0.8,
        format: SaveFormat.JPEG,
      };

      const result = await mediaService.processImage('file://original-image.jpg', options);

      expect(manipulateAsync).toHaveBeenCalledWith(
        'file://original-image.jpg',
        [{ crop: { x: 100, y: 100, width: 300, height: 300 } }],
        { quality: 0.8, format: 'jpeg' }
      );
      expect(result).toEqual(mockImageResult);
    });

    it('should apply filters to image', async () => {
      const mockImageResult: ImageResult = {
        uri: 'file://filtered-image.jpg',
        width: 800,
        height: 600,
        base64: undefined,
      };

      (manipulateAsync as jest.Mock).mockResolvedValue(mockImageResult);

      const options: MediaProcessingOptions = {
        filters: [MediaFilter.BRIGHTNESS, MediaFilter.CONTRAST],
        quality: 0.8,
        format: SaveFormat.JPEG,
      };

      const result = await mediaService.processImage('file://original-image.jpg', options);

      expect(manipulateAsync).toHaveBeenCalledWith(
        'file://original-image.jpg',
        [
          { brightness: 1.2 },
          { contrast: 1.1 },
        ],
        { quality: 0.8, format: 'jpeg' }
      );
      expect(result).toEqual(mockImageResult);
    });

    it('should add watermark to image', async () => {
      const mockImageResult: ImageResult = {
        uri: 'file://watermarked-image.jpg',
        width: 800,
        height: 600,
        base64: undefined,
      };

      (manipulateAsync as jest.Mock).mockResolvedValue(mockImageResult);

      const watermarkOptions: WatermarkOptions = {
        text: 'Innkt',
        position: 'bottom-right',
        fontSize: 24,
        color: '#FFFFFF',
        opacity: 0.8,
      };

      const options: MediaProcessingOptions = {
        watermark: watermarkOptions,
        quality: 0.8,
        format: SaveFormat.JPEG,
      };

      const result = await mediaService.processImage('file://original-image.jpg', options);

      expect(manipulateAsync).toHaveBeenCalledWith(
        'file://original-image.jpg',
        [{ watermark: watermarkOptions }],
        { quality: 0.8, format: 'jpeg' }
      );
      expect(result).toEqual(mockImageResult);
    });

    it('should handle processing errors gracefully', async () => {
      (manipulateAsync as jest.Mock).mockRejectedValue(new Error('Processing failed'));

      const options: MediaProcessingOptions = {
        quality: 0.8,
        format: SaveFormat.JPEG,
      };

      await expect(mediaService.processImage('file://invalid-image.jpg', options))
        .rejects.toThrow('Processing failed');
    });
  });

  describe('Video processing', () => {
    it('should get video info', async () => {
      const videoUri = 'file://mock-video.mp4';
      const mockVideoInfo = {
        duration: 30000, // 30 seconds
        size: 10240000, // 10MB
        width: 1920,
        height: 1080,
        bitrate: 2000000, // 2Mbps
      };

      // Mock video info extraction
      const result = await mediaService.getVideoInfo(videoUri);

      expect(result).toBeDefined();
      expect(typeof result.duration).toBe('number');
    });

    it('should compress video', async () => {
      const videoUri = 'file://mock-video.mp4';
      const compressedUri = 'file://compressed-video.mp4';

      const result = await mediaService.compressVideo(videoUri, {
        quality: 'medium',
        bitrate: 1000000, // 1Mbps
      });

      expect(result).toBeDefined();
      expect(result.uri).toBeDefined();
    });

    it('should extract video thumbnail', async () => {
      const videoUri = 'file://mock-video.mp4';
      const thumbnailUri = 'file://thumbnail.jpg';

      const result = await mediaService.extractVideoThumbnail(videoUri, {
        time: 5000, // 5 seconds
        quality: 0.8,
      });

      expect(result).toBeDefined();
      expect(result.uri).toBeDefined();
    });
  });

  describe('Media upload', () => {
    it('should upload image successfully', async () => {
      const mockResponse = {
        data: {
          id: 'media123',
          url: 'https://cdn.innkt.com/media123.jpg',
          thumbnailUrl: 'https://cdn.innkt.com/thumbnails/media123.jpg',
        },
      };

      (frontierApiClient.post as jest.Mock).mockResolvedValue(mockResponse);

      const mediaFile: MediaFile = {
        uri: 'file://mock-image.jpg',
        type: 'image/jpeg',
        fileName: 'mock-image.jpg',
        fileSize: 1024000,
        width: 1920,
        height: 1080,
      };

      const result = await mediaService.uploadMedia(mediaFile, 'posts');

      expect(frontierApiClient.post).toHaveBeenCalledWith(
        '/api/media/upload',
        expect.any(FormData)
      );
      expect(result).toEqual(mockResponse.data);
    });

    it('should handle upload progress', async () => {
      const mockResponse = {
        data: {
          id: 'media123',
          url: 'https://cdn.innkt.com/media123.jpg',
        },
      };

      (frontierApiClient.post as jest.Mock).mockResolvedValue(mockResponse);

      const mediaFile: MediaFile = {
        uri: 'file://mock-image.jpg',
        type: 'image/jpeg',
        fileName: 'mock-image.jpg',
        fileSize: 1024000,
        width: 1920,
        height: 1080,
      };

      const progressCallback = jest.fn();

      const result = await mediaService.uploadMedia(mediaFile, 'posts', progressCallback);

      expect(progressCallback).toHaveBeenCalled();
      expect(result).toEqual(mockResponse.data);
    });

    it('should handle upload errors', async () => {
      (frontierApiClient.post as jest.Mock).mockRejectedValue(new Error('Upload failed'));

      const mediaFile: MediaFile = {
        uri: 'file://mock-image.jpg',
        type: 'image/jpeg',
        fileName: 'mock-image.jpg',
        fileSize: 1024000,
        width: 1920,
        height: 1080,
      };

      await expect(mediaService.uploadMedia(mediaFile, 'posts'))
        .rejects.toThrow('Upload failed');
    });
  });

  describe('Media management', () => {
    it('should delete media file', async () => {
      const mediaId = 'media123';
      const mockResponse = { data: { success: true } };

      (frontierApiClient.delete as jest.Mock).mockResolvedValue(mockResponse);

      const result = await mediaService.deleteMedia(mediaId);

      expect(frontierApiClient.delete).toHaveBeenCalledWith(`/api/media/${mediaId}`);
      expect(result).toBe(true);
    });

    it('should get media info', async () => {
      const mediaId = 'media123';
      const mockResponse = {
        data: {
          id: mediaId,
          url: 'https://cdn.innkt.com/media123.jpg',
          type: 'image/jpeg',
          size: 1024000,
          width: 1920,
          height: 1080,
          createdAt: '2024-01-01T00:00:00Z',
        },
      };

      (frontierApiClient.get as jest.Mock).mockResolvedValue(mockResponse);

      const result = await mediaService.getMediaInfo(mediaId);

      expect(frontierApiClient.get).toHaveBeenCalledWith(`/api/media/${mediaId}`);
      expect(result).toEqual(mockResponse.data);
    });

    it('should save media to gallery', async () => {
      const mediaUri = 'file://mock-image.jpg';
      const mockAsset = {
        id: 'asset123',
        filename: 'mock-image.jpg',
        uri: mediaUri,
      };

      (MediaLibrary.createAssetAsync as jest.Mock).mockResolvedValue(mockAsset);

      const result = await mediaService.saveToGallery(mediaUri);

      expect(MediaLibrary.createAssetAsync).toHaveBeenCalledWith(mediaUri);
      expect(result).toEqual(mockAsset);
    });

    it('should request media library permissions', async () => {
      const mockPermissions = {
        status: 'granted',
        canAskAgain: true,
        expires: 'never',
      };

      (MediaLibrary.requestPermissionsAsync as jest.Mock).mockResolvedValue(mockPermissions);

      const result = await mediaService.requestMediaLibraryPermissions();

      expect(MediaLibrary.requestPermissionsAsync).toHaveBeenCalled();
      expect(result).toEqual(mockPermissions);
    });
  });

  describe('Utility methods', () => {
    it('should get file extension from URI', () => {
      const jpgUri = 'file://image.jpg';
      const pngUri = 'file://image.png';
      const mp4Uri = 'file://video.mp4';

      expect(mediaService.getFileExtension(jpgUri)).toBe('jpg');
      expect(mediaService.getFileExtension(pngUri)).toBe('png');
      expect(mediaService.getFileExtension(mp4Uri)).toBe('mp4');
    });

    it('should check if file is image', () => {
      const jpgUri = 'file://image.jpg';
      const pngUri = 'file://image.png';
      const mp4Uri = 'file://video.mp4';

      expect(mediaService.isImage(jpgUri)).toBe(true);
      expect(mediaService.isImage(pngUri)).toBe(true);
      expect(mediaService.isImage(mp4Uri)).toBe(false);
    });

    it('should check if file is video', () => {
      const jpgUri = 'file://image.jpg';
      const mp4Uri = 'file://video.mp4';
      const aviUri = 'file://video.avi';

      expect(mediaService.isVideo(jpgUri)).toBe(false);
      expect(mediaService.isVideo(mp4Uri)).toBe(true);
      expect(mediaService.isVideo(aviUri)).toBe(true);
    });

    it('should format file size', () => {
      expect(mediaService.formatFileSize(1024)).toBe('1.0 KB');
      expect(mediaService.formatFileSize(1024 * 1024)).toBe('1.0 MB');
      expect(mediaService.formatFileSize(1024 * 1024 * 1024)).toBe('1.0 GB');
    });

    it('should get optimal image dimensions', () => {
      const originalDimensions = { width: 1920, height: 1080 };
      const maxDimensions = { width: 800, height: 600 };

      const result = mediaService.getOptimalDimensions(originalDimensions, maxDimensions);

      expect(result.width).toBeLessThanOrEqual(maxDimensions.width);
      expect(result.height).toBeLessThanOrEqual(maxDimensions.height);
      expect(result.width / result.height).toBeCloseTo(originalDimensions.width / originalDimensions.height);
    });
  });

  describe('Error handling', () => {
    it('should handle permission denied errors', async () => {
      (MediaLibrary.requestPermissionsAsync as jest.Mock).mockResolvedValue({
        status: 'denied',
        canAskAgain: false,
      });

      await expect(mediaService.requestMediaLibraryPermissions()).resolves.toEqual({
        status: 'denied',
        canAskAgain: false,
      });
    });

    it('should handle file system errors', async () => {
      (FileSystem.getInfoAsync as jest.Mock).mockRejectedValue(new Error('File not found'));

      await expect(mediaService.getFileInfo('file://non-existent.jpg'))
        .rejects.toThrow('File not found');
    });

    it('should handle network errors during upload', async () => {
      (frontierApiClient.post as jest.Mock).mockRejectedValue(new Error('Network error'));

      const mediaFile: MediaFile = {
        uri: 'file://mock-image.jpg',
        type: 'image/jpeg',
        fileName: 'mock-image.jpg',
        fileSize: 1024000,
        width: 1920,
        height: 1080,
      };

      await expect(mediaService.uploadMedia(mediaFile, 'posts'))
        .rejects.toThrow('Network error');
    });
  });
});





