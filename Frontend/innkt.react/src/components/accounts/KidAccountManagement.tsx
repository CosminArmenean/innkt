import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { socialService, UserProfile } from '../../services/social.service';
import { qrCodeService, QRCodeGenerationResult } from '../../services/qr-code.service';
import { kinderService, KidLoginCodeResponse } from '../../services/kinder.service';
import { officerService, CreateKidAccountRequest } from '../../services/officer.service';
import ParentalControlDashboard from './ParentalControlDashboard';
import UsernameInput from '../common/UsernameInput';

interface KidAccountManagementProps {
  parentId: string;
  hideHeader?: boolean;
}

interface KidAccount extends UserProfile {
  qrCode?: QRCodeGenerationResult;
  loginCode?: KidLoginCodeResponse; // New: Kinder service login code
  independenceDate?: string;
  age?: number; // Kid's age for maturity calculations
  parentalControls: {
    canPost: boolean;
    canMessage: boolean;
    canJoinGroups: boolean;
    canViewContent: 'all' | 'filtered' | 'restricted';
    timeRestrictions: {
      enabled: boolean;
      startTime: string;
      endTime: string;
      timezone: string;
    };
    contentFilters: string[];
    allowedContacts: string[];
  };
}

const KidAccountManagement: React.FC<KidAccountManagementProps> = ({ parentId, hideHeader = false }) => {
  const { t } = useTranslation();
  const [kidAccounts, setKidAccounts] = useState<KidAccount[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showQRModal, setShowQRModal] = useState(false);
  const [selectedKid, setSelectedKid] = useState<KidAccount | null>(null);
  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const [showVerificationRequired, setShowVerificationRequired] = useState(false);

  // Form state for creating kid account
  const [newKidAccount, setNewKidAccount] = useState({
    username: '',
    displayName: '',
    dateOfBirth: '',
    independenceDate: '',
    parentalControls: {
      canPost: true,
      canMessage: false,
      canJoinGroups: false,
      canViewContent: 'filtered' as 'all' | 'filtered' | 'restricted',
      timeRestrictions: {
        enabled: true,
        startTime: '08:00',
        endTime: '20:00',
        timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
      },
      contentFilters: ['violence', 'adult-content', 'inappropriate-language'],
      allowedContacts: [],
    },
  });

  // Load kid accounts
  const loadKidAccounts = async () => {
    setIsLoading(true);
    try {
      // Get kid accounts from Officer service
      const kidAccountsData = await officerService.getParentKidAccounts(parentId);
      
      // Convert to KidAccount format for the UI
      const kidAccounts: KidAccount[] = kidAccountsData.map(kid => ({
        id: kid.id,
        username: kid.firstName.toLowerCase() + '.' + kid.lastName.toLowerCase(),
        displayName: kid.fullName,
        email: `${kid.firstName.toLowerCase()}.${kid.lastName.toLowerCase()}@innkt.kid`,
        isKidAccount: true,
        isVerified: false,
        parentId: kid.parentUserId,
        independenceDate: kid.independenceDate,
        followersCount: 0,
        followingCount: 0,
        postsCount: 0,
        createdAt: kid.createdAt,
        updatedAt: kid.createdAt,
        preferences: {
          privacyLevel: 'private',
          allowDirectMessages: false,
          allowMentions: true,
          notificationSettings: {
            newFollowers: false,
            newPosts: true,
            mentions: true,
            directMessages: false,
            groupUpdates: false,
            emailNotifications: false,
            pushNotifications: true,
          },
          theme: 'light',
          language: 'en',
          timezone: 'UTC',
        },
        socialLinks: {},
        parentalControls: {
          canPost: true,
          canMessage: false,
          canJoinGroups: false,
          canViewContent: 'filtered',
          timeRestrictions: {
            enabled: true,
            startTime: '08:00',
            endTime: '20:00',
            timezone: 'UTC',
          },
          contentFilters: ['violence', 'adult-content'],
          allowedContacts: [],
        },
      }));
      
      setKidAccounts(kidAccounts);
    } catch (error) {
      console.error('Failed to load kid accounts:', error);
      // Fallback to empty array if service is not available
      setKidAccounts([]);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadKidAccounts();
  }, [parentId]);

  // Create kid account
  const handleCreateKidAccount = async () => {
    if (!newKidAccount.username.trim() || !newKidAccount.displayName.trim()) return;

    setIsLoading(true);
    try {
      // Split display name into first and last name
      const displayNameParts = newKidAccount.displayName.trim().split(' ');
      const firstName = displayNameParts[0] || newKidAccount.displayName.trim();
      const lastName = displayNameParts.slice(1).join(' ') || 'User'; // Default to 'User' if no last name

      const kidData: CreateKidAccountRequest = {
        username: newKidAccount.username.trim(),
        firstName: firstName,
        lastName: lastName,
        birthDate: newKidAccount.dateOfBirth,
        country: 'US', // Default country, could be made configurable
        independenceDate: newKidAccount.independenceDate,
        acceptTerms: true,
        acceptPrivacyPolicy: true,
      };

      // Create kid account via Officer service
      const createdKid = await officerService.createKidAccount(kidData);
      
      // Generate QR code for the kid account (optional - handle errors gracefully)
      let qrCode: QRCodeGenerationResult | undefined = undefined;
      try {
        const qrData = {
          type: 'kid_account',
          kidId: createdKid.kidAccountId,
          parentId: parentId,
          username: newKidAccount.username.trim(),
          independenceDate: newKidAccount.independenceDate,
        };

        qrCode = await qrCodeService.generateQRCode({
          data: JSON.stringify(qrData),
          type: 'custom',
          size: 256,
          format: 'png',
          errorCorrection: 'H',
        });
        
        console.log('✅ QR code generated successfully for kid account');
      } catch (qrError) {
        console.warn('⚠️ QR code generation failed (non-critical):', qrError);
        // Continue with kid account creation even if QR generation fails
      }

      // Create a mock kid account object for the UI
      const kidWithQR: KidAccount = {
        id: createdKid.kidAccountId,
        username: newKidAccount.username.trim(),
        displayName: newKidAccount.displayName.trim(),
        email: `${newKidAccount.username.trim()}@innkt.kid`,
        isKidAccount: true,
        isVerified: false,
        parentId: parentId,
        independenceDate: newKidAccount.independenceDate,
        followersCount: 0,
        followingCount: 0,
        postsCount: 0,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        preferences: {
          privacyLevel: 'private',
          allowDirectMessages: false,
          allowMentions: true,
          notificationSettings: {
            newFollowers: false,
            newPosts: true,
            mentions: true,
            directMessages: false,
            groupUpdates: false,
            emailNotifications: false,
            pushNotifications: true,
          },
          theme: 'light',
          language: 'en',
          timezone: 'UTC',
        },
        socialLinks: {},
        parentalControls: newKidAccount.parentalControls,
        qrCode,
      };

      setKidAccounts(prev => [kidWithQR, ...prev]);
      setShowCreateModal(false);
      resetForm();
    } catch (error: any) {
      console.error('Failed to create kid account:', error);
      console.log('Error response data:', error.response?.data);
      console.log('Error response data type:', typeof error.response?.data);
      
      // Check if the error is due to parent verification requirement
      if (typeof error.response?.data === 'string' && 
          error.response.data.includes("Parent user must be verified to create kid accounts")) {
        console.log('Showing verification required modal');
        setShowVerificationRequired(true);
      } else {
        console.log('Showing generic error alert');
        alert('Failed to create kid account. Please try again.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  // Generate QR code for existing kid (Legacy - NeuroSpark)
  const generateQRForKid = async (kid: KidAccount) => {
    try {
      const qrData = {
        type: 'kid_account',
        kidId: kid.id,
        parentId: parentId,
        username: kid.username,
        independenceDate: kid.independenceDate,
      };

      const qrCode = await qrCodeService.generateQRCode({
        data: JSON.stringify(qrData),
        type: 'custom',
        size: 256,
        format: 'png',
        errorCorrection: 'H',
      });

      setKidAccounts(prev =>
        prev.map(k => k.id === kid.id ? { ...k, qrCode } : k)
      );

      return qrCode;
    } catch (error) {
      console.warn('⚠️ QR code generation failed for kid account (non-critical):', error);
      // Don't update the kid account if QR generation fails
      return null;
    }
  };

  // Generate login code with QR for kid (NEW - Kinder Service)
  const generateLoginCodeForKid = async (kid: KidAccount, expirationDays: number = 0) => {
    try {
      console.log('Generating login code for kid:', kid.id);
      
      const loginCode = await kinderService.generateLoginCode({
        kidAccountId: kid.id,
        parentId: parentId,
        expirationDays: expirationDays // 0 = use maturity-based default
      });

      console.log('Login code generated:', loginCode);

      setKidAccounts(prev =>
        prev.map(k => k.id === kid.id ? { ...k, loginCode } : k)
      );

      return loginCode;
    } catch (error) {
      console.error('Failed to generate login code:', error);
      return null;
    }
  };

  // Update parental controls
  const handleUpdateParentalControls = async (kidId: string, controls: Partial<KidAccount['parentalControls']>) => {
    try {
      // This would be a custom endpoint to update parental controls
      // For now, we'll just update the local state since we don't have a real API
      // await socialService.updateUserProfile(kidId, { parentalControls: controls });
      
      setKidAccounts(prev =>
        prev.map(k => k.id === kidId ? { ...k, parentalControls: { ...k.parentalControls, ...controls } } : k)
      );
    } catch (error) {
      console.error('Failed to update parental controls:', error);
    }
  };

  // Reset form
  const resetForm = () => {
    setNewKidAccount({
      username: '',
      displayName: '',
      dateOfBirth: '',
      independenceDate: '',
      parentalControls: {
        canPost: true,
        canMessage: false,
        canJoinGroups: false,
        canViewContent: 'filtered',
        timeRestrictions: {
          enabled: true,
          startTime: '08:00',
          endTime: '20:00',
          timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
        },
        contentFilters: ['violence', 'adult-content', 'inappropriate-language'],
        allowedContacts: [],
      },
    });
  };

  // Get age from date of birth
  const getAge = (dateOfBirth: string) => {
    const today = new Date();
    const birthDate = new Date(dateOfBirth);
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
    return age;
  };

  // Get independence status
  const getIndependenceStatus = (kid: KidAccount) => {
    if (!kid.independenceDate) return 'Not set';
    
    const independenceDate = new Date(kid.independenceDate);
    const today = new Date();
    
    if (independenceDate <= today) {
      return 'Independent';
    } else {
      const daysLeft = Math.ceil((independenceDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
      return `${daysLeft} days left`;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      {!hideHeader && (
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Kid Account Management</h2>
            <p className="text-gray-600">Manage your children's accounts and parental controls</p>
          </div>
          <button
            onClick={() => setShowCreateModal(true)}
            className="btn-primary"
          >
            Add Kid Account
          </button>
        </div>
      )}

      {/* Kid Accounts Grid */}
      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-innkt-primary"></div>
        </div>
      ) : kidAccounts.length === 0 ? (
        <div className="text-center py-12">
          <div className="w-16 h-16 mx-auto mb-4 bg-gray-100 rounded-full flex items-center justify-center">
            <span className="text-2xl">👶</span>
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">No Kid Accounts Yet</h3>
          <p className="text-gray-600 mb-6">Create your first kid account to get started with parental controls.</p>
          <button
            onClick={() => setShowCreateModal(true)}
            className="btn-primary"
          >
            Create First Kid Account
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {kidAccounts.map((kid) => (
            <div key={kid.id} className="card hover:shadow-md transition-shadow">
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center space-x-3">
                  <div className="w-12 h-12 rounded-full bg-gray-200 flex items-center justify-center">
                    {kid.avatar ? (
                      <img
                        src={kid.avatar}
                        alt={kid.displayName}
                        className="w-full h-full rounded-full object-cover"
                      />
                    ) : (
                      <span className="text-gray-600 font-semibold">
                        {kid.displayName.charAt(0).toUpperCase()}
                      </span>
                    )}
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900">{kid.displayName}</h3>
                    <p className="text-sm text-gray-600">@{kid.username}</p>
                    {kid.dateOfBirth && (
                      <p className="text-xs text-gray-500">Age: {getAge(kid.dateOfBirth)}</p>
                    )}
                  </div>
                </div>
                <div className="flex space-x-1">
                  <button
                    onClick={() => {
                      setSelectedKid(kid);
                      setShowQRModal(true);
                    }}
                    className="p-1 text-gray-400 hover:text-gray-600"
                    title="View QR Code"
                  >
                    📱
                  </button>
                  <button
                    onClick={() => {
                      setSelectedKid(kid);
                      setShowSettingsModal(true);
                    }}
                    className="p-1 text-gray-400 hover:text-gray-600"
                    title="Settings"
                  >
                    ⚙️
                  </button>
                </div>
              </div>

              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600">Independence:</span>
                  <span className={`font-medium ${
                    getIndependenceStatus(kid) === 'Independent' 
                      ? 'text-green-600' 
                      : 'text-orange-600'
                  }`}>
                    {getIndependenceStatus(kid)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Can Post:</span>
                  <span className={kid.parentalControls.canPost ? 'text-green-600' : 'text-red-600'}>
                    {kid.parentalControls.canPost ? 'Yes' : 'No'}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Can Message:</span>
                  <span className={kid.parentalControls.canMessage ? 'text-green-600' : 'text-red-600'}>
                    {kid.parentalControls.canMessage ? 'Yes' : 'No'}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Content Filter:</span>
                  <span className="text-gray-900 capitalize">
                    {kid.parentalControls.canViewContent}
                  </span>
                </div>
              </div>

              {kid.parentalControls.timeRestrictions.enabled && (
                <div className="mt-3 p-2 bg-blue-50 rounded-lg">
                  <p className="text-xs text-blue-800">
                    ⏰ Allowed time: {kid.parentalControls.timeRestrictions.startTime} - {kid.parentalControls.timeRestrictions.endTime}
                  </p>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Create Kid Account Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4 max-h-[90vh] overflow-y-auto">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Create Kid Account</h3>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Username *
                </label>
                <UsernameInput
                  value={newKidAccount.username}
                  onChange={(value) => setNewKidAccount(prev => ({ ...prev, username: value }))}
                  placeholder="Enter username"
                  showSuggestions={true}
                  debounceMs={500}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Display Name *
                </label>
                <input
                  type="text"
                  value={newKidAccount.displayName}
                  onChange={(e) => setNewKidAccount(prev => ({ ...prev, displayName: e.target.value }))}
                  className="input-field"
                  placeholder="Enter display name"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Date of Birth
                </label>
                <input
                  type="date"
                  value={newKidAccount.dateOfBirth}
                  onChange={(e) => setNewKidAccount(prev => ({ ...prev, dateOfBirth: e.target.value }))}
                  className="input-field"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Independence Date
                </label>
                <input
                  type="date"
                  value={newKidAccount.independenceDate}
                  onChange={(e) => setNewKidAccount(prev => ({ ...prev, independenceDate: e.target.value }))}
                  className="input-field"
                />
                <p className="text-xs text-gray-500 mt-1">
                  When this child can manage their own account
                </p>
              </div>

              <div className="space-y-2">
                <h4 className="text-sm font-medium text-gray-700">Initial Parental Controls</h4>
                
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={newKidAccount.parentalControls.canPost}
                    onChange={(e) => setNewKidAccount(prev => ({
                      ...prev,
                      parentalControls: { ...prev.parentalControls, canPost: e.target.checked }
                    }))}
                    className="rounded border-gray-300 text-innkt-primary focus:ring-innkt-primary"
                  />
                  <span className="ml-2 text-sm text-gray-700">Can create posts</span>
                </label>

                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={newKidAccount.parentalControls.canMessage}
                    onChange={(e) => setNewKidAccount(prev => ({
                      ...prev,
                      parentalControls: { ...prev.parentalControls, canMessage: e.target.checked }
                    }))}
                    className="rounded border-gray-300 text-innkt-primary focus:ring-innkt-primary"
                  />
                  <span className="ml-2 text-sm text-gray-700">Can send messages</span>
                </label>

                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={newKidAccount.parentalControls.canJoinGroups}
                    onChange={(e) => setNewKidAccount(prev => ({
                      ...prev,
                      parentalControls: { ...prev.parentalControls, canJoinGroups: e.target.checked }
                    }))}
                    className="rounded border-gray-300 text-innkt-primary focus:ring-innkt-primary"
                  />
                  <span className="ml-2 text-sm text-gray-700">Can join groups</span>
                </label>
              </div>
            </div>

            <div className="flex justify-end space-x-3 mt-6">
              <button
                onClick={() => {
                  setShowCreateModal(false);
                  resetForm();
                }}
                className="btn-secondary"
              >
                Cancel
              </button>
              <button
                onClick={handleCreateKidAccount}
                disabled={!newKidAccount.username.trim() || !newKidAccount.displayName.trim() || isLoading}
                className="btn-primary disabled:opacity-50"
              >
                {isLoading ? 'Creating...' : 'Create Account'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* QR Code Modal */}
      {showQRModal && selectedKid && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-sm w-full mx-4">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Kid Account QR Code
            </h3>
            
            <div className="text-center">
              <div className="w-64 h-64 bg-gray-100 rounded-lg mx-auto mb-4 flex items-center justify-center">
                {selectedKid.loginCode ? (
                  <img
                    src={selectedKid.loginCode.qrCodeDataUrl}
                    alt="Login QR Code"
                    className="w-full h-full object-contain p-4"
                  />
                ) : (
                  <span className="text-gray-500">QR Code will appear here</span>
                )}
              </div>

              {selectedKid.loginCode && (
                <div className="space-y-3 mb-4">
                  <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
                    <p className="text-sm text-gray-600 mb-2">Login Code:</p>
                    <p className="text-2xl font-mono font-bold text-purple-600 tracking-widest">
                      {selectedKid.loginCode.code}
                    </p>
                  </div>
                  
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-600">Maturity Level:</span>
                    <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                      selectedKid.loginCode.maturityLevel === 'high' ? 'bg-green-100 text-green-800' :
                      selectedKid.loginCode.maturityLevel === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                      'bg-blue-100 text-blue-800'
                    }`}>
                      {selectedKid.loginCode.maturityLevel.toUpperCase()}
                    </span>
                  </div>

                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-600">Expires:</span>
                    <span className="text-gray-900 font-medium">
                      {new Date(selectedKid.loginCode.expiresAt).toLocaleDateString()} 
                      ({selectedKid.loginCode.expirationDays} days)
                    </span>
                  </div>
                </div>
              )}

              <p className="text-sm text-gray-600">
                {selectedKid.loginCode 
                  ? 'Your kid can scan this QR code or enter the code to login securely.'
                  : `Generate a secure login code for ${selectedKid.displayName}'s device. Expiration is based on maturity level.`
                }
              </p>
            </div>

            <div className="flex justify-end space-x-3 mt-4">
              <button
                onClick={() => setShowQRModal(false)}
                className="btn-secondary"
              >
                Close
              </button>
              <button
                onClick={async () => {
                  await generateLoginCodeForKid(selectedKid);
                }}
                className="btn-primary"
              >
                {selectedKid.loginCode ? 'Regenerate Code' : 'Generate Login Code'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Settings Modal - Parental Control Dashboard */}
      {showSettingsModal && selectedKid && (
        <ParentalControlDashboard
          kid={{
            id: selectedKid.id,
            username: selectedKid.username,
            displayName: selectedKid.displayName,
            age: selectedKid.age || 10 // Default age if not set
          }}
          parentId={parentId}
          onClose={() => setShowSettingsModal(false)}
        />
      )}

      {/* Verification Required Modal */}
      {showVerificationRequired && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <div className="flex items-center justify-center w-12 h-12 mx-auto bg-yellow-100 rounded-full mb-4">
              <svg className="w-6 h-6 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.732-.833-2.5 0L4.268 19.5c-.77.833.192 2.5 1.732 2.5z" />
              </svg>
            </div>
            
            <h3 className="text-lg font-semibold text-gray-900 text-center mb-2">
              Account Verification Required
            </h3>
            
            <p className="text-gray-600 text-center mb-6">
              To create kid accounts, you need to verify your identity first. This helps us ensure a safe environment for children.
            </p>
            
            <div className="flex flex-col sm:flex-row gap-3">
              <button
                onClick={() => setShowVerificationRequired(false)}
                className="flex-1 px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  setShowVerificationRequired(false);
                  // Navigate to verification page - you can customize this route
                  window.location.href = '/verification';
                }}
                className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                Go to Verification
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default KidAccountManagement;

