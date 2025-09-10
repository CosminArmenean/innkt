import React, { useState, useRef } from 'react';
import { socialService, Group } from '../../services/social.service';
import { XMarkIcon, PhotoIcon, UserGroupIcon } from '@heroicons/react/24/outline';

interface CreateGroupModalProps {
  onClose: () => void;
  onGroupCreated: (group: Group) => void;
}

const CreateGroupModal: React.FC<CreateGroupModalProps> = ({ onClose, onGroupCreated }) => {
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    category: '',
    type: 'public' as 'public' | 'private' | 'secret',
    tags: [] as string[],
    rules: [] as { title: string; description: string }[]
  });
  const [selectedAvatar, setSelectedAvatar] = useState<File | null>(null);
  const [selectedCover, setSelectedCover] = useState<File | null>(null);
  const [tagInput, setTagInput] = useState('');
  const [ruleInput, setRuleInput] = useState({ title: '', description: '' });
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  
  const avatarInputRef = useRef<HTMLInputElement>(null);
  const coverInputRef = useRef<HTMLInputElement>(null);

  const categories = [
    'Technology', 'Business', 'Education', 'Entertainment', 
    'Lifestyle', 'Sports', 'Health', 'Travel', 'Art', 'Music'
  ];

  const handleInputChange = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  const handleFileSelect = (file: File, type: 'avatar' | 'cover') => {
    if (type === 'avatar') {
      setSelectedAvatar(file);
    } else {
      setSelectedCover(file);
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

  const handleAddRule = () => {
    if (ruleInput.title.trim() && ruleInput.description.trim()) {
      setFormData(prev => ({
        ...prev,
        rules: [...prev.rules, { ...ruleInput }]
      }));
      setRuleInput({ title: '', description: '' });
    }
  };

  const handleRemoveRule = (index: number) => {
    setFormData(prev => ({
      ...prev,
      rules: prev.rules.filter((_, i) => i !== index)
    }));
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.name.trim()) {
      newErrors.name = 'Group name is required';
    } else if (formData.name.length < 3) {
      newErrors.name = 'Group name must be at least 3 characters';
    }

    if (!formData.description.trim()) {
      newErrors.description = 'Description is required';
    } else if (formData.description.length < 10) {
      newErrors.description = 'Description must be at least 10 characters';
    }

    if (!formData.category) {
      newErrors.category = 'Category is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) return;

    setIsLoading(true);
    try {
      const groupData = {
        name: formData.name.trim(),
        description: formData.description.trim(),
        category: formData.category.toLowerCase(),
        type: formData.type,
        tags: formData.tags,
        rules: formData.rules.map((rule, index) => ({
          id: `rule-${index}-${Date.now()}`,
          title: rule.title.trim(),
          description: rule.description.trim(),
          isActive: true
        }))
      };

      const newGroup = await socialService.createGroup(groupData);
      
      // TODO: Upload avatar and cover image if selected
      // if (selectedAvatar) {
      //   await socialService.uploadGroupAvatar(newGroup.id, selectedAvatar);
      // }
      // if (selectedCover) {
      //   await socialService.uploadGroupCover(newGroup.id, selectedCover);
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
          <h2 className="text-xl font-semibold text-gray-900">Create New Group</h2>
          <button
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full transition-colors"
          >
            <XMarkIcon className="w-6 h-6" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Group Name */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Group Name *
            </label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => handleInputChange('name', e.target.value)}
              placeholder="Enter group name..."
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
              placeholder="Describe your group..."
              rows={4}
              className={`w-full border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-purple-500 ${
                errors.description ? 'border-red-300' : 'border-gray-300'
              }`}
            />
            {errors.description && <p className="mt-1 text-sm text-red-600">{errors.description}</p>}
          </div>

          {/* Category and Type */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Category *
              </label>
              <select
                value={formData.category}
                onChange={(e) => handleInputChange('category', e.target.value)}
                className={`w-full border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-purple-500 ${
                  errors.category ? 'border-red-300' : 'border-gray-300'
                }`}
              >
                <option value="">Select category...</option>
                {categories.map(category => (
                  <option key={category} value={category.toLowerCase()}>
                    {category}
                  </option>
                ))}
              </select>
              {errors.category && <p className="mt-1 text-sm text-red-600">{errors.category}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Group Type
              </label>
              <select
                value={formData.type}
                onChange={(e) => handleInputChange('type', e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-purple-500"
              >
                <option value="public">Public - Anyone can join</option>
                <option value="private">Private - Approval required</option>
                <option value="secret">Secret - Invite only</option>
              </select>
            </div>
          </div>

          {/* Tags */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Tags
            </label>
            <div className="flex space-x-2 mb-2">
              <input
                type="text"
                value={tagInput}
                onChange={(e) => setTagInput(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddTag())}
                placeholder="Add a tag..."
                className="flex-1 border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-purple-500"
              />
              <button
                type="button"
                onClick={handleAddTag}
                className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors"
              >
                Add
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

          {/* Group Rules */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Group Rules
            </label>
            <div className="space-y-2 mb-2">
              <input
                type="text"
                value={ruleInput.title}
                onChange={(e) => setRuleInput(prev => ({ ...prev, title: e.target.value }))}
                placeholder="Rule title..."
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-purple-500"
              />
              <input
                type="text"
                value={ruleInput.description}
                onChange={(e) => setRuleInput(prev => ({ ...prev, description: e.target.value }))}
                placeholder="Rule description..."
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-purple-500"
              />
              <button
                type="button"
                onClick={handleAddRule}
                className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors"
              >
                Add Rule
              </button>
            </div>
            {formData.rules.length > 0 && (
              <div className="space-y-2">
                {formData.rules.map((rule, index) => (
                  <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div>
                      <div className="font-medium text-sm text-gray-900">{rule.title}</div>
                      <div className="text-sm text-gray-600">{rule.description}</div>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleRemoveRule(index)}
                      className="text-red-600 hover:text-red-800"
                    >
                      <XMarkIcon className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            )}
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
              {isLoading ? 'Creating...' : 'Create Group'}
            </button>
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CreateGroupModal;
