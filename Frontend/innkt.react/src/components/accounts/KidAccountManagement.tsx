import React, { useState, useEffect } from 'react';
import { socialService, UserProfile } from '../../services/social.service';
import { qrCodeService, QRCodeGenerationResult } from '../../services/qr-code.service';

interface KidAccountManagementProps {
  parentId: string;
}

interface KidAccount extends UserProfile {
  qrCode?: QRCodeGenerationResult;
  independenceDate?: string;
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

const KidAccountManagement: React.FC<KidAccountManagementProps> = ({ parentId }) => {
  const [kidAccounts, setKidAccounts] = useState<KidAccount[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showQRModal, setShowQRModal] = useState(false);
  const [selectedKid, setSelectedKid] = useState<KidAccount | null>(null);
  const [showSettingsModal, setShowSettingsModal] = useState(false);

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
      // This would be a custom endpoint to get kid accounts for a parent
      const response = await socialService.getUserProfile(parentId);
      // For now, we'll simulate kid accounts
             const mockKidAccounts: KidAccount[] = [
         {
           id: 'kid1',
           username: 'alex_kid',
           displayName: 'Alex Johnson',
           email: 'alex@example.com',
           isKidAccount: true,
           isVerified: false,
           parentId: parentId,
           independenceDate: '2025-12-31',
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
        },
      ];
      setKidAccounts(mockKidAccounts);
    } catch (error) {
      console.error('Failed to load kid accounts:', error);
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
      const kidData = {
        username: newKidAccount.username.trim(),
        displayName: newKidAccount.displayName.trim(),
        dateOfBirth: newKidAccount.dateOfBirth,
        isKidAccount: true,
        parentId: parentId,
        independenceDate: newKidAccount.independenceDate,
        parentalControls: newKidAccount.parentalControls,
      };

      // This would be a custom endpoint to create kid accounts
      const createdKid = await socialService.createUser(kidData);
      
      // Generate QR code for the kid account
      const qrData = {
        type: 'kid_account',
        kidId: createdKid.id,
        parentId: parentId,
        username: createdKid.username,
        independenceDate: createdKid.independenceDate,
      };

      const qrCode = await qrCodeService.generateQRCode({
        data: JSON.stringify(qrData),
        type: 'custom',
        size: 256,
        format: 'png',
        errorCorrection: 'H',
      });

      const kidWithQR: KidAccount = {
        ...createdKid,
        qrCode,
        parentalControls: newKidAccount.parentalControls,
      };

      setKidAccounts(prev => [kidWithQR, ...prev]);
      setShowCreateModal(false);
      resetForm();
    } catch (error) {
      console.error('Failed to create kid account:', error);
      alert('Failed to create kid account. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  // Generate QR code for existing kid
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
      console.error('Failed to generate QR code:', error);
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

      {/* Kid Accounts Grid */}
      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-innkt-primary"></div>
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
                <input
                  type="text"
                  value={newKidAccount.username}
                  onChange={(e) => setNewKidAccount(prev => ({ ...prev, username: e.target.value }))}
                  className="input-field"
                  placeholder="Enter username"
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
              <div className="w-48 h-48 bg-gray-100 rounded-lg mx-auto mb-4 flex items-center justify-center">
                {selectedKid.qrCode ? (
                  <img
                    src={selectedKid.qrCode.qrCodeUrl}
                    alt="QR Code"
                    className="w-full h-full object-contain"
                  />
                ) : (
                  <span className="text-gray-500">QR Code will appear here</span>
                )}
              </div>
              <p className="text-sm text-gray-600 mb-4">
                Share this QR code with teachers or caregivers to allow them to post on behalf of <strong>{selectedKid.displayName}</strong>
              </p>
            </div>

            <div className="flex justify-end space-x-3">
              <button
                onClick={() => setShowQRModal(false)}
                className="btn-secondary"
              >
                Close
              </button>
              {!selectedKid.qrCode && (
                <button
                  onClick={async () => {
                    await generateQRForKid(selectedKid);
                  }}
                  className="btn-primary"
                >
                  Generate QR Code
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Settings Modal */}
      {showSettingsModal && selectedKid && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4 max-h-[90vh] overflow-y-auto">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Parental Controls - {selectedKid.displayName}
            </h3>
            
            <div className="space-y-4">
              <div className="space-y-2">
                <h4 className="text-sm font-medium text-gray-700">Permissions</h4>
                
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={selectedKid.parentalControls.canPost}
                    onChange={(e) => handleUpdateParentalControls(selectedKid.id, { canPost: e.target.checked })}
                    className="rounded border-gray-300 text-innkt-primary focus:ring-innkt-primary"
                  />
                  <span className="ml-2 text-sm text-gray-700">Can create posts</span>
                </label>

                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={selectedKid.parentalControls.canMessage}
                    onChange={(e) => handleUpdateParentalControls(selectedKid.id, { canMessage: e.target.checked })}
                    className="rounded border-gray-300 text-innkt-primary focus:ring-innkt-primary"
                  />
                  <span className="ml-2 text-sm text-gray-700">Can send messages</span>
                </label>

                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={selectedKid.parentalControls.canJoinGroups}
                    onChange={(e) => handleUpdateParentalControls(selectedKid.id, { canJoinGroups: e.target.checked })}
                    className="rounded border-gray-300 text-innkt-primary focus:ring-innkt-primary"
                  />
                  <span className="ml-2 text-sm text-gray-700">Can join groups</span>
                </label>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Content Filter Level
                </label>
                <select
                  value={selectedKid.parentalControls.canViewContent}
                  onChange={(e) => handleUpdateParentalControls(selectedKid.id, { canViewContent: e.target.value as any })}
                  className="input-field"
                >
                  <option value="all">All Content</option>
                  <option value="filtered">Filtered Content</option>
                  <option value="restricted">Restricted Content</option>
                </select>
              </div>

              <div className="space-y-2">
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={selectedKid.parentalControls.timeRestrictions.enabled}
                    onChange={(e) => handleUpdateParentalControls(selectedKid.id, {
                      timeRestrictions: {
                        ...selectedKid.parentalControls.timeRestrictions,
                        enabled: e.target.checked
                      }
                    })}
                    className="rounded border-gray-300 text-innkt-primary focus:ring-innkt-primary"
                  />
                  <span className="ml-2 text-sm text-gray-700">Enable time restrictions</span>
                </label>

                {selectedKid.parentalControls.timeRestrictions.enabled && (
                  <div className="ml-6 space-y-2">
                    <div className="flex space-x-2">
                      <input
                        type="time"
                        value={selectedKid.parentalControls.timeRestrictions.startTime}
                        onChange={(e) => handleUpdateParentalControls(selectedKid.id, {
                          timeRestrictions: {
                            ...selectedKid.parentalControls.timeRestrictions,
                            startTime: e.target.value
                          }
                        })}
                        className="input-field flex-1"
                      />
                      <span className="text-gray-500 self-center">to</span>
                      <input
                        type="time"
                        value={selectedKid.parentalControls.timeRestrictions.endTime}
                        onChange={(e) => handleUpdateParentalControls(selectedKid.id, {
                          timeRestrictions: {
                            ...selectedKid.parentalControls.timeRestrictions,
                            endTime: e.target.value
                          }
                        })}
                        className="input-field flex-1"
                      />
                    </div>
                  </div>
                )}
              </div>
            </div>

            <div className="flex justify-end space-x-3 mt-6">
              <button
                onClick={() => setShowSettingsModal(false)}
                className="btn-secondary"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default KidAccountManagement;

