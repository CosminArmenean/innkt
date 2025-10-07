import React, { useState, useEffect } from 'react';
import { kinderService, KidPasswordSettings } from '../../services/kinder.service';

interface PasswordManagementPanelProps {
  kidAccountId: string;
  parentId: string;
  kidName: string;
  maturityLevel: string;
  onClose: () => void;
}

const PasswordManagementPanel: React.FC<PasswordManagementPanelProps> = ({
  kidAccountId,
  parentId,
  kidName,
  maturityLevel,
  onClose
}) => {
  const [passwordSettings, setPasswordSettings] = useState<KidPasswordSettings | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [showSetPassword, setShowSetPassword] = useState(false);
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [independenceDay, setIndependenceDay] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    loadPasswordSettings();
  }, [kidAccountId]);

  const loadPasswordSettings = async () => {
    try {
      const settings = await kinderService.getPasswordSettings(kidAccountId);
      setPasswordSettings(settings);
    } catch (err) {
      console.error('Error loading password settings:', err);
    }
  };

  const handleSetPassword = async () => {
    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    if (password.length < 8) {
      setError('Password must be at least 8 characters');
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      await kinderService.setPassword(kidAccountId, parentId, password);
      setSuccess('Password set successfully! Your kid can now login with password.');
      setShowSetPassword(false);
      setPassword('');
      setConfirmPassword('');
      await loadPasswordSettings();
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to set password');
    } finally {
      setIsLoading(false);
    }
  };

  const handleRevokePassword = async () => {
    if (!window.confirm(`Are you sure you want to revoke password access for ${kidName}? They will only be able to login with QR codes.`)) {
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      await kinderService.revokePassword(kidAccountId, parentId, 'Parent revoked password access');
      setSuccess('Password access revoked. Kid must use QR code login only.');
      await loadPasswordSettings();
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to revoke password');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold text-gray-900">Password Management</h3>
          <p className="text-sm text-gray-600">Manage password settings for {kidName}</p>
        </div>
        <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      {/* Messages */}
      {error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-red-700 text-sm">{error}</p>
        </div>
      )}

      {success && (
        <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
          <p className="text-green-700 text-sm">{success}</p>
        </div>
      )}

      {/* Current Status */}
      <div className="bg-gray-50 rounded-lg p-4 space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-sm text-gray-600">Password Status:</span>
          <span className={`px-3 py-1 rounded-full text-xs font-medium ${
            passwordSettings?.hasPassword 
              ? 'bg-green-100 text-green-800' 
              : 'bg-gray-100 text-gray-800'
          }`}>
            {passwordSettings?.hasPassword ? 'Password Set' : 'No Password'}
          </span>
        </div>

        {passwordSettings?.hasPassword && (
          <>
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">Set By:</span>
              <span className="text-sm text-gray-900">
                {passwordSettings.passwordSetByParent ? 'Parent' : 'Kid'}
              </span>
            </div>

            {passwordSettings.lastPasswordChangeAt && (
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Last Changed:</span>
                <span className="text-sm text-gray-900">
                  {new Date(passwordSettings.lastPasswordChangeAt).toLocaleDateString()}
                </span>
              </div>
            )}

            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">Kid Can Change:</span>
              <span className="text-sm text-gray-900">
                {passwordSettings.canChangePassword ? 'Yes' : 'No (Low Maturity)'}
              </span>
            </div>

            {passwordSettings.independenceDay && (
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Independence Day:</span>
                <span className="text-sm text-gray-900">
                  {new Date(passwordSettings.independenceDay).toLocaleDateString()}
                </span>
              </div>
            )}
          </>
        )}

        <div className="flex items-center justify-between">
          <span className="text-sm text-gray-600">Maturity Level:</span>
          <span className={`px-3 py-1 rounded-full text-xs font-medium ${
            maturityLevel === 'high' ? 'bg-green-100 text-green-800' :
            maturityLevel === 'medium' ? 'bg-yellow-100 text-yellow-800' :
            'bg-blue-100 text-blue-800'
          }`}>
            {maturityLevel.toUpperCase()}
          </span>
        </div>
      </div>

      {/* Actions */}
      {!showSetPassword ? (
        <div className="space-y-3">
          {!passwordSettings?.hasPassword && (
            <button
              onClick={() => setShowSetPassword(true)}
              className="w-full bg-purple-600 text-white py-3 px-4 rounded-lg hover:bg-purple-700 transition-colors font-medium"
            >
              🔐 Set Password for {kidName}
            </button>
          )}

          {passwordSettings?.hasPassword && !passwordSettings.passwordRevoked && (
            <button
              onClick={handleRevokePassword}
              disabled={isLoading || maturityLevel === 'high'}
              className="w-full bg-red-600 text-white py-3 px-4 rounded-lg hover:bg-red-700 transition-colors font-medium disabled:bg-gray-300 disabled:cursor-not-allowed"
            >
              {maturityLevel === 'high' 
                ? '🔒 Cannot Revoke (High Maturity)' 
                : '⚠️ Revoke Password Access'}
            </button>
          )}

          {passwordSettings?.passwordRevoked && (
            <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
              <p className="text-yellow-700 text-sm">
                Password access is currently revoked. Click "Set Password" to re-enable.
              </p>
            </div>
          )}

          <div className="text-xs text-gray-500 space-y-1">
            <p>💡 <strong>Password Lifecycle:</strong></p>
            <p>• Parent sets first password</p>
            <p>• Kid can change it (with parent notification)</p>
            <p>• Independence day = full autonomy</p>
            <p>• Low maturity = parent can revoke</p>
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              New Password
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter password (min 8 characters)"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Confirm Password
            </label>
            <input
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="Confirm password"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Independence Day (Optional)
            </label>
            <input
              type="date"
              value={independenceDay}
              onChange={(e) => setIndependenceDay(e.target.value)}
              min={new Date().toISOString().split('T')[0]}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            />
            <p className="text-xs text-gray-500 mt-1">
              When kid gets full password control without parent notifications
            </p>
          </div>

          <div className="flex space-x-3">
            <button
              onClick={() => {
                setShowSetPassword(false);
                setPassword('');
                setConfirmPassword('');
                setError('');
              }}
              className="flex-1 bg-gray-200 text-gray-700 py-2 px-4 rounded-lg hover:bg-gray-300 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleSetPassword}
              disabled={isLoading || !password || password !== confirmPassword}
              className="flex-1 bg-purple-600 text-white py-2 px-4 rounded-lg hover:bg-purple-700 transition-colors disabled:bg-gray-300 disabled:cursor-not-allowed"
            >
              {isLoading ? 'Setting...' : 'Set Password'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default PasswordManagementPanel;

