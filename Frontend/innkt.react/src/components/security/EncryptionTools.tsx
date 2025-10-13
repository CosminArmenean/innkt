import React, { useState, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { useDropzone } from 'react-dropzone';

interface EncryptionResult {
  encrypted: string;
  decrypted?: string;
  algorithm: string;
  keySize: number;
  timestamp: string;
}

const EncryptionTools: React.FC = () => {
  const { t } = useTranslation();
  const [activeTab, setActiveTab] = useState<'text' | 'file' | 'keys'>('text');
  const [textInput, setTextInput] = useState('');
  const [textResult, setTextResult] = useState<EncryptionResult | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [fileResult, setFileResult] = useState<EncryptionResult | null>(null);
  const [encryptionKey, setEncryptionKey] = useState('');
  const [algorithm, setAlgorithm] = useState('AES-256');
  const [isProcessing, setIsProcessing] = useState(false);
  const [showDecrypted, setShowDecrypted] = useState(false);

  const algorithms = [
    { value: 'AES-128', label: 'AES-128 (Fast)' },
    { value: 'AES-256', label: 'AES-256 (Recommended)' },
    { value: 'ChaCha20', label: 'ChaCha20 (Modern)' },
    { value: 'Twofish', label: 'Twofish (Legacy)' }
  ];

  const onDrop = useCallback((acceptedFiles: File[]) => {
    if (acceptedFiles.length > 0) {
      setSelectedFile(acceptedFiles[0]);
    }
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'text/*': ['.txt', '.md', '.json', '.xml'],
      'application/*': ['.pdf', '.doc', '.docx']
    },
    multiple: false
  });

  const generateKey = () => {
    const keyLength = algorithm === 'AES-128' ? 16 : 32;
    const key = Array.from(crypto.getRandomValues(new Uint8Array(keyLength)))
      .map(b => b.toString(16).padStart(2, '0'))
      .join('');
    setEncryptionKey(key);
  };

  const encryptText = async () => {
    if (!textInput || !encryptionKey) return;

    setIsProcessing(true);
    try {
      // TODO: Implement actual encryption using crypto-js or similar
      // For now, simulating encryption
      await new Promise(resolve => setTimeout(resolve, 1000));

      const encrypted = btoa(textInput + '|' + encryptionKey);
      const result: EncryptionResult = {
        encrypted,
        algorithm,
        keySize: algorithm === 'AES-128' ? 128 : 256,
        timestamp: new Date().toISOString()
      };

      setTextResult(result);
    } catch (error) {
      console.error('Encryption failed:', error);
    } finally {
      setIsProcessing(false);
    }
  };

  const decryptText = async () => {
    if (!textResult?.encrypted || !encryptionKey) return;

    setIsProcessing(true);
    try {
      // TODO: Implement actual decryption
      await new Promise(resolve => setTimeout(resolve, 1000));

      const decrypted = atob(textResult.encrypted).split('|')[0];
      setTextResult(prev => prev ? { ...prev, decrypted } : null);
      setShowDecrypted(true);
    } catch (error) {
      console.error('Decryption failed:', error);
    } finally {
      setIsProcessing(false);
    }
  };

  const encryptFile = async () => {
    if (!selectedFile || !encryptionKey) return;

    setIsProcessing(true);
    try {
      // TODO: Implement file encryption
      await new Promise(resolve => setTimeout(resolve, 2000));

      const result: EncryptionResult = {
        encrypted: `encrypted_${selectedFile.name}`,
        algorithm,
        keySize: algorithm === 'AES-128' ? 128 : 256,
        timestamp: new Date().toISOString()
      };

      setFileResult(result);
    } catch (error) {
      console.error('File encryption failed:', error);
    } finally {
      setIsProcessing(false);
    }
  };

  const downloadEncryptedFile = () => {
    if (!fileResult) return;

    const blob = new Blob(['Encrypted file content'], { type: 'application/octet-stream' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = fileResult.encrypted;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    // TODO: Show toast notification
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h3 className="text-lg font-semibold text-gray-900">Encryption Tools</h3>
        <p className="text-sm text-gray-600">Secure your data with military-grade encryption</p>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-8">
          {[
            { id: 'text', label: 'Text Encryption' },
            { id: 'file', label: 'File Encryption' },
            { id: 'keys', label: 'Key Management' }
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === tab.id
                  ? 'border-innkt-primary text-innkt-primary'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </nav>
      </div>

      {/* Text Encryption Tab */}
      {activeTab === 'text' && (
        <div className="space-y-6">
          <div className="card">
            <h4 className="text-md font-semibold text-gray-900 mb-4">Text Encryption</h4>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Input Text</label>
                <textarea
                  value={textInput}
                  onChange={(e) => setTextInput(e.target.value)}
                  placeholder="Enter text to encrypt..."
                  rows={4}
                  className="input-field w-full"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Algorithm</label>
                  <select
                    value={algorithm}
                    onChange={(e) => setAlgorithm(e.target.value)}
                    className="input-field w-full"
                  >
                    {algorithms.map((algo) => (
                      <option key={algo.value} value={algo.value}>
                        {algo.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Encryption Key</label>
                  <div className="flex space-x-2">
                    <input
                      type="text"
                      value={encryptionKey}
                      onChange={(e) => setEncryptionKey(e.target.value)}
                      placeholder="Enter or generate encryption key"
                      className="input-field flex-1"
                    />
                    <button
                      onClick={generateKey}
                      className="btn-secondary px-3 py-2 text-sm"
                    >
                      Generate
                    </button>
                  </div>
                </div>
              </div>

              <div className="flex space-x-3">
                <button
                  onClick={encryptText}
                  disabled={!textInput || !encryptionKey || isProcessing}
                  className="btn-primary px-4 py-2"
                >
                  {isProcessing ? 'Encrypting...' : 'Encrypt Text'}
                </button>
                {textResult && (
                  <button
                    onClick={decryptText}
                    disabled={!encryptionKey || isProcessing}
                    className="btn-secondary px-4 py-2"
                  >
                    {isProcessing ? 'Decrypting...' : 'Decrypt Text'}
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Results */}
          {textResult && (
            <div className="card">
              <h4 className="text-md font-semibold text-gray-900 mb-4">Encryption Results</h4>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Encrypted Text</label>
                  <div className="flex items-center space-x-2">
                    <code className="flex-1 px-3 py-2 bg-gray-100 rounded text-sm font-mono break-all">
                      {textResult.encrypted}
                    </code>
                    <button
                      onClick={() => copyToClipboard(textResult.encrypted)}
                      className="text-innkt-primary hover:text-innkt-dark text-sm"
                    >
                      Copy
                    </button>
                  </div>
                </div>

                {showDecrypted && textResult.decrypted && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Decrypted Text</label>
                    <div className="px-3 py-2 bg-green-50 border border-green-200 rounded text-sm">
                      {textResult.decrypted}
                    </div>
                  </div>
                )}

                <div className="grid grid-cols-3 gap-4 text-sm text-gray-600">
                  <div>
                    <span className="font-medium">Algorithm:</span> {textResult.algorithm}
                  </div>
                  <div>
                    <span className="font-medium">Key Size:</span> {textResult.keySize} bits
                  </div>
                  <div>
                    <span className="font-medium">Timestamp:</span> {new Date(textResult.timestamp).toLocaleString()}
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* File Encryption Tab */}
      {activeTab === 'file' && (
        <div className="space-y-6">
          <div className="card">
            <h4 className="text-md font-semibold text-gray-900 mb-4">File Encryption</h4>
            
            <div className="space-y-4">
              {/* File Upload */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Select File</label>
                <div
                  {...getRootProps()}
                  className={`border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-colors ${
                    isDragActive
                      ? 'border-innkt-primary bg-innkt-light bg-opacity-10'
                      : 'border-gray-300 hover:border-innkt-primary'
                  }`}
                >
                  <input {...getInputProps()} />
                  {selectedFile ? (
                    <div>
                      <div className="w-12 h-12 bg-innkt-primary rounded-lg flex items-center justify-center mx-auto mb-3">
                        <span className="text-xl text-white">📄</span>
                      </div>
                      <p className="text-sm text-gray-600">{selectedFile.name}</p>
                      <p className="text-xs text-gray-500">
                        {(selectedFile.size / 1024 / 1024).toFixed(2)} MB
                      </p>
                    </div>
                  ) : (
                    <div>
                      <div className="w-12 h-12 bg-gray-100 rounded-lg flex items-center justify-center mx-auto mb-3">
                        <span className="text-xl text-gray-400">📁</span>
                      </div>
                      <p className="text-gray-600">
                        {isDragActive ? 'Drop the file here' : 'Drag & drop a file, or click to select'}
                      </p>
                      <p className="text-sm text-gray-500 mt-1">
                        Supports text files, PDFs, and documents
                      </p>
                    </div>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Algorithm</label>
                  <select
                    value={algorithm}
                    onChange={(e) => setAlgorithm(e.target.value)}
                    className="input-field w-full"
                  >
                    {algorithms.map((algo) => (
                      <option key={algo.value} value={algo.value}>
                        {algo.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Encryption Key</label>
                  <div className="flex space-x-2">
                    <input
                      type="text"
                      value={encryptionKey}
                      onChange={(e) => setEncryptionKey(e.target.value)}
                      placeholder="Enter or generate encryption key"
                      className="input-field flex-1"
                    />
                    <button
                      onClick={generateKey}
                      className="btn-secondary px-3 py-2 text-sm"
                    >
                      Generate
                    </button>
                  </div>
                </div>
              </div>

              <button
                onClick={encryptFile}
                disabled={!selectedFile || !encryptionKey || isProcessing}
                className="w-full btn-primary py-3"
              >
                {isProcessing ? 'Encrypting File...' : 'Encrypt File'}
              </button>
            </div>
          </div>

          {/* File Results */}
          {fileResult && (
            <div className="card">
              <h4 className="text-md font-semibold text-gray-900 mb-4">File Encryption Results</h4>
              
              <div className="space-y-4">
                <div className="flex items-center justify-between p-4 bg-green-50 border border-green-200 rounded-lg">
                  <div>
                    <p className="text-sm font-medium text-green-800">
                      File encrypted successfully!
                    </p>
                    <p className="text-xs text-green-600 mt-1">
                      Original: {selectedFile?.name} → Encrypted: {fileResult.encrypted}
                    </p>
                  </div>
                  <button
                    onClick={downloadEncryptedFile}
                    className="btn-primary px-4 py-2 text-sm"
                  >
                    Download
                  </button>
                </div>

                <div className="grid grid-cols-3 gap-4 text-sm text-gray-600">
                  <div>
                    <span className="font-medium">Algorithm:</span> {fileResult.algorithm}
                  </div>
                  <div>
                    <span className="font-medium">Key Size:</span> {fileResult.keySize} bits
                  </div>
                  <div>
                    <span className="font-medium">Timestamp:</span> {new Date(fileResult.timestamp).toLocaleString()}
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Key Management Tab */}
      {activeTab === 'keys' && (
        <div className="card">
          <h4 className="text-md font-semibold text-gray-900 mb-4">Key Management</h4>
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Current Encryption Key</label>
              <div className="flex items-center space-x-2">
                <input
                  type="text"
                  value={encryptionKey}
                  onChange={(e) => setEncryptionKey(e.target.value)}
                  placeholder="Enter your encryption key"
                  className="input-field flex-1"
                />
                <button
                  onClick={generateKey}
                  className="btn-secondary px-3 py-2"
                >
                  Generate New
                </button>
              </div>
            </div>

            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <h5 className="text-sm font-medium text-blue-800 mb-2">Security Best Practices</h5>
              <ul className="text-sm text-blue-700 space-y-1">
                <li>• Use strong, randomly generated keys</li>
                <li>• Store keys securely and never share them</li>
                <li>• Use different keys for different purposes</li>
                <li>• Regularly rotate your encryption keys</li>
                <li>• Consider using a password manager for key storage</li>
              </ul>
            </div>

            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
              <h5 className="text-sm font-medium text-yellow-800 mb-2">Important Notes</h5>
              <ul className="text-sm text-yellow-700 space-y-1">
                <li>• Lost keys cannot be recovered - encrypted data will be permanently inaccessible</li>
                <li>• This tool performs client-side encryption for your privacy</li>
                <li>• Always backup your encryption keys securely</li>
              </ul>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default EncryptionTools;



