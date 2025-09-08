const MessageService = require('../../src/services/messageService');
const Conversation = require('../../src/models/Conversation');
const Message = require('../../src/models/Message');

describe('MessageService', () => {
  let messageService;
  let mockConversation;
  let mockMessage;

  beforeEach(() => {
    messageService = new MessageService();
    mockConversation = global.testUtils.createMockConversation();
    mockMessage = global.testUtils.createMockMessage();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('createMessage', () => {
    it('should create a new message successfully', async () => {
      const messageData = {
        content: 'Test message',
        senderId: 'test-user-id',
        conversationId: 'test-conversation-id',
        type: 'text'
      };

      Message.create = jest.fn().mockResolvedValue(mockMessage);
      Conversation.findById = jest.fn().mockResolvedValue(mockConversation);

      const result = await messageService.createMessage(messageData);

      expect(Message.create).toHaveBeenCalledWith(messageData);
      expect(result).toEqual(mockMessage);
    });

    it('should throw error if conversation does not exist', async () => {
      const messageData = {
        content: 'Test message',
        senderId: 'test-user-id',
        conversationId: 'non-existent-conversation',
        type: 'text'
      };

      Conversation.findById = jest.fn().mockResolvedValue(null);

      await expect(messageService.createMessage(messageData))
        .rejects.toThrow('Conversation not found');
    });

    it('should throw error if sender is not a participant', async () => {
      const messageData = {
        content: 'Test message',
        senderId: 'non-participant-id',
        conversationId: 'test-conversation-id',
        type: 'text'
      };

      Conversation.findById = jest.fn().mockResolvedValue(mockConversation);

      await expect(messageService.createMessage(messageData))
        .rejects.toThrow('User is not a participant in this conversation');
    });
  });

  describe('getMessages', () => {
    it('should retrieve messages for a conversation', async () => {
      const conversationId = 'test-conversation-id';
      const limit = 20;
      const offset = 0;

      Message.find = jest.fn().mockReturnValue({
        sort: jest.fn().mockReturnValue({
          limit: jest.fn().mockReturnValue({
            skip: jest.fn().mockResolvedValue([mockMessage])
          })
        })
      });

      const result = await messageService.getMessages(conversationId, limit, offset);

      expect(Message.find).toHaveBeenCalledWith({ conversationId });
      expect(result).toEqual([mockMessage]);
    });

    it('should handle empty message list', async () => {
      const conversationId = 'test-conversation-id';

      Message.find = jest.fn().mockReturnValue({
        sort: jest.fn().mockReturnValue({
          limit: jest.fn().mockReturnValue({
            skip: jest.fn().mockResolvedValue([])
          })
        })
      });

      const result = await messageService.getMessages(conversationId);

      expect(result).toEqual([]);
    });
  });

  describe('updateMessage', () => {
    it('should update a message successfully', async () => {
      const messageId = 'test-message-id';
      const updateData = { content: 'Updated message content' };

      Message.findByIdAndUpdate = jest.fn().mockResolvedValue({
        ...mockMessage,
        ...updateData
      });

      const result = await messageService.updateMessage(messageId, updateData);

      expect(Message.findByIdAndUpdate).toHaveBeenCalledWith(
        messageId,
        updateData,
        { new: true }
      );
      expect(result.content).toBe(updateData.content);
    });

    it('should throw error if message not found', async () => {
      const messageId = 'non-existent-message-id';
      const updateData = { content: 'Updated message content' };

      Message.findByIdAndUpdate = jest.fn().mockResolvedValue(null);

      await expect(messageService.updateMessage(messageId, updateData))
        .rejects.toThrow('Message not found');
    });
  });

  describe('deleteMessage', () => {
    it('should delete a message successfully', async () => {
      const messageId = 'test-message-id';

      Message.findByIdAndDelete = jest.fn().mockResolvedValue(mockMessage);

      const result = await messageService.deleteMessage(messageId);

      expect(Message.findByIdAndDelete).toHaveBeenCalledWith(messageId);
      expect(result).toEqual(mockMessage);
    });

    it('should throw error if message not found', async () => {
      const messageId = 'non-existent-message-id';

      Message.findByIdAndDelete = jest.fn().mockResolvedValue(null);

      await expect(messageService.deleteMessage(messageId))
        .rejects.toThrow('Message not found');
    });
  });

  describe('addReaction', () => {
    it('should add a reaction to a message', async () => {
      const messageId = 'test-message-id';
      const userId = 'test-user-id';
      const emoji = '👍';

      Message.findById = jest.fn().mockResolvedValue(mockMessage);
      mockMessage.save = jest.fn().mockResolvedValue(mockMessage);

      const result = await messageService.addReaction(messageId, userId, emoji);

      expect(Message.findById).toHaveBeenCalledWith(messageId);
      expect(mockMessage.reactions).toContainEqual({
        userId,
        emoji,
        createdAt: expect.any(Date)
      });
      expect(mockMessage.save).toHaveBeenCalled();
      expect(result).toEqual(mockMessage);
    });

    it('should throw error if message not found', async () => {
      const messageId = 'non-existent-message-id';
      const userId = 'test-user-id';
      const emoji = '👍';

      Message.findById = jest.fn().mockResolvedValue(null);

      await expect(messageService.addReaction(messageId, userId, emoji))
        .rejects.toThrow('Message not found');
    });
  });

  describe('removeReaction', () => {
    it('should remove a reaction from a message', async () => {
      const messageId = 'test-message-id';
      const userId = 'test-user-id';
      const emoji = '👍';

      const messageWithReaction = {
        ...mockMessage,
        reactions: [
          { userId, emoji, createdAt: new Date() }
        ]
      };

      Message.findById = jest.fn().mockResolvedValue(messageWithReaction);
      messageWithReaction.save = jest.fn().mockResolvedValue(messageWithReaction);

      const result = await messageService.removeReaction(messageId, userId, emoji);

      expect(Message.findById).toHaveBeenCalledWith(messageId);
      expect(messageWithReaction.reactions).toHaveLength(0);
      expect(messageWithReaction.save).toHaveBeenCalled();
      expect(result).toEqual(messageWithReaction);
    });

    it('should throw error if message not found', async () => {
      const messageId = 'non-existent-message-id';
      const userId = 'test-user-id';
      const emoji = '👍';

      Message.findById = jest.fn().mockResolvedValue(null);

      await expect(messageService.removeReaction(messageId, userId, emoji))
        .rejects.toThrow('Message not found');
    });
  });

  describe('markAsRead', () => {
    it('should mark messages as read for a user', async () => {
      const conversationId = 'test-conversation-id';
      const userId = 'test-user-id';

      Message.updateMany = jest.fn().mockResolvedValue({ modifiedCount: 5 });

      const result = await messageService.markAsRead(conversationId, userId);

      expect(Message.updateMany).toHaveBeenCalledWith(
        {
          conversationId,
          senderId: { $ne: userId },
          readBy: { $ne: userId }
        },
        { $addToSet: { readBy: userId } }
      );
      expect(result.modifiedCount).toBe(5);
    });
  });

  describe('getUnreadCount', () => {
    it('should return unread message count for a user', async () => {
      const conversationId = 'test-conversation-id';
      const userId = 'test-user-id';

      Message.countDocuments = jest.fn().mockResolvedValue(3);

      const result = await messageService.getUnreadCount(conversationId, userId);

      expect(Message.countDocuments).toHaveBeenCalledWith({
        conversationId,
        senderId: { $ne: userId },
        readBy: { $ne: userId }
      });
      expect(result).toBe(3);
    });
  });

  describe('searchMessages', () => {
    it('should search messages by content', async () => {
      const conversationId = 'test-conversation-id';
      const query = 'test search';
      const userId = 'test-user-id';

      Message.find = jest.fn().mockReturnValue({
        sort: jest.fn().mockReturnValue({
          limit: jest.fn().mockReturnValue({
            skip: jest.fn().mockResolvedValue([mockMessage])
          })
        })
      });

      const result = await messageService.searchMessages(conversationId, query, userId);

      expect(Message.find).toHaveBeenCalledWith({
        conversationId,
        content: { $regex: query, $options: 'i' }
      });
      expect(result).toEqual([mockMessage]);
    });
  });
});
