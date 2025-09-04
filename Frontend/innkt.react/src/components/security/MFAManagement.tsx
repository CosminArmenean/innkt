import React, { useState, useEffect } from 'react';
import { qrCodeService } from '../../services/qr-code.service';

interface MFASetup {
  isEnabled: boolean;
  secret: string;
  qrCodeUrl: string;
  backupCodes: string[];
  devices: MFADevice[];
}

interface MFADevice {
  id: string;
  name: string;
  lastUsed: string;
  isTrusted: boolean;
  location?: string;
}

const MFAManagement: React.FC = () => {
  const [mfaSetup, setMfaSetup] = useState<MFASetup>({
    isEnabled: false,
    secret: '',
    qrCodeUrl: '',
    backupCodes: [],
    devices: []
  });
  const [verificationCode, setVerificationCode] = useState('');
  const [isSettingUp, setIsSettingUp] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);
  const [showBackupCodes, setShowBackupCodes] = useState(false);
  const [newDeviceName, setNewDeviceName] = useState('');

  useEffect(() => {
    // TODO: Load MFA status from API
    loadMFAStatus();
  }, []);

  const loadMFAStatus = async () => {
    // TODO: Implement API call to get MFA status
    // For now, using mock data
    setMfaSetup({
      isEnabled: false,
      secret: 'JBSWY3DPEHPK3PXP',
      qrCodeUrl: '',
      backupCodes: ['12345678', '87654321', '11223344', '44332211'],
      devices: [
        {
          id: '1',
          name: 'iPhone 13',
          lastUsed: new Date().toISOString(),
          isTrusted: true,
          location: 'New York, NY'
        }
      ]
    });
  };

  const handleSetupMFA = async () => {
    setIsSettingUp(true);
    try {
      // TODO: Call API to generate MFA secret and QR code
      const qrCodeData = `otpauth://totp/INNKT:user@example.com?secret=${mfaSetup.secret}&issuer=INNKT`;
      
      // Generate QR code using our service
      const qrResult = await qrCodeService.generateQRCode({
        data: qrCodeData,
        type: 'custom',
        size: 200,
        format: 'png'
      });

      setMfaSetup(prev => ({
        ...prev,
        qrCodeUrl: qrResult.qrCodeUrl
      }));
    } catch (error) {
      console.error('Failed to setup MFA:', error);
    } finally {
      setIsSettingUp(false);
    }
  };

  const handleVerifyAndEnable = async () => {
    if (!verificationCode) return;
    
    setIsVerifying(true);
    try {
      // TODO: Verify TOTP code with backend
      // For now, simulate verification
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      setMfaSetup(prev => ({
        ...prev,
        isEnabled: true
      }));
      
      setVerificationCode('');
    } catch (error) {
      console.error('Verification failed:', error);
    } finally {
      setIsVerifying(false);
    }
  };

  const handleDisableMFA = async () => {
    try {
      // TODO: Call API to disable MFA
      setMfaSetup(prev => ({
        ...prev,
        isEnabled: false
      }));
    } catch (error) {
      console.error('Failed to disable MFA:', error);
    }
  };

  const handleAddDevice = async () => {
    if (!newDeviceName) return;
    
    try {
      const newDevice: MFADevice = {
        id: Date.now().toString(),
        name: newDeviceName,
        lastUsed: new Date().toISOString(),
        isTrusted: false
      };
      
      setMfaSetup(prev => ({
        ...prev,
        devices: [...prev.devices, newDevice]
      }));
      
      setNewDeviceName('');
    } catch (error) {
      console.error('Failed to add device:', error);
    }
  };

  const handleRemoveDevice = async (deviceId: string) => {
    try {
      setMfaSetup(prev => ({
        ...prev,
        devices: prev.devices.filter(d => d.id !== deviceId)
      }));
    } catch (error) {
      console.error('Failed to remove device:', error);
    }
  };

  const handleTrustDevice = async (deviceId: string) => {
    try {
      setMfaSetup(prev => ({
        ...prev,
        devices: prev.devices.map(d => 
          d.id === deviceId ? { ...d, isTrusted: true } : d
        )
      }));
    } catch (error) {
      console.error('Failed to trust device:', error);
    }
  };

  return (
    <div className="space-y-6">
      {/* MFA Status */}
      <div className="card">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900">Two-Factor Authentication</h3>
          <div className="flex items-center space-x-3">
            <span className={`px-3 py-1 rounded-full text-sm font-medium ${
              mfaSetup.isEnabled 
                ? 'bg-green-100 text-green-800' 
                : 'bg-red-100 text-red-800'
            }`}>
              {mfaSetup.isEnabled ? 'Enabled' : 'Disabled'}
            </span>
            {mfaSetup.isEnabled ? (
              <button
                onClick={handleDisableMFA}
                className="btn-secondary text-sm px-4 py-2"
              >
                Disable
              </button>
            ) : (
              <button
                onClick={handleSetupMFA}
                disabled={isSettingUp}
                className="btn-primary text-sm px-4 py-2"
              >
                {isSettingUp ? 'Setting up...' : 'Enable'}
              </button>
            )}
          </div>
        </div>

        {!mfaSetup.isEnabled && mfaSetup.qrCodeUrl && (
          <div className="border-t pt-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* QR Code */}
              <div className="text-center">
                <h4 className="text-sm font-medium text-gray-700 mb-3">Scan QR Code</h4>
                <div className="inline-block p-4 bg-white border rounded-lg">
                  <img
                    src={mfaSetup.qrCodeUrl}
                    alt="MFA QR Code"
                    className="w-48 h-48"
                  />
                </div>
                <p className="text-xs text-gray-500 mt-2">
                  Use your authenticator app to scan this QR code
                </p>
              </div>

              {/* Manual Setup */}
              <div>
                <h4 className="text-sm font-medium text-gray-700 mb-3">Manual Setup</h4>
                <div className="space-y-3">
                  <div>
                    <label className="block text-xs text-gray-500 mb-1">Secret Key</label>
                    <div className="flex items-center space-x-2">
                      <code className="flex-1 px-3 py-2 bg-gray-100 rounded text-sm font-mono">
                        {mfaSetup.secret}
                      </code>
                      <button
                        onClick={() => navigator.clipboard.writeText(mfaSetup.secret)}
                        className="text-innkt-primary hover:text-innkt-dark text-sm"
                      >
                        Copy
                      </button>
                    </div>
                  </div>
                  
                  <div>
                    <label className="block text-xs text-gray-500 mb-1">Verification Code</label>
                    <div className="flex space-x-2">
                      <input
                        type="text"
                        value={verificationCode}
                        onChange={(e) => setVerificationCode(e.target.value)}
                        placeholder="Enter 6-digit code"
                        className="input-field flex-1 text-center text-lg tracking-widest"
                        maxLength={6}
                      />
                      <button
                        onClick={handleVerifyAndEnable}
                        disabled={!verificationCode || verificationCode.length !== 6 || isVerifying}
                        className="btn-primary px-4 py-2"
                      >
                        {isVerifying ? 'Verifying...' : 'Verify'}
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Backup Codes */}
      {mfaSetup.isEnabled && (
        <div className="card">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">Backup Codes</h3>
            <button
              onClick={() => setShowBackupCodes(!showBackupCodes)}
              className="btn-secondary text-sm px-4 py-2"
            >
              {showBackupCodes ? 'Hide' : 'Show'} Codes
            </button>
          </div>
          
          {showBackupCodes && (
            <div className="border-t pt-4">
              <p className="text-sm text-gray-600 mb-4">
                Save these backup codes in a secure location. You can use them to access your account if you lose your authenticator device.
              </p>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {mfaSetup.backupCodes.map((code, index) => (
                  <div
                    key={index}
                    className="px-3 py-2 bg-gray-100 rounded text-center font-mono text-sm"
                  >
                    {code}
                  </div>
                ))}
              </div>
              <div className="mt-4 flex space-x-3">
                <button
                  onClick={() => navigator.clipboard.writeText(mfaSetup.backupCodes.join('\n'))}
                  className="btn-secondary text-sm px-4 py-2"
                >
                  Copy All
                </button>
                <button
                  onClick={() => window.print()}
                  className="btn-secondary text-sm px-4 py-2"
                >
                  Print
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Trusted Devices */}
      {mfaSetup.isEnabled && (
        <div className="card">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">Trusted Devices</h3>
            <div className="flex space-x-2">
              <input
                type="text"
                value={newDeviceName}
                onChange={(e) => setNewDeviceName(e.target.value)}
                placeholder="Device name"
                className="input-field text-sm"
              />
              <button
                onClick={handleAddDevice}
                disabled={!newDeviceName}
                className="btn-primary text-sm px-4 py-2"
              >
                Add Device
              </button>
            </div>
          </div>

          <div className="space-y-3">
            {mfaSetup.devices.map((device) => (
              <div
                key={device.id}
                className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
              >
                <div className="flex-1">
                  <div className="flex items-center space-x-3">
                    <span className="text-sm font-medium text-gray-900">
                      {device.name}
                    </span>
                    {device.isTrusted && (
                      <span className="px-2 py-1 bg-green-100 text-green-800 text-xs rounded-full">
                        Trusted
                      </span>
                    )}
                  </div>
                  <div className="text-xs text-gray-500 mt-1">
                    Last used: {new Date(device.lastUsed).toLocaleDateString()}
                    {device.location && ` • ${device.location}`}
                  </div>
                </div>
                
                <div className="flex items-center space-x-2">
                  {!device.isTrusted && (
                    <button
                      onClick={() => handleTrustDevice(device.id)}
                      className="text-innkt-primary hover:text-innkt-dark text-sm"
                    >
                      Trust
                    </button>
                  )}
                  <button
                    onClick={() => handleRemoveDevice(device.id)}
                    className="text-red-600 hover:text-red-800 text-sm"
                  >
                    Remove
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default MFAManagement;


