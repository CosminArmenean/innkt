using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.Logging;

namespace innkt.Notifications.Services;

/// <summary>
/// Hosted service to manage the event consumer lifecycle
/// </summary>
public class EventConsumerHostedService : BackgroundService
{
    private readonly IServiceProvider _serviceProvider;
    private readonly ILogger<EventConsumerHostedService> _logger;

    public EventConsumerHostedService(
        IServiceProvider serviceProvider,
        ILogger<EventConsumerHostedService> logger)
    {
        _serviceProvider = serviceProvider;
        _logger = logger;
    }

    protected override async Task ExecuteAsync(CancellationToken stoppingToken)
    {
        _logger.LogInformation("🚀 Starting Event Consumer Hosted Service...");

        while (!stoppingToken.IsCancellationRequested)
        {
            try
            {
                using var scope = _serviceProvider.CreateScope();
                var eventConsumer = scope.ServiceProvider.GetRequiredService<IEventConsumer>();

                _logger.LogInformation("📡 Starting event consumer...");
                await eventConsumer.StartConsumingAsync();

                // Keep the service running
                await Task.Delay(Timeout.Infinite, stoppingToken);
            }
            catch (OperationCanceledException)
            {
                _logger.LogInformation("🛑 Event Consumer Hosted Service is stopping...");
                break;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "❌ Error in Event Consumer Hosted Service");
                
                // Wait before retrying
                await Task.Delay(5000, stoppingToken);
            }
        }

        _logger.LogInformation("✅ Event Consumer Hosted Service stopped");
    }

    public override async Task StopAsync(CancellationToken cancellationToken)
    {
        _logger.LogInformation("🛑 Stopping Event Consumer Hosted Service...");

        using var scope = _serviceProvider.CreateScope();
        var eventConsumer = scope.ServiceProvider.GetRequiredService<IEventConsumer>();
        await eventConsumer.StopConsumingAsync();

        await base.StopAsync(cancellationToken);
    }
}

