using System.ComponentModel.DataAnnotations;

namespace innkt.Common.Models;

public abstract class BaseEntity
{
    [Key]
    public Guid Id { get; set; }
    
    public DateTime CreatedAt { get; set; }
    
    public DateTime? UpdatedAt { get; set; }
    
    public bool IsActive { get; set; } = true;
    
    public bool IsDeleted { get; set; } = false;
}

