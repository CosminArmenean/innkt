using System.ComponentModel.DataAnnotations;
using innkt.Common.Models;

namespace innkt.Domain.Models.User;

public class Role : BaseEntity
{
    [Required]
    [MaxLength(50)]
    public string Name { get; set; } = string.Empty;
    
    [MaxLength(255)]
    public string? Description { get; set; }
    
    [MaxLength(50)]
    public string NormalizedName { get; set; } = string.Empty;
    
    // Navigation properties
    public virtual ICollection<UserRole> UserRoles { get; set; } = new List<UserRole>();
    
    public virtual ICollection<RolePermission> RolePermissions { get; set; } = new List<RolePermission>();
}

