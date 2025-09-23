using innkt.Common.Models.Events;

namespace innkt.Common.Services;

/// <summary>
/// Event publisher interface for publishing events to Kafka
/// </summary>
public interface IEventPublisher : IDisposable
{
    Task PublishSocialEventAsync(SocialEvent socialEvent);
    Task PublishGrokEventAsync(GrokEvent grokEvent);
    Task PublishMessageEventAsync(MessageEvent messageEvent);
    Task PublishKidSafetyEventAsync(KidSafetyEvent kidSafetyEvent);
    Task PublishSystemEventAsync(SystemEvent systemEvent);
}