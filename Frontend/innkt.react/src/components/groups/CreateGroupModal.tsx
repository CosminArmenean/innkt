import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Group } from '../../services/social.service';
import { groupsService, CreateEducationalGroupRequest, CreateFamilyGroupRequest } from '../../services/groups.service';
import { useAuth } from '../../contexts/AuthContext';
import { XMarkIcon, AcademicCapIcon, HomeIcon } from '@heroicons/react/24/outline';

interface CreateGroupModalProps {
  onClose: () => void;
  onGroupCreated: (group: Group) => void;
}

const CreateGroupModal: React.FC<CreateGroupModalProps> = ({ onClose, onGroupCreated }) => {
  const { t } = useTranslation();
  const { user } = useAuth();
  const [groupType, setGroupType] = useState<'family' | 'educational'>('family');
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    category: '',
    type: 'public' as 'public' | 'private' | 'secret',
    tags: [] as string[],
    // Educational group fields
    institutionName: '',
    // Note: gradeLevel and detailed settings will be moved to subgroup creation
  });
  const [tagInput, setTagInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const categories = [
    'Technology', 'Business', 'Education', 'Entertainment', 
    'Lifestyle', 'Sports', 'Health', 'Travel', 'Art', 'Music'
  ];

  // Grade levels will be handled in subgroup creation

  const handleInputChange = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  // Handle group type change and set appropriate defaults
  const handleGroupTypeChange = (type: 'family' | 'educational') => {
    setGroupType(type);
    
    if (type === 'educational') {
      // Set educational group defaults
      setFormData(prev => ({
        ...prev,
        category: 'Education', // Auto-select Education category
        type: 'private' as 'public' | 'private' | 'secret' // Default to invitation-only
      }));
    } else {
      // Reset to family group defaults
      setFormData(prev => ({
        ...prev,
        category: '',
        type: 'public' as 'public' | 'private' | 'secret'
      }));
    }
  };


  const handleAddTag = () => {
    if (tagInput.trim() && !formData.tags.includes(tagInput.trim())) {
      setFormData(prev => ({
        ...prev,
        tags: [...prev.tags, tagInput.trim()]
      }));
      setTagInput('');
    }
  };

  const handleRemoveTag = (tagToRemove: string) => {
    setFormData(prev => ({
      ...prev,
      tags: prev.tags.filter(tag => tag !== tagToRemove)
    }));
  };

  // Rules will be handled after group creation

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.name.trim()) {
      newErrors.name = t('groups.groupNameRequired');
    } else if (formData.name.length < 3) {
      newErrors.name = t('groups.groupNameTooShort');
    }

    if (!formData.description.trim()) {
      newErrors.description = t('groups.descriptionRequired');
    } else if (formData.description.length < 10) {
      newErrors.description = t('groups.descriptionTooShort');
    }

    if (!formData.category) {
      newErrors.category = t('groups.categoryRequired');
    }

    // Educational group specific validation
    if (groupType === 'educational') {
      if (!formData.institutionName.trim()) {
        newErrors.institutionName = t('groups.institutionNameRequired');
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) return;

    setIsLoading(true);
    try {
      let newGroup;

      if (groupType === 'educational') {
        const educationalGroupData: CreateEducationalGroupRequest = {
          name: formData.name.trim(),
          description: formData.description.trim(),
          institutionName: formData.institutionName.trim(),
          gradeLevel: '', // Will be set when creating subgroups
          isKidFriendly: true, // Default for educational groups
          allowParentParticipation: true, // Default for educational groups
          requireParentApproval: true, // Default for educational groups
          category: formData.category.toLowerCase(),
          tags: formData.tags,
          rules: [], // Will be added after group creation
          settings: {
            allowMemberPosts: true,
            allowKidPosts: true,
            allowParentPosts: true,
            requireApprovalForPosts: true, // Default for educational groups
            allowFileUploads: true,
            allowPolls: true,
            allowEvents: true,
            maxFileSize: 10 * 1024 * 1024, // 10MB
            allowedFileTypes: ['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'application/pdf'],
            moderationLevel: 'strict', // Default for educational groups
            contentFiltering: true,
            profanityFilter: true,
            imageModeration: true,
            autoApproveParents: false, // Default for educational groups
            autoApproveKids: false, // Default for educational groups
            notificationSettings: {
              newPosts: true,
              newMembers: true,
              newComments: true,
              newPolls: true,
              newEvents: true
            }
          }
        };

        // Get userId from auth context
        const userId = user?.id || '00000000-0000-0000-0000-000000000001';
        newGroup = await groupsService.createEducationalGroup(userId, educationalGroupData);
      } else {
        const familyGroupData: CreateFamilyGroupRequest = {
          name: formData.name.trim(),
          description: formData.description.trim(),
          isKidFriendly: true, // Default for family groups
          allowParentParticipation: true, // Default for family groups
          requireParentApproval: false, // Default for family groups
          category: formData.category.toLowerCase(),
          tags: formData.tags,
          rules: [] // Will be added after group creation
        };

        // Get userId from auth context
        const userId = user?.id || '00000000-0000-0000-0000-000000000001';
        newGroup = await groupsService.createFamilyGroup(userId, familyGroupData);
      }
      
      // TODO: Upload avatar and cover image if selected
      // if (selectedAvatar) {
      //   await groupsService.uploadGroupAvatar(newGroup.id, selectedAvatar);
      // }
      // if (selectedCover) {
      //   await groupsService.uploadGroupCover(newGroup.id, selectedCover);
      // }

      onGroupCreated(newGroup);
    } catch (error) {
      console.error('Failed to create group:', error);
      setErrors({ submit: 'Failed to create group. Please try again.' });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-900">{t('groups.createNewGroup')}</h2>
          <button
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full transition-colors"
          >
            <XMarkIcon className="w-6 h-6" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Group Type Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-3">
              {t('groups.groupTypeLabel')} *
            </label>
            <div className="grid grid-cols-2 gap-4">
              <button
                type="button"
                onClick={() => handleGroupTypeChange('family')}
                className={`p-4 border-2 rounded-lg text-left transition-colors ${
                  groupType === 'family'
                    ? 'border-purple-500 bg-purple-50'
                    : 'border-gray-300 hover:border-gray-400'
                }`}
              >
                <div className="flex items-center space-x-3">
                  <HomeIcon className="w-6 h-6 text-purple-600" />
                  <div>
                    <h3 className="font-medium text-gray-900">{t('groups.familyGroup')}</h3>
                    <p className="text-sm text-gray-500">{t('groups.familyGroupDesc')}</p>
                  </div>
                </div>
              </button>
              
              <button
                type="button"
                onClick={() => handleGroupTypeChange('educational')}
                className={`p-4 border-2 rounded-lg text-left transition-colors ${
                  groupType === 'educational'
                    ? 'border-purple-500 bg-purple-50'
                    : 'border-gray-300 hover:border-gray-400'
                }`}
              >
                <div className="flex items-center space-x-3">
                  <AcademicCapIcon className="w-6 h-6 text-purple-600" />
                  <div>
                    <h3 className="font-medium text-gray-900">{t('groups.educationalGroup')}</h3>
                    <p className="text-sm text-gray-500">{t('groups.educationalGroupDesc')}</p>
                  </div>
                </div>
              </button>
            </div>
          </div>
          {/* Group Name */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              {t('groups.groupName')} *
            </label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => handleInputChange('name', e.target.value)}
              placeholder={t('groups.enterGroupNamePlaceholder')}
              className={`w-full border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-purple-500 ${
                errors.name ? 'border-red-300' : 'border-gray-300'
              }`}
            />
            {errors.name && <p className="mt-1 text-sm text-red-600">{errors.name}</p>}
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              {t('groups.descriptionLabel')} *
            </label>
            <textarea
              value={formData.description}
              onChange={(e) => handleInputChange('description', e.target.value)}
              placeholder={t('groups.descriptionPlaceholder')}
              rows={4}
              className={`w-full border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-purple-500 ${
                errors.description ? 'border-red-300' : 'border-gray-300'
              }`}
            />
            {errors.description && <p className="mt-1 text-sm text-red-600">{errors.description}</p>}
          </div>

          {/* Educational Group Specific Fields */}
          {groupType === 'educational' && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                {t('groups.institutionNameLabel')} *
              </label>
              <input
                type="text"
                value={formData.institutionName}
                onChange={(e) => handleInputChange('institutionName', e.target.value)}
                placeholder={t('groups.institutionPlaceholder')}
                className={`w-full border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-purple-500 ${
                  errors.institutionName ? 'border-red-300' : 'border-gray-300'
                }`}
              />
              {errors.institutionName && <p className="mt-1 text-sm text-red-600">{errors.institutionName}</p>}
              <p className="mt-1 text-sm text-gray-500">
                {t('groups.gradeLevelsConfigured')}
              </p>
            </div>
          )}

          {/* Category and Type */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                {t('groups.categoryLabel')} *
              </label>
              <select
                value={formData.category}
                onChange={(e) => handleInputChange('category', e.target.value)}
                disabled={groupType === 'educational'}
                className={`w-full border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-purple-500 ${
                  errors.category ? 'border-red-300' : 'border-gray-300'
                } ${groupType === 'educational' ? 'bg-gray-100 cursor-not-allowed' : ''}`}
              >
                <option value="">{t('groups.selectCategoryOption')}</option>
                {categories.map(category => (
                  <option key={category} value={category.toLowerCase()}>
                    {category}
                  </option>
                ))}
              </select>
              {groupType === 'educational' && (
                <p className="mt-1 text-sm text-gray-500">
                  {t('groups.educationCategoryAuto')}
                </p>
              )}
              {errors.category && <p className="mt-1 text-sm text-red-600">{errors.category}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                {t('groups.groupTypeLabel2')}
              </label>
              <select
                value={formData.type}
                onChange={(e) => handleInputChange('type', e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-purple-500"
              >
                <option value="public">{t('groups.publicAnyone')}</option>
                <option value="private">{t('groups.privateApproval')}</option>
                <option value="secret">{t('groups.secretInvite')}</option>
              </select>
              {groupType === 'educational' && (
                <p className="mt-1 text-sm text-gray-500">
                  {t('groups.educationalDefault')}
                </p>
              )}
            </div>
          </div>

          {/* Tags */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              {t('groups.tagsLabel')}
            </label>
            <p className="text-sm text-gray-500 mb-3">
              {t('groups.tagsHelpText')}
            </p>
            <div className="flex space-x-2 mb-2">
              <input
                type="text"
                value={tagInput}
                onChange={(e) => setTagInput(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddTag())}
                placeholder={t('groups.addTagPlaceholder')}
                className="flex-1 border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-purple-500"
              />
              <button
                type="button"
                onClick={handleAddTag}
                className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
              >
                {t('groups.add')}
              </button>
            </div>
            {formData.tags.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {formData.tags.map((tag, index) => (
                  <span
                    key={index}
                    className="inline-flex items-center px-3 py-1 bg-purple-100 text-purple-800 text-sm rounded-full"
                  >
                    #{tag}
                    <button
                      type="button"
                      onClick={() => handleRemoveTag(tag)}
                      className="ml-2 text-purple-600 hover:text-purple-800"
                    >
                      ×
                    </button>
                  </span>
                ))}
              </div>
            )}
          </div>

          {/* Note about Group Rules */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <p className="text-sm text-blue-800">
              <strong>{t('groups.noteLabel')}:</strong> {t('groups.groupRulesNote')}
            </p>
          </div>

          {/* Error Message */}
          {errors.submit && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-sm text-red-600">{errors.submit}</p>
            </div>
          )}

          {/* Submit Buttons */}
          <div className="flex space-x-3 pt-4">
            <button
              type="submit"
              disabled={isLoading}
              className="flex-1 bg-purple-600 text-white py-2 px-4 rounded-lg hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {isLoading ? t('groups.creating') : t('groups.createGroup')}
            </button>
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
            >
              {t('common.cancel')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CreateGroupModal;
