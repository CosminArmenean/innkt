using innkt.Groups.DTOs;

namespace innkt.Groups.Services
{
    public interface ISubgroupService
    {
        Task<List<SubgroupResponse>> GetSubgroupsAsync(Guid groupId);
        Task<SubgroupResponse?> GetSubgroupAsync(Guid groupId, Guid subgroupId);
        Task<SubgroupResponse> CreateSubgroupAsync(Guid groupId, Guid userId, CreateSubgroupRequest request);
        Task<SubgroupResponse> UpdateSubgroupAsync(Guid groupId, Guid subgroupId, Guid userId, UpdateSubgroupRequest request);
        Task DeleteSubgroupAsync(Guid groupId, Guid subgroupId, Guid userId);
        Task<List<SubgroupMemberResponse>> GetSubgroupMembersAsync(Guid groupId, Guid subgroupId);
        Task<SubgroupMemberResponse> AddSubgroupMemberAsync(Guid groupId, Guid subgroupId, Guid userId, AddSubgroupMemberRequest request);
        Task RemoveSubgroupMemberAsync(Guid groupId, Guid subgroupId, Guid memberId, Guid userId);
        Task<object> GetSubgroupStatsAsync(Guid groupId, Guid subgroupId);
    }
}
