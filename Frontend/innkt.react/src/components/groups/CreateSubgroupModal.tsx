import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { XMarkIcon, AcademicCapIcon, UserGroupIcon } from '@heroicons/react/24/outline';
import { groupsService } from '../../services/groups.service';

interface CreateSubgroupModalProps {
  groupId: string;
  groupName: string;
  onClose: () => void;
  onSubgroupCreated: (subgroup: any) => void;
}

const CreateSubgroupModal: React.FC<CreateSubgroupModalProps> = ({ 
  groupId, 
  groupName, 
  onClose, 
  onSubgroupCreated 
}) => {
  const { t } = useTranslation();
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    gradeLevel: '',
    isKidFriendly: true,
    allowParentParticipation: true,
    requireParentApproval: true,
    allowMemberPosts: true,
    allowKidPosts: true,
    requireApprovalForPosts: true,
    allowFileUploads: true,
    allowPolls: true,
    moderationLevel: 'strict' as 'none' | 'basic' | 'strict',
    contentFiltering: true,
    profanityFilter: true,
    imageModeration: true,
    autoApproveParents: false,
    autoApproveKids: false,
    // Enhanced parent-kid permission settings
    parentAccessLevel: 'participant' as 'read_only' | 'participant' | 'full_access',
    allowParentVoting: true,
    allowParentComments: true,
    allowParentPosts: true,
    requireParentApprovalForKidActions: true,
    allowParentToManageKid: true,
    kidIndependenceLevel: 'supervised' as 'supervised' | 'semi_independent' | 'independent'
  });
  
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const gradeLevels = [
    'Pre-K', 'Kindergarten', '1st Grade', '2nd Grade', '3rd Grade',
    '4th Grade', '5th Grade', '6th Grade', '7th Grade', '8th Grade',
    '9th Grade', '10th Grade', '11th Grade', '12th Grade', 'College'
  ];

  const handleInputChange = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.name.trim()) {
      newErrors.name = 'Subgroup name is required';
    } else if (formData.name.length < 3) {
      newErrors.name = 'Subgroup name must be at least 3 characters';
    }

    if (!formData.description.trim()) {
      newErrors.description = 'Description is required';
    } else if (formData.description.length < 10) {
      newErrors.description = 'Description must be at least 10 characters';
    }

    if (!formData.gradeLevel) {
      newErrors.gradeLevel = 'Grade level is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) return;

    setIsLoading(true);
    try {
      const subgroupData = {
        name: formData.name.trim(),
        description: formData.description.trim(),
        gradeLevel: formData.gradeLevel,
        settings: {
          isKidFriendly: formData.isKidFriendly,
          allowParentParticipation: formData.allowParentParticipation,
          requireParentApproval: formData.requireParentApproval,
          allowMemberPosts: formData.allowMemberPosts,
          allowKidPosts: formData.allowKidPosts,
          requireApprovalForPosts: formData.requireApprovalForPosts,
          allowFileUploads: formData.allowFileUploads,
          allowPolls: formData.allowPolls,
          moderationLevel: formData.moderationLevel,
          contentFiltering: formData.contentFiltering,
          profanityFilter: formData.profanityFilter,
          imageModeration: formData.imageModeration,
          autoApproveParents: formData.autoApproveParents,
          autoApproveKids: formData.autoApproveKids,
          // Enhanced parent-kid permission settings
          parentAccessLevel: formData.parentAccessLevel,
          allowParentVoting: formData.allowParentVoting,
          allowParentComments: formData.allowParentComments,
          allowParentPosts: formData.allowParentPosts,
          requireParentApprovalForKidActions: formData.requireParentApprovalForKidActions,
          allowParentToManageKid: formData.allowParentToManageKid,
          kidIndependenceLevel: formData.kidIndependenceLevel
        }
      };
      
      const newSubgroup = await groupsService.createSubgroup({
        groupId,
        name: subgroupData.name,
        description: subgroupData.description,
        settings: {
          allowMemberPosts: subgroupData.settings.allowMemberPosts,
          allowKidPosts: subgroupData.settings.allowKidPosts,
          allowParentPosts: subgroupData.settings.allowParentPosts,
          requireApproval: subgroupData.settings.requireApprovalForPosts
        }
      });
      onSubgroupCreated(newSubgroup);
    } catch (error) {
      console.error('Failed to create subgroup:', error);
      setErrors({ submit: 'Failed to create subgroup. Please try again.' });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div>
            <h2 className="text-xl font-semibold text-gray-900">{t('groups.createSubgroup')}</h2>
            <p className="text-sm text-gray-500 mt-1">{t('groups.forGroup')} {groupName}</p>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full transition-colors"
          >
            <XMarkIcon className="w-6 h-6" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Subgroup Name */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Subgroup Name *
            </label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => handleInputChange('name', e.target.value)}
              placeholder="e.g., 1st Grade, 2nd Grade, Science Club..."
              className={`w-full border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-purple-500 ${
                errors.name ? 'border-red-300' : 'border-gray-300'
              }`}
            />
            {errors.name && <p className="mt-1 text-sm text-red-600">{errors.name}</p>}
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Description *
            </label>
            <textarea
              value={formData.description}
              onChange={(e) => handleInputChange('description', e.target.value)}
              placeholder="Describe this subgroup..."
              rows={3}
              className={`w-full border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-purple-500 ${
                errors.description ? 'border-red-300' : 'border-gray-300'
              }`}
            />
            {errors.description && <p className="mt-1 text-sm text-red-600">{errors.description}</p>}
          </div>

          {/* Grade Level */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Grade Level *
            </label>
            <select
              value={formData.gradeLevel}
              onChange={(e) => handleInputChange('gradeLevel', e.target.value)}
              className={`w-full border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-purple-500 ${
                errors.gradeLevel ? 'border-red-300' : 'border-gray-300'
              }`}
            >
              <option value="">Select grade level...</option>
              {gradeLevels.map((grade) => (
                <option key={grade} value={grade}>{grade}</option>
              ))}
            </select>
            {errors.gradeLevel && <p className="mt-1 text-sm text-red-600">{errors.gradeLevel}</p>}
          </div>

          {/* Content Settings */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium text-gray-900">{t('groups.contentSettings')}</h3>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="isKidFriendly"
                  checked={formData.isKidFriendly}
                  onChange={(e) => handleInputChange('isKidFriendly', e.target.checked)}
                  className="h-4 w-4 text-purple-600 focus:ring-purple-500 border-gray-300 rounded"
                />
                <label htmlFor="isKidFriendly" className="ml-2 text-sm text-gray-700">
                  Kid-friendly content
                </label>
              </div>

              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="contentFiltering"
                  checked={formData.contentFiltering}
                  onChange={(e) => handleInputChange('contentFiltering', e.target.checked)}
                  className="h-4 w-4 text-purple-600 focus:ring-purple-500 border-gray-300 rounded"
                />
                <label htmlFor="contentFiltering" className="ml-2 text-sm text-gray-700">
                  Content filtering
                </label>
              </div>

              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="profanityFilter"
                  checked={formData.profanityFilter}
                  onChange={(e) => handleInputChange('profanityFilter', e.target.checked)}
                  className="h-4 w-4 text-purple-600 focus:ring-purple-500 border-gray-300 rounded"
                />
                <label htmlFor="profanityFilter" className="ml-2 text-sm text-gray-700">
                  Profanity filter
                </label>
              </div>

              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="imageModeration"
                  checked={formData.imageModeration}
                  onChange={(e) => handleInputChange('imageModeration', e.target.checked)}
                  className="h-4 w-4 text-purple-600 focus:ring-purple-500 border-gray-300 rounded"
                />
                <label htmlFor="imageModeration" className="ml-2 text-sm text-gray-700">
                  Image moderation
                </label>
              </div>
            </div>
          </div>

          {/* Participation Settings */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium text-gray-900">{t('groups.participationSettings')}</h3>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="allowParentParticipation"
                  checked={formData.allowParentParticipation}
                  onChange={(e) => handleInputChange('allowParentParticipation', e.target.checked)}
                  className="h-4 w-4 text-purple-600 focus:ring-purple-500 border-gray-300 rounded"
                />
                <label htmlFor="allowParentParticipation" className="ml-2 text-sm text-gray-700">
                  Allow parent participation
                </label>
              </div>

              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="requireParentApproval"
                  checked={formData.requireParentApproval}
                  onChange={(e) => handleInputChange('requireParentApproval', e.target.checked)}
                  className="h-4 w-4 text-purple-600 focus:ring-purple-500 border-gray-300 rounded"
                />
                <label htmlFor="requireParentApproval" className="ml-2 text-sm text-gray-700">
                  Require parent approval
                </label>
              </div>

              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="allowMemberPosts"
                  checked={formData.allowMemberPosts}
                  onChange={(e) => handleInputChange('allowMemberPosts', e.target.checked)}
                  className="h-4 w-4 text-purple-600 focus:ring-purple-500 border-gray-300 rounded"
                />
                <label htmlFor="allowMemberPosts" className="ml-2 text-sm text-gray-700">
                  Allow member posts
                </label>
              </div>

              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="allowKidPosts"
                  checked={formData.allowKidPosts}
                  onChange={(e) => handleInputChange('allowKidPosts', e.target.checked)}
                  className="h-4 w-4 text-purple-600 focus:ring-purple-500 border-gray-300 rounded"
                />
                <label htmlFor="allowKidPosts" className="ml-2 text-sm text-gray-700">
                  Allow kid posts
                </label>
              </div>

              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="allowParentPosts"
                  checked={formData.allowParentPosts}
                  onChange={(e) => handleInputChange('allowParentPosts', e.target.checked)}
                  className="h-4 w-4 text-purple-600 focus:ring-purple-500 border-gray-300 rounded"
                />
                <label htmlFor="allowParentPosts" className="ml-2 text-sm text-gray-700">
                  Allow parent posts
                </label>
              </div>

              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="requireApprovalForPosts"
                  checked={formData.requireApprovalForPosts}
                  onChange={(e) => handleInputChange('requireApprovalForPosts', e.target.checked)}
                  className="h-4 w-4 text-purple-600 focus:ring-purple-500 border-gray-300 rounded"
                />
                <label htmlFor="requireApprovalForPosts" className="ml-2 text-sm text-gray-700">
                  Require approval for posts
                </label>
              </div>
            </div>
          </div>

          {/* Features Settings */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium text-gray-900">{t('groups.features')}</h3>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="allowFileUploads"
                  checked={formData.allowFileUploads}
                  onChange={(e) => handleInputChange('allowFileUploads', e.target.checked)}
                  className="h-4 w-4 text-purple-600 focus:ring-purple-500 border-gray-300 rounded"
                />
                <label htmlFor="allowFileUploads" className="ml-2 text-sm text-gray-700">
                  Allow file uploads
                </label>
              </div>

              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="allowPolls"
                  checked={formData.allowPolls}
                  onChange={(e) => handleInputChange('allowPolls', e.target.checked)}
                  className="h-4 w-4 text-purple-600 focus:ring-purple-500 border-gray-300 rounded"
                />
                <label htmlFor="allowPolls" className="ml-2 text-sm text-gray-700">
                  Allow polls
                </label>
              </div>
            </div>

            {/* Moderation Level */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Moderation Level
              </label>
              <select
                value={formData.moderationLevel}
                onChange={(e) => handleInputChange('moderationLevel', e.target.value as 'none' | 'basic' | 'strict')}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-purple-500"
              >
                <option value="none">{t('groups.moderationNone')}</option>
                <option value="basic">{t('groups.moderationBasic')}</option>
                <option value="strict">{t('groups.moderationStrict')}</option>
              </select>
            </div>
          </div>

          {/* Auto-Approval Settings */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium text-gray-900">{t('groups.autoApprovalSettings')}</h3>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="autoApproveParents"
                  checked={formData.autoApproveParents}
                  onChange={(e) => handleInputChange('autoApproveParents', e.target.checked)}
                  className="h-4 w-4 text-purple-600 focus:ring-purple-500 border-gray-300 rounded"
                />
                <label htmlFor="autoApproveParents" className="ml-2 text-sm text-gray-700">
                  Auto-approve parents
                </label>
              </div>

              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="autoApproveKids"
                  checked={formData.autoApproveKids}
                  onChange={(e) => handleInputChange('autoApproveKids', e.target.checked)}
                  className="h-4 w-4 text-purple-600 focus:ring-purple-500 border-gray-300 rounded"
                />
                <label htmlFor="autoApproveKids" className="ml-2 text-sm text-gray-700">
                  Auto-approve kids
                </label>
              </div>
            </div>
          </div>

          {/* Error Message */}
          {errors.submit && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-sm text-red-600">{errors.submit}</p>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex justify-end space-x-4 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="px-6 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isLoading}
              className="px-6 py-2 bg-gradient-to-r from-purple-600 to-purple-800 text-white rounded-lg hover:from-purple-700 hover:to-purple-900 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? 'Creating...' : 'Create Subgroup'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CreateSubgroupModal;
