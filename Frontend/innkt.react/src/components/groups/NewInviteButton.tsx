import React, { useState } from 'react';
import { UserPlusIcon } from '@heroicons/react/24/outline';
import SimpleInviteModal from './SimpleInviteModal';

interface NewInviteButtonProps {
  groupName: string;
  groupId?: string;
  className?: string;
}

const NewInviteButton: React.FC<NewInviteButtonProps> = ({ groupName, groupId, className }) => {
  const [showModal, setShowModal] = useState(false);

  const handleClick = () => {
    console.log('🚀 NEW INVITE BUTTON CLICKED!');
    setShowModal(true);
  };

  const handleCloseModal = () => {
    console.log('🚀 MODAL CLOSED!');
    setShowModal(false);
  };

  return (
    <>
      <button
        onClick={handleClick}
        className={className || "bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"}
      >
        <UserPlusIcon className="-ml-1 mr-2 h-5 w-5" />
        Invite Members
      </button>

      <SimpleInviteModal
        isOpen={showModal}
        onClose={handleCloseModal}
        groupName={groupName}
        groupId={groupId}
      />
    </>
  );
};

export default NewInviteButton;
