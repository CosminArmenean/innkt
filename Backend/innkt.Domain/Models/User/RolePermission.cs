using innkt.Common.Models;

namespace innkt.Domain.Models.User;

public class RolePermission : BaseEntity
{
    public Guid RoleId { get; set; }
    
    public Guid PermissionId { get; set; }
    
    public DateTime AssignedAt { get; set; }
    
    public Guid? AssignedBy { get; set; }
    
    // Navigation properties
    public virtual Role Role { get; set; } = null!;
    
    public virtual Permission Permission { get; set; } = null!;
    
    public virtual User? AssignedByUser { get; set; }
}





