# Build Stage
FROM mcr.microsoft.com/dotnet/sdk:8.0 AS build
WORKDIR /src

# Copy csproj and restore dependencies
COPY ["MyIonio.csproj", "./"]
RUN dotnet restore "MyIonio.csproj"

# Copy the rest of the code and build
COPY . .
RUN dotnet build "MyIonio.csproj" -c Release -o /app/build

# Publish Stage
FROM build AS publish
RUN dotnet publish "MyIonio.csproj" -c Release -o /app/publish /p:UseAppHost=false

# Final Stage
FROM mcr.microsoft.com/dotnet/aspnet:8.0 AS final
WORKDIR /app
RUN apt-get update && apt-get install -y curl && rm -rf /var/lib/apt/lists/*
COPY --from=publish /app/publish .

# Environment variables for production
ENV ASPNETCORE_ENVIRONMENT=Production
ENV ASPNETCORE_URLS=http://+:80

EXPOSE 80

ENTRYPOINT ["dotnet", "MyIonio.dll"]
