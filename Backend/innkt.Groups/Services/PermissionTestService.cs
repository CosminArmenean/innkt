using innkt.Groups.Models;
using innkt.Groups.Data;
using Microsoft.EntityFrameworkCore;

namespace innkt.Groups.Services;

public interface IPermissionTestService
{
    Task<PermissionTestResult> TestPermissionSystemAsync(Guid groupId);
    Task<PermissionTestResult> TestEducationalGroupPermissionsAsync(Guid groupId);
    Task<PermissionTestResult> TestFamilyGroupPermissionsAsync(Guid groupId);
    Task<PermissionTestResult> TestRoleBasedPermissionsAsync(Guid groupId);
    Task<PermissionTestResult> TestParentKidPermissionsAsync(Guid groupId);
}

public class PermissionTestService : IPermissionTestService
{
    private readonly GroupsDbContext _context;
    private readonly IPermissionService _permissionService;
    private readonly ILogger<PermissionTestService> _logger;

    public PermissionTestService(
        GroupsDbContext context, 
        IPermissionService permissionService, 
        ILogger<PermissionTestService> logger)
    {
        _context = context;
        _permissionService = permissionService;
        _logger = logger;
    }

    public async Task<PermissionTestResult> TestPermissionSystemAsync(Guid groupId)
    {
        var result = new PermissionTestResult
        {
            GroupId = groupId,
            TestName = "General Permission System Test",
            Tests = new List<PermissionTest>()
        };

        try
        {
            var group = await _context.Groups
                .Include(g => g.Members)
                .Include(g => g.Roles)
                .FirstOrDefaultAsync(g => g.Id == groupId);

            if (group == null)
            {
                result.Tests.Add(new PermissionTest
                {
                    TestName = "Group Exists",
                    Passed = false,
                    ErrorMessage = "Group not found"
                });
                return result;
            }

            // Test basic role permissions
            await TestBasicRolePermissionsAsync(group, result);
            
            // Test custom role permissions
            await TestCustomRolePermissionsAsync(group, result);
            
            // Test group type specific permissions
            if (group.GroupType == "educational")
            {
                await TestEducationalGroupPermissionsAsync(groupId);
            }
            else if (group.GroupType == "family")
            {
                await TestFamilyGroupPermissionsAsync(groupId);
            }

            result.OverallPassed = result.Tests.All(t => t.Passed);
            return result;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error testing permission system for group {GroupId}", groupId);
            result.Tests.Add(new PermissionTest
            {
                TestName = "Permission System Test",
                Passed = false,
                ErrorMessage = ex.Message
            });
            return result;
        }
    }

    public async Task<PermissionTestResult> TestEducationalGroupPermissionsAsync(Guid groupId)
    {
        var result = new PermissionTestResult
        {
            GroupId = groupId,
            TestName = "Educational Group Permission Test",
            Tests = new List<PermissionTest>()
        };

        try
        {
            var group = await _context.Groups
                .Include(g => g.Members)
                .Include(g => g.Roles)
                .FirstOrDefaultAsync(g => g.Id == groupId);

            if (group?.GroupType != "educational")
            {
                result.Tests.Add(new PermissionTest
                {
                    TestName = "Educational Group Type",
                    Passed = false,
                    ErrorMessage = "Group is not an educational group"
                });
                return result;
            }

            // Test teacher permissions
            var teachers = group.Members.Where(m => m.AssignedRoleId.HasValue).ToList();
            foreach (var teacher in teachers)
            {
                var role = await _context.GroupRoles
                    .FirstOrDefaultAsync(r => r.Id == teacher.AssignedRoleId.Value);
                
                if (role?.Name.ToLower().Contains("teacher") == true)
                {
                    var canUsePerpetualPhotos = await _permissionService.CanUserPerformActionAsync(
                        teacher.UserId, groupId, "use_perpetual_photos");
                    
                    result.Tests.Add(new PermissionTest
                    {
                        TestName = $"Teacher {role.Name} - Perpetual Photos",
                        Passed = canUsePerpetualPhotos,
                        ErrorMessage = canUsePerpetualPhotos ? null : "Teacher cannot use perpetual photos"
                    });

                    var canUsePaperScanning = await _permissionService.CanUserPerformActionAsync(
                        teacher.UserId, groupId, "use_paper_scanning");
                    
                    result.Tests.Add(new PermissionTest
                    {
                        TestName = $"Teacher {role.Name} - Paper Scanning",
                        Passed = canUsePaperScanning,
                        ErrorMessage = canUsePaperScanning ? null : "Teacher cannot use paper scanning"
                    });
                }
            }

            // Test parent-kid relationships
            var parents = group.Members.Where(m => m.ParentId.HasValue).ToList();
            var kids = group.Members.Where(m => m.KidId.HasValue).ToList();

            foreach (var parent in parents)
            {
                foreach (var kid in kids)
                {
                    var canActForKid = await _permissionService.CanParentActForKidAsync(
                        parent.UserId, kid.UserId, groupId);
                    
                    result.Tests.Add(new PermissionTest
                    {
                        TestName = $"Parent {parent.UserId} can act for Kid {kid.UserId}",
                        Passed = canActForKid,
                        ErrorMessage = canActForKid ? null : "Parent cannot act for this kid"
                    });
                }
            }

            result.OverallPassed = result.Tests.All(t => t.Passed);
            return result;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error testing educational group permissions for group {GroupId}", groupId);
            result.Tests.Add(new PermissionTest
            {
                TestName = "Educational Group Permission Test",
                Passed = false,
                ErrorMessage = ex.Message
            });
            return result;
        }
    }

    public async Task<PermissionTestResult> TestFamilyGroupPermissionsAsync(Guid groupId)
    {
        var result = new PermissionTestResult
        {
            GroupId = groupId,
            TestName = "Family Group Permission Test",
            Tests = new List<PermissionTest>()
        };

        try
        {
            var group = await _context.Groups
                .Include(g => g.Members)
                .FirstOrDefaultAsync(g => g.Id == groupId);

            if (group?.GroupType != "family")
            {
                result.Tests.Add(new PermissionTest
                {
                    TestName = "Family Group Type",
                    Passed = false,
                    ErrorMessage = "Group is not a family group"
                });
                return result;
            }

            // Test kid permissions
            var kids = group.Members.Where(m => m.KidId.HasValue).ToList();
            foreach (var kid in kids)
            {
                var canPost = await _permissionService.CanUserPerformActionAsync(
                    kid.UserId, groupId, "post_in_topic");
                
                result.Tests.Add(new PermissionTest
                {
                    TestName = $"Kid {kid.UserId} - Can Post",
                    Passed = canPost == kid.CanPost,
                    ErrorMessage = canPost == kid.CanPost ? null : "Kid posting permission mismatch"
                });

                var canVote = await _permissionService.CanUserPerformActionAsync(
                    kid.UserId, groupId, "vote_in_poll");
                
                result.Tests.Add(new PermissionTest
                {
                    TestName = $"Kid {kid.UserId} - Can Vote",
                    Passed = canVote == kid.CanVote,
                    ErrorMessage = canVote == kid.CanVote ? null : "Kid voting permission mismatch"
                });
            }

            result.OverallPassed = result.Tests.All(t => t.Passed);
            return result;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error testing family group permissions for group {GroupId}", groupId);
            result.Tests.Add(new PermissionTest
            {
                TestName = "Family Group Permission Test",
                Passed = false,
                ErrorMessage = ex.Message
            });
            return result;
        }
    }

    public async Task<PermissionTestResult> TestRoleBasedPermissionsAsync(Guid groupId)
    {
        var result = new PermissionTestResult
        {
            GroupId = groupId,
            TestName = "Role-Based Permission Test",
            Tests = new List<PermissionTest>()
        };

        try
        {
            var roles = await _context.GroupRoles
                .Where(r => r.GroupId == groupId)
                .ToListAsync();

            foreach (var role in roles)
            {
                var members = await _context.GroupMembers
                    .Where(m => m.GroupId == groupId && m.AssignedRoleId == role.Id)
                    .ToListAsync();

                foreach (var member in members)
                {
                    // Test role-specific permissions
                    var permissions = await _permissionService.GetUserPermissionsAsync(member.UserId, groupId);
                    
                    result.Tests.Add(new PermissionTest
                    {
                        TestName = $"Role {role.Name} - Member {member.UserId} Permissions",
                        Passed = permissions.Any(),
                        ErrorMessage = permissions.Any() ? null : "No permissions found for role member"
                    });

                    // Test specific role permissions
                    if (role.CanCreateTopics)
                    {
                        var canCreateTopics = await _permissionService.CanUserPerformActionAsync(
                            member.UserId, groupId, "create_topic");
                        
                        result.Tests.Add(new PermissionTest
                        {
                            TestName = $"Role {role.Name} - Can Create Topics",
                            Passed = canCreateTopics,
                            ErrorMessage = canCreateTopics ? null : "Role cannot create topics despite permission"
                        });
                    }

                    if (role.CanManageMembers)
                    {
                        var canManageMembers = await _permissionService.CanUserPerformActionAsync(
                            member.UserId, groupId, "manage_members");
                        
                        result.Tests.Add(new PermissionTest
                        {
                            TestName = $"Role {role.Name} - Can Manage Members",
                            Passed = canManageMembers,
                            ErrorMessage = canManageMembers ? null : "Role cannot manage members despite permission"
                        });
                    }
                }
            }

            result.OverallPassed = result.Tests.All(t => t.Passed);
            return result;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error testing role-based permissions for group {GroupId}", groupId);
            result.Tests.Add(new PermissionTest
            {
                TestName = "Role-Based Permission Test",
                Passed = false,
                ErrorMessage = ex.Message
            });
            return result;
        }
    }

    public async Task<PermissionTestResult> TestParentKidPermissionsAsync(Guid groupId)
    {
        var result = new PermissionTestResult
        {
            GroupId = groupId,
            TestName = "Parent-Kid Permission Test",
            Tests = new List<PermissionTest>()
        };

        try
        {
            var parentKidPairs = await _context.GroupMembers
                .Where(m => m.GroupId == groupId && (m.ParentId.HasValue || m.KidId.HasValue))
                .ToListAsync();

            foreach (var parent in parentKidPairs.Where(p => p.ParentId.HasValue))
            {
                foreach (var kid in parentKidPairs.Where(k => k.KidId.HasValue))
                {
                    var canActForKid = await _permissionService.CanParentActForKidAsync(
                        parent.UserId, kid.UserId, groupId);
                    
                    result.Tests.Add(new PermissionTest
                    {
                        TestName = $"Parent {parent.UserId} - Kid {kid.UserId} Relationship",
                        Passed = canActForKid,
                        ErrorMessage = canActForKid ? null : "Parent cannot act for this kid"
                    });
                }
            }

            result.OverallPassed = result.Tests.All(t => t.Passed);
            return result;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error testing parent-kid permissions for group {GroupId}", groupId);
            result.Tests.Add(new PermissionTest
            {
                TestName = "Parent-Kid Permission Test",
                Passed = false,
                ErrorMessage = ex.Message
            });
            return result;
        }
    }

    private async Task TestBasicRolePermissionsAsync(Group group, PermissionTestResult result)
    {
        var basicRoles = new[] { "owner", "admin", "moderator", "member" };
        
        foreach (var roleName in basicRoles)
        {
            var members = group.Members.Where(m => m.Role == roleName).ToList();
            
            foreach (var member in members)
            {
                var permissions = await _permissionService.GetUserPermissionsAsync(member.UserId, group.Id);
                
                result.Tests.Add(new PermissionTest
                {
                    TestName = $"Basic Role {roleName} - Permissions",
                    Passed = permissions.Any(),
                    ErrorMessage = permissions.Any() ? null : $"No permissions found for {roleName}"
                });
            }
        }
    }

    private async Task TestCustomRolePermissionsAsync(Group group, PermissionTestResult result)
    {
        foreach (var role in group.Roles)
        {
            var members = group.Members.Where(m => m.AssignedRoleId == role.Id).ToList();
            
            foreach (var member in members)
            {
                var permissions = await _permissionService.GetUserPermissionsAsync(member.UserId, group.Id);
                
                result.Tests.Add(new PermissionTest
                {
                    TestName = $"Custom Role {role.Name} - Permissions",
                    Passed = permissions.Any(),
                    ErrorMessage = permissions.Any() ? null : $"No permissions found for custom role {role.Name}"
                });
            }
        }
    }
}

// Test result classes
public class PermissionTestResult
{
    public Guid GroupId { get; set; }
    public string TestName { get; set; } = string.Empty;
    public List<PermissionTest> Tests { get; set; } = new();
    public bool OverallPassed { get; set; }
    public DateTime TestedAt { get; set; } = DateTime.UtcNow;
}

public class PermissionTest
{
    public string TestName { get; set; } = string.Empty;
    public bool Passed { get; set; }
    public string? ErrorMessage { get; set; }
    public DateTime TestedAt { get; set; } = DateTime.UtcNow;
}
