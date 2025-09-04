namespace innkt.NeuroSpark.Services;

public interface IEncryptionService
{
    Task<string> EncryptAsync(string plaintext, string? keyId = null);
    Task<string> DecryptAsync(string ciphertext, string? keyId = null);
    Task<byte[]> EncryptBytesAsync(byte[] plaintext, string? keyId = null);
    Task<byte[]> DecryptBytesAsync(byte[] ciphertext, string? keyId = null);
    Task<string> EncryptFileAsync(string filePath, string? keyId = null);
    Task<bool> DecryptFileAsync(string encryptedFilePath, string outputPath, string? keyId = null);
    Task<string> GenerateKeyAsync(string keyName, int keySize = 256);
    Task<bool> RotateKeyAsync(string oldKeyId, string newKeyId);
    Task<EncryptionKeyInfo> GetKeyInfoAsync(string keyId);
    Task<IEnumerable<EncryptionKeyInfo>> GetAllKeysAsync();
    Task<bool> DeleteKeyAsync(string keyId);
}

public class EncryptionKeyInfo
{
    public string KeyId { get; set; } = string.Empty;
    public string KeyName { get; set; } = string.Empty;
    public int KeySize { get; set; }
    public string Algorithm { get; set; } = string.Empty;
    public DateTime CreatedAt { get; set; }
    public DateTime? ExpiresAt { get; set; }
    public bool IsActive { get; set; }
    public string Status { get; set; } = string.Empty;
    public Dictionary<string, object> Metadata { get; set; } = new();
}

public class EncryptionResult
{
    public bool Success { get; set; }
    public string? Ciphertext { get; set; }
    public byte[]? CiphertextBytes { get; set; }
    public string? KeyId { get; set; }
    public string? ErrorMessage { get; set; }
    public Dictionary<string, object> Metadata { get; set; } = new();
}

public class DecryptionResult
{
    public bool Success { get; set; }
    public string? Plaintext { get; set; }
    public byte[]? PlaintextBytes { get; set; }
    public string? KeyId { get; set; }
    public string? ErrorMessage { get; set; }
    public Dictionary<string, object> Metadata { get; set; } = new();
}

public class FileEncryptionResult
{
    public bool Success { get; set; }
    public string? EncryptedFilePath { get; set; }
    public string? KeyId { get; set; }
    public long OriginalFileSize { get; set; }
    public long EncryptedFileSize { get; set; }
    public string? ErrorMessage { get; set; }
    public Dictionary<string, object> Metadata { get; set; } = new();
}

public class EncryptionSettings
{
    public string DefaultKeyId { get; set; } = string.Empty;
    public int DefaultKeySize { get; set; } = 256;
    public string Algorithm { get; set; } = "AES";
    public string Mode { get; set; } = "CBC";
    public int KeyRotationDays { get; set; } = 90;
    public bool EnableKeyRotation { get; set; } = true;
    public string KeyStoragePath { get; set; } = string.Empty;
    public bool EnableCompression { get; set; } = true;
}


