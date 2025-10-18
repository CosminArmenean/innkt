import React, { useState } from 'react';

interface PrivacySettingsProps {
  isOpen: boolean;
  onClose: () => void;
}

const PrivacySettings: React.FC<PrivacySettingsProps> = ({ isOpen, onClose }) => {
  const [enhancedPrivacy, setEnhancedPrivacy] = useState(false);
  const [allowCallsFrom, setAllowCallsFrom] = useState<'followers' | 'contacts' | 'everyone'>('followers');

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white dark:bg-gray-800 rounded-lg p-6 max-w-md w-full mx-4">
        <h2 className="text-xl font-semibold mb-4 text-gray-900 dark:text-white">
          Call Privacy Settings
        </h2>
        
        <div className="space-y-4">
          {/* Enhanced Call Privacy */}
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-medium text-gray-900 dark:text-white">
                Enhanced Call Privacy
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Route calls through servers to hide your IP address (may increase latency)
              </p>
            </div>
            <button
              onClick={() => setEnhancedPrivacy(!enhancedPrivacy)}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                enhancedPrivacy ? 'bg-purple-600' : 'bg-gray-300'
              }`}
            >
              <span
                className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                  enhancedPrivacy ? 'translate-x-6' : 'translate-x-1'
                }`}
              />
            </button>
          </div>

          {/* Who Can Call Me */}
          <div>
            <h3 className="font-medium text-gray-900 dark:text-white mb-2">
              Who can call me
            </h3>
            <select
              value={allowCallsFrom}
              onChange={(e) => setAllowCallsFrom(e.target.value as any)}
              className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            >
              <option value="followers">People I follow</option>
              <option value="contacts">Contacts only</option>
              <option value="everyone">Everyone</option>
            </select>
          </div>

          {/* Privacy Warning */}
          {!enhancedPrivacy && (
            <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-md p-3">
              <p className="text-sm text-yellow-800 dark:text-yellow-200">
                ⚠️ <strong>Privacy Notice:</strong> Without enhanced privacy, your IP address may be visible to call participants.
              </p>
            </div>
          )}
        </div>

        <div className="flex justify-end space-x-3 mt-6">
          <button
            onClick={onClose}
            className="px-4 py-2 text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200"
          >
            Cancel
          </button>
          <button
            onClick={() => {
              // Save settings
              localStorage.setItem('callPrivacy', JSON.stringify({
                enhancedPrivacy,
                allowCallsFrom
              }));
              onClose();
            }}
            className="px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700"
          >
            Save Settings
          </button>
        </div>
      </div>
    </div>
  );
};

export default PrivacySettings;
