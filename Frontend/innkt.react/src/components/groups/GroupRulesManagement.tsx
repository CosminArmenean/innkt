import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { groupsService, GroupRuleResponse } from '../../services/groups.service';
import { PlusIcon, PencilIcon, TrashIcon, EyeIcon, EyeSlashIcon } from '@heroicons/react/24/outline';

interface GroupRulesManagementProps {
  groupId: string;
  currentUserId?: string;
  isAdmin?: boolean;
}

const GroupRulesManagement: React.FC<GroupRulesManagementProps> = ({ 
  groupId, 
  currentUserId, 
  isAdmin = false 
}) => {
  const { t } = useTranslation();
  const [rules, setRules] = useState<GroupRuleResponse[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingRule, setEditingRule] = useState<GroupRuleResponse | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    loadRules();
  }, [groupId]);

  const loadRules = async () => {
    try {
      setIsLoading(true);
      const rulesData = await groupsService.getGroupRules(groupId);
      setRules(rulesData);
    } catch (error) {
      console.error('Failed to load group rules:', error);
      setErrors({ load: 'Failed to load group rules' });
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateRule = async (ruleData: {
    title: string;
    description: string;
    details?: string;
    category?: string;
    order?: number;
  }) => {
    try {
      const newRule = await groupsService.createGroupRule(groupId, {
        ...ruleData,
        isActive: true
      });
      setRules(prev => [newRule, ...prev]);
      setShowCreateModal(false);
      setErrors({});
    } catch (error) {
      console.error('Failed to create group rule:', error);
      setErrors({ create: 'Failed to create group rule' });
    }
  };

  const handleUpdateRule = async (ruleId: string, updates: Partial<GroupRuleResponse>) => {
    try {
      const updatedRule = await groupsService.updateGroupRule(groupId, ruleId, updates);
      setRules(prev => prev.map(rule => rule.id === ruleId ? updatedRule : rule));
      setEditingRule(null);
      setErrors({});
    } catch (error) {
      console.error('Failed to update group rule:', error);
      setErrors({ update: 'Failed to update group rule' });
    }
  };

  const handleDeleteRule = async (ruleId: string) => {
    if (!window.confirm('Are you sure you want to delete this rule?')) return;

    try {
      await groupsService.deleteGroupRule(groupId, ruleId);
      setRules(prev => prev.filter(rule => rule.id !== ruleId));
      setErrors({});
    } catch (error) {
      console.error('Failed to delete group rule:', error);
      setErrors({ delete: 'Failed to delete group rule' });
    }
  };

  const handleToggleRule = async (ruleId: string) => {
    try {
      const updatedRule = await groupsService.toggleGroupRule(groupId, ruleId);
      setRules(prev => prev.map(rule => rule.id === ruleId ? updatedRule : rule));
      setErrors({});
    } catch (error) {
      console.error('Failed to toggle group rule:', error);
      setErrors({ toggle: 'Failed to toggle group rule' });
    }
  };

  const handleReorderRules = async (ruleId: string, newOrder: number) => {
    try {
      await groupsService.updateGroupRule(groupId, ruleId, { order: newOrder });
      setRules(prev => prev.map(rule => 
        rule.id === ruleId ? { ...rule, order: newOrder } : rule
      ).sort((a, b) => a.order - b.order));
    } catch (error) {
      console.error('Failed to reorder rule:', error);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h3 className="text-lg font-semibold text-gray-900">Group Rules</h3>
          <p className="text-sm text-gray-500">Manage rules and guidelines for this group</p>
        </div>
        {isAdmin && (
          <button
            onClick={() => setShowCreateModal(true)}
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-purple-600 hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500"
          >
            <PlusIcon className="w-4 h-4 mr-2" />
            Add Rule
          </button>
        )}
      </div>

      {/* Error Messages */}
      {Object.keys(errors).length > 0 && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          {Object.entries(errors).map(([key, message]) => (
            <p key={key} className="text-sm text-red-600">{message}</p>
          ))}
        </div>
      )}

      {/* Rules List */}
      {rules.length === 0 ? (
        <div className="text-center py-12 bg-gray-50 rounded-lg">
          <div className="text-gray-400 mb-4">
            <svg className="mx-auto h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">No rules yet</h3>
          <p className="text-gray-500 mb-4">Create your first group rule to establish guidelines for members.</p>
          {isAdmin && (
            <button
              onClick={() => setShowCreateModal(true)}
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-purple-600 hover:bg-purple-700"
            >
              <PlusIcon className="w-4 h-4 mr-2" />
              Create First Rule
            </button>
          )}
        </div>
      ) : (
        <div className="space-y-4">
          {rules
            .sort((a, b) => a.order - b.order)
            .map((rule) => (
            <div key={rule.id} className={`bg-white border rounded-lg p-4 ${!rule.isActive ? 'opacity-60' : ''}`}>
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center space-x-2 mb-2">
                    <h4 className="text-lg font-semibold text-gray-900">{rule.title}</h4>
                    {rule.category && (
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                        {rule.category}
                      </span>
                    )}
                    {!rule.isActive && (
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                        Inactive
                      </span>
                    )}
                  </div>
                  <p className="text-gray-600 mb-2">{rule.description}</p>
                  {rule.details && (
                    <div className="text-sm text-gray-500 bg-gray-50 rounded p-3">
                      <strong>Details:</strong> {rule.details}
                    </div>
                  )}
                  <div className="flex items-center text-xs text-gray-400 mt-2">
                    <span>Created {new Date(rule.createdAt).toLocaleDateString()}</span>
                    {rule.updatedAt !== rule.createdAt && (
                      <span className="ml-4">Updated {new Date(rule.updatedAt).toLocaleDateString()}</span>
                    )}
                  </div>
                </div>
                
                {isAdmin && (
                  <div className="flex items-center space-x-2 ml-4">
                    <button
                      onClick={() => handleToggleRule(rule.id)}
                      className={`p-2 rounded-lg transition-colors ${
                        rule.isActive 
                          ? 'text-yellow-600 hover:bg-yellow-50' 
                          : 'text-green-600 hover:bg-green-50'
                      }`}
                      title={rule.isActive ? 'Deactivate rule' : 'Activate rule'}
                    >
                      {rule.isActive ? <EyeSlashIcon className="w-4 h-4" /> : <EyeIcon className="w-4 h-4" />}
                    </button>
                    <button
                      onClick={() => setEditingRule(rule)}
                      className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                      title="Edit rule"
                    >
                      <PencilIcon className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleDeleteRule(rule.id)}
                      className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                      title="Delete rule"
                    >
                      <TrashIcon className="w-4 h-4" />
                    </button>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Create Rule Modal */}
      {showCreateModal && (
        <CreateGroupRuleModal
          onClose={() => setShowCreateModal(false)}
          onSave={handleCreateRule}
        />
      )}

      {/* Edit Rule Modal */}
      {editingRule && (
        <EditGroupRuleModal
          rule={editingRule}
          onClose={() => setEditingRule(null)}
          onSave={(updates) => handleUpdateRule(editingRule.id, updates)}
        />
      )}
    </div>
  );
};

// Create Rule Modal Component
interface CreateGroupRuleModalProps {
  onClose: () => void;
  onSave: (ruleData: {
    title: string;
    description: string;
    details?: string;
    category?: string;
    order?: number;
  }) => void;
}

const CreateGroupRuleModal: React.FC<CreateGroupRuleModalProps> = ({ onClose, onSave }) => {
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    details: '',
    category: '',
    order: 0
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const newErrors: Record<string, string> = {};
    if (!formData.title.trim()) newErrors.title = 'Title is required';
    if (!formData.description.trim()) newErrors.description = 'Description is required';
    
    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    onSave(formData);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-900">Create Group Rule</h2>
          <button
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full transition-colors"
          >
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Title *</label>
            <input
              type="text"
              value={formData.title}
              onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
              className={`w-full border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-purple-500 ${
                errors.title ? 'border-red-300' : 'border-gray-300'
              }`}
              placeholder="Rule title"
            />
            {errors.title && <p className="mt-1 text-sm text-red-600">{errors.title}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Description *</label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
              rows={3}
              className={`w-full border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-purple-500 ${
                errors.description ? 'border-red-300' : 'border-gray-300'
              }`}
              placeholder="Rule description"
            />
            {errors.description && <p className="mt-1 text-sm text-red-600">{errors.description}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Details (Optional)</label>
            <textarea
              value={formData.details}
              onChange={(e) => setFormData(prev => ({ ...prev, details: e.target.value }))}
              rows={4}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-purple-500"
              placeholder="Additional details or examples"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Category (Optional)</label>
              <input
                type="text"
                value={formData.category}
                onChange={(e) => setFormData(prev => ({ ...prev, category: e.target.value }))}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-purple-500"
                placeholder="e.g., Behavior, Content, Safety"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Order</label>
              <input
                type="number"
                value={formData.order}
                onChange={(e) => setFormData(prev => ({ ...prev, order: parseInt(e.target.value) || 0 }))}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-purple-500"
                min="0"
              />
            </div>
          </div>

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
              className="px-6 py-2 bg-gradient-to-r from-purple-600 to-purple-800 text-white rounded-lg hover:from-purple-700 hover:to-purple-900 transition-colors"
            >
              Create Rule
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

// Edit Rule Modal Component
interface EditGroupRuleModalProps {
  rule: GroupRuleResponse;
  onClose: () => void;
  onSave: (updates: Partial<GroupRuleResponse>) => void;
}

const EditGroupRuleModal: React.FC<EditGroupRuleModalProps> = ({ rule, onClose, onSave }) => {
  const [formData, setFormData] = useState({
    title: rule.title,
    description: rule.description,
    details: rule.details || '',
    category: rule.category || '',
    order: rule.order
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const newErrors: Record<string, string> = {};
    if (!formData.title.trim()) newErrors.title = 'Title is required';
    if (!formData.description.trim()) newErrors.description = 'Description is required';
    
    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    onSave(formData);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-900">Edit Group Rule</h2>
          <button
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full transition-colors"
          >
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Title *</label>
            <input
              type="text"
              value={formData.title}
              onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
              className={`w-full border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-purple-500 ${
                errors.title ? 'border-red-300' : 'border-gray-300'
              }`}
              placeholder="Rule title"
            />
            {errors.title && <p className="mt-1 text-sm text-red-600">{errors.title}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Description *</label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
              rows={3}
              className={`w-full border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-purple-500 ${
                errors.description ? 'border-red-300' : 'border-gray-300'
              }`}
              placeholder="Rule description"
            />
            {errors.description && <p className="mt-1 text-sm text-red-600">{errors.description}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Details (Optional)</label>
            <textarea
              value={formData.details}
              onChange={(e) => setFormData(prev => ({ ...prev, details: e.target.value }))}
              rows={4}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-purple-500"
              placeholder="Additional details or examples"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Category (Optional)</label>
              <input
                type="text"
                value={formData.category}
                onChange={(e) => setFormData(prev => ({ ...prev, category: e.target.value }))}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-purple-500"
                placeholder="e.g., Behavior, Content, Safety"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Order</label>
              <input
                type="number"
                value={formData.order}
                onChange={(e) => setFormData(prev => ({ ...prev, order: parseInt(e.target.value) || 0 }))}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-purple-500"
                min="0"
              />
            </div>
          </div>

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
              className="px-6 py-2 bg-gradient-to-r from-purple-600 to-purple-800 text-white rounded-lg hover:from-purple-700 hover:to-purple-900 transition-colors"
            >
              Update Rule
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default GroupRulesManagement;

