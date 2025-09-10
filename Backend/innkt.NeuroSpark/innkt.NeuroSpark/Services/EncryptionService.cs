using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;
using StackExchange.Redis;
using System.IO.Compression;
using System.Security.Cryptography;
using System.Text;

namespace innkt.NeuroSpark.Services;

public class EncryptionService : IEncryptionService
{
    private readonly ILogger<EncryptionService> _logger;
    private readonly IConnectionMultiplexer _redis;
    private readonly EncryptionSettings _settings;
    private readonly string _keysKey = "encryption:keys:";
    private readonly string _keyDataKey = "encryption:keydata:";

    public EncryptionService(
        ILogger<EncryptionService> logger,
        IConnectionMultiplexer redis,
        IOptions<EncryptionSettings> settings)
    {
        _logger = logger;
        _redis = redis;
        _settings = settings.Value;
    }

    public async Task<string> EncryptAsync(string plaintext, string? keyId = null)
    {
        try
        {
            var key = await GetOrCreateKeyAsync(keyId);
            if (key == null)
            {
                throw new InvalidOperationException("Failed to get encryption key");
            }

            using var aes = Aes.Create();
            aes.KeySize = key.KeySize;
            aes.Mode = CipherMode.CBC;
            aes.Padding = PaddingMode.PKCS7;

            // Generate random IV
            aes.GenerateIV();

            using var encryptor = aes.CreateEncryptor();
            var plaintextBytes = Encoding.UTF8.GetBytes(plaintext);
            
            // Compress if enabled
            if (_settings.EnableCompression)
            {
                plaintextBytes = CompressBytes(plaintextBytes);
            }

            var ciphertextBytes = encryptor.TransformFinalBlock(plaintextBytes, 0, plaintextBytes.Length);

            // Combine IV and ciphertext
            var result = new byte[aes.IV.Length + ciphertextBytes.Length];
            Buffer.BlockCopy(aes.IV, 0, result, 0, aes.IV.Length);
            Buffer.BlockCopy(ciphertextBytes, 0, result, aes.IV.Length, ciphertextBytes.Length);

            var base64Result = Convert.ToBase64String(result);
            
            _logger.LogDebug("Encrypted text using key {KeyId}, result length: {Length}", key.KeyId, base64Result.Length);
            
            return base64Result;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to encrypt text");
            throw;
        }
    }

    public async Task<string> DecryptAsync(string ciphertext, string? keyId = null)
    {
        try
        {
            var key = await GetOrCreateKeyAsync(keyId);
            if (key == null)
            {
                throw new InvalidOperationException("Failed to get decryption key");
            }

            var ciphertextBytes = Convert.FromBase64String(ciphertext);
            
            using var aes = Aes.Create();
            aes.KeySize = key.KeySize;
            aes.Mode = CipherMode.CBC;
            aes.Padding = PaddingMode.PKCS7;

            // Extract IV from the beginning
            var iv = new byte[16];
            Buffer.BlockCopy(ciphertextBytes, 0, iv, 0, iv.Length);
            aes.IV = iv;

            // Extract ciphertext
            var actualCiphertext = new byte[ciphertextBytes.Length - iv.Length];
            Buffer.BlockCopy(ciphertextBytes, iv.Length, actualCiphertext, 0, actualCiphertext.Length);

            using var decryptor = aes.CreateDecryptor();
            var decryptedBytes = decryptor.TransformFinalBlock(actualCiphertext, 0, actualCiphertext.Length);

            // Decompress if compression was used
            if (_settings.EnableCompression)
            {
                decryptedBytes = DecompressBytes(decryptedBytes);
            }

            var plaintext = Encoding.UTF8.GetString(decryptedBytes);
            
            _logger.LogDebug("Decrypted text using key {KeyId}, result length: {Length}", key.KeyId, plaintext.Length);
            
            return plaintext;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to decrypt text");
            throw;
        }
    }

    public async Task<byte[]> EncryptBytesAsync(byte[] plaintext, string? keyId = null)
    {
        try
        {
            var key = await GetOrCreateKeyAsync(keyId);
            if (key == null)
            {
                throw new InvalidOperationException("Failed to get encryption key");
            }

            using var aes = Aes.Create();
            aes.KeySize = key.KeySize;
            aes.Mode = CipherMode.CBC;
            aes.Padding = PaddingMode.PKCS7;

            // Generate random IV
            aes.GenerateIV();

            using var encryptor = aes.CreateEncryptor();
            var plaintextToEncrypt = plaintext;
            
            // Compress if enabled
            if (_settings.EnableCompression)
            {
                plaintextToEncrypt = CompressBytes(plaintext);
            }

            var ciphertextBytes = encryptor.TransformFinalBlock(plaintextToEncrypt, 0, plaintextToEncrypt.Length);

            // Combine IV and ciphertext
            var result = new byte[aes.IV.Length + ciphertextBytes.Length];
            Buffer.BlockCopy(aes.IV, 0, result, 0, aes.IV.Length);
            Buffer.BlockCopy(ciphertextBytes, 0, result, aes.IV.Length, ciphertextBytes.Length);

            _logger.LogDebug("Encrypted bytes using key {KeyId}, result length: {Length}", key.KeyId, result.Length);
            
            return result;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to encrypt bytes");
            throw;
        }
    }

    public async Task<byte[]> DecryptBytesAsync(byte[] ciphertext, string? keyId = null)
    {
        try
        {
            var key = await GetOrCreateKeyAsync(keyId);
            if (key == null)
            {
                throw new InvalidOperationException("Failed to get decryption key");
            }

            using var aes = Aes.Create();
            aes.KeySize = key.KeySize;
            aes.Mode = CipherMode.CBC;
            aes.Padding = PaddingMode.PKCS7;

            // Extract IV from the beginning
            var iv = new byte[16];
            Buffer.BlockCopy(ciphertext, 0, iv, 0, iv.Length);
            aes.IV = iv;

            // Extract ciphertext
            var actualCiphertext = new byte[ciphertext.Length - iv.Length];
            Buffer.BlockCopy(ciphertext, iv.Length, actualCiphertext, 0, actualCiphertext.Length);

            using var decryptor = aes.CreateDecryptor();
            var decryptedBytes = decryptor.TransformFinalBlock(actualCiphertext, 0, actualCiphertext.Length);

            // Decompress if compression was used
            if (_settings.EnableCompression)
            {
                decryptedBytes = DecompressBytes(decryptedBytes);
            }

            _logger.LogDebug("Decrypted bytes using key {KeyId}, result length: {Length}", key.KeyId, decryptedBytes.Length);
            
            return decryptedBytes;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to decrypt bytes");
            throw;
        }
    }

    public async Task<string> EncryptFileAsync(string filePath, string? keyId = null)
    {
        try
        {
            if (!File.Exists(filePath))
            {
                throw new FileNotFoundException("File not found", filePath);
            }

            var key = await GetOrCreateKeyAsync(keyId);
            if (key == null)
            {
                throw new InvalidOperationException("Failed to get encryption key");
            }

            var fileName = Path.GetFileName(filePath);
            var encryptedFileName = $"{fileName}.encrypted";
            var encryptedFilePath = Path.Combine(Path.GetDirectoryName(filePath)!, encryptedFileName);

            var fileBytes = await File.ReadAllBytesAsync(filePath);
            var encryptedBytes = await EncryptBytesAsync(fileBytes, key.KeyId);

            await File.WriteAllBytesAsync(encryptedFilePath, encryptedBytes);

            _logger.LogInformation("Encrypted file {FilePath} to {EncryptedFilePath} using key {KeyId}", 
                filePath, encryptedFilePath, key.KeyId);

            return encryptedFilePath;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to encrypt file {FilePath}", filePath);
            throw;
        }
    }

    public async Task<bool> DecryptFileAsync(string encryptedFilePath, string outputPath, string? keyId = null)
    {
        try
        {
            if (!File.Exists(encryptedFilePath))
            {
                throw new FileNotFoundException("Encrypted file not found", encryptedFilePath);
            }

            var key = await GetOrCreateKeyAsync(keyId);
            if (key == null)
            {
                throw new InvalidOperationException("Failed to get decryption key");
            }

            var encryptedBytes = await File.ReadAllBytesAsync(encryptedFilePath);
            var decryptedBytes = await DecryptBytesAsync(encryptedBytes, key.KeyId);

            await File.WriteAllBytesAsync(outputPath, decryptedBytes);

            _logger.LogInformation("Decrypted file {EncryptedFilePath} to {OutputPath} using key {KeyId}", 
                encryptedFilePath, outputPath, key.KeyId);

            return true;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to decrypt file {EncryptedFilePath}", encryptedFilePath);
            return false;
        }
    }

    public async Task<string> GenerateKeyAsync(string keyName, int keySize = 256)
    {
        try
        {
            var keyId = Guid.NewGuid().ToString();
            var keyBytes = new byte[keySize / 8];
            
            using (var rng = RandomNumberGenerator.Create())
            {
                rng.GetBytes(keyBytes);
            }

            var keyInfo = new EncryptionKeyInfo
            {
                KeyId = keyId,
                KeyName = keyName,
                KeySize = keySize,
                Algorithm = _settings.Algorithm,
                CreatedAt = DateTime.UtcNow,
                ExpiresAt = DateTime.UtcNow.AddDays(_settings.KeyRotationDays),
                IsActive = true,
                Status = "Active"
            };

            var db = _redis.GetDatabase();
            
            // Store key info
            var keyInfoSerialized = System.Text.Json.JsonSerializer.Serialize(keyInfo);
            await db.StringSetAsync($"{_keysKey}{keyId}", keyInfoSerialized);
            
            // Store actual key data (encrypted)
            var keyDataSerialized = System.Text.Json.JsonSerializer.Serialize(new { KeyBytes = Convert.ToBase64String(keyBytes) });
            await db.StringSetAsync($"{_keyDataKey}{keyId}", keyDataSerialized);

            _logger.LogInformation("Generated encryption key {KeyId} with name {KeyName} and size {KeySize}", 
                keyId, keyName, keySize);

            return keyId;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to generate encryption key");
            throw;
        }
    }

    public async Task<bool> RotateKeyAsync(string oldKeyId, string newKeyId)
    {
        try
        {
            var oldKey = await GetKeyInfoAsync(oldKeyId);
            var newKey = await GetKeyInfoAsync(newKeyId);

            if (oldKey == null || newKey == null)
            {
                return false;
            }

            // Mark old key as inactive
            oldKey.IsActive = false;
            oldKey.Status = "Rotated";
            oldKey.ExpiresAt = DateTime.UtcNow;

            var db = _redis.GetDatabase();
            var oldKeySerialized = System.Text.Json.JsonSerializer.Serialize(oldKey);
            await db.StringSetAsync($"{_keysKey}{oldKeyId}", oldKeySerialized);

            // Mark new key as active
            newKey.IsActive = true;
            newKey.Status = "Active";
            var newKeySerialized = System.Text.Json.JsonSerializer.Serialize(newKey);
            await db.StringSetAsync($"{_keysKey}{newKeyId}", newKeySerialized);

            _logger.LogInformation("Rotated encryption key from {OldKeyId} to {NewKeyId}", oldKeyId, newKeyId);
            return true;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to rotate encryption key from {OldKeyId} to {NewKeyId}", oldKeyId, newKeyId);
            return false;
        }
    }

    public async Task<EncryptionKeyInfo> GetKeyInfoAsync(string keyId)
    {
        try
        {
            var db = _redis.GetDatabase();
            var serialized = await db.StringGetAsync($"{_keysKey}{keyId}");
            
            if (serialized.IsNull)
                return null;

            return System.Text.Json.JsonSerializer.Deserialize<EncryptionKeyInfo>(serialized!);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to get key info for {KeyId}", keyId);
            return null;
        }
    }

    public async Task<IEnumerable<EncryptionKeyInfo>> GetAllKeysAsync()
    {
        try
        {
            var db = _redis.GetDatabase();
            var pattern = $"{_keysKey}*";
            var keys = db.Multiplexer.GetServer(db.Multiplexer.GetEndPoints().First()).Keys(pattern: pattern);
            var keyInfos = new List<EncryptionKeyInfo>();

            foreach (var key in keys)
            {
                var serialized = await db.StringGetAsync(key);
                if (!serialized.IsNull)
                {
                    var keyInfo = System.Text.Json.JsonSerializer.Deserialize<EncryptionKeyInfo>(serialized!);
                    if (keyInfo != null)
                    {
                        keyInfos.Add(keyInfo);
                    }
                }
            }

            return keyInfos.OrderByDescending(k => k.CreatedAt);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to get all encryption keys");
            return Enumerable.Empty<EncryptionKeyInfo>();
        }
    }

    public async Task<bool> DeleteKeyAsync(string keyId)
    {
        try
        {
            var db = _redis.GetDatabase();
            
            // Delete key info
            await db.KeyDeleteAsync($"{_keysKey}{keyId}");
            
            // Delete key data
            await db.KeyDeleteAsync($"{_keyDataKey}{keyId}");

            _logger.LogInformation("Deleted encryption key {KeyId}", keyId);
            return true;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to delete encryption key {KeyId}", keyId);
            return false;
        }
    }

    private async Task<EncryptionKeyInfo?> GetOrCreateKeyAsync(string? keyId)
    {
        if (string.IsNullOrEmpty(keyId))
        {
            keyId = _settings.DefaultKeyId;
        }

        if (string.IsNullOrEmpty(keyId))
        {
            // Generate a default key
            keyId = await GenerateKeyAsync("Default", _settings.DefaultKeySize);
            _settings.DefaultKeyId = keyId;
        }

        return await GetKeyInfoAsync(keyId);
    }

    private byte[] CompressBytes(byte[] input)
    {
        using var outputStream = new MemoryStream();
        using (var gzipStream = new GZipStream(outputStream, CompressionMode.Compress))
        {
            gzipStream.Write(input, 0, input.Length);
        }
        return outputStream.ToArray();
    }

    private byte[] DecompressBytes(byte[] input)
    {
        using var inputStream = new MemoryStream(input);
        using var outputStream = new MemoryStream();
        using (var gzipStream = new GZipStream(inputStream, CompressionMode.Decompress))
        {
            gzipStream.CopyTo(outputStream);
        }
        return outputStream.ToArray();
    }
}



