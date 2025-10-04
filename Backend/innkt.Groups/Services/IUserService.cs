using innkt.Groups.DTOs;

namespace innkt.Groups.Services;

public interface IUserService
{
    Task<UserBasicInfo?> GetUserBasicInfoAsync(Guid userId);
    Task<List<UserBasicInfo>> GetUsersBasicInfoAsync(List<Guid> userIds);
}
