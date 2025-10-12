# Script to add localization configuration to remaining .NET services
$services = @("Social", "Kinder", "Notification", "Neurospark", "Seer")

foreach ($service in $services) {
    Write-Host "Configuring $service service..." -ForegroundColor Cyan
    
    $programPath = "Backend/innkt.$service/Program.cs"
    
    if (-not (Test-Path $programPath)) {
        Write-Host "  Program.cs not found for $service" -ForegroundColor Yellow
        continue
    }
    
    $content = Get-Content $programPath -Raw
    
    # Check if already configured
    if ($content -match 'UseRequestLocalization') {
        Write-Host "  $service already configured" -ForegroundColor Yellow
        continue
    }
    
    Write-Host "  $service needs manual configuration" -ForegroundColor Yellow
}

Write-Host "`nDue to PowerShell encoding issues, please manually add the following to each service:" -ForegroundColor Cyan
Write-Host @"

1. Add after 'var builder = WebApplication.CreateBuilder(args);':

using Microsoft.Extensions.Localization;
using innkt.{ServiceName}.Services;

var resourcesPath = Path.Combine(Directory.GetCurrentDirectory(), "Resources");
builder.Services.AddSingleton<IStringLocalizerFactory>(sp => 
    new JsonStringLocalizerFactory(resourcesPath, sp.GetRequiredService<ILoggerFactory>()));

builder.Services.Configure<RequestLocalizationOptions>(options =>
{
    var supportedCultures = new[] { "en", "es", "fr", "de", "it", "pt", "nl", "pl", "cs", "hu", "ro" };
    options.SetDefaultCulture("en")
        .AddSupportedCultures(supportedCultures)
        .AddSupportedUICultures(supportedCultures);
    options.ApplyCurrentCultureToResponseHeaders = true;
});

2. Add before 'app.UseAuthentication()':

app.UseRequestLocalization();

"@
