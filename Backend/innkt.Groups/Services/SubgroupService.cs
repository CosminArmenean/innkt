using innkt.Groups.DTOs;
using innkt.Groups.Models;
using innkt.Groups.Data;
using Microsoft.EntityFrameworkCore;
using AutoMapper;

namespace innkt.Groups.Services
{
    public class SubgroupService : ISubgroupService
    {
        private readonly GroupsDbContext _context;
        private readonly IMapper _mapper;
        private readonly ILogger<SubgroupService> _logger;

        public SubgroupService(
            GroupsDbContext context,
            IMapper mapper,
            ILogger<SubgroupService> logger)
        {
            _context = context;
            _mapper = mapper;
            _logger = logger;
        }

        public async Task<List<SubgroupResponse>> GetSubgroupsAsync(Guid groupId)
        {
            try
            {
                var subgroups = await _context.Subgroups
                    .Where(s => s.GroupId == groupId)
                    .ToListAsync();

                return subgroups.Select(s => _mapper.Map<SubgroupResponse>(s)).ToList();
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "❌ Error getting subgroups for group {GroupId}", groupId);
                throw;
            }
        }

        public async Task<SubgroupResponse?> GetSubgroupAsync(Guid groupId, Guid subgroupId)
        {
            try
            {
                var subgroup = await _context.Subgroups
                    .FirstOrDefaultAsync(s => s.Id == subgroupId && s.GroupId == groupId);

                return subgroup != null ? _mapper.Map<SubgroupResponse>(subgroup) : null;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "❌ Error getting subgroup {SubgroupId} for group {GroupId}", subgroupId, groupId);
                throw;
            }
        }

        public async Task<SubgroupResponse> CreateSubgroupAsync(Guid groupId, Guid userId, CreateSubgroupRequest request)
        {
            try
            {
                var subgroup = new Subgroup
                {
                    GroupId = groupId,
                    Name = request.Name,
                    Description = request.Description,
                    Settings = System.Text.Json.JsonSerializer.Serialize(request.Settings),
                    CreatedAt = DateTime.UtcNow,
                    UpdatedAt = DateTime.UtcNow
                };

                _context.Subgroups.Add(subgroup);
                await _context.SaveChangesAsync();

                _logger.LogInformation("✅ Created subgroup '{SubgroupName}' in group {GroupId}", subgroup.Name, groupId);

                return _mapper.Map<SubgroupResponse>(subgroup);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "❌ Error creating subgroup for group {GroupId}", groupId);
                throw;
            }
        }

        public async Task<SubgroupResponse> UpdateSubgroupAsync(Guid groupId, Guid subgroupId, Guid userId, UpdateSubgroupRequest request)
        {
            try
            {
                var subgroup = await _context.Subgroups
                    .FirstOrDefaultAsync(s => s.Id == subgroupId && s.GroupId == groupId);

                if (subgroup == null)
                    throw new KeyNotFoundException("Subgroup not found");

                subgroup.Name = request.Name;
                subgroup.Description = request.Description;
                subgroup.Settings = System.Text.Json.JsonSerializer.Serialize(request.Settings);
                subgroup.UpdatedAt = DateTime.UtcNow;

                await _context.SaveChangesAsync();

                _logger.LogInformation("✅ Updated subgroup '{SubgroupName}' in group {GroupId}", subgroup.Name, groupId);

                return _mapper.Map<SubgroupResponse>(subgroup);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "❌ Error updating subgroup {SubgroupId} for group {GroupId}", subgroupId, groupId);
                throw;
            }
        }

        public async Task DeleteSubgroupAsync(Guid groupId, Guid subgroupId, Guid userId)
        {
            try
            {
                var subgroup = await _context.Subgroups
                    .FirstOrDefaultAsync(s => s.Id == subgroupId && s.GroupId == groupId);

                if (subgroup == null)
                    throw new KeyNotFoundException("Subgroup not found");

                _context.Subgroups.Remove(subgroup);
                await _context.SaveChangesAsync();

                _logger.LogInformation("🗑️ Deleted subgroup '{SubgroupName}' from group {GroupId}", subgroup.Name, groupId);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "❌ Error deleting subgroup {SubgroupId} from group {GroupId}", subgroupId, groupId);
                throw;
            }
        }

        public async Task<List<SubgroupMemberResponse>> GetSubgroupMembersAsync(Guid groupId, Guid subgroupId)
        {
            try
            {
                var members = await _context.GroupMembers
                    .Include(m => m.Role)
                    .Where(m => m.GroupId == groupId && m.SubgroupId == subgroupId)
                    .ToListAsync();

                return members.Select(m => _mapper.Map<SubgroupMemberResponse>(m)).ToList();
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "❌ Error getting subgroup members for subgroup {SubgroupId} in group {GroupId}", subgroupId, groupId);
                throw;
            }
        }

        public async Task<SubgroupMemberResponse> AddSubgroupMemberAsync(Guid groupId, Guid subgroupId, Guid userId, AddSubgroupMemberRequest request)
        {
            try
            {
                var member = await _context.GroupMembers
                    .FirstOrDefaultAsync(m => m.GroupId == groupId && m.UserId == request.UserId);

                if (member == null)
                    throw new KeyNotFoundException("Group member not found");

                member.SubgroupId = subgroupId;
                member.RoleId = request.RoleId;
                member.IsParentAccount = request.IsParentAccount;
                member.KidAccountId = request.KidAccountId;
                member.UpdatedAt = DateTime.UtcNow;

                await _context.SaveChangesAsync();

                _logger.LogInformation("✅ Added member {UserId} to subgroup {SubgroupId} in group {GroupId}", request.UserId, subgroupId, groupId);

                return _mapper.Map<SubgroupMemberResponse>(member);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "❌ Error adding member {UserId} to subgroup {SubgroupId} in group {GroupId}", request.UserId, subgroupId, groupId);
                throw;
            }
        }

        public async Task RemoveSubgroupMemberAsync(Guid groupId, Guid subgroupId, Guid memberId, Guid userId)
        {
            try
            {
                var member = await _context.GroupMembers
                    .FirstOrDefaultAsync(m => m.Id == memberId && m.GroupId == groupId && m.SubgroupId == subgroupId);

                if (member == null)
                    throw new KeyNotFoundException("Subgroup member not found");

                member.SubgroupId = null;
                member.UpdatedAt = DateTime.UtcNow;

                await _context.SaveChangesAsync();

                _logger.LogInformation("✅ Removed member {MemberId} from subgroup {SubgroupId} in group {GroupId}", memberId, subgroupId, groupId);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "❌ Error removing member {MemberId} from subgroup {SubgroupId} in group {GroupId}", memberId, subgroupId, groupId);
                throw;
            }
        }

        public async Task<object> GetSubgroupStatsAsync(Guid groupId, Guid subgroupId)
        {
            try
            {
                var memberCount = await _context.GroupMembers
                    .CountAsync(m => m.GroupId == groupId && m.SubgroupId == subgroupId);

                var topicCount = await _context.Topics
                    .CountAsync(t => t.GroupId == groupId && t.SubgroupId == subgroupId);

                var postCount = await _context.TopicPosts
                    .CountAsync(tp => tp.Topic.GroupId == groupId && tp.Topic.SubgroupId == subgroupId);

                return new
                {
                    MemberCount = memberCount,
                    TopicCount = topicCount,
                    PostCount = postCount,
                    LastActivity = DateTime.UtcNow // This would be calculated from actual data
                };
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "❌ Error getting stats for subgroup {SubgroupId} in group {GroupId}", subgroupId, groupId);
                throw;
            }
        }
    }
}
