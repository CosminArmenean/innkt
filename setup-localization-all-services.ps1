# Script to setup localization for all remaining .NET services
$services = @("Social", "Kinder", "Notification", "Neurospark", "Seer")

foreach ($service in $services) {
    Write-Host "Setting up localization for $service service..." -ForegroundColor Cyan
    
    $servicePath = "Backend/innkt.$service"
    $servicesDir = "$servicePath/Services"
    $resourcesDir = "$servicePath/Resources"
    
    # Create Services directory if it does not exist
    if (-not (Test-Path $servicesDir)) {
        New-Item -ItemType Directory -Path $servicesDir -Force | Out-Null
    }
    
    # Create Resources directory if it does not exist
    if (-not (Test-Path $resourcesDir)) {
        New-Item -ItemType Directory -Path $resourcesDir -Force | Out-Null
    }
    
    # Copy localizer files
    Copy-Item "Backend/innkt.Officer/Services/JsonStringLocalizer.cs" -Destination $servicesDir -Force
    Copy-Item "Backend/innkt.Officer/Services/JsonStringLocalizerFactory.cs" -Destination $servicesDir -Force
    
    # Update namespace in copied files
    $localizerContent = Get-Content "$servicesDir/JsonStringLocalizer.cs" -Raw
    $localizerContent = $localizerContent -replace 'namespace innkt.Officer.Services;', "namespace innkt.$service.Services;"
    $localizerContent | Set-Content "$servicesDir/JsonStringLocalizer.cs" -NoNewline
    
    $factoryContent = Get-Content "$servicesDir/JsonStringLocalizerFactory.cs" -Raw
    $factoryContent = $factoryContent -replace 'namespace innkt.Officer.Services;', "namespace innkt.$service.Services;"
    $factoryContent | Set-Content "$servicesDir/JsonStringLocalizerFactory.cs" -NoNewline
    
    # Copy translation files (create basic ones if they do not exist)
    if (Test-Path "Backend/innkt.$service/Resources/en.json") {
        Write-Host "  Translation files already exist for $service" -ForegroundColor Yellow
    } else {
        # Create basic translation files
        $enContent = @'
{
  "common": {
    "save": "Save",
    "cancel": "Cancel",
    "delete": "Delete",
    "edit": "Edit",
    "loading": "Loading...",
    "error": "Error occurred",
    "success": "Success"
  },
  "service": {
    "error": "Service error occurred",
    "success": "Operation completed successfully"
  }
}
'@
        $enContent | Out-File -FilePath "$resourcesDir/en.json" -Encoding UTF8
        
        $esContent = @'
{
  "common": {
    "save": "Guardar",
    "cancel": "Cancelar",
    "delete": "Eliminar",
    "edit": "Editar",
    "loading": "Cargando...",
    "error": "Error ocurrido",
    "success": "Éxito"
  },
  "service": {
    "error": "Error del servicio",
    "success": "Operación completada exitosamente"
  }
}
'@
        $esContent | Out-File -FilePath "$resourcesDir/es.json" -Encoding UTF8
    }
    
    Write-Host "  Localization files copied for $service" -ForegroundColor Green
}

Write-Host ""
Write-Host "Localization setup complete for all services!" -ForegroundColor Green
Write-Host "Next steps:" -ForegroundColor Cyan
Write-Host "  1. Update each service Program.cs to register localization" -ForegroundColor White
Write-Host "  2. Add middleware for request localization" -ForegroundColor White
Write-Host "  3. Update controllers to use IStringLocalizer" -ForegroundColor White
