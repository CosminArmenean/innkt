import React, { useState } from 'react';
import { groupsService } from '../../services/groups.service';

interface SimpleInviteModalProps {
  isOpen: boolean;
  onClose: () => void;
  groupName: string;
  groupId?: string;
}

const SimpleInviteModal: React.FC<SimpleInviteModalProps> = ({ isOpen, onClose, groupName, groupId }) => {
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!groupId) {
      alert('Error: Group ID not provided');
      return;
    }

    setIsLoading(true);
    
    try {
      console.log('🚀 Sending invite to:', email, 'for group:', groupId);
      
      // TODO: Replace with actual invite API call
      // await groupsService.inviteUser(groupId, { email, role: 'member' });
      
      // For now, simulate the API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      alert(`Invite sent to ${email}!`);
      setEmail('');
      onClose();
    } catch (error) {
      console.error('Failed to send invite:', error);
      alert('Failed to send invite. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div 
      style={{ 
        position: 'fixed', 
        top: 0, 
        left: 0, 
        right: 0, 
        bottom: 0, 
        backgroundColor: 'rgba(0, 0, 0, 0.8)',
        zIndex: 9999,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center'
      }}
      onClick={onClose}
    >
      <div 
        style={{ 
          backgroundColor: 'white', 
          padding: '24px',
          borderRadius: '8px',
          maxWidth: '400px',
          width: '90%',
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)'
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <h2 style={{ fontSize: '20px', fontWeight: 'bold', marginBottom: '16px', color: '#1f2937' }}>
          Invite to {groupName}
        </h2>
        
        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: '16px' }}>
            <label style={{ display: 'block', marginBottom: '8px', fontWeight: '500' }}>
              Email Address
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Enter email address"
              required
              style={{
                width: '100%',
                padding: '8px 12px',
                border: '1px solid #d1d5db',
                borderRadius: '4px',
                fontSize: '14px'
              }}
            />
          </div>
          
          <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
            <button 
              type="button"
              onClick={onClose}
              style={{
                backgroundColor: '#6b7280',
                color: 'white',
                padding: '8px 16px',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer'
              }}
            >
              Cancel
            </button>
            <button 
              type="submit"
              disabled={isLoading}
              style={{
                backgroundColor: isLoading ? '#9ca3af' : '#3b82f6',
                color: 'white',
                padding: '8px 16px',
                border: 'none',
                borderRadius: '4px',
                cursor: isLoading ? 'not-allowed' : 'pointer'
              }}
            >
              {isLoading ? 'Sending...' : 'Send Invite'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default SimpleInviteModal;
