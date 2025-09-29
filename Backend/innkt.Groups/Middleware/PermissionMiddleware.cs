using System.Security.Claims;
using innkt.Groups.Services;
using Microsoft.AspNetCore.Mvc.Filters;
using Microsoft.AspNetCore.Mvc;

namespace innkt.Groups.Middleware;

public class PermissionMiddleware
{
    private readonly RequestDelegate _next;
    private readonly ILogger<PermissionMiddleware> _logger;

    public PermissionMiddleware(RequestDelegate next, ILogger<PermissionMiddleware> logger)
    {
        _next = next;
        _logger = logger;
    }

    public async Task InvokeAsync(HttpContext context, IPermissionService permissionService)
    {
        // Skip permission checking for certain paths
        if (ShouldSkipPermissionCheck(context.Request.Path))
        {
            await _next(context);
            return;
        }

        try
        {
            // Extract user ID from JWT token
            var userIdClaim = context.User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            if (string.IsNullOrEmpty(userIdClaim) || !Guid.TryParse(userIdClaim, out var userId))
            {
                context.Response.StatusCode = 401;
                await context.Response.WriteAsync("Unauthorized: Invalid user ID");
                return;
            }

            // Extract group ID from route or query parameters
            var groupId = ExtractGroupId(context);
            if (groupId == null)
            {
                await _next(context);
                return;
            }

            // Determine the action being performed
            var action = DetermineAction(context.Request.Method, context.Request.Path);
            if (string.IsNullOrEmpty(action))
            {
                await _next(context);
                return;
            }

            // Check permission
            var hasPermission = await permissionService.CanUserPerformActionAsync(userId, groupId.Value, action);
            if (!hasPermission)
            {
                context.Response.StatusCode = 403;
                await context.Response.WriteAsync($"Forbidden: User does not have permission to {action}");
                return;
            }

            // Add permission info to context for use in controllers
            context.Items["UserId"] = userId;
            context.Items["GroupId"] = groupId;
            context.Items["Action"] = action;

            await _next(context);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error in permission middleware");
            context.Response.StatusCode = 500;
            await context.Response.WriteAsync("Internal server error");
        }
    }

    private bool ShouldSkipPermissionCheck(PathString path)
    {
        var skipPaths = new[]
        {
            "/health",
            "/swagger",
            "/api/permission/check",
            "/api/permission/matrix",
            "/api/groups/public",
            "/api/groups/search",
            "/api/groups/trending",
            "/api/groups/recommended"
        };

        return skipPaths.Any(skipPath => path.StartsWithSegments(skipPath));
    }

    private Guid? ExtractGroupId(HttpContext context)
    {
        // Try to extract from route parameters
        if (context.Request.RouteValues.TryGetValue("groupId", out var groupIdValue) && 
            Guid.TryParse(groupIdValue?.ToString(), out var groupId))
        {
            return groupId;
        }

        // Try to extract from query parameters
        if (context.Request.Query.TryGetValue("groupId", out var queryGroupId) && 
            Guid.TryParse(queryGroupId, out var queryId))
        {
            return queryId;
        }

        // Try to extract from request body for POST/PUT requests
        if (context.Request.Method == "POST" || context.Request.Method == "PUT")
        {
            // This would require reading the request body, which is complex in middleware
            // For now, we'll rely on route and query parameters
        }

        return null;
    }

    private string DetermineAction(string method, PathString path)
    {
        var pathSegments = path.Value.Split('/', StringSplitOptions.RemoveEmptyEntries);
        
        // Map HTTP methods and paths to actions
        return method switch
        {
            "GET" when pathSegments.Length >= 2 => "read",
            "POST" when pathSegments.Contains("join") => "join_group",
            "POST" when pathSegments.Contains("leave") => "leave_group",
            "POST" when pathSegments.Contains("invite") => "invite_member",
            "POST" when pathSegments.Contains("create") => "create",
            "PUT" when pathSegments.Length >= 2 => "update",
            "DELETE" when pathSegments.Length >= 2 => "delete",
            "POST" when pathSegments.Contains("vote") => "vote_in_poll",
            "POST" when pathSegments.Contains("post") => "post_in_topic",
            "POST" when pathSegments.Contains("assign") => "assign_role",
            "POST" when pathSegments.Contains("pin") => "pin_post",
            "POST" when pathSegments.Contains("unpin") => "unpin_post",
            _ => string.Empty
        };
    }
}

// Permission attributes for more granular control
[AttributeUsage(AttributeTargets.Method | AttributeTargets.Class)]
public class RequirePermissionAttribute : Attribute
{
    public string Action { get; }
    public string? GroupIdParameter { get; }
    public string? TargetUserIdParameter { get; }

    public RequirePermissionAttribute(string action, string? groupIdParameter = null, string? targetUserIdParameter = null)
    {
        Action = action;
        GroupIdParameter = groupIdParameter;
        TargetUserIdParameter = targetUserIdParameter;
    }
}

[AttributeUsage(AttributeTargets.Method | AttributeTargets.Class)]
public class RequireRoleAttribute : Attribute
{
    public string Role { get; }
    public string? GroupIdParameter { get; }

    public RequireRoleAttribute(string role, string? groupIdParameter = null)
    {
        Role = role;
        GroupIdParameter = groupIdParameter;
    }
}

[AttributeUsage(AttributeTargets.Method | AttributeTargets.Class)]
public class RequireCustomRoleAttribute : Attribute
{
    public Guid RoleId { get; }
    public string? GroupIdParameter { get; }

    public RequireCustomRoleAttribute(Guid roleId, string? groupIdParameter = null)
    {
        RoleId = roleId;
        GroupIdParameter = groupIdParameter;
    }
}

// Educational group specific attributes
[AttributeUsage(AttributeTargets.Method | AttributeTargets.Class)]
public class RequireTeacherRoleAttribute : Attribute
{
    public string? GroupIdParameter { get; }

    public RequireTeacherRoleAttribute(string? groupIdParameter = null)
    {
        GroupIdParameter = groupIdParameter;
    }
}

[AttributeUsage(AttributeTargets.Method | AttributeTargets.Class)]
public class RequireParentKidRelationshipAttribute : Attribute
{
    public string? GroupIdParameter { get; }
    public string? KidIdParameter { get; }

    public RequireParentKidRelationshipAttribute(string? groupIdParameter = null, string? kidIdParameter = null)
    {
        GroupIdParameter = groupIdParameter;
        KidIdParameter = kidIdParameter;
    }
}

// Permission filter for attribute-based permission checking
public class PermissionFilter : IAsyncActionFilter
{
    private readonly IPermissionService _permissionService;
    private readonly ILogger<PermissionFilter> _logger;

    public PermissionFilter(IPermissionService permissionService, ILogger<PermissionFilter> logger)
    {
        _permissionService = permissionService;
        _logger = logger;
    }

    public async Task OnActionExecutionAsync(ActionExecutingContext context, ActionExecutionDelegate next)
    {
        var userIdClaim = context.HttpContext.User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
        if (string.IsNullOrEmpty(userIdClaim) || !Guid.TryParse(userIdClaim, out var userId))
        {
            context.Result = new UnauthorizedObjectResult("Invalid user ID");
            return;
        }

        // Check for permission attributes
        var permissionAttributes = context.ActionDescriptor.EndpointMetadata
            .OfType<RequirePermissionAttribute>()
            .ToList();

        foreach (var attribute in permissionAttributes)
        {
            var groupId = ExtractParameterValue<Guid>(context, attribute.GroupIdParameter);
            var targetUserId = ExtractParameterValue<Guid?>(context, attribute.TargetUserIdParameter);

            if (groupId == null)
            {
                context.Result = new BadRequestObjectResult("Group ID is required");
                return;
            }

            var hasPermission = await _permissionService.CanUserPerformActionAsync(userId, groupId, attribute.Action, targetUserId);
            if (!hasPermission)
            {
                context.Result = new ForbidResult($"User does not have permission to {attribute.Action}");
                return;
            }
        }

        // Check for role attributes
        var roleAttributes = context.ActionDescriptor.EndpointMetadata
            .OfType<RequireRoleAttribute>()
            .ToList();

        foreach (var attribute in roleAttributes)
        {
            var groupId = ExtractParameterValue<Guid>(context, attribute.GroupIdParameter);
            if (groupId == null)
            {
                context.Result = new BadRequestObjectResult("Group ID is required");
                return;
            }

            var isInRole = await _permissionService.IsUserInRoleAsync(userId, groupId, attribute.Role);
            if (!isInRole)
            {
                context.Result = new ForbidResult($"User is not in role: {attribute.Role}");
                return;
            }
        }

        // Check for custom role attributes
        var customRoleAttributes = context.ActionDescriptor.EndpointMetadata
            .OfType<RequireCustomRoleAttribute>()
            .ToList();

        foreach (var attribute in customRoleAttributes)
        {
            var groupId = ExtractParameterValue<Guid>(context, attribute.GroupIdParameter);
            if (groupId == null)
            {
                context.Result = new BadRequestObjectResult("Group ID is required");
                return;
            }

            var isInCustomRole = await _permissionService.IsUserInCustomRoleAsync(userId, groupId, attribute.RoleId);
            if (!isInCustomRole)
            {
                context.Result = new ForbidResult($"User is not in custom role: {attribute.RoleId}");
                return;
            }
        }

        // Check for teacher role attributes
        var teacherAttributes = context.ActionDescriptor.EndpointMetadata
            .OfType<RequireTeacherRoleAttribute>()
            .ToList();

        foreach (var attribute in teacherAttributes)
        {
            var groupId = ExtractParameterValue<Guid>(context, attribute.GroupIdParameter);
            if (groupId == null)
            {
                context.Result = new BadRequestObjectResult("Group ID is required");
                return;
            }

            var canPerform = await _permissionService.CanTeacherPerformActionAsync(userId, groupId, "teacher_action");
            if (!canPerform)
            {
                context.Result = new ForbidResult("User is not a teacher or does not have teacher permissions");
                return;
            }
        }

        // Check for parent-kid relationship attributes
        var parentKidAttributes = context.ActionDescriptor.EndpointMetadata
            .OfType<RequireParentKidRelationshipAttribute>()
            .ToList();

        foreach (var attribute in parentKidAttributes)
        {
            var groupId = ExtractParameterValue<Guid>(context, attribute.GroupIdParameter);
            var kidId = ExtractParameterValue<Guid>(context, attribute.KidIdParameter);

            if (groupId == null || kidId == null)
            {
                context.Result = new BadRequestObjectResult("Group ID and Kid ID are required");
                return;
            }

            var canAct = await _permissionService.CanParentActForKidAsync(userId, kidId, groupId);
            if (!canAct)
            {
                context.Result = new ForbidResult("User is not authorized to act on behalf of this kid");
                return;
            }
        }

        await next();
    }

    private T? ExtractParameterValue<T>(ActionExecutingContext context, string? parameterName)
    {
        if (string.IsNullOrEmpty(parameterName))
            return default;

        if (context.ActionArguments.TryGetValue(parameterName, out var value))
        {
            if (value is T typedValue)
                return typedValue;
        }

        return default;
    }
}
