using System.ComponentModel.DataAnnotations;
using innkt.Common.Models;

namespace innkt.Domain.Models.User;

public class Permission : BaseEntity
{
    [Required]
    [MaxLength(100)]
    public string Name { get; set; } = string.Empty;
    
    [MaxLength(255)]
    public string? Description { get; set; }
    
    [MaxLength(100)]
    public string Resource { get; set; } = string.Empty;
    
    [MaxLength(50)]
    public string Action { get; set; } = string.Empty;
    
    // Navigation properties
    public virtual ICollection<RolePermission> RolePermissions { get; set; } = new List<RolePermission>();
}





