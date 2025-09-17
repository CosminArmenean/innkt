import React, { useState, useEffect } from 'react';
import { socialService, Post } from '../../services/social.service';

interface BlockchainIntegrationProps {
  userId: string;
  isVerified: boolean;
}

interface BlockchainPost {
  id: string;
  postId: string;
  network: 'hashgraph' | 'ethereum' | 'polygon';
  transactionHash: string;
  blockNumber?: number;
  gasUsed?: number;
  timestamp: string;
  metadata: {
    contentHash: string;
    author: string;
    timestamp: string;
    postType: string;
    verificationLevel: 'basic' | 'enhanced' | 'premium';
  };
  status: 'pending' | 'confirmed' | 'failed';
}

interface WalletInfo {
  address: string;
  network: string;
  balance: string;
  isConnected: boolean;
}

const BlockchainIntegration: React.FC<BlockchainIntegrationProps> = ({ userId, isVerified }) => {
  const [blockchainPosts, setBlockchainPosts] = useState<BlockchainPost[]>([]);
  const [walletInfo, setWalletInfo] = useState<WalletInfo | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [selectedNetwork, setSelectedNetwork] = useState<'hashgraph' | 'ethereum' | 'polygon'>('hashgraph');
  const [selectedPost, setSelectedPost] = useState<Post | null>(null);
  const [verificationLevel, setVerificationLevel] = useState<'basic' | 'enhanced' | 'premium'>('basic');

  // Load blockchain posts
  const loadBlockchainPosts = async () => {
    setIsLoading(true);
    try {
      // This would be a custom endpoint to get blockchain posts
      // For now, we'll simulate with empty array since we don't have blockchain posts yet
      setBlockchainPosts([]);
    } catch (error) {
      console.error('Failed to load blockchain posts:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Load wallet info
  const loadWalletInfo = async () => {
    try {
      // This would be a custom endpoint to get wallet info
      const response = await socialService.getWalletInfo(userId);
      setWalletInfo(response);
    } catch (error) {
      console.error('Failed to load wallet info:', error);
    }
  };

  useEffect(() => {
    if (isVerified) {
      loadBlockchainPosts();
      loadWalletInfo();
    }
  }, [userId, isVerified]);

  // Create blockchain post
  const handleCreateBlockchainPost = async () => {
    if (!selectedPost) return;

    setIsLoading(true);
    try {
      const blockchainData = {
        postId: selectedPost.id,
        network: selectedNetwork,
        verificationLevel,
        metadata: {
          contentHash: btoa(selectedPost.content), // Simple hash for demo
          author: selectedPost.authorProfile?.displayName || 'Unknown User',
          timestamp: selectedPost.createdAt,
          postType: selectedPost.postType,
          verificationLevel,
        },
      };

      // Blockchain functionality disabled for now
      // const result = await socialService.createBlockchainPost(selectedPost.id, blockchainData);
      const result = { transactionHash: 'disabled', blockchainUrl: 'disabled' };
      
      // Create a proper BlockchainPost object
      const blockchainPost: BlockchainPost = {
        id: `blockchain-${Date.now()}`,
        postId: selectedPost.id,
        network: selectedNetwork,
        transactionHash: result.transactionHash || 'pending',
        timestamp: new Date().toISOString(),
        metadata: blockchainData.metadata,
        status: 'pending',
      };
      
      setBlockchainPosts(prev => [blockchainPost, ...prev]);
      setShowCreateModal(false);
      setSelectedPost(null);
    } catch (error) {
      console.error('Failed to create blockchain post:', error);
      alert('Failed to create blockchain post. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  // Connect wallet
  const handleConnectWallet = async () => {
    try {
      // This would integrate with wallet providers like MetaMask, WalletConnect, etc.
      const walletData = await socialService.connectWallet(userId, selectedNetwork);
      setWalletInfo(walletData);
    } catch (error) {
      console.error('Failed to connect wallet:', error);
      alert('Failed to connect wallet. Please try again.');
    }
  };

  // Get network icon
  const getNetworkIcon = (network: string) => {
    switch (network) {
      case 'hashgraph': return '🌐';
      case 'ethereum': return '⟠';
      case 'polygon': return '⬟';
      default: return '⛓️';
    }
  };

  // Get status color
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'confirmed': return 'text-green-600 bg-green-100';
      case 'pending': return 'text-yellow-600 bg-yellow-100';
      case 'failed': return 'text-red-600 bg-red-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  // Get verification level color
  const getVerificationLevelColor = (level: string) => {
    switch (level) {
      case 'premium': return 'text-purple-600 bg-purple-100';
      case 'enhanced': return 'text-blue-600 bg-blue-100';
      case 'basic': return 'text-green-600 bg-green-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  // Format blockchain address
  const formatAddress = (address: string) => {
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  };

  // Copy to clipboard
  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      alert('Copied to clipboard!');
    } catch (error) {
      console.warn('Failed to copy to clipboard:', error);
      // Fallback: try using the old method
      try {
        const textArea = document.createElement('textarea');
        textArea.value = text;
        document.body.appendChild(textArea);
        textArea.select();
        document.execCommand('copy');
        document.body.removeChild(textArea);
        alert('Copied to clipboard!');
      } catch (fallbackError) {
        console.error('Clipboard copy failed:', fallbackError);
        alert('Failed to copy to clipboard');
      }
    }
  };

  if (!isVerified) {
    return (
      <div className="card text-center py-12">
        <div className="text-6xl mb-4">🔒</div>
        <h3 className="text-xl font-semibold text-gray-900 mb-2">Verification Required</h3>
        <p className="text-gray-600 mb-4">
          You need to be a verified user to access blockchain features.
        </p>
        <button className="btn-primary">
          Get Verified
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Blockchain Integration</h2>
          <p className="text-gray-600">Create verified posts on the blockchain</p>
        </div>
        <button
          onClick={() => setShowCreateModal(true)}
          className="btn-primary"
        >
          Create Blockchain Post
        </button>
      </div>

      {/* Wallet Info */}
      {walletInfo && (
        <div className="card">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Wallet Information</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Address</label>
              <div className="flex items-center space-x-2">
                <span className="text-sm font-mono bg-gray-100 px-2 py-1 rounded">
                  {formatAddress(walletInfo.address)}
                </span>
                <button
                  onClick={() => copyToClipboard(walletInfo.address)}
                  className="text-gray-400 hover:text-gray-600"
                  title="Copy address"
                >
                  📋
                </button>
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Network</label>
              <span className="text-sm text-gray-900">{walletInfo.network}</span>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Balance</label>
              <span className="text-sm text-gray-900">{walletInfo.balance}</span>
            </div>
          </div>
        </div>
      )}

      {/* Connect Wallet */}
      {!walletInfo && (
        <div className="card text-center py-8">
          <div className="text-4xl mb-4">💳</div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Connect Your Wallet</h3>
          <p className="text-gray-600 mb-4">
            Connect your wallet to start creating blockchain-verified posts.
          </p>
          <div className="flex justify-center space-x-4">
            <button
              onClick={() => {
                setSelectedNetwork('hashgraph');
                handleConnectWallet();
              }}
              className="btn-primary"
            >
              Connect Hedera Wallet
            </button>
            <button
              onClick={() => {
                setSelectedNetwork('ethereum');
                handleConnectWallet();
              }}
              className="btn-secondary"
            >
              Connect Ethereum Wallet
            </button>
          </div>
        </div>
      )}

      {/* Blockchain Posts */}
      <div className="card">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Blockchain Posts</h3>
        
        {isLoading ? (
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-innkt-primary"></div>
          </div>
        ) : blockchainPosts.length === 0 ? (
          <div className="text-center py-8">
            <div className="text-4xl mb-4">⛓️</div>
            <p className="text-gray-600">No blockchain posts yet</p>
            <p className="text-sm text-gray-500">Create your first blockchain-verified post</p>
          </div>
        ) : (
          <div className="space-y-4">
            {blockchainPosts.map((blockchainPost) => (
              <div key={blockchainPost.id} className="border border-gray-200 rounded-lg p-4">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center space-x-3">
                    <span className="text-2xl">{getNetworkIcon(blockchainPost.network)}</span>
                    <div>
                      <h4 className="font-medium text-gray-900">
                        {blockchainPost.network.charAt(0).toUpperCase() + blockchainPost.network.slice(1)} Post
                      </h4>
                      <p className="text-sm text-gray-600">
                        {new Date(blockchainPost.timestamp).toLocaleString()}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(blockchainPost.status)}`}>
                      {blockchainPost.status}
                    </span>
                    <span className={`px-2 py-1 text-xs font-medium rounded-full ${getVerificationLevelColor(blockchainPost.metadata.verificationLevel)}`}>
                      {blockchainPost.metadata.verificationLevel}
                    </span>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">Transaction Hash</label>
                    <div className="flex items-center space-x-2">
                      <span className="font-mono text-xs bg-gray-100 px-2 py-1 rounded">
                        {formatAddress(blockchainPost.transactionHash)}
                      </span>
                      <button
                        onClick={() => copyToClipboard(blockchainPost.transactionHash)}
                        className="text-gray-400 hover:text-gray-600"
                        title="Copy transaction hash"
                      >
                        📋
                      </button>
                    </div>
                  </div>
                  
                  {blockchainPost.blockNumber && (
                    <div>
                      <label className="block text-xs font-medium text-gray-700 mb-1">Block Number</label>
                      <span className="text-sm text-gray-900">{blockchainPost.blockNumber}</span>
                    </div>
                  )}
                  
                  {blockchainPost.gasUsed && (
                    <div>
                      <label className="block text-xs font-medium text-gray-700 mb-1">Gas Used</label>
                      <span className="text-sm text-gray-900">{blockchainPost.gasUsed}</span>
                    </div>
                  )}
                  
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">Content Hash</label>
                    <div className="flex items-center space-x-2">
                      <span className="font-mono text-xs bg-gray-100 px-2 py-1 rounded">
                        {formatAddress(blockchainPost.metadata.contentHash)}
                      </span>
                      <button
                        onClick={() => copyToClipboard(blockchainPost.metadata.contentHash)}
                        className="text-gray-400 hover:text-gray-600"
                        title="Copy content hash"
                      >
                        📋
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Create Blockchain Post Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4 max-h-[90vh] overflow-y-auto">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Create Blockchain Post</h3>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Select Post
                </label>
                <select
                  className="input-field"
                  onChange={(e) => {
                    const postId = e.target.value;
                    // This would load the actual post data
                    setSelectedPost({ id: postId } as Post);
                  }}
                >
                  <option value="">Choose a post to verify...</option>
                  <option value="post1">Sample Post 1</option>
                  <option value="post2">Sample Post 2</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Blockchain Network
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {['hashgraph', 'ethereum', 'polygon'].map((network) => (
                    <button
                      key={network}
                      onClick={() => setSelectedNetwork(network as any)}
                      className={`p-3 border rounded-lg text-center transition-colors ${
                        selectedNetwork === network
                          ? 'border-innkt-primary bg-innkt-primary bg-opacity-10'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      <div className="text-2xl mb-1">{getNetworkIcon(network)}</div>
                      <div className="text-xs font-medium capitalize">{network}</div>
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Verification Level
                </label>
                <div className="space-y-2">
                  {[
                    { value: 'basic', label: 'Basic', desc: 'Content hash verification', cost: 'Free' },
                    { value: 'enhanced', label: 'Enhanced', desc: 'Enhanced metadata + timestamp', cost: '0.001 HBAR' },
                    { value: 'premium', label: 'Premium', desc: 'Full verification + smart contract', cost: '0.01 HBAR' },
                  ].map((level) => (
                    <label
                      key={level.value}
                      className={`relative flex items-center p-3 border rounded-lg cursor-pointer transition-colors ${
                        verificationLevel === level.value
                          ? 'border-innkt-primary bg-innkt-primary bg-opacity-10'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      <input
                        type="radio"
                        name="verificationLevel"
                        value={level.value}
                        checked={verificationLevel === level.value}
                        onChange={(e) => setVerificationLevel(e.target.value as any)}
                        className="sr-only"
                      />
                      <div className="flex-1">
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-medium text-gray-900">{level.label}</span>
                          <span className="text-xs text-gray-500">{level.cost}</span>
                        </div>
                        <p className="text-xs text-gray-600 mt-1">{level.desc}</p>
                      </div>
                    </label>
                  ))}
                </div>
              </div>
            </div>

            <div className="flex justify-end space-x-3 mt-6">
              <button
                onClick={() => {
                  setShowCreateModal(false);
                  setSelectedPost(null);
                }}
                className="btn-secondary"
              >
                Cancel
              </button>
              <button
                onClick={handleCreateBlockchainPost}
                disabled={!selectedPost || isLoading}
                className="btn-primary disabled:opacity-50"
              >
                {isLoading ? 'Creating...' : 'Create Blockchain Post'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default BlockchainIntegration;

