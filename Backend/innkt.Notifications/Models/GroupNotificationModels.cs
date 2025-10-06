using System.ComponentModel.DataAnnotations;

namespace innkt.Notifications.Models;

/// <summary>
/// Group invitation notification
/// </summary>
public class GroupInvitationNotification : BaseNotification
{
    public Guid GroupId { get; set; }
    public string GroupName { get; set; } = string.Empty;
    public string GroupCategory { get; set; } = string.Empty;
    public Guid? SubgroupId { get; set; }
    public string? SubgroupName { get; set; }
    public string InvitationMessage { get; set; } = string.Empty;
    public string InvitationStatus { get; set; } = "pending"; // pending, accepted, declined, expired
    public DateTime? ExpiresAt { get; set; }
    public bool IsEducationalGroup { get; set; } = false;
    public bool RequiresParentApproval { get; set; } = false;
    
    public GroupInvitationNotification()
    {
        Type = "group_invitation";
        Priority = "medium";
        Channel = "in_app,email,push";
    }
}

/// <summary>
/// Group notification for general group updates
/// </summary>
public class GroupNotification : BaseNotification
{
    public Guid GroupId { get; set; }
    public string GroupName { get; set; } = string.Empty;
    public string NotificationType { get; set; } = string.Empty; // announcement, update, event, etc.
    public Dictionary<string, object> GroupData { get; set; } = new();
    public bool IsUrgent { get; set; } = false;
    public DateTime? EventDate { get; set; }
    
    public GroupNotification()
    {
        Type = "group_notification";
        Priority = "medium";
        Channel = "in_app,push";
    }
}

/// <summary>
/// Group member role change notification
/// </summary>
public class GroupRoleChangeNotification : BaseNotification
{
    public Guid GroupId { get; set; }
    public string GroupName { get; set; } = string.Empty;
    public string OldRole { get; set; } = string.Empty;
    public string NewRole { get; set; } = string.Empty;
    public string ChangedBy { get; set; } = string.Empty; // Username of who made the change
    public DateTime ChangedAt { get; set; } = DateTime.UtcNow;
    
    public GroupRoleChangeNotification()
    {
        Type = "group_role_change";
        Priority = "high";
        Channel = "in_app,email";
    }
}
