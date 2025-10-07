import React, { useState, useEffect } from 'react';
import { Html5QrcodeScanner } from 'html5-qrcode';
import { kinderService } from '../../services/kinder.service';
import { useAuth } from '../../contexts/AuthContext';

interface KidLoginModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const KidLoginModal: React.FC<KidLoginModalProps> = ({ isOpen, onClose }) => {
  const [activeTab, setActiveTab] = useState<'scan' | 'code'>('scan');
  const [manualCode, setManualCode] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [scanner, setScanner] = useState<Html5QrcodeScanner | null>(null);
  const { login } = useAuth();

  useEffect(() => {
    if (isOpen && activeTab === 'scan') {
      initializeScanner();
    }

    return () => {
      // Cleanup scanner on unmount
      if (scanner) {
        scanner.clear();
      }
    };
  }, [isOpen, activeTab]);

  const initializeScanner = () => {
    const newScanner = new Html5QrcodeScanner(
      'qr-scanner',
      {
        fps: 10,
        qrbox: { width: 250, height: 250 },
        aspectRatio: 1.0,
      },
      false
    );

    newScanner.render(
      (decodedText) => {
        console.log('QR code scanned:', decodedText);
        handleCodeSubmit(decodedText);
        newScanner.clear();
      },
      (error) => {
        // Ignore scanning errors (they happen frequently)
        console.debug('QR scan error:', error);
      }
    );

    setScanner(newScanner);
  };

  const handleCodeSubmit = async (code: string) => {
    setIsLoading(true);
    setError('');
    setSuccess('');

    try {
      console.log('Validating code:', code);
      
      // Validate the code with Kinder service
      const validation = await kinderService.validateLoginCode({ code });

      if (!validation.isValid) {
        setError(validation.message || 'Invalid or expired code');
        setIsLoading(false);
        return;
      }

      // Code is valid, now authenticate with Officer service
      if (validation.userId) {
        setSuccess('Login code validated! Authenticating...');
        
        // Call Officer service to complete authentication
        const authResponse = await fetch('http://localhost:5001/api/kid-auth/login-with-code', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ code: code })
        });

        if (!authResponse.ok) {
          const errorData = await authResponse.json();
          setError(errorData.error || 'Authentication failed');
          setSuccess('');
          return;
        }

        const authData = await authResponse.json();
        console.log('Kid authenticated:', authData);

        // Store the token
        localStorage.setItem('token', authData.accessToken);
        localStorage.setItem('user', JSON.stringify({
          id: authData.userId,
          username: authData.username,
          displayName: authData.displayName,
          isKidAccount: authData.isKidAccount
        }));

        setSuccess('Login successful! Redirecting...');
        
        setTimeout(() => {
          onClose();
          window.location.href = '/dashboard'; // Redirect to dashboard
        }, 1500);
      }
    } catch (err: any) {
      console.error('Login error:', err);
      setError(err.response?.data?.error || 'Failed to validate login code');
    } finally {
      setIsLoading(false);
    }
  };

  const handleManualCodeSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (manualCode.trim().length === 8) {
      handleCodeSubmit(manualCode.trim().toUpperCase());
    } else {
      setError('Please enter a valid 8-character code');
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          {/* Header */}
          <div className="flex justify-between items-center mb-6">
            <div>
              <h2 className="text-2xl font-bold text-gray-900">Kid Account Login</h2>
              <p className="text-gray-600 mt-1">
                Scan your QR code or enter the login code provided by your parent
              </p>
            </div>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 transition-colors"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* Tabs */}
          <div className="flex border-b border-gray-200 mb-6">
            <button
              onClick={() => setActiveTab('scan')}
              className={`flex-1 py-3 text-center font-medium transition-colors ${
                activeTab === 'scan'
                  ? 'text-purple-600 border-b-2 border-purple-600'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              📷 Scan QR Code
            </button>
            <button
              onClick={() => setActiveTab('code')}
              className={`flex-1 py-3 text-center font-medium transition-colors ${
                activeTab === 'code'
                  ? 'text-purple-600 border-b-2 border-purple-600'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              🔢 Enter Code
            </button>
          </div>

          {/* Error/Success Messages */}
          {error && (
            <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg">
              <div className="flex items-center">
                <svg className="w-5 h-5 text-red-500 mr-2" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
                <p className="text-red-700">{error}</p>
              </div>
            </div>
          )}

          {success && (
            <div className="mb-4 p-4 bg-green-50 border border-green-200 rounded-lg">
              <div className="flex items-center">
                <svg className="w-5 h-5 text-green-500 mr-2" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
                <p className="text-green-700">{success}</p>
              </div>
            </div>
          )}

          {/* Content */}
          {activeTab === 'scan' ? (
            <div>
              <div id="qr-scanner" className="rounded-lg overflow-hidden"></div>
              <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                <p className="text-sm text-blue-700">
                  <strong>How to use:</strong> Hold your device's camera up to the QR code displayed by your parent. 
                  The login will happen automatically once the code is recognized.
                </p>
              </div>
            </div>
          ) : (
            <form onSubmit={handleManualCodeSubmit}>
              <div className="mb-6">
                <label htmlFor="login-code" className="block text-sm font-medium text-gray-700 mb-2">
                  Enter 8-Character Login Code
                </label>
                <input
                  id="login-code"
                  type="text"
                  value={manualCode}
                  onChange={(e) => setManualCode(e.target.value.toUpperCase())}
                  placeholder="ABCD1234"
                  maxLength={8}
                  className="w-full px-4 py-3 text-center text-2xl font-mono tracking-widest border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent uppercase"
                  disabled={isLoading}
                />
                <p className="text-sm text-gray-500 mt-2">
                  Enter the 8-character code shown on your parent's device
                </p>
              </div>

              <button
                type="submit"
                disabled={isLoading || manualCode.length !== 8}
                className="w-full bg-purple-600 text-white py-3 px-4 rounded-lg font-medium hover:bg-purple-700 transition-colors disabled:bg-gray-300 disabled:cursor-not-allowed flex items-center justify-center"
              >
                {isLoading ? (
                  <>
                    <svg className="animate-spin h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Validating...
                  </>
                ) : (
                  'Login'
                )}
              </button>

              <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                <p className="text-sm text-blue-700">
                  <strong>Need help?</strong> Ask your parent to generate a new login code from their Kid Account Management screen.
                </p>
              </div>
            </form>
          )}

          {/* Footer */}
          <div className="mt-6 pt-6 border-t border-gray-200">
            <button
              onClick={onClose}
              className="text-sm text-gray-500 hover:text-gray-700 transition-colors"
            >
              ← Back to Adult Login
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default KidLoginModal;

