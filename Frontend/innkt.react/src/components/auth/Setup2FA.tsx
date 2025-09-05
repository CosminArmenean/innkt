import React, { useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { ShieldCheckIcon, QrCodeIcon, EnvelopeIcon, DevicePhoneMobileIcon } from '@heroicons/react/24/outline';

const Setup2FA: React.FC = () => {
  const { user, updateUser } = useAuth();
  const [selectedMethod, setSelectedMethod] = useState<'email' | 'sms' | 'app'>('email');
  const [isSetup, setIsSetup] = useState(false);

  const handleSetup2FA = async () => {
    // This would integrate with the backend 2FA setup
    try {
      // Mock setup - in real implementation, this would call the API
      updateUser({ isMfaEnabled: true });
      setIsSetup(true);
    } catch (error) {
      console.error('2FA setup failed:', error);
    }
  };

  if (isSetup) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-8 text-center">
          <ShieldCheckIcon className="h-16 w-16 text-green-500 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-gray-900 mb-2">2FA Enabled Successfully!</h1>
          <p className="text-gray-600 mb-6">
            Your account is now protected with two-factor authentication.
          </p>
          <button
            onClick={() => window.location.href = '/dashboard'}
            className="w-full bg-purple-600 text-white py-2 px-4 rounded-lg hover:bg-purple-700 transition-colors"
          >
            Continue to Dashboard
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="max-w-2xl w-full bg-white rounded-lg shadow-lg p-8">
        <div className="text-center mb-8">
          <ShieldCheckIcon className="h-16 w-16 text-purple-600 mx-auto mb-4" />
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Secure Your Account</h1>
          <p className="text-gray-600">
            Enable two-factor authentication to add an extra layer of security to your account.
          </p>
        </div>

        <div className="space-y-6">
          <h2 className="text-xl font-semibold text-gray-900">Choose Your Verification Method</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Email Option */}
            <button
              onClick={() => setSelectedMethod('email')}
              className={`p-4 border-2 rounded-lg text-left transition-colors ${
                selectedMethod === 'email'
                  ? 'border-purple-500 bg-purple-50'
                  : 'border-gray-200 hover:border-gray-300'
              }`}
            >
              <EnvelopeIcon className="h-8 w-8 text-purple-600 mb-2" />
              <h3 className="font-semibold text-gray-900">Email</h3>
              <p className="text-sm text-gray-600">Receive verification codes via email</p>
            </button>

            {/* SMS Option */}
            <button
              onClick={() => setSelectedMethod('sms')}
              className={`p-4 border-2 rounded-lg text-left transition-colors ${
                selectedMethod === 'sms'
                  ? 'border-purple-500 bg-purple-50'
                  : 'border-gray-200 hover:border-gray-300'
              }`}
            >
              <DevicePhoneMobileIcon className="h-8 w-8 text-purple-600 mb-2" />
              <h3 className="font-semibold text-gray-900">SMS</h3>
              <p className="text-sm text-gray-600">Receive verification codes via SMS</p>
            </button>

            {/* Authenticator App Option */}
            <button
              onClick={() => setSelectedMethod('app')}
              className={`p-4 border-2 rounded-lg text-left transition-colors ${
                selectedMethod === 'app'
                  ? 'border-purple-500 bg-purple-50'
                  : 'border-gray-200 hover:border-gray-300'
              }`}
            >
              <QrCodeIcon className="h-8 w-8 text-purple-600 mb-2" />
              <h3 className="font-semibold text-gray-900">Authenticator App</h3>
              <p className="text-sm text-gray-600">Use Google Authenticator or similar</p>
            </button>
          </div>

          {/* Method-specific instructions */}
          {selectedMethod === 'email' && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <h4 className="font-semibold text-blue-900 mb-2">Email Verification</h4>
              <p className="text-sm text-blue-800">
                We'll send a 6-digit verification code to <strong>{user?.email}</strong>. 
                Enter this code to complete the setup.
              </p>
            </div>
          )}

          {selectedMethod === 'sms' && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <h4 className="font-semibold text-blue-900 mb-2">SMS Verification</h4>
              <p className="text-sm text-blue-800">
                We'll send a 6-digit verification code to your phone number. 
                Make sure your phone number is verified in your account settings.
              </p>
            </div>
          )}

          {selectedMethod === 'app' && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <h4 className="font-semibold text-blue-900 mb-2">Authenticator App Setup</h4>
              <p className="text-sm text-blue-800">
                Download Google Authenticator, Microsoft Authenticator, or similar app. 
                Scan the QR code we'll provide to link your account.
              </p>
            </div>
          )}

          <div className="flex space-x-4">
            <button
              onClick={handleSetup2FA}
              className="flex-1 bg-purple-600 text-white py-3 px-6 rounded-lg hover:bg-purple-700 transition-colors font-semibold"
            >
              Enable 2FA
            </button>
            <button
              onClick={() => window.history.back()}
              className="flex-1 bg-gray-200 text-gray-800 py-3 px-6 rounded-lg hover:bg-gray-300 transition-colors font-semibold"
            >
              Skip for Now
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Setup2FA;
