import React, { useState, useEffect } from 'react';
import { Bot, Sparkles, Shield, BookOpen, MessageCircle, Send, AlertTriangle } from 'lucide-react';
import { grokService, GrokResponse } from '../../services/grok.service';
import { kidSafetyService } from '../../services/kidSafety.service';

interface GrokIntegrationProps {
  postId: string;
  commentContent: string;
  authorId: string;
  isKidAccount?: boolean;
  kidAccountId?: string;
  onGrokResponse?: (response: GrokResponse) => void;
  onSafetyAlert?: (alert: any) => void;
}

export const GrokIntegration: React.FC<GrokIntegrationProps> = ({
  postId,
  commentContent,
  authorId,
  isKidAccount = false,
  kidAccountId,
  onGrokResponse,
  onSafetyAlert,
}) => {
  const [grokResponse, setGrokResponse] = useState<GrokResponse | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isGrokMention, setIsGrokMention] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showFullResponse, setShowFullResponse] = useState(false);

  // Check if comment contains @grok mention
  useEffect(() => {
    checkGrokMention();
  }, [commentContent]);

  const checkGrokMention = async () => {
    try {
      const isMention = await grokService.isGrokMention(commentContent);
      setIsGrokMention(isMention);
      
      if (isMention) {
        await processGrokMention();
      }
    } catch (error) {
      console.error('❌ Error checking Grok mention:', error);
    }
  };

  const processGrokMention = async () => {
    try {
      setIsLoading(true);
      setError(null);

      // For kid accounts, validate question appropriateness first
      if (isKidAccount && kidAccountId) {
        const questions = await grokService.extractGrokQuestions(commentContent);
        if (questions.length > 0) {
          const isAppropriate = await grokService.isQuestionAppropriate(questions[0], 12); // Default kid age
          
          if (!isAppropriate) {
            setError('This question is not appropriate for kids. Please ask something educational!');
            onSafetyAlert?.({
              type: 'inappropriate_grok_question',
              question: questions[0],
              kidAccountId,
            });
            return;
          }
        }
      }

      // Process @grok mention
      const response = await grokService.processGrokMention(
        commentContent,
        postId,
        authorId,
        'social_media_comment'
      );

      // Additional safety filtering for kids
      if (isKidAccount && kidAccountId) {
        const filteredResponse = await grokService.filterResponseForKid(response, 12);
        setGrokResponse(filteredResponse);
      } else {
        setGrokResponse(response);
      }

      onGrokResponse?.(response);

      console.log('✅ @grok response generated:', {
        responseType: response.responseType,
        isKidSafe: response.isKidSafe,
        safetyScore: response.safetyScore,
      });

    } catch (error) {
      console.error('❌ Error processing @grok mention:', error);
      setError('Sorry, I had trouble processing your question. Please try again!');
    } finally {
      setIsLoading(false);
    }
  };

  const handleFollowUpQuestion = async (question: string) => {
    try {
      setIsLoading(true);
      
      const response = await grokService.generateResponse({
        question,
        context: `Follow-up to: ${commentContent}`,
        userId: authorId,
        kidAccountId: isKidAccount ? kidAccountId : undefined,
        isKidAccount,
      });

      setGrokResponse(response);
      onGrokResponse?.(response);
    } catch (error) {
      console.error('❌ Error generating follow-up response:', error);
      setError('Sorry, I had trouble with that follow-up question.');
    } finally {
      setIsLoading(false);
    }
  };

  if (!isGrokMention) {
    return null;
  }

  return (
    <div className="grok-integration-container mt-4 p-4 bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg border border-blue-200">
      {/* Grok Header */}
      <div className="flex items-center gap-2 mb-3">
        <Bot className="w-5 h-5 text-blue-600" />
        <span className="font-semibold text-blue-800">Grok AI Response</span>
        {isKidAccount && (
          <div className="flex items-center gap-1 px-2 py-1 bg-green-100 rounded-full">
            <Shield className="w-3 h-3 text-green-600" />
            <span className="text-xs text-green-700 font-medium">Kid Safe</span>
          </div>
        )}
        {grokResponse?.isEducational && (
          <div className="flex items-center gap-1 px-2 py-1 bg-orange-100 rounded-full">
            <BookOpen className="w-3 h-3 text-orange-600" />
            <span className="text-xs text-orange-700 font-medium">Educational</span>
          </div>
        )}
      </div>

      {/* Loading State */}
      {isLoading && (
        <div className="flex items-center gap-2 text-blue-600">
          <Sparkles className="w-4 h-4 animate-spin" />
          <span className="text-sm">Grok is thinking...</span>
        </div>
      )}

      {/* Error State */}
      {error && (
        <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-lg">
          <AlertTriangle className="w-4 h-4 text-red-500" />
          <span className="text-sm text-red-700">{error}</span>
        </div>
      )}

      {/* Grok Response */}
      {grokResponse && !isLoading && (
        <div className="grok-response">
          {/* Response Content */}
          <div className="bg-white p-4 rounded-lg border border-gray-200 mb-3">
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
                <Bot className="w-4 h-4 text-blue-600" />
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-2">
                  <span className="font-medium text-gray-800">Grok AI</span>
                  <span className="text-xs text-gray-500">
                    {grokResponse.responseType} • {Math.round(grokResponse.confidenceScore * 100)}% confidence
                  </span>
                  {isKidAccount && (
                    <span className="text-xs text-green-600 font-medium">
                      Safety: {Math.round(grokResponse.safetyScore * 100)}%
                    </span>
                  )}
                </div>
                
                <div className="text-gray-700 leading-relaxed">
                  {showFullResponse || grokResponse.response.length <= 200 
                    ? grokResponse.response 
                    : `${grokResponse.response.substring(0, 200)}...`
                  }
                  
                  {grokResponse.response.length > 200 && (
                    <button
                      onClick={() => setShowFullResponse(!showFullResponse)}
                      className="text-blue-600 hover:text-blue-800 text-sm ml-2 underline"
                    >
                      {showFullResponse ? 'Show Less' : 'Show More'}
                    </button>
                  )}
                </div>

                {/* Sources */}
                {grokResponse.sources && grokResponse.sources.length > 0 && (
                  <div className="mt-3 p-2 bg-gray-50 rounded">
                    <div className="text-xs text-gray-600 font-medium mb-1">Sources:</div>
                    {grokResponse.sources.map((source, index) => (
                      <div key={index} className="text-xs text-gray-600">• {source}</div>
                    ))}
                  </div>
                )}

                {/* Related Topics */}
                {grokResponse.relatedTopics && grokResponse.relatedTopics.length > 0 && (
                  <div className="mt-3">
                    <div className="text-xs text-gray-600 font-medium mb-2">Related Topics:</div>
                    <div className="flex flex-wrap gap-1">
                      {grokResponse.relatedTopics.map((topic, index) => (
                        <span
                          key={index}
                          className="px-2 py-1 bg-blue-100 text-blue-700 text-xs rounded-full"
                        >
                          {topic}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {/* Follow-up Questions */}
                {grokResponse.followUpQuestions && grokResponse.followUpQuestions.length > 0 && (
                  <div className="mt-3">
                    <div className="text-xs text-gray-600 font-medium mb-2">Ask Grok:</div>
                    <div className="space-y-1">
                      {grokResponse.followUpQuestions.slice(0, 3).map((question, index) => (
                        <button
                          key={index}
                          onClick={() => handleFollowUpQuestion(question)}
                          className="block w-full text-left p-2 text-sm text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded border border-blue-200 transition-colors"
                          disabled={isLoading}
                        >
                          <MessageCircle className="w-3 h-3 inline mr-1" />
                          {question}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Kid Safety Notice */}
          {isKidAccount && (
            <div className="flex items-center gap-2 p-2 bg-green-50 border border-green-200 rounded text-xs text-green-700">
              <Shield className="w-3 h-3" />
              <span>This AI response has been safety-checked for kids. Parents can see all AI interactions.</span>
            </div>
          )}

          {/* Response Metadata */}
          <div className="flex items-center justify-between text-xs text-gray-500 mt-2">
            <span>Generated by {grokResponse.model}</span>
            <span>{new Date(grokResponse.generatedAt).toLocaleTimeString()}</span>
          </div>
        </div>
      )}
    </div>
  );
};

export default GrokIntegration;

