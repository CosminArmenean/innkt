# Multi-stage Dockerfile for innkt.NeuroSpark (.NET 9.0 with Python AI)
# Stage 1: Build stage
FROM mcr.microsoft.com/dotnet/sdk:9.0 AS build

# Set working directory
WORKDIR /src

# Copy project files
COPY ["innkt.NeuroSpark.csproj", "./"]
COPY ["../innkt.Common/innkt.Common.csproj", "../innkt.Common/"]
COPY ["../innkt.KafkaCommunicationLibrary/innkt.KafkaCommunicationLibrary.csproj", "../innkt.KafkaCommunicationLibrary/"]

# Restore dependencies
RUN dotnet restore "innkt.NeuroSpark.csproj"

# Copy source code
COPY . .

# Build the application
RUN dotnet build "innkt.NeuroSpark.csproj" -c Release -o /app/build

# Stage 2: Publish stage
FROM build AS publish
RUN dotnet publish "innkt.NeuroSpark.csproj" -c Release -o /app/publish /p:UseAppHost=false

# Stage 3: Runtime stage with Python
FROM mcr.microsoft.com/dotnet/aspnet:9.0 AS final

# Install Python and system dependencies
RUN apt-get update && apt-get install -y \
    python3 \
    python3-pip \
    python3-venv \
    curl \
    wget \
    build-essential \
    libgl1-mesa-glx \
    libglib2.0-0 \
    libsm6 \
    libxext6 \
    libxrender-dev \
    libgomp1 \
    && rm -rf /var/lib/apt/lists/*

# Create Python virtual environment
RUN python3 -m venv /opt/venv
ENV PATH="/opt/venv/bin:$PATH"

# Copy Python requirements and install dependencies
COPY Scripts/requirements.txt /tmp/requirements.txt
RUN pip install --no-cache-dir -r /tmp/requirements.txt

# Copy Python scripts
COPY Scripts/ /app/scripts/
RUN chmod +x /app/scripts/*.py

# Create necessary directories
RUN mkdir -p /app/models /app/processed /app/logs /app/temp

# Set working directory
WORKDIR /app

# Create non-root user
RUN groupadd -r appuser && useradd -r -g appuser appuser

# Copy published application
COPY --from=publish /app/publish .

# Set ownership
RUN chown -R appuser:appuser /app

# Set environment variables
ENV ASPNETCORE_ENVIRONMENT=Production
ENV ASPNETCORE_URLS=http://+:8080
ENV DOTNET_RUNNING_IN_CONTAINER=true
ENV DOTNET_USE_POLLING_FILE_WATCHER=true
ENV PYTHONPATH=/app/scripts
ENV PYTHONUNBUFFERED=1

# Expose port
EXPOSE 8080

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
    CMD curl -f http://localhost:8080/health || exit 1

# Switch to non-root user
USER appuser

# Start the application
ENTRYPOINT ["dotnet", "innkt.NeuroSpark.dll"]