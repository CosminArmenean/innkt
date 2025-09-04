namespace innkt.NeuroSpark.Models;

public class QrCodeGenerationRequest
{
    public string Data { get; set; } = string.Empty;
    public QrCodeType Type { get; set; }
    public int Size { get; set; } = 256;
    public string Format { get; set; } = "PNG";
    public QrCodeStyle Style { get; set; } = new();
}

public class KidPairingQrRequest
{
    public string KidUserId { get; set; } = string.Empty;
    public string ParentUserId { get; set; } = string.Empty;
    public string PairingCode { get; set; } = string.Empty;
    public DateTime ExpiresAt { get; set; }
    public int Size { get; set; } = 256;
}

public class QrCodeResult
{
    public string QrCodeImageUrl { get; set; } = string.Empty;
    public string Data { get; set; } = string.Empty;
    public QrCodeType Type { get; set; }
    public DateTime GeneratedAt { get; set; }
    public DateTime? ExpiresAt { get; set; }
    public bool IsValid { get; set; } = true;
}

public class QrCodeScanResult
{
    public string ScannedData { get; set; } = string.Empty;
    public QrCodeType Type { get; set; }
    public bool IsValid { get; set; }
    public string Message { get; set; } = string.Empty;
    public DateTime ScannedAt { get; set; }
}

public class QrCodeValidationRequest
{
    public string QrCodeData { get; set; } = string.Empty;
    public QrCodeType ExpectedType { get; set; }
}

public class QrCodeValidationResult
{
    public bool IsValid { get; set; }
    public string Message { get; set; } = string.Empty;
    public QrCodeType? DetectedType { get; set; }
    public DateTime ValidatedAt { get; set; }
}

public class QrCodeStyle
{
    public string ForegroundColor { get; set; } = "#000000";
    public string BackgroundColor { get; set; } = "#FFFFFF";
    public bool IncludeLogo { get; set; } = false;
    public string? LogoUrl { get; set; }
    public int LogoSize { get; set; } = 50;
}

public enum QrCodeType
{
    KidGroupInvitation,
    KidAccountPairing,
    GroupAccess,
    General
}


