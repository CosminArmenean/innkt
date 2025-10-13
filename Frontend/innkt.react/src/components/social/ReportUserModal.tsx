import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { XMarkIcon, ExclamationTriangleIcon } from '@heroicons/react/24/outline';
import { socialService } from '../../services/social.service';

interface ReportUserModalProps {
  isOpen: boolean;
  onClose: () => void;
  userId: string;
  userName: string;
}

const getReportReasons = (t: any) => [
  { value: 'spam', label: t('social.reportReasons.spam') },
  { value: 'harassment', label: t('social.reportReasons.harassment') },
  { value: 'hate_speech', label: t('social.reportReasons.hateSpeech') },
  { value: 'inappropriate', label: t('social.reportReasons.inappropriate') },
  { value: 'fake_account', label: t('social.reportReasons.fakeAccount') },
  { value: 'violence', label: t('social.reportReasons.violence') },
  { value: 'other', label: t('social.reportReasons.other') }
];

const ReportUserModal: React.FC<ReportUserModalProps> = ({
  isOpen,
  onClose,
  userId,
  userName
}) => {
  const { t } = useTranslation();
  const reportReasons = getReportReasons(t);
  const [selectedReason, setSelectedReason] = useState('');
  const [description, setDescription] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedReason) return;

    setIsSubmitting(true);
    try {
      await socialService.reportUser(userId, {
        reason: selectedReason,
        description: description.trim()
      });
      setIsSubmitted(true);
    } catch (error) {
      console.error('Failed to report user:', error);
      alert(t('social.failedToSubmitReport'));
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    setSelectedReason('');
    setDescription('');
    setIsSubmitted(false);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg max-w-md w-full mx-4 max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          {/* Header */}
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-2">
              <ExclamationTriangleIcon className="w-6 h-6 text-orange-500" />
              <h2 className="text-lg font-semibold text-gray-900">{t('social.reportUser')}</h2>
            </div>
            <button
              onClick={handleClose}
              className="text-gray-400 hover:text-gray-600 transition-colors"
            >
              <XMarkIcon className="w-6 h-6" />
            </button>
          </div>

          {isSubmitted ? (
            <div className="text-center py-8">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">{t('social.reportSubmitted')}</h3>
              <p className="text-gray-600 mb-4">
                {t('social.thankYouForReport')}
              </p>
              <button
                onClick={handleClose}
                className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
              >
                {t('common.close')}
              </button>
            </div>
          ) : (
            <>
              <p className="text-gray-600 mb-6">
                {t('social.reportingUser', { userName })}
              </p>

              <form onSubmit={handleSubmit}>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      {t('social.selectReason')}
                    </label>
                    <div className="space-y-2">
                      {reportReasons.map((reason) => (
                        <label key={reason.value} className="flex items-center">
                          <input
                            type="radio"
                            name="reason"
                            value={reason.value}
                            checked={selectedReason === reason.value}
                            onChange={(e) => setSelectedReason(e.target.value)}
                            className="mr-3 text-purple-600 focus:ring-purple-500"
                          />
                          <span className="text-sm text-gray-700">{reason.label}</span>
                        </label>
                      ))}
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      {t('social.additionalDetails')}
                    </label>
                    <textarea
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      placeholder={t('social.provideMoreInfo')}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent resize-none"
                      rows={3}
                      maxLength={500}
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      {description.length}/500 characters
                    </p>
                  </div>
                </div>

                <div className="flex space-x-3 mt-6">
                  <button
                    type="button"
                    onClick={handleClose}
                    className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    {t('common.cancel')}
                  </button>
                  <button
                    type="submit"
                    disabled={!selectedReason || isSubmitting}
                    className="flex-1 px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isSubmitting ? t('social.submitting') : t('social.submitReport')}
                  </button>
                </div>
              </form>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default ReportUserModal;
