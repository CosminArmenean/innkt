# Working .NET 9 template using SDK for runtime (fixes dotnet command issue)
FROM mcr.microsoft.com/dotnet/sdk:9.0 AS base
WORKDIR /app
EXPOSE 5001

FROM mcr.microsoft.com/dotnet/sdk:9.0 AS build
ARG BUILD_CONFIGURATION=Release
WORKDIR /src
COPY ["innkt.Officer/innkt.Officer.csproj", "innkt.Officer/"]
COPY ["innkt.Common/innkt.Common.csproj", "innkt.Common/"]
COPY ["innkt.KafkaCommunicationLibrary/innkt.KafkaCommunicationLibrary.csproj", "innkt.KafkaCommunicationLibrary/"]
RUN dotnet restore "./innkt.Officer/innkt.Officer.csproj"
COPY . .
WORKDIR "/src/innkt.Officer"
RUN dotnet build "./innkt.Officer.csproj" -c $BUILD_CONFIGURATION -o /app/build

FROM build AS publish
ARG BUILD_CONFIGURATION=Release
RUN dotnet publish "./innkt.Officer.csproj" -c $BUILD_CONFIGURATION -o /app/publish /p:UseAppHost=false

FROM base AS final
WORKDIR /app
COPY --from=publish /app/publish .
ENTRYPOINT ["dotnet", "innkt.Officer.dll"]


