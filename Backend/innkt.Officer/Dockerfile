# Multi-stage build for .NET 9 Officer Service
FROM mcr.microsoft.com/dotnet/aspnet:9.0 AS base
WORKDIR /app
EXPOSE 5004
EXPOSE 5005

# Build stage
FROM mcr.microsoft.com/dotnet/sdk:9.0 AS build
WORKDIR /src

# Copy project files
COPY ["innkt.Officer.csproj", "./"]
COPY ["../innkt.Common/innkt.Common.csproj", "../innkt.Common/"]
COPY ["../innkt.KafkaCommunicationLibrary/innkt.KafkaCommunicationLibrary.csproj", "../innkt.KafkaCommunicationLibrary/"]

# Restore dependencies
RUN dotnet restore "innkt.Officer.csproj"
RUN dotnet restore "../innkt.Common/innkt.Common.csproj"
RUN dotnet restore "../innkt.KafkaCommunicationLibrary/innkt.KafkaCommunicationLibrary.csproj"

# Copy source code
COPY . .
COPY ["../innkt.Common/", "../innkt.Common/"]
COPY ["../innkt.KafkaCommunicationLibrary/", "../innkt.KafkaCommunicationLibrary/"]

# Build the application
RUN dotnet build "innkt.Officer.csproj" -c Release -o /app/build

# Publish stage
FROM build AS publish
RUN dotnet publish "innkt.Officer.csproj" -c Release -o /app/publish

# Final stage
FROM base AS final
WORKDIR /app

# Install curl for health checks
RUN apt-get update && apt-get install -y curl && rm -rf /var/lib/apt/lists/*

# Copy published application
COPY --from=publish /app/publish .

# Create non-root user
RUN adduser --disabled-password --gecos "" appuser && chown -R appuser /app
USER appuser

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=60s --retries=3 \
    CMD curl -f http://localhost:5004/health || exit 1

ENTRYPOINT ["dotnet", "innkt.Officer.dll"]


