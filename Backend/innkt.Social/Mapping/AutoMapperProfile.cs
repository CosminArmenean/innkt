using AutoMapper;
using innkt.Social.Models;
using innkt.Social.DTOs;

namespace innkt.Social.Mapping;

public class AutoMapperProfile : Profile
{
    public AutoMapperProfile()
    {
        // Post mappings
        CreateMap<Post, PostResponse>()
            .ForMember(dest => dest.Author, opt => opt.Ignore()) // Will be populated separately
            .ForMember(dest => dest.IsLikedByCurrentUser, opt => opt.Ignore()); // Will be populated separately

        CreateMap<CreatePostRequest, Post>();
        CreateMap<UpdatePostRequest, Post>();

        // Comment mappings
        CreateMap<Comment, CommentResponse>()
            .ForMember(dest => dest.Author, opt => opt.Ignore()) // Will be populated separately
            .ForMember(dest => dest.IsLikedByCurrentUser, opt => opt.Ignore()) // Will be populated separately
            .ForMember(dest => dest.Replies, opt => opt.MapFrom(src => src.Replies));

        CreateMap<CreateCommentRequest, Comment>();
        CreateMap<UpdateCommentRequest, Comment>();

        // Follow mappings
        CreateMap<Follow, FollowResponse>()
            .ForMember(dest => dest.Follower, opt => opt.Ignore()) // Will be populated separately
            .ForMember(dest => dest.Following, opt => opt.Ignore()); // Will be populated separately

        // User mappings (placeholder - will be populated from Officer service)
        CreateMap<object, UserBasicInfo>()
            .ForMember(dest => dest.Id, opt => opt.MapFrom(src => GetPropertyValue<Guid>(src, "Id", Guid.Empty)))
            .ForMember(dest => dest.Username, opt => opt.MapFrom(src => GetPropertyValue<string>(src, "Username", "")))
            .ForMember(dest => dest.DisplayName, opt => opt.MapFrom(src => GetPropertyValue<string>(src, "DisplayName", "")))
            .ForMember(dest => dest.AvatarUrl, opt => opt.MapFrom(src => GetPropertyValue<string>(src, "AvatarUrl", null)))
            .ForMember(dest => dest.IsVerified, opt => opt.MapFrom(src => GetPropertyValue<bool>(src, "IsVerified", false)));
    }

    private static T GetPropertyValue<T>(object src, string propertyName, T defaultValue)
    {
        var property = src.GetType().GetProperty(propertyName);
        if (property == null) return defaultValue;
        
        var value = property.GetValue(src);
        if (value == null) return defaultValue;
        
        return (T)value;
    }
}
