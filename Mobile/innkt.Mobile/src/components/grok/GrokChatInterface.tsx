import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { useTheme } from 'react-native-paper';
import { useLanguage } from '../../contexts/LanguageContext';
import { grokService } from '../../services/grok/grokService';
import { kidSafetyService } from '../../services/kidSafety/kidSafetyService';

interface ChatMessage {
  id: string;
  type: 'user' | 'grok' | 'system';
  content: string;
  timestamp: Date;
  isEducational?: boolean;
  safetyScore?: number;
  sources?: string[];
  followUpQuestions?: string[];
}

interface GrokChatInterfaceProps {
  kidAccountId: string;
  userId: string;
  isKidAccount: boolean;
  onSafetyAlert?: (alert: any) => void;
}

export const GrokChatInterface: React.FC<GrokChatInterfaceProps> = ({
  kidAccountId,
  userId,
  isKidAccount,
  onSafetyAlert,
}) => {
  const theme = useTheme();
  const { t } = useLanguage();
  const scrollViewRef = useRef<ScrollView>(null);
  
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputText, setInputText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isTyping, setIsTyping] = useState(false);

  // Initialize chat with welcome message
  useEffect(() => {
    const welcomeMessage: ChatMessage = {
      id: 'welcome',
      type: 'grok',
      content: isKidAccount 
        ? t('grok.welcome.kid')
        : t('grok.welcome.adult'),
      timestamp: new Date(),
      isEducational: true,
      safetyScore: 1.0,
      followUpQuestions: isKidAccount ? [
        t('grok.suggestions.homework'),
        t('grok.suggestions.science'),
        t('grok.suggestions.creative'),
      ] : [
        t('grok.suggestions.general1'),
        t('grok.suggestions.general2'),
        t('grok.suggestions.general3'),
      ],
    };
    
    setMessages([welcomeMessage]);
  }, [isKidAccount, t]);

  const handleSendMessage = async () => {
    if (!inputText.trim() || isLoading) return;

    const userMessage: ChatMessage = {
      id: `user_${Date.now()}`,
      type: 'user',
      content: inputText.trim(),
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, userMessage]);
    setInputText('');
    setIsLoading(true);
    setIsTyping(true);

    try {
      // Check if message is appropriate for kids
      if (isKidAccount) {
        const isAppropriate = await kidSafetyService.isContentAppropriate(
          inputText.trim(),
          kidAccountId
        );
        
        if (!isAppropriate) {
          const safetyMessage: ChatMessage = {
            id: `safety_${Date.now()}`,
            type: 'system',
            content: t('grok.safety.inappropriateQuestion'),
            timestamp: new Date(),
            safetyScore: 0.0,
          };
          
          setMessages(prev => [...prev, safetyMessage]);
          setIsLoading(false);
          setIsTyping(false);
          
          // Notify parent if needed
          onSafetyAlert?.({
            type: 'inappropriate_question',
            question: inputText.trim(),
            kidAccountId,
          });
          
          return;
        }
      }

      // Get Grok response
      const grokResponse = await grokService.getResponse(
        inputText.trim(),
        userId,
        isKidAccount ? { kidAccountId, ageAppropriate: true } : {}
      );

      const grokMessage: ChatMessage = {
        id: `grok_${Date.now()}`,
        type: 'grok',
        content: grokResponse.response,
        timestamp: new Date(),
        isEducational: grokResponse.isEducational,
        safetyScore: grokResponse.safetyScore,
        sources: grokResponse.sources,
        followUpQuestions: grokResponse.followUpQuestions,
      };

      setMessages(prev => [...prev, grokMessage]);

      // Log interaction for learning
      await grokService.logInteraction({
        userId,
        kidAccountId: isKidAccount ? kidAccountId : undefined,
        question: inputText.trim(),
        response: grokResponse.response,
        safetyScore: grokResponse.safetyScore,
        isEducational: grokResponse.isEducational,
      });

    } catch (error) {
      console.error('❌ Grok chat error:', error);
      
      const errorMessage: ChatMessage = {
        id: `error_${Date.now()}`,
        type: 'system',
        content: t('grok.error.general'),
        timestamp: new Date(),
      };
      
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
      setIsTyping(false);
    }
  };

  const handleFollowUpQuestion = (question: string) => {
    setInputText(question);
  };

  const renderMessage = (message: ChatMessage) => {
    const isUser = message.type === 'user';
    const isSystem = message.type === 'system';
    
    return (
      <View
        key={message.id}
        style={[
          styles.messageContainer,
          isUser ? styles.userMessage : styles.grokMessage,
          isSystem && styles.systemMessage,
        ]}
      >
        {/* Message Header */}
        <View style={styles.messageHeader}>
          <Text style={[
            styles.messageSender,
            { color: isUser ? theme.colors.primary : theme.colors.secondary }
          ]}>
            {isUser ? t('grok.you') : isSystem ? t('grok.system') : 'Grok AI'}
          </Text>
          <Text style={[styles.messageTime, { color: theme.colors.onSurface }]}>
            {message.timestamp.toLocaleTimeString()}
          </Text>
        </View>

        {/* Message Content */}
        <Text style={[
          styles.messageContent,
          { color: theme.colors.onSurface },
          isSystem && { fontStyle: 'italic' }
        ]}>
          {message.content}
        </Text>

        {/* Educational Badge */}
        {message.isEducational && (
          <View style={[styles.educationalBadge, { backgroundColor: theme.colors.primary }]}>
            <Text style={styles.educationalText}>
              {t('grok.educational')}
            </Text>
          </View>
        )}

        {/* Safety Score (for debugging/parent view) */}
        {!isKidAccount && message.safetyScore !== undefined && (
          <Text style={[styles.safetyScore, { color: theme.colors.onSurface }]}>
            {t('grok.safetyScore')}: {(message.safetyScore * 100).toFixed(0)}%
          </Text>
        )}

        {/* Sources */}
        {message.sources && message.sources.length > 0 && (
          <View style={styles.sourcesContainer}>
            <Text style={[styles.sourcesTitle, { color: theme.colors.onSurface }]}>
              {t('grok.sources')}:
            </Text>
            {message.sources.map((source, index) => (
              <Text key={index} style={[styles.source, { color: theme.colors.primary }]}>
                • {source}
              </Text>
            ))}
          </View>
        )}

        {/* Follow-up Questions */}
        {message.followUpQuestions && message.followUpQuestions.length > 0 && (
          <View style={styles.followUpContainer}>
            <Text style={[styles.followUpTitle, { color: theme.colors.onSurface }]}>
              {t('grok.followUp')}:
            </Text>
            {message.followUpQuestions.map((question, index) => (
              <TouchableOpacity
                key={index}
                style={[styles.followUpButton, { borderColor: theme.colors.primary }]}
                onPress={() => handleFollowUpQuestion(question)}
              >
                <Text style={[styles.followUpText, { color: theme.colors.primary }]}>
                  {question}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        )}
      </View>
    );
  };

  return (
    <KeyboardAvoidingView
      style={[styles.container, { backgroundColor: theme.colors.background }]}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      {/* Chat Header */}
      <View style={[styles.header, { backgroundColor: theme.colors.surface }]}>
        <Text style={[styles.headerTitle, { color: theme.colors.onSurface }]}>
          🤖 Grok AI {isKidAccount && '- ' + t('grok.kidMode')}
        </Text>
        {isKidAccount && (
          <Text style={[styles.headerSubtitle, { color: theme.colors.onSurface }]}>
            {t('grok.kidModeDescription')}
          </Text>
        )}
      </View>

      {/* Messages */}
      <ScrollView
        ref={scrollViewRef}
        style={styles.messagesContainer}
        onContentSizeChange={() => scrollViewRef.current?.scrollToEnd({ animated: true })}
      >
        {messages.map(renderMessage)}
        
        {/* Typing Indicator */}
        {isTyping && (
          <View style={[styles.messageContainer, styles.grokMessage]}>
            <View style={styles.typingIndicator}>
              <ActivityIndicator size="small" color={theme.colors.primary} />
              <Text style={[styles.typingText, { color: theme.colors.onSurface }]}>
                {t('grok.thinking')}
              </Text>
            </View>
          </View>
        )}
      </ScrollView>

      {/* Input Area */}
      <View style={[styles.inputContainer, { backgroundColor: theme.colors.surface }]}>
        <TextInput
          style={[
            styles.textInput,
            {
              backgroundColor: theme.colors.background,
              color: theme.colors.onSurface,
              borderColor: theme.colors.outline,
            },
          ]}
          value={inputText}
          onChangeText={setInputText}
          placeholder={isKidAccount ? t('grok.placeholder.kid') : t('grok.placeholder.adult')}
          placeholderTextColor={theme.colors.onSurface + '80'}
          multiline
          maxLength={500}
          editable={!isLoading}
        />
        <TouchableOpacity
          style={[
            styles.sendButton,
            {
              backgroundColor: inputText.trim() && !isLoading
                ? theme.colors.primary
                : theme.colors.outline,
            },
          ]}
          onPress={handleSendMessage}
          disabled={!inputText.trim() || isLoading}
        >
          <Text style={styles.sendButtonText}>
            {isLoading ? '⏳' : '🚀'}
          </Text>
        </TouchableOpacity>
      </View>

      {/* Safety Notice for Kids */}
      {isKidAccount && (
        <View style={[styles.safetyNotice, { backgroundColor: theme.colors.primaryContainer }]}>
          <Text style={[styles.safetyNoticeText, { color: theme.colors.onPrimaryContainer }]}>
            {t('grok.safetyNotice')}
          </Text>
        </View>
      )}
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  headerSubtitle: {
    fontSize: 14,
    marginTop: 4,
    opacity: 0.7,
  },
  messagesContainer: {
    flex: 1,
    padding: 16,
  },
  messageContainer: {
    marginBottom: 16,
    padding: 12,
    borderRadius: 12,
    maxWidth: '85%',
  },
  userMessage: {
    alignSelf: 'flex-end',
    backgroundColor: '#E3F2FD',
  },
  grokMessage: {
    alignSelf: 'flex-start',
    backgroundColor: '#F5F5F5',
  },
  systemMessage: {
    alignSelf: 'center',
    backgroundColor: '#FFF3E0',
    maxWidth: '95%',
  },
  messageHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  messageSender: {
    fontSize: 14,
    fontWeight: 'bold',
  },
  messageTime: {
    fontSize: 12,
    opacity: 0.6,
  },
  messageContent: {
    fontSize: 16,
    lineHeight: 22,
  },
  educationalBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    marginTop: 8,
  },
  educationalText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: 'bold',
  },
  safetyScore: {
    fontSize: 12,
    marginTop: 4,
    opacity: 0.6,
  },
  sourcesContainer: {
    marginTop: 8,
    padding: 8,
    backgroundColor: 'rgba(0,0,0,0.05)',
    borderRadius: 8,
  },
  sourcesTitle: {
    fontSize: 12,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  source: {
    fontSize: 12,
    marginLeft: 8,
  },
  followUpContainer: {
    marginTop: 8,
  },
  followUpTitle: {
    fontSize: 12,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  followUpButton: {
    padding: 8,
    borderWidth: 1,
    borderRadius: 16,
    marginBottom: 4,
  },
  followUpText: {
    fontSize: 14,
    textAlign: 'center',
  },
  typingIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  typingText: {
    marginLeft: 8,
    fontSize: 14,
    fontStyle: 'italic',
  },
  inputContainer: {
    flexDirection: 'row',
    padding: 16,
    alignItems: 'flex-end',
  },
  textInput: {
    flex: 1,
    borderWidth: 1,
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 12,
    marginRight: 12,
    maxHeight: 100,
    fontSize: 16,
  },
  sendButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
  },
  sendButtonText: {
    fontSize: 20,
  },
  safetyNotice: {
    padding: 12,
    margin: 16,
    borderRadius: 8,
  },
  safetyNoticeText: {
    fontSize: 12,
    textAlign: 'center',
    fontWeight: '500',
  },
});

export default GrokChatInterface;

