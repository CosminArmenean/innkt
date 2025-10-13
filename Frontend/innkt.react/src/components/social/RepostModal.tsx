import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Post } from '../../services/social.service';
import { repostService, CreateRepostRequest } from '../../services/repost.service';
import { useAuth } from '../../contexts/AuthContext';

interface RepostModalProps {
  post: Post;
  isOpen: boolean;
  onClose: () => void;
  onRepostCreated: (repost: any) => void;
}

const RepostModal: React.FC<RepostModalProps> = ({ post, isOpen, onClose, onRepostCreated }) => {
  const { t } = useTranslation();
  const { user } = useAuth();
  const [repostType, setRepostType] = useState<'simple' | 'quote'>('simple');
  const [quoteText, setQuoteText] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [canRepost, setCanRepost] = useState(true);
  const [hasReposted, setHasReposted] = useState(false);
  const [repostInfo, setRepostInfo] = useState<any>(null);

  // Check repost eligibility when modal opens
  useEffect(() => {
    if (isOpen && post.id) {
      checkRepostEligibility();
    }
  }, [isOpen, post.id]);

  const checkRepostEligibility = async () => {
    try {
      const response = await repostService.canRepost(post.id);
      setCanRepost(response.canRepost);
      setHasReposted(response.hasAlreadyReposted);
      setRepostInfo(response);
    } catch (error) {
      console.error('Failed to check repost eligibility:', error);
      setCanRepost(false);
    }
  };

  const handleSubmit = async () => {
    if (!canRepost || isSubmitting) return;

    setIsSubmitting(true);
    try {
      const request: CreateRepostRequest = {
        originalPostId: post.id,
        repostType,
        quoteText: repostType === 'quote' ? quoteText : undefined,
        visibility: 'public'
      };

      const response = await repostService.createQuickRepost(post.id, request);
      onRepostCreated(response.repost);
      onClose();
      
      // Reset form
      setQuoteText('');
      setRepostType('simple');
    } catch (error) {
      console.error('Failed to create repost:', error);
      alert(t('social.failedToCreateRepost'));
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    setQuoteText('');
    setRepostType('simple');
    onClose();
  };

  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop */}
      <div 
        className="fixed inset-0 z-40 bg-black bg-opacity-50 backdrop-overlay"
        onClick={handleClose}
      />
      
      {/* Modal */}
      <div className="fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 z-50 w-full max-w-2xl bg-white rounded-xl shadow-2xl border border-gray-200 popover-card">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-100">
          <h2 className="text-xl font-semibold text-gray-900">
            {t('social.repostToFollowers')}
          </h2>
          <button
            onClick={handleClose}
            className="text-gray-400 hover:text-gray-600 p-2 hover:bg-gray-100 rounded-full transition-colors"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          {/* Repost eligibility check */}
          {!canRepost && (
            <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg">
              <div className="flex items-center space-x-2">
                <span className="text-red-600">⚠️</span>
                <span className="text-red-800 font-medium">{t('social.cannotRepostContent')}</span>
              </div>
              <p className="text-red-700 text-sm mt-1">
                {hasReposted ? t('social.alreadyReposted') : 
                 repostInfo?.reason || t('social.rateLimitOrRestrictions')}
              </p>
              {repostInfo && (
                <p className="text-red-600 text-xs mt-2">
                  {t('social.repostsInLastHour', { count: repostInfo.repostCountLastHour, max: repostInfo.maxRepostsPerHour })}
                </p>
              )}
            </div>
          )}

          {/* User info */}
          {user && (
            <div className="flex items-center space-x-3 mb-4">
              <img
                src={user.avatar || '/api/placeholder/48/48'}
                alt={user.username}
                className="w-12 h-12 rounded-full border-2 border-gray-200"
              />
              <div>
                <h3 className="font-semibold text-gray-900">
                  {user.firstName && user.lastName ? `${user.firstName} ${user.lastName}` : user.username}
                </h3>
                <p className="text-sm text-gray-500">@{user.username}</p>
              </div>
            </div>
          )}

          {/* Repost type selection */}
          <div className="mb-4">
            <div className="flex space-x-4">
              <button
                onClick={() => setRepostType('simple')}
                className={`flex-1 p-4 border-2 rounded-lg transition-all ${
                  repostType === 'simple' 
                    ? 'border-purple-500 bg-purple-50 text-purple-700' 
                    : 'border-gray-200 hover:border-gray-300 text-gray-700'
                }`}
                disabled={!canRepost}
              >
                <div className="text-center">
                  <div className="text-2xl mb-2">🔄</div>
                  <h4 className="font-medium">{t('social.simpleRepost')}</h4>
                  <p className="text-sm opacity-75">{t('social.shareAsIs')}</p>
                </div>
              </button>
              
              <button
                onClick={() => setRepostType('quote')}
                className={`flex-1 p-4 border-2 rounded-lg transition-all ${
                  repostType === 'quote' 
                    ? 'border-purple-500 bg-purple-50 text-purple-700' 
                    : 'border-gray-200 hover:border-gray-300 text-gray-700'
                }`}
                disabled={!canRepost}
              >
                <div className="text-center">
                  <div className="text-2xl mb-2">💬</div>
                  <h4 className="font-medium">{t('social.quoteRepost')}</h4>
                  <p className="text-sm opacity-75">{t('social.addYourThoughts')}</p>
                </div>
              </button>
            </div>
          </div>

          {/* Quote text input */}
          {repostType === 'quote' && (
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                {t('social.addYourComment')}
              </label>
              <textarea
                value={quoteText}
                onChange={(e) => setQuoteText(e.target.value)}
                placeholder={t('social.whatDoYouThink')}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent resize-none"
                rows={3}
                maxLength={280}
                disabled={!canRepost}
              />
              <div className="flex justify-between items-center mt-1">
                <span className="text-xs text-gray-500">
                  {t('social.charactersRemaining', { count: 280 - quoteText.length })}
                </span>
                {quoteText.length > 260 && (
                  <span className="text-xs text-orange-500 font-medium">
                    {t('social.characterLimitApproaching')}
                  </span>
                )}
              </div>
            </div>
          )}

          {/* Original post preview */}
          <div className="mb-6 p-4 border-2 border-dashed border-gray-200 rounded-lg bg-gray-50">
            <div className="flex items-start space-x-3">
              <img
                src={post.authorProfile?.avatar || post.author?.avatarUrl || '/api/placeholder/40/40'}
                alt={post.authorProfile?.username || post.author?.username || 'User'}
                className="w-10 h-10 rounded-full"
              />
              <div className="flex-1">
                <div className="flex items-center space-x-2 mb-1">
                  <span className="font-medium text-gray-900">
                    {post.authorProfile?.displayName || post.author?.displayName || 'Unknown User'}
                  </span>
                  <span className="text-sm text-gray-500">
                    @{post.authorProfile?.username || post.author?.username || 'unknown'}
                  </span>
                </div>
                <p className="text-gray-700 text-sm leading-relaxed">{post.content}</p>
                
                {/* Original post engagement */}
                <div className="flex items-center space-x-4 mt-3 text-xs text-gray-500">
                  <span>❤️ {post.likesCount}</span>
                  <span>💬 {post.commentsCount}</span>
                  <span>🔄 {post.sharesCount}</span>
                  <span>👁️ {post.viewsCount || 0}</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between p-6 border-t border-gray-100 bg-gray-50">
          <div className="text-sm text-gray-600">
            {repostType === 'simple' ? (
              <span>{t('social.appearInFollowersFeed')}</span>
            ) : (
              <span>{t('social.commentAboveOriginal')}</span>
            )}
          </div>
          
          <div className="flex items-center space-x-3">
            <button
              onClick={handleClose}
              className="px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
            >
              {t('common.cancel')}
            </button>
            <button
              onClick={handleSubmit}
              disabled={!canRepost || isSubmitting || (repostType === 'quote' && !quoteText.trim())}
              className="px-6 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors flex items-center space-x-2"
            >
              {isSubmitting ? (
                <>
                  <svg className="w-4 h-4 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                  </svg>
                  <span>{t('social.reposting')}</span>
                </>
              ) : (
                <>
                  <span>{repostType === 'quote' ? '💬' : '🔄'}</span>
                  <span>{repostType === 'quote' ? t('social.quoteRepost') : t('social.repost')}</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </>
  );
};

export default RepostModal;
