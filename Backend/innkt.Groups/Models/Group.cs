using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace innkt.Groups.Models;

public class Group
{
    [Key]
    public Guid Id { get; set; } = Guid.NewGuid();
    
    [Required]
    [MaxLength(100)]
    public string Name { get; set; } = string.Empty;
    
    [MaxLength(1000)]
    public string? Description { get; set; }
    
    [MaxLength(500)]
    public string? AvatarUrl { get; set; }
    
    [MaxLength(500)]
    public string? CoverImageUrl { get; set; }
    
    [Required]
    public Guid OwnerId { get; set; }
    
    public bool IsPublic { get; set; } = true;
    
    public bool IsVerified { get; set; } = false;
    
    public int MembersCount { get; set; } = 0;
    
    public int PostsCount { get; set; } = 0;
    
    // Enhanced group properties
    [Required]
    [MaxLength(20)]
    public string GroupType { get; set; } = "general"; // "general", "educational", "family"
    
    [MaxLength(50)]
    public string? Category { get; set; } // "school", "class", "family", "community", etc.
    
    [MaxLength(100)]
    public string? InstitutionName { get; set; } // For educational groups
    
    [MaxLength(20)]
    public string? GradeLevel { get; set; } // For educational groups
    
    public bool IsKidFriendly { get; set; } = false; // For family/educational groups
    
    public bool AllowParentParticipation { get; set; } = true; // For educational groups
    
    public bool RequireParentApproval { get; set; } = false; // For kid accounts
    
    public List<string> Tags { get; set; } = new(); // Group tags for categorization and search
    
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    
    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;
    
    // Navigation properties
    public virtual ICollection<GroupMember> Members { get; set; } = new List<GroupMember>();
    public virtual ICollection<GroupPost> GroupPosts { get; set; } = new List<GroupPost>();
    public virtual ICollection<GroupInvitation> Invitations { get; set; } = new List<GroupInvitation>();
    public virtual ICollection<Subgroup> Subgroups { get; set; } = new List<Subgroup>();
    public virtual ICollection<GroupRole> Roles { get; set; } = new List<GroupRole>();
    public virtual ICollection<Topic> Topics { get; set; } = new List<Topic>();
    public virtual GroupSettings? Settings { get; set; }
    public virtual GroupDocumentation? Documentation { get; set; }
}

public class GroupMember
{
    [Key]
    public Guid Id { get; set; } = Guid.NewGuid();
    
    [Required]
    public Guid GroupId { get; set; }
    
    [Required]
    public Guid UserId { get; set; }
    
    public Guid? KidId { get; set; } // If this is a kid account
    
    public Guid? ParentId { get; set; } // If this is a parent managing kid
    
    [Required]
    [MaxLength(20)]
    public string Role { get; set; } = "member"; // "owner", "admin", "moderator", "member"
    
    public Guid? AssignedRoleId { get; set; } // Custom role assignment
    
    public bool IsParentActingForKid { get; set; } = false; // Visual indicator
    
    public bool CanPost { get; set; } = true;
    
    public bool CanVote { get; set; } = true;
    
    public bool CanComment { get; set; } = true;
    
    public bool CanInvite { get; set; } = false;
    
    public DateTime JoinedAt { get; set; } = DateTime.UtcNow;
    
    public DateTime? LastSeenAt { get; set; }
    
    public bool IsActive { get; set; } = true;
    
    // Additional properties for new services
    public Guid? SubgroupId { get; set; } // For subgroup-specific memberships
    public Guid? RoleId { get; set; } // For role assignments
    public bool IsParentAccount { get; set; } = false; // For parent accounts
    public Guid? KidAccountId { get; set; } // For kid accounts
    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;
    
    // Navigation properties
    [ForeignKey("GroupId")]
    public virtual Group Group { get; set; } = null!;
    
    [ForeignKey("AssignedRoleId")]
    public virtual GroupRole? AssignedRole { get; set; }
    
    public virtual ICollection<SubgroupMember> SubgroupMemberships { get; set; } = new List<SubgroupMember>();
}

public class GroupPost
{
    [Key]
    public Guid Id { get; set; } = Guid.NewGuid();
    
    [Required]
    public Guid GroupId { get; set; }
    
    [Required]
    public Guid PostId { get; set; }
    
    [Required]
    public Guid UserId { get; set; } // User who posted in the group
    
    public bool IsAnnouncement { get; set; } = false;
    
    public bool IsPinned { get; set; } = false;
    
    // Role-based posting fields
    public Guid? PostedAsRoleId { get; set; } // Role used for posting
    public string? PostedAsRoleName { get; set; } // Role name (e.g., "Math Teacher")
    public string? PostedAsRoleAlias { get; set; } // Role alias for display
    public bool ShowRealUsername { get; set; } = false; // Show real username under role
    public string? RealUsername { get; set; } // Cached real username
    
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    
    // Navigation properties
    [ForeignKey("GroupId")]
    public virtual Group Group { get; set; } = null!;
    
    [ForeignKey("PostedAsRoleId")]
    public virtual GroupRole? PostedAsRole { get; set; }
}

public class GroupInvitation
{
    [Key]
    public Guid Id { get; set; } = Guid.NewGuid();
    
    [Required]
    public Guid GroupId { get; set; }
    
    [Required]
    public Guid InvitedUserId { get; set; }
    
    [Required]
    public Guid InvitedByUserId { get; set; }
    
    [MaxLength(500)]
    public string? Message { get; set; }
    
    [Required]
    [MaxLength(20)]
    public string Status { get; set; } = "pending"; // pending, accepted, rejected, expired
    
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    
    public DateTime? RespondedAt { get; set; }
    
    public DateTime ExpiresAt { get; set; } = DateTime.UtcNow.AddDays(7);
    
    // Navigation properties
    [ForeignKey("GroupId")]
    public virtual Group Group { get; set; } = null!;
}

// Enhanced Group Settings with educational features
public class GroupSettings
{
    [Key]
    public Guid Id { get; set; } = Guid.NewGuid();
    
    [Required]
    public Guid GroupId { get; set; }
    
    public bool AllowMemberPosts { get; set; } = true;
    
    public bool AllowMemberInvites { get; set; } = true;
    
    public bool RequireApprovalForPosts { get; set; } = false;
    
    public bool RequireApprovalForMembers { get; set; } = false;
    
    public bool AllowAnonymousPosts { get; set; } = false;
    
    public bool AllowFileSharing { get; set; } = true;
    
    public bool AllowReactions { get; set; } = true;
    
    public bool AllowComments { get; set; } = true;
    
    public int MaxMembers { get; set; } = 1000;
    
    public int MaxPostLength { get; set; } = 5000;
    
    // Educational group settings
    public bool AllowKidPosts { get; set; } = false; // For educational groups
    
    public bool AllowKidVoting { get; set; } = false; // For educational groups
    
    public bool RequireParentApprovalForKidPosts { get; set; } = true;
    
    public bool AllowTeacherPosts { get; set; } = true;
    
    public bool AllowParentPosts { get; set; } = true;
    
    public bool EnableGrokAI { get; set; } = true; // Enable @grok AI integration
    
    public bool EnablePerpetualPhotos { get; set; } = false; // For teachers
    
    public bool EnablePaperScanning { get; set; } = false; // For teachers
    
    public bool EnableHomeworkTracking { get; set; } = false; // For teachers
    
    public bool EnableFundManagement { get; set; } = false; // For fund collection
    
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    
    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;
    
    // Navigation properties
    [ForeignKey("GroupId")]
    public virtual Group Group { get; set; } = null!;
}

// Subgroups for educational hierarchy
public class Subgroup
{
    [Key]
    public Guid Id { get; set; } = Guid.NewGuid();
    
    [Required]
    public Guid GroupId { get; set; }
    
    [Required]
    [MaxLength(100)]
    public string Name { get; set; } = string.Empty;
    
    [MaxLength(500)]
    public string? Description { get; set; }
    
    public Guid? ParentSubgroupId { get; set; } // For nested subgroups
    
    public int Level { get; set; } = 1; // Hierarchy level
    
    public int MembersCount { get; set; } = 0;
    
    public bool IsActive { get; set; } = true;
    
    // Additional properties for new services
    public string Settings { get; set; } = "{}"; // JSON string for subgroup settings
    
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    
    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;
    
    // Navigation properties
    [ForeignKey("GroupId")]
    public virtual Group Group { get; set; } = null!;
    
    [ForeignKey("ParentSubgroupId")]
    public virtual Subgroup? ParentSubgroup { get; set; }
    
    public virtual ICollection<Subgroup> ChildSubgroups { get; set; } = new List<Subgroup>();
    public virtual ICollection<SubgroupMember> Members { get; set; } = new List<SubgroupMember>();
    public virtual ICollection<Topic> Topics { get; set; } = new List<Topic>();
}

// Enhanced roles with aliases and permissions
public class GroupRole
{
    [Key]
    public Guid Id { get; set; } = Guid.NewGuid();
    
    [Required]
    public Guid GroupId { get; set; }
    
    [Required]
    [MaxLength(50)]
    public string Name { get; set; } = string.Empty; // "Math Teacher", "Class Monitor", etc.
    
    [MaxLength(100)]
    public string? Alias { get; set; } // Display name for the role
    
    [MaxLength(500)]
    public string? Description { get; set; }
    
    public bool ShowRealUsername { get; set; } = false; // Show real username under alias
    
    public bool CanCreateTopics { get; set; } = false;
    
    public bool CanManageMembers { get; set; } = false;
    
    public bool CanManageRoles { get; set; } = false;
    
    public bool CanManageSubgroups { get; set; } = false;
    
    public bool CanModerateContent { get; set; } = false;
    
    public bool CanAccessAllSubgroups { get; set; } = false;
    
    public bool CanUseGrokAI { get; set; } = true;
    
    public bool CanUsePerpetualPhotos { get; set; } = false;
    
    public bool CanUsePaperScanning { get; set; } = false;
    
    public bool CanManageFunds { get; set; } = false;
    
    // Role-based posting permissions
    public bool CanPostText { get; set; } = true; // Allow text posts
    public bool CanPostImages { get; set; } = true; // Allow image posts
    public bool CanPostPolls { get; set; } = false; // Allow poll creation
    public bool CanPostVideos { get; set; } = false; // Allow video posts
    public bool CanPostAnnouncements { get; set; } = false; // Allow announcement posts
    
    // Additional properties for new services
    public string Permissions { get; set; } = "{}"; // JSON string for complex permissions
    public bool CanSeeRealUsername { get; set; } = false;
    
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    
    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;
    
    // Navigation properties
    [ForeignKey("GroupId")]
    public virtual Group Group { get; set; } = null!;
    
    public virtual ICollection<GroupMember> Members { get; set; } = new List<GroupMember>();
    public virtual ICollection<SubgroupRole> SubgroupRoles { get; set; } = new List<SubgroupRole>();
}

// Subgroup-specific roles
public class SubgroupRole
{
    [Key]
    public Guid Id { get; set; } = Guid.NewGuid();
    
    [Required]
    public Guid SubgroupId { get; set; }
    
    [Required]
    public Guid RoleId { get; set; }
    
    public bool CanWriteInTopics { get; set; } = true;
    
    public bool CanManageSubgroupMembers { get; set; } = false;
    
    public bool CanCreateSubgroupTopics { get; set; } = false;
    
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    
    // Navigation properties
    [ForeignKey("SubgroupId")]
    public virtual Subgroup Subgroup { get; set; } = null!;
    
    [ForeignKey("RoleId")]
    public virtual GroupRole Role { get; set; } = null!;
}

// Topic-based discussions
public class Topic
{
    [Key]
    public Guid Id { get; set; } = Guid.NewGuid();
    
    [Required]
    public Guid GroupId { get; set; }
    
    public Guid? SubgroupId { get; set; } // Optional: topic can be for specific subgroup
    
    [Required]
    [MaxLength(100)]
    public string Name { get; set; } = string.Empty;
    
    [MaxLength(1000)]
    public string? Description { get; set; }
    
    [Required]
    [MaxLength(20)]
    public string Status { get; set; } = "active"; // "active", "paused", "archived"
    
    public bool IsAnnouncementOnly { get; set; } = false; // Only admins/roles can post
    
    public bool AllowMemberPosts { get; set; } = true;
    
    public bool AllowKidPosts { get; set; } = false; // For educational groups
    
    public bool AllowParentPosts { get; set; } = true; // For educational groups
    
    public bool AllowRolePosts { get; set; } = true; // For role-based posting
    
    public int PostsCount { get; set; } = 0;
    
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    
    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;
    
    public DateTime? PausedAt { get; set; }
    
    public DateTime? ArchivedAt { get; set; }
    
    // Navigation properties
    [ForeignKey("GroupId")]
    public virtual Group Group { get; set; } = null!;
    
    [ForeignKey("SubgroupId")]
    public virtual Subgroup? Subgroup { get; set; }
    
    public virtual ICollection<TopicPost> Posts { get; set; } = new List<TopicPost>();
}

// Posts within topics
public class TopicPost
{
    [Key]
    public Guid Id { get; set; } = Guid.NewGuid();
    
    [Required]
    public Guid TopicId { get; set; }
    
    [Required]
    public Guid PostId { get; set; } // Reference to Social service post
    
    [Required]
    public Guid UserId { get; set; } // User who posted
    
    public Guid? KidId { get; set; } // If parent posted on behalf of kid
    
    public bool IsParentPostingForKid { get; set; } = false; // Visual indicator
    
    public bool IsAnnouncement { get; set; } = false;
    
    [MaxLength(2000)]
    public string Content { get; set; } = string.Empty;
    
    public string[]? MediaUrls { get; set; }
    
    public string[]? Hashtags { get; set; }
    
    public string[]? Mentions { get; set; }
    
    [MaxLength(100)]
    public string? Location { get; set; }
    
    public bool IsPinned { get; set; } = false;
    
    // Role-based posting fields
    public Guid? PostedAsRoleId { get; set; } // Role used for posting
    public string? PostedAsRoleName { get; set; } // Role name (e.g., "Math Teacher")
    public string? PostedAsRoleAlias { get; set; } // Role alias for display
    public bool ShowRealUsername { get; set; } = false; // Show real username under role
    public string? RealUsername { get; set; } // Cached real username
    
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    
    // Navigation properties
    [ForeignKey("TopicId")]
    public virtual Topic Topic { get; set; } = null!;
    
    [ForeignKey("PostedAsRoleId")]
    public virtual GroupRole? PostedAsRole { get; set; }
}

// Enhanced group member with parent/kid relationships - already defined above

// Subgroup membership
public class SubgroupMember
{
    [Key]
    public Guid Id { get; set; } = Guid.NewGuid();
    
    [Required]
    public Guid SubgroupId { get; set; }
    
    [Required]
    public Guid GroupMemberId { get; set; }
    
    public Guid? AssignedRoleId { get; set; } // Role within this subgroup
    
    public bool CanWrite { get; set; } = true;
    
    public bool CanManageMembers { get; set; } = false;
    
    public DateTime JoinedAt { get; set; } = DateTime.UtcNow;
    
    public bool IsActive { get; set; } = true;
    
    // Navigation properties
    [ForeignKey("SubgroupId")]
    public virtual Subgroup Subgroup { get; set; } = null!;
    
    [ForeignKey("GroupMemberId")]
    public virtual GroupMember GroupMember { get; set; } = null!;
    
    [ForeignKey("AssignedRoleId")]
    public virtual GroupRole? AssignedRole { get; set; }
}

// Group documentation for @grok AI
public class GroupDocumentation
{
    [Key]
    public Guid Id { get; set; } = Guid.NewGuid();
    
    [Required]
    public Guid GroupId { get; set; }
    
    [Required]
    public string Content { get; set; } = string.Empty; // Text-based documentation
    
    [MaxLength(100)]
    public string Title { get; set; } = string.Empty;
    
    [MaxLength(500)]
    public string? Description { get; set; }
    
    [MaxLength(50)]
    public string Category { get; set; } = "general"; // "rules", "policies", "procedures", "info"
    
    public Guid CreatedBy { get; set; } // User who created/updated
    
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    
    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;
    
    // Navigation properties
    [ForeignKey("GroupId")]
    public virtual Group Group { get; set; } = null!;
}

// Polls with countdown timers
public class GroupPoll
{
    [Key]
    public Guid Id { get; set; } = Guid.NewGuid();
    
    [Required]
    public Guid GroupId { get; set; }
    
    public Guid? TopicId { get; set; }
    
    [Required]
    [MaxLength(200)]
    public string Question { get; set; } = string.Empty;
    
    public string[] Options { get; set; } = Array.Empty<string>();
    
    public bool AllowMultipleVotes { get; set; } = false;
    
    public bool AllowKidVoting { get; set; } = false; // For educational groups
    
    public bool AllowParentVotingForKid { get; set; } = true; // Parent votes on behalf of kid
    
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    
    public DateTime ExpiresAt { get; set; } // Countdown timer
    
    public bool IsActive { get; set; } = true;
    
    public int TotalVotes { get; set; } = 0;
    
    // Navigation properties
    [ForeignKey("GroupId")]
    public virtual Group Group { get; set; } = null!;
    
    [ForeignKey("TopicId")]
    public virtual Topic? Topic { get; set; }
    
    public virtual ICollection<PollVote> Votes { get; set; } = new List<PollVote>();
}

// Poll votes with parent/kid tracking
public class PollVote
{
    [Key]
    public Guid Id { get; set; } = Guid.NewGuid();
    
    [Required]
    public Guid PollId { get; set; }
    
    [Required]
    public Guid UserId { get; set; }
    
    public Guid? KidId { get; set; } // If parent voted on behalf of kid
    
    public bool IsParentVotingForKid { get; set; } = false;
    
    public int SelectedOptionIndex { get; set; }
    
    public DateTime VotedAt { get; set; } = DateTime.UtcNow;
    
    // Navigation properties
    [ForeignKey("PollId")]
    public virtual GroupPoll Poll { get; set; } = null!;
}

public class GroupRule
{
    [Key]
    public Guid Id { get; set; } = Guid.NewGuid();
    
    [Required]
    public Guid GroupId { get; set; }
    
    [Required]
    [MaxLength(100)]
    public string Title { get; set; } = string.Empty;
    
    [Required]
    [MaxLength(500)]
    public string Description { get; set; } = string.Empty;
    
    [MaxLength(1000)]
    public string? Details { get; set; }
    
    public bool IsActive { get; set; } = true;
    public int Order { get; set; } = 0;
    
    [MaxLength(50)]
    public string? Category { get; set; }
    
    [Required]
    public Guid CreatedBy { get; set; }
    
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;
    
    // Navigation properties
    public virtual Group Group { get; set; } = null!;
}

// Group file management
public class GroupFile
{
    [Key]
    public Guid Id { get; set; } = Guid.NewGuid();
    
    [Required]
    public Guid GroupId { get; set; }
    
    public Guid? TopicId { get; set; } // Optional: file can be associated with a specific topic
    
    [Required]
    [MaxLength(255)]
    public string FileName { get; set; } = string.Empty;
    
    [Required]
    [MaxLength(500)]
    public string FilePath { get; set; } = string.Empty;
    
    [Required]
    [MaxLength(100)]
    public string MimeType { get; set; } = string.Empty;
    
    public long FileSize { get; set; } // Size in bytes
    
    [MaxLength(50)]
    public string FileCategory { get; set; } = "general"; // "document", "image", "video", "audio", "archive", "general"
    
    [MaxLength(500)]
    public string? Description { get; set; }
    
    [Required]
    public Guid UploadedBy { get; set; }
    
    public Guid? KidId { get; set; } // If uploaded by parent on behalf of kid
    
    public bool IsParentUploadingForKid { get; set; } = false;
    
    public bool IsPublic { get; set; } = true; // Can be viewed by all group members
    
    public bool IsDownloadable { get; set; } = true; // Can be downloaded by group members
    
    public int DownloadCount { get; set; } = 0;
    
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    
    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;
    
    // Navigation properties
    [ForeignKey("GroupId")]
    public virtual Group Group { get; set; } = null!;
    
    [ForeignKey("TopicId")]
    public virtual Topic? Topic { get; set; }
}

// File access permissions for different roles
public class GroupFilePermission
{
    [Key]
    public Guid Id { get; set; } = Guid.NewGuid();
    
    [Required]
    public Guid FileId { get; set; }
    
    [Required]
    [MaxLength(50)]
    public string Role { get; set; } = string.Empty; // "admin", "moderator", "member", "guest", or custom role name
    
    public bool CanView { get; set; } = true;
    
    public bool CanDownload { get; set; } = true;
    
    public bool CanDelete { get; set; } = false;
    
    public bool CanEdit { get; set; } = false;
    
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    
    // Navigation properties
    [ForeignKey("FileId")]
    public virtual GroupFile File { get; set; } = null!;
}
