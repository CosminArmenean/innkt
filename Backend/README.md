# Innkt Backend Microservices

This directory contains the .NET 9 backend microservices for the Innkt social application.

## Architecture Overview

The backend follows a microservices architecture with the following components:

### Core Services

1. **innkt.Officer** (Port 5000)
   - Identity Server using Duende IdentityServer 7
   - User authentication and authorization
   - Support for normal and joint accounts
   - GDPR compliance features
   - MySQL database for user data

2. **innkt.Frontier** (Port 5002)
   - API Gateway using Ocelot
   - Route requests to appropriate microservices
   - JWT token validation
   - Rate limiting and caching

### Shared Libraries

3. **innkt.Common**
   - Base entities and common models
   - API response wrappers
   - Shared utilities

4. **innkt.Domain**
   - Domain models and DTOs
   - User, Role, and Permission models
   - Validation attributes

5. **innkt.DataService**
   - Data access layer
   - Entity Framework Core configurations
   - MongoDB integration for content

6. **innkt.KafkaCommunicationLibrary**
   - Kafka producer and consumer interfaces
   - Message serialization/deserialization
   - Inter-service communication

7. **innkt.LanguageService**
   - Internationalization support
   - Multi-language content management
   - RTL layout support

8. **innkt.Kafka.Consumer**
   - Background message processing
   - Event-driven architecture
   - Asynchronous task handling

## Key Features

### Identity Management
- **Normal Accounts**: Standard email/password authentication
- **Joint Accounts**: Single email with dual passwords for linked accounts
- **Profile Pictures**: Stored in MySQL with URL references
- **GDPR Compliance**: Granular consent management, data portability, right to be forgotten

### Security
- JWT-based authentication
- OAuth 2.0 / OpenID Connect
- Role-based access control (RBAC)
- Secure password policies

### Multi-language Support
- English, Hebrew, Arabic
- RTL layout for Hebrew
- Theme support (Light/Dark/Auto)

### Infrastructure
- MySQL for identity data
- MongoDB for user content
- Redis for caching
- Apache Kafka for messaging
- Docker containerization

## Prerequisites

- .NET 9 SDK
- Docker and Docker Compose
- Visual Studio 2022 or VS Code

## Quick Start

### 1. Start Infrastructure Services

```bash
cd Backend
docker-compose up -d
```

This will start:
- MySQL (Port 3306)
- MongoDB (Port 27017)
- Redis (Port 6379)
- Kafka (Port 9092)
- Zookeeper (Port 2181)
- Kafka UI (Port 8080)
- phpMyAdmin (Port 8081)
- MongoDB Express (Port 8082)

### 2. Build the Solution

```bash
dotnet restore
dotnet build
```

### 3. Run the Services

#### Officer (Identity Server)
```bash
cd innkt.Officer
dotnet run
```

#### Frontier (API Gateway)
```bash
cd innkt.Frontier
dotnet run
```

## Configuration

### Database Connections
Update connection strings in `appsettings.json` files:

```json
{
  "ConnectionStrings": {
    "DefaultConnection": "Server=localhost;Database=innkt_officer;User=root;Password=password;",
    "ConfigurationConnection": "Server=localhost;Database=innkt_configuration;User=root;Password=password;",
    "PersistedGrantConnection": "Server=localhost;Database=innkt_persisted_grant;User=root;Password=password;",
    "Redis": "localhost:6379"
  }
}
```

### Kafka Configuration
```json
{
  "Kafka": {
    "BootstrapServers": "localhost:9092",
    "GroupId": "officer-service",
    "Topics": {
      "UserRegistration": "user-registration-topic",
      "UserProfileUpdate": "user-profile-update-topic"
    }
  }
}
```

## API Endpoints

### Officer Service (https://localhost:5000)
- `/.well-known/openid_configuration` - OpenID Connect discovery
- `/connect/authorize` - Authorization endpoint
- `/connect/token` - Token endpoint
- `/connect/userinfo` - User info endpoint
- `/connect/endsession` - End session endpoint

### Frontier Gateway (https://localhost:5002)
- `/api/*` - Proxied to backend services (requires authentication)
- `/connect/*` - Proxied to Officer service
- `/.well-known/*` - Proxied to Officer service

## Development

### Adding New Features
1. Create domain models in `innkt.Domain`
2. Add data access in `innkt.DataService`
3. Implement business logic using MediatR handlers
4. Add validation using FluentValidation
5. Create DTOs for API communication

### Database Migrations
```bash
cd innkt.Officer
dotnet ef migrations add InitialCreate
dotnet ef database update
```

### Testing
```bash
dotnet test
```

## Monitoring and Debugging

### Logs
- Serilog is configured for structured logging
- Logs are written to console and files in `logs/` directory
- Different log levels for different environments

### Health Checks
- Each service includes health check endpoints
- Monitor service status and dependencies

### Kafka Topics
- Use Kafka UI at http://localhost:8080 to monitor messages
- View topic configurations and consumer groups

## Deployment

### Production Considerations
- Use proper SSL certificates
- Configure production database connections
- Set up monitoring and alerting
- Implement proper backup strategies
- Use container orchestration (Kubernetes)

### Environment Variables
- Override configuration using environment variables
- Use secrets management for sensitive data
- Configure different settings per environment

## Troubleshooting

### Common Issues
1. **Port conflicts**: Ensure ports are not used by other services
2. **Database connection**: Verify MySQL/MongoDB are running and accessible
3. **Kafka connectivity**: Check Zookeeper and Kafka are healthy
4. **SSL certificates**: Use proper certificates for HTTPS

### Logs
Check service logs for detailed error information:
- Officer: `logs/officer-*.txt`
- Frontier: `logs/frontier-*.txt`

## Contributing

1. Follow the existing code structure
2. Use CQRS pattern with MediatR
3. Implement proper validation
4. Add unit tests for new features
5. Update documentation

## License

This project is part of the Innkt social application.





