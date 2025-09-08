const express = require('express');
const router = express.Router();
const Conversation = require('../models/Conversation');
const Message = require('../models/Message');
const { authenticateToken } = require('../middleware/auth');
const logger = require('../utils/logger');

// Create group chat
router.post('/create', authenticateToken, async (req, res) => {
  try {
    const { name, description, participants, avatar } = req.body;
    const createdBy = req.user.id;

    if (!name || !participants || !Array.isArray(participants)) {
      return res.status(400).json({ error: 'Name and participants are required' });
    }

    // Add creator to participants if not already included
    if (!participants.includes(createdBy)) {
      participants.push(createdBy);
    }

    // Create group conversation
    const conversation = await Conversation.createGroupConversation(
      name,
      participants,
      createdBy
    );

    // Set additional properties
    if (description) conversation.description = description;
    if (avatar) conversation.avatar = avatar;
    await conversation.save();

    // Send system message
    const systemMessage = new Message({
      senderId: 'system',
      conversationId: conversation._id,
      content: `${req.user.displayName || req.user.username} created the group "${name}"`,
      type: 'system'
    });
    await systemMessage.save();

    // Update conversation with last message
    conversation.lastMessage = systemMessage._id;
    await conversation.save();

    // Publish group creation event to Kafka
    if (global.kafkaService) {
      await global.kafkaService.publishGroupEvent(conversation._id, 'created', {
        name,
        description,
        participants,
        createdBy
      });
    }

    logger.info(`Group chat created: ${conversation._id} by user ${createdBy}`);
    res.status(201).json({ conversation });
  } catch (error) {
    logger.error('Error creating group chat:', error);
    res.status(500).json({ error: 'Failed to create group chat' });
  }
});

// Get group chat details
router.get('/:conversationId', authenticateToken, async (req, res) => {
  try {
    const { conversationId } = req.params;
    const userId = req.user.id;

    const conversation = await Conversation.findOne({
      _id: conversationId,
      type: 'group',
      'participants.userId': userId,
      isActive: true
    }).populate('lastMessage');

    if (!conversation) {
      return res.status(404).json({ error: 'Group chat not found' });
    }

    res.json({ conversation });
  } catch (error) {
    logger.error('Error fetching group chat:', error);
    res.status(500).json({ error: 'Failed to fetch group chat' });
  }
});

// Update group chat settings
router.put('/:conversationId/settings', authenticateToken, async (req, res) => {
  try {
    const { conversationId } = req.params;
    const userId = req.user.id;
    const { name, description, avatar, settings } = req.body;

    const conversation = await Conversation.findOne({
      _id: conversationId,
      type: 'group',
      'participants.userId': userId,
      isActive: true
    });

    if (!conversation) {
      return res.status(404).json({ error: 'Group chat not found' });
    }

    // Check if user has admin rights
    const participant = conversation.participants.find(p => p.userId === userId);
    if (!participant || participant.role !== 'admin') {
      return res.status(403).json({ error: 'Only admins can update group settings' });
    }

    // Update properties
    if (name) conversation.name = name;
    if (description !== undefined) conversation.description = description;
    if (avatar !== undefined) conversation.avatar = avatar;
    if (settings) {
      conversation.settings = { ...conversation.settings, ...settings };
    }

    await conversation.save();

    // Send system message about update
    const systemMessage = new Message({
      senderId: 'system',
      conversationId: conversation._id,
      content: `${req.user.displayName || req.user.username} updated group settings`,
      type: 'system'
    });
    await systemMessage.save();

    // Publish group update event
    if (global.kafkaService) {
      await global.kafkaService.publishGroupEvent(conversationId, 'updated', {
        name: conversation.name,
        description: conversation.description,
        settings: conversation.settings
      });
    }

    res.json({ conversation });
  } catch (error) {
    logger.error('Error updating group settings:', error);
    res.status(500).json({ error: 'Failed to update group settings' });
  }
});

// Add participants to group
router.post('/:conversationId/participants', authenticateToken, async (req, res) => {
  try {
    const { conversationId } = req.params;
    const userId = req.user.id;
    const { participants } = req.body;

    if (!participants || !Array.isArray(participants)) {
      return res.status(400).json({ error: 'Participants array is required' });
    }

    const conversation = await Conversation.findOne({
      _id: conversationId,
      type: 'group',
      'participants.userId': userId,
      isActive: true
    });

    if (!conversation) {
      return res.status(404).json({ error: 'Group chat not found' });
    }

    // Check if user has admin or moderator rights
    const participant = conversation.participants.find(p => p.userId === userId);
    if (!participant || !['admin', 'moderator'].includes(participant.role)) {
      return res.status(403).json({ error: 'Only admins and moderators can add participants' });
    }

    const addedParticipants = [];
    for (const newUserId of participants) {
      const result = await conversation.addParticipant(newUserId, 'member');
      if (result) {
        addedParticipants.push(newUserId);
      }
    }

    // Send system message
    const systemMessage = new Message({
      senderId: 'system',
      conversationId: conversation._id,
      content: `${req.user.displayName || req.user.username} added ${addedParticipants.length} participant(s) to the group`,
      type: 'system'
    });
    await systemMessage.save();

    // Send notifications to new participants
    if (global.notificationService) {
      for (const newUserId of addedParticipants) {
        await global.notificationService.sendGroupInvitationNotification(
          conversationId,
          conversation.name,
          [newUserId],
          {
            id: userId,
            displayName: req.user.displayName,
            username: req.user.username
          }
        );
      }
    }

    // Publish group update event
    if (global.kafkaService) {
      await global.kafkaService.publishGroupEvent(conversationId, 'participants_added', {
        addedParticipants,
        addedBy: userId
      });
    }

    res.json({ 
      message: 'Participants added successfully',
      addedParticipants 
    });
  } catch (error) {
    logger.error('Error adding participants:', error);
    res.status(500).json({ error: 'Failed to add participants' });
  }
});

// Remove participant from group
router.delete('/:conversationId/participants/:participantId', authenticateToken, async (req, res) => {
  try {
    const { conversationId, participantId } = req.params;
    const userId = req.user.id;

    const conversation = await Conversation.findOne({
      _id: conversationId,
      type: 'group',
      'participants.userId': userId,
      isActive: true
    });

    if (!conversation) {
      return res.status(404).json({ error: 'Group chat not found' });
    }

    // Check if user has admin rights or is removing themselves
    const participant = conversation.participants.find(p => p.userId === userId);
    const targetParticipant = conversation.participants.find(p => p.userId === participantId);

    if (!participant) {
      return res.status(403).json({ error: 'You are not a member of this group' });
    }

    if (participantId !== userId && participant.role !== 'admin') {
      return res.status(403).json({ error: 'Only admins can remove other participants' });
    }

    if (!targetParticipant) {
      return res.status(404).json({ error: 'Participant not found' });
    }

    // Remove participant
    await conversation.removeParticipant(participantId);

    // Send system message
    const systemMessage = new Message({
      senderId: 'system',
      conversationId: conversation._id,
      content: participantId === userId 
        ? `${req.user.displayName || req.user.username} left the group`
        : `${req.user.displayName || req.user.username} removed ${targetParticipant.userId} from the group`,
      type: 'system'
    });
    await systemMessage.save();

    // Publish group update event
    if (global.kafkaService) {
      await global.kafkaService.publishGroupEvent(conversationId, 'participant_removed', {
        removedParticipant: participantId,
        removedBy: userId
      });
    }

    res.json({ message: 'Participant removed successfully' });
  } catch (error) {
    logger.error('Error removing participant:', error);
    res.status(500).json({ error: 'Failed to remove participant' });
  }
});

// Update participant role
router.put('/:conversationId/participants/:participantId/role', authenticateToken, async (req, res) => {
  try {
    const { conversationId, participantId } = req.params;
    const userId = req.user.id;
    const { role } = req.body;

    if (!['admin', 'moderator', 'member'].includes(role)) {
      return res.status(400).json({ error: 'Invalid role' });
    }

    const conversation = await Conversation.findOne({
      _id: conversationId,
      type: 'group',
      'participants.userId': userId,
      isActive: true
    });

    if (!conversation) {
      return res.status(404).json({ error: 'Group chat not found' });
    }

    // Check if user has admin rights
    const participant = conversation.participants.find(p => p.userId === userId);
    if (!participant || participant.role !== 'admin') {
      return res.status(403).json({ error: 'Only admins can update participant roles' });
    }

    // Update role
    await conversation.updateParticipantRole(participantId, role);

    // Send system message
    const systemMessage = new Message({
      senderId: 'system',
      conversationId: conversation._id,
      content: `${req.user.displayName || req.user.username} updated ${participantId}'s role to ${role}`,
      type: 'system'
    });
    await systemMessage.save();

    // Publish group update event
    if (global.kafkaService) {
      await global.kafkaService.publishGroupEvent(conversationId, 'role_updated', {
        participantId,
        newRole: role,
        updatedBy: userId
      });
    }

    res.json({ message: 'Participant role updated successfully' });
  } catch (error) {
    logger.error('Error updating participant role:', error);
    res.status(500).json({ error: 'Failed to update participant role' });
  }
});

// Get group participants
router.get('/:conversationId/participants', authenticateToken, async (req, res) => {
  try {
    const { conversationId } = req.params;
    const userId = req.user.id;

    const conversation = await Conversation.findOne({
      _id: conversationId,
      type: 'group',
      'participants.userId': userId,
      isActive: true
    });

    if (!conversation) {
      return res.status(404).json({ error: 'Group chat not found' });
    }

    res.json({ participants: conversation.participants });
  } catch (error) {
    logger.error('Error fetching participants:', error);
    res.status(500).json({ error: 'Failed to fetch participants' });
  }
});

// Leave group
router.post('/:conversationId/leave', authenticateToken, async (req, res) => {
  try {
    const { conversationId } = req.params;
    const userId = req.user.id;

    const conversation = await Conversation.findOne({
      _id: conversationId,
      type: 'group',
      'participants.userId': userId,
      isActive: true
    });

    if (!conversation) {
      return res.status(404).json({ error: 'Group chat not found' });
    }

    // Check if user is the only admin
    const admins = conversation.participants.filter(p => p.role === 'admin');
    const userParticipant = conversation.participants.find(p => p.userId === userId);
    
    if (userParticipant && userParticipant.role === 'admin' && admins.length === 1) {
      return res.status(400).json({ 
        error: 'Cannot leave group as the only admin. Transfer admin role first or delete the group.' 
      });
    }

    // Remove user from group
    await conversation.removeParticipant(userId);

    // Send system message
    const systemMessage = new Message({
      senderId: 'system',
      conversationId: conversation._id,
      content: `${req.user.displayName || req.user.username} left the group`,
      type: 'system'
    });
    await systemMessage.save();

    // Publish group update event
    if (global.kafkaService) {
      await global.kafkaService.publishGroupEvent(conversationId, 'participant_left', {
        leftParticipant: userId
      });
    }

    res.json({ message: 'Successfully left the group' });
  } catch (error) {
    logger.error('Error leaving group:', error);
    res.status(500).json({ error: 'Failed to leave group' });
  }
});

// Delete group (admin only)
router.delete('/:conversationId', authenticateToken, async (req, res) => {
  try {
    const { conversationId } = req.params;
    const userId = req.user.id;

    const conversation = await Conversation.findOne({
      _id: conversationId,
      type: 'group',
      'participants.userId': userId,
      isActive: true
    });

    if (!conversation) {
      return res.status(404).json({ error: 'Group chat not found' });
    }

    // Check if user has admin rights
    const participant = conversation.participants.find(p => p.userId === userId);
    if (!participant || participant.role !== 'admin') {
      return res.status(403).json({ error: 'Only admins can delete the group' });
    }

    // Mark conversation as inactive
    conversation.isActive = false;
    await conversation.save();

    // Publish group deletion event
    if (global.kafkaService) {
      await global.kafkaService.publishGroupEvent(conversationId, 'deleted', {
        deletedBy: userId,
        participants: conversation.participants.map(p => p.userId)
      });
    }

    logger.info(`Group chat deleted: ${conversationId} by user ${userId}`);
    res.json({ message: 'Group deleted successfully' });
  } catch (error) {
    logger.error('Error deleting group:', error);
    res.status(500).json({ error: 'Failed to delete group' });
  }
});

module.exports = router;
