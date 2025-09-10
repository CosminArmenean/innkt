FROM mcr.microsoft.com/dotnet/aspnet:9.0 AS base
WORKDIR /app
EXPOSE 8080

FROM mcr.microsoft.com/dotnet/sdk:9.0 AS build
WORKDIR /src
COPY ["innkt.Social.csproj", "."]
COPY ["../innkt.Common/innkt.Common.csproj", "../innkt.Common/"]
COPY ["../innkt.Domain/innkt.Domain.csproj", "../innkt.Domain/"]
COPY ["../innkt.KafkaCommunicationLibrary/innkt.KafkaCommunicationLibrary.csproj", "../innkt.KafkaCommunicationLibrary/"]
RUN dotnet restore "innkt.Social.csproj"
COPY . .
WORKDIR "/src"
RUN dotnet build "innkt.Social.csproj" -c Release -o /app/build

FROM build AS publish
RUN dotnet publish "innkt.Social.csproj" -c Release -o /app/publish

FROM base AS final
WORKDIR /app
COPY --from=publish /app/publish .
ENTRYPOINT ["dotnet", "innkt.Social.dll"]
