using innkt.Groups.Models;
using innkt.Groups.Data;
using innkt.Groups.DTOs;
using Microsoft.EntityFrameworkCore;

namespace innkt.Groups.Services;

public interface IParentKidTestService
{
    Task<ParentKidTestResult> TestParentKidSystemAsync(Guid groupId);
    Task<ParentKidTestResult> TestParentKidRelationshipsAsync(Guid groupId);
    Task<ParentKidTestResult> TestParentActingForKidAsync(Guid groupId);
    Task<ParentKidTestResult> TestEducationalGroupFeaturesAsync(Guid groupId);
    Task<ParentKidTestResult> TestVisualIndicatorsAsync(Guid groupId);
    Task<ParentKidTestResult> TestPermissionMatrixAsync(Guid groupId);
}

public class ParentKidTestService : IParentKidTestService
{
    private readonly GroupsDbContext _context;
    private readonly IParentKidService _parentKidService;
    private readonly IPermissionService _permissionService;
    private readonly ILogger<ParentKidTestService> _logger;

    public ParentKidTestService(
        GroupsDbContext context,
        IParentKidService parentKidService,
        IPermissionService permissionService,
        ILogger<ParentKidTestService> logger)
    {
        _context = context;
        _parentKidService = parentKidService;
        _permissionService = permissionService;
        _logger = logger;
    }

    public async Task<ParentKidTestResult> TestParentKidSystemAsync(Guid groupId)
    {
        var result = new ParentKidTestResult
        {
            GroupId = groupId,
            TestName = "Parent-Kid System Test",
            Tests = new List<ParentKidTest>()
        };

        try
        {
            var group = await _context.Groups
                .Include(g => g.Members)
                .Include(g => g.Settings)
                .FirstOrDefaultAsync(g => g.Id == groupId);

            if (group == null)
            {
                result.Tests.Add(new ParentKidTest
                {
                    TestName = "Group Exists",
                    Passed = false,
                    ErrorMessage = "Group not found"
                });
                return result;
            }

            // Test parent-kid relationships
            await TestParentKidRelationshipsAsync(group, result);
            
            // Test parent acting for kid
            await TestParentActingForKidAsync(group, result);
            
            // Test educational group features
            if (group.GroupType == "educational")
            {
                await TestEducationalGroupFeaturesAsync(group, result);
            }
            
            // Test visual indicators
            await TestVisualIndicatorsAsync(group, result);
            
            // Test permission matrix
            await TestPermissionMatrixAsync(group, result);

            result.OverallPassed = result.Tests.All(t => t.Passed);
            return result;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error testing parent-kid system for group {GroupId}", groupId);
            result.Tests.Add(new ParentKidTest
            {
                TestName = "Parent-Kid System Test",
                Passed = false,
                ErrorMessage = ex.Message
            });
            return result;
        }
    }

    public async Task<ParentKidTestResult> TestParentKidRelationshipsAsync(Guid groupId)
    {
        var result = new ParentKidTestResult
        {
            GroupId = groupId,
            TestName = "Parent-Kid Relationships Test",
            Tests = new List<ParentKidTest>()
        };

        try
        {
            var group = await _context.Groups
                .Include(g => g.Members)
                .FirstOrDefaultAsync(g => g.Id == groupId);

            if (group?.GroupType != "educational" && group?.GroupType != "family")
            {
                result.Tests.Add(new ParentKidTest
                {
                    TestName = "Group Type Support",
                    Passed = false,
                    ErrorMessage = "Group type does not support parent-kid relationships"
                });
                return result;
            }

            // Test parent-kid relationships in the group
            var parentKidPairs = group.Members
                .Where(m => m.ParentId.HasValue)
                .ToList();

            foreach (var parent in parentKidPairs)
            {
                var kid = group.Members
                    .FirstOrDefault(m => m.UserId == parent.ParentId.Value && m.ParentId == parent.UserId);

                if (kid != null)
                {
                    // Test relationship creation
                    var relationship = await _parentKidService.GetParentKidRelationshipAsync(parent.UserId, parent.ParentId.Value);
                    
                    result.Tests.Add(new ParentKidTest
                    {
                        TestName = $"Parent-Kid Relationship: {parent.UserId} - {parent.ParentId.Value}",
                        Passed = relationship != null,
                        ErrorMessage = relationship == null ? "Relationship not found" : null
                    });

                    // Test permission delegation
                    var canParentAct = await _parentKidService.CanParentActForKidAsync(parent.UserId, parent.ParentId.Value, groupId);
                    
                    result.Tests.Add(new ParentKidTest
                    {
                        TestName = $"Parent Can Act For Kid: {parent.UserId} - {parent.ParentId.Value}",
                        Passed = canParentAct,
                        ErrorMessage = canParentAct ? null : "Parent cannot act for kid"
                    });
                }
            }

            result.OverallPassed = result.Tests.All(t => t.Passed);
            return result;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error testing parent-kid relationships for group {GroupId}", groupId);
            result.Tests.Add(new ParentKidTest
            {
                TestName = "Parent-Kid Relationships Test",
                Passed = false,
                ErrorMessage = ex.Message
            });
            return result;
        }
    }

    public async Task<ParentKidTestResult> TestParentActingForKidAsync(Guid groupId)
    {
        var result = new ParentKidTestResult
        {
            GroupId = groupId,
            TestName = "Parent Acting For Kid Test",
            Tests = new List<ParentKidTest>()
        };

        try
        {
            var group = await _context.Groups
                .Include(g => g.Members)
                .FirstOrDefaultAsync(g => g.Id == groupId);

            if (group == null)
            {
                result.Tests.Add(new ParentKidTest
                {
                    TestName = "Group Exists",
                    Passed = false,
                    ErrorMessage = "Group not found"
                });
                return result;
            }

            var parentKidPairs = group.Members
                .Where(m => m.ParentId.HasValue)
                .ToList();

            foreach (var parent in parentKidPairs)
            {
                var kid = group.Members
                    .FirstOrDefault(m => m.UserId == parent.ParentId.Value && m.ParentId == parent.UserId);

                if (kid != null)
                {
                    // Test parent acting for kid
                    var actingResponse = await _parentKidService.ParentActingForKidAsync(
                        parent.UserId, 
                        parent.ParentId.Value, 
                        groupId, 
                        "test_action", 
                        new { test = "data" });

                    result.Tests.Add(new ParentKidTest
                    {
                        TestName = $"Parent Acting For Kid: {parent.UserId} - {parent.ParentId.Value}",
                        Passed = actingResponse.Success,
                        ErrorMessage = actingResponse.Success ? null : "Parent acting for kid failed"
                    });

                    // Test kid permissions
                    var canKidPost = await _parentKidService.CanKidPerformActionAsync(parent.ParentId.Value, groupId, "post");
                    var canKidVote = await _parentKidService.CanKidPerformActionAsync(parent.ParentId.Value, groupId, "vote");
                    var canKidComment = await _parentKidService.CanKidPerformActionAsync(parent.ParentId.Value, groupId, "comment");

                    result.Tests.Add(new ParentKidTest
                    {
                        TestName = $"Kid Permissions: {parent.ParentId.Value}",
                        Passed = canKidPost == kid.CanPost && canKidVote == kid.CanVote && canKidComment == kid.CanComment,
                        ErrorMessage = "Kid permissions mismatch"
                    });

                    // Test parent override permissions
                    var canParentOverridePost = await _parentKidService.CanParentOverrideKidActionAsync(
                        parent.UserId, parent.ParentId.Value, groupId, "post");
                    var canParentOverrideVote = await _parentKidService.CanParentOverrideKidActionAsync(
                        parent.UserId, parent.ParentId.Value, groupId, "vote");
                    var canParentOverrideComment = await _parentKidService.CanParentOverrideKidActionAsync(
                        parent.UserId, parent.ParentId.Value, groupId, "comment");

                    result.Tests.Add(new ParentKidTest
                    {
                        TestName = $"Parent Override Permissions: {parent.UserId} - {parent.ParentId.Value}",
                        Passed = canParentOverridePost == (parent.CanPost && !kid.CanPost) &&
                                 canParentOverrideVote == (parent.CanVote && !kid.CanVote) &&
                                 canParentOverrideComment == (parent.CanComment && !kid.CanComment),
                        ErrorMessage = "Parent override permissions mismatch"
                    });
                }
            }

            result.OverallPassed = result.Tests.All(t => t.Passed);
            return result;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error testing parent acting for kid for group {GroupId}", groupId);
            result.Tests.Add(new ParentKidTest
            {
                TestName = "Parent Acting For Kid Test",
                Passed = false,
                ErrorMessage = ex.Message
            });
            return result;
        }
    }

    public async Task<ParentKidTestResult> TestEducationalGroupFeaturesAsync(Guid groupId)
    {
        var result = new ParentKidTestResult
        {
            GroupId = groupId,
            TestName = "Educational Group Features Test",
            Tests = new List<ParentKidTest>()
        };

        try
        {
            var group = await _context.Groups
                .Include(g => g.Settings)
                .FirstOrDefaultAsync(g => g.Id == groupId);

            if (group?.GroupType != "educational")
            {
                result.Tests.Add(new ParentKidTest
                {
                    TestName = "Educational Group Type",
                    Passed = false,
                    ErrorMessage = "Group is not an educational group"
                });
                return result;
            }

            // Test educational group settings
            var settings = await _parentKidService.GetEducationalGroupSettingsAsync(groupId);
            
            result.Tests.Add(new ParentKidTest
            {
                TestName = "Educational Group Settings",
                Passed = settings != null,
                ErrorMessage = settings == null ? "Educational group settings not found" : null
            });

            // Test kid permissions in educational groups
            var kids = group.Members.Where(m => m.KidId.HasValue).ToList();
            foreach (var kid in kids)
            {
                var canKidPost = await _parentKidService.CanKidPerformActionAsync(kid.UserId, groupId, "post");
                var canKidVote = await _parentKidService.CanKidPerformActionAsync(kid.UserId, groupId, "vote");
                var canKidComment = await _parentKidService.CanKidPerformActionAsync(kid.UserId, groupId, "comment");

                result.Tests.Add(new ParentKidTest
                {
                    TestName = $"Educational Kid Permissions: {kid.UserId}",
                    Passed = canKidPost == kid.CanPost && canKidVote == kid.CanVote && canKidComment == kid.CanComment,
                    ErrorMessage = "Educational kid permissions mismatch"
                });
            }

            result.OverallPassed = result.Tests.All(t => t.Passed);
            return result;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error testing educational group features for group {GroupId}", groupId);
            result.Tests.Add(new ParentKidTest
            {
                TestName = "Educational Group Features Test",
                Passed = false,
                ErrorMessage = ex.Message
            });
            return result;
        }
    }

    public async Task<ParentKidTestResult> TestVisualIndicatorsAsync(Guid groupId)
    {
        var result = new ParentKidTestResult
        {
            GroupId = groupId,
            TestName = "Visual Indicators Test",
            Tests = new List<ParentKidTest>()
        };

        try
        {
            var group = await _context.Groups
                .Include(g => g.Members)
                .FirstOrDefaultAsync(g => g.Id == groupId);

            if (group == null)
            {
                result.Tests.Add(new ParentKidTest
                {
                    TestName = "Group Exists",
                    Passed = false,
                    ErrorMessage = "Group not found"
                });
                return result;
            }

            // Test visual indicators for parent-kid relationships
            var parentKidPairs = group.Members
                .Where(m => m.ParentId.HasValue)
                .ToList();

            foreach (var parent in parentKidPairs)
            {
                var kid = group.Members
                    .FirstOrDefault(m => m.UserId == parent.ParentId.Value && m.ParentId == parent.UserId);

                if (kid != null)
                {
                    var visual = await _parentKidService.GetParentKidVisualInfoAsync(parent.UserId, parent.ParentId.Value, groupId);
                    
                    result.Tests.Add(new ParentKidTest
                    {
                        TestName = $"Visual Indicator: {parent.UserId} - {parent.ParentId.Value}",
                        Passed = visual != null && !string.IsNullOrEmpty(visual.VisualIndicator),
                        ErrorMessage = visual == null ? "Visual indicator not found" : "Visual indicator is empty"
                    });
                }
            }

            // Test group visual indicators
            var groupVisuals = await _parentKidService.GetGroupParentKidVisualsAsync(groupId);
            
            result.Tests.Add(new ParentKidTest
            {
                TestName = "Group Visual Indicators",
                Passed = groupVisuals.Any(),
                ErrorMessage = groupVisuals.Any() ? null : "No group visual indicators found"
            });

            result.OverallPassed = result.Tests.All(t => t.Passed);
            return result;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error testing visual indicators for group {GroupId}", groupId);
            result.Tests.Add(new ParentKidTest
            {
                TestName = "Visual Indicators Test",
                Passed = false,
                ErrorMessage = ex.Message
            });
            return result;
        }
    }

    public async Task<ParentKidTestResult> TestPermissionMatrixAsync(Guid groupId)
    {
        var result = new ParentKidTestResult
        {
            GroupId = groupId,
            TestName = "Permission Matrix Test",
            Tests = new List<ParentKidTest>()
        };

        try
        {
            var group = await _context.Groups
                .Include(g => g.Members)
                .FirstOrDefaultAsync(g => g.Id == groupId);

            if (group == null)
            {
                result.Tests.Add(new ParentKidTest
                {
                    TestName = "Group Exists",
                    Passed = false,
                    ErrorMessage = "Group not found"
                });
                return result;
            }

            var parentKidPairs = group.Members
                .Where(m => m.ParentId.HasValue)
                .ToList();

            foreach (var parent in parentKidPairs)
            {
                var kid = group.Members
                    .FirstOrDefault(m => m.UserId == parent.ParentId.Value && m.ParentId == parent.UserId);

                if (kid != null)
                {
                    var matrix = await _parentKidService.GetParentKidPermissionMatrixAsync(parent.UserId, parent.ParentId.Value, groupId);
                    
                    result.Tests.Add(new ParentKidTest
                    {
                        TestName = $"Permission Matrix: {parent.UserId} - {parent.ParentId.Value}",
                        Passed = matrix != null && matrix.OverrideRules.Any(),
                        ErrorMessage = matrix == null ? "Permission matrix not found" : "Override rules are empty"
                    });

                    // Test permission matrix consistency
                    var isConsistent = matrix.CanParentPost == parent.CanPost &&
                                     matrix.CanParentVote == parent.CanVote &&
                                     matrix.CanParentComment == parent.CanComment &&
                                     matrix.CanKidPost == kid.CanPost &&
                                     matrix.CanKidVote == kid.CanVote &&
                                     matrix.CanKidComment == kid.CanComment;

                    result.Tests.Add(new ParentKidTest
                    {
                        TestName = $"Permission Matrix Consistency: {parent.UserId} - {parent.ParentId.Value}",
                        Passed = isConsistent,
                        ErrorMessage = isConsistent ? null : "Permission matrix is inconsistent with actual permissions"
                    });
                }
            }

            result.OverallPassed = result.Tests.All(t => t.Passed);
            return result;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error testing permission matrix for group {GroupId}", groupId);
            result.Tests.Add(new ParentKidTest
            {
                TestName = "Permission Matrix Test",
                Passed = false,
                ErrorMessage = ex.Message
            });
            return result;
        }
    }

    private async Task TestParentKidRelationshipsAsync(Group group, ParentKidTestResult result)
    {
        var parentKidPairs = group.Members
            .Where(m => m.ParentId.HasValue)
            .ToList();

        foreach (var parent in parentKidPairs)
        {
            var kid = group.Members
                .FirstOrDefault(m => m.UserId == parent.ParentId.Value && m.ParentId == parent.UserId);

            if (kid != null)
            {
                var relationship = await _parentKidService.GetParentKidRelationshipAsync(parent.UserId, parent.ParentId.Value);
                
                result.Tests.Add(new ParentKidTest
                {
                    TestName = $"Parent-Kid Relationship: {parent.UserId} - {parent.ParentId.Value}",
                    Passed = relationship != null,
                    ErrorMessage = relationship == null ? "Relationship not found" : null
                });
            }
        }
    }

    private async Task TestParentActingForKidAsync(Group group, ParentKidTestResult result)
    {
        var parentKidPairs = group.Members
            .Where(m => m.ParentId.HasValue)
            .ToList();

        foreach (var parent in parentKidPairs)
        {
            var kid = group.Members
                .FirstOrDefault(m => m.UserId == parent.ParentId.Value && m.ParentId == parent.UserId);

            if (kid != null)
            {
                var canParentAct = await _parentKidService.CanParentActForKidAsync(parent.UserId, parent.ParentId.Value, group.Id);
                
                result.Tests.Add(new ParentKidTest
                {
                    TestName = $"Parent Can Act For Kid: {parent.UserId} - {parent.ParentId.Value}",
                    Passed = canParentAct,
                    ErrorMessage = canParentAct ? null : "Parent cannot act for kid"
                });
            }
        }
    }

    private async Task TestEducationalGroupFeaturesAsync(Group group, ParentKidTestResult result)
    {
        if (group.GroupType == "educational")
        {
            var settings = await _parentKidService.GetEducationalGroupSettingsAsync(group.Id);
            
            result.Tests.Add(new ParentKidTest
            {
                TestName = "Educational Group Settings",
                Passed = settings != null,
                ErrorMessage = settings == null ? "Educational group settings not found" : null
            });
        }
    }

    private async Task TestVisualIndicatorsAsync(Group group, ParentKidTestResult result)
    {
        var parentKidPairs = group.Members
            .Where(m => m.ParentId.HasValue)
            .ToList();

        foreach (var parent in parentKidPairs)
        {
            var kid = group.Members
                .FirstOrDefault(m => m.UserId == parent.ParentId.Value && m.ParentId == parent.UserId);

            if (kid != null)
            {
                var visual = await _parentKidService.GetParentKidVisualInfoAsync(parent.UserId, parent.ParentId.Value, group.Id);
                
                result.Tests.Add(new ParentKidTest
                {
                    TestName = $"Visual Indicator: {parent.UserId} - {parent.ParentId.Value}",
                    Passed = visual != null && !string.IsNullOrEmpty(visual.VisualIndicator),
                    ErrorMessage = visual == null ? "Visual indicator not found" : "Visual indicator is empty"
                });
            }
        }
    }

    private async Task TestPermissionMatrixAsync(Group group, ParentKidTestResult result)
    {
        var parentKidPairs = group.Members
            .Where(m => m.ParentId.HasValue)
            .ToList();

        foreach (var parent in parentKidPairs)
        {
            var kid = group.Members
                .FirstOrDefault(m => m.UserId == parent.ParentId.Value && m.ParentId == parent.UserId);

            if (kid != null)
            {
                var matrix = await _parentKidService.GetParentKidPermissionMatrixAsync(parent.UserId, parent.ParentId.Value, group.Id);
                
                result.Tests.Add(new ParentKidTest
                {
                    TestName = $"Permission Matrix: {parent.UserId} - {parent.ParentId.Value}",
                    Passed = matrix != null && matrix.OverrideRules.Any(),
                    ErrorMessage = matrix == null ? "Permission matrix not found" : "Override rules are empty"
                });
            }
        }
    }
}

// Test result classes
public class ParentKidTestResult
{
    public Guid GroupId { get; set; }
    public string TestName { get; set; } = string.Empty;
    public List<ParentKidTest> Tests { get; set; } = new();
    public bool OverallPassed { get; set; }
    public DateTime TestedAt { get; set; } = DateTime.UtcNow;
}

public class ParentKidTest
{
    public string TestName { get; set; } = string.Empty;
    public bool Passed { get; set; }
    public string? ErrorMessage { get; set; }
    public DateTime TestedAt { get; set; } = DateTime.UtcNow;
}
