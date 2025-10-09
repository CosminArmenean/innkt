import React, { useState, useEffect } from 'react';
import { groupsService, GroupInvitationResponse } from '../../services/groups.service';
import { 
  EnvelopeIcon, 
  UserIcon, 
  ClockIcon, 
  XMarkIcon, 
  PencilIcon,
  CheckIcon,
  ExclamationTriangleIcon
} from '@heroicons/react/24/outline';

interface InvitesManagementPanelProps {
  groupId: string;
  currentUserId: string;
  currentSubgroup?: any;
}

const InvitesManagementPanel: React.FC<InvitesManagementPanelProps> = ({
  groupId,
  currentUserId,
  currentSubgroup
}) => {
  const [invites, setInvites] = useState<GroupInvitationResponse[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isRevoking, setIsRevoking] = useState<string | null>(null);
  const [isEditing, setIsEditing] = useState<string | null>(null);

  useEffect(() => {
    loadInvites();
  }, [groupId, currentSubgroup]);

  const loadInvites = async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      // Load pending invitations for the group/subgroup
      const response = await groupsService.getGroupInvitations(groupId, 1, 50);
      setInvites(response.invitations || []);
    } catch (err) {
      console.error('Failed to load invites:', err);
      setError('Failed to load invitations. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleRevokeInvite = async (inviteId: string) => {
    try {
      setIsRevoking(inviteId);
      await groupsService.revokeInvite(groupId, inviteId);
      await loadInvites(); // Refresh the list
    } catch (err) {
      console.error('Failed to revoke invite:', err);
      setError('Failed to revoke invitation. Please try again.');
    } finally {
      setIsRevoking(null);
    }
  };

  const handleEditInvite = async (inviteId: string) => {
    try {
      setIsEditing(inviteId);
      // TODO: Implement edit invite functionality
      // This would open a modal to change the subgroup or message
      console.log('Edit invite:', inviteId);
    } catch (err) {
      console.error('Failed to edit invite:', err);
      setError('Failed to edit invitation. Please try again.');
    } finally {
      setIsEditing(null);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'accepted':
        return 'bg-green-100 text-green-800';
      case 'rejected':
        return 'bg-red-100 text-red-800';
      case 'expired':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending':
        return <ClockIcon className="w-4 h-4" />;
      case 'accepted':
        return <CheckIcon className="w-4 h-4" />;
      case 'rejected':
        return <XMarkIcon className="w-4 h-4" />;
      case 'expired':
        return <ExclamationTriangleIcon className="w-4 h-4" />;
      default:
        return <EnvelopeIcon className="w-4 h-4" />;
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const isExpired = (expiresAt: string) => {
    return new Date(expiresAt) < new Date();
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center p-6 text-red-600 bg-red-50 rounded-lg">
        <p className="font-medium">Error: {error}</p>
        <button onClick={loadInvites} className="mt-2 text-sm text-red-800 hover:underline">
          Try again
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold text-gray-900">
            {currentSubgroup ? `Invites for ${currentSubgroup.name}` : 'Group Invites'}
          </h3>
          <p className="text-sm text-gray-600">
            Manage pending invitations for this {currentSubgroup ? 'subgroup' : 'group'}
          </p>
        </div>
        <div className="text-sm text-gray-500">
          {invites.length} invitation{invites.length !== 1 ? 's' : ''}
        </div>
      </div>

      {/* Invites List */}
      {invites.length === 0 ? (
        <div className="text-center py-12 text-gray-500">
          <EnvelopeIcon className="w-12 h-12 mx-auto mb-4 text-gray-300" />
          <p className="text-lg font-medium">No pending invitations</p>
          <p className="text-sm">All invitations have been responded to or expired.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {invites.map((invite) => (
            <div key={invite.id} className="bg-white border border-gray-200 rounded-lg p-4 shadow-sm">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  {/* Inviter Info */}
                  <div className="flex items-center space-x-3 mb-3">
                    <div className="w-8 h-8 rounded-full bg-purple-100 flex items-center justify-center">
                      <UserIcon className="w-4 h-4 text-purple-600" />
                    </div>
                    <div>
                      <p className="font-medium text-gray-900">
                        {invite.invitedByRoleName || invite.invitedBy?.displayName || 'Unknown User'}
                      </p>
                      {invite.invitedByRoleName && invite.invitedBy?.displayName && (
                        <p className="text-sm text-gray-500">
                          {invite.invitedBy.displayName}
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Invite Details */}
                  <div className="ml-11 space-y-2">
                    <div className="flex items-center space-x-4 text-sm text-gray-600">
                      <span>Invited: {formatDate(invite.createdAt)}</span>
                      <span>Expires: {formatDate(invite.expiresAt)}</span>
                      {invite.subgroupId && (
                        <span className="text-purple-600 font-medium">
                          Subgroup: {invite.subgroupName || 'Unknown'}
                        </span>
                      )}
                    </div>
                    
                    {invite.message && (
                      <div className="bg-gray-50 rounded-lg p-3">
                        <p className="text-sm text-gray-700 italic">"{invite.message}"</p>
                      </div>
                    )}
                  </div>
                </div>

                {/* Status and Actions */}
                <div className="flex items-center space-x-3">
                  {/* Status Badge */}
                  <div className={`inline-flex items-center space-x-1 px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(invite.status)}`}>
                    {getStatusIcon(invite.status)}
                    <span className="capitalize">{invite.status}</span>
                  </div>

                  {/* Actions */}
                  {invite.status === 'pending' && !isExpired(invite.expiresAt) && (
                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() => handleEditInvite(invite.id)}
                        disabled={isEditing === invite.id}
                        className="p-1 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-full transition-colors"
                        title="Edit invitation"
                      >
                        <PencilIcon className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleRevokeInvite(invite.id)}
                        disabled={isRevoking === invite.id}
                        className="p-1 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-full transition-colors"
                        title="Revoke invitation"
                      >
                        {isRevoking === invite.id ? (
                          <div className="w-4 h-4 border-2 border-red-600 border-t-transparent rounded-full animate-spin"></div>
                        ) : (
                          <XMarkIcon className="w-4 h-4" />
                        )}
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default InvitesManagementPanel;
