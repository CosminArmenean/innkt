import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';

interface APIKey {
  id: string;
  name: string;
  key: string;
  permissions: string[];
  createdAt: string;
  lastUsed?: string;
  isActive: boolean;
  expiresAt?: string;
  usageCount: number;
}

interface APIKeyForm {
  name: string;
  permissions: string[];
  expiresIn: string;
}

const APIKeyManagement: React.FC = () => {
  const { t } = useTranslation();
  const [apiKeys, setApiKeys] = useState<APIKey[]>([]);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [newKeyForm, setNewKeyForm] = useState<APIKeyForm>({
    name: '',
    permissions: [],
    expiresIn: '30'
  });
  const [isCreating, setIsCreating] = useState(false);
  const [showKey, setShowKey] = useState<string | null>(null);

  const availablePermissions = [
    'read:profile',
    'write:profile',
    'read:posts',
    'write:posts',
    'read:groups',
    'write:groups',
    'read:analytics',
    'write:analytics',
    'admin:users',
    'admin:system'
  ];

  useEffect(() => {
    loadAPIKeys();
  }, []);

  const loadAPIKeys = async () => {
    // TODO: Load API keys from backend
    // For now, using mock data
    setApiKeys([
      {
        id: '1',
        name: 'Mobile App',
        key: 'sk_live_1234567890abcdef',
        permissions: ['read:profile', 'write:profile', 'read:posts'],
        createdAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
        lastUsed: new Date().toISOString(),
        isActive: true,
        expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
        usageCount: 1247
      },
      {
        id: '2',
        name: 'Web Dashboard',
        key: 'sk_live_0987654321fedcba',
        permissions: ['read:profile', 'read:posts', 'read:analytics'],
        createdAt: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000).toISOString(),
        lastUsed: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
        isActive: true,
        expiresAt: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000).toISOString(),
        usageCount: 892
      }
    ]);
  };

  const handleCreateKey = async () => {
    if (!newKeyForm.name || newKeyForm.permissions.length === 0) return;

    setIsCreating(true);
    try {
      // TODO: Call backend to create API key
      await new Promise(resolve => setTimeout(resolve, 1000));

      const newKey: APIKey = {
        id: Date.now().toString(),
        name: newKeyForm.name,
        key: `sk_live_${Math.random().toString(36).substr(2, 9)}`,
        permissions: newKeyForm.permissions,
        createdAt: new Date().toISOString(),
        isActive: true,
        expiresAt: new Date(Date.now() + parseInt(newKeyForm.expiresIn) * 24 * 60 * 60 * 1000).toISOString(),
        usageCount: 0
      };

      setApiKeys(prev => [newKey, ...prev]);
      setNewKeyForm({ name: '', permissions: [], expiresIn: '30' });
      setShowCreateForm(false);
      setShowKey(newKey.id);
    } catch (error) {
      console.error('Failed to create API key:', error);
    } finally {
      setIsCreating(false);
    }
  };

  const handleTogglePermission = (permission: string) => {
    setNewKeyForm(prev => ({
      ...prev,
      permissions: prev.permissions.includes(permission)
        ? prev.permissions.filter(p => p !== permission)
        : [...prev.permissions, permission]
    }));
  };

  const handleToggleKey = async (keyId: string) => {
    try {
      setApiKeys(prev => prev.map(key =>
        key.id === keyId ? { ...key, isActive: !key.isActive } : key
      ));
    } catch (error) {
      console.error('Failed to toggle API key:', error);
    }
  };

  const handleDeleteKey = async (keyId: string) => {
    if (!window.confirm('Are you sure you want to delete this API key? This action cannot be undone.')) {
      return;
    }

    try {
      setApiKeys(prev => prev.filter(key => key.id !== keyId));
    } catch (error) {
      console.error('Failed to delete API key:', error);
    }
  };

  const handleCopyKey = (key: string) => {
    navigator.clipboard.writeText(key);
    // TODO: Show toast notification
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const getPermissionColor = (permission: string) => {
    if (permission.includes('admin')) return 'bg-red-100 text-red-800';
    if (permission.includes('write')) return 'bg-yellow-100 text-yellow-800';
    return 'bg-blue-100 text-blue-800';
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold text-gray-900">API Key Management</h3>
          <p className="text-sm text-gray-600">Manage your API keys for external integrations</p>
        </div>
        <button
          onClick={() => setShowCreateForm(true)}
          className="btn-primary px-4 py-2"
        >
          Create New Key
        </button>
      </div>

      {/* Create Form */}
      {showCreateForm && (
        <div className="card">
          <h4 className="text-md font-semibold text-gray-900 mb-4">Create New API Key</h4>
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Key Name</label>
              <input
                type="text"
                value={newKeyForm.name}
                onChange={(e) => setNewKeyForm(prev => ({ ...prev, name: e.target.value }))}
                placeholder="e.g., Mobile App, Web Dashboard"
                className="input-field w-full"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Permissions</label>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                {availablePermissions.map((permission) => (
                  <label key={permission} className="flex items-center">
                    <input
                      type="checkbox"
                      checked={newKeyForm.permissions.includes(permission)}
                      onChange={() => handleTogglePermission(permission)}
                      className="h-4 w-4 text-innkt-primary focus:ring-innkt-primary border-gray-300 rounded"
                    />
                    <span className="ml-2 text-sm text-gray-700">{permission}</span>
                  </label>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Expires In</label>
              <select
                value={newKeyForm.expiresIn}
                onChange={(e) => setNewKeyForm(prev => ({ ...prev, expiresIn: e.target.value }))}
                className="input-field w-full"
              >
                <option value="7">7 days</option>
                <option value="30">30 days</option>
                <option value="60">60 days</option>
                <option value="90">90 days</option>
                <option value="365">1 year</option>
                <option value="never">Never</option>
              </select>
            </div>

            <div className="flex space-x-3 pt-4">
              <button
                onClick={handleCreateKey}
                disabled={!newKeyForm.name || newKeyForm.permissions.length === 0 || isCreating}
                className="btn-primary px-4 py-2"
              >
                {isCreating ? 'Creating...' : 'Create Key'}
              </button>
              <button
                onClick={() => setShowCreateForm(false)}
                className="btn-secondary px-4 py-2"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* API Keys List */}
      <div className="space-y-4">
        {apiKeys.map((apiKey) => (
          <div key={apiKey.id} className="card">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="flex items-center space-x-3 mb-2">
                  <h4 className="text-md font-semibold text-gray-900">{apiKey.name}</h4>
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                    apiKey.isActive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                  }`}>
                    {apiKey.isActive ? 'Active' : 'Inactive'}
                  </span>
                </div>

                {/* API Key Display */}
                <div className="mb-3">
                  <label className="block text-xs text-gray-500 mb-1">API Key</label>
                  <div className="flex items-center space-x-2">
                    <code className="flex-1 px-3 py-2 bg-gray-100 rounded text-sm font-mono">
                      {showKey === apiKey.id ? apiKey.key : '••••••••••••••••••••••••••••••••'}
                    </code>
                    <button
                      onClick={() => setShowKey(showKey === apiKey.id ? null : apiKey.id)}
                      className="text-innkt-primary hover:text-innkt-dark text-sm"
                    >
                      {showKey === apiKey.id ? 'Hide' : 'Show'}
                    </button>
                    <button
                      onClick={() => handleCopyKey(apiKey.key)}
                      className="text-innkt-primary hover:text-innkt-dark text-sm"
                    >
                      Copy
                    </button>
                  </div>
                </div>

                {/* Permissions */}
                <div className="mb-3">
                  <label className="block text-xs text-gray-500 mb-1">Permissions</label>
                  <div className="flex flex-wrap gap-1">
                    {apiKey.permissions.map((permission) => (
                      <span
                        key={permission}
                        className={`px-2 py-1 rounded text-xs font-medium ${getPermissionColor(permission)}`}
                      >
                        {permission}
                      </span>
                    ))}
                  </div>
                </div>

                {/* Metadata */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-xs text-gray-500">
                  <div>
                    <span className="font-medium">Created:</span> {formatDate(apiKey.createdAt)}
                  </div>
                  {apiKey.lastUsed && (
                    <div>
                      <span className="font-medium">Last Used:</span> {formatDate(apiKey.lastUsed)}
                    </div>
                  )}
                  {apiKey.expiresAt && (
                    <div>
                      <span className="font-medium">Expires:</span> {formatDate(apiKey.expiresAt)}
                    </div>
                  )}
                  <div>
                    <span className="font-medium">Usage:</span> {apiKey.usageCount.toLocaleString()}
                  </div>
                </div>
              </div>

              {/* Actions */}
              <div className="flex flex-col space-y-2 ml-4">
                <button
                  onClick={() => handleToggleKey(apiKey.id)}
                  className={`text-sm px-3 py-1 rounded ${
                    apiKey.isActive
                      ? 'text-red-600 hover:text-red-800 hover:bg-red-50'
                      : 'text-green-600 hover:text-green-800 hover:bg-green-50'
                  }`}
                >
                  {apiKey.isActive ? 'Deactivate' : 'Activate'}
                </button>
                <button
                  onClick={() => handleDeleteKey(apiKey.id)}
                  className="text-sm text-red-600 hover:text-red-800 hover:bg-red-50 px-3 py-1 rounded"
                >
                  Delete
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Empty State */}
      {apiKeys.length === 0 && (
        <div className="text-center py-12">
          <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <span className="text-2xl text-gray-400">🔑</span>
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">No API keys yet</h3>
          <p className="text-gray-500 mb-4">Create your first API key to start integrating with external services.</p>
          <button
            onClick={() => setShowCreateForm(true)}
            className="btn-primary px-4 py-2"
          >
            Create API Key
          </button>
        </div>
      )}
    </div>
  );
};

export default APIKeyManagement;



