namespace innkt.Social.Services;

/// <summary>
/// Hosted service to automatically start MongoDB Change Streams on application startup
/// </summary>
public class RealtimeHostedService : IHostedService
{
    private readonly IServiceProvider _serviceProvider;
    private readonly ILogger<RealtimeHostedService> _logger;

    public RealtimeHostedService(IServiceProvider serviceProvider, ILogger<RealtimeHostedService> logger)
    {
        _serviceProvider = serviceProvider;
        _logger = logger;
    }

    public async Task StartAsync(CancellationToken cancellationToken)
    {
        try
        {
            _logger.LogInformation("Starting Realtime Hosted Service");

            // Get the realtime service and start change streams
            var realtimeService = _serviceProvider.GetRequiredService<IRealtimeService>();
            
            // Start change streams in background
            _ = Task.Run(async () =>
            {
                try
                {
                    // Wait a bit for the application to fully start
                    await Task.Delay(5000, cancellationToken);
                    
                    if (!cancellationToken.IsCancellationRequested)
                    {
                        await realtimeService.StartChangeStreamsAsync();
                        _logger.LogInformation("MongoDB Change Streams started automatically");
                    }
                }
                catch (Exception ex)
                {
                    _logger.LogError(ex, "Failed to auto-start MongoDB Change Streams");
                }
            }, cancellationToken);

            _logger.LogInformation("Realtime Hosted Service started successfully");
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error starting Realtime Hosted Service");
        }
    }

    public async Task StopAsync(CancellationToken cancellationToken)
    {
        try
        {
            _logger.LogInformation("Stopping Realtime Hosted Service");

            var realtimeService = _serviceProvider.GetRequiredService<IRealtimeService>();
            await realtimeService.StopChangeStreamsAsync();

            _logger.LogInformation("Realtime Hosted Service stopped successfully");
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error stopping Realtime Hosted Service");
        }
    }
}
