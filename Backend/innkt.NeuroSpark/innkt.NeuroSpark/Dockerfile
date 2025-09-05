# Working .NET 9 template using SDK for runtime (fixes dotnet command issue)
FROM mcr.microsoft.com/dotnet/sdk:9.0 AS base
WORKDIR /app
EXPOSE 5003

FROM mcr.microsoft.com/dotnet/sdk:9.0 AS build
ARG BUILD_CONFIGURATION=Release
WORKDIR /src
COPY ["innkt.NeuroSpark/innkt.NeuroSpark/innkt.NeuroSpark.csproj", "innkt.NeuroSpark/"]
COPY ["innkt.Common/innkt.Common.csproj", "innkt.Common/"]
COPY ["innkt.KafkaCommunicationLibrary/innkt.KafkaCommunicationLibrary.csproj", "innkt.KafkaCommunicationLibrary/"]
RUN dotnet restore "./innkt.NeuroSpark/innkt.NeuroSpark.csproj"
COPY . .
WORKDIR "/src/innkt.NeuroSpark/innkt.NeuroSpark"
RUN dotnet build "./innkt.NeuroSpark.csproj" -c $BUILD_CONFIGURATION -o /app/build

FROM build AS publish
ARG BUILD_CONFIGURATION=Release
WORKDIR "/src/innkt.NeuroSpark/innkt.NeuroSpark"
RUN dotnet publish "./innkt.NeuroSpark.csproj" -c $BUILD_CONFIGURATION -o /app/publish /p:UseAppHost=false

FROM base AS final
WORKDIR /app
COPY --from=publish /app/publish .
ENTRYPOINT ["dotnet", "innkt.NeuroSpark.dll"]
