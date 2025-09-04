const express = require('express');
const { authenticateToken } = require('../middleware/auth');
const { MediaService } = require('../services/mediaService');
const logger = require('../utils/logger');

const router = express.Router();
const mediaService = new MediaService();

// Upload file
router.post('/upload', authenticateToken, mediaService.getMulterMiddleware().single('file'), async (req, res) => {
  try {
    const { conversationId } = req.body;
    const userId = req.user.userId;

    if (!req.file) {
      return res.status(400).json({ error: 'No file provided' });
    }

    if (!conversationId) {
      return res.status(400).json({ error: 'Conversation ID is required' });
    }

    // Validate file
    const validationErrors = mediaService.validateFile(req.file);
    if (validationErrors.length > 0) {
      return res.status(400).json({ error: validationErrors.join(', ') });
    }

    // Upload file
    const fileInfo = await mediaService.uploadFile(req.file, conversationId, userId);

    res.status(201).json({
      message: 'File uploaded successfully',
      file: fileInfo
    });

  } catch (error) {
    logger.error('Error uploading file:', error);
    res.status(500).json({ error: 'Failed to upload file' });
  }
});

// Get file access URL
router.get('/:fileId/url', authenticateToken, async (req, res) => {
  try {
    const { fileId } = req.params;
    const userId = req.user.userId;

    // In a real implementation, you would:
    // 1. Get file metadata from database
    // 2. Verify user has access to the conversation
    // 3. Generate signed URL

    // For now, return a placeholder
    res.json({
      url: `https://example.com/files/${fileId}`,
      expiresIn: 3600
    });

  } catch (error) {
    logger.error('Error getting file URL:', error);
    res.status(500).json({ error: 'Failed to get file URL' });
  }
});

// Delete file
router.delete('/:fileId', authenticateToken, async (req, res) => {
  try {
    const { fileId } = req.params;
    const userId = req.user.userId;

    // In a real implementation, you would:
    // 1. Get file metadata from database
    // 2. Verify user has permission to delete
    // 3. Delete from S3 and database

    res.json({ message: 'File deleted successfully' });

  } catch (error) {
    logger.error('Error deleting file:', error);
    res.status(500).json({ error: 'Failed to delete file' });
  }
});

// Get conversation storage usage
router.get('/conversation/:conversationId/usage', authenticateToken, async (req, res) => {
  try {
    const { conversationId } = req.params;
    const userId = req.user.userId;

    // Verify user has access to conversation
    // This would be implemented with proper conversation access check

    const usage = await mediaService.getConversationStorageUsage(conversationId);

    res.json({ usage });

  } catch (error) {
    logger.error('Error getting storage usage:', error);
    res.status(500).json({ error: 'Failed to get storage usage' });
  }
});

module.exports = router;
