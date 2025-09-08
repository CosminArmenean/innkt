const express = require('express');
const router = express.Router();
const FileUploadService = require('../services/fileUploadService');
const Message = require('../models/Message');
const Conversation = require('../models/Conversation');
const { authenticateToken } = require('../middleware/auth');
const logger = require('../utils/logger');

const fileUploadService = new FileUploadService();

// Upload file to conversation
router.post('/upload/:conversationId', authenticateToken, fileUploadService.upload.single('file'), async (req, res) => {
  try {
    const { conversationId } = req.params;
    const userId = req.user.id;
    const { message } = req.body;

    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    // Verify user is participant in conversation
    const conversation = await Conversation.findOne({
      _id: conversationId,
      'participants.userId': userId,
      isActive: true
    });

    if (!conversation) {
      // Clean up uploaded file
      await fileUploadService.deleteFile(req.file.path);
      return res.status(404).json({ error: 'Conversation not found or access denied' });
    }

    // Check if file sharing is allowed in this conversation
    if (conversation.type === 'group' && !conversation.settings.allowFileSharing) {
      // Clean up uploaded file
      await fileUploadService.deleteFile(req.file.path);
      return res.status(403).json({ error: 'File sharing is not allowed in this group' });
    }

    // Scan file for security
    const scanResult = await fileUploadService.scanFile(req.file.path);
    if (!scanResult.safe) {
      // Clean up uploaded file
      await fileUploadService.deleteFile(req.file.path);
      return res.status(400).json({ error: `File rejected: ${scanResult.message}` });
    }

    // Get file info
    const fileInfo = fileUploadService.getFileInfo(req.file);
    const filePreview = await fileUploadService.getFilePreview(req.file.path, req.file.mimetype);

    // Create message with file attachment
    const newMessage = new Message({
      senderId: userId,
      conversationId,
      content: message || `Shared a ${fileInfo.category === 'images' ? 'photo' : 'file'}`,
      type: fileInfo.category === 'images' ? 'image' : 'file',
      media: {
        url: fileInfo.url,
        type: req.file.mimetype,
        size: req.file.size,
        name: req.file.originalname,
        filename: req.file.filename,
        preview: filePreview
      },
      metadata: {
        originalName: req.file.originalname,
        category: fileInfo.category,
        uploadedAt: new Date().toISOString()
      }
    });

    await newMessage.save();

    // Update conversation with last message
    conversation.lastMessage = newMessage._id;
    await conversation.save();

    // Publish file upload event to Kafka
    if (global.kafkaService) {
      await global.kafkaService.publishMessageEvent(conversationId, newMessage._id, 'file_uploaded', {
        fileName: req.file.originalname,
        fileType: req.file.mimetype,
        fileSize: req.file.size,
        senderId: userId
      });
    }

    logger.info(`File uploaded: ${req.file.originalname} to conversation ${conversationId} by user ${userId}`);

    res.status(201).json({
      message: 'File uploaded successfully',
      messageId: newMessage._id,
      file: {
        id: newMessage._id,
        name: req.file.originalname,
        type: req.file.mimetype,
        size: req.file.size,
        url: fileInfo.url,
        preview: filePreview
      }
    });
  } catch (error) {
    // Clean up uploaded file on error
    if (req.file) {
      try {
        await fileUploadService.deleteFile(req.file.path);
      } catch (cleanupError) {
        logger.error('Error cleaning up file after upload error:', cleanupError);
      }
    }

    logger.error('Error uploading file:', error);
    res.status(500).json({ error: 'Failed to upload file' });
  }
});

// Get file info
router.get('/info/:messageId', authenticateToken, async (req, res) => {
  try {
    const { messageId } = req.params;
    const userId = req.user.id;

    const message = await Message.findOne({
      _id: messageId,
      type: { $in: ['image', 'file'] }
    });

    if (!message) {
      return res.status(404).json({ error: 'File message not found' });
    }

    // Verify user is participant in conversation
    const conversation = await Conversation.findOne({
      _id: message.conversationId,
      'participants.userId': userId,
      isActive: true
    });

    if (!conversation) {
      return res.status(404).json({ error: 'Conversation not found or access denied' });
    }

    res.json({
      file: {
        id: message._id,
        name: message.media.name,
        type: message.media.type,
        size: message.media.size,
        url: message.media.url,
        preview: message.media.preview,
        uploadedAt: message.metadata.uploadedAt
      }
    });
  } catch (error) {
    logger.error('Error getting file info:', error);
    res.status(500).json({ error: 'Failed to get file info' });
  }
});

// Delete file
router.delete('/:messageId', authenticateToken, async (req, res) => {
  try {
    const { messageId } = req.params;
    const userId = req.user.id;

    const message = await Message.findOne({
      _id: messageId,
      senderId: userId, // Only sender can delete their files
      type: { $in: ['image', 'file'] }
    });

    if (!message) {
      return res.status(404).json({ error: 'File message not found or access denied' });
    }

    // Delete physical file
    const filePath = message.media.filename ? 
      `./uploads/${message.metadata.category}/${message.media.filename}` : null;
    
    if (filePath) {
      try {
        await fileUploadService.deleteFile(filePath);
      } catch (fileError) {
        logger.warn(`Could not delete physical file ${filePath}:`, fileError);
      }
    }

    // Delete message
    await Message.findByIdAndDelete(messageId);

    // Publish file deletion event to Kafka
    if (global.kafkaService) {
      await global.kafkaService.publishMessageEvent(
        message.conversationId, 
        messageId, 
        'file_deleted', 
        {
          fileName: message.media.name,
          deletedBy: userId
        }
      );
    }

    logger.info(`File deleted: ${message.media.name} by user ${userId}`);

    res.json({ message: 'File deleted successfully' });
  } catch (error) {
    logger.error('Error deleting file:', error);
    res.status(500).json({ error: 'Failed to delete file' });
  }
});

// Get upload limits and allowed types
router.get('/limits', authenticateToken, (req, res) => {
  res.json({
    maxFileSize: fileUploadService.getMaxFileSizeMB(),
    allowedTypes: fileUploadService.getAllowedFileTypes(),
    allowedExtensions: Object.values(fileUploadService.allowedFileTypes)
  });
});

// Serve uploaded files (with access control)
router.get('/serve/:category/:filename', authenticateToken, async (req, res) => {
  try {
    const { category, filename } = req.params;
    const userId = req.user.id;

    // Find message with this file
    const message = await Message.findOne({
      'media.filename': filename,
      'metadata.category': category
    });

    if (!message) {
      return res.status(404).json({ error: 'File not found' });
    }

    // Verify user is participant in conversation
    const conversation = await Conversation.findOne({
      _id: message.conversationId,
      'participants.userId': userId,
      isActive: true
    });

    if (!conversation) {
      return res.status(404).json({ error: 'Access denied' });
    }

    const filePath = `./uploads/${category}/${filename}`;
    
    // Set appropriate headers
    res.setHeader('Content-Type', message.media.type);
    res.setHeader('Content-Disposition', `inline; filename="${message.media.name}"`);
    
    // Send file
    res.sendFile(path.resolve(filePath));
  } catch (error) {
    logger.error('Error serving file:', error);
    res.status(500).json({ error: 'Failed to serve file' });
  }
});

module.exports = router;
