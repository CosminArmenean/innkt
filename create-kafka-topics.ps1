Write-Host "Creating Kafka topics for innkt platform..." -ForegroundColor Yellow

# Kafka topics for the innkt platform
$topics = @(
    "user-registration",
    "user-profile-update", 
    "post-created",
    "post-liked",
    "post-shared",
    "user-followed",
    "user-unfollowed",
    "message-sent",
    "notification-created",
    "group-created",
    "group-joined",
    "group-left"
)

Write-Host "Creating topics..." -ForegroundColor Cyan

foreach ($topic in $topics) {
    try {
        Write-Host "Creating topic: $topic" -ForegroundColor Yellow
        
        # Create topic using Kafka container
        $result = docker exec innkt-kafka kafka-topics --create --topic $topic --bootstrap-server localhost:9092 --partitions 3 --replication-factor 1 --if-not-exists
        
        if ($LASTEXITCODE -eq 0) {
            Write-Host "✓ Topic '$topic' created successfully" -ForegroundColor Green
        } else {
            Write-Host "⚠ Topic '$topic' might already exist or failed to create" -ForegroundColor Yellow
        }
    } catch {
        Write-Host "✗ Failed to create topic '$topic': $($_.Exception.Message)" -ForegroundColor Red
    }
}

Write-Host ""
Write-Host "Listing all topics..." -ForegroundColor Cyan

try {
    $listResult = docker exec innkt-kafka kafka-topics --list --bootstrap-server localhost:9092
    Write-Host "Available topics:" -ForegroundColor Green
    $listResult | ForEach-Object { Write-Host "  - $_" -ForegroundColor White }
} catch {
    Write-Host "Failed to list topics: $($_.Exception.Message)" -ForegroundColor Red
}

Write-Host ""
Write-Host "=== KAFKA TOPICS CREATION COMPLETE ===" -ForegroundColor Cyan
Write-Host "You can now check the Kafka UI at http://localhost:8080" -ForegroundColor Green
