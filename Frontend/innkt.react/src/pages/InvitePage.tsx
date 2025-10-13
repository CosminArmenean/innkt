import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { groupsService } from '../services/groups.service';
import { socialService } from '../services/social.service';
import { officerService } from '../services/officer.service';

interface GroupInvite {
  id: string;
  groupId: string;
  subgroupId?: string; // Add subgroup support
  groupName: string;
  groupDescription: string;
  groupType: string;
  inviterName: string;
  inviterId: string;
  message?: string;
  expiresAt?: string;
  isEducational: boolean;
}

interface KidAccount {
  id: string;
  username?: string;
  firstName: string;
  lastName: string;
  fullName: string;
  isActive: boolean;
}

const InvitePage: React.FC = () => {
  const { t } = useTranslation();
  const { inviteId } = useParams<{ inviteId: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  
  const [invite, setInvite] = useState<GroupInvite | null>(null);
  const [kidAccounts, setKidAccounts] = useState<KidAccount[]>([]);
  const [selectedKidId, setSelectedKidId] = useState<string>('');
  const [isLoading, setIsLoading] = useState(true);
  const [isJoining, setIsJoining] = useState(false);
  const [error, setError] = useState<string>('');

  useEffect(() => {
    if (inviteId) {
      loadInvite();
    }
  }, [inviteId]);

  const loadInvite = async () => {
    try {
      setIsLoading(true);
      setError('');
      
      if (!inviteId) {
        setError('Invalid invitation ID');
        return;
      }
      
      // Fetch real invitation data from backend
      const invitation = await groupsService.getInvitation(inviteId);
      
      if (!invitation) {
        setError('Invitation not found or expired');
        return;
      }
      
      const invite: GroupInvite = {
        id: invitation.id,
        groupId: invitation.groupId,
        subgroupId: invitation.subgroupId,
        groupName: invitation.group?.name || 'Unknown Group',
        groupDescription: invitation.group?.description || '',
        groupType: invitation.group?.groupType || 'general',
        inviterName: invitation.invitedByRoleName || invitation.invitedBy?.displayName || 'Unknown User',
        inviterId: invitation.invitedByUserId,
        message: invitation.message,
        expiresAt: invitation.expiresAt,
        isEducational: invitation.group?.groupType === 'educational' || invitation.subgroupId !== null
      };
      
      console.log('📧 Invite data loaded:', {
        id: invite.id,
        groupName: invite.groupName,
        subgroupId: invite.subgroupId,
        groupType: invite.groupType,
        isEducational: invite.isEducational,
        inviterName: invite.inviterName
      });
      
      setInvite(invite);
      
      // Load kid accounts if this is an educational group
      if (invite.isEducational) {
        await loadKidAccounts();
      }
    } catch (err) {
      console.error('Failed to load invite:', err);
      setError('Failed to load invitation details');
    } finally {
      setIsLoading(false);
    }
  };

  const loadKidAccounts = async () => {
    try {
      // Fetch kid accounts from the backend
      const response = await socialService.getKidAccounts();
      setKidAccounts(response || []);
    } catch (err) {
      console.error('Failed to load kid accounts:', err);
      // Don't set error here as it's not critical
    }
  };

  const handleJoinGroup = async () => {
    if (!invite) return;
    
    try {
      setIsJoining(true);
      setError('');
      
      console.log('🎯 Attempting to join group:', {
        groupId: invite.groupId,
        isEducational: invite.isEducational,
        selectedKidId: selectedKidId
      });
      
      if (invite.isEducational && !selectedKidId) {
        setError(t('groups.invitations.pleaseSelectKid'));
        return;
      }
      
      // Join the group or subgroup
      if (invite.isEducational && selectedKidId) {
        // Handle creating a new kid account for subgroup invitations
        if (selectedKidId === 'create-new') {
          if (invite.subgroupId) {
            // Create a one-off kid and join subgroup
            console.log('🎯 Creating one-off kid for subgroup:', invite.groupId, invite.subgroupId);
            // TODO: Implement createOneOffKidAndJoinSubgroup method
            setError(t('groups.invitations.creatingOneOffNotImplemented'));
            return;
          } else {
            setError(t('groups.invitations.oneOffKidsSubgroupOnly'));
            return;
          }
        }
        
        // Join with existing kid account
        if (invite.subgroupId) {
          // Join subgroup with kid account
          console.log('🎯 Calling joinSubgroupWithKid with:', invite.groupId, invite.subgroupId, selectedKidId);
          await groupsService.joinSubgroupWithKid(invite.groupId, invite.subgroupId, selectedKidId);
        } else {
          // Join main group with kid account
          console.log('🎯 Calling joinGroupWithKid with:', invite.groupId, selectedKidId);
          await groupsService.joinGroupWithKid(invite.groupId, selectedKidId);
        }
      } else {
        // Join with main account
        console.log('🎯 Calling joinGroup with:', invite.groupId);
        await groupsService.joinGroup(invite.groupId);
      }
      
      // Navigate to the group page
      navigate(`/groups/${invite.groupId}`);
    } catch (err: any) {
      console.error('Failed to join group:', err);
      setError(err.message || t('groups.invitations.failedToJoinGroup'));
    } finally {
      setIsJoining(false);
    }
  };

  const handleDeclineInvite = async () => {
    try {
      // Decline the invitation
      await groupsService.declineInvite(inviteId || '');
      navigate('/groups');
    } catch (err) {
      console.error('Failed to decline invite:', err);
      setError('Failed to decline invitation');
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600 mx-auto mb-4"></div>
          <p className="text-gray-600">{t('groups.invitations.loadingInvitation')}</p>
        </div>
      </div>
    );
  }

  if (!invite) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">{t('groups.invitations.invitationNotFound')}</h2>
          <p className="text-gray-600 mb-8">{t('groups.invitations.invitationExpiredOrRevoked')}</p>
          <button
            onClick={() => navigate('/groups')}
            className="bg-purple-600 text-white px-6 py-2 rounded-lg hover:bg-purple-700 transition-colors"
          >
            {t('groups.invitations.browseGroups')}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-2xl mx-auto px-4">
        <div className="bg-white rounded-lg shadow-lg p-8">
          {/* Header */}
          <div className="text-center mb-8">
            <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <span className="text-2xl">{invite.subgroupId ? '🎓' : '👥'}</span>
            </div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              {invite.subgroupId ? t('groups.invitations.subgroupInvitation') : t('groups.invitations.groupInvitation')}
            </h1>
            <p className="text-gray-600">
              {invite.subgroupId 
                ? t('groups.invitations.invitedToSubgroup')
                : t('groups.invitations.invitedToGroup')
              }
            </p>
          </div>

          {/* Group Details */}
          <div className="bg-gray-50 rounded-lg p-6 mb-6">
            {/* Subgroup Information */}
            {invite.subgroupId && (
              <div className="mb-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                <div className="flex items-center space-x-2 mb-2">
                  <span className="text-blue-600">🎓</span>
                  <h3 className="text-lg font-semibold text-blue-900">{t('groups.invitations.subgroupInvitationTitle')}</h3>
                </div>
                <p className="text-sm text-blue-800">
                  {t('groups.invitations.subgroupInvitationDesc')}
                </p>
              </div>
            )}
            
            <h2 className="text-xl font-semibold text-gray-900 mb-2">{invite.groupName}</h2>
            <p className="text-gray-600 mb-4">{invite.groupDescription}</p>
            
            <div className="flex items-center justify-between text-sm text-gray-500">
              <span>{t('groups.invitations.invitedBy')}: <strong>{invite.inviterName}</strong></span>
              <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                invite.groupType === 'educational' 
                  ? 'bg-blue-100 text-blue-800' 
                  : 'bg-gray-100 text-gray-800'
              }`}>
                {invite.groupType}
              </span>
            </div>
            
            {invite.message && (
              <div className="mt-4 p-4 bg-white rounded border-l-4 border-purple-500">
                <p className="text-gray-700 italic">"{invite.message}"</p>
              </div>
            )}
          </div>

          {/* Kid Account Selection for Educational Groups */}
          {invite.isEducational && (
            <div className="mb-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                {invite.subgroupId ? t('groups.invitations.selectKidForSubgroup') : t('groups.invitations.selectKidAccountLabel')}
              </h3>
              <p className="text-gray-600 mb-4">
                {invite.subgroupId 
                  ? t('groups.invitations.subgroupInvitationExplanation')
                  : t('groups.invitations.educationalGroupExplanation')
                }
              </p>
              
              {/* Option to create a one-off kid for subgroup invitations */}
              {invite.subgroupId && (
                <div className="mb-4 p-4 bg-orange-50 border border-orange-200 rounded-lg">
                  <div className="flex items-center space-x-2 mb-2">
                    <span className="text-orange-600">👶</span>
                    <h4 className="text-md font-semibold text-orange-900">{t('groups.invitations.createOneOffKid')}</h4>
                  </div>
                  <p className="text-sm text-orange-800 mb-3">
                    {t('groups.invitations.createOneOffKidDesc')}
                  </p>
                  <button
                    onClick={() => setSelectedKidId('create-new')}
                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                      selectedKidId === 'create-new'
                        ? 'bg-orange-600 text-white'
                        : 'bg-orange-100 text-orange-800 hover:bg-orange-200'
                    }`}
                  >
                    {selectedKidId === 'create-new' ? t('groups.invitations.selected') : t('groups.invitations.createNewKidAccount')}
                  </button>
                </div>
              )}
              
              {/* Existing kid accounts */}
              {kidAccounts.length > 0 && (
                <div className="mb-4">
                  <h4 className="text-md font-medium text-gray-700 mb-3">{t('groups.invitations.orSelectExisting')}</h4>
                  <div className="space-y-3">
                    {kidAccounts.map((kid) => (
                      <label
                        key={kid.id}
                        className={`flex items-center p-4 border rounded-lg cursor-pointer transition-colors ${
                          selectedKidId === kid.id
                            ? 'border-purple-500 bg-purple-50'
                            : 'border-gray-200 hover:border-gray-300'
                        }`}
                      >
                        <input
                          type="radio"
                          name="kidAccount"
                          value={kid.id}
                          checked={selectedKidId === kid.id}
                          onChange={(e) => setSelectedKidId(e.target.value)}
                          className="sr-only"
                        />
                        <div className="flex items-center space-x-3">
                          <div className={`w-4 h-4 rounded-full border-2 ${
                            selectedKidId === kid.id
                              ? 'border-purple-500 bg-purple-500'
                              : 'border-gray-300'
                          }`}>
                            {selectedKidId === kid.id && (
                              <div className="w-2 h-2 bg-white rounded-full mx-auto mt-0.5"></div>
                            )}
                          </div>
                          <div>
                            <p className="font-medium text-gray-900">{kid.fullName}</p>
                            {kid.username && <p className="text-sm text-gray-500">@{kid.username}</p>}
                          </div>
                          <div className="ml-auto">
                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                              kid.isActive
                                ? 'bg-green-100 text-green-800'
                                : 'bg-gray-100 text-gray-800'
                            }`}>
                              {kid.isActive ? t('groups.invitations.active') : t('groups.invitations.inactive')}
                            </span>
                          </div>
                        </div>
                      </label>
                    ))}
                  </div>
                </div>
              )}
              
              {/* No existing kid accounts */}
              {kidAccounts.length === 0 && !invite.subgroupId && (
                <div className="text-center py-8 text-gray-500">
                  <p>{t('groups.invitations.noKidAccountsFound')}</p>
                  <p className="text-sm">{t('groups.invitations.createKidAccountFirst')}</p>
                </div>
              )}
            </div>
          )}

          {/* Error Message */}
          {error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-red-600">{error}</p>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex space-x-4">
            <button
              onClick={handleJoinGroup}
              disabled={isJoining || (invite.isEducational && !selectedKidId)}
              className="flex-1 bg-purple-600 text-white py-3 px-6 rounded-lg font-medium hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {isJoining ? t('groups.invitations.joining') : (invite.isEducational && selectedKidId === 'create-new') ? t('groups.invitations.createKidAndAccept') : t('groups.invitations.acceptInvitation')}
            </button>
            
            <button
              onClick={handleDeclineInvite}
              disabled={isJoining}
              className="flex-1 bg-gray-200 text-gray-800 py-3 px-6 rounded-lg font-medium hover:bg-gray-300 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {t('groups.invitations.decline')}
            </button>
          </div>

          {/* Expiration Notice */}
          {invite.expiresAt && (
            <div className="mt-6 text-center text-sm text-gray-500">
              <p>{t('groups.invitations.expiresOn')} {new Date(invite.expiresAt).toLocaleDateString()}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default InvitePage;
