using innkt.Officer.Models.DTOs;

namespace innkt.Officer.Services;

public interface IKidAccountService
{
    Task<string> CreateKidAccountAsync(string parentUserId, CreateKidAccountDto request);
    Task<bool> PairKidAccountAsync(string kidAccountId, KidAccountPairingDto pairingRequest);
    Task<KidAccountStatusDto> GetKidAccountStatusAsync(string kidAccountId);
    Task<List<KidAccountStatusDto>> GetParentKidAccountsAsync(string parentUserId);
    Task<bool> SetKidIndependenceDateAsync(string kidAccountId, DateTime independenceDate);
    Task<bool> MakeKidAccountIndependentAsync(string kidAccountId, KidAccountIndependenceDto request);
    Task<bool> SubmitFollowRequestAsync(KidFollowRequestDto request);
    Task<bool> ApproveFollowRequestAsync(string parentUserId, KidFollowApprovalDto approval);
    Task<bool> RejectFollowRequestAsync(string parentUserId, KidFollowApprovalDto rejection);
    Task<bool> IsKidAccountActiveAsync(string kidAccountId);
    Task<bool> CanKidFollowUserAsync(string kidAccountId, string targetUserId);
    Task<string> GenerateKidQrCodeAsync(string kidAccountId);
    Task<string> GenerateKidPairingCodeAsync(string kidAccountId);
    Task<bool> ValidateKidPairingAsync(string kidAccountId, string qrCode, string pairingCode);
    Task<bool> DeactivateKidAccountAsync(string kidAccountId, string reason);
}




