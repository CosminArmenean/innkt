using innkt.Common.Models;

namespace innkt.Domain.Models.User;

public class UserRole : BaseEntity
{
    public Guid UserId { get; set; }
    
    public Guid RoleId { get; set; }
    
    public DateTime AssignedAt { get; set; }
    
    public Guid? AssignedBy { get; set; }
    
    // Navigation properties
    public virtual User User { get; set; } = null!;
    
    public virtual Role Role { get; set; } = null!;
    
    public virtual User? AssignedByUser { get; set; }
}

