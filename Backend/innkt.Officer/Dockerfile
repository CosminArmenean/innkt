# Multi-stage Dockerfile for innkt.Officer (.NET 9.0)
# Stage 1: Build stage
FROM mcr.microsoft.com/dotnet/sdk:9.0 AS build

# Set working directory
WORKDIR /src

# Copy project files
COPY ["innkt.Officer/innkt.Officer.csproj", "./"]
COPY ["innkt.Common/innkt.Common.csproj", "innkt.Common/"]
COPY ["innkt.KafkaCommunicationLibrary/innkt.KafkaCommunicationLibrary.csproj", "innkt.KafkaCommunicationLibrary/"]
COPY ["innkt.StringLibrary/innkt.StringLibrary.csproj", "innkt.StringLibrary/"]
COPY ["innkt.Domain/innkt.Domain.csproj", "innkt.Domain/"]
COPY ["innkt.DataService/innkt.DataService.csproj", "innkt.DataService/"]

# Restore dependencies
RUN dotnet restore "innkt.Officer.csproj"

# Copy source code
COPY ["innkt.Officer/", "./"]
COPY ["innkt.Common/", "innkt.Common/"]
COPY ["innkt.KafkaCommunicationLibrary/", "innkt.KafkaCommunicationLibrary/"]
COPY ["innkt.StringLibrary/", "innkt.StringLibrary/"]
COPY ["innkt.Domain/", "innkt.Domain/"]
COPY ["innkt.DataService/", "innkt.DataService/"]

# Build the application
RUN dotnet build "innkt.Officer.csproj" -c Release -o /app/build

# Stage 2: Publish stage
FROM build AS publish
RUN dotnet publish "innkt.Officer.csproj" -c Release -o /app/publish /p:UseAppHost=false

# Stage 3: Runtime stage
FROM mcr.microsoft.com/dotnet/aspnet:9.0 AS final

# Set working directory
WORKDIR /app

# Install system dependencies
RUN apt-get update && apt-get install -y \
    curl \
    && rm -rf /var/lib/apt/lists/*

# Create non-root user
RUN groupadd -r appuser && useradd -r -g appuser appuser

# Copy published application
COPY --from=publish /app/publish .

# Create necessary directories
RUN mkdir -p /app/logs /app/uploads /app/temp && \
    chown -R appuser:appuser /app

# Set environment variables
ENV ASPNETCORE_ENVIRONMENT=Production
ENV ASPNETCORE_URLS=http://+:8080
ENV DOTNET_RUNNING_IN_CONTAINER=true
ENV DOTNET_USE_POLLING_FILE_WATCHER=true

# Expose port
EXPOSE 8080

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
    CMD curl -f http://localhost:8080/health || exit 1

# Switch to non-root user
USER appuser

# Start the application
ENTRYPOINT ["dotnet", "innkt.Officer.dll"]