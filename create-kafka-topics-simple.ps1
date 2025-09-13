Write-Host "Creating Kafka topics for innkt platform..." -ForegroundColor Yellow

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
    Write-Host "Creating topic: $topic" -ForegroundColor Yellow
    
    try {
        $result = docker exec innkt-kafka kafka-topics --create --topic $topic --bootstrap-server localhost:9092 --partitions 3 --replication-factor 1 --if-not-exists
        Write-Host "Topic $topic created" -ForegroundColor Green
    } catch {
        Write-Host "Failed to create topic $topic" -ForegroundColor Red
    }
}

Write-Host "Listing all topics..." -ForegroundColor Cyan
docker exec innkt-kafka kafka-topics --list --bootstrap-server localhost:9092

Write-Host "Kafka topics creation complete!" -ForegroundColor Green
Write-Host "Check Kafka UI at http://localhost:8080" -ForegroundColor Cyan
