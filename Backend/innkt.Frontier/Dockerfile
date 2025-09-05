# Simplified .NET 9 Frontier Service Dockerfile
FROM mcr.microsoft.com/dotnet/aspnet:9.0 AS base
WORKDIR /app
EXPOSE 5004

# Build stage
FROM mcr.microsoft.com/dotnet/sdk:9.0 AS build
WORKDIR /src

# Copy project files
COPY ["innkt.Frontier/innkt.Frontier.csproj", "innkt.Frontier/"]

# Restore dependencies
RUN dotnet restore "innkt.Frontier/innkt.Frontier.csproj"

# Copy source code
COPY . .

# Build and publish in one step
RUN dotnet publish "innkt.Frontier/innkt.Frontier.csproj" -c Release -o /app/publish

# Final stage
FROM base AS final
WORKDIR /app

# Copy published application
COPY --from=build /app/publish .

# Run as root to avoid permission issues
ENTRYPOINT ["dotnet", "innkt.Frontier.dll"]
