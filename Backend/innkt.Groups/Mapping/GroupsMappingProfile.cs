using AutoMapper;
using innkt.Groups.Models;
using innkt.Groups.DTOs;

namespace innkt.Groups.Mapping;

public class GroupsMappingProfile : Profile
{
    public GroupsMappingProfile()
    {
        // Group mappings
        CreateMap<Group, GroupResponse>();
        CreateMap<Group, EnhancedGroupResponse>();
        CreateMap<CreateGroupRequest, Group>();
        CreateMap<UpdateGroupRequest, Group>();

        // GroupMember mappings
        CreateMap<GroupMember, GroupMemberResponse>();
        CreateMap<GroupMember, GroupMember>();

        // Subgroup mappings
        CreateMap<Subgroup, SubgroupResponse>();
        CreateMap<CreateSubgroupRequest, Subgroup>();

        // GroupRole mappings
        CreateMap<GroupRole, GroupRoleResponse>();
        CreateMap<CreateGroupRoleRequest, GroupRole>();
        CreateMap<UpdateGroupRoleRequest, GroupRole>();

        // SubgroupRoleAssignment mappings
        CreateMap<SubgroupRoleAssignment, SubgroupRoleAssignmentResponse>();

        // Topic mappings
        CreateMap<Topic, TopicResponse>();
        CreateMap<CreateTopicRequest, Topic>();
        CreateMap<UpdateTopicRequest, Topic>();

        // TopicPost mappings
        CreateMap<TopicPost, TopicPostResponse>();
        CreateMap<CreateTopicPostRequest, TopicPost>();

        // Poll mappings
        CreateMap<GroupPoll, PollResponse>();
        CreateMap<CreatePollRequest, GroupPoll>();
        CreateMap<UpdatePollRequest, GroupPoll>();
        CreateMap<PollVote, PollVoteResponse>();

        // Documentation mappings
        CreateMap<GroupDocumentation, DocumentationResponse>();
        CreateMap<CreateDocumentationRequest, GroupDocumentation>();
        CreateMap<UpdateDocumentationRequest, GroupDocumentation>();

        // Parent-Kid mappings (commented out until ParentKidRelationship model is defined)
        // CreateMap<ParentKidRelationship, ParentKidRelationshipResponse>();
        // CreateMap<CreateParentKidRelationshipRequest, ParentKidRelationship>();
        // CreateMap<UpdateParentKidRelationshipRequest, ParentKidRelationship>();

        // GroupRule mappings
        CreateMap<GroupRule, GroupRuleResponse>();
        CreateMap<CreateGroupRuleRequest, GroupRule>();
        CreateMap<UpdateGroupRuleRequest, GroupRule>();

        // File Management mappings
        CreateMap<GroupFile, FileResponse>();
        CreateMap<CreateFileRequest, GroupFile>();
        CreateMap<UpdateFileRequest, GroupFile>();
        CreateMap<GroupFilePermission, FilePermissionResponse>();
        CreateMap<FilePermissionRequest, GroupFilePermission>();
    }
}
