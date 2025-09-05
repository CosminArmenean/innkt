# Simplified .NET 9 NeuroSpark Service Dockerfile
FROM mcr.microsoft.com/dotnet/aspnet:9.0 AS base
WORKDIR /app
EXPOSE 5002

# Build stage
FROM mcr.microsoft.com/dotnet/sdk:9.0 AS build
WORKDIR /src

# Copy project files
COPY ["innkt.NeuroSpark/innkt.NeuroSpark/innkt.NeuroSpark.csproj", "innkt.NeuroSpark/innkt.NeuroSpark/"]
COPY ["innkt.Common/innkt.Common.csproj", "innkt.Common/"]
COPY ["innkt.KafkaCommunicationLibrary/innkt.KafkaCommunicationLibrary.csproj", "innkt.KafkaCommunicationLibrary/"]

# Restore dependencies
RUN dotnet restore "innkt.NeuroSpark/innkt.NeuroSpark/innkt.NeuroSpark.csproj"

# Copy source code
COPY . .

# Build and publish in one step
RUN dotnet publish "innkt.NeuroSpark/innkt.NeuroSpark/innkt.NeuroSpark.csproj" -c Release -o /app/publish

# Final stage
FROM base AS final
WORKDIR /app

# Copy published application
COPY --from=build /app/publish .

# Run as root to avoid permission issues
ENTRYPOINT ["dotnet", "innkt.NeuroSpark.dll"]


